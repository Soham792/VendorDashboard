import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useAuthContext } from '../contexts/AuthContext'
import api from '../utils/api'
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const Dashboard = () => {
  const { getToken } = useAuth()
  const { vendor } = useAuthContext()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeSubscriptions: 0,
    deliveryStaff: 0,
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  })
  const [revenueData, setRevenueData] = useState([])
  const [orderData, setOrderData] = useState([])
  const [popularDishes, setPopularDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true)
      }
      
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [statsRes, revenueRes, ordersRes, dishesRes] = await Promise.all([
        api.get('/dashboard/stats', { headers }),
        api.get('/dashboard/revenue', { headers }),
        api.get('/dashboard/orders', { headers }),
        api.get('/dashboard/popular-dishes', { headers })
      ])

      setStats(statsRes.data)
      setRevenueData(revenueRes.data)
      setOrderData(ordersRes.data)
      setPopularDishes(dishesRes.data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchDashboardData()

    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval)
  }, [getToken])

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {vendor?.businessName || 'Vendor'}!</p>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeSubscriptions || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Delivery Staff</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.deliveryStaff || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
              <p className="text-xl font-semibold text-gray-900">₹{(stats.todayRevenue || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Orders</p>
              <p className="text-xl font-semibold text-gray-900">{stats.completedOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <p className="text-xl font-semibold text-gray-900">{stats.pendingOrders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Dishes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Dishes</h3>
        {popularDishes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularDishes.map((dish, index) => (
              <div key={dish._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{dish.name}</p>
                  <p className="text-sm text-gray-500">{dish.orders} orders</p>
                </div>
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">₹{dish.price}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No order data available yet. Popular dishes will appear here once you start receiving orders.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
