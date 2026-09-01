import type { Metadata } from 'next'
import { getRestaurantBySlug } from '@/lib/queries'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const restaurant = await getRestaurantBySlug(supabase, slug)
  if (!restaurant) return { title: 'Peshwazi | Menu' }

  return {
    title: `${restaurant.name.en} | Peshwazi Menu`,
    description: `Peshwazi ${restaurant.name.en} digital menu`,
    openGraph: restaurant.logoUrl ? { images: [restaurant.logoUrl] } : undefined,
  }
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children
}
