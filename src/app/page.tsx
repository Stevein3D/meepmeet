import Link from 'next/link'
import Image from 'next/image'
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'

export default function Home() {
  return (
    <>
      <header>
        <div className="max-w-7xl mx-auto px-8 py-4 mt-4 flex items-center justify-center">
          <div className="relative w-40 sm:w-80 h-40 sm:h-80">
              <Image 
              src="/mm-logo-sm.png" 
              alt="Meep Meet" 
              fill
              className="object-contain"
              />
          </div>
        </div>
      </header>
      <main className="p-8 flex-1">
        <nav className="mt-2 space-x-0 flex flex-wrap flex-col sm:flex-row justify-center sm:space-x-4 text-center">
          <Link href="/events" className="inline-block mt-4 btn btn-md btn-primary">
            Events
          </Link>
          <Link href="/meeps" className="inline-block mt-4 btn btn-md btn-primary">
            Meeps
          </Link>
          <Link href="/games" className="inline-block mt-4 btn btn-md btn-primary">
            Games
          </Link>
        </nav>
      </main>
    </>
  )
}