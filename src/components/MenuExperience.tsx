'use client'

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import Lenis from 'lenis'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { copy, type CopyStrings } from '@/lib/menu-data'
import { getRestaurantMenu } from '@/lib/queries'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Language, MenuCategory, MenuItem, Restaurant } from '@/lib/types'

const ease = [0.32, 0.72, 0, 1] as const
const sheetEase = [0.16, 1, 0.3, 1] as const

// A small decorative row of diamonds — the one shape this brand actually owns (see the lozenge
// motif in public/peshwazi-logo.png) — reused as a divider instead of a generic hairline rule.
function DiamondRow({ count = 7 }: { count?: number }) {
  return (
    <div className="diamond-row" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <i key={index} />
      ))}
    </div>
  )
}

const CURRENCY_LABELS: Record<string, Record<Language, string>> = {
  IQD: { ar: 'د.ع', ckb: 'د.ع', en: 'IQD' },
}

const formatPrice = (price: number, currency: string, language: Language) =>
  `${price.toLocaleString('en-US')} ${CURRENCY_LABELS[currency]?.[language] ?? currency}`

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease } },
}

type NavCategory = { id: string; name: string; count: number }

export function MenuExperience({ restaurant, categories, items }: { restaurant: Restaurant; categories: MenuCategory[]; items: MenuItem[] }) {
  const [language, setLanguage] = useState<Language>('ar')
  const [started, setStarted] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<MenuItem | null>(null)
  const [liveCategories, setLiveCategories] = useState(categories)
  const [liveItems, setLiveItems] = useState(items)
  const reduced = useReducedMotion()
  const text = copy[language]

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl'
  }, [language])

  // Live menu: a customer with the page already open sees availability/price/content changes
  // immediately, not just on next visit. Menu edits are infrequent, so refetching the whole
  // menu on any change is simpler and more robust than patching each table's event shape.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    async function refetch() {
      const fresh = await getRestaurantMenu(supabase)
      setLiveCategories(fresh.categories)
      setLiveItems(fresh.items)
    }

    const channel = supabase
      .channel('restaurant-menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'item_translations' }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'variants' }, refetch)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const navCategories: NavCategory[] = useMemo(() => {
    const countFor = (categoryId: string | null) => (categoryId ? liveItems.filter((item) => item.categoryId === categoryId).length : liveItems.length)
    return [
      { id: 'all', name: text.all, count: countFor(null) },
      ...liveCategories.map((category) => ({ id: category.id, name: category.name[language], count: countFor(category.id) })),
    ]
  }, [liveCategories, liveItems, language, text.all])

  const visibleItems = liveItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory
    const haystack = `${item.name[language]} ${item.description[language]}`.toLowerCase()
    return matchesCategory && haystack.includes(query.toLowerCase())
  })

  return (
    <div className="cinema">
      <div className="cinema-bg" aria-hidden="true">
        {/* The welcome video is decorative for that one first screen only — left mounted behind
            the menu too, it would keep decoding non-stop while the guest scrolls a card grid full
            of its own animations, which is exactly the kind of thing that makes scrolling stutter.
            Unmounting it (not just hiding it) when the guest starts stops that decode entirely. */}
        {restaurant.videoUrl && !started ? (
          <video autoPlay={!reduced} muted loop playsInline src={restaurant.videoUrl} />
        ) : (
          <div className="diamond-field" />
        )}
        <div className="cinema-scrim" />
      </div>

      <AnimatePresence mode="wait">
        {!started ? (
          <Welcome key="welcome" restaurant={restaurant} language={language} setLanguage={setLanguage} onStart={() => setStarted(true)} reduced={reduced} />
        ) : (
          <MenuStage
            key="menu"
            restaurant={restaurant}
            language={language}
            text={text}
            navCategories={navCategories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            query={query}
            setQuery={setQuery}
            visibleItems={visibleItems}
            setSelected={setSelected}
          />
        )}
      </AnimatePresence>

      {/* Rendered here, as a sibling of .cinema-bg rather than nested inside .menu-shell — a
          motion component with an animated `scale` (like .menu-shell) becomes the containing
          block for any `position: fixed` descendant, which would pin this bottom sheet to
          .menu-shell's scrollable height instead of the actual viewport. */}
      <AnimatePresence>
        {selected && (
          <motion.div className="detail-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div
              className="detail-sheet glass-panel"
              onClick={(event) => event.stopPropagation()}
              initial={{ y: '100%' }}
              animate={{ y: 0, transition: { duration: 0.3, ease: sheetEase } }}
              exit={{ y: '100%', transition: { duration: 0.25, ease: sheetEase } }}
            >
              <Image src={selected.image} alt={selected.name[language]} width={800} height={800} sizes="(max-width: 800px) 100vw, 480px" />
              <motion.div
                className="detail-content"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } } }}
              >
                {selected.tag && (
                  <motion.span className="card-tag" variants={fadeUp}>
                    {selected.tag}
                  </motion.span>
                )}
                <motion.h2 variants={fadeUp}>{selected.name[language]}</motion.h2>
                <motion.p variants={fadeUp}>{selected.description[language]}</motion.p>
                <motion.strong variants={fadeUp}>{formatPrice(selected.price, selected.currency, language)}</motion.strong>
                <motion.button className="close-detail" variants={fadeUp} onClick={() => setSelected(null)}>
                  {text.close} ×
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Welcome({
  restaurant,
  language,
  setLanguage,
  onStart,
  reduced,
}: {
  restaurant: Restaurant
  language: Language
  setLanguage: (language: Language) => void
  onStart: () => void
  reduced: boolean | null
}) {
  const text = copy[language]
  const welcomeLine = text.welcome.replace('%NAME%', restaurant.name[language])
  return (
    <motion.main className="welcome" initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      {/* The card that opens a dish (see DiamondRow / .detail-sheet in MenuStage) and the card
          that opens the whole menu share one signature move: they arrive and leave as this
          brand's diamond, not a generic fade — materializing here, and imploding into a bloom of
          sand-colored light when the guest is ready to eat. Timings kept short on purpose: this
          choreography used to add ~1.5s of dead time before the menu was even visible. */}
      <motion.div
        className="welcome-content glass-panel"
        initial={{ opacity: 0, scale: 0.86, y: 26, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease } }}
        exit={{
          scale: [1, 1.06, 0.12],
          rotate: [0, 0, 45],
          opacity: [1, 1, 0],
          boxShadow: ['0 24px 60px rgba(8, 2, 5, 0.35)', '0 0 140px rgba(230, 199, 147, 0.6)', '0 0 0px rgba(230, 199, 147, 0)'],
          transition: { duration: 0.35, ease, times: [0, 0.4, 1] },
        }}
      >
        <motion.div
          className="welcome-brand"
          variants={{ hidden: { opacity: 0, y: 18, filter: 'blur(10px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: reduced ? 0 : 0.35, ease } } }}
        >
          {restaurant.logoUrl ? (
            <img className="brand-logo-mark" src={restaurant.logoUrl} alt={restaurant.name[language]} />
          ) : (
            <>
              <span className="brand-script">{restaurant.name[language]}</span>
              <span className="brand-caption">RESTAURANT · CAFÉ</span>
            </>
          )}
        </motion.div>
        <motion.p className="welcome-line" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.05, duration: 0.25 } } }}>
          {welcomeLine}
        </motion.p>
        <motion.h1 variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.25, ease } } }}>{text.subtitle}</motion.h1>
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.15, duration: 0.2 } } }}>
          <DiamondRow />
        </motion.div>
        <div className="language-row">
          {(['ar', 'ckb', 'en'] as Language[]).map((option, index) => (
            <motion.button
              key={option}
              onClick={() => setLanguage(option)}
              className={language === option ? 'selected' : ''}
              style={{ skewX: 14 }}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { delay: 0.18 + index * 0.03, duration: 0.2, ease } } }}
            >
              <span>{option === 'ar' ? 'العربية' : option === 'ckb' ? 'کوردی' : 'English'}</span>
            </motion.button>
          ))}
        </div>
        <motion.button
          className="enter-button"
          onClick={onStart}
          whileTap={{ scale: 0.98 }}
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { delay: 0.24, duration: 0.2, ease } } }}
        >
          {text.explore}
        </motion.button>
      </motion.div>
      <div className="welcome-meta">
        <span>{restaurant.name.en.toUpperCase()} / IRAQ</span>
        <span>PESHWAZI</span>
      </div>
    </motion.main>
  )
}

