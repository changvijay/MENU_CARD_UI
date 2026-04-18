import { useState, useRef } from 'react';

/**
 * FileUploadField
 * File upload component with preview for images
 * 
 * Props:
 *   - label: string - field label
 *   - name: string - field name
 *   - required: boolean - is required
 *   - value: File | null - current file
 *   - onChange: function(file, errorMessage) - called when file is selected
 *   - accept: string - file types to accept (default: image/*)
 *   - maxSize: number - max file size in bytes (default: 5MB)
 *   - previewUrl: string - existing image URL for preview
 *   - error: string - validation error message
 */
export const FileUploadField = ({
  label,
  name,
  required = false,
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 5 * 1024 * 1024, // 5MB
  previewUrl = null,
  error = null,
}) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(previewUrl);
  const [dragActive, setDragActive] = useState(false);

  const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = maxSize;

  const validateFile = (file) => {
    // Check file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return 'Only JPG, PNG, and WebP formats are supported';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    return null;
  };

  const handleFileChange = (file) => {
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      onChange(null, error);
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    onChange(file, null);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null, null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-indigo-500">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload area */}
      {!preview && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400'
          } ${error ? 'border-red-500 bg-red-50' : ''}`}
        >
          <input
            ref={inputRef}
            type="file"
            name={name}
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <div className="text-3xl mb-2">📁</div>
            <span>Click to upload or drag and drop</span>
          </button>

          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPG, PNG, WebP (Max {MAX_FILE_SIZE / 1024 / 1024}MB)
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
      )}
    </div>
  );
};

export default FileUploadField;
