import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import { User, MapPin, Package, LogOut, Edit2, X, Navigation, Check, AlertCircle, CreditCard, Banknote, Trash2, Plus, Info, Eye, Shield } from 'lucide-react';
import ReviewModal from './profile/ReviewModal';
import OrderCard from './profile/OrderCard';
import BankAccountSection from './profile/BankAccountSection';
import DeliveryLocationSection from './profile/DeliveryLocationSection';

const ProfilePage = () => {
  const { user, logout, showSuccess, showError } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  
  const [payouts, setPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  
  // Address form states
  const [addressStates, setAddressStates] = useState([]);
  const [addressCities, setAddressCities] = useState([]);
  const [addressCityLoading, setAddressCityLoading] = useState(false);
  const [selectedAddressState, setSelectedAddressState] = useState('');
  const [selectedAddressCity, setSelectedAddressCity] = useState('');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    businessName: '',
    phone: '',
    email: ''
  });

  const [addressForm, setAddressForm] = useState({
    type: 'home',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
    isDefault: false,
    landmark: '',
    houseDescription: '',
    askFor: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        businessName: user.businessName || '',
        phone: user.phone || '',
        email: user.email || ''
      });
      fetchAddresses();
      fetchOrders();
      fetchAddressStates();
    }
  }, [user, navigate]);

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

  const fetchPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/user/payouts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPayouts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const fetchAddressStates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/states`);
      if (response.data.success) {
        setAddressStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states for address:', error);
    }
  };

  const fetchAddressCities = async (state) => {
    setAddressCityLoading(true);
    try {
      const encodedState = encodeURIComponent(state);
      const response = await axios.get(`${API_BASE_URL}/cities/state/${encodedState}`);
      if (response.data.success) {
        setAddressCities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cities for address:', error);
    } finally {
      setAddressCityLoading(false);
    }
  };

  const handleAddressStateChange = (state) => {
    setSelectedAddressState(state);
    setSelectedAddressCity('');
    setAddressCities([]);
    setAddressForm(prev => ({ ...prev, state: state, city: '' }));
    if (state) {
      fetchAddressCities(state);
    }
  };

  const handleAddressCitySelect = (city) => {
    setSelectedAddressCity(city);
    setAddressForm(prev => ({ ...prev, city: city }));
  };

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

  const updateProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        fullName: profileForm.fullName,
        businessName: profileForm.businessName,
        phone: profileForm.phone
      };
      
      const response = await axios.put(`${API_BASE_URL}/user/profile`, updateData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setEditingProfile(false);
        showSuccess('Profile updated successfully!');
      } else {
        showError(response?.data?.message || 'Failed to update profile');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async () => {
    if (!addressForm.street || !addressForm.city || !addressForm.state) {
      showError('Please fill in all required fields');
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
          isDefault: false,
          landmark: '',
          houseDescription: '',
          askFor: ''
        });
        setSelectedAddressState('');
        setSelectedAddressCity('');
        setAddressCities([]);
        showSuccess('Address added successfully!');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to add address');
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
          isDefault: false,
          landmark: '',
          houseDescription: '',
          askFor: ''
        });
        setSelectedAddressState('');
        setSelectedAddressCity('');
        setAddressCities([]);
        showSuccess('Address updated successfully!');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update address');
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
        showSuccess('Address deleted successfully!');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete address');
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
        showSuccess('Default address updated!');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to set default address');
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

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      type: address.type,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode || '',
      country: address.country || 'Nigeria',
      isDefault: address.isDefault || false,
      landmark: address.landmark || '',
      houseDescription: address.houseDescription || '',
      askFor: address.askFor || ''
    });
    setSelectedAddressState(address.state);
    setSelectedAddressCity(address.city);
    fetchAddressCities(address.state);
    setShowAddressForm(true);
  };

  if (!user) {
    return (
      <div className="w-full px-4 py-12 text-center">
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
    <div className="w-full px-4 py-4">
      <div className="max-w-4xl mx-auto">
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
        <div className="border-b w-full border-gray-200 mb-6">
          <nav className="w-full flex overflow-hidden scrollbar-hide space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 hidden md:inline-block" />
              Profile Info
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-4 px-1 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="w-4 h-4 hidden md:inline-block" />
              My Orders
            </button>
            <button
              onClick={() => {
                setActiveTab('payouts');
                fetchPayouts();
              }}
              className={`pb-4 px-1 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'payouts'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Banknote className="w-4 h-4 hidden md:inline-block" />
              Payouts
            </button>
          </nav>
        </div>

        {/* Profile Info Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white overflow-hidden border border-gray-200 mx-auto rounded-lg p-6">
            {/* Personal Information Section */}
            {editingProfile ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Personal Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name <span className="text-gray-400 text-xs">(For sellers)</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.businessName}
                    onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Your business or store name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="08012345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
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
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="flex items-center gap-2 px-4 py-2 text-orange-500 hover:bg-orange-50 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="pb-3 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="text-lg font-medium text-gray-900">{user.fullName || 'Not set'}</p>
                  </div>
                  <div className="pb-3 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Business Name</p>
                    <p className="text-lg font-medium text-gray-900">{user.businessName || 'Not set'}</p>
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
              </div>
            )}

            {/* Bank Account Section */}
            <BankAccountSection user={user} />

            {/* Delivery Location Section */}
            <DeliveryLocationSection />

            {/* Delivery Addresses Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Delivery Addresses</h3>
                </div>
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
                      isDefault: addresses.length === 0,
                      landmark: '',
                      houseDescription: '',
                      askFor: ''
                    });
                    setSelectedAddressState('');
                    setSelectedAddressCity('');
                    setAddressCities([]);
                    setShowAddressForm(true);
                  }}
                  className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-lg text-center border-2 border-dashed border-gray-200">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No delivery addresses added</p>
                  <p className="text-xs text-gray-400 mt-1">Add a delivery address to speed up checkout</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div key={address._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                              {address.type}
                            </span>
                            {address.isDefault && (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">{address.street}</p>
                          {address.houseDescription && (
                            <p className="text-sm text-gray-600 mt-1">{address.houseDescription}</p>
                          )}
                          {address.landmark && (
                            <p className="text-sm text-gray-600 mt-1">📍 Landmark: {address.landmark}</p>
                          )}
                          {address.askFor && (
                            <p className="text-sm text-gray-600 mt-1">👤 Ask for: {address.askFor}</p>
                          )}
                          <p className="text-gray-600 text-sm mt-1">
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="text-blue-500 hover:text-blue-600 p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!address.isDefault && (
                            <button
                              onClick={() => deleteAddress(address._id)}
                              className="text-red-500 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {!address.isDefault && (
                        <button
                          onClick={() => setDefaultAddress(address._id)}
                          className="mt-3 text-sm text-green-600 hover:text-green-700"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  <OrderCard 
                    key={order._id}
                    order={order}
                    formatPrice={formatPrice}
                    getOrderStatusColor={getOrderStatusColor}
                    onOrderCancelled={fetchOrders}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">My Payouts</h2>
            
            {loadingPayouts ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Banknote className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No payouts yet</p>
                <p className="text-sm text-gray-400 mt-1">When you sell products and deliveries are confirmed, payouts will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div key={payout._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900">
                          Order #{payout.orderReference?.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        payout.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Total:</span>
                        <span className="font-medium">{formatPrice(payout.originalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform Fee (5%):</span>
                        <span className="text-red-600">{formatPrice(payout.platformFee)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-100">
                        <span className="font-semibold text-gray-900">Your Payout:</span>
                        <span className="font-bold text-green-600">{formatPrice(payout.amount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Address Form Modal */}
        {showAddressForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingAddress(null);
                    setSelectedAddressState('');
                    setSelectedAddressCity('');
                    setAddressCities([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                  <select
                    value={addressForm.type}
                    onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                  <select
                    value={selectedAddressState}
                    onChange={(e) => handleAddressStateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select your state</option>
                    {addressStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {selectedAddressState && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                    {addressCityLoading ? (
                      <div className="text-center py-4 bg-gray-50 rounded-lg">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                        <p className="text-xs text-gray-500 mt-1">Loading cities...</p>
                      </div>
                    ) : addressCities.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                        {addressCities.map(city => (
                          <button
                            key={city}
                            onClick={() => handleAddressCitySelect(city)}
                            className={`w-full text-left px-4 py-2 hover:bg-orange-50 transition ${
                              selectedAddressCity === city ? 'bg-orange-50 text-orange-600 font-medium border-l-2 border-orange-500' : 'text-gray-700'
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">No cities found</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedAddressState && selectedAddressCity && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="House number, street name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">House/Building Description</label>
                      <textarea
                        value={addressForm.houseDescription}
                        onChange={(e) => setAddressForm({ ...addressForm, houseDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows="2"
                        placeholder="e.g., Blue gate, 2-storey building"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nearest Landmark</label>
                      <input
                        type="text"
                        value={addressForm.landmark}
                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Near the market"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Who to Ask For</label>
                      <input
                        type="text"
                        value={addressForm.askFor}
                        onChange={(e) => setAddressForm({ ...addressForm, askFor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Security guard"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="rounded border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Set as default address</span>
                    </label>
                  </>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={editingAddress ? updateAddress : addAddress}
                    disabled={loading || !selectedAddressState || !selectedAddressCity || !addressForm.street}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                      setSelectedAddressState('');
                      setSelectedAddressCity('');
                      setAddressCities([]);
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
    </div>
  );
};

export default ProfilePage;