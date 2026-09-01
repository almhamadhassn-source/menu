'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AUDIT_ACTIONS, logAction } from './audit'
import { clearStaffSession, createStaffSession, requireCanManageMenu, requireCanToggleAvailability, requireOwner, verifyStaff } from './dal'
import { hashCode } from './pin'
import { createSupabaseServiceRoleClient } from './supabase-admin'
import type { Language } from './types'

const MAX_STAFF_ACCOUNTS = 3

type LocalizedInput = Record<Language, string>

function extractLocalized(formData: FormData, prefix: string): LocalizedInput {
  return {
    ar: String(formData.get(`${prefix}_ar`) ?? '').trim(),
    ckb: String(formData.get(`${prefix}_ckb`) ?? '').trim(),
    en: String(formData.get(`${prefix}_en`) ?? '').trim(),
  }
}

// Uploads a chosen file (from a file picker) to the given public bucket and returns its URL, or
// null if the field was left empty — the caller falls back to whatever the record already had,
// since a file input can't be pre-filled.
async function uploadFile(supabase: ReturnType<typeof createSupabaseServiceRoleClient>, formData: FormData, field: string, bucket: string): Promise<string | null> {
  const file = formData.get(field)
  if (!(file instanceof File) || file.size === 0) return null

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type })
  if (error) throw error

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

const uploadItemImage = (supabase: ReturnType<typeof createSupabaseServiceRoleClient>, formData: FormData) => uploadFile(supabase, formData, 'image', 'menu-images')

export async function loginWithCode(formData: FormData) {
  const code = String(formData.get('code') ?? '').trim()
  if (!code) redirect('/admin?error=1')

  const supabase = createSupabaseServiceRoleClient()
  const { data: staff } = await supabase
    .from('staff')
    .select('id, display_name, is_owner, can_toggle_availability, can_manage_menu, is_active')
    .eq('code_hash', hashCode(code))
    .maybeSingle()

  if (!staff || !staff.is_active) redirect('/admin?error=1')

  await createStaffSession({
    staffId: staff.id,
    displayName: staff.display_name,
    isOwner: staff.is_owner,
    canToggleAvailability: staff.can_toggle_availability,
    canManageMenu: staff.can_manage_menu,
  })

  redirect('/admin/overview')
}

export async function logout() {
  await clearStaffSession()
  redirect('/admin')
}

export async function updateRestaurant(formData: FormData) {
  const { session } = await verifyStaff()
  requireOwner(session)

  const slug = String(formData.get('slug') ?? '').trim().toLowerCase()
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('رابط المينيو يجب أن يكون بحروف إنكليزية صغيرة وأرقام وشرطات فقط')

  const name = extractLocalized(formData, 'name')
  const themeColor = String(formData.get('themeColor') ?? '').trim()
  const supabase = createSupabaseServiceRoleClient()
  const logo = await uploadFile(supabase, formData, 'logo', 'branch-assets')
  const video = await uploadFile(supabase, formData, 'video', 'branch-assets')

  const { data: restaurant, error: fetchError } = await supabase.from('restaurant').select('id').limit(1).single()
  if (fetchError) throw fetchError

  const update: Record<string, unknown> = { slug, name, theme_color: themeColor }
  if (logo) update.logo_url = logo
  if (video) update.video_url = video

  const { error } = await supabase.from('restaurant').update(update).eq('id', restaurant.id)
  if (error) throw error

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.updateRestaurant, entity: 'restaurant', entityId: restaurant.id, payload: { name, slug } })
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
}

export async function toggleAvailability(itemId: string, nextValue: boolean) {
  const { session } = await verifyStaff()
  requireCanToggleAvailability(session)
  const supabase = createSupabaseServiceRoleClient()

  const { error } = await supabase.from('items').update({ is_available: nextValue }).eq('id', itemId)
  if (error) throw error

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.toggleAvailability, entity: 'item', entityId: itemId, payload: { isAvailable: nextValue } })
  revalidatePath('/admin/overview')
  revalidatePath('/', 'layout')
}

export async function createCategory(formData: FormData) {
  const { session } = await verifyStaff()
  requireCanManageMenu(session)
  const name = extractLocalized(formData, 'name')
  const supabase = createSupabaseServiceRoleClient()

  const { data: category, error } = await supabase.from('categories').insert({ sort_order: 0 }).select('id').single()
  if (error) throw error

  const { error: translationError } = await supabase
    .from('category_translations')
    .insert((Object.keys(name) as Language[]).map((lang) => ({ category_id: category.id, lang, name: name[lang] })))
  if (translationError) throw translationError

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.createCategory, entity: 'category', entityId: category.id, payload: { name } })
  revalidatePath('/admin/menu')
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const { session } = await verifyStaff()
  requireCanManageMenu(session)
  const name = extractLocalized(formData, 'name')
  const supabase = createSupabaseServiceRoleClient()

  for (const lang of Object.keys(name) as Language[]) {
    const { error } = await supabase.from('category_translations').upsert({ category_id: categoryId, lang, name: name[lang] })
    if (error) throw error
  }

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.updateCategory, entity: 'category', entityId: categoryId, payload: { name } })
  revalidatePath('/admin/menu')
}

