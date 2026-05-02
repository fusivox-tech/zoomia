// App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import { useState } from 'react';
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

const AppContent = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { handleLoginSuccess } = useData();
  
  return(
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