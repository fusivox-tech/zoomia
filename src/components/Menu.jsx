import { X, Microwave, Smartphone, Heart, Home, Laptop, Shirt, ShoppingCart, Computer, Baby, Gamepad2, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import axios from 'axios';

const MainMenu = ({ isMenuOpen, setIsMenuOpen }) => {
  const navigate = useNavigate();
  const { user } = useData();
  const [isSeller, setIsSeller] = useState(false);
  const [checkingSeller, setCheckingSeller] = useState(true);
  
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

  const handleCategoryClick = (categoryName) => {
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
    setIsMenuOpen(false);
  };
  
  const handleMyStoreClick = () => {
    navigate(`/seller`);
    setIsMenuOpen(false);
  };
  
  const handleSellClick = () => {
    navigate('/seller');
    setIsMenuOpen(false);
  };
  
  return(
    <div className={`w-full md:w-[300px] md:fixed md:top-12 h-screen md:h-auto bg-black/50 md:bg-transparent fixed top-0 bottom-0 md:bottom-auto md:top-6 left-0 z-[1000] ${isMenuOpen ? 'block' : 'hidden'}`}>
      <div className="w-[350px] md:w-[300px] sticky md:relative top-0 md:top-6 bg-white h-[100%] max-w-[90%] border-r border-gray-200">
        <div className="w-full p-4 flex md:hidden items-center gap-4 border-b border-gray-200">
          <button onClick={() => setIsMenuOpen(false)} className="hover:bg-gray-100 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
          <img src="/wordmark.png" className="h-6 w-auto" alt="Logo" />
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
          {/* Show MY STORE if user is a seller, otherwise show SELL ON ZOOMMIA */}
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
                  SELL ON ZOOMMIA
                </button>
              ) : (
                <button 
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }} 
                  className="text-left"
                >
                  SELL ON ZOOMMIA
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
  );
};

export default MainMenu;