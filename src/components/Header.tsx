'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import UserButtonWithProfile from './UserButtonWithProfile'

export default function Header() {
  useEffect(() => {
    // The header is position:fixed over a constant-height spacer, so resizing it
    // never reflows the page → it cannot bounce. We drive a single 0→1 progress
    // var (`--mm-shrink`) continuously from scroll position: the logo + bar
    // shrink in lockstep with the background fading in (both start at ~8px and
    // finish by 80px), so it reads as one coordinated motion. Because the bar
    // height tracks the scroll, content stays tucked right under it (no gap).
    const root = document.documentElement
    const START = 8
    const END = 80
    let raf = 0
    const apply = () => {
      raf = 0
      const y = window.scrollY
      if (y > START) root.classList.add('mm-scrolled')
      else if (y < 4) root.classList.remove('mm-scrolled')
      const t = Math.min(1, Math.max(0, (y - START) / (END - START)))
      root.style.setProperty('--mm-shrink', String(t))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
      root.classList.remove('mm-scrolled')
      root.style.removeProperty('--mm-shrink')
    }
  }, [])

  return (
    <>
      <header className="mm-header">
        <div className="mm-header-inner">
          <Link href="/" className="flex items-center gap-3 wobble">
            <div className="mm-logo relative">
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
      <div className="mm-header-spacer" aria-hidden="true" />
    </>
  )
}
