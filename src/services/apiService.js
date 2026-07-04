// API configuration and service functions
const API_BASE_URL = 'https://menu-card-api-yvzycdnaqq-el.a.run.app/api';
// const API_BASE_URL = 'http://localhost:8080/api';
// API endpoints
export const API_ENDPOINTS = {
  FOOD_ITEMS: `${API_BASE_URL}/menu/food_items`,
  CATEGORIES: `${API_BASE_URL}/menu/categories`,
  ORDERS: `${API_BASE_URL}/order`,
  WEBSOCKET: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//menu-card-api-yvzycdnaqq-el.a.run.app/api/websocket/orders`,
  // Operations endpoints
  CASH_FLOW_CATEGORIES: `${API_BASE_URL}/operations/cash-flow-categories`,
  CASH_FLOW: `${API_BASE_URL}/operations/cash-flow`,
  CAFE_TABLES: `${API_BASE_URL}/operations/cafe-tables`,
  INVENTORY: `${API_BASE_URL}/operations/inventory`,
  INVENTORY_TRANSACTIONS: `${API_BASE_URL}/operations/inventory/transactions`,
  // Auth endpoints
  USERS: `${API_BASE_URL}/auth/getusers`,
  UPDATE_ROLE: `${API_BASE_URL}/auth/UpdateRole`,
  // Business analytics
  BUSINESS_DASHBOARD: `${API_BASE_URL}/operations/business-dashboard`,
  // Add more endpoints here as needed
};

// Store logout callback to avoid circular dependencies
let authLogoutCallback = null;

// Set the logout callback from AuthContext
export const setAuthLogoutCallback = (logoutFn) => {
  authLogoutCallback = logoutFn;
};

