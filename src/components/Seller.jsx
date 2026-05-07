import { useState, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import { Store, Package, Truck, Shield, Percent, Users, TrendingUp, ArrowRight, CheckCircle, Star } from 'lucide-react';
import SellerOrderCard from './seller/SellerOrderCard';
import ProductListingModal from './seller/ProductListingModal';
import ReviewsSection from './seller/ReviewsSection';

const Seller = () => {
  const { user, showError, showSuccess } = useData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingListings, setFetchingListings] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Delivery configuration states
  const [selectedDeliveryConfigId, setSelectedDeliveryConfigId] = useState(null);
  const [selectedDeliveryConfig, setSelectedDeliveryConfig] = useState(null);
  
  const [showListingModal, setShowListingModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categories: [],
    stock: '',
    images: [],
    condition: 'new',
    brand: '',
    sku: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    tags: [],
    variants: [],
    deliveryConfigId: null
  });

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [variantForm, setVariantForm] = useState({
    name: '',
    price: '',
    stock: '',
    sku: ''
  });
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [trackingInfo, setTrackingInfo] = useState({
    trackingNumber: '',
    carrier: '',
    estimatedDelivery: ''
  });

  const getAuthToken = () => localStorage.getItem('token');

  const categories = [
    'Appliances', 'Phones & Tablets', 'Health & Beauty', 'Home & Office', 
    'Electronics', 'Fashion', 'Supermarket', 'Computing', 'Baby Product', 'Gaming', 'Other'
  ];

  useEffect(() => {
    const token = getAuthToken();
    if (!token) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (user && user._id) {
      setIsDataLoaded(false);
      setFetchingListings(true);
      Promise.all([fetchSellerProducts(), fetchSellerOrders()]).finally(() => {
        setIsDataLoaded(true);
        setFetchingListings(false);
      });
    } else if (user === null) {
      setIsDataLoaded(false);
    }
  }, [user]);
  
  const checkCanSell = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/user/can-sell`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        if (!response.data.canSell) {
          const missingFieldsList = response.data.missingFields.join(', ');
          if (response.data.missingFields.includes('Bank Account')) {
            showError(`Please add your ${missingFieldsList} in your profile before creating a product listing.\n\nBank Account is required to receive payouts for your sales.`);
          } else {
            showError(`Please add your ${missingFieldsList} in your profile before creating a product listing.`);
          }
          navigate('/profile');
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking seller eligibility:', error);
      showError('Unable to verify seller information. Please try again.');
      return false;
    }
  };

  const fetchSellerProducts = async () => {
    setFetchingListings(true);
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/products/seller/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setProducts(response.data.data || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setProducts([]);
    } finally {
      setFetchingListings(false);
    }
  };

  const fetchSellerOrders = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/orders/seller/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: checked }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    const newImages = [...selectedImages, ...files];
    if (newImages.length > 10) {
      showError('Maximum 10 images allowed');
      return;
    }
    setSelectedImages(newImages);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }, [selectedImages]);

  const removeImage = useCallback((index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, [imagePreviews]);

  const addTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  }, [newTag, formData.tags]);

  const removeTag = useCallback((tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  const addVariant = useCallback(() => {
    if (variantForm.name && variantForm.price) {
      setFormData(prev => ({
        ...prev,
        variants: [...prev.variants, { ...variantForm, id: Date.now() }]
      }));
      setVariantForm({ name: '', price: '', stock: '', sku: '' });
      setShowVariantModal(false);
    }
  }, [variantForm]);

  const removeVariant = useCallback((variantId) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId)
    }));
  }, []);

  const uploadImages = async () => {
    if (selectedImages.length === 0) return [];
    const formDataImg = new FormData();
    selectedImages.forEach(image => formDataImg.append('images', image));
    try {
      const token = getAuthToken();
      const response = await axios.post(`${API_BASE_URL}/upload/product-images`, formDataImg, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate all required fields including categories
    if (!formData.title || !formData.description || !formData.price || formData.categories.length === 0) {
      showError('Please fill in all required fields and select at least one category');
      setLoading(false);
      return;
    }

    // Validate that at least one image is uploaded
    const totalImages = formData.images.length + selectedImages.length;
    if (totalImages === 0) {
      showError('Please upload at least one product image');
      setLoading(false);
      return;
    }

    // Validate that a delivery configuration is selected
    if (!formData.deliveryConfigId) {
      showError('Please select a delivery configuration for your product');
      setLoading(false);
      return;
    }

    try {
      let uploadedImageUrls = [];
      if (selectedImages.length > 0) {
        uploadedImageUrls = await uploadImages();
      }

      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        categories: formData.categories,
        stock: parseInt(formData.stock) || 0,
        images: [...formData.images, ...uploadedImageUrls],
        condition: formData.condition,
        brand: formData.brand,
        sku: formData.sku,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions,
        tags: formData.tags,
        variants: formData.variants,
        deliveryConfigId: formData.deliveryConfigId,
        sellerId: user._id,
        sellerName: user.businessName || user.fullName,
        sellerEmail: user.email,
        sellerPhone: user.phone,
        category: formData.categories[0]
      };

      const token = getAuthToken();
      let response;
      
      if (editingProduct) {
        response = await axios.put(`${API_BASE_URL}/products/${editingProduct._id}`, productData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/products`, productData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      }

      if (response.data.success) {
        showSuccess(editingProduct ? 'Product updated successfully!' : 'Product listed successfully!');
        resetForm();
        await fetchSellerProducts();
        setShowListingModal(false);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      if (error.response?.status === 401) {
        showError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showError(error.response?.data?.message || 'Failed to save product');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      price: '',
      categories: [],
      stock: '',
      images: [],
      condition: 'new',
      brand: '',
      sku: '',
      weight: '',
      dimensions: { length: '', width: '', height: '' },
      tags: [],
      variants: [],
      deliveryConfigId: null
    });
    setSelectedCategories([]);
    setSelectedImages([]);
    setImagePreviews(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    });
    setNewTag('');
    setEditingProduct(null);
    setShowCategoryDropdown(false);
    setSelectedDeliveryConfigId(null);
    setSelectedDeliveryConfig(null);
  }, []);

  const editProduct = useCallback((product) => {
    setEditingProduct(product);
    const productCategories = Array.isArray(product.categories) ? product.categories : [product.category];
    setSelectedCategories(productCategories);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      categories: productCategories,
      stock: product.stock,
      images: product.images || [],
      condition: product.condition || 'new',
      brand: product.brand || '',
      sku: product.sku || '',
      weight: product.weight || '',
      dimensions: product.dimensions || { length: '', width: '', height: '' },
      tags: product.tags || [],
      variants: product.variants || [],
      deliveryConfigId: product.deliveryConfigId || null
    });
    setSelectedDeliveryConfigId(product.deliveryConfigId || null);
    setSelectedImages([]);
    setImagePreviews([]);
    setShowListingModal(true);
  }, []);

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = getAuthToken();
      const response = await axios.delete(`${API_BASE_URL}/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        showSuccess('Product deleted successfully!');
        await fetchSellerProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('Failed to delete product');
    }
  };

  const updateOrderStatus = async (orderId, status, tracking = null) => {
    try {
      setUpdatingOrderStatus(true);
      const token = getAuthToken();
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status,
        trackingInfo: tracking
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        showSuccess(`Order status updated to ${status}`);
        await fetchSellerOrders();
        setShowOrderModal(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showError('Failed to update order status');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Out of Stock', color: 'red' };
    if (stock <= 10) return { label: 'Low Stock', color: 'orange' };
    return { label: 'In Stock', color: 'green' };
  };

  const getOrderStatusColor = (status) => {
    const colors = { pending: 'yellow', processing: 'blue', shipped: 'purple', delivered: 'green', cancelled: 'red' };
    return colors[status] || 'gray';
  };

  const closeModal = useCallback(() => {
    setShowListingModal(false);
    resetForm();
  }, [resetForm]);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleDeliveryConfigSelect = (configId, config) => {
    setSelectedDeliveryConfigId(configId);
    setSelectedDeliveryConfig(config);
    setFormData(prev => ({ ...prev, deliveryConfigId: configId }));
  };

  if (!isDataLoaded || user === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-500">Loading your seller dashboard...</p>
        </div>
      </div>
    );
  }

  // Onboarding screen for sellers with no products
  if (products.length === 0 && activeTab === 'inventory' && !fetchingListings && isDataLoaded) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
              <Store className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Become a Seller on Zoommia</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Start earning by selling your products to thousands of customers across Nigeria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reach More Customers</h3>
              <p className="text-gray-600 text-sm">Connect with thousands of active buyers looking for products like yours</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Delivery Management</h3>
              <p className="text-gray-600 text-sm">Create reusable delivery configurations for all your products</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm">Get paid securely through our integrated payment system with Paystack</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">How Selling on Zoommia Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                <h3 className="font-semibold text-gray-900 mb-2">Create Delivery Config</h3>
                <p className="text-sm text-gray-600">Set up reusable delivery zones and pricing</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                <h3 className="font-semibold text-gray-900 mb-2">Create Listing</h3>
                <p className="text-sm text-gray-600">Add your products with photos, prices, and descriptions</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                <h3 className="font-semibold text-gray-900 mb-2">Select Config</h3>
                <p className="text-sm text-gray-600">Choose which delivery config applies to this product</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
                <h3 className="font-semibold text-gray-900 mb-2">Receive Orders</h3>
                <p className="text-sm text-gray-600">Get notified when customers purchase your products</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">5</div>
                <h3 className="font-semibold text-gray-900 mb-2">Deliver The Order</h3>
                <p className="text-sm text-gray-600">Deliver the ordered product(s) to the customer within 7 days</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">6</div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Paid</h3>
                <p className="text-sm text-gray-600">Receive payments directly to your payout account 24 hours after delivery</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Percent className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">Platform Fees & Commissions</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-900">5% Platform Fee</p>
                <p className="text-sm text-orange-700 mt-1">Deducted from your earnings</p>
                <p className="text-xs text-orange-600 mt-2">When you sell a product for ₦10,000, you receive ₦9,500</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800"><strong>How it works:</strong> When a customer buys your product, you receive the amount minus 5% platform fee. The buyer pays exactly what you list. No extra charges!</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">Delivery Management</h2>
            </div>
            <p className="text-gray-600 mb-4">As a seller on Zoommia, you're in complete control of your delivery process:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Create reusable delivery configurations</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Set delivery prices for neighborhoods, cities, states, or nationwide</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Offer bulk discounts on delivery or product prices</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Apply the same delivery config to multiple products</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={async () => {
                const canSell = await checkCanSell();
                if (canSell) {
                  resetForm();
                  setShowListingModal(true);
                }
              }}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-orange-600 transition"
            >
              Start Selling Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-500 mt-4">No commitment required • Cancel anytime • Free to list</p>
          </div>
        </div>

        <ProductListingModal
          show={showListingModal}
          editingProduct={editingProduct}
          formData={formData}
          loading={loading}
          selectedCategory={selectedCategory}
          customCategory={customCategory}
          categories={categories}
          imagePreviews={imagePreviews}
          newTag={newTag}
          variantForm={variantForm}
          showVariantModal={showVariantModal}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onImageUpload={handleImageUpload}
          onRemoveImage={removeImage}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onSetNewTag={setNewTag}
          onSetSelectedCategory={setSelectedCategory}
          onSetCustomCategory={setCustomCategory}
          onSetShowVariantModal={setShowVariantModal}
          onSetVariantForm={setVariantForm}
          onAddVariant={addVariant}
          onRemoveVariant={removeVariant}
          selectedDeliveryConfigId={selectedDeliveryConfigId}
          onDeliveryConfigSelect={handleDeliveryConfigSelect}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          showCategoryDropdown={showCategoryDropdown}
          setShowCategoryDropdown={setShowCategoryDropdown}
        />
      </>
    );
  }

  // Main dashboard for sellers with products
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
        <p className="text-gray-600">Manage your inventory and orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <Package className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <Truck className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue (Before Fee)</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Estimated earnings after 5% fee: ₦{(orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0) * 0.95).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-4 px-1 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Inventory Management
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-1 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Order Management
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 px-1 font-medium text-sm ${
              activeTab === 'reviews'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reviews & Feedback
          </button>
        </nav>
      </div>

      {activeTab === 'inventory' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Products</h2>
            <button
              onClick={async () => {
                const canSell = await checkCanSell();
                if (canSell) {
                  resetForm();
                  setShowListingModal(true);
                }
              }}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Product
            </button>
          </div>

          {fetchingListings ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No products in inventory</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add New Product" to start selling</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <div key={product._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt={product.title} className="w-full h-48 object-contain" />
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full bg-${stockStatus.color}-100 text-${stockStatus.color}-700`}>
                          {stockStatus.label}
                        </span>
                      </div>
                      <p className="text-orange-500 font-bold text-lg">₦{product.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-600 mt-1">Stock: {product.stock || 'Unlimited'}</p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => editProduct(product)}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(product._id)}
                          className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Management</h2>
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Truck className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No orders yet</p>
              <p className="text-sm text-gray-400 mt-1">When customers order your products, they'll appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders.map((order) => (
                <SellerOrderCard 
                  key={order._id}
                  order={order}
                  formatPrice={formatPrice}
                  getOrderStatusColor={getOrderStatusColor}
                  onOrderCancelled={fetchSellerOrders}
                  onUpdateStatus={(selectedOrder) => {
                    setSelectedOrder(selectedOrder);
                    setOrderStatus(selectedOrder.status || 'pending');
                    setTrackingInfo({
                      trackingNumber: selectedOrder.trackingInfo?.trackingNumber || '',
                      carrier: selectedOrder.trackingInfo?.carrier || '',
                      estimatedDelivery: selectedOrder.trackingInfo?.estimatedDelivery || ''
                    });
                    setShowOrderModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'reviews' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Reviews & Feedback</h2>
          <ReviewsSection 
            products={products} 
            sellerId={user._id}
            formatPrice={formatPrice}
          />
        </div>
      )}

      <ProductListingModal
        show={showListingModal}
        editingProduct={editingProduct}
        formData={formData}
        loading={loading}
        selectedCategory={selectedCategory}
        customCategory={customCategory}
        categories={categories}
        imagePreviews={imagePreviews}
        newTag={newTag}
        variantForm={variantForm}
        showVariantModal={showVariantModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
        onImageUpload={handleImageUpload}
        onRemoveImage={removeImage}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        onSetNewTag={setNewTag}
        onSetSelectedCategory={setSelectedCategory}
        onSetCustomCategory={setCustomCategory}
        onSetShowVariantModal={setShowVariantModal}
        onSetVariantForm={setVariantForm}
        onAddVariant={addVariant}
        onRemoveVariant={removeVariant}
        selectedDeliveryConfigId={selectedDeliveryConfigId}
        onDeliveryConfigSelect={handleDeliveryConfigSelect}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        showCategoryDropdown={showCategoryDropdown}
        setShowCategoryDropdown={setShowCategoryDropdown}
      />

      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Update Order Status</h2>
              <p className="text-sm text-gray-500 mt-1">Order #{selectedOrder.reference?.slice(-8) || selectedOrder._id.slice(-8)}</p>
            </div>
            
            <div className="p-6">
              {selectedOrder.status === 'cancelled' && (
                <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">This order has been cancelled. You cannot update the status of a cancelled order.</p>
                </div>
              )}
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Buyer Information</h3>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium text-gray-600">Name:</span> <span className="text-gray-900">{selectedOrder.buyerFullName || 'Guest'}</span></p>
                  <p className="text-sm"><span className="font-medium text-gray-600">Email:</span> <a href={`mailto:${selectedOrder.buyerEmail}`} className="text-orange-500 hover:text-orange-600">{selectedOrder.buyerEmail}</a></p>
                  {selectedOrder.buyerPhone && (
                    <p className="text-sm"><span className="font-medium text-gray-600">Phone:</span> <a href={`tel:${selectedOrder.buyerPhone}`} className="text-orange-500 hover:text-orange-600">{selectedOrder.buyerPhone}</a></p>
                  )}
                </div>
                {selectedOrder.deliveryAddress && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-600">{selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}</p>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  disabled={selectedOrder.status === 'cancelled'}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {orderStatus === 'shipped' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingInfo.trackingNumber}
                      onChange={(e) => setTrackingInfo(prev => ({ ...prev, trackingNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                    <input
                      type="text"
                      value={trackingInfo.carrier}
                      onChange={(e) => setTrackingInfo(prev => ({ ...prev, carrier: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter Carrier"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery Date</label>
                    <input
                      type="date"
                      value={trackingInfo.estimatedDelivery}
                      onChange={(e) => setTrackingInfo(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-center text-gray-600 mt-2">Cannot be longer than 7 days after order was placed.</p>
                  </div>
                </div>
              )}

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="text-sm flex justify-between">
                        <span className="text-gray-600">{item.quantity}x {item.title}</span>
                        <span className="text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    {selectedOrder.items.length > 3 && (
                      <p className="text-xs text-gray-500">+{selectedOrder.items.length - 3} more items</p>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                    <span className="font-medium text-gray-700">Total</span>
                    <span className="font-bold text-orange-600">₦{selectedOrder.total?.toLocaleString() || 0}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => updateOrderStatus(selectedOrder._id, orderStatus, trackingInfo)}
                  disabled={selectedOrder.status === 'cancelled' || updatingOrderStatus}
                  className={`flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed ${selectedOrder.status === 'delivered' ? 'hidden' : ''}`}
                >
                  {updatingOrderStatus ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                    setOrderStatus('');
                    setTrackingInfo({ trackingNumber: '', carrier: '', estimatedDelivery: '' });
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
              
              {selectedOrder.buyerPhone && selectedOrder.status !== 'cancelled' && (
                <div className="mt-4 text-center">
                  <a href={`tel:${selectedOrder.buyerPhone}`} className="text-sm text-orange-500 hover:text-orange-600">📞 Call Buyer to Coordinate Delivery</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showVariantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Add Product Variant</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Large, Red, 64GB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, price: e.target.value }))}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  value={variantForm.stock}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, stock: e.target.value }))}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Optional)</label>
                <input
                  type="text"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Unique code"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={addVariant} className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600">Add Variant</button>
              <button onClick={() => setShowVariantModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seller;