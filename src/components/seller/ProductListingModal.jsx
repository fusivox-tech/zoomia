import DeliveryConfigManager from './DeliveryConfigManager';
import { useState } from 'react';

const ProductListingModal = ({ 
  show, 
  editingProduct, 
  formData, 
  loading, 
  selectedCategory, 
  customCategory, 
  categories, 
  imagePreviews, 
  newTag,
  variantForm,
  showVariantModal,
  onClose, 
  onSubmit, 
  onInputChange, 
  onImageUpload, 
  onRemoveImage, 
  onAddTag, 
  onRemoveTag, 
  onSetNewTag,
  onSetSelectedCategory,
  onSetCustomCategory,
  onSetShowVariantModal,
  onSetVariantForm,
  onAddVariant,
  onRemoveVariant,
  onSetEditingProduct,
  editingProductId,
  currentZones,
  selectedCategories,
  setSelectedCategories,
  showCategoryDropdown,
  setShowCategoryDropdown,
  selectedDeliveryConfigId,
  onDeliveryConfigSelect,
}) => {
  const [selectedConfig, setSelectedConfig] = useState(null);
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingProduct ? 'Edit Product' : 'Create New Listing'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter product title"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={onInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Describe your product in detail..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (NGN) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={onInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={onInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Categories - Multi-Select with Checkboxes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories <span className="text-red-500">*</span>
              </label>
              
              {/* Category Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-left flex justify-between items-center bg-white"
                >
                  <span className={selectedCategories.length === 0 ? "text-gray-400" : "text-gray-700"}>
                    {selectedCategories.length === 0 
                      ? "Select categories..." 
                      : `${selectedCategories.length} category${selectedCategories.length !== 1 ? 'ies' : ''} selected`}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Category Dropdown Options */}
                {showCategoryDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-0" 
                      onClick={() => setShowCategoryDropdown(false)}
                    />
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* Select All Option */}
                      <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <label className="flex items-center p-2 hover:bg-orange-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.length === categories.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allCategories = [...categories];
                                setSelectedCategories(allCategories);
                                onInputChange({ target: { name: 'categories', value: allCategories } });
                              } else {
                                setSelectedCategories([]);
                                onInputChange({ target: { name: 'categories', value: [] } });
                              }
                            }}
                            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">Select All Categories</span>
                        </label>
                      </div>
                      
                      {/* Individual Category Options */}
                      <div className="p-2">
                        {categories.map(cat => (
                          <label key={cat} className="flex items-center p-2 hover:bg-orange-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat)}
                              onChange={(e) => {
                                let updatedCategories;
                                if (e.target.checked) {
                                  updatedCategories = [...selectedCategories, cat];
                                } else {
                                  updatedCategories = selectedCategories.filter(c => c !== cat);
                                }
                                setSelectedCategories(updatedCategories);
                                onInputChange({ target: { name: 'categories', value: updatedCategories } });
                              }}
                              className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Selected Categories Tags */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCategories.map((cat, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      {cat}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedCategories = selectedCategories.filter((_, i) => i !== index);
                          setSelectedCategories(updatedCategories);
                          onInputChange({ target: { name: 'categories', value: updatedCategories } });
                        }}
                        className="ml-2 text-orange-500 hover:text-orange-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Select one or more categories for your product</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={onInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={onInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Brand name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit)</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={onInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Unique product code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={onInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (L × W × H)</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  name="dimensions.length"
                  value={formData.dimensions.length}
                  onChange={onInputChange}
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="L"
                />
                <input
                  type="text"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={onInputChange}
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="W"
                />
                <input
                  type="text"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={onInputChange}
                  className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="H"
                />
              </div>
            </div>

            {editingProduct && formData.images.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Images</label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt={`Product ${index}`} className="w-full h-20 object-cover rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingProduct ? 'Add New Images' : 'Product Images'} <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 5MB each (Max 10 images)</p>
              
              {/* Show warning if no images */}
              {!editingProduct && formData.images.length === 0 && imagePreviews.length === 0 && (
                <p className="text-xs text-red-500 mt-1">⚠️ Please upload at least one product image</p>
              )}
              
              {imagePreviews.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => onRemoveImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show existing images for edit mode */}
              {editingProduct && formData.images.length > 0 && imagePreviews.length === 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Current images:</p>
                  <div className="flex gap-2 flex-wrap">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative">
                        <img src={img} alt={`Product ${index}`} className="w-16 h-16 object-cover rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex flex-col md:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => onSetNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Add tags (e.g., wireless, bluetooth)"
                />
                <button
                  type="button"
                  onClick={onAddTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => onRemoveTag(tag)}
                      className="ml-2 text-orange-500 hover:text-orange-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
  {/* Delivery Configuration Section */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Delivery Configuration <span className="text-red-500">*</span>
    </label>
    
    <DeliveryConfigManager 
      onConfigSelected={(configId, config) => {
        setSelectedConfig(config);
        onDeliveryConfigSelect?.(configId);
      }}
      selectedConfigId={selectedDeliveryConfigId}
    />
    
    {selectedConfig && (
      <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <p className="text-xs text-green-700">
          <strong>Selected:</strong> {selectedConfig.name}
          {selectedConfig.zones && (
            <span className="ml-2">({selectedConfig.zones.length} zones configured)</span>
          )}
        </p>
      </div>
    )}
  </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Variants (Size, Color, etc.)</h3>
                <button
                  type="button"
                  onClick={() => onSetShowVariantModal(true)}
                  className="text-orange-500 hover:text-orange-600 text-sm"
                >
                  + Add Variant
                </button>
              </div>
              
              {formData.variants.length > 0 && (
                <div className="space-y-2">
                  {formData.variants.map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{variant.name}</p>
                        <p className="text-xs text-gray-600">Price: ₦{variant.price} | Stock: {variant.stock || 'Unlimited'}</p>
                        {variant.sku && <p className="text-xs text-gray-500">SKU: {variant.sku}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveVariant(variant.id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Listing')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductListingModal;