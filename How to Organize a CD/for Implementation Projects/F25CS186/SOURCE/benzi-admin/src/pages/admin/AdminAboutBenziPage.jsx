import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPanel from '../../components/AdminPanel.jsx'

export default function AdminAboutBenziPage() {
  return (
    <AdminLayout activeItem="About Benzi" title="About BENZI">
      <AdminPanel>
        <p className="text-sm text-[#556b5b] leading-relaxed">
          BENZI is a mental wellness platform connecting patients and therapists with
          context-aware AI, appointment booking, subscriptions, and secure messaging.
        </p>
        <p className="mt-4 text-[12px] text-[#7d8b7d]">
          Use the sidebar to manage doctors, verifications, subscriptions, and revenue from this
          admin portal.
        </p>
      </AdminPanel>
    </AdminLayout>
  )
}
