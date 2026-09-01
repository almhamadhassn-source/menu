'use client'

import { motion } from 'motion/react'
import { useState, useTransition } from 'react'
import { toggleAvailability } from '@/lib/actions'
import type { AdminItem } from '@/lib/types'

export function OverviewPanel({ items, canToggle }: { items: AdminItem[]; canToggle: boolean }) {
  const [localItems, setLocalItems] = useState(items)
  const [isPending, startTransition] = useTransition()
  const availableCount = localItems.filter((item) => item.isAvailable).length

  function handleToggle(itemId: string, current: boolean) {
    if (!canToggle) return
    setLocalItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, isAvailable: !current } : item)))
    startTransition(async () => {
      await toggleAvailability(itemId, !current)
    })
  }

  return (
    <>
      <section className="admin-toolbar">
        <div>
          <span className="admin-kicker">LIVE OPERATIONS</span>
          <h2>لوحة القيادة</h2>
        </div>
        <span className="live-pill">
          <i /> المينيو مباشر
        </span>
      </section>
      <section className="status-strip">
        <div>
          <strong>{availableCount}</strong>
          <span>متوفر الآن</span>
        </div>
        <div>
          <strong>{localItems.length - availableCount}</strong>
          <span>غير متوفر</span>
        </div>
      </section>
      <div className="admin-columns">
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="admin-kicker">QUICK ACTION</span>
              <h3>توفر الأصناف</h3>
            </div>
            <a className="outline-button" href="/" target="_blank" rel="noreferrer">
              معاينة المينيو ↗
            </a>
          </div>
          <p className="panel-note">تغيير الحالة يظهر فوراً للزبائن في المينيو.</p>
          <div className="admin-list">
            {localItems.map((item) => (
              <article className="admin-item" key={item.id}>
                <img src={item.image} alt="" />
                <div className="admin-item-copy">
                  <span>{item.tag}</span>
                  <h3>{item.name.ar}</h3>
                  <p>{item.name.en}</p>
                </div>
                <div className="availability">
                  <span className={item.isAvailable ? 'is-on' : 'is-off'}>{item.isAvailable ? 'متوفر' : 'متوقف'}</span>
                  <button
                    className={`switch ${item.isAvailable ? 'on' : ''}`}
                    aria-label={`تغيير توفر ${item.name.ar}`}
                    disabled={isPending || !canToggle}
                    onClick={() => handleToggle(item.id, item.isAvailable)}
                  >
                    <motion.i layout transition={{ duration: 0.2 }} />
                  </button>
                </div>
              </article>
            ))}
            {localItems.length === 0 && <p className="panel-note">لا توجد أصناف بعد.</p>}
          </div>
        </section>
      </div>
    </>
  )
}
