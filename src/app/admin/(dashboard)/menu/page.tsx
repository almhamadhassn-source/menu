import { redirect } from 'next/navigation'
import { MenuEditor } from '@/components/admin/MenuEditor'
import { canManageMenu, verifyStaff } from '@/lib/dal'
import { getEditorCategories, getEditorItems } from '@/lib/queries-server'

export default async function AdminMenuPage() {
  const { session } = await verifyStaff()
  if (!canManageMenu(session)) redirect('/admin/overview')

  const [categories, items] = await Promise.all([getEditorCategories(), getEditorItems()])

  return <MenuEditor categories={categories} items={items} />
}