function MenuStage({
  restaurant,
  language,
  text,
  navCategories,
  activeCategory,
  setActiveCategory,
  query,
  setQuery,
  visibleItems,
  setSelected,
}: {
  restaurant: Restaurant
  language: Language
  text: CopyStrings
  navCategories: NavCategory[]
  activeCategory: string
  setActiveCategory: (id: string) => void
  query: string
  setQuery: (query: string) => void
  visibleItems: MenuItem[]
  setSelected: (item: MenuItem | null) => void
}) {
  return (
    <motion.main
      className="menu-shell"
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.25, ease } }}
    >
      <motion.header layout className="menu-header glass-panel" initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25, delay: 0.05, ease }}>
        <div className="brand-mark">
          <span className="brand-word">RESTAURANT</span>
          {restaurant.logoUrl ? <img className="brand-logo" src={restaurant.logoUrl} alt={restaurant.name[language]} /> : <span className="brand-script">{restaurant.name[language]}</span>}
          <span className="brand-word">CAFÉ</span>
        </div>
        <div className="header-actions">
          <span className="location-dot" /> <span>{restaurant.name[language]}</span>
        </div>
      </motion.header>

      <section className="menu-intro glass-panel">
        <p className="eyebrow">{text.menu} / 2026</p>
        <h1>{language === 'en' ? 'Made for lingering.' : language === 'ckb' ? 'بۆ ئەوەی بمێنیتەوە.' : 'لأوقاتٍ تستحق أن تطول.'}</h1>
        <p className="intro-copy">
          {language === 'en' ? 'A contemporary table rooted in the warmth of Kurdistan.' : language === 'ckb' ? 'مێزێکی هاوچەرخ لە گەرمیی کوردستان ڕەگداکوتاوە.' : 'مائدة معاصرة، جذورها في دفء كردستان.'}
        </p>
      </section>

      <div className="sticky-nav glass-panel">
        <nav className="category-nav" aria-label="Categories">
          {navCategories.map((category) => (
            <button className={activeCategory === category.id ? 'active' : ''} key={category.id} onClick={() => setActiveCategory(category.id)}>
              <span className="category-name">{category.name}</span>
              <span className="category-count">{category.count}</span>
            </button>
          ))}
        </nav>
        <div className="search-wrap">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.search} aria-label={text.search} />
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.section
          layout
          className="menu-grid"
          key={`${language}-${activeCategory}`}
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.2, ease }}
        >
          {visibleItems.map((item, index) => (
            <MenuCard key={item.id} item={item} language={language} index={index} onSelect={() => setSelected(item)} />
          ))}
        </motion.section>
      </AnimatePresence>

      {visibleItems.length === 0 && <p className="empty-state glass-panel">{text.empty}</p>}

      <footer className="menu-footer glass-panel">
        <span>© Peshwazi</span>
        <span>Made with care in {restaurant.name.en}</span>
        <span>Instagram · Facebook</span>
      </footer>
    </motion.main>
  )
}

