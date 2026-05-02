// components/LocationWelcomeModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { MapPin, Check, AlertCircle, Navigation } from 'lucide-react';

const LocationWelcomeModal = ({ onLocationSelected }) => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: state selection, 2: city selection

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/states`);
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      setError('Failed to load states. Please refresh the page.');
    }
  };

  const fetchCities = async (state) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/state/${encodeURIComponent(state)}`);
      if (response.data.success) {
        setCities(response.data.data);
        setStep(2);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setError('Failed to load cities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    fetchCities(state);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
  };

  const handleConfirmLocation = () => {
    if (!selectedState || !selectedCity) {
      setError('Please select both state and city');
      return;
    }

    // Save to localStorage
    localStorage.setItem('buyerState', selectedState);
    localStorage.setItem('buyerCity', selectedCity);
    localStorage.setItem('locationSelected', 'true');
    localStorage.setItem('locationSelectedAt', new Date().toISOString());

    // Notify parent component
    onLocationSelected(selectedState, selectedCity);
  };

  const handleSkip = () => {
    // Allow user to skip but remind them later
    localStorage.setItem('locationSelected', 'skipped');
    onLocationSelected(null, null, true);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white max-w-md w-full overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Welcome to Zoomia!</h2>
          </div>
          <p className="text-orange-100 text-sm mt-2">
            Your one stop shop for incredible products with amazing prices.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kindly select your delivery location to get started.
              </label>
              <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-1">
                {states.map((state) => (
                  <button
                    key={state}
                    onClick={() => handleStateSelect(state)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      selectedState === state
                        ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setStep(1)}
                className="mb-3 text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                ← Back to states
              </button>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select your delivery city in {selectedState}
              </label>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading cities...</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-1">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        selectedCity === city
                          ? 'bg-orange-500 text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected location display */}
          {selectedState && selectedCity && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                Deliver to: <strong>{selectedCity}, {selectedState}</strong>
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleConfirmLocation}
              disabled={!selectedState || !selectedCity}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Location
            </button>
            <button
              onClick={handleSkip}
              className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Skip for now
            </button>
          </div>
          
          <p className="text-xs text-center text-gray-500 mt-4">
            You can always change your delivery location from your profile page
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationWelcomeModal;