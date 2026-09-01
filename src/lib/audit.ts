import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export const AUDIT_ACTIONS = {
  toggleAvailability: 'toggle_availability',
  createCategory: 'create_category',
  updateCategory: 'update_category',
  createItem: 'create_item',
  updateItem: 'update_item',
  deleteItem: 'delete_item',
  undoDeleteItem: 'undo_delete_item',
  createStaff: 'create_staff',
  updateStaff: 'update_staff',
  deactivateStaff: 'deactivate_staff',
  updateRestaurant: 'update_restaurant',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

// Actions that undoDeleteItem (src/lib/actions.ts) knows how to reverse — drives the "undo"
// button shown next to a log entry in the Settings change log.
export const UNDOABLE_ACTIONS: AuditAction[] = [AUDIT_ACTIONS.deleteItem]

export async function logAction(
  supabase: SupabaseClient,
  params: { actorId: string; action: AuditAction; entity: string; entityId?: string; payload?: Record<string, unknown> }
) {
  const { error } = await supabase.from('audit_log').insert({
    actor_id: params.actorId,
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId ?? null,
    payload: params.payload ?? null,
  })
  if (error) throw error
}
