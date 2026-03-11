import Link from 'next/link'
import Image from 'next/image'
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'
// import HeaderAuth from './HeaderAuth'

export default function Header() {
  return (
    <header className="">
      <div className="mx-auto px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 wobble">
          <div className="relative w-12 sm:w-30 h-12 sm:h-30 ">
              <Image 
              src="/mm-logo-sm.png" 
              alt="Meep Meet" 
              fill
              className="object-contain"
              />
          </div>
        </Link>
        
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link href="/games" className="main-nav-link text-sm sm:text-lg">
            Games
          </Link>
          <Link href="/meeps" className="main-nav-link text-sm sm:text-lg">
            Meeps
          </Link>
          <Link href="/events" className="main-nav-link text-sm sm:text-lg">
            Events
          </Link>
          {/* <HeaderAuth /> */}
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="main-nav-link text-sm sm:text-lg">
              Sign In
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  )
}