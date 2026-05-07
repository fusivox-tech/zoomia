import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Loader, AlertCircle, MapPin, User, Phone, Truck, ShoppingBag, Banknote, Clock, Calendar, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import axios from 'axios';
import API_BASE_URL from '../config';

const PaymentPage = () => {
  const { user, getAuthHeaders, showError } = useData();
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [validatedItems, setValidatedItems] = useState([]);
  const [validatingItems, setValidatingItems] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [buyerLocation, setBuyerLocation] = useState({ city: '', state: '', neighborhood: '' });
  const [checkoutTotals, setCheckoutTotals] = useState({ subtotal: 0, shipping: 0, total: 0 });
  const hasProcessed = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const selectedItemsStr = localStorage.getItem('selectedCartItems');
    const totalsStr = localStorage.getItem('checkoutTotals');
    
    if (!selectedItemsStr || !totalsStr) {
      navigate('/cart');
      return;
    }
    
    const items = JSON.parse(selectedItemsStr);
    const totals = JSON.parse(totalsStr);
    
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    
    setValidatedItems(items);
    setCheckoutTotals(totals);
    
    const token = localStorage.getItem('token');
    if (!token || !user) {
      navigate('/cart');
      return;
    }
    
    const savedState = localStorage.getItem('buyerState');
    const savedCity = localStorage.getItem('buyerCity');
    const savedNeighborhood = localStorage.getItem('buyerNeighborhood');
    if (savedState && savedCity && savedNeighborhood) {
      setBuyerLocation({ city: savedCity, state: savedState, neighborhood: savedNeighborhood });
    }
    
    fetchUserData();
    setValidatingItems(false);
  }, [navigate, user]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
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
      
      const checkoutResponse = await axios.get(`${API_BASE_URL}/user/can-checkout`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (checkoutResponse.data.success) {
        const checkoutStatus = checkoutResponse.data;
        setMissingFields(checkoutStatus.missingFields);
        setProfileComplete(checkoutStatus.canCheckout);
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

  const initializePaystackPayment = async () => {
    if (!profileComplete) {
      setShowProfileWarning(true);
      return;
    }
    
    if (!selectedAddressId) {
      showError('Please select a delivery address');
      return;
    }
    
    if (validatedItems.length === 0) {
      showError('No valid items in cart');
      return;
    }
    
    setProcessing(true);
    
    try {
      const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
      const reference = `ZOOMIA_${user._id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      // Calculate total amount including delivery
      const totalAmount = checkoutTotals.total;
      
      const orderData = {
        reference: reference,
        amount: Math.round(totalAmount * 100),
        buyerEmail: user.email,
        buyerFullName: user.fullName,
        buyerPhone: user.phone,
        buyerId: user._id,
        deliveryAddress: {
          ...selectedAddress,
          neighborhood: buyerLocation.neighborhood
        },
        items: validatedItems.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          variant: item.variant,
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          sellerEmail: item.sellerEmail,
          sellerPhone: item.sellerPhone,
          deliveryPrice: item.deliveryPrice || 0,
          totalPrice: item.calculatedSubtotal || (item.price * item.quantity),
          calculatedShipping: item.calculatedShipping || ((item.deliveryPrice || 0) * item.quantity)
        })),
        subtotal: checkoutTotals.subtotal,
        shipping: checkoutTotals.shipping,
        total: totalAmount,
        buyerLocation: buyerLocation,
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
        showError(response.data.message || 'Failed to initialize payment');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      showError(error.response?.data?.message || 'Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Please sign in to proceed with payment</p>
        <button onClick={() => navigate('/login')} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Sign In</button>
      </div>
    );
  }

  if (loadingAddresses || validatingItems) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
        <p className="mt-4 text-gray-500">{validatingItems ? 'Loading your cart...' : 'Loading your information...'}</p>
      </div>
    );
  }

  if (validatedItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">No items to checkout</p>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Continue Shopping</button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </button>
        
        <h1 className="text-xl font-bold mb-4">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Delivery Address Section */}
            <div className="border bg-white border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" /> Delivery Address
              </h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-3">No saved addresses found</p>
                  <button onClick={() => navigate('/profile?tab=addresses')} className="text-orange-500 hover:text-orange-600">+ Add Delivery Address</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label key={address._id} className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${
                      selectedAddressId === address._id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'
                    }`}>
                      <input type="radio" name="address" value={address._id} checked={selectedAddressId === address._id}
                        onChange={(e) => setSelectedAddressId(e.target.value)} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 capitalize">{address.type}</span>
                          {address.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default</span>}
                        </div>
                        <p className="text-gray-600 text-sm">{address.street}</p>
                        <p className="text-gray-600 text-sm">{address.city}, {address.state} {address.postalCode}</p>
                        <p className="text-gray-600 text-sm">{address.country}</p>
                      </div>
                    </label>
                  ))}
                  <button onClick={() => navigate('/profile?tab=addresses')} className="text-orange-500 hover:text-orange-600 text-sm mt-2">+ Add New Address</button>
                </div>
              )}
            </div>
            
            {/* Order Summary Section */}
            <div className="border bg-white border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="max-h-64 overflow-y-auto mb-4 space-y-3">
                {validatedItems.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.title} × {item.quantity}</span>
                      <span className="font-semibold">{formatPrice(item.calculatedSubtotal || (item.price * item.quantity))}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Delivery fee:</span>
                      <span>{formatPrice(item.calculatedShipping || ((item.deliveryPrice || 0) * item.quantity))}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 mb-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(checkoutTotals.subtotal)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{checkoutTotals.shipping === 0 ? 'Free' : formatPrice(checkoutTotals.shipping)}</span></div>
              </div>
              
              <div className="flex justify-between text-xl font-bold pt-4 border-t border-gray-200">
                <span>Total</span><span className="text-orange-600">{formatPrice(checkoutTotals.total)}</span>
              </div>
            </div>

            {/* Policies Information Section */}
            <div className="border bg-white border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowPolicies(!showPolicies)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Order & Delivery Policies</h2>
                </div>
                <svg className={`w-5 h-5 text-gray-500 transition-transform ${showPolicies ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showPolicies && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-800 mb-1">Order Cancellation Policy</h3>
                        <p className="text-sm text-red-700">
                          You have <strong className="font-bold">24 hours</strong> after payment confirmation to cancel your order. 
                          After 24 hours, orders cannot be cancelled.
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          <strong>5% penalty fee</strong> applies to all order cancellations.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-800 mb-1">Shipping Starts</h3>
                          <p className="text-sm text-blue-700">
                            Shipping begins <strong className="font-bold">24 hours</strong> after order confirmation.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-800 mb-1">Delivery Timeline</h3>
                          <p className="text-sm text-blue-700">
                            Delivery completed within <strong className="font-bold">7 days</strong> after shipping starts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <RotateCcw className="w-4 h-4 text-yellow-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-yellow-800 mb-1">Return & Refund Policy</h3>
                        <p className="text-sm text-yellow-700">
                          You have <strong className="font-bold">24 hours after delivery</strong> to request a return and get refunded.
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          <strong>5% penalty fee</strong> applies to all refund processing.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-800 mb-1">Contact Seller</h3>
                        <p className="text-sm text-green-700">
                          After payment, you'll receive seller contact information. 
                          Contact them directly to finalize delivery arrangements.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 text-center">
                      By proceeding with payment, you agree to all the policies above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Sidebar */}
          <div className="lg:col-span-1">
            <div className="border bg-white border-gray-200 p-6 sticky top-20">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold">Payment Method</h2>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Secure payment powered by Paystack</p>
                <p className="text-xs text-gray-500">Supported: All cards, Bank Transfers, USSD, Mobile Money</p>
              </div>
              
              <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-orange-700 mb-1">
                  <Truck className="w-4 h-4" />
                  <span className="font-medium">Delivering to: {buyerLocation.neighborhood || 'Not selected'}</span>
                </div>
                {!buyerLocation.neighborhood && <p className="text-xs text-orange-600 mt-1">Please set your delivery location first</p>}
              </div>

              {/* Estimated Timeline Summary */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                <p className="font-medium text-gray-700 mb-1">Estimated Timeline:</p>
                <div className="flex justify-between">
                  <span>Order confirmation:</span>
                  <span>Immediate</span>
                </div>
                <div className="flex justify-between">
                  <span>Cancellation window:</span>
                  <span>24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping starts:</span>
                  <span>After 24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>7 days after shipping</span>
                </div>
                <div className="flex justify-between">
                  <span>Return window:</span>
                  <span>24 hours after delivery</span>
                </div>
              </div>
              
              <button 
                onClick={initializePaystackPayment} 
                disabled={processing || addresses.length === 0 || !buyerLocation.neighborhood}
                className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? <><Loader className="w-5 h-5 animate-spin" />Processing...</> : `Pay ${formatPrice(checkoutTotals.total)}`}
              </button>
              
              {addresses.length === 0 && (
                <p className="text-xs text-center mt-4 text-red-500">Please add a delivery address to continue</p>
              )}
              {!buyerLocation.neighborhood && (
                <p className="text-xs text-center mt-4 text-orange-500">Please set your delivery location (including neighborhood) first</p>
              )}
              
              <p className="text-xs text-gray-400 text-center mt-4">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                5% penalty fee applies to cancellations and refunds
              </p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Payment Initialized</h3>
            <p className="text-gray-600 mb-6">You will be redirected to Paystack to complete your payment.</p>
            <div className="flex justify-center items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
              <span className="text-gray-600">Redirecting...</span>
            </div>
          </div>
        </div>
      )}

      {showProfileWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Profile Incomplete</h3>
            <p className="text-gray-600 text-center mb-4">Please complete your profile information before making a payment.</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="font-semibold text-gray-700 mb-2">Missing Information:</p>
              <ul className="space-y-1">
                {missingFields.map((field, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                    {field.includes('Bank') ? <Banknote className="w-4 h-4" /> : 
                     field.includes('Phone') ? <Phone className="w-4 h-4" /> : 
                     <MapPin className="w-4 h-4" />}
                    {field}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/profile')} className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600">
                Update Profile
              </button>
              <button onClick={() => setShowProfileWarning(false)} className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50">
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