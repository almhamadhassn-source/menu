import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { hashCode } from './pin'
import { mockFrom, store } from './mock-db'

const MOCK_UPLOAD_DIR = path.join(process.cwd(), 'public', 'mock-uploads')

// TEMPORARY mock storage for NEXT_PUBLIC_MOCK_DATA=1 (see mock-db.ts) — writes uploaded files to
// public/mock-uploads so they're served as real static files, no Supabase Storage needed.
function mockStorageFrom(_bucket: string) {
  return {
    async upload(filePath: string, file: File) {
      fs.mkdirSync(MOCK_UPLOAD_DIR, { recursive: true })
      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(path.join(MOCK_UPLOAD_DIR, path.basename(filePath)), buffer)
      return { error: null }
    },
    getPublicUrl(filePath: string) {
      return { data: { publicUrl: `/mock-uploads/${path.basename(filePath)}` } }
    },
  }
}

// One-time seed of the owner PIN in mock mode — kept out of mock-db.ts (which has no Node-only
// imports, since it's also loaded by the browser bundle via supabase-browser.ts) because hashCode
// needs Node's `crypto`. This file is already 'server-only', so it's safe here.
function ensureMockOwner() {
  if (store.staff.length > 0) return
  store.staff.push({
    id: 'mock-owner',
    is_owner: true,
    can_toggle_availability: false,
    can_manage_menu: false,
    display_name: 'المالك',
    code_hash: hashCode('1234'),
    is_active: true,
    created_at: new Date().toISOString(),
  })
}

function createMockServiceRoleClient() {
  ensureMockOwner()
  return {
    from: mockFrom,
    storage: { from: mockStorageFrom },
  } as unknown as SupabaseClient
}

// Bypasses RLS entirely — only ever call this from a Server Action, and only after
// src/lib/dal.ts has verified the caller's staff session. That check is the real
// authorization boundary now that staff don't use Supabase Auth (see supabase/schema.sql).
export function createSupabaseServiceRoleClient() {
  if (process.env.NEXT_PUBLIC_MOCK_DATA === '1') return createMockServiceRoleClient()

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
