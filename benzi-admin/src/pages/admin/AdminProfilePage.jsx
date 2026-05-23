import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPanel from '../../components/AdminPanel.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AdminProfilePage() {
  const { user } = useAuth()

  return (
    <AdminLayout activeItem="Profile" title="Profile">
      <AdminPanel>
        <p className="text-sm text-[#556b5b]">Signed in as admin.</p>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-[11px] uppercase text-[#7d8b7d] font-semibold">Name</dt>
            <dd className="font-semibold text-[#0f3a2b]">
              {user?.firstName} {user?.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-[#7d8b7d] font-semibold">Email</dt>
            <dd className="text-[#3f4f41]">{user?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-[#7d8b7d] font-semibold">Role</dt>
            <dd className="text-[#3f4f41] capitalize">{user?.role || 'admin'}</dd>
          </div>
        </dl>
      </AdminPanel>
    </AdminLayout>
  )
}
