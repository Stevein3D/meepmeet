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
            <span className="footer-brand">Meep Meet</span>
            <p className="footer-copy">Gather your party &middot; Roll the dice &middot; Est. 2025</p>
        </div>
    </footer>
  )
}