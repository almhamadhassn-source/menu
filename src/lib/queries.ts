import type { SupabaseClient } from '@supabase/supabase-js'
import type { Language, LocalizedText, MenuCategory, MenuItem, Restaurant } from './types'

// No 'server-only' / next-headers / service-role imports in this file on purpose — it's imported
// by the client component MenuExperience.tsx for its Realtime refetch (see queries-server.ts for
// the admin-only, always-server-side queries).

const LANGUAGES: Language[] = ['ar', 'ckb', 'en']

export function pickTranslations(rows: { lang: Language; [key: string]: unknown }[] | null, field: string): LocalizedText {
  const out = {} as LocalizedText
  for (const lang of LANGUAGES) {
    const row = rows?.find((entry) => entry.lang === lang)
    out[lang] = (row?.[field] as string) ?? ''
  }
  return out
}

function toRestaurant(row: {
  id: string
  slug: string
  name: LocalizedText
  theme_color: string
  logo_url: string | null
  video_url: string | null
}): Restaurant {
  return { id: row.id, slug: row.slug, name: row.name, themeColor: row.theme_color, logoUrl: row.logo_url, videoUrl: row.video_url }
}

// Accepts either the server or browser Supabase client so the same logic can run at initial
// page load (server) and on Realtime updates (browser) — see MenuExperience.tsx.
export async function getRestaurantBySlug(supabase: SupabaseClient, slug: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurant')
    .select('id, slug, name, theme_color, logo_url, video_url')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data ? toRestaurant(data) : null
}

export async function getRestaurantMenu(supabase: SupabaseClient): Promise<{ categories: MenuCategory[]; items: MenuItem[] }> {
  const { data: categoryRows, error: categoryError } = await supabase
    .from('categories')
    .select('id, sort_order, category_translations(lang, name)')
    .eq('is_active', true)
    .order('sort_order')
  if (categoryError) throw categoryError

  const { data: itemRows, error: itemError } = await supabase
    .from('items')
    .select('id, category_id, image_url, tags, sort_order, item_translations(lang, name, description), variants(price, currency)')
    .eq('is_active', true)
    .eq('is_available', true)
    .order('sort_order')
  if (itemError) throw itemError

  const items: MenuItem[] = (itemRows ?? []).flatMap((item) => {
    const variant = item.variants?.[0]
    if (!variant) return []
    return [{
      id: item.id,
      categoryId: item.category_id,
      image: item.image_url ?? '',
      name: pickTranslations(item.item_translations, 'name'),
      description: pickTranslations(item.item_translations, 'description'),
      price: Number(variant.price),
      currency: variant.currency,
      tag: item.tags?.[0] ?? null,
    }]
  })

  const categories: MenuCategory[] = (categoryRows ?? []).map((row) => ({ id: row.id, name: pickTranslations(row.category_translations, 'name') }))

  return { categories, items }
}
