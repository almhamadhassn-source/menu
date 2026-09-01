// Shared by src/lib/dal.ts (full JWT verification) and src/proxy.ts (presence-only optimistic
// check) — kept dependency-free so proxy's edge bundle doesn't pull in jose/crypto just to know
// the cookie's name.
export const STAFF_SESSION_COOKIE = 'peshwazi_staff_session'
