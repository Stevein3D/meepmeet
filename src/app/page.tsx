import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">MeepMeet</h1>
      <p className="mt-4 text-gray-600">Board game night planner for your local group</p>
      
      <nav className="mt-8 space-x-4">
        <Link href="/games" className="text-blue-600 hover:underline">
          View Games
        </Link>
      </nav>
    </main>
  )
}