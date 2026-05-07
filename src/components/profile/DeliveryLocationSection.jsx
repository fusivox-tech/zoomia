import { useState, useEffect } from 'react';
import { MapPin, Navigation, Edit2, X, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { useData } from '../../contexts/DataContext';

const DeliveryLocationSection = () => {
  const { showSuccess, showError } = useData();
  const [editingLocation, setEditingLocation] = useState(false);
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState([]);
  const [tempState, setTempState] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [tempNeighborhood, setTempNeighborhood] = useState('');
  const [currentLocation, setCurrentLocation] = useState({ state: '', city: '' });
  const [currentNeighborhood, setCurrentNeighborhood] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [neighborhoodError, setNeighborhoodError] = useState('');

  useEffect(() => {
    loadCurrentLocation();
    fetchStates();
  }, []);

  const loadCurrentLocation = () => {
    const savedState = localStorage.getItem('buyerState');
    const savedCity = localStorage.getItem('buyerCity');
    const savedNeighborhood = localStorage.getItem('buyerNeighborhood');
    if (savedState && savedCity && savedNeighborhood) {
      setCurrentLocation({ state: savedState, city: savedCity });
      setCurrentNeighborhood(savedNeighborhood);
      setTempState(savedState);
      setTempCity(savedCity);
      setTempNeighborhood(savedNeighborhood);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/states`);
      if (response.data.success) {
        setAvailableStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      setLocationError('Failed to connect to server');
    }
  };

  const fetchCitiesForState = async (state) => {
    setLocationLoading(true);
    setLocationError('');
    setAvailableCities([]);
    try {
      const encodedState = encodeURIComponent(state);
      const response = await axios.get(`${API_BASE_URL}/cities/state/${encodedState}`);
      if (response.data.success) {
        setAvailableCities(response.data.data);
      } else {
        setLocationError('Failed to load cities');
      }
    } catch (error) {
      setLocationError('Failed to load cities');
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchNeighborhoodsForCity = async (state, city) => {
    setNeighborhoodLoading(true);
    setNeighborhoodError('');
    setAvailableNeighborhoods([]);
    try {
      const encodedState = encodeURIComponent(state);
      const encodedCity = encodeURIComponent(city);
      const response = await axios.get(`${API_BASE_URL}/cities/${encodedState}/${encodedCity}/suburbs`);
      if (response.data.success) {
        if (response.data.data.length === 0) {
          setNeighborhoodError('No neighborhoods found for this city. Please contact support.');
        }
        setAvailableNeighborhoods(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      setNeighborhoodError('Failed to load neighborhoods. Please try again.');
    } finally {
      setNeighborhoodLoading(false);
    }
  };

  const handleStateChange = (state) => {
    setTempState(state);
    setTempCity('');
    setTempNeighborhood('');
    setAvailableCities([]);
    setAvailableNeighborhoods([]);
    setNeighborhoodError('');
    if (state) {
      fetchCitiesForState(state);
    }
  };

  const handleCitySelect = (city) => {
    setTempCity(city);
    setTempNeighborhood('');
    setAvailableNeighborhoods([]);
    setNeighborhoodError('');
    if (tempState && city) {
      fetchNeighborhoodsForCity(tempState, city);
    }
  };

  const saveLocation = () => {
    // Validate all three fields are selected
    if (!tempState) {
      showError('Please select a state');
      return;
    }
    if (!tempCity) {
      showError('Please select a city');
      return;
    }
    if (!tempNeighborhood) {
      showError('Please select a neighborhood');
      return;
    }

    // Save all three levels to localStorage
    localStorage.setItem('buyerState', tempState);
    localStorage.setItem('buyerCity', tempCity);
    localStorage.setItem('buyerNeighborhood', tempNeighborhood);
    localStorage.setItem('locationSelected', 'true');
    localStorage.setItem('locationSelectedAt', new Date().toISOString());
    
    setCurrentLocation({ state: tempState, city: tempCity });
    setCurrentNeighborhood(tempNeighborhood);
    setEditingLocation(false);
    
    showSuccess(`Delivery location updated to ${tempNeighborhood}, ${tempCity}, ${tempState}!`);
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">Delivery Location</h3>
        </div>
        <button
          onClick={() => {
            setEditingLocation(!editingLocation);
            if (!editingLocation && availableStates.length === 0) {
              fetchStates();
            }
            if (!editingLocation && tempState && tempCity) {
              fetchNeighborhoodsForCity(tempState, tempCity);
            }
          }}
          className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
        >
          {editingLocation ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          {editingLocation ? 'Cancel' : 'Change'}
        </button>
      </div>
      
      {!editingLocation ? (
        <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Delivery Location:</p>
              <p className="font-semibold text-gray-900">
                {currentNeighborhood && currentLocation.city && currentLocation.state 
                  ? `${currentNeighborhood}, ${currentLocation.city}, ${currentLocation.state}`
                  : 'No location set'}
              </p>
            </div>
            {currentNeighborhood && currentLocation.city && currentLocation.state && (
              <Check className="w-5 h-5 text-green-600 ml-auto" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Only products available for delivery to this location will be shown
          </p>
        </div>
      ) : (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {locationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{locationError}</p>
            </div>
          )}
          
          {/* State Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select State <span className="text-red-500">*</span>
            </label>
            <select
              value={tempState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Choose a state</option>
              {availableStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          {/* City Selection */}
          {tempState && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select City in {tempState} <span className="text-red-500">*</span>
              </label>
              {locationLoading ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                  <p className="text-sm text-gray-500">Loading cities...</p>
                </div>
              ) : availableCities.length > 0 ? (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {availableCities.map(city => (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      className={`w-full text-left px-4 py-2 hover:bg-orange-50 transition ${
                        tempCity === city ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">No cities found for {tempState}</p>
                  <p className="text-xs text-gray-400 mt-1">Try selecting a different state</p>
                </div>
              )}
            </div>
          )}
          
          {/* Neighborhood Selection - REQUIRED */}
          {tempState && tempCity && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Neighborhood <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">This helps sellers provide accurate delivery estimates</p>
              
              {neighborhoodError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{neighborhoodError}</p>
                </div>
              )}
              
              {neighborhoodLoading ? (
                <div className="text-center py-6 bg-white rounded-lg border border-gray-200">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                  <p className="text-xs text-gray-500 mt-1">Loading neighborhoods...</p>
                </div>
              ) : availableNeighborhoods.length > 0 ? (
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {availableNeighborhoods.map(neighborhood => (
                    <button
                      key={neighborhood}
                      onClick={() => setTempNeighborhood(neighborhood)}
                      className={`w-full text-left px-4 py-2 hover:bg-orange-50 transition ${
                        tempNeighborhood === neighborhood ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {neighborhood}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">No neighborhoods found for {tempCity}</p>
                  <p className="text-xs text-gray-400 mt-1">Please contact support to add your neighborhood</p>
                </div>
              )}
            </div>
          )}
          
          {/* Selection Summary */}
          {tempState && tempCity && tempNeighborhood && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-4 h-4 text-green-600 inline mr-2" />
              <span className="text-sm text-green-700">
                Selected: <strong>{tempNeighborhood}, {tempCity}, {tempState}</strong>
              </span>
            </div>
          )}
          
          {/* Save Button */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={saveLocation}
              disabled={!tempState || !tempCity || !tempNeighborhood || locationLoading || neighborhoodLoading}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Location
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Your delivery location determines which products you can see and buy
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliveryLocationSection;