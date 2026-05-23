import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import AboutPage from './pages/AboutPage'
import MeditationCounselor from './pages/MeditationCounselor'
import ResourcesPage from './pages/ResourcesPage'
import SubscriptionPage from './pages/SubscriptionPage'
import FaqsPage from './pages/FaqsPage'
import ContactUsPage from './pages/ContactUsPage'
import DoctorsPage from './pages/DoctorsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ChangePasswordForcePage from './pages/ChangePasswordForcePage'
import Login2FAPage from './pages/Login2FAPage'
import TherapistProfilePage from './pages/therapist/TherapistProfilePage'
import TherapistDashboard from './pages/therapist/TherapistDashboard'
import TherapistVerificationPage from './pages/therapist/TherapistVerificationPage'
import TherapistAvailabilityPage from './pages/therapist/TherapistAvailabilityPage'
import TherapistAppointmentsPage from './pages/therapist/TherapistAppointmentsPage'
import TherapistClientsPage from './pages/therapist/TherapistClientsPage'
import TherapistServicesPage from './pages/therapist/TherapistServicesPage'
import TherapistSubscriptionPage from './pages/therapist/TherapistSubscriptionPage'
import TherapistCheckoutPage from './pages/therapist/TherapistCheckoutPage'
import TherapistCheckoutSuccessPage from './pages/therapist/TherapistCheckoutSuccessPage'
import TherapistPaymentPage from './pages/therapist/TherapistPaymentPage'
import TherapistAboutBenziPage from './pages/therapist/TherapistAboutBenziPage'
import TherapistReportsPage from './pages/therapist/TherapistReportsPage'
import TherapistChatPage from './pages/therapist/TherapistChatPage'
import TherapistHelpSupportPage from './pages/therapist/TherapistHelpSupportPage'
import PatientProfilePage from './pages/patient/PatientProfilePage'
import PatientDashboard from './pages/patient/PatientDashboard'
import PatientGoalsPage from './pages/patient/PatientGoalsPage'
import PatientProgressPage from './pages/patient/PatientProgressPage'
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage'
import PatientHelpSupportPage from './pages/patient/PatientHelpSupportPage'
import PatientConversationPage from './pages/patient/PatientConversationPage'
import PatientReportsPage from './pages/patient/PatientReportsPage'
import PatientChatPage from './pages/patient/PatientChatPage'
import AuthPage from './pages/AuthPage'
import RoleRoute from './components/RoleRoute.jsx'
import PageLoader from './components/PageLoader.jsx'

function App() {
  return (
    <>
      <Navbar />
      <PageLoader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/meditation-counselor" element={<MeditationCounselor />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/contact-us" element={<ContactUsPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/change-password-force" element={<ChangePasswordForcePage />} />
        <Route path="/login-2fa" element={<Login2FAPage />} />
        <Route path="/therapist-verification" element={<RoleRoute allow={['therapist']}><TherapistVerificationPage /></RoleRoute>} />
        <Route path="/therapist-dashboard" element={<RoleRoute allow={['therapist']}><TherapistDashboard /></RoleRoute>} />
        <Route path="/therapist-availability" element={<RoleRoute allow={['therapist']}><TherapistAvailabilityPage /></RoleRoute>} />
        <Route path="/therapist-appointments" element={<RoleRoute allow={['therapist']}><TherapistAppointmentsPage /></RoleRoute>} />
        <Route path="/therapist-clients" element={<RoleRoute allow={['therapist']}><TherapistClientsPage /></RoleRoute>} />
        <Route path="/therapist-services" element={<RoleRoute allow={['therapist']}><TherapistServicesPage /></RoleRoute>} />
        <Route path="/therapist-subscription" element={<RoleRoute allow={['therapist']}><TherapistSubscriptionPage /></RoleRoute>} />
        <Route path="/therapist-checkout" element={<TherapistCheckoutPage />} />
        <Route path="/checkout" element={<TherapistCheckoutPage />} />
        <Route path="/therapist-checkout/success" element={<TherapistCheckoutSuccessPage />} />
        <Route path="/therapist-payment" element={<RoleRoute allow={['therapist']}><TherapistPaymentPage /></RoleRoute>} />
        <Route path="/therapist-about" element={<RoleRoute allow={['therapist']}><TherapistAboutBenziPage /></RoleRoute>} />
        <Route path="/therapist-reports" element={<RoleRoute allow={['therapist']}><TherapistReportsPage /></RoleRoute>} />
        <Route path="/therapist-chat" element={<RoleRoute allow={['therapist']}><TherapistChatPage /></RoleRoute>} />
        <Route path="/therapist-profile" element={<RoleRoute allow={['therapist']}><TherapistProfilePage /></RoleRoute>} />
        <Route path="/therapist-help-support" element={<RoleRoute allow={['therapist']}><TherapistHelpSupportPage /></RoleRoute>} />
        <Route path="/patient-profile" element={<RoleRoute allow={['patient']}><PatientProfilePage /></RoleRoute>} />
        <Route path="/patient-dashboard" element={<RoleRoute allow={['patient']}><PatientDashboard /></RoleRoute>} />
        <Route path="/patient-goals" element={<RoleRoute allow={['patient']}><PatientGoalsPage /></RoleRoute>} />
        <Route path="/patient-progress" element={<RoleRoute allow={['patient']}><PatientProgressPage /></RoleRoute>} />
        <Route path="/patient-appointments" element={<RoleRoute allow={['patient']}><PatientAppointmentsPage /></RoleRoute>} />
        <Route path="/patient-help-support" element={<RoleRoute allow={['patient']}><PatientHelpSupportPage /></RoleRoute>} />
        <Route path="/patient-conversation" element={<RoleRoute allow={['patient']}><PatientConversationPage /></RoleRoute>} />
        <Route path="/patient-chat" element={<RoleRoute allow={['patient']}><PatientChatPage /></RoleRoute>} />
        <Route path="/patient-reports" element={<RoleRoute allow={['patient']}><PatientReportsPage /></RoleRoute>} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
