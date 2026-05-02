import { X, Microwave, Smartphone, Heart, Home, Laptop, Shirt, ShoppingCart, Computer, Baby, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MainMenu = ({ isMenuOpen, setIsMenuOpen }) => {
  const navigate = useNavigate();
  
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

  const handleCategoryClick = (categoryName) => {
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
    setIsMenuOpen(false);
  };
  
  return(
    <div className={`w-full md:w-[300px] md:absolute md:top-12 h-screen md:h-auto bg-black/50 md:bg-transparent absolute top-0 bottom-0 md:bottom-auto md:top-4 left-0 z-[1000] ${isMenuOpen ? 'block' : 'hidden'}`}>
      <div className="w-[350px] md:w-[300px] sticky md:relative top-0 md:top-0 bg-white h-[100%] max-w-[90%] border-r border-gray-200">
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
          <button onClick={() => {
           navigate('/seller');
           setIsMenuOpen(false);
          }} className="text-left">LIST A PRODUCT</button>
          <button className="text-left">CONTACT SUPPORT</button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;