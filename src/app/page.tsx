import { redirect } from 'next/navigation'
import { getRestaurant } from '@/lib/queries-server'

export default async function Home() {
  const restaurant = await getRestaurant()

  if (restaurant) redirect(`/${restaurant.slug}`)

  return (
    <main className="branch-picker">
      <img className="brand-logo" src="/peshwazi-logo.png" alt="Peshwazi" />
      <h1>لم يتم إعداد المينيو بعد</h1>
    </main>
  )
}
