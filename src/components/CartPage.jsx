// CartPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

// Skeleton Loader Component
const CartSkeleton = () => (
  <div className="border border-gray-200 animate-pulse">
    {[...Array(2)].map((_, index) => (
      <div key={index} className="p-4 border-b border-gray-200">
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="flex gap-4">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="w-20">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const CartPage = () => {
  const { cartItems, updateCartQuantity, removeFromCart, clearCart, user, loading } = useData();
  const [localCartItems, setLocalCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setLocalCartItems(cartItems);
  }, [cartItems]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartQuantity(index, newQuantity);
  };

  const handleRemoveItem = (index) => {
    if (window.confirm('Remove this item from cart?')) {
      removeFromCart(index);
    }
  };

  const handleProceedToCheckout = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token || !user) {
      // Save current path to redirect back after login
      localStorage.setItem('redirectAfterLogin', '/payment');
      navigate('/login');
      return;
    }
    
    // User is logged in, proceed to payment
    navigate('/payment');
  };

  // Calculate subtotal (sum of all item prices × quantity)
  const subtotal = localCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate shipping based on each product's individual shipping cost
  const shipping = localCartItems.reduce((sum, item) => {
    // If item has free shipping, add 0
    if (item.shipping?.free) return sum + 0;
    // Otherwise add the item's shipping cost multiplied by quantity
    // (shipping cost is per item, so multiply by quantity)
    const itemShippingCost = item.shipping?.cost || 0;
    return sum + (itemShippingCost * item.quantity);
  }, 0);
  
  const total = subtotal + shipping;

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CartSkeleton />
          </div>
          <div className="lg:col-span-1">
            <div className="border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3 mb-4">
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-12 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (localCartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-4">Looks like you haven't added any items yet</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-orange-500 text-white hover:bg-orange-600 transition border-0 rounded-lg"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="border bg-white border-gray-200 rounded-lg">
            {localCartItems.map((item, index) => (
              <div key={index} className="p-4 border-b border-gray-200 last:border-0">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <img 
                      src={item.image || '/placeholder.png'} 
                      alt={item.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    {item.variant && (
                      <p className="text-sm text-gray-500 mb-2">Variant: {item.variant.name}</p>
                    )}
                    <p className="text-orange-600 font-bold">{formatPrice(item.price)}</p>
                    
                    {/* Display shipping cost per item */}
                    {item.shipping && !item.shipping.free && item.shipping.cost > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Shipping: {formatPrice(item.shipping.cost)} per item
                      </p>
                    )}
                    {item.shipping?.free && (
                      <p className="text-xs text-green-600 mt-1">Free shipping</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                          className="p-1 border border-gray-300 rounded hover:border-orange-500 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-gray-700">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          className="p-1 border border-gray-300 rounded hover:border-orange-500 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    {/* Show total shipping for this item */}
                    {item.shipping && !item.shipping.free && item.shipping.cost > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Shipping: {formatPrice(item.shipping.cost * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-4">
            <button 
              onClick={() => navigate('/')}
              className="text-orange-500 hover:text-orange-600 transition"
            >
              ← Continue Shopping
            </button>
            {localCartItems.length > 0 && (
              <button 
                onClick={() => {
                  if (window.confirm('Clear entire cart? This action cannot be undone.')) {
                    clearCart();
                  }
                }}
                className="text-red-500 hover:text-red-600 transition"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border bg-white border-gray-200 rounded-lg p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({localCartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
            </div>
            
            <div className="flex justify-between text-xl font-bold mb-6">
              <span>Total</span>
              <span className="text-orange-600">{formatPrice(total)}</span>
            </div>
            
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition border-0"
            >
              Proceed to Checkout
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Shipping costs are calculated per item based on seller rates
            </p>
            
            {!user && (
              <p className="text-xs text-center mt-4 text-orange-600">
                Sign in to save your cart across devices!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;