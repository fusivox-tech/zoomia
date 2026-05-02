// components/BuyerLocationSelector.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { MapPin, ChevronDown } from 'lucide-react';

const BuyerLocationSelector = ({ onLocationSelect, initialCity, initialState }) => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState(initialState || '');
  const [selectedCity, setSelectedCity] = useState(initialCity || '');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStates();
    // Load saved location from localStorage
    const savedState = localStorage.getItem('buyerState');
    const savedCity = localStorage.getItem('buyerCity');
    if (savedState && savedCity && !selectedState) {
      setSelectedState(savedState);
      setSelectedCity(savedCity);
      onLocationSelect?.(savedState, savedCity);
      fetchCities(savedState);
    }
  }, []);

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/states`);
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchCities = async (state) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/state/${encodeURIComponent(state)}`);
      if (response.data.success) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedCity('');
    fetchCities(state);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    localStorage.setItem('buyerState', selectedState);
    localStorage.setItem('buyerCity', city);
    onLocationSelect?.(selectedState, city);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (selectedCity && selectedState) {
      return `${selectedCity}, ${selectedState}`;
    }
    return 'Select delivery location';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-orange-500 transition"
      >
        <MapPin className="w-4 h-4 text-orange-500" />
        <span className="text-sm">{getDisplayText()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select State</label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Choose a state</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            {selectedState && (
              <div>
                <label className="block text-sm font-medium mb-2">Select City</label>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {cities.map(city => (
                      <button
                        key={city}
                        onClick={() => handleCitySelect(city)}
                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 transition ${
                          selectedCity === city ? 'bg-orange-50 text-orange-600' : ''
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerLocationSelector;