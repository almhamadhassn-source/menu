import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { mockFrom } from './mock-db'

export async function createSupabaseServerClient() {
  if (process.env.NEXT_PUBLIC_MOCK_DATA === '1') return { from: mockFrom } as unknown as SupabaseClient

  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // called from a Server Component render; the proxy refreshes the session cookie instead
        }
      },
    },
  })
}
