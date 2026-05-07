import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { useData } from '../contexts/DataContext';
import { ShoppingCart, Heart, Truck, Shield, RotateCcw, Star, Minus, Plus, Check, ChevronDown, ChevronUp, MapPin, Package, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import ProductReviews from './ProductReviews';

// Skeleton Loader Components
const ImageSkeleton = () => (
  <div className="animate-pulse">
    <div className="mb-4">
      <div className="w-full h-96 bg-gray-200"></div>
    </div>
  </div>
);

const InfoSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-12 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="flex gap-4 mb-6">
      <div className="flex-1 h-12 bg-gray-200 rounded"></div>
      <div className="flex-1 h-12 bg-gray-200 rounded"></div>
    </div>
    <div className="space-y-3">
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Related Products Skeleton
const RelatedProductsSkeleton = () => (
  <div className="mt-8">
    <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
    <div className="flex gap-4 overflow-x-auto">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[150px] animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-lg"></div>
          <div className="mt-2 h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="mt-1 h-5 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  </div>
);

// Helper function to clean up description text
const cleanDescription = (text) => {
  if (!text) return '';
  
  let cleaned = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  const paragraphs = cleaned.split('\n').filter(p => p.trim().length > 0);
  
  return paragraphs;
};

// Format description with proper paragraph spacing
const FormattedDescription = ({ text, isExpanded, previewLength = 300 }) => {
  const paragraphs = cleanDescription(text);
  const fullText = paragraphs.join('\n\n');
  
  if (!isExpanded && fullText.length > previewLength) {
    let truncated = fullText.substring(0, previewLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace);
    }
    return <span>{truncated}... </span>;
  }
  
  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-gray-600 leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
};

// Horizontal Product Card for related products
const RelatedProductCard = ({ product, formatPrice, navigate }) => (
  <div 
    className="flex-shrink-0 w-[150px] md:w-[180px] cursor-pointer group"
    onClick={() => navigate(`/product/${product._id}`)}
  >
    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:border-orange-500 transition">
      {product.images?.[0] ? (
        <img 
          src={product.images[0]} 
          alt={product.title} 
          className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
      )}
    </div>
    <div className="mt-2">
      <h3 className="font-medium text-sm line-clamp-2 text-gray-800">{product.title}</h3>
      <p className="text-orange-600 font-bold text-sm mt-1">{formatPrice(product.price)}</p>
    </div>
  </div>
);

