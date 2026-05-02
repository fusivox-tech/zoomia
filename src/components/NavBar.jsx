import { Menu, X, User, CircleHelp, ShoppingCart, ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

const NavBar = ({isMenuOpen, setIsMenuOpen}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { cartCount, user } = useData();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return(
    <div className="w-full flex bg-white justify-center sticky top-0 border-b border-gray-200 z-50">
      <div className="w-full flex flex-col p-4">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? (<X className="w-5 h-5" />) : (<Menu className="w-5 h-5" />)}
            </button>
            <img src="/wordmark.png" className="h-6 w-auto cursor-pointer" onClick={() => navigate('/')} />
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </form>
          
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/profile')} className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <div className="hidden md:flex items-center gap-2">
                <span>{user ? user.fullName?.split(' ')[0] : 'Account'}</span>
              </div>
            </button>
            <button onClick={() => navigate('/cart')} className="flex items-center gap-2 relative">
              <ShoppingCart className="w-5 h-5" />
              <div className="hidden md:flex items-center gap-2">
                <span>Cart</span>
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <form onSubmit={handleSearch} className="md:hidden mt-3">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 focus:border-orange-500 focus:outline-none"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NavBar;