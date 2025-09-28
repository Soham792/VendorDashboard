import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth, UserButton, useUser } from '@clerk/clerk-react'
import { useAuthContext } from '../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Menu, 
  ShoppingBag, 
  Users, 
  Truck, 
  LogOut,
  X,
  User
} from 'lucide-react'

const Layout = ({ children }) => {
  const { signOut } = useAuth()
  const { user } = useUser()
  const { vendor } = useAuthContext()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Manage Menus', href: '/menus', icon: Menu },
    { name: 'Orders', href: '/orders', icon: ShoppingBag },
    { name: 'Subscriptions', href: '/subscriptions', icon: Users },
    { name: 'Delivery Staff', href: '/delivery-staff', icon: Truck },
  ]

  const handleSignOut = () => {
    signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white/95 backdrop-blur-md border-r border-white/20">
          <div className="flex h-20 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              {/* Mobile Profile Picture */}
              {user?.imageUrl || vendor?.profilePicture ? (
                <img 
                  src={user?.imageUrl || vendor?.profilePicture} 
                  alt="Profile" 
                  className="h-10 w-10 rounded-xl shadow-lg object-cover border-2 border-white"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold gradient-text">NourishNet</h1>
                <p className="text-xs text-gray-600">
                  {user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Vendor'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="icon-button text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-white/60 hover:text-blue-600 hover:shadow-md'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/95 backdrop-blur-md border-r border-white/20 shadow-2xl">
          <div className="flex h-20 items-center px-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text">NourishNet</h1>
              <p className="text-sm text-gray-600">Vendor Dashboard</p>
            </div>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-white/60 hover:text-blue-600 hover:shadow-md hover:scale-105'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
          <div className="flex h-20 items-center justify-between px-6 sm:px-8 lg:px-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="icon-button text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                {/* Clerk UserButton (circular profile picture) */}
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-12 w-12",
                      userButtonPopoverCard: "shadow-2xl border border-gray-200",
                      userButtonPopoverActions: "bg-white"
                    }
                  }}
                  showName={false}
                />
                
                {/* User Info */}
                <div className="hidden sm:block">
                  <p className="text-lg font-bold text-gray-900">
                    {vendor?.businessName || user?.fullName || 'Vendor'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {user?.primaryEmailAddress?.emailAddress || vendor?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
