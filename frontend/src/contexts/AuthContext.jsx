import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const { getToken, userId } = useAuth()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVendor = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const token = await getToken()
        const response = await api.get('/vendors/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        setVendor(response.data)
      } catch (error) {
        console.error('Error fetching vendor:', error)
        // If vendor doesn't exist, create one
        try {
          const token = await getToken()
          const response = await api.post('/vendors', {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          setVendor(response.data)
        } catch (createError) {
          console.error('Error creating vendor:', createError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchVendor()
  }, [userId, getToken])

  const value = {
    vendor,
    setVendor,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
