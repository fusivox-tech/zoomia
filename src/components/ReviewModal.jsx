import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { useData } from '../contexts/DataContext';

const StarRating = ({ rating, onRatingChange, size = 'large' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const starSize = size === 'large' ? 'w-8 h-8' : 'w-5 h-5';
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
        >
          <Star
            className={`${starSize} ${
              (hoverRating || rating) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

// Update the endpoint and product handling:

const ReviewModal = ({ isOpen, onClose, orderId, product, seller, onReviewSubmitted, type }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useData();

  const isProductReview = type === 'product';
  const title = isProductReview ? `Review ${product?.title}` : `Review ${seller?.sellerName}`;
  const endpoint = isProductReview 
    ? `${API_BASE_URL}/reviews/product/${product?.id}`
    : `${API_BASE_URL}/reviews/seller/${seller?.sellerId}`;

  // Fetch existing review on mount
  useEffect(() => {
    if (isOpen && orderId) {
      fetchExistingReview();
    }
  }, [isOpen, orderId, type, product?.id]);

  const fetchExistingReview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = isProductReview
        ? `${API_BASE_URL}/reviews/order/${orderId}/product/${product?.id}`
        : `${API_BASE_URL}/reviews/order/${orderId}/seller`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.data) {
        setExistingReview(response.data.data);
        setRating(response.data.data.rating);
        setComment(response.data.data.comment || '');
      }
    } catch (error) {
      console.error('Error fetching existing review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showError('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        endpoint,
        {
          orderId,
          rating,
          comment,
          ...(isProductReview ? { productId: product?.id } : { sellerId: seller?.sellerId }),
          ...(existingReview && { reviewId: existingReview._id })
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onReviewSubmitted();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {existingReview ? 'Edit Your Review' : `${title}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Loading your review...</div>
          ) : (
            <>
              <div className="text-left mb-6">
                <p className="text-gray-600 mb-2">Your Rating</p>
                <StarRating rating={rating} onRatingChange={setRating} />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Share your experience with this product..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;