import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Settings, User, CreditCard, LogOut, ChevronDown } from 'lucide-react'

const SettingsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { signOut } = useAuth()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = () => {
    signOut()
    setIsOpen(false)
  }

  const menuItems = [
    {
      label: 'Profile Settings',
      icon: User,
      href: '/settings/profile',
      action: () => setIsOpen(false)
    },
    {
      label: 'Payment Settings',
      icon: CreditCard,
      href: '/settings/payment',
      action: () => setIsOpen(false)
    },
    {
      label: 'Logout',
      icon: LogOut,
      href: null,
      action: handleSignOut,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    }
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isOpen
            ? 'bg-blue-50 text-blue-600 shadow-md'
            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
        }`}
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:block">Settings</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Account Settings</p>
          </div>
          
          {menuItems.map((item, index) => {
            const IconComponent = item.icon
            
            if (item.href) {
              return (
                <Link
                  key={index}
                  to={item.href}
                  onClick={item.action}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-gray-50 ${
                    item.className || 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            } else {
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-gray-50 ${
                    item.className || 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {item.label}
                </button>
              )
            }
          })}
        </div>
      )}
    </div>
  )
}

export default SettingsDropdown
