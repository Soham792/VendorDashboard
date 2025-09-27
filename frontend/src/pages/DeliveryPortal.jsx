import { useState, useEffect } from 'react'
import api from '../utils/api'
import { MapPin, Package, Clock, Phone, User, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

const DeliveryPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [staff, setStaff] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [loginData, setLoginData] = useState({
    phone: '',
    password: ''
  })

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('delivery_token')
    const staffData = localStorage.getItem('delivery_staff')
    if (token && staffData) {
      setIsLoggedIn(true)
      setStaff(JSON.parse(staffData))
      fetchAssignments()
      startLocationTracking()
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/delivery/login', loginData)
      const { token, staff: staffData } = response.data
      
      localStorage.setItem('delivery_token', token)
      localStorage.setItem('delivery_staff', JSON.stringify(staffData))
      
      setIsLoggedIn(true)
      setStaff(staffData)
      toast.success('Login successful!')
      
      fetchAssignments()
      startLocationTracking()
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Invalid phone or password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('delivery_token')
    localStorage.removeItem('delivery_staff')
    setIsLoggedIn(false)
    setStaff(null)
    setAssignments([])
    stopLocationTracking()
    toast.success('Logged out successfully')
  }

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('delivery_token')
      const response = await api.get('/delivery/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAssignments(response.data)
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast.error('Failed to fetch assignments')
    }
  }

  let locationInterval = null

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    // Update location every 30 seconds
    locationInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const token = localStorage.getItem('delivery_token')
            await api.post('/delivery/location', {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }, {
              headers: { Authorization: `Bearer ${token}` }
            })
          } catch (error) {
            console.error('Error updating location:', error)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }, 30000) // 30 seconds

    // Initial location update
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const token = localStorage.getItem('delivery_token')
          await api.post('/delivery/location', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
          toast.success('Location tracking started')
        } catch (error) {
          console.error('Error updating location:', error)
        }
      }
    )
  }

  const stopLocationTracking = () => {
    if (locationInterval) {
      clearInterval(locationInterval)
      locationInterval = null
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Delivery Portal
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to access your delivery assignments
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="sr-only">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Phone Number"
                  value={loginData.phone}
                  onChange={(e) => setLoginData({...loginData, phone: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Delivery Portal</h1>
                <p className="text-sm text-gray-500">Welcome, {staff?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Staff Info Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                  <User className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{staff?.name}</h3>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <Phone className="h-4 w-4 mr-1" />
                    {staff?.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">Vehicle: {staff?.vehicleType}</div>
                  <div className="text-sm text-gray-500">Zone: {staff?.assignedZone || 'Not assigned'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Status */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-green-800">Location tracking is active</span>
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Your Assignments
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Current delivery assignments
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {assignments.length === 0 ? (
                <li className="px-4 py-4 text-center text-gray-500">
                  No assignments at the moment
                </li>
              ) : (
                assignments.map((assignment) => (
                  <li key={assignment._id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Order #{assignment._id?.slice(-6)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {assignment.customerName || 'Customer'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(assignment.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    {assignment.deliveryAddress && (
                      <div className="mt-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        {assignment.deliveryAddress}
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryPortal
