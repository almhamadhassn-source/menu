import 'server-only'
import { UNDOABLE_ACTIONS } from './audit'
import { pickTranslations } from './queries'
import { createSupabaseServiceRoleClient } from './supabase-admin'
import { createSupabaseServerClient } from './supabase'
import type { AdminItem, AuditLogEntry, EditorCategory, EditorItem, Language, LocalizedText, Restaurant, StaffMember } from './types'

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

export async function getRestaurant(): Promise<Restaurant | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('restaurant').select('id, slug, name, theme_color, logo_url, video_url').maybeSingle()
  if (error) throw error
  return data ? toRestaurant(data) : null
}

type AdminItemRow = {
  id: string
  image_url: string | null
  tags: string[]
  is_active: boolean
  is_available: boolean
  item_translations: { lang: Language; name: string }[]
}

// Admin-facing reads/writes use the service-role client (bypasses RLS) because staff no longer
// authenticate via Supabase Auth — see src/lib/dal.ts. The public RLS policy on `items` only
// allows is_available=true rows through, so a staff member could never see (and re-enable) an
// item they'd hidden if this went through the anon key instead.
export async function getAdminItems(): Promise<AdminItem[]> {
  const supabase = createSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('items')
    .select('id, image_url, tags, is_active, is_available, item_translations(lang, name)')
    .eq('is_active', true)
  if (error) throw error

  const rows = (data ?? []) as unknown as AdminItemRow[]

  return rows.map((row) => ({
    id: row.id,
    name: pickTranslations(row.item_translations, 'name'),
    image: row.image_url ?? '',
    tag: row.tags?.[0] ?? null,
    isAvailable: row.is_available,
  }))
}

export async function getEditorCategories(): Promise<EditorCategory[]> {
  const supabase = createSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, sort_order, category_translations(lang, name)')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((row) => ({ id: row.id, name: pickTranslations(row.category_translations, 'name'), sortOrder: row.sort_order }))
}

export async function getEditorItems(): Promise<EditorItem[]> {
  const supabase = createSupabaseServiceRoleClient()
  const { data: itemRows, error: itemError } = await supabase
    .from('items')
    .select('id, category_id, image_url, tags, sort_order, item_translations(lang, name, description), variants(price, currency)')
    .eq('is_active', true)
    .order('sort_order')
  if (itemError) throw itemError

  return (itemRows ?? []).flatMap((item) => {
    const variant = item.variants?.[0]
    if (!variant) return []
    return [{
      id: item.id,
      categoryId: item.category_id,
      name: pickTranslations(item.item_translations, 'name'),
      description: pickTranslations(item.item_translations, 'description'),
      image: item.image_url ?? '',
      tag: item.tags?.[0] ?? null,
      price: Number(variant.price),
      currency: variant.currency,
      isActive: true,
    }]
  })
}

export async function getStaffList(): Promise<StaffMember[]> {
  const supabase = createSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('staff')
    .select('id, display_name, is_owner, can_toggle_availability, can_manage_menu, is_active')
    .order('created_at')
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    isOwner: row.is_owner,
    canToggleAvailability: row.can_toggle_availability,
    canManageMenu: row.can_manage_menu,
    isActive: row.is_active,
  }))
}

type AuditLogRow = { id: number; action: string; entity: string; entity_id: string | null; created_at: string; staff: { display_name: string } | null }

export async function getAuditLog(limit = 50): Promise<AuditLogEntry[]> {
  const supabase = createSupabaseServiceRoleClient()
  const { data, error } = await supabase
    .from('audit_log')
    .select('id, action, entity, entity_id, created_at, staff:actor_id(display_name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error

  const rows = (data ?? []) as unknown as AuditLogRow[]
  return rows.map((row) => ({
    id: row.id,
    actorName: row.staff?.display_name ?? null,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    createdAt: row.created_at,
    canUndo: (UNDOABLE_ACTIONS as string[]).includes(row.action),
  }))
}
