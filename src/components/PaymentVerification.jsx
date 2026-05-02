// PaymentVerification.jsx - Updated to avoid double-clearing
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const PaymentVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart, fetchUserData } = useData();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (!hasProcessed) {
      setHasProcessed(true);
      verifyPayment();
    }
  }, []);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/');
    }
  }, [status, countdown, navigate]);

  const verifyPayment = async () => {
    const reference = searchParams.get('reference');
    
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/payment/verify/${reference}`);
      
      if (response.data.success) {
        // Get the pending order data to know which items were purchased
        const pendingOrderData = JSON.parse(localStorage.getItem('pendingOrderData') || '{}');
        const purchasedItemIds = pendingOrderData.items?.map(item => item.productId) || [];
        
        // Only clear the purchased items from cart, not the entire cart
        const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const remainingCart = currentCart.filter(item => !purchasedItemIds.includes(item.id));
        
        // Update localStorage
        localStorage.setItem('cart', JSON.stringify(remainingCart));
        
        // If user is logged in, sync with backend (backend will also filter purchased items)
        const token = localStorage.getItem('token');
        if (token) {
          await axios.post(`${API_BASE_URL}/cart/sync`, 
            { items: remainingCart },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Refresh user data to update cart count in UI
          if (fetchUserData) {
            fetchUserData();
          }
        }
        
        // Save order confirmation
        const orderConfirmation = {
          reference: reference,
          amount: response.data.data.amount / 100,
          items: pendingOrderData.items,
          deliveryAddress: pendingOrderData.deliveryAddress,
          orderDate: new Date().toISOString()
        };
        localStorage.setItem('lastOrder', JSON.stringify(orderConfirmation));
        
        // Clear pending data
        localStorage.removeItem('pendingPaymentRef');
        localStorage.removeItem('pendingOrderData');
        
        setStatus('success');
        setMessage(response.data.message || 'Payment successful! Your order has been placed.');
      } else {
        setStatus('failed');
        setMessage(response.data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('failed');
      setMessage(error.response?.data?.message || 'Failed to verify payment');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader className="w-16 h-16 animate-spin text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
          <p className="text-gray-500">Please wait while we confirm your transaction</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">{message}</p>
          <p className="text-gray-500 mb-6">Redirecting to home in {countdown} seconds...</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-orange-500 text-white font-semibold hover:bg-orange-600 transition border-0"
          >
            Go to Home Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/cart')}
            className="px-6 py-2 border border-orange-500 text-orange-500 font-semibold hover:bg-orange-50 transition"
          >
            Return to Cart
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-orange-500 text-white font-semibold hover:bg-orange-600 transition border-0"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerification;