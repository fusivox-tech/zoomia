import { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import axios from 'axios';
import API_BASE_URL from '../../config';

const SellerOrderCard = ({ order, formatPrice, getOrderStatusColor, onOrderCancelled, onUpdateStatus }) => {
  const { showSuccess, showError } = useData(); 
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
        showSuccess(response.data.message);
        if (onOrderCancelled) onOrderCancelled();
        setShowCancelModal(false);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };
  
  return (
    <>
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
    </>
  );
};

export default SellerOrderCard;