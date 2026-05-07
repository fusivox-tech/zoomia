import { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { 
  Truck, Plus, X, MapPin, Globe, Layers, Edit2, Trash2, 
  Star, Copy, Check, AlertCircle, ChevronDown, ChevronUp,
  Tag, Percent, DollarSign, Loader, Building2
} from 'lucide-react';

const DeliveryConfigManager = ({ onConfigSelected, selectedConfigId }) => {
  const { showSuccess, showError } = useData();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [expandingZones, setExpandingZones] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    zones: [],
    bulkDiscounts: {
      enabled: false,
      minQuantity: 2,
      discountType: 'percentage',
      discountValue: 0,
      appliesTo: 'delivery'
    }
  });
  
  // Form states for adding zones
  const [zoneType, setZoneType] = useState('single');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [zonePrice, setZonePrice] = useState('');
  const [zoneDiscount, setZoneDiscount] = useState({
    enabled: false,
    minQuantity: 2,
    discountType: 'percentage',
    discountValue: 0,
    appliesTo: 'delivery'
  });
  
  // Data for dropdowns
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  
  const [expandedZone, setExpandedZone] = useState(null);

  useEffect(() => {
    fetchConfigs();
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedState && selectedCity) {
      fetchNeighborhoods(selectedState, selectedCity);
    }
  }, [selectedCity]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/delivery-configs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setConfigs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching delivery configs:', error);
      showError('Failed to load delivery configurations');
    } finally {
      setLoading(false);
    }
  };

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
    setLoadingCities(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/state/${encodeURIComponent(state)}`);
      if (response.data.success) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchNeighborhoods = async (state, city) => {
    setLoadingNeighborhoods(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/${encodeURIComponent(state)}/${encodeURIComponent(city)}/suburbs`);
      if (response.data.success) {
        setNeighborhoods(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  // Add a single neighborhood zone
  const addSingleNeighborhood = () => {
    if (!selectedState || !selectedCity || !selectedNeighborhood) {
      showError('Please select state, city, and neighborhood');
      return;
    }
    if (!zonePrice || zonePrice <= 0) {
      showError('Please enter a valid delivery price');
      return;
    }

    const newZone = {
      id: Date.now(),
      type: 'neighborhood',
      state: selectedState,
      city: selectedCity,
      neighborhood: selectedNeighborhood,
      price: parseFloat(zonePrice),
      discountOnQuantity: { ...zoneDiscount }
    };

    // Check for duplicate
    const isDuplicate = formData.zones.some(zone => 
      zone.type === 'neighborhood' &&
      zone.state === newZone.state &&
      zone.city === newZone.city &&
      zone.neighborhood === newZone.neighborhood
    );

    if (isDuplicate) {
      showError('This neighborhood already exists in this configuration');
      return;
    }

    setFormData(prev => ({
      ...prev,
      zones: [...prev.zones, newZone]
    }));

    // Reset form
    setZonePrice('');
    setSelectedNeighborhood('');
    setZoneDiscount({
      enabled: false,
      minQuantity: 2,
      discountType: 'percentage',
      discountValue: 0,
      appliesTo: 'delivery'
    });
    
    showSuccess('Neighborhood added successfully');
  };

  // Add all neighborhoods in a city
  const addCityNeighborhoods = async () => {
    if (!selectedState || !selectedCity) {
      showError('Please select state and city');
      return;
    }
    if (!zonePrice || zonePrice <= 0) {
      showError('Please enter a valid delivery price');
      return;
    }

    setExpandingZones(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/cities/${encodeURIComponent(selectedState)}/${encodeURIComponent(selectedCity)}/suburbs`);
      
      if (response.data.success && response.data.data.length > 0) {
        const neighborhoodsInCity = response.data.data;
        const existingNeighborhoods = new Set(
          formData.zones
            .filter(z => z.type === 'neighborhood' && z.state === selectedState && z.city === selectedCity)
            .map(z => z.neighborhood)
        );
        
        const newZones = [];
        for (const neighborhood of neighborhoodsInCity) {
          if (!existingNeighborhoods.has(neighborhood)) {
            newZones.push({
              id: Date.now() + Math.random(),
              type: 'neighborhood',
              state: selectedState,
              city: selectedCity,
              neighborhood: neighborhood,
              price: parseFloat(zonePrice),
              discountOnQuantity: { ...zoneDiscount }
            });
          }
        }
        
        if (newZones.length === 0) {
          showError(`All neighborhoods in ${selectedCity} already have delivery zones`);
        } else {
          setFormData(prev => ({
            ...prev,
            zones: [...prev.zones, ...newZones]
          }));
          showSuccess(`Added ${newZones.length} neighborhoods in ${selectedCity}, ${selectedState}`);
        }
      } else {
        showError(`No neighborhoods found for ${selectedCity}, ${selectedState}`);
      }
    } catch (error) {
      console.error('Error adding city neighborhoods:', error);
      showError('Failed to add city neighborhoods');
    } finally {
      setExpandingZones(false);
      setSelectedCity('');
      setZonePrice('');
    }
  };

  // Add all neighborhoods in a state
  const addStateNeighborhoods = async () => {
    if (!selectedState) {
      showError('Please select a state');
      return;
    }
    if (!zonePrice || zonePrice <= 0) {
      showError('Please enter a valid delivery price');
      return;
    }

    setExpandingZones(true);
    try {
      // Fetch all cities in the state first
      const citiesResponse = await axios.get(`${API_BASE_URL}/cities/state/${encodeURIComponent(selectedState)}`);
      
      if (!citiesResponse.data.success || citiesResponse.data.data.length === 0) {
        showError(`No cities found for ${selectedState}`);
        setExpandingZones(false);
        return;
      }
      
      const citiesInState = citiesResponse.data.data;
      let totalNewZones = 0;
      let updatedZones = [...formData.zones];
      
      for (const city of citiesInState) {
        const neighborhoodsResponse = await axios.get(`${API_BASE_URL}/cities/${encodeURIComponent(selectedState)}/${encodeURIComponent(city)}/suburbs`);
        
        if (neighborhoodsResponse.data.success && neighborhoodsResponse.data.data.length > 0) {
          const existingNeighborhoods = new Set(
            updatedZones
              .filter(z => z.type === 'neighborhood' && z.state === selectedState && z.city === city)
              .map(z => z.neighborhood)
          );
          
          const newZones = neighborhoodsResponse.data.data
            .filter(neighborhood => !existingNeighborhoods.has(neighborhood))
            .map(neighborhood => ({
              id: Date.now() + Math.random(),
              type: 'neighborhood',
              state: selectedState,
              city: city,
              neighborhood: neighborhood,
              price: parseFloat(zonePrice),
              discountOnQuantity: { ...zoneDiscount }
            }));
          
          if (newZones.length > 0) {
            updatedZones = [...updatedZones, ...newZones];
            totalNewZones += newZones.length;
          }
        }
      }
      
      if (totalNewZones === 0) {
        showError(`All neighborhoods in ${selectedState} already have delivery zones`);
      } else {
        setFormData(prev => ({
          ...prev,
          zones: updatedZones
        }));
        showSuccess(`Added ${totalNewZones} neighborhoods across ${selectedState}`);
      }
    } catch (error) {
      console.error('Error adding state neighborhoods:', error);
      showError('Failed to add state neighborhoods');
    } finally {
      setExpandingZones(false);
      setSelectedState('');
      setZonePrice('');
    }
  };

  // Add all neighborhoods in Nigeria (nationwide)
  const addNationwideNeighborhoods = async () => {
    if (!zonePrice || zonePrice <= 0) {
      showError('Please enter a valid delivery price');
      return;
    }

    setExpandingZones(true);
    try {
      let totalNewZones = 0;
      let updatedZones = [...formData.zones];
      
      for (const state of states) {
        const citiesResponse = await axios.get(`${API_BASE_URL}/cities/state/${encodeURIComponent(state)}`);
        
        if (citiesResponse.data.success && citiesResponse.data.data.length > 0) {
          for (const city of citiesResponse.data.data) {
            const neighborhoodsResponse = await axios.get(`${API_BASE_URL}/cities/${encodeURIComponent(state)}/${encodeURIComponent(city)}/suburbs`);
            
            if (neighborhoodsResponse.data.success && neighborhoodsResponse.data.data.length > 0) {
              const existingNeighborhoods = new Set(
                updatedZones
                  .filter(z => z.type === 'neighborhood' && z.state === state && z.city === city)
                  .map(z => z.neighborhood)
              );
              
              const newZones = neighborhoodsResponse.data.data
                .filter(neighborhood => !existingNeighborhoods.has(neighborhood))
                .map(neighborhood => ({
                  id: Date.now() + Math.random(),
                  type: 'neighborhood',
                  state: state,
                  city: city,
                  neighborhood: neighborhood,
                  price: parseFloat(zonePrice),
                  discountOnQuantity: { ...zoneDiscount }
                }));
              
              if (newZones.length > 0) {
                updatedZones = [...updatedZones, ...newZones];
                totalNewZones += newZones.length;
              }
            }
          }
        }
      }
      
      if (totalNewZones === 0) {
        showError('All neighborhoods already have delivery zones configured');
      } else {
        setFormData(prev => ({
          ...prev,
          zones: updatedZones
        }));
        showSuccess(`Added ${totalNewZones} neighborhoods across Nigeria`);
      }
    } catch (error) {
      console.error('Error adding nationwide neighborhoods:', error);
      showError('Failed to add nationwide delivery');
    } finally {
      setExpandingZones(false);
      setZonePrice('');
    }
  };

  const removeZone = (zoneId) => {
    setFormData(prev => ({
      ...prev,
      zones: prev.zones.filter(zone => zone.id !== zoneId)
    }));
  };

  const updateZonePrice = (zoneId, price) => {
    setFormData(prev => ({
      ...prev,
      zones: prev.zones.map(zone =>
        zone.id === zoneId ? { ...zone, price: parseFloat(price) } : zone
      )
    }));
  };

  const updateZoneDiscount = (zoneId, discountData) => {
    setFormData(prev => ({
      ...prev,
      zones: prev.zones.map(zone =>
        zone.id === zoneId ? { ...zone, discountOnQuantity: discountData } : zone
      )
    }));
  };

  const saveConfig = async () => {
    if (!formData.name.trim()) {
      showError('Please enter a configuration name');
      return;
    }
    if (formData.zones.length === 0) {
      showError('Please add at least one delivery zone');
      return;
    }
    
    setSavingConfig(true);

    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (editingConfig) {
        response = await axios.put(
          `${API_BASE_URL}/delivery-configs/${editingConfig._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/delivery-configs`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      if (response.data.success) {
        showSuccess(editingConfig ? 'Configuration updated!' : 'Configuration created!');
        setShowModal(false);
        resetForm();
        fetchConfigs();
      }
    } catch (error) {
      console.error('Error saving config:', error);
      showError(error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const setAsDefault = async (configId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/delivery-configs/${configId}/set-default`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        showSuccess('Default configuration updated');
        fetchConfigs();
      }
    } catch (error) {
      console.error('Error setting default:', error);
      showError('Failed to set as default');
    }
  };

  const deleteConfig = async (configId) => {
    if (!window.confirm('Are you sure you want to delete this configuration? This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/delivery-configs/${configId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        showSuccess('Configuration deleted');
        fetchConfigs();
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      showError('Failed to delete configuration');
    }
  };

  const editConfig = (config) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      description: config.description || '',
      isDefault: config.isDefault || false,
      zones: config.zones.map((zone, index) => ({ ...zone, id: Date.now() + index })),
      bulkDiscounts: config.bulkDiscounts || {
        enabled: false,
        minQuantity: 2,
        discountType: 'percentage',
        discountValue: 0,
        appliesTo: 'delivery'
      }
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      description: '',
      isDefault: false,
      zones: [],
      bulkDiscounts: {
        enabled: false,
        minQuantity: 2,
        discountType: 'percentage',
        discountValue: 0,
        appliesTo: 'delivery'
      }
    });
    setZoneType('single');
    setSelectedState('');
    setSelectedCity('');
    setSelectedNeighborhood('');
    setZonePrice('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  // Group zones by state and city for better display
  const zonesByState = formData.zones.reduce((acc, zone) => {
    if (!acc[zone.state]) {
      acc[zone.state] = {};
    }
    if (!acc[zone.state][zone.city]) {
      acc[zone.state][zone.city] = [];
    }
    acc[zone.state][zone.city].push(zone);
    return acc;
  }, {});

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Delivery Configuration</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          New Config
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="text-sm text-gray-500 mt-2">Loading configurations...</p>
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No delivery configurations yet</p>
          <p className="text-xs text-gray-400 mt-1">Create a configuration to set delivery prices for neighborhoods</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config._id}
              className={`border rounded-lg p-3 cursor-pointer transition ${
                selectedConfigId === config._id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => onConfigSelected?.(config._id, config)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{config.name}</h4>
                    {config.isDefault && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Default
                      </span>
                    )}
                    {selectedConfigId === config._id && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Selected
                      </span>
                    )}
                  </div>
                  {config.description && (
                    <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {config.zones.length} neighborhood(s) configured
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      editConfig(config);
                    }}
                    className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!config.isDefault && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsDefault(config._id);
                      }}
                      className="p-1 text-green-500 hover:bg-green-50 rounded"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConfig(config._id);
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingConfig ? 'Edit Delivery Configuration' : 'Create Delivery Configuration'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Configuration Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Standard Delivery, Express Delivery"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe this delivery configuration..."
                />
              </div>

              {/* Bulk Discount Settings */}
              <div className="border-t border-gray-200 pt-4">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.bulkDiscounts.enabled}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bulkDiscounts: { ...prev.bulkDiscounts, enabled: e.target.checked }
                    }))}
                  />
                  <span className="text-sm font-medium">Enable bulk order discounts for this configuration</span>
                </label>

                {formData.bulkDiscounts.enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-6">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Min Quantity</label>
                      <input
                        type="number"
                        value={formData.bulkDiscounts.minQuantity}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bulkDiscounts: { ...prev.bulkDiscounts, minQuantity: parseInt(e.target.value) }
                        }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        min="2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
                      <select
                        value={formData.bulkDiscounts.discountType}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bulkDiscounts: { ...prev.bulkDiscounts, discountType: e.target.value }
                        }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₦)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Discount Value</label>
                      <input
                        type="number"
                        value={formData.bulkDiscounts.discountValue}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bulkDiscounts: { ...prev.bulkDiscounts, discountValue: parseFloat(e.target.value) }
                        }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Applies To</label>
                      <select
                        value={formData.bulkDiscounts.appliesTo}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bulkDiscounts: { ...prev.bulkDiscounts, appliesTo: e.target.value }
                        }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="delivery">Delivery Only</option>
                        <option value="product">Product Only</option>
                        <option value="both">Both Delivery & Product</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Neighborhood Zones Section */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Add Neighborhoods</h4>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setZoneType('single')}
                    className={`px-3 py-1 text-sm rounded-lg transition ${
                      zoneType === 'single'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Add Single Neighborhood
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoneType('city')}
                    className={`px-3 py-1 text-sm rounded-lg transition ${
                      zoneType === 'city'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Add A Whole City
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoneType('state')}
                    className={`px-3 py-1 text-sm rounded-lg transition ${
                      zoneType === 'state'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Add A Whole State
                  </button>
                </div>

                {/* Single Neighborhood Selection */}
                {zoneType === 'single' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                          disabled={!selectedState || loadingCities}
                        >
                          <option value="">{loadingCities ? 'Loading...' : 'Select City'}</option>
                          {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Neighborhood</label>
                        <select
                          value={selectedNeighborhood}
                          onChange={(e) => setSelectedNeighborhood(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          disabled={!selectedCity || loadingNeighborhoods}
                        >
                          <option value="">{loadingNeighborhoods ? 'Loading...' : 'Select Neighborhood'}</option>
                          {neighborhoods.map(neighborhood => (
                            <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Delivery Price (₦) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          value={zonePrice}
                          onChange={(e) => setZonePrice(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="e.g., 1500"
                          min="0"
                          step="50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={zoneDiscount.enabled}
                          onChange={(e) => setZoneDiscount(prev => ({ ...prev, enabled: e.target.checked }))}
                        />
                        Enable bulk discount for this neighborhood
                      </label>
                    </div>

                    {zoneDiscount.enabled && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-6">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Min Quantity</label>
                          <input
                            type="number"
                            value={zoneDiscount.minQuantity}
                            onChange={(e) => setZoneDiscount(prev => ({ ...prev, minQuantity: parseInt(e.target.value) }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            min="2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
                          <select
                            value={zoneDiscount.discountType}
                            onChange={(e) => setZoneDiscount(prev => ({ ...prev, discountType: e.target.value }))}
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
                            value={zoneDiscount.discountValue}
                            onChange={(e) => setZoneDiscount(prev => ({ ...prev, discountValue: parseFloat(e.target.value) }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Applies To</label>
                          <select
                            value={zoneDiscount.appliesTo}
                            onChange={(e) => setZoneDiscount(prev => ({ ...prev, appliesTo: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="delivery">Delivery</option>
                            <option value="product">Product</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={addSingleNeighborhood}
                      disabled={!selectedState || !selectedCity || !selectedNeighborhood || !zonePrice}
                      className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Add Neighborhood
                    </button>
                  </div>
                )}

                {/* City Bulk Selection - Add all neighborhoods in a city */}
                {zoneType === 'city' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          disabled={!selectedState || loadingCities}
                        >
                          <option value="">{loadingCities ? 'Loading...' : 'Select City'}</option>
                          {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Delivery Price (₦) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={zonePrice}
                        onChange={(e) => setZonePrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., 1500"
                        min="0"
                        step="50"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        This price will apply to ALL neighborhoods in {selectedCity || 'selected city'}
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>Note:</strong> This will add delivery zones for every neighborhood in <strong>{selectedCity || 'the selected city'}</strong>.
                        Existing neighborhoods will be skipped.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addCityNeighborhoods}
                      disabled={!selectedState || !selectedCity || !zonePrice || expandingZones}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {expandingZones ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Adding Neighborhoods...
                        </>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4" />
                          Add All Neighborhoods in {selectedCity || 'City'}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* State Bulk Selection */}
                {zoneType === 'state' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Select State</label>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Choose a state</option>
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        This will add delivery zones for ALL neighborhoods in this state
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Delivery Price (₦) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={zonePrice}
                        onChange={(e) => setZonePrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., 1500"
                        min="0"
                        step="50"
                      />
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        <strong>Note:</strong> This will add delivery zones for every neighborhood in the selected state.
                        Existing neighborhoods will be skipped.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addStateNeighborhoods}
                      disabled={!selectedState || !zonePrice || expandingZones}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {expandingZones ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Adding Neighborhoods...
                        </>
                      ) : (
                        <>
                          <Layers className="w-4 h-4" />
                          Add All Neighborhoods in {selectedState || 'State'}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Nationwide Bulk Selection */}
                {zoneType === 'nationwide' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nationwide Delivery Price (₦) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={zonePrice}
                        onChange={(e) => setZonePrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., 2000"
                        min="0"
                        step="50"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        This price will apply to ALL neighborhoods across Nigeria
                      </p>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        <strong>Note:</strong> This will add delivery zones for EVERY neighborhood in ALL 37 states of Nigeria.
                        Existing neighborhoods will be skipped. This may take a few moments.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addNationwideNeighborhoods}
                      disabled={!zonePrice || expandingZones}
                      className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {expandingZones ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Adding Neighborhoods Nationwide...
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          Add All Neighborhoods in Nigeria
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Existing Zones List - Grouped by State and City */}
              {formData.zones.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Configured Neighborhoods ({formData.zones.length})</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {Object.entries(zonesByState).map(([state, cities]) => (
                      <div key={state} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2">
                          <span className="font-semibold text-sm">{state}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {Object.entries(cities).map(([city, zones]) => (
                            <div key={city} className="pl-4">
                              <div className="bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                                {city}
                              </div>
                              {zones.map((zone) => (
                                <div key={zone.id} className="p-2 hover:bg-gray-50 pl-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-3 h-3 text-purple-500" />
                                      <span className="text-sm font-medium">{zone.neighborhood}</span>
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
                                        type="button"
                                        onClick={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
                                        className="p-0.5 hover:bg-gray-100 rounded"
                                      >
                                        {expandedZone === zone.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeZone(zone.id)}
                                        className="text-red-500 hover:text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {expandedZone === zone.id && zone.discountOnQuantity?.enabled && (
                                    <div className="mt-2 pl-4 pt-2 border-t border-gray-100 text-xs text-gray-500">
                                      <p>Bulk discount: {zone.discountOnQuantity.discountValue}{zone.discountOnQuantity.discountType === 'percentage' ? '%' : '₦'} off on {zone.discountOnQuantity.appliesTo}</p>
                                      <p>Minimum quantity: {zone.discountOnQuantity.minQuantity}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={saveConfig}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={savingConfig}
                >
                  {savingConfig ? 'saving...' : editingConfig ? 'Update Configuration' : 'Create Configuration'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

export default DeliveryConfigManager;