function MenuCard({ item, language, index, onSelect }: { item: MenuItem; language: Language; index: number; onSelect: () => void }) {
  // Scroll-reveal lives on this wrapper, separate from the button below, so the scroll-driven
  // style and the button's own hover/tap transforms don't fight over the same element.
  const wrapperRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ['start 96%', 'start 55%'] })
  const y = useTransform(scrollYProgress, [0, 1], [36, 0])
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const blurPx = useTransform(scrollYProgress, [0, 1], [10, 0])
  const filter = useTransform(blurPx, (value) => `blur(${value}px)`)

  return (
    <motion.div
      ref={wrapperRef}
      style={reduced ? undefined : { y, opacity, filter }}
      initial={reduced ? { opacity: 0 } : undefined}
      whileInView={reduced ? { opacity: 1 } : undefined}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.03 }}
    >
      <motion.button className="menu-card glass-panel" onClick={onSelect} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
        <div className="image-frame">
          <Image src={item.image} alt={item.name[language]} fill sizes="(max-width: 800px) 45vw, 30vw" />
        </div>
        <div className="card-copy">
          {item.tag && <span className="card-tag">{item.tag}</span>}
          <div className="card-title-row">
            <h2>{item.name[language]}</h2>
            <strong>{formatPrice(item.price, item.currency, language)}</strong>
          </div>
          <p>{item.description[language]}</p>
        </div>
      </motion.button>
    </motion.div>
  )
}