export async function createItem(categoryId: string, formData: FormData) {
  const { session } = await verifyStaff()
  requireCanManageMenu(session)
  const name = extractLocalized(formData, 'name')
  const description = extractLocalized(formData, 'description')
  const price = Number(formData.get('price') ?? 0)
  const tag = String(formData.get('tag') ?? '').trim()
  const supabase = createSupabaseServiceRoleClient()
  const image = await uploadItemImage(supabase, formData)

  const { data: item, error: itemError } = await supabase
    .from('items')
    .insert({ category_id: categoryId, image_url: image, tags: tag ? [tag] : [] })
    .select('id')
    .single()
  if (itemError) throw itemError

  const { error: translationError } = await supabase
    .from('item_translations')
    .insert((Object.keys(name) as Language[]).map((lang) => ({ item_id: item.id, lang, name: name[lang], description: description[lang] })))
  if (translationError) throw translationError

  const { error: variantError } = await supabase.from('variants').insert({ item_id: item.id, label_key: 'regular', price })
  if (variantError) throw variantError

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.createItem, entity: 'item', entityId: item.id, payload: { name, price } })
  revalidatePath('/admin/menu')
  revalidatePath('/', 'layout')
}

export async function updateItem(itemId: string, formData: FormData) {
  const { session } = await verifyStaff()
  requireCanManageMenu(session)
  const name = extractLocalized(formData, 'name')
  const description = extractLocalized(formData, 'description')
  const price = Number(formData.get('price') ?? 0)
  const tag = String(formData.get('tag') ?? '').trim()
  const supabase = createSupabaseServiceRoleClient()
  const image = await uploadItemImage(supabase, formData)

  // No new file chosen (a file input can't be pre-filled) — leave image_url as it is.
  const itemUpdate: Record<string, unknown> = { tags: tag ? [tag] : [] }
  if (image) itemUpdate.image_url = image

  const { error: itemError } = await supabase.from('items').update(itemUpdate).eq('id', itemId)
  if (itemError) throw itemError

  for (const lang of Object.keys(name) as Language[]) {
    const { error } = await supabase.from('item_translations').upsert({ item_id: itemId, lang, name: name[lang], description: description[lang] })
    if (error) throw error
  }

  const { error: variantError } = await supabase.from('variants').update({ price }).eq('item_id', itemId).eq('label_key', 'regular')
  if (variantError) throw variantError

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.updateItem, entity: 'item', entityId: itemId, payload: { name, price } })
  revalidatePath('/admin/menu')
  revalidatePath('/', 'layout')
}

export async function deleteItem(itemId: string) {
  const { session } = await verifyStaff()
  requireCanManageMenu(session)
  const supabase = createSupabaseServiceRoleClient()

  const { error } = await supabase.from('items').update({ is_active: false }).eq('id', itemId)
  if (error) throw error

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.deleteItem, entity: 'item', entityId: itemId })
  revalidatePath('/admin/menu')
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
}

export async function undoDeleteItem(itemId: string) {
  const { session } = await verifyStaff()
  requireCanManageMenu(session)
  const supabase = createSupabaseServiceRoleClient()

  const { error } = await supabase.from('items').update({ is_active: true }).eq('id', itemId)
  if (error) throw error

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.undoDeleteItem, entity: 'item', entityId: itemId })
  revalidatePath('/admin/menu')
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
}

export async function createStaff(formData: FormData) {
  const { session } = await verifyStaff()
  requireOwner(session)

  const displayName = String(formData.get('displayName') ?? '').trim()
  const pin = String(formData.get('pin') ?? '').trim()
  const canToggle = formData.get('canToggleAvailability') === 'on'
  const canManage = formData.get('canManageMenu') === 'on'
  if (!displayName || !pin) throw new Error('الاسم والكود مطلوبان')

  const supabase = createSupabaseServiceRoleClient()

  const { count, error: countError } = await supabase.from('staff').select('id', { count: 'exact', head: true }).eq('is_active', true)
  if (countError) throw countError
  if ((count ?? 0) >= MAX_STAFF_ACCOUNTS) throw new Error(`الحد الأقصى ${MAX_STAFF_ACCOUNTS} حسابات — عطّل حساباً قديماً أولاً لإضافة حساب جديد`)

  const { data: staff, error } = await supabase
    .from('staff')
    .insert({ display_name: displayName, code_hash: hashCode(pin), can_toggle_availability: canToggle, can_manage_menu: canManage })
    .select('id')
    .single()
  if (error) throw error

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.createStaff, entity: 'staff', entityId: staff.id, payload: { displayName, canToggle, canManage } })
  revalidatePath('/admin/settings')
}

export async function updateStaff(staffId: string, formData: FormData) {
  const { session } = await verifyStaff()
  requireOwner(session)

  const displayName = String(formData.get('displayName') ?? '').trim()
  const pin = String(formData.get('pin') ?? '').trim()
  const canToggle = formData.get('canToggleAvailability') === 'on'
  const canManage = formData.get('canManageMenu') === 'on'
  const supabase = createSupabaseServiceRoleClient()

  const update: Record<string, unknown> = { display_name: displayName, can_toggle_availability: canToggle, can_manage_menu: canManage }
  if (pin) update.code_hash = hashCode(pin)

  const { error } = await supabase.from('staff').update(update).eq('id', staffId).eq('is_owner', false)
  if (error) throw error

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.updateStaff, entity: 'staff', entityId: staffId, payload: { displayName, canToggle, canManage } })
  revalidatePath('/admin/settings')
}

export async function deactivateStaff(staffId: string) {
  const { session } = await verifyStaff()
  requireOwner(session)
  const supabase = createSupabaseServiceRoleClient()

  // .eq('is_owner', false) guards against ever locking the account out by deactivating the owner
  // — is_owner is never exposed on the staff form, so this can only happen via a raw call.
  const { error } = await supabase.from('staff').update({ is_active: false }).eq('id', staffId).eq('is_owner', false)
  if (error) throw error

  await logAction(supabase, { actorId: session.staffId, action: AUDIT_ACTIONS.deactivateStaff, entity: 'staff', entityId: staffId })
  revalidatePath('/admin/settings')
}
