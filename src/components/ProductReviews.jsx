// components/ProductReviews.jsx
import { useState, useEffect } from 'react';
import { Star, ChevronRight, ChevronLeft } from 'lucide-react';
import API_BASE_URL from '../config';

const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < fullStars 
              ? 'text-yellow-400 fill-yellow-400' 
              : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400 opacity-50'
                : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

const ProductReviews = ({ productId, onReviewCountChange }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    totalPages: 0,
    hasMore: false,
    limit: 3
  });
  const [error, setError] = useState(null);

  const fetchReviews = async (page = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews/product/${productId}/paginated?page=${page}&limit=3`
      );
      const data = await response.json();
      
      if (data.success) {
        if (append) {
          setReviews(prev => [...prev, ...data.data]);
        } else {
          setReviews(data.data);
        }
        setPagination({
          currentPage: data.pagination.currentPage,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasMore: data.pagination.hasMore,
          limit: data.pagination.limit
        });
        
        // Notify parent component about total reviews count
        if (onReviewCountChange) {
          onReviewCountChange(data.pagination.total);
        }
      } else {
        setError(data.message || 'Failed to load reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreReviews = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchReviews(pagination.currentPage + 1, true);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews(1, false);
    }
  }, [productId]);

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (loading && !loadingMore) {
    return (
      <div className="bg-white p-6 border-t border-gray-200">
        <div className="animate-pulse">
          <div className="h-7 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 border-t border-gray-200">
        <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchReviews(1, false)}
            className="text-orange-500 hover:text-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white p-6 border-t border-gray-200">
        <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No reviews yet for this product.</p>
          <p className="text-sm text-gray-400 mt-2">Be the first to leave a review!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 border-t border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Customer Reviews
        </h2>
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={averageRating} />
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review, index) => (
          <div key={review._id || index} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 font-medium">
                  {review.userName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <div>
                    <span className="font-medium text-gray-900">{review.userName}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt || review.updatedAt).toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pagination.hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMoreReviews}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                Load More Reviews
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;