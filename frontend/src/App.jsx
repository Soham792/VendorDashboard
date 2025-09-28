import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import MenuManagement from './pages/MenuManagement'
import Orders from './pages/Orders'
import Subscriptions from './pages/Subscriptions'
import DeliveryStaff from './pages/DeliveryStaff'
import DeliveryPortal from './pages/DeliveryPortal'
import ProfileSettings from './pages/ProfileSettings'
import PaymentSettings from './pages/PaymentSettings'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <LoginPage />
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Delivery Portal - standalone route without Layout */}
          <Route path="/delivery-portal" element={<DeliveryPortal />} />
          
          {/* Main vendor app routes with Layout */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/menus" element={<Layout><MenuManagement /></Layout>} />
          <Route path="/orders" element={<Layout><Orders /></Layout>} />
          <Route path="/subscriptions" element={<Layout><Subscriptions /></Layout>} />
          <Route path="/delivery-staff" element={<Layout><DeliveryStaff /></Layout>} />
          <Route path="/settings/profile" element={<Layout><ProfileSettings /></Layout>} />
          <Route path="/settings/payment" element={<Layout><PaymentSettings /></Layout>} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  )
}

export default App
