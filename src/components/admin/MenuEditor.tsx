'use client'

import { useState } from 'react'
import { createCategory, createItem, deleteItem, updateCategory, updateItem } from '@/lib/actions'
import type { EditorCategory, EditorItem, Language, LocalizedText } from '@/lib/types'

const LANG_LABELS: Record<Language, string> = { ar: 'عربي', ckb: 'كوردي', en: 'English' }
const LANGS: Language[] = ['ar', 'ckb', 'en']

export function MenuEditor({ categories, items }: { categories: EditorCategory[]; items: EditorItem[] }) {
  const [addingCategory, setAddingCategory] = useState(false)
  const [addingItemFor, setAddingItemFor] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)

  return (
    <>
      <section className="admin-toolbar">
        <div>
          <span className="admin-kicker">MENU</span>
          <h2>تعديل المينيو</h2>
        </div>
        <button className="outline-button" onClick={() => setAddingCategory((value) => !value)}>
          + إضافة غروب
        </button>
      </section>

      {addingCategory && (
        <section className="admin-panel">
          <CategoryForm action={createCategory} onDone={() => setAddingCategory(false)} />
        </section>
      )}

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.categoryId === category.id)
        return (
          <section className="admin-panel menu-editor-group" key={category.id}>
            <div className="panel-heading">
              <div>
                <span className="admin-kicker">GROUP</span>
                <h3>{category.name.ar}</h3>
              </div>
              <div className="menu-editor-actions">
                <button className="outline-button" onClick={() => setEditingCategory((current) => (current === category.id ? null : category.id))}>
                  تعديل الاسم
                </button>
                <button className="outline-button" onClick={() => setAddingItemFor((current) => (current === category.id ? null : category.id))}>
                  + إضافة صنف
                </button>
              </div>
            </div>

            {editingCategory === category.id && (
              <CategoryForm action={updateCategory.bind(null, category.id)} initial={category.name} onDone={() => setEditingCategory(null)} />
            )}
            {addingItemFor === category.id && <ItemForm action={createItem.bind(null, category.id)} onDone={() => setAddingItemFor(null)} />}

            <div className="admin-list">
              {categoryItems.map((item) => (
                <article className="admin-item" key={item.id}>
                  <img src={item.image} alt="" />
                  <div className="admin-item-copy">
                    <span>{item.tag}</span>
                    <h3>{item.name.ar}</h3>
                    <p>
                      {item.price.toLocaleString('en-US')} {item.currency}
                    </p>
                  </div>
                  <div className="menu-editor-actions">
                    <button className="outline-button" onClick={() => setEditingItem((current) => (current === item.id ? null : item.id))}>
                      تعديل
                    </button>
                    <form action={deleteItem.bind(null, item.id)}>
                      <button type="submit" className="outline-button danger">
                        حذف
                      </button>
                    </form>
                  </div>
                </article>
              ))}
              {editingItem &&
                categoryItems
                  .filter((item) => item.id === editingItem)
                  .map((item) => (
                    <ItemForm key={item.id} action={updateItem.bind(null, item.id)} initial={item} onDone={() => setEditingItem(null)} />
                  ))}
              {categoryItems.length === 0 && <p className="panel-note">لا توجد أصناف بهذا الغروب بعد.</p>}
            </div>
          </section>
        )
      })}
      {categories.length === 0 && <p className="panel-note">لا توجد غروبات بعد — ابدأ بإضافة واحد.</p>}
    </>
  )
}

function CategoryForm({ action, initial, onDone }: { action: (formData: FormData) => Promise<void>; initial?: LocalizedText; onDone: () => void }) {
  return (
    <form
      action={async (formData) => {
        await action(formData)
        onDone()
      }}
      className="editor-form"
    >
      {LANGS.map((lang) => (
        <label key={lang}>
          الاسم ({LANG_LABELS[lang]})
          <input name={`name_${lang}`} defaultValue={initial?.[lang]} required />
        </label>
      ))}
      <button type="submit">حفظ</button>
    </form>
  )
}

function ItemForm({ action, initial, onDone }: { action: (formData: FormData) => Promise<void>; initial?: EditorItem; onDone: () => void }) {
  const [preview, setPreview] = useState<string | null>(initial?.image ?? null)

  return (
    <form
      action={async (formData) => {
        await action(formData)
        onDone()
      }}
      className="editor-form"
    >
      {LANGS.map((lang) => (
        <label key={`name_${lang}`}>
          الاسم ({LANG_LABELS[lang]})
          <input name={`name_${lang}`} defaultValue={initial?.name[lang]} required />
        </label>
      ))}
      {LANGS.map((lang) => (
        <label key={`description_${lang}`}>
          الوصف ({LANG_LABELS[lang]})
          <textarea name={`description_${lang}`} defaultValue={initial?.description[lang]} rows={2} />
        </label>
      ))}
      <label>
        السعر
        <input name="price" type="number" min="0" defaultValue={initial?.price} required />
      </label>
      <label className="image-picker">
        صورة الصنف
        <span className="image-picker-control">
          {preview && <img src={preview} alt="" className="image-picker-preview" />}
          <span className="image-picker-button">{preview ? 'تغيير الصورة' : 'اختر صورة من اللابتوب'}</span>
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) setPreview(URL.createObjectURL(file))
            }}
          />
        </span>
      </label>
      <label>
        وسم (اختياري)
        <input name="tag" defaultValue={initial?.tag ?? ''} placeholder="Chef pick" />
      </label>
      <button type="submit">حفظ</button>
    </form>
  )
}
