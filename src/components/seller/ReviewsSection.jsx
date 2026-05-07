import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { useData } from '../../contexts/DataContext';
import { Package, Star } from 'lucide-react';

const ReviewsSection = ({ products, sellerId, formatPrice }) => {
  const [productReviews, setProductReviews] = useState({});
  const [sellerReviews, setSellerReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProtestModal, setShowProtestModal] = useState(false);
  const [protestReason, setProtestReason] = useState('');
  const [protesting, setProtesting] = useState(false);
  const { showSuccess, showError } = useData();

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const fetchAllReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch reviews for each product
      const productReviewPromises = products.map(async (product) => {
        const response = await axios.get(
          `${API_BASE_URL}/reviews/product/${product._id}/all`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return { productId: product._id, reviews: response.data.data || [] };
      });
      
      const productReviewsResults = await Promise.all(productReviewPromises);
      const productReviewsMap = {};
      productReviewsResults.forEach(result => {
        productReviewsMap[result.productId] = result.reviews;
      });
      setProductReviews(productReviewsMap);
      
      // Fetch seller reviews
      const sellerResponse = await axios.get(
        `${API_BASE_URL}/reviews/seller/${sellerId}/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSellerReviews(sellerResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleProtest = async (reviewId, type) => {
    if (!protestReason.trim()) {
      showError('Please provide a reason for protesting this review');
      return;
    }
    
    setProtesting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/reviews/protest`,
        {
          reviewId,
          type,
          reason: protestReason,
          sellerId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        showSuccess('Your protest has been submitted. Admin will review it shortly.');
        setShowProtestModal(false);
        setProtestReason('');
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Error submitting protest:', error);
      showError(error.response?.data?.message || 'Failed to submit protest');
    } finally {
      setProtesting(false);
    }
  };

  const StarDisplay = ({ rating }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <p className="text-gray-500 mt-2">Loading reviews...</p>
      </div>
    );
  }

  const hasReviews = Object.values(productReviews).some(arr => arr.length > 0) || sellerReviews.length > 0;

  if (!hasReviews) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No reviews yet</p>
        <p className="text-sm text-gray-400 mt-1">When customers review your products, they'll appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Seller Reviews */}
      {sellerReviews.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Reviews</h3>
          <div className="grid grid-cols-1 gap-4">
            {sellerReviews.map((review) => (
              <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 font-semibold">
                          {review.userName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{review.userName}</p>
                        <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <StarDisplay rating={review.rating} />
                    {review.comment && (
                      <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
                    )}
                    {review.sellerResponse && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-700">Your Response:</p>
                        <p className="text-sm text-gray-600">{review.sellerResponse}</p>
                      </div>
                    )}
                  </div>
                  {!review.protested && (
                    <button
                      onClick={() => {
                        setSelectedProduct({ id: review.sellerId, type: 'seller', reviewId: review._id });
                        setShowProtestModal(true);
                      }}
                      className="text-red-500 hover:text-red-600 text-sm px-3 py-1 border border-red-300 rounded-lg hover:bg-red-50 transition"
                    >
                      Protest
                    </button>
                  )}
                  {review.protested && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Protested</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Reviews */}
      {products.map((product) => {
        const reviews = productReviews[product._id] || [];
        if (reviews.length === 0) return null;
        
        return (
          <div key={product._id} className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-4 mb-4">
              {product.images?.[0] && (
                <img src={product.images[0]} alt={product.title} className="w-12 h-12 object-cover rounded" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{product.title}</h3>
                <p className="text-sm text-gray-500">{formatPrice(product.price)}</p>
              </div>
            </div>
            <div className="space-y-3 pl-0 md:pl-16">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 font-semibold">
                            {review.userName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{review.userName}</p>
                          <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <StarDisplay rating={review.rating} />
                      {review.comment && (
                        <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
                      )}
                      {review.sellerResponse && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-700">Your Response:</p>
                          <p className="text-sm text-gray-600">{review.sellerResponse}</p>
                        </div>
                      )}
                    </div>
                    {!review.protested && (
                      <button
                        onClick={() => {
                          setSelectedProduct({ id: product._id, type: 'product', reviewId: review._id });
                          setShowProtestModal(true);
                        }}
                        className="text-red-500 hover:text-red-600 text-sm px-3 py-1 border border-red-300 rounded-lg hover:bg-red-50 transition"
                      >
                        Protest
                      </button>
                    )}
                    {review.protested && (
                      <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Protested</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Protest Modal */}
      {showProtestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Protest Review</h2>
              <p className="text-sm text-gray-500 mt-1">
                Please explain why you disagree with this review
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Protest
                </label>
                <textarea
                  value={protestReason}
                  onChange={(e) => setProtestReason(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., This review is inaccurate, The reviewer hasn't purchased this product, etc."
                />
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg mb-4">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Your protest will be sent to the admin for review. 
                  If approved, the review will be removed or modified.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleProtest(selectedProduct?.reviewId, selectedProduct?.type)}
                  disabled={protesting}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  {protesting ? 'Submitting...' : 'Submit Protest'}
                </button>
                <button
                  onClick={() => {
                    setShowProtestModal(false);
                    setProtestReason('');
                    setSelectedProduct(null);
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
  );
};

export default ReviewsSection;