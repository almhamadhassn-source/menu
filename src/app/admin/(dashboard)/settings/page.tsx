import { redirect } from 'next/navigation'
import { SettingsPanel } from '@/components/admin/SettingsPanel'
import { verifyStaff } from '@/lib/dal'
import { getAuditLog, getRestaurant, getStaffList } from '@/lib/queries-server'

export default async function AdminSettingsPage() {
  const { session } = await verifyStaff()
  if (!session.isOwner) redirect('/admin/overview')

  const [staff, auditLog, restaurant] = await Promise.all([getStaffList(), getAuditLog(), getRestaurant()])
  if (!restaurant) redirect('/admin/overview')

  return <SettingsPanel staff={staff} auditLog={auditLog} restaurant={restaurant} />
}
