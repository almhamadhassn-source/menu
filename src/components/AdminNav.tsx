'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminNav({ isOwner, canManageMenu }: { isOwner: boolean; canManageMenu: boolean }) {
  const pathname = usePathname()
  const links = [
    { href: '/admin/overview', label: 'نظرة عامة', icon: '◈' },
    ...(isOwner || canManageMenu ? [{ href: '/admin/menu', label: 'تعديل المينيو', icon: '◫' }] : []),
    ...(isOwner ? [{ href: '/admin/settings', label: 'الإعدادات', icon: '⚙' }] : []),
  ]

  return (
    <nav>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={pathname === link.href ? 'selected' : ''}>
          {link.icon} <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  )
}
