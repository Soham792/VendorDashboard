import { useState, useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useAuthContext } from '../contexts/AuthContext'
import { User, Building, Mail, Phone, MapPin, Save, Upload, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const ProfileSettings = () => {
  const { getToken } = useAuth()
  const { user } = useUser()
  const { vendor, setVendor, refreshVendor } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    description: ''
  })

  useEffect(() => {
    if (vendor) {
      setFormData({
        businessName: vendor.businessName || '',
        ownerName: vendor.ownerName || user?.fullName || '',
        email: vendor.email || user?.primaryEmailAddress?.emailAddress || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        description: vendor.description || ''
      })
      
      // Set profile picture preview
      if (vendor.profilePicture) {
        setProfilePicturePreview(vendor.profilePicture)
      } else if (user?.imageUrl) {
        setProfilePicturePreview(user.imageUrl)
      }
    }
  }, [vendor, user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result)
      }
      reader.readAsDataURL(file)

      // Upload file
      uploadProfilePicture(file)
    }
  }

  const uploadProfilePicture = async (file) => {
    setUploadingPicture(true)
    try {
      const formData = new FormData()
      formData.append('profilePicture', file)

      const token = await getToken()
      const response = await api.post('/vendors/upload-profile-picture', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      // Update the preview immediately for instant feedback
      setProfilePicturePreview(response.data.profilePictureUrl)
      
      console.log('Profile picture uploaded successfully:', response.data.profilePictureUrl.substring(0, 50) + '...')
      
      // Refresh vendor data from server to ensure consistency
      await refreshVendor()

      toast.success('Profile picture updated successfully!')
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      toast.error('Failed to upload profile picture. Please try again.')
      // Reset preview on error
      if (vendor?.profilePicture) {
        setProfilePicturePreview(vendor.profilePicture)
      } else if (user?.imageUrl) {
        setProfilePicturePreview(user.imageUrl)
      } else {
        setProfilePicturePreview(null)
      }
    } finally {
      setUploadingPicture(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = await getToken()
      const response = await api.put('/vendors/me', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setVendor(response.data)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your business profile and personal information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Picture</h2>
              
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {profilePicturePreview ? (
                    <img 
                      src={profilePicturePreview} 
                      alt="Profile" 
                      className="h-32 w-32 rounded-full shadow-lg object-cover border-4 border-white"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg">
                      <User className="h-16 w-16 text-blue-600" />
                    </div>
                  )}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPicture}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingPicture ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingPicture ? 'Uploading...' : 'Upload New Photo'}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Information Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Name */}
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="inline h-4 w-4 mr-1" />
                      Business Name
                    </label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your business name"
                    />
                  </div>

                  {/* Owner Name */}
                  <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline h-4 w-4 mr-1" />
                      Owner Name
                    </label>
                    <input
                      type="text"
                      id="ownerName"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter owner name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Business Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Enter your business address"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell customers about your business..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings
