// TEMPORARY dev-only in-memory database, used instead of Supabase while NEXT_PUBLIC_MOCK_DATA=1
// (see .env.local). Lets the site run and be demoed/edited with zero network calls, before the
// real Supabase project is wired up. Delete this file + the three `if (isMockMode())` branches in
// supabase.ts / supabase-admin.ts / supabase-browser.ts once you're ready to connect for real —
// nothing outside those three files knows this exists (queries.ts, queries-server.ts, actions.ts
// are all untouched, they just call the Supabase client they're handed).
//
// Deliberately has NO Node-only imports (no `crypto`, no `./pin`) — this module is imported by
// src/lib/supabase-browser.ts too, which ends up in the browser bundle.

type Row = Record<string, unknown>

type Store = {
  restaurant: Row[]
  categories: Row[]
  category_translations: Row[]
  items: Row[]
  item_translations: Row[]
  variants: Row[]
  staff: Row[]
  audit_log: Row[]
}

function uuid() {
  return 'mock-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function seed(): Store {
  const cat = (en: string) => uuid()
  const catBreakfast = cat('breakfast')
  const catMains = cat('mains')
  const catCoffee = cat('coffee')
  const catDessert = cat('dessert')

  const categories: Row[] = [
    { id: catBreakfast, sort_order: 0, is_active: true },
    { id: catMains, sort_order: 1, is_active: true },
    { id: catCoffee, sort_order: 2, is_active: true },
    { id: catDessert, sort_order: 3, is_active: true },
  ]

  const category_translations: Row[] = [
    { category_id: catBreakfast, lang: 'ar', name: 'فطور' }, { category_id: catBreakfast, lang: 'ckb', name: 'نانی بەیانی' }, { category_id: catBreakfast, lang: 'en', name: 'Breakfast' },
    { category_id: catMains, lang: 'ar', name: 'الأطباق الرئيسية' }, { category_id: catMains, lang: 'ckb', name: 'خواردنە سەرەکییەکان' }, { category_id: catMains, lang: 'en', name: 'Mains' },
    { category_id: catCoffee, lang: 'ar', name: 'قهوة' }, { category_id: catCoffee, lang: 'ckb', name: 'قاوە' }, { category_id: catCoffee, lang: 'en', name: 'Coffee' },
    { category_id: catDessert, lang: 'ar', name: 'حلويات' }, { category_id: catDessert, lang: 'ckb', name: 'شیرینی' }, { category_id: catDessert, lang: 'en', name: 'Desserts' },
  ]

  const demoItems: Array<{ category: string; image: string; tag: string; sort: number; price: number; names: [string, string, string]; descriptions: [string, string, string] }> = [
    { category: catBreakfast, image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=1200&q=85', tag: 'Chef pick', sort: 0, price: 8500,
      names: ['شكشوكة بيشوازي', 'شەکشووکەی پێشوازی', 'Peshwazi Shakshuka'],
      descriptions: ['بيض طازج، طماطم مشوية، فلفل حلو وخبز تنور', 'هێلکەی تازە، تەماتەی برژاوە و نانی تەنوور', 'Farm eggs, charred tomato, sweet pepper & tandoor bread'] },
    { category: catMains, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85', tag: 'Signature', sort: 0, price: 18000,
      names: ['كباب على الفحم', 'کەبابی سەر گەرماو', 'Charcoal Kebab'],
      descriptions: ['لحم عراقي متبّل، بصل مشوي، سماق ونان ساخن', 'گۆشتی عێراقی، پیازی برژاوە و نانی گەرم', 'Seasoned Iraqi beef, grilled onion, sumac & warm bread'] },
    { category: catMains, image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=85', tag: 'New', sort: 1, price: 16000,
      names: ['ريزوتو الفطر', 'ڕیزۆتۆی قەرچک', 'Wild Mushroom Risotto'],
      descriptions: ['أرز أربوريو، فطر بري، بارميزان وزيت أعشاب', 'برنجی ئەربۆریۆ، قەرچکی کێویی و پەنیر', 'Arborio rice, wild mushrooms, parmesan & herb oil'] },
    { category: catCoffee, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=85', tag: 'Favourite', sort: 0, price: 6500,
      names: ['لاتيه الهيل', 'لاتێی هەڵ', 'Cardamom Latte'],
      descriptions: ['إسبريسو محمّص، حليب مخملي وهيل عراقي', 'ئێسپریسۆ، شیری نەرم و هەڵی عێراقی', 'Roasted espresso, velvet milk & Iraqi cardamom'] },
    { category: catDessert, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=85', tag: 'Sweet', sort: 0, price: 9000,
      names: ['تيراميسو التمر', 'تیرامیسۆی خورما', 'Date Tiramisu'],
      descriptions: ['كريمة ماسكربوني، تمر بصراوي، كاكاو وقهوة', 'کریمەی ماسکارپۆن، خورمای بەسرە و کاکاو', 'Mascarpone cream, Basrawi dates, cacao & coffee'] },
    { category: catCoffee, image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=85', tag: 'Warm', sort: 1, price: 4500,
      names: ['شاي الزعفران', 'چاى زەعفەران', 'Saffron Tea'],
      descriptions: ['شاي أسود، زعفران، هيل ولمسة ورد', 'چاى ڕەش، زەعفەران، هەڵ و گوڵ', 'Black tea, saffron, cardamom & rose'] },
  ]

  const items: Row[] = []
  const item_translations: Row[] = []
  const variants: Row[] = []
  for (const item of demoItems) {
    const id = uuid()
    items.push({ id, category_id: item.category, image_url: item.image, tags: [item.tag], sort_order: item.sort, is_active: true, is_available: true })
    const langs = ['ar', 'ckb', 'en'] as const
    langs.forEach((lang, index) => item_translations.push({ item_id: id, lang, name: item.names[index], description: item.descriptions[index] }))
    variants.push({ id: uuid(), item_id: id, label_key: 'regular', sort_order: 0, price: item.price, currency: 'IQD' })
  }

  return {
    restaurant: [{ id: uuid(), slug: 'peshwazi', name: { ar: 'بيشوازي', ckb: 'پێشوازی', en: 'Peshwazi' }, theme_color: '#c9a45c', logo_url: '/peshwazi-logo.png', video_url: null }],
    categories,
    category_translations,
    items,
    item_translations,
    variants,
    staff: [],
    audit_log: [],
  }
}

