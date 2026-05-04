import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const DataContext = createContext(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Alert state
  const [alert, setAlert] = useState(null);

  // Alert functions
  const showAlert = useCallback((type, message, duration = 5000) => {
    setAlert({ type, message, duration });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(null);
  }, []);

  // Convenience methods for different alert types
  const showSuccess = useCallback((message, duration) => {
    showAlert('success', message, duration);
  }, [showAlert]);

  const showError = useCallback((message, duration) => {
    showAlert('error', message, duration);
  }, [showAlert]);

  const showWarning = useCallback((message, duration) => {
    showAlert('warning', message, duration);
  }, [showAlert]);

  const showInfo = useCallback((message, duration) => {
    showAlert('info', message, duration);
  }, [showAlert]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  const handleAuthError = useCallback((error) => {
    console.error("Auth error:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    setUser(null);
    showError('Session expired. Please login again.');
  }, [showError]);

  // Load cart from localStorage (for non-logged in users)
  const loadLocalCart = useCallback(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      setCartItems(cart);
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    }
  }, []);

  // Save cart to localStorage (for non-logged in users)
  const saveLocalCart = useCallback((cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartItems(cart);
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  }, []);

  // Load cart from database (for logged in users)
  const loadDatabaseCart = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cart`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        const cart = response.data.data.items || [];
        setCartItems(cart);
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
        return cart;
      }
    } catch (error) {
      console.error("Error loading cart from database:", error);
    }
    return [];
  }, [getAuthHeaders]);

  // Save cart to database (for logged in users)
  const saveDatabaseCart = useCallback(async (cart) => {
    try {
      await axios.post(`${API_BASE_URL}/cart/sync`, 
        { items: cart },
        { headers: getAuthHeaders() }
      );
      setCartItems(cart);
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error("Error saving cart to database:", error);
    }
  }, [getAuthHeaders]);

  // Merge local cart with database cart on login
  const mergeCartsOnLogin = useCallback(async () => {
    const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const dbCart = await loadDatabaseCart();
    
    if (localCart.length === 0) return dbCart;
    
    // Merge carts
    const mergedItems = [...dbCart];
    
    localCart.forEach(localItem => {
      const existingIndex = mergedItems.findIndex(item => 
        item.id === localItem.id && 
        (!item.variant || item.variant?.id === localItem.variant?.id)
      );
      
      if (existingIndex >= 0) {
        mergedItems[existingIndex].quantity += localItem.quantity;
        if (mergedItems[existingIndex].quantity > mergedItems[existingIndex].maxStock) {
          mergedItems[existingIndex].quantity = mergedItems[existingIndex].maxStock;
        }
      } else {
        mergedItems.push(localItem);
      }
    });
    
    await saveDatabaseCart(mergedItems);
    localStorage.removeItem('cart'); // Clear local cart after merge
    return mergedItems;
  }, [loadDatabaseCart, saveDatabaseCart]);

  // Add to cart (works for both logged in and non-logged in)
  const addToCart = useCallback(async (item) => {
    if (user) {
      // Logged in - save to database
      const currentCart = [...cartItems];
      const existingIndex = currentCart.findIndex(cartItem => 
        cartItem.id === item.id && 
        (!cartItem.variant || cartItem.variant?.id === item.variant?.id)
      );
      
      if (existingIndex >= 0) {
        currentCart[existingIndex].quantity += item.quantity;
        if (currentCart[existingIndex].quantity > currentCart[existingIndex].maxStock) {
          currentCart[existingIndex].quantity = currentCart[existingIndex].maxStock;
        }
      } else {
        currentCart.push(item);
      }
      
      await saveDatabaseCart(currentCart);
      showSuccess(`${item.title} added to cart!`);
    } else {
      // Not logged in - save to localStorage
      const currentCart = [...cartItems];
      const existingIndex = currentCart.findIndex(cartItem => 
        cartItem.id === item.id && 
        (!cartItem.variant || cartItem.variant?.id === item.variant?.id)
      );
      
      if (existingIndex >= 0) {
        currentCart[existingIndex].quantity += item.quantity;
        if (currentCart[existingIndex].quantity > currentCart[existingIndex].maxStock) {
          currentCart[existingIndex].quantity = currentCart[existingIndex].maxStock;
        }
      } else {
        currentCart.push(item);
      }
      
      saveLocalCart(currentCart);
      showSuccess(`${item.title} added to cart!`);
    }
  }, [user, cartItems, saveDatabaseCart, saveLocalCart, showSuccess]);

  // Update cart item quantity
  const updateCartQuantity = useCallback(async (index, newQuantity) => {
    const updatedCart = [...cartItems];
    updatedCart[index].quantity = Math.max(1, Math.min(newQuantity, updatedCart[index].maxStock || 99));
    
    if (user) {
      await saveDatabaseCart(updatedCart);
    } else {
      saveLocalCart(updatedCart);
    }
  }, [user, cartItems, saveDatabaseCart, saveLocalCart]);

  // Remove item from cart
  const removeFromCart = useCallback(async (index) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    
    if (user) {
      await saveDatabaseCart(updatedCart);
    } else {
      saveLocalCart(updatedCart);
    }
    showInfo('Item removed from cart');
  }, [user, cartItems, saveDatabaseCart, saveLocalCart, showInfo]);

  // Clear cart
  const clearCart = useCallback(async () => {
    if (user) {
      await saveDatabaseCart([]);
    } else {
      saveLocalCart([]);
    }
  }, [user, saveDatabaseCart, saveLocalCart]);

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      loadLocalCart();
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Merge local cart with database cart after login
        await mergeCartsOnLogin();
      } else if (response.status === 401 || response.status === 403) {
        handleAuthError(new Error('Authentication failed'));
        loadLocalCart();
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      handleAuthError(error);
      loadLocalCart();
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleAuthError, mergeCartsOnLogin, loadLocalCart]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Update handleLoginSuccess in DataContext.jsx
  const handleLoginSuccess = (userData) => {
    setUser({
      id: userData.id,
      userId: userData.userId,
      email: userData.email,
      fullName: userData.fullName,
      businessName: userData.businessName || userData.fullName,
      profileImage: userData.profileImage,
      phone: userData.phone || '',
    });
    localStorage.setItem('user', JSON.stringify({
      id: userData.id,
      userId: userData.userId,
      email: userData.email,
      fullName: userData.fullName,
      businessName: userData.businessName || userData.fullName,
      profileImage: userData.profileImage,
      phone: userData.phone || '',
    }));
    showSuccess(`Welcome back, ${userData.fullName || userData.businessName}!`);
  };

  const updateUserProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/user/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUser(prev => ({ ...prev, ...response.data.data }));
        showSuccess('Profile updated successfully!');
        return { success: true };
      }
      showError(response.data.message || 'Failed to update profile');
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update profile';
      showError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    setUser(null);
    loadLocalCart();
    showInfo('You have been logged out');
  }, [loadLocalCart, showInfo]);

  const value = {
    user,
    loading,
    cartItems,
    cartCount,
    setCartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    handleLoginSuccess,
    logout,
    refetchUser: fetchUserData,
    updateUserProfile,
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    categoriesWithProducts, 
    setCategoriesWithProducts,
    featuredProducts, 
    setFeaturedProducts,
    loadingProducts, 
    setLoadingProducts
  };
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};