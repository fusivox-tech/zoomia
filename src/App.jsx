// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import { useState, useEffect } from 'react';
import { DataProvider } from './contexts/DataContext';
import NavBar from './components/NavBar';
import Menu from './components/Menu';
import Seller from './components/Seller';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import SearchPage from './components/SearchPage';
import ProductDetail from './components/ProductDetail';
import CartPage from './components/CartPage';
import PaymentPage from './components/PaymentPage';
import { useData } from './contexts/DataContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PaymentVerification from './components/PaymentVerification';
import ProfilePage from './components/ProfilePage';
import LocationWelcomeModal from './components/LocationWelcomeModal';

const AppContent = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { handleLoginSuccess } = useData();

  useEffect(() => {
    // Check if location has been selected before
    const locationSelected = localStorage.getItem('locationSelected');
    const selectedCity = localStorage.getItem('buyerCity');
    const selectedState = localStorage.getItem('buyerState');
    
    // If location hasn't been selected or was skipped, show modal
    if (!locationSelected || locationSelected === 'skipped' || !selectedCity || !selectedState) {
      // Small delay to ensure everything is loaded
      setTimeout(() => {
        setShowLocationModal(true);
        setIsLoading(false);
      }, 500);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLocationSelected = (state, city, skipped = false) => {
    setShowLocationModal(false);
    
    if (!skipped && state && city) {
      // Refresh page to load products for the selected location
      window.location.reload();
    }
  };

  // Show nothing while checking location
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-500">Loading Zoomia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center bg-gray-50 overflow-y-auto">
      <NavBar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <Menu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={
          <GoogleOAuthProvider clientId="531388924549-sph32gdm0rhbh3ns5kt27f3rb357dtnf.apps.googleusercontent.com">
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          </GoogleOAuthProvider>
        } />
        <Route path="/seller" element={<Seller />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/verify" element={<PaymentVerification />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      
      {/* Location Welcome Modal */}
      {showLocationModal && (
        <LocationWelcomeModal onLocationSelected={handleLocationSelected} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <DataProvider>
        <Routes>
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </DataProvider>
    </Router>
  );
}