import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { mockFrom } from './mock-db'

// TEMPORARY: in mock mode there's no real Postgres, so there are no Realtime events either —
// `.channel(...).on(...).subscribe()` just needs to not throw. MenuExperience.tsx's live refetch
// simply never fires, which is fine: the customer menu still renders its initial server data.
function createMockBrowserClient() {
  const channel = { on: () => channel, subscribe: () => channel }
  return { from: mockFrom, channel: () => channel, removeChannel: () => {} } as unknown as SupabaseClient
}

// Kept separate from supabase.ts on purpose: that file imports next/headers (server-only), and
// this one is imported by the client component MenuExperience.tsx for its Realtime subscription.
export function createSupabaseBrowserClient() {
  if (process.env.NEXT_PUBLIC_MOCK_DATA === '1') return createMockBrowserClient()

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
