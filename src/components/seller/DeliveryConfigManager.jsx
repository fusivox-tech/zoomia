// frontend/components/DeliveryConfigManager.jsx

import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import axios from 'axios';
import API_BASE_URL from '../../config';

import {
  Truck,
  Plus,
  X,
  MapPin,
  Globe,
  Layers,
  Edit2,
  Trash2,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Loader,
  Building2
} from 'lucide-react';

const DEFAULT_DISCOUNT = {
  enabled: false,
  minQuantity: 2,
  discountType: 'percentage',
  discountValue: 0,
  appliesTo: 'delivery'
};

const DeliveryConfigManager = ({
  onConfigSelected,
  selectedConfigId
}) => {
  const { showSuccess, showError } = useData();

  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const [editingConfig, setEditingConfig] = useState(null);

  const [expandingZones, setExpandingZones] = useState(false);

  const [expandedZone, setExpandedZone] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    zones: [],
    bulkDiscounts: DEFAULT_DISCOUNT
  });

  // Zone form
  const [zoneType, setZoneType] = useState('single');

  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');

  const [zonePrice, setZonePrice] = useState('');

  const [zoneDiscount, setZoneDiscount] = useState(DEFAULT_DISCOUNT);

  // Dropdown data
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);

  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  useEffect(() => {
    fetchConfigs();
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState);
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedState && selectedCity) {
      fetchNeighborhoods(selectedState, selectedCity);
    } else {
      setNeighborhoods([]);
      setSelectedNeighborhood('');
    }
  }, [selectedState, selectedCity]);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  const fetchConfigs = async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/delivery-configs`,
        {
          headers: authHeaders()
        }
      );

      if (response.data.success) {
        setConfigs(response.data.data || []);
      }
    } catch (error) {
      console.error(error);
      showError('Failed to load delivery configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/cities/states`
      );

      if (response.data.success) {
        setStates(response.data.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCities = async (state) => {
    setLoadingCities(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/cities/state/${encodeURIComponent(state)}`
      );

      if (response.data.success) {
        setCities(response.data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchNeighborhoods = async (state, city) => {
    setLoadingNeighborhoods(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/cities/${encodeURIComponent(
          state
        )}/${encodeURIComponent(city)}/suburbs`
      );

      if (response.data.success) {
        setNeighborhoods(response.data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  const zoneExists = (zone) => {
    return formData.zones.some(
      (z) =>
        z.type === 'neighborhood' &&
        z.state === zone.state &&
        z.city === zone.city &&
        z.neighborhood === zone.neighborhood
    );
  };

  const createZoneObject = ({
    state,
    city,
    neighborhood,
    price
  }) => ({
    id: crypto.randomUUID(),
    type: 'neighborhood',
    state,
    city,
    neighborhood,
    price: Number(price),
    discountOnQuantity: {
      ...zoneDiscount
    }
  });

  const resetZoneFields = () => {
    setZonePrice('');
    setSelectedNeighborhood('');
    setZoneDiscount(DEFAULT_DISCOUNT);
  };

  // SINGLE NEIGHBORHOOD
  const addSingleNeighborhood = () => {
    if (
      !selectedState ||
      !selectedCity ||
      !selectedNeighborhood
    ) {
      showError(
        'Please select state, city and neighborhood'
      );
      return;
    }

    if (!zonePrice || Number(zonePrice) <= 0) {
      showError('Please enter a valid delivery price');
      return;
    }

    const zone = createZoneObject({
      state: selectedState,
      city: selectedCity,
      neighborhood: selectedNeighborhood,
      price: zonePrice
    });

    if (zoneExists(zone)) {
      showError(
        'This neighborhood already exists in this configuration'
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      zones: [...prev.zones, zone]
    }));

    resetZoneFields();

    showSuccess('Neighborhood added successfully');
  };

  // CITY
  const addCityNeighborhoods = async () => {
    if (!selectedState || !selectedCity) {
      showError('Please select state and city');
      return;
    }

    if (!zonePrice || Number(zonePrice) <= 0) {
      showError('Please enter a valid delivery price');
      return;
    }

    setExpandingZones(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/cities/${encodeURIComponent(
          selectedState
        )}/${encodeURIComponent(selectedCity)}/suburbs`
      );

      const suburbs = response.data?.data || [];

      const newZones = suburbs
        .map((suburb) =>
          createZoneObject({
            state: selectedState,
            city: selectedCity,
            neighborhood: suburb,
            price: zonePrice
          })
        )
        .filter((zone) => !zoneExists(zone));

      if (!newZones.length) {
        showError(
          `All neighborhoods in ${selectedCity} already exist`
        );
        return;
      }

      setFormData((prev) => ({
        ...prev,
        zones: [...prev.zones, ...newZones]
      }));

      showSuccess(
        `${newZones.length} neighborhoods added`
      );
    } catch (error) {
      console.error(error);
      showError('Failed to add city neighborhoods');
    } finally {
      setExpandingZones(false);
      resetZoneFields();
    }
  };

  // STATE
  const addStateNeighborhoods = async () => {
    if (!selectedState) {
      showError('Please select a state');
      return;
    }

    if (!zonePrice || Number(zonePrice) <= 0) {
      showError('Please enter a valid delivery price');
      return;
    }

    setExpandingZones(true);

    try {
      const citiesResponse = await axios.get(
        `${API_BASE_URL}/cities/state/${encodeURIComponent(
          selectedState
        )}`
      );

      const stateCities = citiesResponse.data?.data || [];

      let allZones = [];

      for (const city of stateCities) {
        const suburbsResponse = await axios.get(
          `${API_BASE_URL}/cities/${encodeURIComponent(
            selectedState
          )}/${encodeURIComponent(city)}/suburbs`
        );

        const suburbs = suburbsResponse.data?.data || [];

        const cityZones = suburbs.map((suburb) =>
          createZoneObject({
            state: selectedState,
            city,
            neighborhood: suburb,
            price: zonePrice
          })
        );

        allZones.push(...cityZones);
      }

      allZones = allZones.filter(
        (zone) => !zoneExists(zone)
      );

      if (!allZones.length) {
        showError(
          `All neighborhoods in ${selectedState} already exist`
        );
        return;
      }

      setFormData((prev) => ({
        ...prev,
        zones: [...prev.zones, ...allZones]
      }));

      showSuccess(
        `${allZones.length} neighborhoods added`
      );
    } catch (error) {
      console.error(error);
      showError('Failed to add state neighborhoods');
    } finally {
      setExpandingZones(false);
      resetZoneFields();
    }
  };

  // NATIONWIDE
  const addNationwideNeighborhoods = async () => {
    if (!zonePrice || Number(zonePrice) <= 0) {
      showError('Please enter a valid delivery price');
      return;
    }

    setExpandingZones(true);

    try {
      let allZones = [];

      for (const state of states) {
        const citiesResponse = await axios.get(
          `${API_BASE_URL}/cities/state/${encodeURIComponent(
            state
          )}`
        );

        const stateCities = citiesResponse.data?.data || [];

        for (const city of stateCities) {
          const suburbsResponse = await axios.get(
            `${API_BASE_URL}/cities/${encodeURIComponent(
              state
            )}/${encodeURIComponent(city)}/suburbs`
          );

          const suburbs = suburbsResponse.data?.data || [];

          const cityZones = suburbs.map((suburb) =>
            createZoneObject({
              state,
              city,
              neighborhood: suburb,
              price: zonePrice
            })
          );

          allZones.push(...cityZones);
        }
      }

      allZones = allZones.filter(
        (zone) => !zoneExists(zone)
      );

      if (!allZones.length) {
        showError(
          'All neighborhoods already exist in configuration'
        );
        return;
      }

      setFormData((prev) => ({
        ...prev,
        zones: [...prev.zones, ...allZones]
      }));

      showSuccess(
        `${allZones.length} neighborhoods added nationwide`
      );
    } catch (error) {
      console.error(error);
      showError('Failed to add nationwide neighborhoods');
    } finally {
      setExpandingZones(false);
      resetZoneFields();
    }
  };

  const removeZone = (id) => {
    setFormData((prev) => ({
      ...prev,
      zones: prev.zones.filter((z) => z.id !== id)
    }));
  };

  const updateZonePrice = (id, price) => {
    setFormData((prev) => ({
      ...prev,
      zones: prev.zones.map((zone) =>
        zone.id === id
          ? {
              ...zone,
              price: Number(price)
            }
          : zone
      )
    }));
  };

  const saveConfig = async () => {
    if (!formData.name.trim()) {
      showError('Configuration name is required');
      return;
    }

    setSavingConfig(true);

    try {
      let response;

      if (editingConfig) {
        response = await axios.put(
          `${API_BASE_URL}/delivery-configs/${editingConfig._id}`,
          formData,
          {
            headers: authHeaders()
          }
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/delivery-configs`,
          formData,
          {
            headers: authHeaders()
          }
        );
      }

      if (response.data.success) {
        showSuccess(
          editingConfig
            ? 'Configuration updated'
            : 'Configuration created'
        );

        fetchConfigs();

        setShowModal(false);

        resetForm();
      }
    } catch (error) {
      console.error(error);

      showError(
        error.response?.data?.message ||
          'Failed to save configuration'
      );
    } finally {
      setSavingConfig(false);
    }
  };

  const setAsDefault = async (configId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/delivery-configs/${configId}/set-default`,
        {},
        {
          headers: authHeaders()
        }
      );

      if (response.data.success) {
        fetchConfigs();
        showSuccess('Default configuration updated');
      }
    } catch (error) {
      console.error(error);
      showError('Failed to set default config');
    }
  };

  const deleteConfig = async (configId) => {
    const confirmed = window.confirm(
      'Delete this configuration?'
    );

    if (!confirmed) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/delivery-configs/${configId}`,
        {
          headers: authHeaders()
        }
      );

      if (response.data.success) {
        fetchConfigs();
        showSuccess('Configuration deleted');
      }
    } catch (error) {
      console.error(error);
      showError('Failed to delete configuration');
    }
  };

  const editConfig = (config) => {
    setEditingConfig(config);

    setFormData({
      name: config.name || '',
      description: config.description || '',
      isDefault: config.isDefault || false,
      zones: (config.zones || []).map((zone) => ({
        ...zone,
        id: crypto.randomUUID()
      })),
      bulkDiscounts:
        config.bulkDiscounts || DEFAULT_DISCOUNT
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
      bulkDiscounts: DEFAULT_DISCOUNT
    });

    setZoneType('single');

    setSelectedState('');
    setSelectedCity('');
    setSelectedNeighborhood('');

    setZonePrice('');

    setZoneDiscount(DEFAULT_DISCOUNT);
  };

  const zonesByState = useMemo(() => {
    return formData.zones.reduce((acc, zone) => {
      if (!acc[zone.state]) {
        acc[zone.state] = {};
      }

      if (!acc[zone.state][zone.city]) {
        acc[zone.state][zone.city] = [];
      }

      acc[zone.state][zone.city].push(zone);

      return acc;
    }, {});
  }, [formData.zones]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Delivery Configuration
        </h3>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Plus className="w-4 h-4" />
          New Config
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-orange-500" />
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center">
          <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />

          <p className="text-gray-500">
            No delivery configurations yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config._id}
              onClick={() =>
                onConfigSelected?.(config._id, config)
              }
              className={`border rounded-xl p-4 cursor-pointer transition ${
                selectedConfigId === config._id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      {config.name}
                    </h4>

                    {config.isDefault && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Default
                      </span>
                    )}

                    {selectedConfigId === config._id && (
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Selected
                      </span>
                    )}
                  </div>

                  {config.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {config.description}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {config.zones?.length || 0} zones
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      editConfig(config);
                    }}
                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-500"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {!config.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsDefault(config._id);
                      }}
                      className="p-2 hover:bg-green-50 rounded-lg text-green-500"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConfig(config._id);
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-500"
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
                  placeholder="e.g. Lightweight Products, Heavy Machines etc."
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