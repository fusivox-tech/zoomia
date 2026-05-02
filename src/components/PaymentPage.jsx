// PaymentPage.jsx - Platform fee removed, address location validation added
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Loader, AlertCircle, MapPin, User, Phone, Truck, ShoppingBag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import API_BASE_URL from '../config';
import axios from 'axios';

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
  const [validatedItems, setValidatedItems] = useState([]);
  const [validatingItems, setValidatingItems] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [buyerLocation, setBuyerLocation] = useState({ city: '', state: '' });
  const [addressLocationValid, setAddressLocationValid] = useState(true);
  const [invalidItems, setInvalidItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart || JSON.parse(savedCart).length === 0) {
        navigate('/cart');
        return;
      }
    }
    
    const token = localStorage.getItem('token');
    if (!token || !user) {
      navigate('/cart');
      return;
    }
    
    const savedCity = localStorage.getItem('buyerCity');
    const savedState = localStorage.getItem('buyerState');
    if (savedCity && savedState) {
      setBuyerLocation({ city: savedCity, state: savedState });
    }
    
    fetchUserData();
    validateCartItems();
  }, [cartItems, navigate, user]);

  const validateCartItems = async () => {
    setValidatingItems(true);
    setValidationError('');
    setInvalidItems([]);
    
    try {
      const token = localStorage.getItem('token');
      const validatedItemsList = [];
      const invalidItemsList = [];
      
      for (const item of cartItems) {
        const response = await axios.get(`${API_BASE_URL}/products/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.success) {
          throw new Error(`Product ${item.title} not found`);
        }
        
        const product = response.data.data;
        
        // Check if product is still in stock
        const selectedVariant = item.variant;
        let currentStock = product.stock;
        let currentPrice = product.price;
        
        if (selectedVariant) {
          const variant = product.variants?.find(v => v.id === selectedVariant.id);
          if (!variant) {
            throw new Error(`Variant ${selectedVariant.name} no longer available for ${product.title}`);
          }
          currentStock = variant.stock;
          currentPrice = variant.price;
        }
        
        if (currentStock < item.quantity) {
          throw new Error(`${product.title} only has ${currentStock} items in stock`);
        }
        
        // Check if delivery is available to buyer's location
        const isDeliveryAvailable = checkDeliveryAvailability(product, buyerLocation.city, buyerLocation.state);
        
        if (!isDeliveryAvailable) {
          invalidItemsList.push({
            title: product.title,
            reason: `Not available for delivery to ${buyerLocation.city}, ${buyerLocation.state}`
          });
        }
        
        const deliveryPrice = getDeliveryPriceForLocation(product, buyerLocation.city, buyerLocation.state);
        const discountInfo = getBulkDiscount(product, item.quantity, buyerLocation.city, buyerLocation.state);
        
        validatedItemsList.push({
          ...item,
          validatedPrice: currentPrice,
          validatedStock: currentStock,
          deliveryPrice: deliveryPrice,
          discountInfo: discountInfo,
          finalPrice: calculateItemFinalPrice(currentPrice, deliveryPrice, discountInfo, item.quantity),
          productData: product,
          deliveryAvailable: isDeliveryAvailable
        });
      }
      
      setValidatedItems(validatedItemsList);
      setInvalidItems(invalidItemsList);
      setAddressLocationValid(invalidItemsList.length === 0);
      
      if (invalidItemsList.length > 0) {
        setValidationError(`Some items cannot be delivered to ${buyerLocation.city}`);
      }
    } catch (error) {
      console.error('Error validating cart items:', error);
      setValidationError(error.message || 'Failed to validate cart items. Please try again.');
    } finally {
      setValidatingItems(false);
    }
  };

  const checkDeliveryAvailability = (product, city, state) => {
    if (!city || !state) return true;
    
    // No delivery zones means nationwide delivery
    if (!product.deliveryZones || product.deliveryZones.length === 0) {
      return true;
    }
    
    // Check if there's a delivery zone for this location
    const deliveryZone = product.deliveryZones?.find(
      zone => zone.city?.toLowerCase() === city?.toLowerCase() && 
              zone.state?.toLowerCase() === state?.toLowerCase()
    );
    
    return !!deliveryZone;
  };

  const getDeliveryPriceForLocation = (product, city, state) => {
    if (!city || !state) return product.shipping?.cost || 0;
    
    const deliveryZone = product.deliveryZones?.find(
      zone => zone.city?.toLowerCase() === city?.toLowerCase() && 
              zone.state?.toLowerCase() === state?.toLowerCase()
    );
    
    return deliveryZone?.price !== undefined ? deliveryZone.price : (product.shipping?.cost || 0);
  };

  const getBulkDiscount = (product, quantity, city, state) => {
    const deliveryZone = product.deliveryZones?.find(
      zone => zone.city?.toLowerCase() === city?.toLowerCase() && 
              zone.state?.toLowerCase() === state?.toLowerCase()
    );
    
    const discount = deliveryZone?.discountOnQuantity;
    
    if (discount?.enabled && quantity >= (discount.minQuantity || 2)) {
      return {
        enabled: true,
        minQuantity: discount.minQuantity,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        appliesTo: discount.appliesTo
      };
    }
    
    return { enabled: false };
  };

  const calculateItemFinalPrice = (productPrice, deliveryPrice, discountInfo, quantity) => {
    let finalProductPrice = productPrice;
    let finalDeliveryPrice = deliveryPrice;
    
    if (discountInfo.enabled) {
      const discountAmount = discountInfo.discountType === 'percentage' 
        ? (discountInfo.discountValue / 100)
        : discountInfo.discountValue;
      
      if (discountInfo.appliesTo === 'product' || discountInfo.appliesTo === 'both') {
        finalProductPrice = discountInfo.discountType === 'percentage'
          ? productPrice * (1 - discountAmount)
          : productPrice - discountAmount;
      }
      
      if (discountInfo.appliesTo === 'delivery' || discountInfo.appliesTo === 'both') {
        finalDeliveryPrice = discountInfo.discountType === 'percentage'
          ? deliveryPrice * (1 - discountAmount)
          : deliveryPrice - discountAmount;
      }
    }
    
    return {
      unitProductPrice: finalProductPrice,
      unitDeliveryPrice: Math.max(0, finalDeliveryPrice),
      totalProductPrice: finalProductPrice * quantity,
      totalDeliveryPrice: Math.max(0, finalDeliveryPrice) * quantity
    };
  };

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
      
      const profileResponse = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (profileResponse.data.success) {
        const userData = profileResponse.data.data;
        const missing = [];
        
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

  const calculateTotals = () => {
    const subtotal = validatedItems.reduce((sum, item) => sum + item.finalPrice.totalProductPrice, 0);
    const shipping = validatedItems.reduce((sum, item) => sum + item.finalPrice.totalDeliveryPrice, 0);
    const total = subtotal + shipping;
    
    return { subtotal, shipping, total };
  };

  const { subtotal, shipping, total } = calculateTotals();

  const initializePaystackPayment = async () => {
    if (!profileComplete) {
      setShowProfileWarning(true);
      return;
    }
    
    if (!selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }
    
    if (validatedItems.length === 0) {
      alert('No valid items in cart');
      return;
    }
    
    if (!addressLocationValid) {
      alert('Some items cannot be delivered to your location. Please remove them or change your delivery location.');
      return;
    }
    
    setProcessing(true);
    
    try {
      const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
      const reference = `ZOOMIA_${user._id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const orderItems = validatedItems.map(item => ({
        productId: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.validatedPrice,
        originalPrice: item.productData.originalPrice,
        variant: item.variant,
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        deliveryPrice: item.deliveryPrice,
        discountApplied: item.discountInfo.enabled ? item.discountInfo : null,
        finalProductPrice: item.finalPrice.unitProductPrice,
        finalDeliveryPrice: item.finalPrice.unitDeliveryPrice,
        totalPrice: item.finalPrice.totalProductPrice,
        totalDelivery: item.finalPrice.totalDeliveryPrice
      }));
      
      const orderData = {
        reference: reference,
        amount: Math.round(total * 100),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        deliveryAddress: selectedAddress,
        items: orderItems,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        isGuest: false,
        buyerLocation: buyerLocation,
        metadata: {
          userId: user._id,
          validatedItems: orderItems,
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
        <button onClick={() => navigate('/login')} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          Sign In
        </button>
      </div>
    );
  }

  if (loadingAddresses || validatingItems) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
        <p className="mt-4 text-gray-500">
          {validatingItems ? 'Validating your cart...' : 'Loading your information...'}
        </p>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 text-lg mb-4">{validationError}</p>
        {invalidItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md mx-auto text-left">
            <p className="font-semibold text-red-700 mb-2">Items not deliverable to {buyerLocation.city}:</p>
            <ul className="list-disc list-inside">
              {invalidItems.map((item, idx) => (
                <li key={idx} className="text-sm text-red-600">{item.title}</li>
              ))}
            </ul>
          </div>
        )}
        <button onClick={() => navigate('/cart')} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          Return to Cart
        </button>
        <button onClick={() => navigate('/profile')} className="ml-3 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Change Location
        </button>
      </div>
    );
  }

  if (validatedItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">Your cart is empty</p>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
        
        <h1 className="text-xl font-bold mb-4">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="border bg-white border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Delivery Address
              </h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-3">No saved addresses found</p>
                  <button onClick={() => navigate('/profile?tab=addresses')} className="text-orange-500 hover:text-orange-600">
                    + Add Delivery Address
                  </button>
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
                  <button onClick={() => navigate('/profile?tab=addresses')} className="text-orange-500 hover:text-orange-600 text-sm mt-2">
                    + Add New Address
                  </button>
                </div>
              )}
            </div>
            
            <div className="border bg-white border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="max-h-64 overflow-y-auto mb-4 space-y-3">
                {validatedItems.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.title} × {item.quantity}</span>
                      <span className="font-semibold">{formatPrice(item.finalPrice.totalProductPrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Delivery fee:</span>
                      <span>{formatPrice(item.finalPrice.totalDeliveryPrice)}</span>
                    </div>
                    {item.discountInfo.enabled && (
                      <div className="flex justify-between text-xs text-green-600">
                        <span>Bulk discount applied:</span>
                        <span>{item.discountInfo.discountType === 'percentage' ? `${item.discountInfo.discountValue}% off` : `${formatPrice(item.discountInfo.discountValue)} off`} (min {item.discountInfo.minQuantity} items)</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 mb-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
              </div>
              
              <div className="flex justify-between text-xl font-bold pt-4 border-t border-gray-200">
                <span>Total</span><span className="text-orange-600">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="border bg-white border-gray-200 p-6 sticky top-20">
              <div className="flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-orange-500" /><h2 className="text-xl font-bold">Payment Method</h2></div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Secure payment powered by Paystack</p>
                <p className="text-xs text-gray-500">Supported: All cards, Bank Transfers, USSD, Mobile Money</p>
              </div>
              <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-orange-700 mb-1">
                  <Truck className="w-4 h-4" /><span className="font-medium">Delivery to: {buyerLocation.city || 'Not selected'}</span>
                </div>
                {!buyerLocation.city && <p className="text-xs text-orange-600 mt-1">Please set your delivery location first</p>}
              </div>
              <button onClick={initializePaystackPayment} disabled={processing || addresses.length === 0 || !buyerLocation.city || !addressLocationValid}
                className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {processing ? <><Loader className="w-5 h-5 animate-spin" />Processing...</> : `Pay ${formatPrice(total)}`}
              </button>
              {addresses.length === 0 && <p className="text-xs text-center mt-4 text-red-500">Please add a delivery address to continue</p>}
              {!buyerLocation.city && <p className="text-xs text-center mt-4 text-orange-500">Please set your delivery location first</p>}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
            <div className="mb-4 flex justify-center"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div></div>
            <h3 className="text-xl font-bold mb-2">Payment Initialized</h3>
            <p className="text-gray-600 mb-6">You will be redirected to Paystack to complete your payment.</p>
            <div className="flex justify-center items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div><span className="text-gray-600">Redirecting...</span></div>
          </div>
        </div>
      )}

      {showProfileWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-orange-500" /></div>
            <h3 className="text-xl font-bold text-center mb-2">Profile Incomplete</h3>
            <p className="text-gray-600 text-center mb-4">Please complete your profile information before making a payment.</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="font-semibold text-gray-700 mb-2">Missing Information:</p>
              <ul className="space-y-1">
                {missingFields.map((field, index) => (<li key={index} className="text-sm text-gray-600 flex items-center gap-2"><User className="w-4 h-4" />{field}</li>))}
                {addresses.length === 0 && (<li className="text-sm text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4" />Delivery Address</li>)}
              </ul>
            </div>
            <div className="flex gap-3"><button onClick={() => navigate('/profile')} className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600">Update Profile</button>
            <button onClick={() => setShowProfileWarning(false)} className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50">Cancel</button></div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentPage;