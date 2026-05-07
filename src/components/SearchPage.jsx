import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { Search, Filter, X, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [hasLocation, setHasLocation] = useState(false);
  const [buyerLocation, setBuyerLocation] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const category = params.get('category');
    
    setSearchTerm(q || '');
    setSelectedCategory(category || '');
    
    const savedCity = localStorage.getItem('buyerCity');
    const savedState = localStorage.getItem('buyerState');
    const savedNeighborhood = localStorage.getItem('buyerNeighborhood');
    const locationSelected = localStorage.getItem('locationSelected');
    
    if (savedCity && savedState && savedNeighborhood && locationSelected === 'true') {
      setHasLocation(true);
      setBuyerLocation({ city: savedCity, state: savedState, neighborhood: savedNeighborhood });
    } else {
      setHasLocation(false);
      setLoading(false);
    }
    
    fetchCategories();
    setInitialLoadDone(true);
  }, [location.search]);

  useEffect(() => {
    if (initialLoadDone && hasLocation && buyerLocation) {
      fetchProducts(buyerLocation.city, buyerLocation.state, buyerLocation.neighborhood);
    }
  }, [initialLoadDone, hasLocation, buyerLocation, searchTerm, selectedCategory, priceRange.min, priceRange.max]);

  const fetchProducts = async (city, state, neighborhood, pageNum = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        limit: '50',
        page: pageNum.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (city && state) {
        queryParams.append('city', city);
        queryParams.append('state', state);
      }
      if (neighborhood) {
        queryParams.append('neighborhood', neighborhood);
      }
      
      if (searchTerm) queryParams.append('search', searchTerm);
      if (selectedCategory) queryParams.append('category', selectedCategory);
      if (priceRange.min) queryParams.append('minPrice', priceRange.min);
      if (priceRange.max) queryParams.append('maxPrice', priceRange.max);
      
      const response = await fetch(`${API_BASE_URL}/products?${queryParams}`);
      const data = await response.json();
      
      if (data.success && !data.groupedByCategory) {
        if (pageNum === 1) {
          setProducts(data.data);
        } else {
          setProducts(prev => [...prev, ...data.data]);
        }
        
        setPagination({
          page: data.pagination.page,
          total: data.pagination.total,
          pages: data.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (hasLocation && buyerLocation) {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchProducts(buyerLocation.city, buyerLocation.state, buyerLocation.neighborhood, 1);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    navigate('/search');
    if (hasLocation && buyerLocation) {
      fetchProducts(buyerLocation.city, buyerLocation.state, buyerLocation.neighborhood, 1);
    }
  };

  const loadMoreProducts = () => {
    if (pagination.page < pagination.pages && !loading && buyerLocation) {
      fetchProducts(buyerLocation.city, buyerLocation.state, buyerLocation.neighborhood, pagination.page + 1);
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

  const ProductSkeleton = () => (
    <div className="w-full animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-lg"></div>
      <div className="pt-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  // No location selected - show only the location prompt (no search/filters)
  if (!hasLocation && !loading && initialLoadDone) {
    return (
      <div className="w-full px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Select Your Delivery Location First
            </h2>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              Please set your delivery location (including neighborhood) to see products available in your area.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('buyerCity');
                localStorage.removeItem('buyerState');
                localStorage.removeItem('buyerNeighborhood');
                localStorage.removeItem('locationSelected');
                window.location.href = '/';
              }}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
            >
              Set Delivery Location
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Search Header - Always visible */}
        <div className="w-full mb-8">
          <h1 className="text-2xl font-bold mb-4">
            {selectedCategory ? selectedCategory : (searchTerm ? `Search: ${searchTerm}` : 'All Products')}
          </h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none rounded-lg"
              />
            </div>
            <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
              Search
            </button>
            <button 
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </form>
        </div>

        {/* Filters Panel - Always visible when toggled */}
        {showFilters && (
          <div className="w-full border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={clearFilters} className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
                <X className="w-4 h-4" />
                Clear all
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setSelectedCategory(newCategory);
                    const newParams = new URLSearchParams(location.search);
                    if (newCategory) {
                      newParams.set('category', newCategory);
                    } else {
                      newParams.delete('category');
                    }
                    navigate(`/search?${newParams.toString()}`);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Price Range (₦)</label>
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                  <span className="self-center hidden md:inline-block">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSearch}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Results Count - Only show when not loading and products exist */}
        {!loading && products.length > 0 && (
          <div className="w-full mb-4 text-gray-600">
            Showing {products.length} of {pagination.total} product{pagination.total !== 1 ? 's' : ''}
            {buyerLocation?.city && ` in ${buyerLocation.city}, ${buyerLocation.state}`}
            {buyerLocation?.neighborhood && <span className="text-xs text-gray-400"> (deliverable to {buyerLocation.neighborhood})</span>}
          </div>
        )}

        {/* Products Grid or No Results Message */}
        <div className="w-full">
          {loading ? (
            <div className="w-full" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '1rem'
            }}>
              {[...Array(20)].map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h2>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                We couldn't find any products matching your criteria{ buyerLocation?.neighborhood ? ` in ${buyerLocation.neighborhood}` : '' }.
              </p>
              <button 
                onClick={clearFilters} 
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="w-full" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '1rem'
              }}>
                {products.map((product) => (
                  <div key={product._id} className="w-full cursor-pointer" onClick={() => navigate(`/product/${product._id}`)}>
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <div className="text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="pt-3">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.title}</h3>
                      <p className="text-orange-600 font-bold text-base">{formatPrice(product.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8">
                  <button
                    onClick={() => fetchProducts(buyerLocation?.city, buyerLocation?.state, buyerLocation?.neighborhood, pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:border-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={loadMoreProducts}
                    disabled={pagination.page >= pagination.pages || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:border-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;