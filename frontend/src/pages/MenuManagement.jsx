import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import api from '../utils/api'
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const MenuManagement = () => {
  const { getToken } = useAuth()
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main',
    mealType: 'breakfast',
    availability: 'daily',
    startDate: '',
    endDate: '',
    isPublished: false
  })

  const categories = [
    { value: 'main', label: 'Main Course' },
    { value: 'side', label: 'Side Dish' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'beverage', label: 'Beverage' }
  ]

  const availabilityTypes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'custom', label: 'Custom Date Range' }
  ]

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      const token = await getToken()
      const response = await api.get('/menus', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMenus(response.data)
    } catch (error) {
      console.error('Error fetching menus:', error)
      toast.error('Failed to fetch menus')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const url = editingMenu ? `/menus/${editingMenu._id}` : '/menus'
      const method = editingMenu ? 'put' : 'post'

      await api[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success(editingMenu ? 'Menu updated successfully' : 'Menu created successfully')
      setShowModal(false)
      setEditingMenu(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'main',
        mealType: 'breakfast',
        availability: 'daily',
        startDate: '',
        endDate: '',
        isPublished: false
      })
      fetchMenus()
    } catch (error) {
      console.error('Error saving menu:', error)
      toast.error('Failed to save menu')
    }
  }

  const handleEdit = (menu) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      description: menu.description,
      price: menu.price.toString(),
      category: menu.category,
      mealType: menu.mealType || 'breakfast',
      availability: menu.availability,
      startDate: menu.startDate || '',
      endDate: menu.endDate || '',
      isPublished: menu.isPublished
    })
    setShowModal(true)
  }

  const handleDelete = async (menuId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return

    try {
      const token = await getToken()
      await api.delete(`/menus/${menuId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Menu deleted successfully')
      fetchMenus()
    } catch (error) {
      console.error('Error deleting menu:', error)
      toast.error('Failed to delete menu')
    }
  }

  const togglePublish = async (menu) => {
    try {
      const token = await getToken()
      await api.put(`/menus/${menu._id}`, 
        { isPublished: !menu.isPublished },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Menu ${!menu.isPublished ? 'published' : 'unpublished'} successfully`)
      fetchMenus()
    } catch (error) {
      console.error('Error updating menu status:', error)
      toast.error('Failed to update menu status')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
          <h1 className="section-header">Menu Management</h1>
          <p className="section-subtitle">Organize your menu by meal times</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-3"
        >
          <Plus className="h-5 w-5" />
          Add Menu Item
        </button>
      </div>

      {/* Menu Grid */}
      {/* Sections by Meal Type */}
      {['breakfast','lunch','dinner'].map((section) => (
        <div key={section} className="mb-12">
          <div className="flex items-center mb-6">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-4"></div>
            <h2 className="text-3xl font-bold capitalize gradient-text">{section}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menus.filter(m => (m.mealType || 'breakfast') === section).map((menu) => (
              <div key={menu._id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{menu.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{menu.category}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => togglePublish(menu)}
                      className={`p-1 rounded ${
                        menu.isPublished 
                          ? 'text-green-600 hover:bg-green-100' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={menu.isPublished ? 'Published' : 'Unpublished'}
                    >
                      {menu.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(menu)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(menu._id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{menu.description}</p>

                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-primary-600">₹{menu.price}</span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {menu.availability === 'daily' ? 'Daily' : 
                     menu.availability === 'weekly' ? 'Weekly' : 'Custom'}
                  </div>
                </div>

                {menu.startDate && menu.endDate && (
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(menu.startDate).toLocaleDateString()} - {new Date(menu.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
            {menus.filter(m => (m.mealType || 'breakfast') === section).length === 0 && (
              <div className="text-gray-500 text-sm">No items in this section yet.</div>
            )}
          </div>
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingMenu ? 'Edit Menu Item' : 'Add Menu Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Dish Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                  <label className="label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="input-field"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Meal Type</label>
                <select
                  value={formData.mealType}
                  onChange={(e) => setFormData({...formData, mealType: e.target.value})}
                  className="input-field"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>

              <div>
                <label className="label">Availability</label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({...formData, availability: e.target.value})}
                  className="input-field"
                >
                  {availabilityTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {formData.availability === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
                  Publish immediately
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingMenu(null)
                    setFormData({
                      name: '',
                      description: '',
                      price: '',
                      category: 'main',
                      mealType: 'breakfast',
                      availability: 'daily',
                      startDate: '',
                      endDate: '',
                      isPublished: false
                    })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingMenu ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuManagement
