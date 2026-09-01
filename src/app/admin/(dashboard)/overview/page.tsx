import { OverviewPanel } from '@/components/admin/OverviewPanel'
import { canToggleAvailability, verifyStaff } from '@/lib/dal'
import { getAdminItems } from '@/lib/queries-server'

export default async function AdminOverviewPage() {
  const { session } = await verifyStaff()
  const items = await getAdminItems()

  return <OverviewPanel items={items} canToggle={canToggleAvailability(session)} />
}
