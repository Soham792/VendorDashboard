import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import api from '../utils/api'
import { Plus, Edit, Pause, Play, X, Users, Calendar, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const Subscriptions = () => {
  const { getToken } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [formData, setFormData] = useState({
    planName: '',
    description: '',
    price: '',
    duration: 'monthly',
    features: [],
    isActive: true
  })

  const durationOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const token = await getToken()
      const response = await api.get('/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubscriptions(response.data)
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      toast.error('Failed to fetch subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const url = editingSubscription ? `/subscriptions/${editingSubscription._id}` : '/subscriptions'
      const method = editingSubscription ? 'put' : 'post'

      await api[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success(editingSubscription ? 'Subscription plan updated successfully' : 'Subscription plan created successfully')
      setShowModal(false)
      setEditingSubscription(null)
      setFormData({
        planName: '',
        description: '',
        price: '',
        duration: 'monthly',
        features: [],
        isActive: true
      })
      fetchSubscriptions()
    } catch (error) {
      console.error('Error saving subscription:', error)
      toast.error('Failed to save subscription plan')
    }
  }

  const handleEdit = (subscription) => {
    setEditingSubscription(subscription)
    setFormData({
      planName: subscription.planName,
      description: subscription.description,
      price: subscription.price.toString(),
      duration: subscription.duration,
      features: subscription.features || [],
      isActive: subscription.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return

    try {
      const token = await getToken()
      await api.delete(`/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Subscription plan deleted successfully')
      fetchSubscriptions()
    } catch (error) {
      console.error('Error deleting subscription:', error)
      toast.error('Failed to delete subscription plan')
    }
  }

  const toggleActive = async (subscription) => {
    try {
      const token = await getToken()
      await api.put(`/subscriptions/${subscription._id}`, 
        { isActive: !subscription.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Subscription plan ${!subscription.isActive ? 'activated' : 'deactivated'} successfully`)
      fetchSubscriptions()
    } catch (error) {
      console.error('Error updating subscription status:', error)
      toast.error('Failed to update subscription status')
    }
  }

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    })
  }

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({ ...formData, features: newFeatures })
  }

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: newFeatures })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Plan
        </button>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptions.map((subscription) => (
          <div key={subscription._id} className={`card ${!subscription.isActive ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{subscription.planName}</h3>
                <p className="text-sm text-gray-500 capitalize">{subscription.duration}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleActive(subscription)}
                  className={`p-1 rounded ${
                    subscription.isActive 
                      ? 'text-green-600 hover:bg-green-100' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={subscription.isActive ? 'Active' : 'Inactive'}
                >
                  {subscription.isActive ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleEdit(subscription)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(subscription._id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="Delete"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{subscription.description}</p>
            
            <div className="mb-4">
              <span className="text-3xl font-bold text-primary-600">₹{subscription.price}</span>
              <span className="text-gray-500 text-sm">/{subscription.duration}</span>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
              <ul className="space-y-1">
                {subscription.features?.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {subscription.subscriberCount || 0} subscribers
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(subscription.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingSubscription ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Plan Name</label>
                <input
                  type="text"
                  value={formData.planName}
                  onChange={(e) => setFormData({...formData, planName: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input-field"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="input-field"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="label">Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="input-field"
                  >
                    {durationOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Features</label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="input-field flex-1"
                        placeholder="Enter feature"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active plan
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingSubscription(null)
                    setFormData({
                      planName: '',
                      description: '',
                      price: '',
                      duration: 'monthly',
                      features: [],
                      isActive: true
                    })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSubscription ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Subscriptions
