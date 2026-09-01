'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { createStaff, deactivateStaff, undoDeleteItem, updateRestaurant } from '@/lib/actions'
import type { AuditLogEntry, Language, LocalizedText, Restaurant, StaffMember } from '@/lib/types'

type Tab = 'permissions' | 'log' | 'qr' | 'restaurant'

const MAX_STAFF_ACCOUNTS = 3
const LANG_LABELS: Record<Language, string> = { ar: 'عربي', ckb: 'كوردي', en: 'English' }
const LANGS: Language[] = ['ar', 'ckb', 'en']

const ACTION_LABELS: Record<string, string> = {
  toggle_availability: 'تغيير توفر صنف',
  create_category: 'إضافة غروب',
  update_category: 'تعديل غروب',
  create_item: 'إضافة صنف',
  update_item: 'تعديل صنف',
  delete_item: 'حذف صنف',
  undo_delete_item: 'تراجع عن حذف صنف',
  create_staff: 'إضافة حساب',
  update_staff: 'تعديل حساب',
  deactivate_staff: 'تعطيل حساب',
  update_restaurant: 'تعديل بيانات المطعم',
}

export function SettingsPanel({
  staff,
  auditLog,
  restaurant,
}: {
  staff: StaffMember[]
  auditLog: AuditLogEntry[]
  restaurant: Restaurant
}) {
  const [tab, setTab] = useState<Tab>('permissions')

  return (
    <>
      <section className="admin-toolbar">
        <div>
          <span className="admin-kicker">SETTINGS</span>
          <h2>الإعدادات</h2>
        </div>
      </section>

      <div className="settings-tabs">
        <button className={tab === 'permissions' ? 'active' : ''} onClick={() => setTab('permissions')}>
          صلاحيات الدخول
        </button>
        <button className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>
          سجل التغييرات
        </button>
        <button className={tab === 'qr' ? 'active' : ''} onClick={() => setTab('qr')}>
          رمز QR
        </button>
        <button className={tab === 'restaurant' ? 'active' : ''} onClick={() => setTab('restaurant')}>
          بيانات المطعم
        </button>
      </div>

      {tab === 'permissions' && <PermissionsSection staff={staff} />}
      {tab === 'log' && <AuditLogSection entries={auditLog} />}
      {tab === 'qr' && <QrCodeSection slug={restaurant.slug} />}
      {tab === 'restaurant' && <RestaurantSection restaurant={restaurant} />}
    </>
  )
}

function PermissionsSection({ staff }: { staff: StaffMember[] }) {
  const activeCount = staff.filter((member) => member.isActive).length
  const atCap = activeCount >= MAX_STAFF_ACCOUNTS
  const owner = staff.find((member) => member.isOwner)
  const others = staff.filter((member) => !member.isOwner)

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <span className="admin-kicker">ACCESS</span>
          <h3>صلاحيات الدخول</h3>
        </div>
      </div>
      <p className="panel-note">
        الحد الأقصى {MAX_STAFF_ACCOUNTS} حسابات دخول ({activeCount}/{MAX_STAFF_ACCOUNTS} نشطة الآن). صلاحيتا "توفر الأصناف" و"إدارة المينيو" مستقلتان — فعّل ما يناسب كل حساب.
      </p>
      {atCap ? (
        <p className="panel-note qr-warning">⚠ وصلت للحد الأقصى — عطّل حساباً قديماً لإضافة حساب جديد.</p>
      ) : (
        <form action={createStaff} className="staff-form">
          <input name="displayName" placeholder="الاسم" required />
          <input name="pin" placeholder="كود PIN" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required />
          <label className="checkbox-field">
            <input type="checkbox" name="canToggleAvailability" />
            إخفاء/إظهار الأصناف بسرعة
          </label>
          <label className="checkbox-field">
            <input type="checkbox" name="canManageMenu" />
            إضافة وتعديل وحذف الأصناف والأسعار
          </label>
          <button type="submit">+ إضافة</button>
        </form>
      )}
      <div className="admin-list">
        {owner && (
          <article className="admin-item staff-row" key={owner.id}>
            <div className="admin-item-copy">
              <span>مالك</span>
              <h3>{owner.displayName}</h3>
              <p>صلاحية كاملة على كل شيء</p>
            </div>
          </article>
        )}
        {others.map((member) => (
          <article className="admin-item staff-row" key={member.id}>
            <div className="admin-item-copy">
              <span>
                {[member.canToggleAvailability && 'توفر الأصناف', member.canManageMenu && 'إدارة المينيو'].filter(Boolean).join(' + ') || 'بدون صلاحيات'}
              </span>
              <h3>{member.displayName}</h3>
              {!member.isActive && <p>معطّل</p>}
            </div>
            {member.isActive && (
              <form action={deactivateStaff.bind(null, member.id)}>
                <button type="submit" className="outline-button">
                  تعطيل
                </button>
              </form>
            )}
          </article>
        ))}
        {others.length === 0 && <p className="panel-note">لا يوجد حسابات إضافية بعد.</p>}
      </div>
    </section>
  )
}

function AuditLogSection({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <span className="admin-kicker">HISTORY</span>
          <h3>سجل التغييرات</h3>
        </div>
      </div>
      <p className="panel-note">التراجع متاح فقط على عمليات الحذف — سجل التغييرات نفسه لا يُعدّل، حفاظاً على وضوح المسؤولية.</p>
      <div className="audit-list">
        {entries.map((entry) => (
          <article className="audit-row" key={entry.id}>
            <div>
              <strong>{ACTION_LABELS[entry.action] ?? entry.action}</strong>
              <p>
                {entry.actorName ?? 'غير معروف'} · {new Date(entry.createdAt).toLocaleString('ar-IQ')}
              </p>
            </div>
            {entry.canUndo && entry.entityId && (
              <form action={undoDeleteItem.bind(null, entry.entityId)}>
                <button type="submit" className="outline-button">
                  تراجع ↺
                </button>
              </form>
            )}
          </article>
        ))}
        {entries.length === 0 && <p className="panel-note">لا توجد تغييرات مسجلة بعد.</p>}
      </div>
    </section>
  )
}

function QrCodeSection({ slug }: { slug: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [menuUrl, setMenuUrl] = useState('')

  useEffect(() => {
    const url = `${window.location.origin}/${slug}`
    setMenuUrl(url)
    QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: '#2b0b15', light: '#faf3e8' } }).then(setDataUrl)
  }, [slug])

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <span className="admin-kicker">STATIC LINK</span>
          <h3>رمز QR للمينيو</h3>
        </div>
      </div>
      <p className="panel-note qr-warning">
        ⚠ هذا الرابط يُطبع على الطاولات والملصقات — لا تغيّر رابط المينيو (من تبويب "بيانات المطعم") بعد الطباعة، لأن أي تغيير يُبطل كل النسخ المطبوعة سابقاً.
      </p>
      {dataUrl && (
        <div className="qr-display">
          <img src={dataUrl} alt="QR" width={180} height={180} />
          <div>
            <p className="panel-note">{menuUrl}</p>
            <a className="outline-button" href={dataUrl} download={`peshwazi-menu-qr.png`}>
              تنزيل QR ↓
            </a>
          </div>
        </div>
      )}
    </section>
  )
}

function RestaurantSection({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant.logoUrl ?? null)
  const [videoName, setVideoName] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <span className="admin-kicker">IDENTITY</span>
          <h3>بيانات المطعم</h3>
        </div>
      </div>
      <p className="panel-note">الاسم واللون والشعار والفيديو يظهرون فوراً بالمينيو عند الزبون.</p>
      <form
        action={async (formData) => {
          setPending(true)
          await updateRestaurant(formData)
          setPending(false)
          router.refresh()
        }}
        className="editor-form"
      >
        <label>
          رابط المينيو (بالإنكليزي)
          <input name="slug" defaultValue={restaurant.slug} placeholder="peshwazi" pattern="[a-z0-9-]+" title="حروف إنكليزية صغيرة وأرقام وشرطات فقط" required />
        </label>
        <p className="panel-note qr-warning">⚠ تغيير هذا الرابط يُبطل أي QR مطبوع سابقاً.</p>
        {LANGS.map((lang) => (
          <label key={`name_${lang}`}>
            اسم المطعم ({LANG_LABELS[lang]})
            <input name={`name_${lang}`} defaultValue={restaurant.name[lang]} required />
          </label>
        ))}
        <label>
          لون العلامة
          <input name="themeColor" type="color" defaultValue={restaurant.themeColor} />
        </label>
        <label className="image-picker">
          الشعار
          <span className="image-picker-control">
            {logoPreview && <img src={logoPreview} alt="" className="image-picker-preview" />}
            <span className="image-picker-button">{logoPreview ? 'تغيير الشعار' : 'اختر شعار من اللابتوب'}</span>
            <input
              name="logo"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) setLogoPreview(URL.createObjectURL(file))
              }}
            />
          </span>
        </label>
        <label className="image-picker">
          فيديو الترحيب
          <span className="image-picker-control">
            <span className="image-picker-button">{videoName ?? 'اختر فيديو من اللابتوب'}</span>
            <input
              name="video"
              type="file"
              accept="video/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) setVideoName(file?.name ?? null)
              }}
            />
          </span>
        </label>
        <button type="submit" disabled={pending}>
          {pending ? '...جارِ الحفظ' : 'حفظ التغييرات'}
        </button>
      </form>
    </section>
  )
}
