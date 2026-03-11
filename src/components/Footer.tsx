import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="footer-embers">
        <div className="ember-field">
            <div className="ember"></div>
            <div className="ember"></div>
            <div className="ember"></div>
            <div className="ember"></div>
            <div className="ember"></div>
            <div className="ember"></div>
            <div className="ember"></div>
            <div className="ember"></div>
        </div>
        <div className="footer-content">
            <Link href="/" className="flex items-center gap-3 wobble">
                <div className="relative w-12 sm:w-12 h-12 sm:h-12 ">
                    <Image 
                    src="/mm-logo-parchment.png" 
                    alt="Meep Meet" 
                    fill
                    className="object-contain"
                    />
                </div>
            </Link>
            {/* <span className="footer-brand">Meep Meet</span> */}
            <p className="footer-copy">Gather your party &middot; Roll the dice &middot; Est. 2025</p>
        </div>
    </footer>
  )
}