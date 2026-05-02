// ProductDetail.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import { useData } from '../contexts/DataContext';
import { ShoppingCart, Heart, Truck, Shield, RotateCcw, Star, Minus, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';

// Skeleton Loader Components
const ImageSkeleton = () => (
  <div className="animate-pulse">
    <div className="border border-gray-200 p-4 mb-4 bg-white">
      <div className="w-full h-96 bg-gray-200"></div>
    </div>
    <div className="flex gap-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="w-20 h-20 bg-gray-200 border border-gray-200"></div>
      ))}
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

// Helper function to clean up description text
const cleanDescription = (text) => {
  if (!text) return '';
  
  // Replace multiple newlines with single newline
  let cleaned = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Remove excessive spaces between paragraphs
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace from start and end
  cleaned = cleaned.trim();
  
  // Split into paragraphs and filter out empty ones
  const paragraphs = cleaned.split('\n').filter(p => p.trim().length > 0);
  
  return paragraphs;
};

// Format description with proper paragraph spacing
const FormattedDescription = ({ text, isExpanded, previewLength = 300 }) => {
  const paragraphs = cleanDescription(text);
  const fullText = paragraphs.join('\n\n');
  
  if (!isExpanded && fullText.length > previewLength) {
    let truncated = fullText.substring(0, previewLength);
    // Cut at the last space to avoid cutting words
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

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${id}`);
      if (response.data.success) {
        setProduct(response.data.data);
        if (response.data.data.variants?.length > 0) {
          setSelectedVariant(response.data.data.variants[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
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
      maxStock: getCurrentStock()
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
      maxStock: getCurrentStock()
    };
    
    addToCart(cartItem);
    navigate('/cart');
  };

  // Check if description needs truncation
  const getDescriptionLength = () => {
    if (!product?.description) return 0;
    const cleaned = cleanDescription(product.description);
    return cleaned.join('\n\n').length;
  };

  const descriptionLength = getDescriptionLength();
  const needsTruncation = descriptionLength > 300;

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="w-full px-4 py-8">
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

  return (
    <div className="px-4 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="border border-gray-200 mb-4 bg-white">
              <img 
                src={product.images?.[selectedImage] || '/placeholder.png'} 
                alt={product.title}
                className="w-full h-auto object-contain max-h-96"
              />
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 border p-1 transition ${selectedImage === index ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-xl font-bold mb-2">{product.title}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < (product.sellerRating || 0) ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500">({product.totalReviews || 0} reviews)</span>
            </div>
            
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
                  <p className="text-sm font-medium">Shipping</p>
                  <p className="text-xs text-gray-500">
                    {product.shipping?.free ? 'Free shipping' : `₦${product.shipping?.cost?.toLocaleString() || 0} shipping`}
                    {product.shipping?.estimatedDays && ` • Estimated ${product.shipping.estimatedDays} days`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Returns</p>
                  <p className="text-xs text-gray-500">7-day return policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Warranty</p>
                  <p className="text-xs text-gray-500">1-year warranty included</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Description with Expand/Collapse */}
        <div className="bg-white p-4 mt-8 border-t border-gray-200">
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
        
        {/* Product Details Table */}
        {(product.brand || product.sku || product.weight || (product.dimensions?.length && product.dimensions.length !== '')) && (
          <div className="bg-white p-4 mt-8 border-t border-gray-200">
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
          <div className="bg-white p-4 mt-8 border-t border-gray-200">
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
        
        {/* Login reminder for non-logged in users */}
        {!user && (
          <div className="bg-white p-4 mt-8 border border-blue-200 text-center">
            <p className="text-sm text-blue-700">
              Sign in to save your cart and access it from any device!
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 text-orange-500 hover:text-orange-600 font-medium"
            >
              Login Now →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;