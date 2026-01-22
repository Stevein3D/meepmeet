import Link from 'next/link'
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'

export default function Home() {
  return (
    <>
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">MeepMeet</h1>
          <div className="flex items-center gap-4">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="text-blue-600 hover:underline">
                Sign In
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>
      <main className="min-h-screen p-8">
        <p className="mt-4 text-gray-600">Board game night planner for your local group</p>
        
        <nav className="mt-8 space-x-4">
          <Link href="/games" className="text-blue-600 hover:underline">
            View Games
          </Link>
        </nav>
      </main>
    </>
  )
}