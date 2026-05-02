// SearchPage.jsx

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import { Search, Filter, X } from 'lucide-react';

// Skeleton Loader Component
const ProductSkeleton = () => (
  <div className="w-full border border-gray-200 animate-pulse">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-4">
      <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
      <div className="h-6 bg-gray-200 rounded mb-2 w-2/3"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Product Card Component
const ProductCard = ({ product, navigate }) => (
  <div 
    className="w-full border border-gray-200 hover:shadow-lg transition cursor-pointer"
    onClick={() => navigate(`/product/${product._id}`)}
  >
    <div className="aspect-square bg-gray-100 flex items-center justify-center p-4">
      {product.images?.[0] ? (
        <img 
          src={product.images[0]} 
          alt={product.title} 
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="text-gray-400">No image</div>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
      <p className="text-orange-600 font-bold text-xl mb-2">{formatPrice(product.price)}</p>
      <p className="text-gray-500 text-sm">Sold by: {product.sellerName}</p>
    </div>
  </div>
);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const category = params.get('category');
    
    if (q) setSearchTerm(q);
    if (category) setSelectedCategory(category);
    
    fetchProducts();
    fetchCategories();
  }, [location.search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(location.search);
      let url = `${API_BASE_URL}/products?limit=50`;
      
      if (params.get('q')) {
        url += `&search=${encodeURIComponent(params.get('q'))}`;
      }
      if (params.get('category')) {
        url += `&category=${encodeURIComponent(params.get('category'))}`;
      }
      if (priceRange.min) url += `&minPrice=${priceRange.min}`;
      if (priceRange.max) url += `&maxPrice=${priceRange.max}`;
      
      const response = await axios.get(url);
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('q', searchTerm);
    if (selectedCategory) params.append('category', selectedCategory);
    if (priceRange.min) params.append('minPrice', priceRange.min);
    if (priceRange.max) params.append('maxPrice', priceRange.max);
    navigate(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    navigate('/search');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getPageTitle = () => {
    const params = new URLSearchParams(location.search);
    if (params.get('q')) return `Search results for "${params.get('q')}"`;
    if (params.get('category')) return `${params.get('category')}`;
    return 'All Products';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="w-full mb-8">
        <h1 className="text-2xl font-bold mb-4">{getPageTitle()}</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-2 bg-orange-500 text-white hover:bg-orange-600 transition border-0"
          >
            Search
          </button>
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </form>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="w-full border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filters</h3>
            <button onClick={clearFilters} className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
              <X className="w-4 h-4" />
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Price Range (₦)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none"
                />
                <span className="self-center">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSearch}
            className="mt-4 px-6 py-2 bg-orange-500 text-white hover:bg-orange-600 transition border-0"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <div className="w-full mb-4 text-gray-600">
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Products Grid with Skeleton Loading - Consistent grid columns */}
      <div className="w-full">
        {loading ? (
          <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="w-full text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
            <button 
              onClick={clearFilters}
              className="mt-4 text-orange-500 hover:text-orange-600"
            >
              Clear filters and try again
            </button>
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {products.map((product) => (
              <div 
                key={product._id} 
                className="w-full"
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.title} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400">No image</div>
                  )}
                </div>
                <div className="pt-4">
                  <h3 className="font-semibold text-md mb-2 line-clamp-1">{product.title}</h3>
                  <p className="text-orange-600 font-bold text-lg">{formatPrice(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;