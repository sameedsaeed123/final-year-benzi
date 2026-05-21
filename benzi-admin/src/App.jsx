import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminDoctorsPage from './pages/admin/AdminDoctorsPage'
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage'
import AdminPatientsPage from './pages/admin/AdminPatientsPage'
import AdminRevenuePage from './pages/admin/AdminRevenuePage'
import AdminVerificationsPage from './pages/admin/AdminVerificationsPage'
import AdminCustomerSupportPage from './pages/admin/AdminCustomerSupportPage'
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage'

import RoleRoute from './components/RoleRoute.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      <Route path="/admin-dashboard" element={<RoleRoute allow={['admin']}><AdminDashboard /></RoleRoute>} />
      <Route path="/admin-doctors" element={<RoleRoute allow={['admin']}><AdminDoctorsPage /></RoleRoute>} />
      <Route path="/admin-subscriptions" element={<RoleRoute allow={['admin']}><AdminSubscriptionsPage /></RoleRoute>} />
      <Route path="/admin-patients" element={<RoleRoute allow={['admin']}><AdminPatientsPage /></RoleRoute>} />
      <Route path="/admin-appointments" element={<RoleRoute allow={['admin']}><AdminAppointmentsPage /></RoleRoute>} />
      <Route path="/admin-revenue" element={<RoleRoute allow={['admin']}><AdminRevenuePage /></RoleRoute>} />
      <Route path="/admin-verifications" element={<RoleRoute allow={['admin']}><AdminVerificationsPage /></RoleRoute>} />
      <Route path="/admin-customer-support" element={<RoleRoute allow={['admin']}><AdminCustomerSupportPage /></RoleRoute>} />

      
      <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
    </Routes>
  )
}

export default App

