'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import UserButtonWithProfile from './UserButtonWithProfile'

export default function Header() {
  // Hydration-safe: server + first client render both start at top (scrollY 0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Hysteresis: shrink past 64px, only grow back under 24px. The dead zone
    // stops the header flickering when you hover right around the threshold
    // (shrinking changes layout height, which would otherwise re-cross a single
    // boundary and toggle repeatedly).
    const onScroll = () => {
      const y = window.scrollY
      setScrolled((prev) => {
        if (!prev && y > 64) return true
        if (prev && y < 24) return false
        return prev
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`mm-header${scrolled ? ' is-scrolled' : ''}`}>
      <div
        className={`mx-auto px-8 flex items-center justify-between transition-all duration-300 ${
          scrolled ? 'py-2' : 'py-4'
        }`}
      >
        <Link href="/" className="flex items-center gap-3 wobble">
          <div
            className={`relative transition-all duration-300 ${
              scrolled ? 'w-10 h-10 sm:w-14 sm:h-14' : 'w-12 h-12 sm:w-30 sm:h-30'
            }`}
          >
            <Image
              src="/mm-logo-sm.png"
              alt="Meep Meet"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <Link href="/events" className="main-nav-link text-sm sm:text-lg">
            Events
          </Link>
          <Link href="/meeps" className="main-nav-link text-sm sm:text-lg">
            Meeps
          </Link>
          <Link href="/games" className="main-nav-link text-sm sm:text-lg">
            Games
          </Link>
          <Link href="/faq" className="main-nav-link text-sm sm:text-lg">
            FAQ
          </Link>
          <SignedIn>
            <UserButtonWithProfile />
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
