import { notFound } from 'next/navigation'
import { MenuExperience } from '@/components/MenuExperience'
import { getRestaurantBySlug, getRestaurantMenu } from '@/lib/queries'
import { createSupabaseServerClient } from '@/lib/supabase'

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const restaurant = await getRestaurantBySlug(supabase, slug)
  if (!restaurant) notFound()

  const { categories, items } = await getRestaurantMenu(supabase)

  return <MenuExperience restaurant={restaurant} categories={categories} items={items} />
}
