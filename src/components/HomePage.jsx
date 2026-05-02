// HomePage.jsx

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BuyerLocationSelector from '../components/BuyerLocationSelector';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerState, setBuyerState] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);
  
  const handleLocationSelect = async (state, city) => {
    setBuyerState(state);
    setBuyerCity(city);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/products/filter-by-location`, {
        params: { city, state, limit: 50 }
      });
      if (response.data.success) {
        setFilteredProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching location-based products:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products?limit=20`);
      if (response.data.success) {
        setProducts(response.data.data);
        // Get first 8 products as featured
        setFeaturedProducts(response.data.data.slice(0, 8));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
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

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  // Product Card Component for Grid (full width)
  const GridProductCard = ({ product }) => (
    <div 
      className="w-full"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <div className="aspect-square border border-gray-200 bg-gray-100 flex items-center justify-center ">
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
      <div className="mt-4">
        <h3 className="font-semibold text-md mb-2 line-clamp-1">{product.title}</h3>
        <p className="text-orange-600 font-bold text-lg mb-2">{formatPrice(product.price)}</p>
      </div>
    </div>
  );

  // Product Card Component for Horizontal Scroll (fixed width)
  const HorizontalProductCard = ({ product }) => (
    <div 
      className="flex-shrink-0 w-[100px] md:w-[150px]"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center p-0">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.title} 
            className="w-full h-full border border-gray-200 object-contain"
          />
        ) : (
          <div className="text-gray-400">No image</div>
        )}
      </div>
      <div className="p-0 mt-2">
        <h3 className="font-semibold text-sm mb-0 line-clamp-1">{product.title}</h3>
        <p className="text-orange-600 font-bold text-sm mb-2">{formatPrice(product.price)}</p>
      </div>
    </div>
  );

  // Skeleton Card Component for Grid
  const GridSkeletonCard = () => (
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

  // Skeleton Card Component for Horizontal Scroll
  const HorizontalSkeletonCard = () => (
    <div className="flex-shrink-0 w-[100px] md:w-[150px] animate-pulse">
      <div className="aspect-square border border-gray-200 bg-gray-200"></div>
      <div className="p-0">
        <div className="h-2 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-2 bg-gray-200 rounded mb-2 w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4">
      
      <div className="flex justify-between items-center mb-4">
        <BuyerLocationSelector onLocationSelect={handleLocationSelect} />
      </div>

      {/* Featured Products - Horizontal Scroll */}
      <section className="mb-4 border border-gray-200 bg-white p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Featured Products</h2>
          {featuredProducts.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={scrollLeft}
                className="p-1 border border-gray-300 hover:border-orange-500 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollRight}
                className="p-1 border border-gray-300 hover:border-orange-500 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex  overflow-x-auto gap-4 pb-4">
            {[...Array(6)].map((_, index) => (
              <HorizontalSkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredProducts.map((product) => (
              <HorizontalProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* All Products - Grid Layout */}
      <section className="border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-bold mb-6">Top Sellers</h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, index) => (
              <GridSkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {products.map((product) => (
              <GridProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;