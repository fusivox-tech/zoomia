// ProfilePage.jsx - Corrected version with no duplicate declarations
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import { User, MapPin, Package, LogOut, Edit2, Save, X, Navigation, Check, AlertCircle } from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser, logout } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  
  // Location management states
  const [editingLocation, setEditingLocation] = useState(false);
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [tempState, setTempState] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [currentLocation, setCurrentLocation] = useState({ state: '', city: '' });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  // Address form states with selection first
  const [addressStates, setAddressStates] = useState([]);
  const [addressCities, setAddressCities] = useState([]);
  const [addressCityLoading, setAddressCityLoading] = useState(false);
  const [selectedAddressState, setSelectedAddressState] = useState('');
  const [selectedAddressCity, setSelectedAddressCity] = useState('');
  
  // Profile form state - ONLY DECLARE ONCE
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
        businessName: user.businessName || '',
        phone: user.phone || '',
        email: user.email || ''
      });
      fetchAddresses();
      fetchOrders();
      loadCurrentLocation();
      fetchStates();
      fetchAddressStates();
    }
  }, [user, navigate]);

  // Load current delivery location from localStorage
  const loadCurrentLocation = () => {
    const savedState = localStorage.getItem('buyerState');
    const savedCity = localStorage.getItem('buyerCity');
    if (savedState && savedCity) {
      setCurrentLocation({ state: savedState, city: savedCity });
      setTempState(savedState);
      setTempCity(savedCity);
    }
  };

  // Fetch all Nigerian states
  const fetchStates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/states`);
      if (response.data.success) {
        setAvailableStates(response.data.data);
      } else {
        setLocationError('Failed to load states');
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      setLocationError('Failed to connect to server');
    }
  };

  // Fetch states for address form
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

  // Fetch cities for selected state in address form
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

  // Fetch cities for selected state
  const fetchCitiesForState = async (state) => {
    setLocationLoading(true);
    setLocationError('');
    setAvailableCities([]);
    
    try {
      const encodedState = encodeURIComponent(state);
      const url = `${API_BASE_URL}/cities/state/${encodedState}`;
      
      const response = await axios.get(url);

      if (response.data.success) {
        setAvailableCities(response.data.data);
      } else {
        setLocationError('Failed to load cities');
      }
    } catch (error) {
      setLocationError(error.response?.data?.message || 'Failed to load cities');
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle state selection
  const handleStateChange = (state) => {
    console.log('State selected:', state);
    setTempState(state);
    setTempCity('');
    setAvailableCities([]);
    if (state) {
      fetchCitiesForState(state);
    }
  };

  // Handle address state selection
  const handleAddressStateChange = (state) => {
    setSelectedAddressState(state);
    setSelectedAddressCity('');
    setAddressCities([]);
    setAddressForm(prev => ({ ...prev, state: state, city: '' }));
    if (state) {
      fetchAddressCities(state);
    }
  };

  // Handle address city selection
  const handleAddressCitySelect = (city) => {
    setSelectedAddressCity(city);
    setAddressForm(prev => ({ ...prev, city: city }));
  };

  // Save delivery location
  const saveLocation = () => {
    if (tempState && tempCity) {
      localStorage.setItem('buyerState', tempState);
      localStorage.setItem('buyerCity', tempCity);
      localStorage.setItem('locationSelected', 'true');
      localStorage.setItem('locationSelectedAt', new Date().toISOString());
      setCurrentLocation({ state: tempState, city: tempCity });
      setEditingLocation(false);
      alert(`Delivery location updated to ${tempCity}, ${tempState}!`);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      alert('Please select both state and city');
    }
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

// Replace the updateProfile function in ProfilePage.jsx with this:

const updateProfile = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    
    // Prepare the data to send
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
    // Check if response exists and has success property
    if (response.success === true) {
      // Update the user context with new data
      setUser(prev => ({ 
        ...prev, 
        fullName: profileForm.fullName,
        businessName: profileForm.businessName,
        phone: profileForm.phone
      }));
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } else {
      // This handles cases where response exists but success is false
      const errorMsg = response?.data?.message || 'Failed to update profile';
      alert(errorMsg);
    }
  } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
      alert(errorMessage);
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
        setSelectedAddressState('');
        setSelectedAddressCity('');
        setAddressCities([]);
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
        setSelectedAddressState('');
        setSelectedAddressCity('');
        setAddressCities([]);
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
        <nav className="w-full flex space-x-4 overflow-x-auto">
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
            onClick={() => setActiveTab('addresses')}
            className={`pb-4 px-1 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
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
            className={`pb-4 px-1 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
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
                  Business Name <span className="text-gray-400 text-xs">(For sellers - appears on product listings)</span>
                </label>
                <input
                  type="text"
                  value={profileForm.businessName}
                  onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Your business or store name"
                />
                <p className="text-xs text-gray-500 mt-1">If left blank, your full name will be used for product listings</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="08012345678"
                />
                <p className="text-xs text-orange-500 mt-1">Required for selling and checkout</p>
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
                    <p className="text-sm text-gray-500">Business Name</p>
                    <p className="text-lg font-medium text-gray-900">{user.businessName || 'Not set'}</p>
                    {!user.businessName && (
                      <p className="text-xs text-gray-400 mt-1">Your full name will be used for product listings</p>
                    )}
                  </div>
                  <div className="pb-3 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-lg font-medium text-gray-900">{user.phone || 'Not set'}</p>
                    {!user.phone && (
                      <p className="text-xs text-orange-500 mt-1">Required for selling and checkout</p>
                    )}
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

          {/* Delivery Location Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900">Delivery Location</h3>
              </div>
              <button
                onClick={() => {
                  setEditingLocation(!editingLocation);
                  if (!editingLocation && availableStates.length === 0) {
                    fetchStates();
                  }
                }}
                className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                {editingLocation ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {editingLocation ? 'Cancel' : 'Change'}
              </button>
            </div>
            
            {!editingLocation ? (
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Delivery Location:</p>
                    <p className="font-semibold text-gray-900">
                      {currentLocation.city && currentLocation.state 
                        ? `${currentLocation.city}, ${currentLocation.state}`
                        : 'No location set'}
                    </p>
                  </div>
                  {currentLocation.city && currentLocation.state && (
                    <Check className="w-5 h-5 text-green-600 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Only products available for delivery to this location will be shown
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                {locationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-600">{locationError}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select State
                  </label>
                  <select
                    value={tempState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Choose a state</option>
                    {availableStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                {tempState && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select City in {tempState}
                    </label>
                    {locationLoading ? (
                      <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                        <p className="text-sm text-gray-500">Loading cities...</p>
                      </div>
                    ) : availableCities.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                        {availableCities.map(city => (
                          <button
                            key={city}
                            onClick={() => setTempCity(city)}
                            className={`w-full text-left px-4 py-2 hover:bg-orange-50 transition ${
                              tempCity === city ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">No cities found for {tempState}</p>
                        <p className="text-xs text-gray-400 mt-1">Try selecting a different state</p>
                      </div>
                    )}
                  </div>
                )}
                
                {tempState && tempCity && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Selected: <strong>{tempCity}, {tempState}</strong>
                    </span>
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={saveLocation}
                    disabled={!tempState || !tempCity || locationLoading}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Location
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  Your delivery location determines which products you can see and buy
                </p>
              </div>
            )}
          </div>
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
                setSelectedAddressState('');
                setSelectedAddressCity('');
                setAddressCities([]);
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
                <div key={address._id} className="bg-white border border-gray-200 rounded-lg p-4 relative hover:shadow-md transition">
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
                  <p className="text-gray-900 mb-1 font-medium">{address.street}</p>
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
                        setSelectedAddressState(address.state);
                        setSelectedAddressCity(address.city);
                        fetchAddressCities(address.state);
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Type
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
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
                          <p className="text-xs text-gray-400 mt-1">Please select a different state</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedAddressState && selectedAddressCity && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          placeholder="House number, street name, landmark"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.postalCode}
                          onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          placeholder="e.g., 100001"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value="Nigeria"
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
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

                  {selectedAddressState && selectedAddressCity && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Address location: <strong>{selectedAddressCity}, {selectedAddressState}</strong>
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={editingAddress ? updateAddress : addAddress}
                      disabled={loading || !selectedAddressState || !selectedAddressCity || !addressForm.street}
                      className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
        {orders.map((order) => {
          const displayReference = order.reference || order._id;
          const orderItems = order.items || [];
          const orderTotal = order.total || 0;
          const orderStatus = order.status || 'pending';
          const orderDate = order.createdAt;
          
          // Get seller info from the enhanced order data
          const sellerName = order.seller?.sellerName || order.sellerName || 'Seller';
          const sellerPhone = order.seller?.sellerPhone || order.sellerPhone;
          const sellerEmail = order.seller?.sellerEmail || order.sellerEmail;
          const sellerProfileImage = order.seller?.sellerProfileImage;
          
          return (
            <div key={order._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-mono">
                    Order #{displayReference.slice(-8)}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(orderDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs rounded-full bg-${getOrderStatusColor(orderStatus)}-100 text-${getOrderStatusColor(orderStatus)}-700 capitalize`}>
                    {orderStatus}
                  </span>
                  <p className="font-bold text-gray-900">{formatPrice(orderTotal)}</p>
                </div>
              </div>
              
              {/* Order Items */}
              <div className="p-6">
                <div className="space-y-3">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                          }}
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
                
                {/* Seller Information Section */}
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3 mb-3">
                    {sellerProfileImage ? (
                      <img src={sellerProfileImage} alt={sellerName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center">
                        <span className="text-orange-600 font-semibold">
                          {sellerName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">Sold by: {sellerName}</h3>
                      <p className="text-xs text-gray-600">Seller</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {sellerPhone && (
                      <p className="flex items-center gap-2">
                        <span className="text-gray-600">📞 Phone:</span>
                        <a href={`tel:${sellerPhone}`} className="text-orange-600 hover:text-orange-700 font-medium">
                          {sellerPhone}
                        </a>
                      </p>
                    )}
                    {sellerEmail && (
                      <p className="flex items-center gap-2">
                        <span className="text-gray-600">✉️ Email:</span>
                        <a href={`mailto:${sellerEmail}`} className="text-orange-600 hover:text-orange-700">
                          {sellerEmail}
                        </a>
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <p className="text-xs text-gray-600">
                      <strong>💡 Note:</strong> Contact the seller directly to coordinate delivery. 
                      You can call or email them to arrange a suitable delivery time.
                    </p>
                  </div>
                </div>
                
                {/* Delivery Address */}
                {order.deliveryAddress && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Delivery Address
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state}
                    </p>
                  </div>
                )}
                
                {/* Tracking Information */}
                {order.trackingInfo && (orderStatus === 'shipped' || orderStatus === 'processing') && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Tracking Information</p>
                    <p className="text-xs text-blue-700">Tracking #: {order.trackingInfo.trackingNumber}</p>
                    <p className="text-xs text-blue-700">Carrier: {order.trackingInfo.carrier}</p>
                    {order.trackingInfo.estimatedDelivery && (
                      <p className="text-xs text-blue-700">Est. Delivery: {new Date(order.trackingInfo.estimatedDelivery).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
                
                {/* Quick Contact Button */}
                {sellerPhone && (
                  <div className="mt-4">
                    <a
                      href={`tel:${sellerPhone}`}
                      className="block text-center w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                    >
                      📞 Call Seller to Arrange Delivery
                    </a>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                  {orderStatus === 'delivered' && (
                    <button className="text-orange-500 hover:text-orange-600 text-sm">
                      Write a Review
                    </button>
                  )}
                  {orderStatus === 'pending' && (
                    <button className="text-red-500 hover:text-red-600 text-sm">
                      Cancel Order
                    </button>
                  )}
                  {orderStatus === 'shipped' && (
                    <button className="text-green-500 hover:text-green-600 text-sm">
                      Confirm Delivery
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
    </div>
  );
};

export default ProfilePage;