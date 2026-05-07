// components/SellerDeliveryZones.jsx 
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useData } from '../../contexts/DataContext';
import API_BASE_URL from '../../config';
import { MapPin, Plus, X, ChevronDown, ChevronUp, Truck, Tag, Globe, Layers } from 'lucide-react';

const SellerDeliveryZones = ({ productId, currentZones = [], onZonesUpdate }) => {
  const { showSuccess, showError } = useData();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState(currentZones);
  const [loadingZones, setLoadingZones] = useState(false);
  const [totalZones, setTotalZones] = useState(0);
  
  // Bulk add states
  const [showBulkStateModal, setShowBulkStateModal] = useState(false);
  const [selectedBulkState, setSelectedBulkState] = useState('');
  const [bulkStatePrice, setBulkStatePrice] = useState(0);
  const [bulkStateDiscount, setBulkStateDiscount] = useState({
    enabled: false,
    minQuantity: 2,
    discountType: 'percentage',
    discountValue: 0,
    appliesTo: 'delivery'
  });
  
  // Bulk add nationwide
  const [showNationwideModal, setShowNationwideModal] = useState(false);
  const [nationwidePrice, setNationwidePrice] = useState(0);
  const [nationwideDiscount, setNationwideDiscount] = useState({
    enabled: false,
    minQuantity: 2,
    discountType: 'percentage',
    discountValue: 0,
    appliesTo: 'delivery'
  });
  const [addingNationwide, setAddingNationwide] = useState(false);
  
  // Discount form state for single zone
  const [discountForm, setDiscountForm] = useState({
    enabled: false,
    minQuantity: 2,
    discountType: 'percentage',
    discountValue: 0,
    appliesTo: 'delivery'
  });
  
  // Expanded zones for UI
  const [expandedZone, setExpandedZone] = useState(null);

  // Fetch delivery zones when editing (fetches all at once - pagination removed)
  const fetchDeliveryZonesForEdit = async (id) => {
    if (!id) return;
    
    setLoadingZones(true);
    try {
      // Removed pagination parameters to fetch all zones
      const response = await axios.get(
        `${API_BASE_URL}/product/delivery-zones/${id}`
      );
      
      if (response.data.success) {
        const allZones = response.data.data;
        setTotalZones(allZones.length);
        setDeliveryZones(allZones);
        onZonesUpdate?.(allZones);
      }
    } catch (error) {
      console.error('Error fetching delivery zones:', error);
    } finally {
      setLoadingZones(false);
    }
  };

  // Load zones when productId is provided (editing mode)
  useEffect(() => {
    if (productId && currentZones.length === 0) {
      fetchDeliveryZonesForEdit(productId);
    } else if (currentZones.length > 0) {
      setDeliveryZones(currentZones);
      setTotalZones(currentZones.length);
    }
  }, [productId]);

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
      showError('Please select both state and city');
      return;
    }
    
    // Check if zone already exists
    const zoneExists = deliveryZones.some(
      zone => zone.state === selectedState && zone.city === selectedCity
    );
    
    if (zoneExists) {
      showError(`Delivery zone for ${selectedCity}, ${selectedState} already exists`);
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
    setTotalZones(updatedZones.length);
    
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
    setTotalZones(updatedZones.length);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  // Group zones by state for better display
  const zonesByState = deliveryZones.reduce((acc, zone) => {
    if (!acc[zone.state]) {
      acc[zone.state] = [];
    }
    acc[zone.state].push(zone);
    return acc;
  }, {});

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold">Delivery Zones & Pricing</h3>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Set delivery prices for different cities. You can add single cities, entire states, or nationwide.
      </p>
      
      {/* Bulk Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => setShowBulkStateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          <Layers className="w-4 h-4" />
          Add Entire State
        </button>
        <button
          type="button"
          onClick={() => setShowNationwideModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
        >
          <Globe className="w-4 h-4" />
          Add Nationwide
        </button>
      </div>
      
      {/* Existing Zones - Grouped by State */}
      {deliveryZones.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Configured Delivery Zones ({totalZones} cities)
            </h4>
          </div>
          
          {loadingZones ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="text-sm text-gray-500 mt-2">Loading delivery zones...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(zonesByState).map(([state, zones]) => (
                  <div key={state} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 flex justify-between items-center">
                      <span className="font-semibold text-sm">{state}</span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove all delivery zones for ${state}?`)) {
                            const updatedZones = deliveryZones.filter(zone => zone.state !== state);
                            setDeliveryZones(updatedZones);
                            onZonesUpdate?.(updatedZones);
                            setTotalZones(updatedZones.length);
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Remove All
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {zones.map((zone) => (
                        <div key={zone.id} className="p-2 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-sm font-medium">{zone.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">₦</span>
                                <input
                                  type="number"
                                  value={zone.price}
                                  onChange={(e) => updateZonePrice(zone.id, e.target.value)}
                                  className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  step="50"
                                  min="0"
                                />
                              </div>
                              <button
                                onClick={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
                                className="p-0.5 hover:bg-gray-200 rounded"
                              >
                                {expandedZone === zone.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => removeZone(zone.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          {expandedZone === zone.id && (
                            <div className="mt-2 pl-4 pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-2 mb-2">
                                <Tag className="w-3 h-3 text-orange-500" />
                                <span className="text-xs font-medium">Bulk Order Discount</span>
                              </div>
                              <div className="space-y-2">
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
                                    className="w-3 h-3"
                                  />
                                  <span className="text-xs">Enable discount</span>
                                </label>
                                
                                {zone.discountOnQuantity?.enabled && (
                                  <div className="grid grid-cols-4 gap-2">
                                    <div>
                                      <label className="block text-xs text-gray-500">Min Qty</label>
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
                                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                        min="2"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500">Type</label>
                                      <select
                                        value={zone.discountOnQuantity.discountType || 'percentage'}
                                        onChange={(e) => {
                                          const newDiscount = {
                                            ...zone.discountOnQuantity,
                                            discountType: e.target.value
                                          };
                                          updateZoneDiscount(zone.id, newDiscount);
                                        }}
                                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                      >
                                        <option value="percentage">%</option>
                                        <option value="fixed">₦</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500">Value</label>
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
                                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                        min="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500">Applies To</label>
                                      <select
                                        value={zone.discountOnQuantity.appliesTo || 'delivery'}
                                        onChange={(e) => {
                                          const newDiscount = {
                                            ...zone.discountOnQuantity,
                                            appliesTo: e.target.value
                                          };
                                          updateZoneDiscount(zone.id, newDiscount);
                                        }}
                                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                      >
                                        <option value="delivery">Delivery</option>
                                        <option value="product">Product</option>
                                        <option value="both">Both</option>
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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Add Single City Section - Keep existing code */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium mb-3">Add Single City</p>
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
          disabled={!selectedState || !selectedCity}
          className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Single City
        </button>
      </div>

      {/* Bulk State Modal - Keep existing code */}
      {showBulkStateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShowBulkStateModal(false);
        }}>
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Entire State</h3>
              <button onClick={() => setShowBulkStateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select State</label>
                <select
                  value={selectedBulkState}
                  onChange={(e) => setSelectedBulkState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Choose a state</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Price (₦)</label>
                <input
                  type="number"
                  value={bulkStatePrice}
                  onChange={(e) => setBulkStatePrice(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., 1500"
                  min="0"
                  step="50"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bulkStateDiscount.enabled}
                    onChange={(e) => setBulkStateDiscount({ ...bulkStateDiscount, enabled: e.target.checked })}
                  />
                  <span className="text-sm">Enable bulk discount for all cities in this state</span>
                </label>
              </div>
              
              {bulkStateDiscount.enabled && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Quantity</label>
                    <input
                      type="number"
                      value={bulkStateDiscount.minQuantity}
                      onChange={(e) => setBulkStateDiscount({ ...bulkStateDiscount, minQuantity: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      min="2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
                    <select
                      value={bulkStateDiscount.discountType}
                      onChange={(e) => setBulkStateDiscount({ ...bulkStateDiscount, discountType: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (₦)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Discount Value</label>
                    <input
                      type="number"
                      value={bulkStateDiscount.discountValue}
                      onChange={(e) => setBulkStateDiscount({ ...bulkStateDiscount, discountValue: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Applies To</label>
                    <select
                      value={bulkStateDiscount.appliesTo}
                      onChange={(e) => setBulkStateDiscount({ ...bulkStateDiscount, appliesTo: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="delivery">Delivery</option>
                      <option value="product">Product</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    if (!selectedBulkState) {
                      showError('Please select a state');
                      return;
                    }
                    if (bulkStatePrice <= 0) {
                      showError('Please enter a valid delivery price');
                      return;
                    }
                    
                    setLoading(true);
                    try {
                      const response = await axios.get(`${API_BASE_URL}/cities/state/${encodeURIComponent(selectedBulkState)}`);
                      
                      if (response.data.success) {
                        const citiesInState = response.data.data;
                        const existingZones = new Set(
                          deliveryZones.filter(z => z.state === selectedBulkState).map(z => z.city)
                        );
                        
                        const newZones = citiesInState
                          .filter(city => !existingZones.has(city))
                          .map(city => ({
                            id: Date.now() + Math.random(),
                            state: selectedBulkState,
                            city: city,
                            price: bulkStatePrice,
                            discountOnQuantity: { ...bulkStateDiscount }
                          }));
                        
                        if (newZones.length === 0) {
                          showError(`All cities in ${selectedBulkState} already have delivery zones`);
                          setShowBulkStateModal(false);
                          setLoading(false);
                          return;
                        }
                        
                        const updatedZones = [...deliveryZones, ...newZones];
                        setDeliveryZones(updatedZones);
                        onZonesUpdate?.(updatedZones);
                        setTotalZones(updatedZones.length);
                        
                        showSuccess(`Added ${newZones.length} delivery zones for ${selectedBulkState}`);
                        setShowBulkStateModal(false);
                        setSelectedBulkState('');
                        setBulkStatePrice(0);
                        setBulkStateDiscount({
                          enabled: false,
                          minQuantity: 2,
                          discountType: 'percentage',
                          discountValue: 0,
                          appliesTo: 'delivery'
                        });
                      }
                    } catch (error) {
                      console.error('Error adding state zones:', error);
                      showError('Failed to add delivery zones for state');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={!selectedBulkState || bulkStatePrice <= 0 || loading}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add State'}
                </button>
                <button
                  onClick={() => setShowBulkStateModal(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nationwide Modal - Keep existing code */}
      {showNationwideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShowNationwideModal(false);
        }}>
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">Add Nationwide Delivery</h3>
              </div>
              <button onClick={() => setShowNationwideModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              This will add delivery zones for EVERY city in ALL 37 states of Nigeria.
              Cities that already have zones will be skipped.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nationwide Delivery Price (₦)</label>
                <input
                  type="number"
                  value={nationwidePrice}
                  onChange={(e) => setNationwidePrice(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., 2000"
                  min="0"
                  step="50"
                />
                <p className="text-xs text-gray-500 mt-1">This price will apply to all cities across Nigeria</p>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={nationwideDiscount.enabled}
                    onChange={(e) => setNationwideDiscount({ ...nationwideDiscount, enabled: e.target.checked })}
                  />
                  <span className="text-sm">Enable bulk discount for all nationwide deliveries</span>
                </label>
              </div>
              
              {nationwideDiscount.enabled && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Quantity</label>
                    <input
                      type="number"
                      value={nationwideDiscount.minQuantity}
                      onChange={(e) => setNationwideDiscount({ ...nationwideDiscount, minQuantity: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      min="2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
                    <select
                      value={nationwideDiscount.discountType}
                      onChange={(e) => setNationwideDiscount({ ...nationwideDiscount, discountType: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (₦)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Discount Value</label>
                    <input
                      type="number"
                      value={nationwideDiscount.discountValue}
                      onChange={(e) => setNationwideDiscount({ ...nationwideDiscount, discountValue: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Applies To</label>
                    <select
                      value={nationwideDiscount.appliesTo}
                      onChange={(e) => setNationwideDiscount({ ...nationwideDiscount, appliesTo: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="delivery">Delivery</option>
                      <option value="product">Product</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700">
                  <strong>Note:</strong> This will add approximately 400+ delivery zones across Nigeria.
                  You can edit individual city prices later.
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    if (nationwidePrice <= 0) {
                      showError('Please enter a valid delivery price');
                      return;
                    }
                    
                    setAddingNationwide(true);
                    try {
                      const statesResponse = await axios.get(`${API_BASE_URL}/cities/states`);
                      
                      if (!statesResponse.data.success) {
                        throw new Error('Failed to fetch states');
                      }
                      
                      const allStates = statesResponse.data.data;
                      let totalNewZones = 0;
                      let updatedZones = [...deliveryZones];
                      
                      for (const state of allStates) {
                        const citiesResponse = await axios.get(`${API_BASE_URL}/cities/state/${encodeURIComponent(state)}`);
                        
                        if (citiesResponse.data.success) {
                          const citiesInState = citiesResponse.data.data;
                          const existingZones = new Set(
                            updatedZones.filter(z => z.state === state).map(z => z.city)
                          );
                          
                          const newZones = citiesInState
                            .filter(city => !existingZones.has(city))
                            .map(city => ({
                              id: Date.now() + Math.random() + totalNewZones,
                              state: state,
                              city: city,
                              price: nationwidePrice,
                              discountOnQuantity: { ...nationwideDiscount }
                            }));
                          
                          if (newZones.length > 0) {
                            updatedZones = [...updatedZones, ...newZones];
                            totalNewZones += newZones.length;
                          }
                        }
                      }
                      
                      if (totalNewZones === 0) {
                        showError('All cities already have delivery zones configured');
                      } else {
                        setDeliveryZones(updatedZones);
                        onZonesUpdate?.(updatedZones);
                        setTotalZones(updatedZones.length);
                        showSuccess(`Added ${totalNewZones} delivery zones across all states in Nigeria`);
                      }
                      
                      setShowNationwideModal(false);
                      setNationwidePrice(0);
                      setNationwideDiscount({
                        enabled: false,
                        minQuantity: 2,
                        discountType: 'percentage',
                        discountValue: 0,
                        appliesTo: 'delivery'
                      });
                    } catch (error) {
                      console.error('Error adding nationwide delivery:', error);
                      showError('Failed to add nationwide delivery. Please try again.');
                    } finally {
                      setAddingNationwide(false);
                    }
                  }}
                  disabled={nationwidePrice <= 0 || addingNationwide}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  {addingNationwide ? 'Adding Zones...' : 'Add Nationwide Delivery'}
                </button>
                <button
                  onClick={() => setShowNationwideModal(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDeliveryZones;