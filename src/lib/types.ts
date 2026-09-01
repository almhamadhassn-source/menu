export type Language = 'ar' | 'ckb' | 'en'

export type LocalizedText = Record<Language, string>

export type Restaurant = {
  id: string
  slug: string
  name: LocalizedText
  themeColor: string
  logoUrl: string | null
  videoUrl: string | null
}

export type MenuCategory = {
  id: string
  name: LocalizedText
}

export type MenuItem = {
  id: string
  categoryId: string
  image: string
  name: LocalizedText
  description: LocalizedText
  price: number
  currency: string
  tag: string | null
}

export type AdminItem = {
  id: string
  name: LocalizedText
  image: string
  tag: string | null
  isAvailable: boolean
}

export type StaffSession = {
  staffId: string
  displayName: string
  isOwner: boolean
  canToggleAvailability: boolean
  canManageMenu: boolean
}

export type StaffMember = {
  id: string
  displayName: string
  isOwner: boolean
  canToggleAvailability: boolean
  canManageMenu: boolean
  isActive: boolean
}

export type AuditLogEntry = {
  id: number
  actorName: string | null
  action: string
  entity: string
  entityId: string | null
  createdAt: string
  canUndo: boolean
}

export type EditorCategory = {
  id: string
  name: LocalizedText
  sortOrder: number
}

export type EditorItem = {
  id: string
  categoryId: string
  name: LocalizedText
  description: LocalizedText
  image: string
  tag: string | null
  price: number
  currency: string
  isActive: boolean
}
