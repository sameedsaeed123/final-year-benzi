import { MapPin, Mail, Phone } from 'lucide-react'

export default function Footer() {
  const quickLinks = [
    ['Home', 'Subscriptions'],
    ['About Us', 'Blogs'],
    ['Virtual Counselor', "FAQ's"],
    ['Rescources', 'Contact Us'],
  ]

  return (
    <footer className="bg-brand text-white pt-14 pb-6 px-6 max-[768px]:pt-12 max-[480px]:pt-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">

        <div className="grid grid-cols-12 gap-10 max-[1024px]:grid-cols-2 max-[640px]:grid-cols-1 max-[1024px]:gap-8">

          {/* Brand column */}
          <div className="col-span-4 max-[1024px]:col-span-2 max-[640px]:col-span-1">
            <img
              src="/images/Header-Logo.png"
              alt="Benzi Logo"
              className="h-11 w-auto object-contain brightness-0 invert mb-5"
            />
            <p className="text-white/85 text-[14px] leading-[1.7] mb-7 max-w-[320px]">
              Empowering mental wellness through personalized care and evidence-based therapies. Take the first step towards a brighter future with us.
            </p>

            <h4 className="text-white text-[15px] font-bold mb-3">Social Links</h4>
            <div className="flex items-center gap-3">
              {/* Facebook */}
              <a href="#" aria-label="Facebook" className="text-white hover:opacity-80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 9H16V6h-2.5c-1.93 0-3.5 1.57-3.5 3.5V11H8v3h2v7h3v-7h2.5l.5-3H13V9.5c0-.28.22-.5.5-.5z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn" className="text-white hover:opacity-80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              {/* X (Twitter) */}
              <a href="#" aria-label="X" className="text-white hover:opacity-80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2H21l-6.52 7.45L22 22h-6.828l-4.77-6.23L4.8 22H2l7.01-8.02L2 2h6.914l4.32 5.73L18.244 2zm-1.197 18h1.88L7.04 4H5.04l12.007 16z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="text-white hover:opacity-80">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-3 max-[1024px]:col-span-1">
            <h4 className="text-white text-[15px] font-bold mb-5">Quick Links</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-[14px]">
              {quickLinks.flat().map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-white/90 hover:text-white no-underline transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Contact Links */}
          <div className="col-span-2 max-[1024px]:col-span-1">
            <h4 className="text-white text-[15px] font-bold mb-5">Contact Links</h4>
            <ul className="space-y-4 text-[14px]">
              <li className="flex items-start gap-2 text-white/90">
                <MapPin size={18} strokeWidth={2} className="shrink-0 mt-0.5" />
                <span>Building number 81, G3 Johar Town, Lhr</span>
              </li>
              <li className="flex items-center gap-2 text-white/90">
                <Mail size={18} strokeWidth={2} className="shrink-0" />
                <span>benzi@example.com</span>
              </li>
              <li className="flex items-center gap-2 text-white/90">
                <Phone size={18} strokeWidth={2} className="shrink-0" />
                <span>+92 234 567 890</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-3 max-[1024px]:col-span-2 max-[640px]:col-span-1">
            <h4 className="text-white text-[15px] font-bold mb-5">Subscribe to Our Newsletter</h4>
            <p className="text-white/85 text-[13.5px] leading-[1.7] mb-5">
              Lorem ipsum dolor sit, consectetur elit, sed do adipisicing eiusmod tempor
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center bg-white rounded-lg p-1 pr-1"
            >
              <input
                type="email"
                placeholder="email@example.com"
                className="flex-1 bg-transparent text-[#555] placeholder:text-[#888] text-[13.5px] px-3 py-2 outline-none"
              />
              <button
                type="submit"
                className="bg-brand text-white text-[13px] font-semibold px-4 py-2 rounded-md cursor-pointer transition-colors hover:bg-brand-dark"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Divider + Copyright */}
        <div className="mt-12 pt-5 border-t border-white/25 text-center">
          <p className="text-white/90 text-[14px]">
            ©2025 University of Central Punjab All Rights Reserved.
          </p>
        </div>

      </div>
    </footer>
  )
}
