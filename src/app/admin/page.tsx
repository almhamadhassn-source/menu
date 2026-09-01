import { redirect } from 'next/navigation'
import { PinPad } from '@/components/PinPad'
import { getStaffSession } from '@/lib/dal'

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const session = await getStaffSession()

  if (session) redirect('/admin/overview')

  return (
    <main className="admin-login">
      <div className="admin-login-hero">
        <span className="admin-login-kicker">STAFF CONTROL ROOM</span>
        <span className="admin-login-wordmark">Peshwazi</span>
        <span className="admin-login-arabic">بيشوازي</span>
        <div className="admin-login-rule" />
        <p className="admin-login-tagline">نظام إدارة المينيو المباشر — خاص بفريق العمل فقط.</p>
      </div>
      <div className="admin-login-card">
        <span className="admin-login-eyebrow">STAFF LOGIN</span>
        <PinPad hasError={Boolean(error)} />
      </div>
    </main>
  )
}
