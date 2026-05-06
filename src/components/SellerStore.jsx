// components/SellerStore.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { Star, MapPin, Package, ShoppingBag, ChevronRight, ChevronLeft, Filter, X } from 'lucide-react';

// Star Rating Component
const StarRating = ({ rating, size = 'sm' }) => {
  const fullStars = Math.floor(rating);
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${i < fullStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, formatPrice, navigate }) => (
  <div 
    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer group"
    onClick={() => navigate(`/product/${product._id}`)}
  >
    <div className="aspect-square bg-gray-100 overflow-hidden">
      {product.images?.[0] ? (
        <img 
          src={product.images[0]} 
          alt={product.title} 
          className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          No image
        </div>
      )}
    </div>
    <div className="p-3">
      <h3 className="font-medium text-sm line-clamp-2 text-gray-800 mb-1">{product.title}</h3>
      <div className="flex items-center gap-2 mb-2">
        <StarRating rating={product.averageRating} size="sm" />
        <span className="text-xs text-gray-500">({product.totalReviews || 0})</span>
      </div>
      <p className="text-orange-600 font-bold text-base">{formatPrice(product.price)}</p>
      <p className="text-xs text-gray-400 mt-1">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
    </div>
  </div>
);

// Review Card Component
const ReviewCard = ({ review }) => (
  <div className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-gray-600 font-medium">
          {review.userName?.charAt(0).toUpperCase() || 'B'}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <div>
            <span className="font-medium text-gray-900 text-sm">{review.userName}</span>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
        {review.comment && (
          <p className="text-gray-600 text-sm mt-2 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  </div>
);

const SellerStore = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [productPagination, setProductPagination] = useState({
    currentPage: 1,
    hasMore: false,
    total: 0
  });
  const [reviewPagination, setReviewPagination] = useState({
    currentPage: 1,
    hasMore: false,
    total: 0
  });
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'reviews'
  const [sortOption, setSortOption] = useState('latest');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Fetch seller info and initial products/reviews
  useEffect(() => {
    fetchSellerInfo();
  }, [sellerId]);

  const fetchSellerInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/seller/store/${sellerId}`);
      const data = await response.json();
      
      if (data.success) {
        setSeller(data.data.seller);
        setProducts(data.data.products);
        setReviews(data.data.reviews);
        setProductPagination(prev => ({
          ...prev,
          total: data.data.products.length,
          hasMore: data.data.products.length >= 12
        }));
        setReviewPagination(prev => ({
          ...prev,
          total: data.data.reviews.length,
          hasMore: data.data.reviews.length >= 5
        }));
      } else {
        console.error('Failed to fetch seller info:', data.message);
      }
    } catch (error) {
      console.error('Error fetching seller:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreProducts = async () => {
    if (loadingProducts || !productPagination.hasMore) return;
    
    setLoadingProducts(true);
    try {
      const nextPage = productPagination.currentPage + 1;
      const response = await fetch(
        `${API_BASE_URL}/seller/store/${sellerId}/products?page=${nextPage}&limit=12&sort=${sortOption}`
      );
      const data = await response.json();
      
      if (data.success) {
        setProducts(prev => [...prev, ...data.data]);
        setProductPagination({
          currentPage: data.pagination.currentPage,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore
        });
      }
    } catch (error) {
      console.error('Error fetching more products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchMoreReviews = async () => {
    if (loadingReviews || !reviewPagination.hasMore) return;
    
    setLoadingReviews(true);
    try {
      const nextPage = reviewPagination.currentPage + 1;
      const response = await fetch(
        `${API_BASE_URL}/seller/store/${sellerId}/reviews?page=${nextPage}&limit=5`
      );
      const data = await response.json();
      
      if (data.success) {
        setReviews(prev => [...prev, ...data.data]);
        setReviewPagination({
          currentPage: data.pagination.currentPage,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore
        });
      }
    } catch (error) {
      console.error('Error fetching more reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSortChange = async (sort) => {
    setSortOption(sort);
    setLoadingProducts(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/seller/store/${sellerId}/products?page=1&limit=12&sort=${sort}`
      );
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
        setProductPagination({
          currentPage: data.pagination.currentPage,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore
        });
      }
    } catch (error) {
      console.error('Error sorting products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            {/* Seller Header Skeleton */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-7 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
            {/* Products Skeleton with responsive grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '1rem'
            }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-3 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="w-full px-4 py-12 text-center">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500 text-lg">Seller not found</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 text-orange-500 hover:text-orange-600"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Seller Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              {seller.profileImage ? (
                <img 
                  src={seller.profileImage} 
                  alt={seller.businessName} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-gray-400">
                  {seller.businessName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Seller Info */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{seller.businessName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <StarRating rating={seller.averageRating} size="sm" />
                  <span className="text-gray-600 ml-1">
                    {seller.averageRating?.toFixed(1)} ({seller.totalReviews} review{seller.totalReviews > 1 ? 's' : ''})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Package className="w-4 h-4" />
                  <span>Seller since {new Date(seller.joinedAt).getFullYear()}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'products'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Products ({productPagination.total})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'reviews'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Seller Reviews ({reviewPagination.total})
          </button>
        </div>
        
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            {/* Sort Options */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-500"
                >
                  <option value="latest">Latest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
              <p className="text-sm text-gray-500">{productPagination.total} products found</p>
            </div>
            
            {/* Products Grid - Responsive with minimum width 130px */}
            {products.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products available</p>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '1rem'
                }}>
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      formatPrice={formatPrice}
                      navigate={navigate}
                    />
                  ))}
                </div>
                
                {/* Load More Products Button */}
                {productPagination.hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={fetchMoreProducts}
                      disabled={loadingProducts}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      {loadingProducts ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Products
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                What Customers Say
              </h2>
              <div className="flex items-center gap-2">
                <StarRating rating={seller.averageRating} size="sm" />
                <span className="text-sm text-gray-600">
                  {seller.averageRating?.toFixed(1)} out of 5
                </span>
              </div>
            </div>
            
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No seller reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <ReviewCard key={review._id || index} review={review} />
                ))}
                
                {/* Load More Reviews Button */}
                {reviewPagination.hasMore && (
                  <div className="text-center pt-4">
                    <button
                      onClick={fetchMoreReviews}
                      disabled={loadingReviews}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      {loadingReviews ? (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerStore;