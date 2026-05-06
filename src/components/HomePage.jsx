// HomePage.jsx - With responsive grid based on parent width
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { ChevronLeft, ChevronRight, MapPin, Navigation, ArrowRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Banners = () => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -scrollRef.current.clientWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: scrollRef.current.clientWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={scrollLeft}
        className="absolute md:hidden left-0 top-1/2 transform -translate-y-1/2 bg-black/20 text-white rounded-full p-2 hover:bg-black/70 transition z-10 ml-2"
        aria-label="Scroll left"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div 
        ref={scrollRef}
        className="flex md:justify-between scrollbar-hide mb-4 gap-4 overflow-x-auto"
      >
        <img 
          src="https://res.cloudinary.com/danuehpic/image/upload/v1777883168/file_00000000656871f499b7ed8e1d9ea20d_aeo0rw.png" 
          className="flex-1 md:max-w-[49%] h-auto" 
          alt="Banner"
        />
        <img 
          className="flex-1 md:max-w-[49%] h-auto" 
          src="https://res.cloudinary.com/danuehpic/image/upload/v1777883151/file_0000000046c471f4a4f59597eb342b77_xdy11w.png" 
          alt="Banner"
        />
      </div>

      <button
        onClick={scrollRight}
        className="absolute md:hidden right-0 top-1/2 transform -translate-y-1/2 bg-black/20 text-white rounded-full p-2 hover:bg-black/70 transition z-10 mr-2"
        aria-label="Scroll right"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

const HomePage = () => {
  const { setCategoriesWithProducts, setFeaturedProducts, loadingProducts: loading, setLoadingProducts: setLoading } = useData();
  const [categoriesWithProducts, setLocalCategoriesWithProducts] = useState([]);
  const [featuredProducts, setLocalFeaturedProducts] = useState([]);
  const [hasLocation, setHasLocation] = useState(false);
  const [buyerLocation, setBuyerLocation] = useState(null);
  const navigate = useNavigate();
  const featuredScrollRef = useRef(null);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const savedCity = localStorage.getItem('buyerCity');
    const savedState = localStorage.getItem('buyerState');
    const locationSelected = localStorage.getItem('locationSelected');
    
    if (savedCity && savedState && locationSelected === 'true') {
      setHasLocation(true);
      setBuyerLocation({ city: savedCity, state: savedState });
      if (featuredProducts.length === 0) {
        fetchProductsByCategory(savedCity, savedState);
      }
    } else {
      setLoading(false);
      setHasLocation(false);
    }
  }, []);

  const fetchProductsByCategory = async (city, state) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        groupByCategory: 'true',
        limit: '50'
      });
      
      if (city && state) {
        queryParams.append('city', city);
        queryParams.append('state', state);
      }
      
      const response = await fetch(`${API_BASE_URL}/products?${queryParams}`);
      const data = await response.json();
      
      if (data.success && data.groupedByCategory) {
        const categoryMap = new Map();
        const uniqueProductsMap = new Map();
        
        data.data.forEach(categoryGroup => {
          const backendCategory = categoryGroup.category;
          
          categoryGroup.products.forEach(product => {
            const productCategories = product.categories && product.categories.length > 0 
              ? product.categories 
              : [backendCategory];
            
            if (!uniqueProductsMap.has(product._id)) {
              uniqueProductsMap.set(product._id, product);
            }
            
            productCategories.forEach(cat => {
              if (!categoryMap.has(cat)) {
                categoryMap.set(cat, []);
              }
              
              const existingProducts = categoryMap.get(cat);
              const productExists = existingProducts.some(p => p._id === product._id);
              
              if (!productExists) {
                existingProducts.push(product);
              }
            });
          });
        });
        
        let allCategories = Array.from(categoryMap.entries()).map(([category, products]) => ({
          category,
          totalCount: products.length,
          products: shuffleArray(products.slice(0, 12))
        }));
        
        allCategories = allCategories.sort((a, b) => b.totalCount - a.totalCount);
        
        setLocalCategoriesWithProducts(allCategories);
        setCategoriesWithProducts(allCategories);
        
        const uniqueProducts = Array.from(uniqueProductsMap.values());
        const shuffledProducts = shuffleArray(uniqueProducts);
        const featured = shuffledProducts.slice(0, 12);
        
        setLocalFeaturedProducts(featured);
        setFeaturedProducts(featured);
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

  const scrollFeaturedLeft = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollFeaturedRight = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const HorizontalProductCard = ({ product }) => (
    <div className="flex-shrink-0 w-[160px] md:w-[180px] cursor-pointer" onClick={() => navigate(`/product/${product._id}`)}>
      <div className="aspect-square border border-gray-200 bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.title} className="w-full h-full object-contain" />
        ) : (
          <div className="text-gray-400">No image</div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.title}</h3>
        <p className="text-orange-600 font-bold text-base">{formatPrice(product.price)}</p>
      </div>
    </div>
  );

  const GridProductCard = ({ product }) => (
    <div className="w-full cursor-pointer" onClick={() => navigate(`/product/${product._id}`)}>
      <div className="aspect-square border border-gray-200 bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.title} className="w-full h-full object-contain" />
        ) : (
          <div className="text-gray-400">No image</div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-md mb-1 line-clamp-2">{product.title}</h3>
        <p className="text-orange-600 font-bold text-lg">{formatPrice(product.price)}</p>
      </div>
    </div>
  );

  const FeaturedSection = () => (
    <section className="mb-4 border border-orange-400 bg-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
        {featuredProducts.length > 4 && (
          <div className="flex gap-2">
            <button
              onClick={scrollFeaturedLeft}
              className="p-1.5 border border-gray-300 rounded-lg hover:border-orange-500 hover:text-orange-500 transition"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollFeaturedRight}
              className="p-1.5 border border-gray-300 rounded-lg hover:border-orange-500 hover:text-orange-500 transition"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      <div
        ref={featuredScrollRef}
        className="flex overflow-x-auto gap-5 pb-3 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {featuredProducts.map((product) => (
          <HorizontalProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );

  const CategorySection = ({ category, products, index }) => (
    <section className={`mb-4 border bg-white p-4 rounded-lg ${
      index % 2 === 1 ? 'border-orange-400' : 'border-gray-200'
    }`}>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-gray-900">{category}</h2>
        <button
          onClick={() => navigate(`/search?category=${encodeURIComponent(category)}`)}
          className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Responsive grid that adjusts based on parent container width */}
      <div className="grid gap-4 md:gap-5" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))'
      }}>
        {products.map((product) => (
          <GridProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );

  const HorizontalSkeleton = () => (
    <div className="flex-shrink-0 w-[160px] md:w-[180px] animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-lg"></div>
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );

  const GridSkeleton = () => (
    <div className="w-full animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-lg"></div>
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );

  const CategorySkeleton = () => (
    <div className="mb-4 border border-gray-200 bg-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-5">
        <div className="h-7 w-32 bg-gray-200 rounded"></div>
        <div className="h-5 w-20 bg-gray-200 rounded"></div>
      </div>
      <div className="grid gap-4 md:gap-5" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))'
      }}>
        {[...Array(6)].map((_, i) => (
          <GridSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  if (!hasLocation && !loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Navigation className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Zoommia!</h2>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            To see products available for delivery in your area, please select your delivery location.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('buyerCity');
              localStorage.removeItem('buyerState');
              localStorage.removeItem('locationSelected');
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            <MapPin className="w-5 h-5" />
            Select Delivery Location
          </button>
          <p className="text-xs text-gray-400 mt-4">You can change your delivery location anytime from your profile page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-4">
        <div className="mb-4 border border-gray-200 bg-white p-4 rounded-lg">
          <div className="flex justify-between items-center mb-5">
            <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-5 scrollbar-hide overflow-x-auto">
            {[...Array(8)].map((_, i) => (
              <HorizontalSkeleton key={i} />
            ))}
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <CategorySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (categoriesWithProducts.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No products available in {buyerLocation?.city}
          </h2>
          <p className="text-gray-500 mb-4">We couldn't find any sellers delivering to your location yet.</p>
          <button
            onClick={() => {
              localStorage.removeItem('buyerCity');
              localStorage.removeItem('buyerState');
              localStorage.removeItem('locationSelected');
              window.location.reload();
            }}
            className="text-orange-500 hover:text-orange-600"
          >
            Try a different location →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4">
      {featuredProducts.length > 0 && <FeaturedSection />}
      <Banners />
      {categoriesWithProducts.map((categoryData, index) => (
        <CategorySection
          key={categoryData.category}
          category={categoryData.category}
          products={categoryData.products}
          index={index}
        />
      ))}
    </div>
  );
};

export default HomePage;