// Module-level singleton: persists for the life of the Node/browser process it's loaded in
// (i.e. for the whole `next dev` run on the server, reset on server restart or full page reload
// in the browser bundle). That's the whole point — no network, no setup, just enough state to
// click around and see the admin panel actually do something.
const globalStore = globalThis as unknown as { __peshwaziMockStore?: Store }
export const store: Store = globalStore.__peshwaziMockStore ?? (globalStore.__peshwaziMockStore = seed())

function applyEmbeds(table: keyof Store, row: Row): Row {
  if (table === 'categories') {
    return { ...row, category_translations: store.category_translations.filter((t) => t.category_id === row.id) }
  }
  if (table === 'items') {
    return {
      ...row,
      item_translations: store.item_translations.filter((t) => t.item_id === row.id),
      variants: store.variants.filter((v) => v.item_id === row.id),
    }
  }
  if (table === 'audit_log') {
    const actor = store.staff.find((s) => s.id === row.actor_id)
    return { ...row, staff: actor ? { display_name: actor.display_name } : null }
  }
  return row
}

type SelectOpts = { count?: 'exact'; head?: boolean }

class MockQuery implements PromiseLike<{ data: unknown; error: null; count?: number }> {
  private table: keyof Store
  private filters: Array<[string, unknown]> = []
  private orderCol?: string
  private orderAscending = true
  private limitN?: number
  private op: 'select' | 'insert' | 'update' | 'upsert' = 'select'
  private payload: unknown
  private wantCount = false

  constructor(table: keyof Store) {
    this.table = table
  }

