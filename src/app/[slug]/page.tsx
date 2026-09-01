import { notFound } from 'next/navigation'
import { MenuExperience } from '@/components/MenuExperience'
import { getRestaurantBySlug, getRestaurantMenu } from '@/lib/queries'
import { createSupabaseServerClient } from '@/lib/supabase'

// Without this, the [slug] route has no params known at build time, so Vercel deploys it as a
// per-request Function instead of a cached static page — every visit re-renders from scratch.
// Prerendering the one restaurant that actually exists turns it into a CDN-cached static page;
// actions.ts already calls revalidatePath() on every admin edit, so it still stays fresh.
export async function generateStaticParams() {
  return [{ slug: 'peshwazi' }]
}

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const restaurant = await getRestaurantBySlug(supabase, slug)
  if (!restaurant) notFound()

  const { categories, items } = await getRestaurantMenu(supabase)

  return <MenuExperience restaurant={restaurant} categories={categories} items={items} />
}
