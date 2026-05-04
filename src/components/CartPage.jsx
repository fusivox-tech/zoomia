// CartPage.jsx - With product name limited to 2 lines
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trash2, Plus, Minus, ShoppingBag, CheckSquare, Square } from 'lucide-react';

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
  const { cartItems, updateCartQuantity, removeFromCart, clearCart, user, loading, showError } = useData();
  const [localCartItems, setLocalCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [selectAll, setSelectAll] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLocalCartItems(cartItems);
    const initialSelected = {};
    cartItems.forEach((_, index) => {
      initialSelected[index] = true;
    });
    setSelectedItems(initialSelected);
    setSelectAll(true);
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

  const handleToggleItem = (index) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
    const newSelectedItems = { ...selectedItems, [index]: !selectedItems[index] };
    const allSelected = Object.values(newSelectedItems).every(value => value === true);
    setSelectAll(allSelected);
  };

  const handleToggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newSelected = {};
    localCartItems.forEach((_, index) => {
      newSelected[index] = newSelectAll;
    });
    setSelectedItems(newSelected);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleProceedToCheckout = () => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      localStorage.setItem('redirectAfterLogin', '/payment');
      navigate('/login');
      return;
    }
    
    const hasSelectedItems = Object.values(selectedItems).some(value => value === true);
    if (!hasSelectedItems) {
      showError('Please select at least one item to checkout');
      return;
    }
    
    const selectedCartItems = localCartItems.filter((_, index) => selectedItems[index]);
    
    const itemsForCheckout = selectedCartItems.map(item => {
      const itemShippingCost = item.shipping?.free ? 0 : (item.shipping?.cost || 0);
      const totalShipping = itemShippingCost * item.quantity;
      const totalProductPrice = item.price * item.quantity;
      
      return {
        ...item,
        calculatedShipping: totalShipping,
        calculatedSubtotal: totalProductPrice,
        calculatedTotal: totalProductPrice + totalShipping,
        perItemShipping: itemShippingCost,
      };
    });
    
    const overallSubtotal = itemsForCheckout.reduce((sum, item) => sum + item.calculatedSubtotal, 0);
    const overallShipping = itemsForCheckout.reduce((sum, item) => sum + item.calculatedShipping, 0);
    const overallTotal = overallSubtotal + overallShipping;
    
    localStorage.setItem('selectedCartItems', JSON.stringify(itemsForCheckout));
    localStorage.setItem('checkoutTotals', JSON.stringify({
      subtotal: overallSubtotal,
      shipping: overallShipping,
      total: overallTotal,
      itemCount: itemsForCheckout.reduce((sum, item) => sum + item.quantity, 0)
    }));
    
    navigate('/payment');
  };

  const selectedCartItems = localCartItems.filter((_, index) => selectedItems[index]);
  
  const subtotal = selectedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = selectedCartItems.reduce((sum, item) => {
    if (item.shipping?.free) return sum + 0;
    const itemShippingCost = item.shipping?.cost || 0;
    return sum + (itemShippingCost * item.quantity);
  }, 0);
  const total = subtotal + shipping;
  const selectedCount = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><CartSkeleton /></div>
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
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-orange-500 text-white hover:bg-orange-600 transition border-0 rounded-lg">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={handleToggleSelectAll} className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-500 transition">
              {selectAll ? <CheckSquare className="w-5 h-5 text-orange-500" /> : <Square className="w-5 h-5" />}
              <span>{selectAll ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span className="text-xs text-gray-500">{selectedCount} item{selectedCount !== 1 ? 's' : ''} selected</span>
          </div>

          <div className="border bg-white border-gray-200 rounded-lg">
            {localCartItems.map((item, index) => (
              <div key={index} className={`p-4 border-b border-gray-200 last:border-0 transition ${selectedItems[index] ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex md:flex-row flex-col gap-4">
                  <div className="flex relative gap-4">
                    <div className="flex-shrink-0 absolute top-1 h-7 w-7 bg-white p-1 left-1 rounded">
                      <button onClick={() => handleToggleItem(index)} className="focus:outline-none">
                        {selectedItems[index] ? <CheckSquare className="w-5 h-5 text-orange-500" /> : <Square className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                    <div 
                      className="w-24 h-24 bg-gray-100 rounded-lg flex border border-gray-200 items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition overflow-hidden"
                      onClick={() => handleProductClick(item.id)}
                    >
                      <img 
                        src={item.image || '/placeholder.png'} 
                        alt={item.title} 
                        className="w-full h-full object-cover rounded-lg hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="flex-1">
                      {/* Product Title with line-clamp-2 to limit to 2 lines */}
                      <h3 
                        className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-orange-500 transition line-clamp-2"
                        onClick={() => handleProductClick(item.id)}
                      >
                        {item.title}
                      </h3>
                      {item.variant && <p className="text-sm text-gray-500 mb-2">Variant: {item.variant.name}</p>}
                      <p className="text-orange-600 font-bold">{formatPrice(item.price)}</p>
                      {item.shipping && !item.shipping.free && item.shipping.cost > 0 && (
                        <p className="text-xs text-gray-500 mt-1">Shipping: {formatPrice(item.shipping.cost)} per item</p>
                      )}
                      {item.shipping?.free && <p className="text-xs text-green-600 mt-1">Free shipping</p>}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateQuantity(index, item.quantity - 1)} 
                            className="p-1 border border-gray-300 rounded hover:border-orange-500 transition disabled:opacity-50" 
                            disabled={!selectedItems[index]}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-gray-700">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(index, item.quantity + 1)} 
                            className="p-1 border border-gray-300 rounded hover:border-orange-500 transition disabled:opacity-50" 
                            disabled={!selectedItems[index]}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => handleRemoveItem(index)} 
                          className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm transition"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    {item.shipping && !item.shipping.free && item.shipping.cost > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Shipping: {formatPrice(item.shipping.cost * item.quantity)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-4">
            <button onClick={() => navigate('/')} className="text-orange-500 hover:text-orange-600 transition">← Continue Shopping</button>
            {localCartItems.length > 0 && (
              <button onClick={() => { if (window.confirm('Clear entire cart?')) clearCart(); }} className="text-red-500 hover:text-red-600 transition">Clear Cart</button>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="border bg-white border-gray-200 rounded-lg p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            {selectedCount === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No items selected for checkout</p>
                <button onClick={handleToggleSelectAll} className="text-orange-500 hover:text-orange-600 text-sm">Select all items</button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
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
              </>
            )}
            {!user && <p className="text-xs text-center mt-4 text-orange-600">Sign in to save your cart across devices!</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;