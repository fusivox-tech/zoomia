// components/SellerDeliveryZones.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { MapPin, Plus, X, ChevronDown, ChevronUp, Truck, Tag } from 'lucide-react';

const SellerDeliveryZones = ({ productId, currentZones = [], onZonesUpdate }) => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState(currentZones);
  const [editingZone, setEditingZone] = useState(null);
  
  // Discount form state
  const [discountForm, setDiscountForm] = useState({
    enabled: false,
    minQuantity: 2,
    discountType: 'percentage',
    discountValue: 0,
    appliesTo: 'delivery'
  });
  
  // Expanded zones for UI
  const [expandedZone, setExpandedZone] = useState(null);

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState);
    }
  }, [selectedState]);

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

  const addDeliveryZone = () => {
    if (!selectedState || !selectedCity) {
      alert('Please select both state and city');
      return;
    }
    
    const newZone = {
      id: Date.now(),
      state: selectedState,
      city: selectedCity,
      price: 0,
      discountOnQuantity: { ...discountForm }
    };
    
    const updatedZones = [...deliveryZones, newZone];
    setDeliveryZones(updatedZones);
    onZonesUpdate?.(updatedZones);
    
    // Reset form
    setSelectedState('');
    setSelectedCity('');
    setDiscountForm({
      enabled: false,
      minQuantity: 2,
      discountType: 'percentage',
      discountValue: 0,
      appliesTo: 'delivery'
    });
  };

  const updateZonePrice = (zoneId, price) => {
    const updatedZones = deliveryZones.map(zone =>
      zone.id === zoneId ? { ...zone, price: parseFloat(price) } : zone
    );
    setDeliveryZones(updatedZones);
    onZonesUpdate?.(updatedZones);
  };

  const updateZoneDiscount = (zoneId, discountData) => {
    const updatedZones = deliveryZones.map(zone =>
      zone.id === zoneId ? { ...zone, discountOnQuantity: discountData } : zone
    );
    setDeliveryZones(updatedZones);
    onZonesUpdate?.(updatedZones);
  };

  const removeZone = (zoneId) => {
    const updatedZones = deliveryZones.filter(zone => zone.id !== zoneId);
    setDeliveryZones(updatedZones);
    onZonesUpdate?.(updatedZones);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold">Delivery Zones & Pricing</h3>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Set delivery prices for different cities and bulk order discounts
      </p>
      
      {/* Existing Zones */}
      {deliveryZones.length > 0 && (
        <div className="mb-4 space-y-3">
          {deliveryZones.map((zone) => (
            <div key={zone.id} className="border border-gray-100 bg-gray-50 rounded-lg overflow-hidden">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="font-medium">{zone.city}</span>
                    <span className="text-gray-500 text-sm ml-1">({zone.state})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">Delivery:</span>
                    <input
                      type="number"
                      value={zone.price}
                      onChange={(e) => updateZonePrice(zone.id, e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Price"
                      step="50"
                      min="0"
                    />
                  </div>
                  <button
                    onClick={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {expandedZone === zone.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => removeZone(zone.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {expandedZone === zone.id && (
                <div className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-sm">Bulk Order Discount</span>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={zone.discountOnQuantity?.enabled || false}
                        onChange={(e) => {
                          const newDiscount = {
                            ...zone.discountOnQuantity,
                            enabled: e.target.checked
                          };
                          updateZoneDiscount(zone.id, newDiscount);
                        }}
                      />
                      <span className="text-sm">Enable bulk order discount</span>
                    </label>
                    
                    {zone.discountOnQuantity?.enabled && (
                      <div className="grid grid-cols-2 gap-3 pl-6">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Min Quantity</label>
                          <input
                            type="number"
                            value={zone.discountOnQuantity.minQuantity || 2}
                            onChange={(e) => {
                              const newDiscount = {
                                ...zone.discountOnQuantity,
                                minQuantity: parseInt(e.target.value)
                              };
                              updateZoneDiscount(zone.id, newDiscount);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            min="2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
                          <select
                            value={zone.discountOnQuantity.discountType || 'percentage'}
                            onChange={(e) => {
                              const newDiscount = {
                                ...zone.discountOnQuantity,
                                discountType: e.target.value
                              };
                              updateZoneDiscount(zone.id, newDiscount);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (₦)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Discount Value</label>
                          <input
                            type="number"
                            value={zone.discountOnQuantity.discountValue || 0}
                            onChange={(e) => {
                              const newDiscount = {
                                ...zone.discountOnQuantity,
                                discountValue: parseFloat(e.target.value)
                              };
                              updateZoneDiscount(zone.id, newDiscount);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Applies To</label>
                          <select
                            value={zone.discountOnQuantity.appliesTo || 'delivery'}
                            onChange={(e) => {
                              const newDiscount = {
                                ...zone.discountOnQuantity,
                                appliesTo: e.target.value
                              };
                              updateZoneDiscount(zone.id, newDiscount);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="delivery">Delivery Only</option>
                            <option value="product">Product Only</option>
                            <option value="both">Both Delivery & Product</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Add New Zone */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium mb-3">Add new delivery zone</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select State</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              disabled={!selectedState || loading}
            >
              <option value="">Select City</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Discount options for new zone */}
        <div className="mb-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={discountForm.enabled}
              onChange={(e) => setDiscountForm({ ...discountForm, enabled: e.target.checked })}
            />
            Enable bulk order discount for this zone
          </label>
        </div>
        
        {discountForm.enabled && (
          <div className="grid grid-cols-2 gap-3 mb-3 pl-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Quantity</label>
              <input
                type="number"
                value={discountForm.minQuantity}
                onChange={(e) => setDiscountForm({ ...discountForm, minQuantity: parseInt(e.target.value) })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                min="2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
              <select
                value={discountForm.discountType}
                onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₦)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Discount Value</label>
              <input
                type="number"
                value={discountForm.discountValue}
                onChange={(e) => setDiscountForm({ ...discountForm, discountValue: parseFloat(e.target.value) })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Applies To</label>
              <select
                value={discountForm.appliesTo}
                onChange={(e) => setDiscountForm({ ...discountForm, appliesTo: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="delivery">Delivery Only</option>
                <option value="product">Product Only</option>
                <option value="both">Both Delivery & Product</option>
              </select>
            </div>
          </div>
        )}
        
        <button
          type="button"
          onClick={addDeliveryZone}
          className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Delivery Zone
        </button>
      </div>
    </div>
  );
};

export default SellerDeliveryZones;