// Generic API call function with authentication
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const config = {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  // Handle authentication errors - token expired or invalid
  if (response.status === 401 || response.status === 403) {
    console.log('Authentication failed - token may be expired');
    
    // Clear local storage immediately
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Call logout callback if available
    if (authLogoutCallback) {
      authLogoutCallback();
    }
    
    const errorText = await response.text();
    throw new Error(`Authentication failed: ${errorText || 'Please log in again.'}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  
  // Handle API response format: { success: boolean, message: string, data: any }
  if (data.success === false) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
};

// Food Items API functions
export const foodItemsApi = {
  // Get all food items
  getAll: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.FOOD_ITEMS, {
        method: 'GET',
      });
      
      // Return the data array from the API response
      return response.data || [];
    } catch (error) {
      console.error('Error fetching food items:', error);
      throw error;
    }
  },

  // Get food item by ID (if needed in future)
  getById: async (id) => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.FOOD_ITEMS}/${id}`, {
        method: 'GET',
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching food item ${id}:`, error);
      throw error;
    }
  },
};

// Categories API functions
export const categoriesApi = {
  // Get all categories
  getAll: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.CATEGORIES, {
        method: 'GET',
      });
      
      // Return the data array from the API response
      return response.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get category by ID (if needed in future)
  getById: async (id) => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CATEGORIES}/${id}`, {
        method: 'GET',
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  },
};

// Transform nested order response { order, user, items } into a flat structure
const transformOrderResponse = (entry) => {
  if (!entry.order) return entry; // already flat, return as-is
  return {
    ...entry.order,
    user: entry.user || null,
    items: (entry.items || []).map(item => ({
      ...item,
      foodItemName: item.name, // map 'name' to 'foodItemName' for UI compatibility
    })),
  };
};

// Order Management API functions
export const ordersApi = {
  // Place a new order (available to all authenticated users)
  placeOrder: async (orderData) => {
    try {
      const response = await apiCall(API_ENDPOINTS.ORDERS, {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  },

  // Get user orders (available to all authenticated users)
  getUserOrders: async (userId = null) => {
    try {
      const url = userId ? `${API_ENDPOINTS.ORDERS}?userId=${userId}` : API_ENDPOINTS.ORDERS;
      const response = await apiCall(url, {
        method: 'GET',
      });
      
      return (response.data || []).map(transformOrderResponse);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  // Get pending orders (available to all authenticated users)
  getPendingOrders: async () => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.ORDERS}/pending`, {
        method: 'GET',
      });
      
      return (response.data || []).map(transformOrderResponse);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      throw error;
    }
  },

  // Get order by ID (available to all authenticated users)
  getOrderById: async (orderId) => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.ORDERS}/${orderId}`, {
        method: 'GET',
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },

  // Get order by number (available to all authenticated users)
  getOrderByNumber: async (orderNumber) => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.ORDERS}/number/${orderNumber}`, {
        method: 'GET',
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderNumber}:`, error);
      throw error;
    }
  },

  // STAFF/ADMIN: Get all orders (requires staff or admin role)
  getAllOrders: async () => {
    if (!isStaffOrAdmin()) {
      throw new Error('Access denied. Staff or admin privileges required.');
    }

    try {
      const response = await apiCall(`${API_ENDPOINTS.ORDERS}/all`, {
        method: 'GET',
      });
      
      return (response.data || []).map(transformOrderResponse);
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  },

  // STAFF/ADMIN: Update order status (requires staff or admin role)
  updateOrderStatus: async (orderId, newStatus) => {
    if (!isStaffOrAdmin()) {
      throw new Error('Access denied. Staff or admin privileges required.');
    }

    try {
      const response = await apiCall(`${API_ENDPOINTS.ORDERS}/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(newStatus),
      });
      
      return response;
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  },

  // CASHIER/ADMIN: Update order payment status
  updatePaymentStatus: async (orderId, paymentStatus) => {
    const role = (getUserRole() || '').toLowerCase();
    if (!['admin', 'cashier'].includes(role)) {
      throw new Error('Access denied. Cashier or admin privileges required.');
    }

    try {
      const response = await apiCall(`${API_ENDPOINTS.ORDERS}/${orderId}/payment_status`, {
        method: 'PATCH',
        body: JSON.stringify(paymentStatus),
      });
      
      return response;
    } catch (error) {
      console.error(`Error updating order ${orderId} payment status:`, error);
      throw error;
    }
  },

  // COOK/ADMIN: Update average wait time
  updateAvgWaitTime: async (orderId, avgWaitTime) => {
    const role = (getUserRole() || '').toLowerCase();
    if (!['admin', 'cook'].includes(role)) {
      throw new Error('Access denied. Cook or admin privileges required.');
    }

    try {
      const response = await apiCall(`${API_ENDPOINTS.ORDERS}/${orderId}/avg_wait_time`, {
        method: 'PATCH',
        body: JSON.stringify(avgWaitTime),
      });
      
      return response;
    } catch (error) {
      console.error(`Error updating order ${orderId} wait time:`, error);
      throw error;
    }
  },
};

// WebSocket Order Updates Client
export class OrderWebSocketClient {
  constructor(tableId = null) {
    this.tableId = tableId;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = {
      open: [],
      message: [],
      close: [],
      error: [],
    };
  }

  connect() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    const wsUrl = `${API_ENDPOINTS.WEBSOCKET}?access_token=${token}${
      this.tableId ? `&tableId=${this.tableId}` : ''
    }`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.eventHandlers.open.forEach(handler => handler());
      
      // Subscribe to order updates
      this.subscribe('orders');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.eventHandlers.message.forEach(handler => handler(message));
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.eventHandlers.close.forEach(handler => handler());
      this.handleReconnection();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.eventHandlers.error.forEach(handler => handler(error));
    };
  }

  subscribe(channel, parameters = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        channel: channel,
        parameters: parameters,
      }));
    }
  }

  unsubscribe(channel) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        channel: channel,
        parameters: {},
      }));
    }
  }

  addEventListener(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  removeEventListener(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect();
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Transform API data to component-friendly format
export const transformFoodItem = (apiItem) => {
  return {
    id: apiItem.id,
    name: apiItem.name || 'Unnamed Item',
    description: apiItem.description || 'No description available',
    price: apiItem.price,
    image: apiItem.imageUrl,
    isVegan: apiItem.isVegan || false,
    isGlutenFree: apiItem.isGlutenFree || false,
    spiceLevel: apiItem.spiceLevel || 0,
    preparationTime: apiItem.preparationTimeMin,
    calories: apiItem.calories,
    isAvailable: apiItem.available !== false, // Default to true if not specified
    categories: (apiItem.categories || []).map(cat => cat.name),
    ingredients: (apiItem.ingredients || []).map(ing => ing.name),
    allergens: (apiItem.allergens || []).map(all => all.name),
    averageRating: apiItem.avg_rating || 0,
    // Additional API fields that might be useful
    tenantId: apiItem.tenantId,
    categoryId: apiItem.categoryId,
    displayOrder: apiItem.displayOrder,
    createdAt: apiItem.createdAt,
    updatedAt: apiItem.updatedAt,
  };
};

// Transform category API data to component-friendly format
export const transformCategory = (apiCategory) => {
  return {
    id: apiCategory.id,
    name: apiCategory.name || 'Unnamed Category',
    slug: apiCategory.slug || '',
    imageUrl: apiCategory.imageUrl || '',
    displayOrder: apiCategory.displayOrder || 0,
    isActive: apiCategory.isActive !== false, // Default to true if not specified
    createdAt: apiCategory.createdAt,
  };
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Direct credentials login — calls POST /auth/login
 * Accepts { email, password } and returns the bearer token string on success.
 * Stores the token (and user, if returned) in localStorage.
 */
export const guestLogin = async ({ email, password }) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Unexpected response from authentication server.');
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Login failed (${response.status}).`);
  }

  const token =
    data.token ||
    data.accessToken ||
    data.access_token ||
    data.data?.token ||
    data.data?.accessToken;

  if (!token) {
    throw new Error('Authentication succeeded but no token was returned.');
  }

  localStorage.setItem('token', token);
  const user = data.user || data.data?.user;
  if (user) localStorage.setItem('user', JSON.stringify(user));

  return token;
};

// Helper function to check if user has admin role
export const isAdmin = () => {
  try {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    return user && user.role === 'admin';
  } catch {
    return false;
  }
};

// Returns the current user's role string (as stored, e.g. 'admin', 'CASHIER', 'cashier', etc.)
export const getUserRole = () => {
  try {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    return user?.role || 'user';
  } catch {
    return 'user';
  }
};

// Returns true for any role that can view / manage all orders (all roles except 'user')
// Case-insensitive so it works regardless of how the backend stores the role
export const isStaffOrAdmin = () => {
  const role = (getUserRole() || '').toLowerCase();
  return ['admin', 'cashier', 'server', 'cook'].includes(role);
};

// Helper function to get current user info
export const getCurrentUser = () => {
  try {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
};

/**
 * Generic multipart/form-data API call function
 * Used for file uploads and FormData requests
 */
const apiCallFormData = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const config = {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  // Don't set Content-Type for FormData - let browser set it with boundary
  if (config.headers['Content-Type'] === 'application/json') {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  
  // Handle API response format
  if (data.success === false) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
};

// Admin Ingredients API functions
export const ingredientsApi = {
  getAll: async () => {
    try {
      const response = await apiCall(`${API_BASE_URL}/menu/ingredients`, {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      throw error;
    }
  },

  create: async (name) => {
    try {
      const response = await apiCall(`${API_BASE_URL}/menu/ingredients`, {
        method: 'POST',
        body: JSON.stringify(name),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating ingredient:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiCall(`${API_BASE_URL}/menu/ingredients/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error(`Error deleting ingredient ${id}:`, error);
      throw error;
    }
  },
};

// Admin Allergens API functions
export const allergensApi = {
  getAll: async () => {
    try {
      const response = await apiCall(`${API_BASE_URL}/menu/allergens`, {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching allergens:', error);
      throw error;
    }
  },

  create: async (name) => {
    try {
      const response = await apiCall(`${API_BASE_URL}/menu/allergens`, {
        method: 'POST',
        body: JSON.stringify(name),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating allergen:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiCall(`${API_BASE_URL}/menu/allergens/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error(`Error deleting allergen ${id}:`, error);
      throw error;
    }
  },
};

// Admin Categories API functions (extend existing)
export const adminCategoriesApi = {
  getAll: categoriesApi.getAll,

  create: async (formData) => {
    try {
      const response = await apiCallFormData(`${API_BASE_URL}/menu/categories`, {
        method: 'POST',
        body: formData,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiCall(`${API_BASE_URL}/menu/categories/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  },
};

// Admin Food Items API functions (extend existing)
export const adminFoodItemsApi = {
  getAll: foodItemsApi.getAll,

  create: async (formData) => {
    try {
      const response = await apiCallFormData(`${API_BASE_URL}/menu/food_items`, {
        method: 'POST',
        body: formData,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating food item:', error);
      throw error;
    }
  },

  update: async (formData) => {
    try {
      const response = await apiCallFormData(`${API_BASE_URL}/menu/food_items`, {
        method: 'PATCH',
        body: formData,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating food item:', error);
      throw error;
    }
  },

  updateImage: async (id, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('newImage', imageFile);
      const response = await apiCallFormData(`${API_BASE_URL}/menu/updatefooditemimg/${id}`, {
        method: 'PATCH',
        body: formData,
      });
      return response;
    } catch (error) {
      console.error(`Error updating image for food item ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiCall(`${API_BASE_URL}/menu/food_items/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error(`Error deleting food item ${id}:`, error);
      throw error;
    }
  },
};

// Cash Flow Categories API functions
export const cashFlowCategoriesApi = {
  getAll: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.CASH_FLOW_CATEGORIES, {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching cash flow categories:', error);
      const errorMessage = error.message?.includes('token') 
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to view cash flow categories.'
        : error.message?.includes('500')
        ? 'Server error occurred while fetching cash flow categories. Please try again later.'
        : `Failed to fetch cash flow categories: ${error.message}`;
      throw new Error(errorMessage);
    }
  },

  create: async (categoryData) => {
    try {
      const response = await apiCall(API_ENDPOINTS.CASH_FLOW_CATEGORIES, {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating cash flow category:', error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to create cash flow categories.'
        : error.message?.includes('400')
        ? 'Invalid category data provided. Please check your input and try again.'
        : error.message?.includes('409')
        ? 'A category with this name already exists.'
        : error.message?.includes('500')
        ? 'Server error occurred while creating cash flow category. Please try again later.'
        : `Failed to create cash flow category: ${error.message}`;
      throw new Error(errorMessage);
    }
  },
};

// Cash Flow API functions
export const cashFlowApi = {
  // Get cash flow categories
  getCategories: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.CASH_FLOW_CATEGORIES, {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching cash flow categories:', error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to view cash flow categories.'
        : error.message?.includes('500')
        ? 'Server error occurred while fetching cash flow categories. Please try again later.'
        : `Failed to fetch cash flow categories: ${error.message}`;
      throw new Error(errorMessage);
    }
  },

  getAll: async (range = 2) => { // Default to range 2 (7 days)
    try {
      const url = `${API_ENDPOINTS.CASH_FLOW}?range=${range}`;
      const response = await apiCall(url, {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching cash flow:', error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to view cash flow data.'
        : error.message?.includes('400')
        ? `Invalid range parameter: ${range}. Valid options are: 1 (today), 2 (7 days), 3 (30 days), 4 (365 days), 5 (all time).`
        : error.message?.includes('500')
        ? 'Server error occurred while fetching cash flow data. Please try again later.'
        : `Failed to fetch cash flow data: ${error.message}`;
      throw new Error(errorMessage);
    }
  },

  create: async (cashFlowData) => {
    try {
      const response = await apiCall(API_ENDPOINTS.CASH_FLOW, {
        method: 'POST',
        body: JSON.stringify(cashFlowData),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating cash flow entry:', error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to create cash flow entries.'
        : error.message?.includes('400')
        ? 'Invalid cash flow data provided. Please check your input and try again.'
        : error.message?.includes('500')
        ? 'Server error occurred while creating cash flow entry. Please try again later.'
        : `Failed to create cash flow entry: ${error.message}`;
      throw new Error(errorMessage);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CASH_FLOW}/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error(`Error deleting cash flow entry ${id}:`, error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to delete cash flow entries.'
        : error.message?.includes('404')
        ? 'Cash flow entry not found. It may have already been deleted.'
        : error.message?.includes('500')
        ? 'Server error occurred while deleting cash flow entry. Please try again later.'
        : `Failed to delete cash flow entry: ${error.message}`;
      throw new Error(errorMessage);
    }
  },
};

// Cafe Tables API functions
export const cafeTablesApi = {
  getAll: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.CAFE_TABLES, {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching cafe tables:', error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to view cafe tables.'
        : error.message?.includes('500')
        ? 'Server error occurred while fetching cafe tables. Please try again later.'
        : `Failed to fetch cafe tables: ${error.message}`;
      throw new Error(errorMessage);
    }
  },

  create: async (tableData) => {
    try {
      const response = await apiCall(API_ENDPOINTS.CAFE_TABLES, {
        method: 'POST',
        body: JSON.stringify(tableData),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating cafe table:', error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to create cafe tables.'
        : error.message?.includes('400')
        ? 'Invalid table data provided. Please check your input and try again.'
        : error.message?.includes('409')
        ? 'A table with this number already exists.'
        : error.message?.includes('500')
        ? 'Server error occurred while creating cafe table. Please try again later.'
        : `Failed to create cafe table: ${error.message}`;
      throw new Error(errorMessage);
    }
  },
};

// Inventory API functions
export const inventoryApi = {
  getAll: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.INVENTORY, {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching inventory:', error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to view inventory.'
        : error.message?.includes('500')
        ? 'Server error occurred while fetching inventory. Please try again later.'
        : `Failed to fetch inventory: ${error.message}`;
      throw new Error(errorMessage);
    }
  },
};

// Users API functions
export const usersApi = {
  getAll: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.USERS, {
        method: 'GET',
      });
      return response.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to view users.'
        : error.message?.includes('500')
        ? 'Server error occurred while fetching users. Please try again later.'
        : `Failed to fetch users: ${error.message}`;
      throw new Error(errorMessage);
    }
  },
  updateRole: async (userId, role) => {
    try {
      const response = await apiCall(API_ENDPOINTS.UPDATE_ROLE, {
        method: 'POST',
        body: JSON.stringify({ id: userId, role: role }),
      });
      return response;
    } catch (error) {
      console.error('Error updating user role:', error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to update user roles.'
        : error.message?.includes('500')
        ? 'Server error occurred while updating user role. Please try again later.'
        : `Failed to update user role: ${error.message}`;
      throw new Error(errorMessage);
    }
  },
};

// Inventory Transactions API functions
export const inventoryTransactionsApi = {
  create: async (transactionData) => {
    try {
      const response = await apiCall(API_ENDPOINTS.INVENTORY_TRANSACTIONS, {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating inventory transaction:', error);
      const errorMessage = error.message?.includes('token')
        ? 'Authentication failed. Please log in again.'
        : error.message?.includes('403') || error.message?.includes('401')
        ? 'Access denied. You do not have permission to create inventory transactions.'
        : error.message?.includes('400')
        ? 'Invalid transaction data provided. Please check your input and try again.'
        : error.message?.includes('409')
        ? 'Transaction conflict occurred. Please refresh and try again.'
        : error.message?.includes('500')
        ? 'Server error occurred while creating inventory transaction. Please try again later.'
        : `Failed to create inventory transaction: ${error.message}`;
      throw new Error(errorMessage);
    }
  },
};

// Business Dashboard API
export const businessDashboardApi = {
  get: async (range = '1m') => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.BUSINESS_DASHBOARD}?range=${range}`, {
        method: 'GET',
        headers: { 'Accept': 'text/plain' },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching business dashboard:', error);
      throw error;
    }
  },
};

export default {
  foodItemsApi,
  categoriesApi,
  ordersApi,
  OrderWebSocketClient,
  transformFoodItem,
  transformCategory,
  isAuthenticated,
  isAdmin,
  getCurrentUser,
  setAuthLogoutCallback,
  // Admin APIs
  ingredientsApi,
  allergensApi,
  adminCategoriesApi,
  adminFoodItemsApi,
  // Operations APIs
  cashFlowCategoriesApi,
  cashFlowApi,
  cafeTablesApi,
  inventoryApi,
  inventoryTransactionsApi,
  businessDashboardApi,
};