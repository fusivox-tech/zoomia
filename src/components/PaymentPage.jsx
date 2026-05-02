// PaymentPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Loader, AlertCircle, MapPin, User, Phone } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import axios from 'axios';
import API_BASE_URL from '../config';

const PaymentPage = () => {
  const { cartItems, clearCart, user, getAuthHeaders } = useData();
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart || JSON.parse(savedCart).length === 0) {
        navigate('/cart');
      }
    }
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token || !user) {
      navigate('/cart');
      return;
    }
    
    // Fetch user addresses and check profile completion
    fetchUserData();
  }, [cartItems, navigate, user]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch addresses
      const addressesResponse = await axios.get(`${API_BASE_URL}/user/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (addressesResponse.data.success) {
        setAddresses(addressesResponse.data.data);
        const defaultAddress = addressesResponse.data.data.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        } else if (addressesResponse.data.data.length > 0) {
          setSelectedAddressId(addressesResponse.data.data[0]._id);
        }
      }
      
      // Fetch user profile to check completion
      const profileResponse = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (profileResponse.data.success) {
        const userData = profileResponse.data.data;
        const missing = [];
        
        if (!userData.fullName || userData.fullName.trim() === '') {
          missing.push('Full Name');
        }
        if (!userData.phone || userData.phone.trim() === '') {
          missing.push('Phone Number');
        }
        
        setMissingFields(missing);
        setProfileComplete(missing.length === 0 && addressesResponse.data.data.length > 0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingAddresses(false);
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

const subtotal = cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
const shipping = cartItems?.reduce((sum, item) => {
  if (item.shipping?.free) return sum + 0;
  return sum + ((item.shipping?.cost || 0) * item.quantity);
}, 0) || 0;
const total = subtotal + shipping;

  const initializePaystackPayment = async () => {
    // Check if profile is complete before proceeding
    if (!profileComplete) {
      setShowProfileWarning(true);
      return;
    }
    
    if (!selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }
    
    setProcessing(true);
    
    try {
      const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
      const reference = `ZOOMIA_${user._id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const orderData = {
        reference: reference,
        amount: total * 100,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        deliveryAddress: selectedAddress,
        items: cartItems.map(item => ({
          productId: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant,
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          shipping: item.shipping
        })),
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        isGuest: false,
        metadata: {
          userId: user._id,
          cartItems: cartItems,
          deliveryAddress: selectedAddress
        }
      };

      const headers = getAuthHeaders ? getAuthHeaders() : {};
      const response = await axios.post(`${API_BASE_URL}/payment/initialize`, orderData, {
        headers: headers
      });

      if (response.data.success && response.data.data.authorization_url) {
        localStorage.setItem('pendingPaymentRef', reference);
        localStorage.setItem('pendingOrderData', JSON.stringify(orderData));
        setShowModal(true);
        
        setTimeout(() => {
          window.location.href = response.data.data.authorization_url;
        }, 1500);
      } else {
        alert(response.data.message || 'Failed to initialize payment');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      alert(error.response?.data?.message || 'Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Please sign in to proceed with payment</p>
        <button 
          onClick={() => navigate('/login')}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loadingAddresses) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
        <p className="mt-4 text-gray-500">Loading your information...</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <button 
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
        
        <h1 className="text-xl font-bold mb-4">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery Address Section */}
          <div className="lg:col-span-2">
            <div className="border bg-white border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Delivery Address
              </h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-3">No saved addresses found</p>
                  <button
                    onClick={() => navigate('/profile?tab=addresses')}
                    className="text-orange-500 hover:text-orange-600"
                  >
                    + Add Delivery Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${
                        selectedAddressId === address._id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address._id}
                        checked={selectedAddressId === address._id}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 capitalize">{address.type}</span>
                          {address.isDefault && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{address.street}</p>
                        <p className="text-gray-600 text-sm">{address.city}, {address.state} {address.postalCode}</p>
                        <p className="text-gray-600 text-sm">{address.country}</p>
                      </div>
                    </label>
                  ))}
                  
                  <button
                    onClick={() => navigate('/profile?tab=addresses')}
                    className="text-orange-500 hover:text-orange-600 text-sm mt-2"
                  >
                    + Add New Address
                  </button>
                </div>
              )}
            </div>
            
            {/* Order Summary */}
            <div className="border bg-white border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="max-h-64 overflow-y-auto mb-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm mb-2 pb-2 border-b border-gray-100">
                    <span>{item.title} × {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 mb-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
              </div>
              
              <div className="flex justify-between text-xl font-bold pt-4 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Section */}
          <div className="lg:col-span-1">
            <div className="border bg-white border-gray-200 p-6 sticky top-20">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold">Payment Method</h2>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Secure payment powered by Paystack</p>
                <p className="text-xs text-gray-500">Supported: All cards, Bank Transfers, USSD, Mobile Money</p>
              </div>
              
              <button
                onClick={initializePaystackPayment}
                disabled={processing || addresses.length === 0}
                className="w-full py-3 bg-orange-500 text-white font-semibold hover:bg-orange-600 transition border-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatPrice(total)}`
                )}
              </button>
              
              {addresses.length === 0 && (
                <p className="text-xs text-center mt-4 text-red-500">
                  Please add a delivery address to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Payment Initialized</h3>
            <p className="text-gray-600 mb-6">
              You will be redirected to Paystack to complete your payment. 
              Your order will be processed immediately after successful payment.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <span className="ml-2 text-gray-600">Redirecting...</span>
            </div>
          </div>
        </div>
      )}

      {/* Profile Incomplete Warning Modal */}
      {showProfileWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Profile Incomplete</h3>
            <p className="text-gray-600 text-center mb-4">
              Please complete your profile information before making a payment.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="font-semibold text-gray-700 mb-2">Missing Information:</p>
              <ul className="space-y-1">
                {missingFields.map((field, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {field}
                  </li>
                ))}
                {addresses.length === 0 && (
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </li>
                )}
                {(!user.phone || user.phone.trim() === '') && (
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </li>
                )}
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600"
              >
                Update Profile
              </button>
              <button
                onClick={() => setShowProfileWarning(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentPage;