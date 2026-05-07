import { useState, useEffect } from 'react';
import { MapPin, Navigation, Check, AlertCircle, ChevronRight } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

const LocationWelcomeModal = ({ onLocationSelected }) => {
  const [step, setStep] = useState(1); // 1: State, 2: City, 3: Neighborhood
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [neighborhoodError, setNeighborhoodError] = useState('');

  // Fetch states on mount
  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/states`);
      if (response.data.success) {
        setStates(response.data.data);
      } else {
        setError('Failed to load states');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (state) => {
    setLoading(true);
    setError('');
    try {
      const encodedState = encodeURIComponent(state);
      const response = await axios.get(`${API_BASE_URL}/cities/state/${encodedState}`);
      if (response.data.success) {
        setCities(response.data.data);
        if (response.data.data.length === 0) {
          setError('No cities found for this state');
        }
      } else {
        setError('Failed to load cities');
      }
    } catch (err) {
      setError('Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  const fetchNeighborhoods = async (state, city) => {
    setLoading(true);
    setNeighborhoodError('');
    setError('');
    try {
      const encodedState = encodeURIComponent(state);
      const encodedCity = encodeURIComponent(city);
      const response = await axios.get(`${API_BASE_URL}/cities/${encodedState}/${encodedCity}/suburbs`);
      if (response.data.success) {
        if (response.data.data.length === 0) {
          setNeighborhoodError('No neighborhoods found for this city. Please contact support.');
        }
        setNeighborhoods(response.data.data);
      } else {
        setNeighborhoodError('Failed to load neighborhoods');
      }
    } catch (err) {
      setNeighborhoodError('Failed to load neighborhoods');
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    fetchCities(state);
    setStep(2);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    fetchNeighborhoods(selectedState, city);
    setStep(3);
  };

  const handleNeighborhoodSelect = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
  };

  const handleConfirm = () => {
    // Validate all three levels are selected
    if (!selectedState) {
      setError('Please select your state');
      return;
    }
    if (!selectedCity) {
      setError('Please select your city');
      return;
    }
    if (!selectedNeighborhood) {
      setError('Please select your neighborhood');
      return;
    }

    // Save all three levels to localStorage
    localStorage.setItem('buyerState', selectedState);
    localStorage.setItem('buyerCity', selectedCity);
    localStorage.setItem('buyerNeighborhood', selectedNeighborhood);
    localStorage.setItem('locationSelected', 'true');
    localStorage.setItem('locationSelectedAt', new Date().toISOString());
    
    // Call the callback with state, city, and neighborhood (no skipped flag)
    onLocationSelected(selectedState, selectedCity, selectedNeighborhood);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedCity('');
      setCities([]);
      setError('');
    } else if (step === 3) {
      setStep(2);
      setSelectedNeighborhood('');
      setNeighborhoods([]);
      setNeighborhoodError('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Navigation className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select Your Location</h2>
              <p className="text-sm text-gray-500">Step {step} of 3</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full mx-1 ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-orange-500' : 'bg-gray-200'}`} />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Step 1: Select State */}
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select your State <span className="text-red-500">*</span>
              </label>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading states...</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {states.map((state) => (
                    <button
                      key={state}
                      onClick={() => handleStateSelect(state)}
                      className="w-full text-left px-4 py-3 hover:bg-orange-50 transition border-b border-gray-100 last:border-0 flex justify-between items-center"
                    >
                      <span className="text-gray-700">{state}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select City */}
          {step === 2 && (
            <div>
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Selected State:</p>
                <p className="font-medium text-gray-900">{selectedState}</p>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select your City <span className="text-red-500">*</span>
              </label>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading cities...</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      className="w-full text-left px-4 py-3 hover:bg-orange-50 transition border-b border-gray-100 last:border-0 flex justify-between items-center"
                    >
                      <span className="text-gray-700">{city}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleBack}
                className="mt-4 text-sm text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-1"
              >
                ← Back to States
              </button>
            </div>
          )}

          {/* Step 3: Select Neighborhood - REQUIRED */}
          {step === 3 && (
            <div>
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Selected Location:</p>
                <p className="font-medium text-gray-900">{selectedCity}, {selectedState}</p>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select your Neighborhood <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-orange-600 mb-3">
                <strong>Required:</strong> Your neighborhood helps sellers provide accurate delivery estimates
              </p>
              
              {neighborhoodError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mb-2" />
                  <p className="text-sm text-red-600 font-medium">{neighborhoodError}</p>
                  <p className="text-xs text-red-500 mt-1">Please contact support if you believe this is an error.</p>
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading neighborhoods...</p>
                </div>
              ) : neighborhoods.length > 0 ? (
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto mb-4">
                  {neighborhoods.map((neighborhood) => (
                    <button
                      key={neighborhood}
                      onClick={() => handleNeighborhoodSelect(neighborhood)}
                      className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition border-b border-gray-100 last:border-0 flex justify-between items-center ${
                        selectedNeighborhood === neighborhood ? 'bg-orange-50 text-orange-600 font-medium border-l-4 border-l-orange-500' : 'text-gray-700'
                      }`}
                    >
                      <span>{neighborhood}</span>
                      {selectedNeighborhood === neighborhood && (
                        <Check className="w-4 h-4 text-orange-500" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No neighborhoods found for this city</p>
                  <p className="text-xs text-gray-400 mt-1">Please contact support to add your neighborhood</p>
                </div>
              )}
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedNeighborhood || neighborhoods.length === 0}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  Confirm Location
                </button>
              </div>
              
              {!selectedNeighborhood && neighborhoods.length > 0 && (
                <p className="text-xs text-orange-500 text-center mt-3">
                  Please select a neighborhood to continue
                </p>
              )}
            </div>
          )}

          {/* No skip button - neighborhood is required */}
          {step < 3 && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Your full delivery location (including neighborhood) helps us show you accurate product availability
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationWelcomeModal;