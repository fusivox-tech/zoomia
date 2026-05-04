import { useState, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import SellerDeliveryZones from './SellerDeliveryZones';
import { Store, Package, Truck, Shield, Percent, Users, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';

const SellerOrderCard = ({ order, formatPrice, getOrderStatusColor, onOrderCancelled, onUpdateStatus }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  
  const orderStatus = order.status || 'pending';
  const orderDate = order.createdAt;
  
  const now = new Date();
  const orderCreatedAt = new Date(orderDate);
  const daysSinceOrder = (now - orderCreatedAt) / (1000 * 60 * 60 * 24);
  const canCancel = order.status !== 'delivered' && !order.deliveryDisputed && daysSinceOrder <= 7;
  
  useEffect(() => {
    if (!canCancel) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = (now - orderCreatedAt) / 1000;
      const remaining = 7 * 24 * 60 * 60 - elapsed;
      
      if (remaining <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      } else {
        const days = Math.floor(remaining / (24 * 3600));
        const hours = Math.floor((remaining % (24 * 3600)) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        setTimeLeft({ days, hours, minutes });
      }
    }, 60000);
    
    return () => clearInterval(timer);
  }, [canCancel, orderCreatedAt]);
  
  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/orders/${order._id}/cancel`,
        { cancellationReason, cancelledBy: 'seller' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert(response.data.message);
        if (onOrderCancelled) onOrderCancelled();
        setShowCancelModal(false);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white text-sm font-mono">
              Order #{order.reference?.slice(-8) || order._id.slice(-8)}
            </p>
            <p className="text-orange-100 text-xs mt-1">
              {new Date(orderDate).toLocaleDateString()} at {new Date(orderDate).toLocaleTimeString()}
            </p>
          </div>
          <span className={`px-3 py-1 text-xs rounded-full bg-white/20 text-white capitalize`}>
            {orderStatus}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        {orderStatus === 'cancelled' && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Order Cancelled</p>
                <p className="text-xs text-red-700">
                  Cancelled by: {order.cancelledBy === 'seller' ? 'You (Seller)' : 'Customer'}
                </p>
                {order.cancellationReason && (
                  <p className="text-xs text-red-700 mt-1">Reason: {order.cancellationReason}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-orange-500 text-lg font-semibold">
              {order.buyerFullName?.charAt(0) || 'C'}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{order.buyerFullName || 'Guest Customer'}</p>
            <p className="text-sm text-gray-500">{order.buyerEmail}</p>
            {order.buyerPhone && (
              <a href={`tel:${order.buyerPhone}`} className="text-sm text-orange-500 hover:text-orange-600 inline-flex items-center gap-1 mt-1">
                📞 {order.buyerPhone}
              </a>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Items Ordered ({order.items?.length || 0})</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  {item.product?.images?.[0] && (
                    <img src={item.product.images[0]} alt={item.title} className="w-8 h-8 rounded object-cover" />
                  )}
                  <span className="text-gray-700">{item.quantity}x {item.title}</span>
                </div>
                <span className="font-medium text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        
        {order.deliveryAddress && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">📍 Delivery Address</p>
            <p className="text-xs text-gray-600">
              {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state}
            </p>
            {order.deliveryAddress.landmark && (
              <p className="text-xs text-gray-500 mt-1">📍 Landmark: {order.deliveryAddress.landmark}</p>
            )}
            {order.deliveryAddress.askFor && (
              <p className="text-xs text-gray-500">👤 Ask for: {order.deliveryAddress.askFor}</p>
            )}
          </div>
        )}
        
        {order.trackingInfo && (orderStatus === 'shipped' || orderStatus === 'processing') && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-800 mb-1">📦 Tracking Information</p>
            <p className="text-xs text-blue-700">Tracking #: {order.trackingInfo.trackingNumber}</p>
            <p className="text-xs text-blue-700">Carrier: {order.trackingInfo.carrier}</p>
          </div>
        )}
        
        {canCancel && orderStatus !== 'cancelled' && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-yellow-800">Seller Cancellation Available</p>
                <p className="text-xs text-yellow-700">You can cancel this order within:</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-yellow-800">
                  {timeLeft.days}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m
                </p>
                <p className="text-xs text-yellow-700">(Too many order cancelation will result in suspension of your seller account)</p>
              </div>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="mt-3 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
            >
              Cancel Order
            </button>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-orange-600">₦{order.total?.toLocaleString() || 0}</p>
          </div>
          {orderStatus !== 'cancelled' && orderStatus !== 'delivered' && (
            <button
              onClick={() => onUpdateStatus(order)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium"
            >
              Update Status
            </button>
          )}
        </div>
      </div>
      
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Cancel Order</h2>
              <p className="text-sm text-gray-500 mt-1">Please tell us why you're cancelling this order (optional)</p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason</label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Out of stock, Customer requested cancellation, Shipping issues, etc."
                />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg mb-4">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> As a seller, cancelling this order will notify the customer. 
                  <strong>No penalty fee applies</strong> to seller-initiated cancellations. 
                  The customer will receive a <strong>100% full refund</strong>.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReason('');
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductListingModal = ({ 
  show, 
  editingProduct, 
  formData, 
  loading, 
  selectedCategory, 
  customCategory, 
  categories, 
  imagePreviews, 
  newTag,
  variantForm,
  showVariantModal,
  onClose, 
  onSubmit, 
  onInputChange, 
  onImageUpload, 
  onRemoveImage, 
  onAddTag, 
  onRemoveTag, 
  onSetNewTag,
  onSetSelectedCategory,
  onSetCustomCategory,
  onSetShowVariantModal,
  onSetVariantForm,
  onAddVariant,
  onRemoveVariant,
  onDeliveryZonesUpdate,
  onSetEditingProduct,
  editingProductId,
  currentZones,
  selectedCategories,
  setSelectedCategories,
  showCategoryDropdown,
  setShowCategoryDropdown
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingProduct ? 'Edit Product' : 'Create New Listing'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter product title"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={onInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Describe your product in detail..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (NGN) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={onInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={onInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Categories - Multi-Select with Checkboxes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories <span className="text-red-500">*</span>
              </label>
              
              {/* Category Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-left flex justify-between items-center bg-white"
                >
                  <span className={selectedCategories.length === 0 ? "text-gray-400" : "text-gray-700"}>
                    {selectedCategories.length === 0 
                      ? "Select categories..." 
                      : `${selectedCategories.length} category${selectedCategories.length !== 1 ? 'ies' : ''} selected`}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Category Dropdown Options */}
                {showCategoryDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-0" 
                      onClick={() => setShowCategoryDropdown(false)}
                    />
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* Select All Option */}
                      <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <label className="flex items-center p-2 hover:bg-orange-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.length === categories.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allCategories = [...categories];
                                setSelectedCategories(allCategories);
                                onInputChange({ target: { name: 'categories', value: allCategories } });
                              } else {
                                setSelectedCategories([]);
                                onInputChange({ target: { name: 'categories', value: [] } });
                              }
                            }}
                            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">Select All Categories</span>
                        </label>
                      </div>
                      
                      {/* Individual Category Options */}
                      <div className="p-2">
                        {categories.map(cat => (
                          <label key={cat} className="flex items-center p-2 hover:bg-orange-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat)}
                              onChange={(e) => {
                                let updatedCategories;
                                if (e.target.checked) {
                                  updatedCategories = [...selectedCategories, cat];
                                } else {
                                  updatedCategories = selectedCategories.filter(c => c !== cat);
                                }
                                setSelectedCategories(updatedCategories);
                                onInputChange({ target: { name: 'categories', value: updatedCategories } });
                              }}
                              className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Selected Categories Tags */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCategories.map((cat, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      {cat}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedCategories = selectedCategories.filter((_, i) => i !== index);
                          setSelectedCategories(updatedCategories);
                          onInputChange({ target: { name: 'categories', value: updatedCategories } });
                        }}
                        className="ml-2 text-orange-500 hover:text-orange-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Select one or more categories for your product</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={onInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={onInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Brand name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit)</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={onInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Unique product code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={onInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (L × W × H)</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  name="dimensions.length"
                  value={formData.dimensions.length}
                  onChange={onInputChange}
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="L"
                />
                <input
                  type="text"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={onInputChange}
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="W"
                />
                <input
                  type="text"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={onInputChange}
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="H"
                />
              </div>
            </div>

            {editingProduct && formData.images.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Images</label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt={`Product ${index}`} className="w-full h-20 object-cover rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingProduct ? 'Add New Images' : 'Product Images'}
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 5MB each (Max 10 images)</p>
              {imagePreviews.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => onRemoveImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex flex-col md:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => onSetNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Add tags (e.g., wireless, bluetooth)"
                />
                <button
                  type="button"
                  onClick={onAddTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => onRemoveTag(tag)}
                      className="ml-2 text-orange-500 hover:text-orange-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <SellerDeliveryZones
              productId={editingProductId}
              currentZones={currentZones}
              onZonesUpdate={onDeliveryZonesUpdate}
            />

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Variants (Size, Color, etc.)</h3>
                <button
                  type="button"
                  onClick={() => onSetShowVariantModal(true)}
                  className="text-orange-500 hover:text-orange-600 text-sm"
                >
                  + Add Variant
                </button>
              </div>
              
              {formData.variants.length > 0 && (
                <div className="space-y-2">
                  {formData.variants.map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{variant.name}</p>
                        <p className="text-xs text-gray-600">Price: ₦{variant.price} | Stock: {variant.stock || 'Unlimited'}</p>
                        {variant.sku && <p className="text-xs text-gray-500">SKU: {variant.sku}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveVariant(variant.id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Listing')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Seller = () => {
  const { user } = useData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingListings, setFetchingListings] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [showListingModal, setShowListingModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categories: [],
    stock: '',
    images: [],
    condition: 'new',
    brand: '',
    sku: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    tags: [],
    variants: [],
    deliveryZones: []
  });

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [variantForm, setVariantForm] = useState({
    name: '',
    price: '',
    stock: '',
    sku: ''
  });
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [trackingInfo, setTrackingInfo] = useState({
    trackingNumber: '',
    carrier: '',
    estimatedDelivery: ''
  });

  const getAuthToken = () => localStorage.getItem('token');

  const categories = [
    'Appliances', 'Phones & Tablets', 'Health & Beauty', 'Home & Office', 
    'Electronics', 'Fashion', 'Supermarket', 'Computing', 'Baby Product', 'Gaming', 'Other'
  ];
  
  const handleDeliveryZonesUpdate = useCallback((zones) => {
    setFormData(prev => ({ ...prev, deliveryZones: zones }));
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (user && user._id) {
      setIsDataLoaded(false);
      setFetchingListings(true);
      Promise.all([fetchSellerProducts(), fetchSellerOrders()]).finally(() => {
        setIsDataLoaded(true);
        setFetchingListings(false);
      });
    } else if (user === null) {
      setIsDataLoaded(false);
    }
  }, [user]);
  
  const checkCanSell = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/user/can-sell`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        if (!response.data.canSell) {
          const missingFieldsList = response.data.missingFields.join(', ');
          if (response.data.missingFields.includes('Bank Account')) {
            alert(`Please add your ${missingFieldsList} in your profile before creating a product listing.\n\nBank Account is required to receive payouts for your sales.`);
          } else {
            alert(`Please add your ${missingFieldsList} in your profile before creating a product listing.`);
          }
          navigate('/profile');
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking seller eligibility:', error);
      alert('Unable to verify seller information. Please try again.');
      return false;
    }
  };

  const fetchSellerProducts = async () => {
    setFetchingListings(true);
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/products/seller/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setProducts(response.data.data || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setProducts([]);
    } finally {
      setFetchingListings(false);
    }
  };

  const fetchSellerOrders = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/orders/seller/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: checked }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    const newImages = [...selectedImages, ...files];
    if (newImages.length > 10) {
      setMessage({ type: 'error', text: 'Maximum 10 images allowed' });
      return;
    }
    setSelectedImages(newImages);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }, [selectedImages]);

  const removeImage = useCallback((index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, [imagePreviews]);

  const addTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  }, [newTag, formData.tags]);

  const removeTag = useCallback((tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  const addVariant = useCallback(() => {
    if (variantForm.name && variantForm.price) {
      setFormData(prev => ({
        ...prev,
        variants: [...prev.variants, { ...variantForm, id: Date.now() }]
      }));
      setVariantForm({ name: '', price: '', stock: '', sku: '' });
      setShowVariantModal(false);
    }
  }, [variantForm]);

  const removeVariant = useCallback((variantId) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId)
    }));
  }, []);

  const uploadImages = async () => {
    if (selectedImages.length === 0) return [];
    const formDataImg = new FormData();
    selectedImages.forEach(image => formDataImg.append('images', image));
    try {
      const token = getAuthToken();
      const response = await axios.post(`${API_BASE_URL}/upload/product-images`, formDataImg, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!formData.title || !formData.description || !formData.price || formData.categories.length === 0) {
      setMessage({ type: 'error', text: 'Please fill in all required fields and select at least one category' });
      setLoading(false);
      return;
    }

    try {
      let uploadedImageUrls = [];
      if (selectedImages.length > 0) {
        uploadedImageUrls = await uploadImages();
      }

      const productData = {
        ...formData,
        sellerId: user._id,
        sellerName: user.businessName || user.fullName,
        sellerEmail: user.email,
        images: [...formData.images, ...uploadedImageUrls],
        sellerPhone: user.phone,
        category: formData.categories[0],
        categories: formData.categories
      };

      const token = getAuthToken();
      let response;
      
      if (editingProduct) {
        response = await axios.put(`${API_BASE_URL}/products/${editingProduct._id}`, productData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/products`, productData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      }

      if (response.data.success) {
        setMessage({ type: 'success', text: editingProduct ? 'Product updated successfully!' : 'Product listed successfully!' });
        resetForm();
        await fetchSellerProducts();
        setShowListingModal(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      if (error.response?.status === 401) {
        setMessage({ type: 'error', text: 'Session expired. Please login again.' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save product' });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      price: '',
      categories: [],
      stock: '',
      images: [],
      condition: 'new',
      brand: '',
      sku: '',
      weight: '',
      dimensions: { length: '', width: '', height: '' },
      tags: [],
      variants: [],
      deliveryZones: []
    });
    setSelectedCategories([]);
    setSelectedImages([]);
    setImagePreviews(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    });
    setNewTag('');
    setEditingProduct(null);
    setShowCategoryDropdown(false);
  }, []);

  const editProduct = useCallback((product) => {
    setEditingProduct(product);
    const productCategories = Array.isArray(product.categories) ? product.categories : [product.category];
    setSelectedCategories(productCategories);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      categories: productCategories,
      stock: product.stock,
      images: product.images || [],
      condition: product.condition || 'new',
      brand: product.brand || '',
      sku: product.sku || '',
      weight: product.weight || '',
      dimensions: product.dimensions || { length: '', width: '', height: '' },
      tags: product.tags || [],
      variants: product.variants || [],
      deliveryZones: product.deliveryZones || []
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setShowListingModal(true);
  }, []);

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = getAuthToken();
      const response = await axios.delete(`${API_BASE_URL}/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Product deleted successfully!' });
        await fetchSellerProducts();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage({ type: 'error', text: 'Failed to delete product' });
    }
  };

  const updateOrderStatus = async (orderId, status, tracking = null) => {
    try {
      setUpdatingOrderStatus(true);
      const token = getAuthToken();
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status,
        trackingInfo: tracking
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: `Order status updated to ${status}` });
        await fetchSellerOrders();
        setShowOrderModal(false);
        setSelectedOrder(null);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage({ type: 'error', text: 'Failed to update order status' });
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Out of Stock', color: 'red' };
    if (stock <= 10) return { label: 'Low Stock', color: 'orange' };
    return { label: 'In Stock', color: 'green' };
  };

  const getOrderStatusColor = (status) => {
    const colors = { pending: 'yellow', processing: 'blue', shipped: 'purple', delivered: 'green', cancelled: 'red' };
    return colors[status] || 'gray';
  };

  const closeModal = useCallback(() => {
    setShowListingModal(false);
    resetForm();
  }, [resetForm]);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (!isDataLoaded || user === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-500">Loading your seller dashboard...</p>
        </div>
      </div>
    );
  }

  // Onboarding screen for sellers with no products
  if (products.length === 0 && activeTab === 'inventory' && !fetchingListings && isDataLoaded) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
              <Store className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Become a Seller on Zoomia</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Start earning by selling your products to thousands of customers across Nigeria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reach More Customers</h3>
              <p className="text-gray-600 text-sm">Connect with thousands of active buyers looking for products like yours</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Delivery Management</h3>
              <p className="text-gray-600 text-sm">Set your own delivery zones and prices. You control how your products reach customers</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm">Get paid securely through our integrated payment system with Paystack</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">How Selling on Zoomia Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                <h3 className="font-semibold text-gray-900 mb-2">Create Listing</h3>
                <p className="text-sm text-gray-600">Add your products with photos, prices, and descriptions</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                <h3 className="font-semibold text-gray-900 mb-2">Set Delivery Zones</h3>
                <p className="text-sm text-gray-600">Choose which cities you deliver to and set delivery prices</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                <h3 className="font-semibold text-gray-900 mb-2">Receive Orders</h3>
                <p className="text-sm text-gray-600">Get notified when customers purchase your products</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
                <h3 className="font-semibold text-gray-900 mb-2">Contact Buyer</h3>
                <p className="text-sm text-gray-600">Get in touch with the buyer and finalize delivery arrangement</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">5</div>
                <h3 className="font-semibold text-gray-900 mb-2">Deliver The Order</h3>
                <p className="text-sm text-gray-600">Deliver the ordered product(s) to the customer within 7 days</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">6</div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Paid</h3>
                <p className="text-sm text-gray-600">Receive payments directly to your payout account 24 hours after delivery</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Percent className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">Platform Fees & Commissions</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-900">5% Platform Fee</p>
                <p className="text-sm text-orange-700 mt-1">Deducted from your earnings</p>
                <p className="text-xs text-orange-600 mt-2">When you sell a product for ₦10,000, you receive ₦9,500</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800"><strong>How it works:</strong> When a customer buys your product, you receive the amount minus 5% platform fee. The buyer pays exactly what you list. No extra charges!</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">Delivery Management</h2>
            </div>
            <p className="text-gray-600 mb-4">As a seller on Zoomia, you're in complete control of your delivery process:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Set delivery prices for each city in Nigeria</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Offer bulk discounts on delivery or product prices</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Choose which cities you can deliver to</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Update order status and add tracking information</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={async () => {
                const canSell = await checkCanSell();
                if (canSell) {
                  resetForm();
                  setShowListingModal(true);
                }
              }}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-orange-600 transition"
            >
              Start Selling Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-500 mt-4">No commitment required • Cancel anytime • Free to list</p>
          </div>
        </div>

        <ProductListingModal
          show={showListingModal}
          editingProduct={editingProduct}
          formData={formData}
          loading={loading}
          selectedCategory={selectedCategory}
          customCategory={customCategory}
          categories={categories}
          imagePreviews={imagePreviews}
          newTag={newTag}
          variantForm={variantForm}
          showVariantModal={showVariantModal}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onImageUpload={handleImageUpload}
          onRemoveImage={removeImage}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onSetNewTag={setNewTag}
          onSetSelectedCategory={setSelectedCategory}
          onSetCustomCategory={setCustomCategory}
          onSetShowVariantModal={setShowVariantModal}
          onSetVariantForm={setVariantForm}
          onAddVariant={addVariant}
          onRemoveVariant={removeVariant}
          onDeliveryZonesUpdate={handleDeliveryZonesUpdate}
          onSetEditingProduct={setEditingProduct}
          editingProductId={editingProduct?._id}
          currentZones={formData.deliveryZones}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          showCategoryDropdown={showCategoryDropdown}
          setShowCategoryDropdown={setShowCategoryDropdown}
        />
      </>
    );
  }

  // Main dashboard for sellers with products
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
        <p className="text-gray-600">Manage your inventory and orders</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 
          'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <Package className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <Truck className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue (Before Fee)</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Estimated earnings after 5% fee: ₦{(orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0) * 0.95).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-4 px-1 font-medium text-sm ${
              activeTab === 'inventory' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Inventory Management
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-1 font-medium text-sm ${
              activeTab === 'orders' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Order Management
          </button>
        </nav>
      </div>

      {activeTab === 'inventory' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Products</h2>
            <button
              onClick={async () => {
                const canSell = await checkCanSell();
                if (canSell) {
                  resetForm();
                  setShowListingModal(true);
                }
              }}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Product
            </button>
          </div>

          {fetchingListings ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No products in inventory</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add New Product" to start selling</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <div key={product._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt={product.title} className="w-full h-48 object-contain" />
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full bg-${stockStatus.color}-100 text-${stockStatus.color}-700`}>
                          {stockStatus.label}
                        </span>
                      </div>
                      <p className="text-orange-500 font-bold text-lg">₦{product.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-600 mt-1">Stock: {product.stock || 'Unlimited'}</p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => editProduct(product)}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(product._id)}
                          className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Management</h2>
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Truck className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No orders yet</p>
              <p className="text-sm text-gray-400 mt-1">When customers order your products, they'll appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders.map((order) => (
                <SellerOrderCard 
                  key={order._id}
                  order={order}
                  formatPrice={formatPrice}
                  getOrderStatusColor={getOrderStatusColor}
                  onOrderCancelled={fetchSellerOrders}
                  onUpdateStatus={(selectedOrder) => {
                    setSelectedOrder(selectedOrder);
                    setOrderStatus(selectedOrder.status || 'pending');
                    setTrackingInfo({
                      trackingNumber: selectedOrder.trackingInfo?.trackingNumber || '',
                      carrier: selectedOrder.trackingInfo?.carrier || '',
                      estimatedDelivery: selectedOrder.trackingInfo?.estimatedDelivery || ''
                    });
                    setShowOrderModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ProductListingModal
        show={showListingModal}
        editingProduct={editingProduct}
        formData={formData}
        loading={loading}
        selectedCategory={selectedCategory}
        customCategory={customCategory}
        categories={categories}
        imagePreviews={imagePreviews}
        newTag={newTag}
        variantForm={variantForm}
        showVariantModal={showVariantModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
        onImageUpload={handleImageUpload}
        onRemoveImage={removeImage}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        onSetNewTag={setNewTag}
        onSetSelectedCategory={setSelectedCategory}
        onSetCustomCategory={setCustomCategory}
        onSetShowVariantModal={setShowVariantModal}
        onSetVariantForm={setVariantForm}
        onAddVariant={addVariant}
        onRemoveVariant={removeVariant}
        onDeliveryZonesUpdate={handleDeliveryZonesUpdate}
        onSetEditingProduct={setEditingProduct}
        editingProductId={editingProduct?._id}
        currentZones={formData.deliveryZones}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        showCategoryDropdown={showCategoryDropdown}
        setShowCategoryDropdown={setShowCategoryDropdown}
      />

      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Update Order Status</h2>
              <p className="text-sm text-gray-500 mt-1">Order #{selectedOrder.reference?.slice(-8) || selectedOrder._id.slice(-8)}</p>
            </div>
            
            <div className="p-6">
              {selectedOrder.status === 'cancelled' && (
                <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">This order has been cancelled. You cannot update the status of a cancelled order.</p>
                </div>
              )}
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Buyer Information</h3>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium text-gray-600">Name:</span> <span className="text-gray-900">{selectedOrder.buyerFullName || 'Guest'}</span></p>
                  <p className="text-sm"><span className="font-medium text-gray-600">Email:</span> <a href={`mailto:${selectedOrder.buyerEmail}`} className="text-orange-500 hover:text-orange-600">{selectedOrder.buyerEmail}</a></p>
                  {selectedOrder.buyerPhone && (
                    <p className="text-sm"><span className="font-medium text-gray-600">Phone:</span> <a href={`tel:${selectedOrder.buyerPhone}`} className="text-orange-500 hover:text-orange-600">{selectedOrder.buyerPhone}</a></p>
                  )}
                </div>
                {selectedOrder.deliveryAddress && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-600">{selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}</p>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  disabled={selectedOrder.status === 'cancelled'}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {orderStatus === 'shipped' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingInfo.trackingNumber}
                      onChange={(e) => setTrackingInfo(prev => ({ ...prev, trackingNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                    <input
                      type="text"
                      value={trackingInfo.carrier}
                      onChange={(e) => setTrackingInfo(prev => ({ ...prev, carrier: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter Carrier"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery Date</label>
                    <input
                      type="date"
                      value={trackingInfo.estimatedDelivery}
                      onChange={(e) => setTrackingInfo(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-center text-gray-600 mt-2">Cannot be longer than 7 days after order was placed.</p>
                  </div>
                </div>
              )}

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="text-sm flex justify-between">
                        <span className="text-gray-600">{item.quantity}x {item.title}</span>
                        <span className="text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    {selectedOrder.items.length > 3 && (
                      <p className="text-xs text-gray-500">+{selectedOrder.items.length - 3} more items</p>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                    <span className="font-medium text-gray-700">Total</span>
                    <span className="font-bold text-orange-600">₦{selectedOrder.total?.toLocaleString() || 0}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => updateOrderStatus(selectedOrder._id, orderStatus, trackingInfo)}
                  disabled={selectedOrder.status === 'cancelled' || updatingOrderStatus}
                  className={`flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed ${selectedOrder.status === 'delivered' ? 'hidden' : ''}`}
                >
                  {updatingOrderStatus ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                    setOrderStatus('');
                    setTrackingInfo({ trackingNumber: '', carrier: '', estimatedDelivery: '' });
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
              
              {selectedOrder.buyerPhone && selectedOrder.status !== 'cancelled' && (
                <div className="mt-4 text-center">
                  <a href={`tel:${selectedOrder.buyerPhone}`} className="text-sm text-orange-500 hover:text-orange-600">📞 Call Buyer to Coordinate Delivery</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showVariantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Add Product Variant</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Large, Red, 64GB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, price: e.target.value }))}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  value={variantForm.stock}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, stock: e.target.value }))}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Optional)</label>
                <input
                  type="text"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Unique code"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={addVariant} className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600">Add Variant</button>
              <button onClick={() => setShowVariantModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seller;