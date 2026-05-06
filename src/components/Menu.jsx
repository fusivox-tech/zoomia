import { X, Microwave, Smartphone, Heart, Home, Laptop, Shirt, ShoppingCart, Computer, Baby, Gamepad2, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import axios from 'axios';

const MainMenu = ({ isMenuOpen, setIsMenuOpen, onAnimationChange }) => {
  const navigate = useNavigate();
  const { user } = useData();
  const [isSeller, setIsSeller] = useState(false);
  const [checkingSeller, setCheckingSeller] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    if (isMenuOpen) {
      setShouldRender(true);
      // Use setTimeout to ensure DOM is ready before animation
      setTimeout(() => {
        setIsAnimating(true);
        if (onAnimationChange) onAnimationChange(true);
      }, 10);
    } else {
      setIsAnimating(false);
      if (onAnimationChange) onAnimationChange(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen, onAnimationChange]);
  
  const categories = [
    { name: 'Appliances', icon: Microwave, path: 'Appliances' },
    { name: 'Phones & Tablets', icon: Smartphone, path: 'Phones & Tablets' },
    { name: 'Health & Beauty', icon: Heart, path: 'Health & Beauty' },
    { name: 'Home & Office', icon: Home, path: 'Home & Office' },
    { name: 'Electronics', icon: Laptop, path: 'Electronics' },
    { name: 'Fashion', icon: Shirt, path: 'Fashion' },
    { name: 'Supermarket', icon: ShoppingCart, path: 'Supermarket' },
    { name: 'Computing', icon: Computer, path: 'Computing' },
    { name: 'Baby Product', icon: Baby, path: 'Baby Product' },
    { name: 'Gaming', icon: Gamepad2, path: 'Gaming' },
  ];
  
  const getAuthToken = () => localStorage.getItem('token');

  // Check if user is a seller (has at least one active product)
  useEffect(() => {
    const checkIfSeller = async () => {
      if (!user || !user._id) {
        setIsSeller(false);
        setCheckingSeller(false);
        return;
      }
      
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/products/seller/${user._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          setIsSeller(true);
        } else {
          setIsSeller(false);
        }
      } catch (error) {
        console.error('Error checking seller status:', error);
        setIsSeller(false);
      } finally {
        setCheckingSeller(false);
      }
    };
    
    checkIfSeller();
  }, [user]);

  // Helper function to check if on mobile
  const isMobile = () => window.innerWidth < 768;

  // Navigation handler - only closes menu on mobile
  const handleNavigation = (path, shouldClose = true) => {
    navigate(path);
    // Only close menu on mobile when shouldClose is true
    if (shouldClose && isMobile()) {
      setIsMenuOpen(false);
    }
  };

  const handleCategoryClick = (categoryName) => {
    handleNavigation(`/search?category=${encodeURIComponent(categoryName)}`);
  };
  
  const handleMyStoreClick = () => {
    handleNavigation('/seller');
  };
  
  const handleSellClick = () => {
    handleNavigation('/seller');
  };
  
  const handleLoginClick = () => {
    handleNavigation('/login');
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  const goHome = () => {
    handleNavigation('/');
  };
  
  // Don't render anything if menu shouldn't be visible
  if (!shouldRender) {
    return null;
  }
  
  return(
    <>
      {/* Backdrop overlay - fades in/out (mobile only) */}
      <div 
        className={`fixed inset-0 bg-black/50 z-10 md:-z-10 transition-opacity duration-300 md:hidden
          ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeMenu}
      />
      
      {/* Menu panel - slides from left on all screen sizes */}
      <div className={`fixed top-0 md:top-18 left-0 z-[1001] h-full transition-transform duration-300 ease-in-out
        ${isAnimating ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="w-[350px] md:w-[250px] h-full bg-white border-r border-gray-200 overflow-y-auto shadow-lg md:shadow-none">
          <div className="w-full p-4 flex md:hidden items-center gap-4 border-b border-gray-200">
            <button onClick={closeMenu} className="hover:bg-gray-100 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
            <img onClick={goHome} src="/wordmark.png" className="h-6 w-auto cursor-pointer" alt="Logo" />
          </div>
          <div className="w-full overflow-y-auto max-h-[calc(100%-173px)] pt-4 space-y-1">
            {categories.map((category, index) => (
              <button 
                key={index}
                onClick={() => handleCategoryClick(category.name)}
                className="w-full px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
              >
                <category.icon className="w-5 h-5" />
                <span className="text-sm">{category.name}</span>
              </button>
            ))}
          </div>
          <div className="p-6 flex flex-col gap-4 border-t border-gray-200">
            {/* Show MY STORE if user is a seller, otherwise show SELL ON ZOOMIA */}
            {!checkingSeller && (
              isSeller ? (
                <button 
                  onClick={handleMyStoreClick} 
                  className="text-left flex items-center gap-2 font-medium text-orange-600"
                >
                  <Store className="w-4 h-4" />
                  MY STORE
                </button>
              ) : (
                user ? (
                  <button 
                    onClick={handleSellClick} 
                    className="text-left"
                  >
                    SELL ON ZOOMIA
                  </button>
                ) : (
                  <button 
                    onClick={handleLoginClick} 
                    className="text-left"
                  >
                    SELL ON ZOOMIA
                  </button>
                )
              )
            )}
            
            {/* Show loading state while checking */}
            {checkingSeller && user && (
              <div className="text-left text-gray-400 text-sm">
                Loading...
              </div>
            )}
            
            <button onClick={() => window.open('mailto:paulrotimijohnson@gmail.com')} className="text-left">
              CONTACT SUPPORT
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainMenu;