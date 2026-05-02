// ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import { User, MapPin, Package, LogOut, Edit2, Save, X } from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser, logout } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // profile, addresses, orders
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    email: ''
  });
  
  const [addressForm, setAddressForm] = useState({
    type: 'home', // home, work, other
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
    isDefault: false
  });

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || ''
      });
      fetchAddresses();
      fetchOrders();
    }
  }, [user, navigate]);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/user/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAddresses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/user/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/user/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUser(prev => ({ ...prev, ...profileForm }));
        setEditingProfile(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async () => {
    if (!addressForm.street || !addressForm.city || !addressForm.state) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/user/addresses`, addressForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAddresses([...addresses, response.data.data]);
        setShowAddressForm(false);
        setAddressForm({
          type: 'home',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Nigeria',
          isDefault: false
        });
        alert('Address added successfully!');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert(error.response?.data?.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/user/addresses/${editingAddress._id}`, addressForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAddresses(addresses.map(addr => 
          addr._id === editingAddress._id ? response.data.data : addr
        ));
        setEditingAddress(null);
        setShowAddressForm(false);
        setAddressForm({
          type: 'home',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Nigeria',
          isDefault: false
        });
        alert('Address updated successfully!');
      }
    } catch (error) {
      console.error('Error updating address:', error);
      alert(error.response?.data?.message || 'Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/user/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAddresses(addresses.filter(addr => addr._id !== addressId));
        alert('Address deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert(error.response?.data?.message || 'Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  const setDefaultAddress = async (addressId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/user/addresses/${addressId}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAddresses(addresses.map(addr => ({
          ...addr,
          isDefault: addr._id === addressId
        })));
        alert('Default address updated!');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      alert(error.response?.data?.message || 'Failed to set default address');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      processing: 'blue',
      shipped: 'purple',
      delivered: 'green',
      cancelled: 'red',
      completed: 'green',
      failed: 'red'
    };
    return colors[status] || 'gray';
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Please log in to view your profile</p>
        <button 
          onClick={() => navigate('/login')}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-gray-900">My Account</h1>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="w-full flex space-x-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-1 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4 hidden md:inline-block" />
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-4 px-1 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'addresses'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4 hidden md:inline-block" />
            Delivery Addresses
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-1 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-4 h-4 hidden md:inline-block" />
            My Orders
          </button>
        </nav>
      </div>

      {/* Profile Info Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white overflow-hidden border border-gray-200 rounded-lg p-6 max-w-2xl">
          {editingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="08012345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div className="space-y-3 flex-1">
                  <div className="pb-3 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="text-lg font-medium text-gray-900">{user.fullName || 'Not set'}</p>
                  </div>
                  <div className="pb-3 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-lg font-medium text-gray-900">{user.phone || 'Not set'}</p>
                  </div>
                  <div className="pb-3">
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="text-lg font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProfile(true)}
                  className="absolute -top-2 -right-2 flex items-center gap-2 px-4 py-2 text-orange-500 hover:bg-orange-50 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
            <button
              onClick={() => {
                setEditingAddress(null);
                setAddressForm({
                  type: 'home',
                  street: '',
                  city: '',
                  state: '',
                  postalCode: '',
                  country: 'Nigeria',
                  isDefault: addresses.length === 0
                });
                setShowAddressForm(true);
              }}
              className="bg-orange-500 text-xs text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              + Add New Address
            </button>
          </div>

          {addresses.length === 0 && !showAddressForm ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No saved addresses</p>
              <p className="text-sm text-gray-400 mt-1">Add a delivery address to speed up checkout</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((address) => (
                <div key={address._id} className="bg-white border border-gray-200 rounded-lg p-4 relative">
                  {address.isDefault && (
                    <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                      {address.type}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-1">{address.street}</p>
                  <p className="text-gray-600 text-sm">
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p className="text-gray-600 text-sm">{address.country}</p>
                  <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingAddress(address);
                        setAddressForm({
                          type: address.type,
                          street: address.street,
                          city: address.city,
                          state: address.state,
                          postalCode: address.postalCode,
                          country: address.country,
                          isDefault: address.isDefault
                        });
                        setShowAddressForm(true);
                      }}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      Edit
                    </button>
                    {!address.isDefault && (
                      <>
                        <button
                          onClick={() => setDefaultAddress(address._id)}
                          className="text-green-500 hover:text-green-600 text-sm"
                        >
                          Set as Default
                        </button>
                        <button
                          onClick={() => deleteAddress(address._id)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Address Form Modal */}
          {showAddressForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Type
                    </label>
                    <select
                      value={addressForm.type}
                      onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300"
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300"
                      placeholder="House number, street name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300"
                    />
                  </div>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Set as default address</span>
                  </label>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={editingAddress ? updateAddress : addAddress}
                      disabled={loading}
                      className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                      }}
                      className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No orders yet</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-4 text-orange-500 hover:text-orange-600"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Order #{order.reference?.slice(-8) || order._id.slice(-8)}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs rounded-full bg-${getOrderStatusColor(order.status)}-100 text-${getOrderStatusColor(order.status)}-700`}>
                        {order.status}
                      </span>
                      <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                            <img 
                              src={item.product?.images?.[0] || '/placeholder.png'} 
                              alt={item.title}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            <p className="text-orange-500 font-semibold">{formatPrice(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {order.trackingInfo && order.status === 'shipped' && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Tracking Information</p>
                        <p className="text-xs text-blue-700">Tracking #: {order.trackingInfo.trackingNumber}</p>
                        <p className="text-xs text-blue-700">Carrier: {order.trackingInfo.carrier}</p>
                        {order.trackingInfo.estimatedDelivery && (
                          <p className="text-xs text-blue-700">Est. Delivery: {new Date(order.trackingInfo.estimatedDelivery).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                    
                    {order.status === 'delivered' && (
                      <button className="mt-4 text-orange-500 hover:text-orange-600 text-sm">
                        Write a Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;