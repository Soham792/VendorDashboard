import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import api from '../utils/api'
import { Plus, Edit, Trash2, Phone, MapPin, Truck, User } from 'lucide-react'
import toast from 'react-hot-toast'

const DeliveryStaff = () => {
  const { getToken } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    vehicleType: 'bike',
    licenseNumber: '',
    assignedZone: '',
    isActive: true
  })

  const vehicleTypes = [
    { value: 'bike', label: 'Bike' },
    { value: 'scooter', label: 'Scooter' },
    { value: 'cycle', label: 'Cycle' },
    { value: 'car', label: 'Car' }
  ]

  const zones = [
    'Zone A - North',
    'Zone B - South', 
    'Zone C - East',
    'Zone D - West',
    'Zone E - Central'
  ]

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const token = await getToken()
      const response = await api.get('/delivery-staff', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStaff(response.data)
    } catch (error) {
      console.error('Error fetching delivery staff:', error)
      toast.error('Failed to fetch delivery staff')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const url = editingStaff ? `/delivery-staff/${editingStaff._id}` : '/delivery-staff'
      const method = editingStaff ? 'put' : 'post'

      const response = await api[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success(editingStaff ? 'Staff member updated successfully' : 'Staff member added successfully')
      
      setShowModal(false)
      setEditingStaff(null)
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        vehicleType: 'bike',
        licenseNumber: '',
        assignedZone: '',
        isActive: true
      })
      fetchStaff()
    } catch (error) {
      console.error('Error saving staff member:', error)
      toast.error('Failed to save staff member')
    }
  }

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember)
    setFormData({
      name: staffMember.name || '',
      phone: staffMember.phone || '',
      email: staffMember.email || '',
      address: staffMember.address || '',
      vehicleType: staffMember.vehicleType || 'bike',
      licenseNumber: staffMember.licenseNumber || '',
      assignedZone: staffMember.assignedZone || '',
      isActive: staffMember.isActive !== undefined ? staffMember.isActive : true
    })
    setShowModal(true)
  }

  const handleDelete = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return

    try {
      const token = await getToken()
      await api.delete(`/delivery-staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Staff member deleted successfully')
      fetchStaff()
    } catch (error) {
      console.error('Error deleting staff member:', error)
      toast.error('Failed to delete staff member')
    }
  }

  const toggleActive = async (staffMember) => {
    try {
      const token = await getToken()
      await api.put(`/delivery-staff/${staffMember._id}`, 
        { isActive: !staffMember.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Staff member ${!staffMember.isActive ? 'activated' : 'deactivated'} successfully`)
      fetchStaff()
    } catch (error) {
      console.error('Error updating staff status:', error)
      toast.error('Failed to update staff status')
    }
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="section-header">Delivery Staff</h1>
          <p className="section-subtitle">Manage your delivery team members</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-3"
        >
          <Plus className="h-5 w-5" />
          Add Staff Member
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((staffMember) => (
          <div key={staffMember._id} className={`card ${!staffMember.isActive ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-4 shadow-lg">
                  <User className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{staffMember.name}</h3>
                  <p className="text-sm text-gray-600 capitalize font-medium">{staffMember.vehicleType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(staffMember)}
                  className={`status-badge ${
                    staffMember.isActive 
                      ? 'status-active' 
                      : 'status-inactive'
                  }`}
                >
                  {staffMember.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleEdit(staffMember)}
                  className="icon-button icon-button-edit"
                  title="Edit"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(staffMember._id)}
                  className="icon-button icon-button-delete"
                  title="Delete"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center text-gray-700 bg-gray-50 rounded-lg p-3">
                <Phone className="h-5 w-5 mr-3 text-blue-600" />
                <span className="font-medium">{staffMember.phone}</span>
              </div>
              
              {staffMember.email && (
                <div className="flex items-center text-gray-700 bg-gray-50 rounded-lg p-3">
                  <span className="mr-3 text-blue-600 font-bold">@</span>
                  <span className="font-medium">{staffMember.email}</span>
                </div>
              )}
              
              {staffMember.temporaryPassword && (
                <div className="password-card">
                  <div className="font-bold text-amber-800 mb-2 flex items-center">
                    <span className="h-2 w-2 bg-amber-500 rounded-full mr-2"></span>
                    Login Password
                  </div>
                  <div className="password-text">
                    {staffMember.temporaryPassword}
                  </div>
                  <div className="text-amber-700 text-xs mt-2 font-medium">
                    💡 Share this with the staff member for delivery portal access
                  </div>
                </div>
              )}
              
              <div className="flex items-center text-gray-700 bg-gray-50 rounded-lg p-3">
                <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                <span className="font-medium">{staffMember.assignedZone || 'No zone assigned'}</span>
              </div>
              
              {staffMember.licenseNumber && (
                <div className="flex items-center text-gray-700 bg-gray-50 rounded-lg p-3">
                  <Truck className="h-5 w-5 mr-3 text-blue-600" />
                  <span className="font-medium">License: {staffMember.licenseNumber}</span>
                </div>
              )}
            </div>

            {staffMember.address && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-start text-blue-800">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{staffMember.address}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                <span className="font-medium">Added:</span> {new Date(staffMember.createdAt).toLocaleDateString()}
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                {staffMember.assignedOrders || 0} orders
              </div>
            </div>
          </div>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="text-center py-16">
          <div className="card-glass max-w-md mx-auto">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
              <Truck className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No delivery staff found</h3>
            <p className="text-gray-600 mb-6">Add your first delivery staff member to get started with deliveries.</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Add First Staff Member
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold gradient-text mb-2">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h2>
              <p className="text-gray-600">
                {editingStaff ? 'Update staff member information' : 'Add a new delivery team member'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="input-field"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                    className="input-field"
                  >
                    {vehicleTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">License Number</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Assigned Zone</label>
                <select
                  value={formData.assignedZone}
                  onChange={(e) => setFormData({...formData, assignedZone: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select Zone</option>
                  {zones.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
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
                  Active staff member
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingStaff(null)
                    setFormData({
                      name: '',
                      phone: '',
                      email: '',
                      address: '',
                      vehicleType: 'bike',
                      licenseNumber: '',
                      assignedZone: '',
                      isActive: true
                    })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingStaff ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryStaff
