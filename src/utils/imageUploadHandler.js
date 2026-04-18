/**
 * Image upload handler utilities
 */

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateImageFile = (file) => {
  if (!file) {
    return {
      valid: false,
      error: 'No file selected',
    };
  }

  // Check format
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPG, PNG, and WebP formats are supported',
    };
  }

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return {
    valid: true,
    error: null,
  };
};

export const createFilePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Create FormData object for multipart/form-data requests
 * Handles both simple string/number fields and File objects
 * 
 * @param {Object} data - Form data object
 * @returns {FormData} - Populated FormData instance
 */
export const createFormData = (data) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    // Handle arrays (e.g., allergenIds, ingredientIds)
    if (Array.isArray(value)) {
      value.forEach((item) => {
        formData.append(key, item);
      });
    } else if (value instanceof File) {
      // Handle File objects
      formData.append(key, value);
    } else if (typeof value === 'boolean') {
      // Convert boolean to string for form data
      formData.append(key, value ? 'true' : 'false');
    } else {
      // Handle other types (string, number, etc.)
      formData.append(key, value.toString());
    }
  });

  return formData;
};

/**
 * Create request config for multipart upload
 * Removes Content-Type header to let browser set it with boundary
 * 
 * @param {FormData} formData - FormData object
 * @param {Object} options - Additional fetch options
 * @returns {Object} - Fetch config object
 */
export const createUploadConfig = (formData, options = {}) => {
  return {
    method: options.method || 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type - let browser set it with boundary
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      ...options.headers,
    },
  };
};
