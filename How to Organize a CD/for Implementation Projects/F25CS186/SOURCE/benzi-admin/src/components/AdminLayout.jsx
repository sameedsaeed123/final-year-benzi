import AdminSidebar from './AdminSidebar.jsx'
import AdminTopBar from './AdminTopBar.jsx'

/**
 * Shell: top navbar (logo, website, logout) + right sidebar + main content.
 */
export default function AdminLayout({ children, activeItem = 'Dashboard', title }) {
  return (
    <div className="min-h-screen bg-cream">
      <AdminTopBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_260px] max-xl:grid-cols-1 items-start">
          <main className="min-w-0 space-y-6 order-2 xl:order-1">
            {title && (
              <h1 className="text-[22px] sm:text-[26px] font-extrabold text-[#0f3a2b]">{title}</h1>
            )}
            {children}
          </main>
          <div className="order-1 xl:order-2">
            <AdminSidebar activeItem={activeItem} />
          </div>
        </div>
      </div>
    </div>
  )
}
