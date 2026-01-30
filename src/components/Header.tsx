import Link from 'next/link'
import Image from 'next/image'
import HeaderAuth from './HeaderAuth'

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link href="/games" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative w-12 h-12">
              <Image 
              src="/mm-logo-sm.png" 
              alt="Meep Meet" 
              fill
              className="object-contain"
              />
          </div>
          <span className="text-2xl font-bold text-black">Meep Meet</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="/games" className="text-gray-700 hover:text-blue-600 transition-colors">
            Games
          </Link>
          <Link href="/events" className="text-gray-700 hover:text-blue-600 transition-colors">
            Events
          </Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  )
}