// Helper function to calculate delivery price from embedded config
const calculateDeliveryPriceFromConfig = (deliveryConfig, buyerState, buyerCity, buyerNeighborhood, quantity = 1) => {
  if (!deliveryConfig || !deliveryConfig.zones || deliveryConfig.zones.length === 0) {
    return 0;
  }
  
  const zones = deliveryConfig.zones;
  let matchingZone = null;
  
  // Priority: neighborhood > city > state > nationwide
  // 1. Check for exact neighborhood match
  if (buyerNeighborhood) {
    matchingZone = zones.find(zone => 
      zone.type === 'neighborhood' &&
      zone.state?.toLowerCase() === buyerState?.toLowerCase() &&
      zone.city?.toLowerCase() === buyerCity?.toLowerCase() &&
      zone.neighborhood?.toLowerCase() === buyerNeighborhood?.toLowerCase()
    );
  }
  
  // 2. Check for city match
  if (!matchingZone && buyerCity) {
    matchingZone = zones.find(zone =>
      zone.type === 'city' &&
      zone.state?.toLowerCase() === buyerState?.toLowerCase() &&
      zone.city?.toLowerCase() === buyerCity?.toLowerCase()
    );
  }
  
  // 3. Check for state match
  if (!matchingZone && buyerState) {
    matchingZone = zones.find(zone =>
      zone.type === 'state' &&
      zone.state?.toLowerCase() === buyerState?.toLowerCase()
    );
  }
  
  // 4. Check for nationwide
  if (!matchingZone) {
    matchingZone = zones.find(zone => zone.type === 'nationwide');
  }
  
  if (matchingZone) {
    let finalPrice = matchingZone.price;
    
    // Apply bulk discount if applicable
    const discountConfig = matchingZone.discountOnQuantity?.enabled 
      ? matchingZone.discountOnQuantity 
      : deliveryConfig.bulkDiscounts;
    
    if (discountConfig?.enabled && quantity >= discountConfig.minQuantity) {
      if (discountConfig.discountType === 'percentage') {
        const discountAmount = (finalPrice * discountConfig.discountValue) / 100;
        finalPrice = finalPrice - discountAmount;
      } else if (discountConfig.discountType === 'fixed') {
        finalPrice = Math.max(0, finalPrice - discountConfig.discountValue);
      }
    }
    
    return finalPrice;
  }
  
  return 0;
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, user } = useData();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Related products state
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const relatedScrollRef = useRef(null);
  
  // Location states
  const [buyerLocation, setBuyerLocation] = useState(null);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  // Minimum swipe distance required (in pixels)
  const minSwipeDistance = 50;

  // Load user's location from localStorage
  useEffect(() => {
    const savedCity = localStorage.getItem('buyerCity');
    const savedState = localStorage.getItem('buyerState');
    const savedNeighborhood = localStorage.getItem('buyerNeighborhood');
    const locationSelected = localStorage.getItem('locationSelected');
    
    if (savedCity && savedState && savedNeighborhood && locationSelected === 'true') {
      setBuyerLocation({ city: savedCity, state: savedState, neighborhood: savedNeighborhood });
    }
    setIsLocationLoading(false);
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Calculate delivery price whenever product or buyer location changes
  useEffect(() => {
    if (product && buyerLocation) {
      const price = calculateDeliveryPriceFromConfig(
        product.deliveryConfig,
        buyerLocation.state,
        buyerLocation.city,
        buyerLocation.neighborhood,
        quantity
      );
      setDeliveryPrice(price);
    }
  }, [product, buyerLocation, quantity]);

  // Fetch related products ONLY when product is fully loaded
  useEffect(() => {
    if (product && !loading && buyerLocation) {
      fetchRelatedProducts();
    }
  }, [product, loading, buyerLocation]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/products/${id}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setProduct(data.data);
        if (data.data.variants?.length > 0) {
          setSelectedVariant(data.data.variants[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    setLoadingRelated(true);
    try {
      const primaryCategory = product.categories?.[0] || product.category;
      
      if (!primaryCategory) {
        setLoadingRelated(false);
        return;
      }
      
      let url = `${API_BASE_URL}/products?category=${encodeURIComponent(primaryCategory)}&limit=20&page=1`;
      
      if (buyerLocation) {
        if (buyerLocation.city) {
          url += `&city=${encodeURIComponent(buyerLocation.city)}`;
        }
        if (buyerLocation.state) {
          url += `&state=${encodeURIComponent(buyerLocation.state)}`;
        }
        if (buyerLocation.neighborhood) {
          url += `&neighborhood=${encodeURIComponent(buyerLocation.neighborhood)}`;
        }
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && !data.groupedByCategory) {
        const filtered = data.data.filter(p => p._id !== product._id).slice(0, 10);
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setLoadingRelated(false);
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

  const getCurrentPrice = () => {
    if (selectedVariant) return selectedVariant.price;
    return product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariant) return selectedVariant.stock;
    return product?.stock || 0;
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: product._id,
      title: product.title,
      price: getCurrentPrice(),
      quantity: quantity,
      image: product.images?.[0],
      variant: selectedVariant,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      sellerEmail: product.sellerEmail,
      sellerPhone: product.sellerPhone,
      maxStock: getCurrentStock(),
      deliveryPrice: deliveryPrice,
      deliveryConfig: product.deliveryConfig
    };
    
    addToCart(cartItem);
    setAddedToCart(true);
    setAddingToCart(true);
    
    setTimeout(() => {
      setAddingToCart(false);
      setTimeout(() => setAddedToCart(false), 2000);
    }, 1000);
  };

  const handleBuyNow = () => {
    const cartItem = {
      id: product._id,
      title: product.title,
      price: getCurrentPrice(),
      quantity: quantity,
      image: product.images?.[0],
      variant: selectedVariant,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      sellerEmail: product.sellerEmail,
      sellerPhone: product.sellerPhone,
      maxStock: getCurrentStock(),
      deliveryPrice: deliveryPrice,
      deliveryConfig: product.deliveryConfig
    };
    
    addToCart(cartItem);
    navigate('/cart');
  };

  // Touch event handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      // Swipe left - next image
      if (product.images && product.images.length > 0) {
        setSelectedImage((prev) => (prev + 1) % product.images.length);
      }
    }
    
    if (isRightSwipe) {
      // Swipe right - previous image
      if (product.images && product.images.length > 0) {
        setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const nextImage = () => {
    if (product.images && product.images.length > 0) {
      setSelectedImage((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product.images && product.images.length > 0) {
      setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const scrollRelatedLeft = () => {
    if (relatedScrollRef.current) {
      relatedScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRelatedRight = () => {
    if (relatedScrollRef.current) {
      relatedScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleViewMoreRelated = () => {
    const primaryCategory = product.categories?.[0] || product.category;
    let url = `/search?category=${encodeURIComponent(primaryCategory)}`;
    
    if (buyerLocation) {
      if (buyerLocation.city) {
        url += `&city=${encodeURIComponent(buyerLocation.city)}`;
      }
      if (buyerLocation.state) {
        url += `&state=${encodeURIComponent(buyerLocation.state)}`;
      }
      if (buyerLocation.neighborhood) {
        url += `&neighborhood=${encodeURIComponent(buyerLocation.neighborhood)}`;
      }
    }
    
    navigate(url);
  };

  const getDescriptionLength = () => {
    if (!product?.description) return 0;
    const cleaned = cleanDescription(product.description);
    return cleaned.join('\n\n').length;
  };

  const descriptionLength = getDescriptionLength();
  const needsTruncation = descriptionLength > 300;

  // Show location warning if no location selected
  if (!isLocationLoading && !buyerLocation && !loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Delivery Location Required
          </h2>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Please set your delivery location (including neighborhood) to see accurate shipping costs and proceed with purchase.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
          >
            Set Delivery Location
          </button>
        </div>
      </div>
    );
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="w-full px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ImageSkeleton />
            <InfoSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Product not found</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 text-orange-500 hover:text-orange-600"
        >
          Go back home
        </button>
      </div>
    );
  }

  const currentPrice = getCurrentPrice();
  const currentStock = getCurrentStock();
  const isFreeShipping = deliveryPrice === 0;
  const primaryCategory = product.categories?.[0] || product.category;
  const hasMultipleImages = product.images && product.images.length > 1;

  return (
    <div className="px-4 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Image Gallery with Chevron Navigation and Swipe Support */}
          <div className="relative">
            <div 
              className="border border-gray-200 bg-white relative touch-pan-y select-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img 
                src={product.images?.[selectedImage] || '/placeholder.png'} 
                alt={product.title}
                className="w-full h-auto object-contain max-h-96 pointer-events-none"
              />
              
              {/* Left Chevron Button */}
              {hasMultipleImages && (
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              
              {/* Right Chevron Button */}
              {hasMultipleImages && (
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
              
              {/* Swipe Hint (visible on mobile) */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 left-0 right-0 text-center md:hidden">
                  <p className="text-xs text-white bg-black/50 inline-block px-2 py-1 rounded-full">
                    ← Swipe to view more →
                  </p>
                </div>
              )}
            </div>
            
            {/* Dot Indicators */}
            {hasMultipleImages && (
              <div className="flex justify-center gap-2 mt-3">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      selectedImage === index 
                        ? 'w-6 bg-orange-500' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => navigate(`/seller-store/${product.sellerId}`)}
              className="flex w-full mt-4 items-center gap-2 px-3 py-2 text-sm bg-gray-100 justify-center text-gray-700 rounded-sm hover:bg-gray-200 transition"
            >
              <Store className="w-4 h-4" />
              Visit Seller's Store
            </button>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-xl font-bold mb-2">{product.title}</h1>
            
            {/* Price */}
            <div className="mb-4">
              <span className="text-3xl font-bold text-orange-600">{formatPrice(currentPrice)}</span>
              {product.oldPrice && (
                <span className="ml-2 text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
              )}
            </div>
            
            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Variants</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 border transition ${selectedVariant?.id === variant.id ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-300 hover:border-orange-500'}`}
                    >
                      {variant.name}
                      {variant.price !== product.price && (
                        <span className="ml-1 text-xs text-gray-500">
                          ({formatPrice(variant.price)})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={currentStock === 0}
                  className="p-2 border border-gray-300 hover:border-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(currentStock || 99, quantity + 1))}
                  disabled={currentStock === 0}
                  className="p-2 border border-gray-300 hover:border-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500 ml-2">
                  {currentStock > 0 ? `${currentStock} items available` : 'Out of stock'}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={currentStock === 0 || addingToCart}
                className={`flex-1 py-3 font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                  addedToCart 
                    ? 'bg-green-500 text-white border-green-500' 
                    : 'border border-orange-500 text-orange-500 hover:bg-orange-50'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={currentStock === 0}
                className="flex-1 py-3 bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>
            
            {/* Stock Status */}
            {currentStock > 0 && currentStock < 10 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  Only {currentStock} left in stock - order soon!
                </p>
              </div>
            )}
            
            {/* Shipping Info */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Shipping to {buyerLocation?.neighborhood}, {buyerLocation?.city}, {buyerLocation?.state}</p>
                  <p className="text-xs text-gray-500">
                    {isFreeShipping ? (
                      <span className="text-green-600">Free shipping</span>
                    ) : (
                      <>
                        ₦{deliveryPrice.toLocaleString()} delivery fee
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Returns</p>
                  <p className="text-xs text-gray-500">24 hours return policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Arrival</p>
                  <p className="text-xs text-gray-500">Within 7 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Description */}
        <div className="bg-white p-4 mt-4 border-t border-gray-200">
          <h2 className="text-xl font-bold mb-4">Product Description</h2>
          <div className="prose max-w-none">
            <div className="text-gray-600 leading-relaxed">
              <FormattedDescription 
                text={product.description} 
                isExpanded={descriptionExpanded}
                previewLength={300}
              />
              {needsTruncation && (
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium mt-2"
                >
                  {descriptionExpanded ? (
                    <>
                      Show Less
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Read More
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Buyers Also Viewed Section */}
        {!loading && !loadingRelated && relatedProducts.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Buyers Also Viewed</h2>
              <div className="flex gap-2">
                <button
                  onClick={scrollRelatedLeft}
                  className="p-1.5 border border-gray-300 rounded-lg hover:border-orange-500 hover:text-orange-500 transition"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={scrollRelatedRight}
                  className="p-1.5 border border-gray-300 rounded-lg hover:border-orange-500 hover:text-orange-500 transition"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div
              ref={relatedScrollRef}
              className="flex overflow-x-auto gap-4 pb-3 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {relatedProducts.map((relatedProduct) => (
                <RelatedProductCard
                  key={relatedProduct._id}
                  product={relatedProduct}
                  formatPrice={formatPrice}
                  navigate={navigate}
                />
              ))}
            </div>
            
            <div className="text-center mt-4">
              <button
                onClick={handleViewMoreRelated}
                className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-1"
              >
                View More in {primaryCategory}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Loading related products skeleton */}
        {!loading && loadingRelated && <RelatedProductsSkeleton />}
        
        {/* Product Details Table */}
        {(product.brand || product.sku || product.weight || (product.dimensions?.length && product.dimensions.length !== '')) && (
          <div className="bg-white p-4 mt-4 border-t border-gray-200">
            <h2 className="text-xl font-bold mb-4">Product Details</h2>
            <div className="border border-gray-200">
              <table className="w-full">
                <tbody>
                  {product.brand && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium bg-gray-50 w-1/3">Brand</td>
                      <td className="py-3 px-4">{product.brand}</td>
                    </tr>
                  )}
                  {product.sku && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium bg-gray-50">SKU</td>
                      <td className="py-3 px-4">{product.sku}</td>
                    </tr>
                  )}
                  {product.category && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium bg-gray-50">Category</td>
                      <td className="py-3 px-4">{product.category}</td>
                    </tr>
                  )}
                  {product.condition && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium bg-gray-50">Condition</td>
                      <td className="py-3 px-4 capitalize">{product.condition}</td>
                    </tr>
                  )}
                  {product.weight && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium bg-gray-50">Weight</td>
                      <td className="py-3 px-4">{product.weight} kg</td>
                    </tr>
                  )}
                  {product.dimensions?.length && product.dimensions.length !== '' && (
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium bg-gray-50">Dimensions</td>
                      <td className="py-3 px-4">
                        {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="bg-white p-4 mt-4 border-t border-gray-200">
            <h2 className="text-xl font-bold mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm hover:bg-orange-100 hover:text-orange-600 transition"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <ProductReviews 
          productId={product._id} 
          onReviewCountChange={(count) => {
            // Optionally update something when review count changes
          }}
        />
        
        {/* Login reminder for non-logged in users */}
        {!user && (
          <div className="bg-white p-4 mt-4 border border-blue-200 text-center">
            <p className="text-sm text-blue-700">
              Sign in to save your cart and access it from any device!
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 text-orange-500 hover:text-orange-600 font-medium"
            >
              Login Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;