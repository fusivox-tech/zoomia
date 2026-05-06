import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  const categories = [
    'Appliances', 'Phones & Tablets', 'Health & Beauty', 'Home & Office', 
    'Electronics', 'Fashion', 'Supermarket', 'Computing', 'Baby Product', 'Gaming', 'Other'
  ];

  const handleCategoryClick = (categoryName) => {
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
    window.scrollTo(0, 0);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-700 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Company Info Section */}
          <div>
            <div className="mb-4">
              <img 
                src="/wordmark.png" 
                alt="Zoommia" 
                className="h-8 w-auto brightness-0 invert mb-3"
              />
              <p className="text-sm text-gray-400 mt-2">
                Your one-stop shop for quality products at affordable prices. 
                Shop with confidence and enjoy seamless delivery across Nigeria.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Lagos, Nigeria</p>
              <p className="text-sm text-gray-400">
                <a href="tel:+2348000000000" className="hover:text-orange-500 transition">+234 810 944 8643</a>
              </p>
              <p className="text-sm text-gray-400">
                <a href="mailto:paulrotimijohnson@gmail.com" className="hover:text-orange-500 transition">paulrotimijohnson@gmail.com</a>
              </p>
            </div>
          </div>

          {/* Categories Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Shop by Category</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => handleCategoryClick(category)}
                  className="text-sm text-gray-400 hover:text-orange-500 transition text-left"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-orange-500 transition">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/seller')} className="text-sm text-gray-400 hover:text-orange-500 transition">
                  Sell on Zoommia
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/profile?tab=orders')} className="text-sm text-gray-400 hover:text-orange-500 transition">
                  My Orders
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/cart')} className="text-sm text-gray-400 hover:text-orange-500 transition">
                  Shopping Cart
                </button>
              </li>
              <li>
                <button onClick={() => window.open('mailto:paulrotimijohnson@gmail.com')} className="text-sm text-gray-400 hover:text-orange-500 transition">
                  Contact Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-gray-800 pt-6 mt-4 text-center">
          <p className="text-xs text-gray-500">
            &copy; {currentYear} Zoommia. All rights reserved. 
            <button className="ml-2 hover:text-orange-500 transition">Privacy Policy</button>
            <button className="mx-2">•</button>
            <button className="hover:text-orange-500 transition">Terms of Service</button>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;