  select(_cols?: string, opts?: SelectOpts) {
    if (opts?.count) this.wantCount = true
    return this
  }
  eq(col: string, val: unknown) {
    this.filters.push([col, val])
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col
    this.orderAscending = opts?.ascending ?? true
    return this
  }
  limit(n: number) {
    this.limitN = n
    return this
  }
  insert(payload: unknown) {
    this.op = 'insert'
    this.payload = payload
    return this
  }
  update(payload: unknown) {
    this.op = 'update'
    this.payload = payload
    return this
  }
  upsert(payload: unknown) {
    this.op = 'upsert'
    this.payload = payload
    return this
  }
  single() {
    return this.exec().then((result) => {
      const rows = result.data as Row[]
      if (!rows || rows.length === 0) return { data: null, error: new Error('mock: no rows') }
      return { data: rows[0], error: null }
    })
  }
  maybeSingle() {
    return this.exec().then((result) => {
      const rows = result.data as Row[]
      return { data: rows && rows.length > 0 ? rows[0] : null, error: null }
    })
  }
  then<TResult1 = { data: unknown; error: null; count?: number }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected)
  }

  private matches(row: Row) {
    return this.filters.every(([col, val]) => row[col] === val)
  }

  private upsertKey(): string[] {
    if (this.table === 'category_translations') return ['category_id', 'lang']
    if (this.table === 'item_translations') return ['item_id', 'lang']
    return ['id']
  }

  // Mirrors the `default` clauses in supabase/schema.sql — actions.ts intentionally omits these
  // columns on insert (relying on Postgres to fill them in), so the mock has to fill them in too.
  private defaults(): Row {
    if (this.table === 'categories') return { sort_order: 0, is_active: true }
    if (this.table === 'items') return { tags: [], sort_order: 0, is_active: true, is_available: true }
    if (this.table === 'variants') return { label_key: 'regular', sort_order: 0, price: 0, currency: 'IQD' }
    if (this.table === 'staff') return { is_owner: false, can_toggle_availability: false, can_manage_menu: false, is_active: true }
    if (this.table === 'restaurant') return { theme_color: '#d9e85a' }
    return {}
  }

  private async exec(): Promise<{ data: unknown; error: null; count?: number }> {
    const arr = store[this.table]

    if (this.op === 'insert') {
      const rowsIn = (Array.isArray(this.payload) ? this.payload : [this.payload]) as Row[]
      const inserted = rowsIn.map((r) => {
        const row: Row = { ...this.defaults(), id: uuid(), created_at: new Date().toISOString(), ...r }
        arr.push(row)
        return applyEmbeds(this.table, row)
      })
      return { data: inserted, error: null }
    }

    if (this.op === 'update') {
      const updated = arr.filter((row) => this.matches(row)).map((row) => {
        Object.assign(row, this.payload as Row)
        return applyEmbeds(this.table, row)
      })
      return { data: updated, error: null }
    }

    if (this.op === 'upsert') {
      const key = this.upsertKey()
      const payload = this.payload as Row
      const existing = arr.find((row) => key.every((k) => row[k] === payload[k]))
      if (existing) {
        Object.assign(existing, payload)
        return { data: [applyEmbeds(this.table, existing)], error: null }
      }
      const row: Row = { ...payload }
      arr.push(row)
      return { data: [applyEmbeds(this.table, row)], error: null }
    }

    // select
    if (this.wantCount) {
      const count = arr.filter((row) => this.matches(row)).length
      return { data: null, error: null, count }
    }
    let rows = arr.filter((row) => this.matches(row)).map((row) => applyEmbeds(this.table, row))
    if (this.orderCol) {
      const col = this.orderCol
      rows = [...rows].sort((a, b) => {
        const av = a[col] as string | number
        const bv = b[col] as string | number
        if (av < bv) return this.orderAscending ? -1 : 1
        if (av > bv) return this.orderAscending ? 1 : -1
        return 0
      })
    }
    if (this.limitN !== undefined) rows = rows.slice(0, this.limitN)
    return { data: rows, error: null }
  }
}

export function mockFrom(table: string) {
  return new MockQuery(table as keyof Store)
}
