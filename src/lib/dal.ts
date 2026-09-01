import 'server-only'
import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { STAFF_SESSION_COOKIE } from './session-cookie'
import type { StaffSession } from './types'

const SESSION_DURATION_SECONDS = 60 * 60 * 12 // a shift

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function createStaffSession(session: StaffSession) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey())

  const cookieStore = await cookies()
  cookieStore.set(STAFF_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  })
}

export async function clearStaffSession() {
  const cookieStore = await cookies()
  cookieStore.delete(STAFF_SESSION_COOKIE)
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(STAFF_SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return {
      staffId: payload.staffId as string,
      displayName: payload.displayName as string,
      isOwner: payload.isOwner as boolean,
      canToggleAvailability: payload.canToggleAvailability as boolean,
      canManageMenu: payload.canManageMenu as boolean,
    }
  } catch {
    return null
  }
}

export async function verifyStaff(): Promise<{ session: StaffSession }> {
  const session = await getStaffSession()
  if (!session) redirect('/admin')
  return { session }
}

// The owner always has every permission — these two flags only matter for delegating a slice of
// that access to the up-to-2 non-owner staff rows (see supabase/schema.sql).
export function canToggleAvailability(session: StaffSession) {
  return session.isOwner || session.canToggleAvailability || session.canManageMenu
}

export function canManageMenu(session: StaffSession) {
  return session.isOwner || session.canManageMenu
}

export function requireOwner(session: StaffSession) {
  if (!session.isOwner) throw new Error('هذا الإجراء يحتاج صلاحية المالك')
}

export function requireCanManageMenu(session: StaffSession) {
  if (!canManageMenu(session)) throw new Error('ليس لديك صلاحية تعديل المينيو')
}

export function requireCanToggleAvailability(session: StaffSession) {
  if (!canToggleAvailability(session)) throw new Error('ليس لديك صلاحية تغيير توفر الأصناف')
}
