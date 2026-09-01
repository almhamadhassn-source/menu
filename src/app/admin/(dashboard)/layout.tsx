import { AdminNav } from '@/components/AdminNav'
import { logout } from '@/lib/actions'
import { verifyStaff } from '@/lib/dal'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { session } = await verifyStaff()

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span>Peshwazi</span>
          <small>CONTROL ROOM</small>
        </div>
        <AdminNav isOwner={session.isOwner} canManageMenu={session.canManageMenu} />
        <div className="sidebar-bottom">
          <span className="online-dot" /> النظام يعمل بشكل طبيعي
        </div>
      </aside>
      <section className="admin-content">
        <header className="admin-header">
          <div>
            <span className="admin-kicker">PESHWAZI</span>
            <h1>مرحباً {session.displayName}</h1>
            <p>{session.isOwner ? 'مالك' : 'موظف'}</p>
          </div>
          <div className="admin-user">
            <button className="admin-avatar">{session.displayName.charAt(0).toUpperCase()}</button>
            <span>
              {session.displayName}
              <br />
              <small>{session.isOwner ? 'Owner account' : 'Staff account'}</small>
            </span>
            <form action={logout}>
              <button type="submit" className="outline-button">
                خروج
              </button>
            </form>
          </div>
        </header>
        {children}
      </section>
    </main>
  )
}
