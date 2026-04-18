import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Search,
  X,
  Plus,
  Upload,
  Image as ImageIcon 
} from 'lucide-react';

/**
 * Smart Text Field with validation states and micro-interactions
 */
export const SmartTextField = forwardRef(({ 
  label,
  error,
  touched,
  showCharacterCount,
  maxLength,
  required,
  className = '',
  ...props 
}, ref) => {
  const [focused, setFocused] = useState(false);
  const hasError = error && touched;
  const isValid = touched && !error && props.value;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label className="block">
        <span className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>

      {/* Input Container */}
      <div className="relative">
        <input
          {...props}
          ref={ref}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={maxLength}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
            ${focused ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-gray-300'}
            ${hasError ? 'border-red-500 ring-4 ring-red-500/10' : ''}
            ${isValid ? 'border-green-500' : ''}
            disabled:bg-gray-50 disabled:text-gray-500
            placeholder:text-gray-400
          `}
        />

        {/* Status Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <AnimatePresence mode="wait">
            {hasError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
              </motion.div>
            )}
            {isValid && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        {/* Error Message */}
        <AnimatePresence mode="wait">
          {hasError ? (
            <motion.span
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.span>
          ) : (
            <span className="text-gray-500">
              {/* Helper text can go here */}
            </span>
          )}
        </AnimatePresence>

        {/* Character Count */}
        {showCharacterCount && maxLength && (
          <span className={`text-xs ${
            props.value?.length > maxLength * 0.9 ? 'text-amber-600' : 'text-gray-400'
          }`}>
            {props.value?.length || 0}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

/**
 * Smart Multi-Select with search and tags
 */
export const SmartMultiSelect = forwardRef(({ 
  label,
  options = [],
  value = [],
  onChange,
  placeholder = "Select options...",
  description,
  required,
  className = ''
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option => 
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(option => value.includes(option.id));
  const unselectedOptions = filteredOptions.filter(option => !value.includes(option.id));

  const handleToggle = (optionId) => {
    const newValue = value.includes(optionId)
      ? value.filter(id => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label className="block">
        <span className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {description && (
          <span className="block text-xs text-gray-500 mt-1">{description}</span>
        )}
      </label>

      {/* Selected Tags */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map(option => (
            <motion.span
              key={option.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
            >
              {option.name}
              <button
                type="button"
                onClick={() => handleToggle(option.id)}
                className="ml-1 hover:text-indigo-600"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div className="relative">
        <button
          ref={ref}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-left bg-white hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className={selectedOptions.length > 0 ? 'text-gray-900' : 'text-gray-400'}>
              {selectedOptions.length > 0 
                ? `${selectedOptions.length} selected`
                : placeholder
              }
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              className="w-5 h-5"
            >
              ▼
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown Menu */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-64 overflow-hidden"
              >
                {/* Search */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search options..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="max-h-48 overflow-y-auto">
                  {unselectedOptions.length > 0 ? (
                    unselectedOptions.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleToggle(option.id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <Plus className="w-4 h-4 text-gray-400" />
                        <span>{option.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      No options found
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

/**
 * Smart File Upload with drag & drop and preview
 */
export const SmartFileUpload = forwardRef(({ 
  label,
  value,
  onChange,
  accept = 'image/*',
  previewUrl,
  required,
  description,
  maxSize = 5 * 1024 * 1024, // 5MB
  className = ''
}, ref) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(previewUrl);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    return null;
  };

  const handleFile = (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    onChange(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label className="block">
        <span className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {description && (
          <span className="block text-xs text-gray-500 mt-1">{description}</span>
        )}
      </label>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        className={`
          relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input
          ref={ref}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {preview ? (
          // Image Preview
          <div className="relative p-4">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreview('');
                onChange(null);
              }}
              className="absolute top-6 right-6 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Upload Placeholder
          <div className="p-8 text-center">
            <motion.div
              animate={{
                scale: dragActive ? 1.1 : 1,
                rotate: dragActive ? 5 : 0
              }}
              className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
            >
              {dragActive ? (
                <Upload className="w-8 h-8 text-indigo-600" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </motion.div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {dragActive ? 'Drop your file here' : 'Upload a file'}
            </h3>
            
            <p className="text-gray-500 text-sm">
              Drag and drop or click to browse
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-600 text-sm flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});