import { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { AlertCircle } from 'lucide-react';
import ReviewModal from './ReviewModal';

// OrderCard Component - Handles individual order display and cancellation timer
const OrderCard = ({ order, formatPrice, getOrderStatusColor, onOrderCancelled }) => {
  const { showSuccess, showError } = useData();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  const displayReference = order.reference || order._id;
  const orderItems = order.items || [];
  const orderTotal = order.total || 0;
  const orderStatus = order.status || 'pending';
  const orderDate = order.createdAt;
  
  // Calculate if order is within 24 hours for cancellation
  const now = new Date();
  const orderCreatedAt = new Date(orderDate);
  const hoursSinceOrder = (now - orderCreatedAt) / (1000 * 60 * 60);
  const canCancel = order.status !== 'delivered' && !order.deliveryDisputed && order.status !== 'cancelled' && hoursSinceOrder <= 24;
  
  const sellerName = order.seller?.sellerName || order.sellerName || 'Seller';
  const sellerPhone = order.seller?.sellerPhone || order.sellerPhone;
  const sellerEmail = order.seller?.sellerEmail || order.sellerEmail;
  const sellerProfileImage = order.seller?.sellerProfileImage;
  
const [showProductReviewModal, setShowProductReviewModal] = useState(false);
const [selectedProductForReview, setSelectedProductForReview] = useState(null);
const [productReviews, setProductReviews] = useState({});
const [showSellerReviewModal, setShowSellerReviewModal] = useState(false);
const [hasSellerReview, setHasSellerReview] = useState(false);
const [refreshTrigger, setRefreshTrigger] = useState(0);

// Check for existing reviews on mount
useEffect(() => {
  if (orderStatus === 'delivered' && order.deliveryConfirmed) {
    checkExistingReviews();
  }
}, [order._id, orderStatus, refreshTrigger]);

const checkExistingReviews = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // Check product reviews for each product in the order
    const productReviewStatus = {};
    for (const item of orderItems) {
      const productReviewRes = await axios.get(
        `${API_BASE_URL}/reviews/order/${order._id}/product/${item.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (productReviewRes.data.success && productReviewRes.data.data) {
        productReviewStatus[item.id] = true;
      }
    }
    setProductReviews(productReviewStatus);
    
    // Check seller review
    const sellerReviewRes = await axios.get(
      `${API_BASE_URL}/reviews/order/${order._id}/seller`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (sellerReviewRes.data.success && sellerReviewRes.data.data) {
      setHasSellerReview(true);
    }
  } catch (error) {
    console.error('Error checking reviews:', error);
  }
};
  
  // Timer effect
  useEffect(() => {
    if (!canCancel) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = (now - orderCreatedAt) / 1000;
      const remaining = 24 * 60 * 60 - elapsed;
      
      if (remaining <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = Math.floor(remaining % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [canCancel, orderCreatedAt]);
  
  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/orders/${order._id}/cancel`,
        { cancellationReason },
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
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
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
        
        <div className="p-6">
          
          {/* Refund Status for Cancelled Orders */}
          {orderStatus === 'cancelled' && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Order Cancelled</p>
                  <p className="text-xs text-green-700">
                    Refund Status: {order.refundStatus === 'pending' ? 'Pending' : 'Completed'}
                  </p>
                  {order.refundAmount && (
                    <p className="text-xs text-green-700">
                      Refund Amount: {formatPrice(order.refundAmount)} (95% of total)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Order Items */}
          <div className="space-y-3">
            {orderItems.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                  <img 
                    src={item.image || item.product?.images?.[0] || '/placeholder.png'} 
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
          
          {/* Seller Information */}
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
          </div>
          
          {/* Call Seller Button */}
          {sellerPhone && orderStatus !== 'delivered' && orderStatus !== 'cancelled' && (
            <div className="mt-4">
              <a
                href={`tel:${sellerPhone}`}
                className="block text-center w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
              >
                📞 Call Seller to Arrange Delivery
              </a>
            </div>
          )}
          {/* Cancellation Timer */}
          {canCancel && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Cancellation Available</p>
                  <p className="text-xs text-yellow-700">You can cancel this order within:</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-yellow-800">
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-yellow-700">(5% penalty applies)</p>
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
{orderStatus === 'delivered' && !order.deliveryConfirmed && !order.deliveryDisputed && (
  <div className="mt-4 space-y-3">
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-sm text-blue-800 mb-2">
        <strong>⚠️ Action Required:</strong> Please confirm if you have received this order.
      </p>
      <p className="text-xs text-blue-600 mb-3">
        You have until {new Date(order.deliveryConfirmationDeadline).toLocaleString()} to confirm or dispute.
      </p>
      <div className="flex gap-3">
        <button
          onClick={async () => {
            if (window.confirm('Have you received all items in good condition? Confirming will release payment to the seller.')) {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.post(
                  `${API_BASE_URL}/orders/${order._id}/confirm-delivery`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data.success) {
                  showSuccess(response.data.message);
                  window.location.reload();
                }
              } catch (error) {
                showError(error.response?.data?.message || 'Failed to confirm delivery');
              }
            }
          }}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium"
        >
          ✓ Confirm Delivery
        </button>
        <button
          onClick={() => {
            // Show modal for detailed dispute reason
            const disputeReason = prompt('Please select the reason for dispute:\n\n1. Item not received\n2. Wrong item delivered\n3. Item damaged\n4. Item not as described\n5. Other');
            if (disputeReason) {
              const disputeDetails = prompt('Please provide detailed explanation of what happened (be as specific as possible):\n\nInclude information about:\n- When was delivery attempted?\n- What condition was the item in?\n- Have you contacted the seller?\n- Any other relevant details');
              if (disputeDetails) {
                (async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await axios.post(
                      `${API_BASE_URL}/orders/${order._id}/dispute-delivery`,
                      { disputeReason, disputeDetails },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (response.data.success) {
                      showSuccess(response.data.message);
                      onOrderCancelled();
                    }
                  } catch (error) {
                    showError(error.response?.data?.message || 'Failed to file dispute');
                  }
                })();
              } else {
                showError('Please provide details about the dispute.');
              }
            }
          }}
          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
        >
          ⚠️ Dispute Delivery
        </button>
      </div>
    </div>
  </div>
)}

{orderStatus === 'delivered' && order.deliveryDisputed && (
  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
    <div className="flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-red-600" />
      <p className="text-sm text-red-700 font-medium">Delivery Disputed</p>
    </div>
    <p className="text-xs text-red-600 mt-1">Admin has been notified and will review your case.</p>
  </div>
)}

{orderStatus === 'delivered' && (order.deliveryDisputed || order.deliveryConfirmed) && (
  <>
    {/* Product Reviews - One button per product */}
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-700 mb-2">Rate Products:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {orderItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setSelectedProductForReview(item);
              setShowProductReviewModal(true);
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium flex items-center justify-between"
          >
            <span className="truncate flex-1 text-left">{item.title}</span>
            <span className="ml-2 text-xs">
              {productReviews[item.id] ? 'Edit' : 'Review'}
            </span>
          </button>
        ))}
      </div>
    </div>
    
    {/* Seller Review Button */}
    <div className="mt-3">
      <button
        onClick={() => setShowSellerReviewModal(true)}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
      >
        {hasSellerReview ? 'Edit Seller Review' : 'Review Seller'}
      </button>
    </div>
    
    {/* Product Review Modal */}
    <ReviewModal
      isOpen={showProductReviewModal}
      onClose={() => {
        setShowProductReviewModal(false);
        setSelectedProductForReview(null);
      }}
      orderId={order._id}
      product={selectedProductForReview}
      seller={null}
      onReviewSubmitted={() => {
        setRefreshTrigger(prev => prev + 1);
        if (selectedProductForReview) {
          setProductReviews(prev => ({ ...prev, [selectedProductForReview.id]: true }));
        }
      }}
      type="product"
    />
    
    {/* Seller Review Modal */}
    <ReviewModal
      isOpen={showSellerReviewModal}
      onClose={() => setShowSellerReviewModal(false)}
      orderId={order._id}
      product={null}
      seller={{
        sellerId: order.sellerId,
        sellerName: order.sellerName,
        sellerEmail: order.sellerEmail
      }}
      onReviewSubmitted={() => {
        setRefreshTrigger(prev => prev + 1);
        setHasSellerReview(true);
      }}
      type="seller"
    />
  </>
)}
        </div>
      </div>
      
      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Cancel Order</h2>
              <p className="text-sm text-gray-500 mt-1">
                Please tell us why you're cancelling this order (optional)
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Changed my mind, Found a better price, Delivery takes too long, etc."
                />
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg mb-4">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> A 5% penalty fee will be deducted from your refund. 
                  You will receive 95% of the order total back to your bank account within 5-7 business days.
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
    </>
  );
};

export default OrderCard;