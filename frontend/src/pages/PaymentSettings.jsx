import { useState, useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useAuthContext } from '../contexts/AuthContext'
import { 
  CreditCard, 
  Upload, 
  Save, 
  X, 
  QrCode, 
  Smartphone,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const PaymentSettings = () => {
  const { getToken } = useAuth()
  const { user } = useUser()
  const { vendor, setVendor } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [uploadingQR, setUploadingQR] = useState(false)
  const [qrPreview, setQrPreview] = useState(null)
  const fileInputRef = useRef(null)
  
  const [paymentData, setPaymentData] = useState({
    upiId: '',
    qrCodeUrl: '',
    paymentEnabled: false
  })

  useEffect(() => {
    if (vendor) {
      setPaymentData({
        upiId: vendor.upiId || '',
        qrCodeUrl: vendor.qrCodeUrl || '',
        paymentEnabled: vendor.paymentEnabled || false
      })
      if (vendor.qrCodeUrl) {
        setQrPreview(vendor.qrCodeUrl)
      }
    }
  }, [vendor])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setPaymentData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
        setQrPreview(e.target.result)
      }
      reader.readAsDataURL(file)

      // Upload file
      uploadQRCode(file)
    }
  }

  const uploadQRCode = async (file) => {
    setUploadingQR(true)
    try {
      const formData = new FormData()
      formData.append('qrCode', file)

      const token = await getToken()
      const response = await api.post('/vendors/upload-qr', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setPaymentData(prev => ({
        ...prev,
        qrCodeUrl: response.data.qrCodeUrl
      }))

      toast.success('QR code uploaded successfully!')
    } catch (error) {
      console.error('Error uploading QR code:', error)
      toast.error('Failed to upload QR code. Please try again.')
      setQrPreview(null)
    } finally {
      setUploadingQR(false)
    }
  }

  const removeQRCode = () => {
    setQrPreview(null)
    setPaymentData(prev => ({
      ...prev,
      qrCodeUrl: ''
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = await getToken()
      const response = await api.put('/vendors/payment-settings', paymentData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setVendor(response.data)
      toast.success('Payment settings updated successfully!')
    } catch (error) {
      console.error('Error updating payment settings:', error)
      toast.error('Failed to update payment settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const validateUPI = (upiId) => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
    return upiRegex.test(upiId)
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Settings</h1>
          <p className="text-gray-600">Configure your payment methods to receive payments from customers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* UPI Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">UPI Settings</h2>
                <p className="text-sm text-gray-600">Configure your UPI ID for digital payments</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* UPI ID Input */}
              <div>
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID
                </label>
                <input
                  type="text"
                  id="upiId"
                  name="upiId"
                  value={paymentData.upiId}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    paymentData.upiId && !validateUPI(paymentData.upiId)
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="yourname@paytm"
                />
                {paymentData.upiId && !validateUPI(paymentData.upiId) && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Please enter a valid UPI ID</span>
                  </div>
                )}
                {paymentData.upiId && validateUPI(paymentData.upiId) && (
                  <div className="flex items-center gap-2 mt-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Valid UPI ID</span>
                  </div>
                )}
              </div>

              {/* Payment Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Enable Digital Payments</h3>
                  <p className="text-sm text-gray-600">Allow customers to pay using UPI</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="paymentEnabled"
                    checked={paymentData.paymentEnabled}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </form>
          </div>

          {/* QR Code Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <QrCode className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">QR Code</h2>
                <p className="text-sm text-gray-600">Upload your payment QR code</p>
              </div>
            </div>

            {/* QR Code Upload Area */}
            <div className="space-y-4">
              {qrPreview ? (
                <div className="relative">
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                    <img
                      src={qrPreview}
                      alt="QR Code Preview"
                      className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                    />
                  </div>
                  <button
                    onClick={removeQRCode}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Upload QR Code</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                    {uploadingQR && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!qrPreview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingQR}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </button>
              )}
            </div>

            {/* QR Code Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How to get your QR code:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Open your UPI app (PhonePe, GPay, Paytm, etc.)</li>
                <li>• Go to "Receive Money" or "My QR"</li>
                <li>• Take a screenshot of your QR code</li>
                <li>• Upload the screenshot here</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading || uploadingQR}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Payment Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSettings
