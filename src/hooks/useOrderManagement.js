import { useState, useEffect, useCallback } from 'react';
import { ordersApi, isStaffOrAdmin, getUserRole, isAuthenticated } from '../services/apiService';
import { useWebSocketOrders } from './useWebSocketOrders';
import { useOrderNotification } from '../context/OrderNotificationContext';

/**
 * Custom hook for managing orders with real-time WebSocket updates
 * Handles admin access control and role-based features
 * 
 * @param {number} tableId - Optional table ID for table-specific orders
 * @returns {Object} Order management state and functions
 */
export const useOrderManagement = (tableId = null) => {
  // Order state
  const [orders, setOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // WebSocket connection via dedicated hook
  const { liveOrders, statusUpdates, paymentUpdates, waitTimeUpdates, isConnected: wsConnected, clearLatestStatusUpdate, clearLatestPaymentUpdate, clearLatestWaitTimeUpdate, manualReconnect } = useWebSocketOrders();

  // Global notification context
  const { registerUserOrderIds } = useOrderNotification() || {};
  
  // User role state
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [userRole, setUserRole] = useState('user');
  
  // Check user role on mount
  useEffect(() => {
    setIsUserAdmin(isStaffOrAdmin());
    const raw = getUserRole() || 'user';
    // Normalize: 'admin' stays lowercase; staff roles uppercased so ViewOrders lookups are consistent
    setUserRole(raw.toLowerCase() === 'admin' ? 'admin' : raw.toUpperCase());
  }, []);

  // Merge live WebSocket orders into pending & all-orders lists
  // Fetch full order details to ensure complete data (finalAmount, items, etc)
  useEffect(() => {
    if (liveOrders.length === 0) return;
    const latest = liveOrders[0];
    
    // Enrich the order with complete data from API
    const enrichOrder = async () => {
      try {
        const fullOrderData = await ordersApi.getOrderById(latest.orderId || latest.id);
        
        setPendingOrders(prev => {
          if (prev.some(o => o.orderId === fullOrderData.orderId || o.orderNumber === fullOrderData.orderNumber)) return prev;
          return [fullOrderData, ...prev];
        });
        
        if (isUserAdmin) {
          setOrders(prev => {
            if (prev.some(o => o.orderId === fullOrderData.orderId || o.orderNumber === fullOrderData.orderNumber)) return prev;
            return [fullOrderData, ...prev];
          });
        }
      } catch (err) {
        console.error('Error enriching new order data:', err);
        // Fallback: use the partial data from WebSocket
        setPendingOrders(prev => {
          if (prev.some(o => o.orderId === latest.orderId || o.orderNumber === latest.orderNumber)) return prev;
          return [latest, ...prev];
        });
        if (isUserAdmin) {
          setOrders(prev => {
            if (prev.some(o => o.orderId === latest.orderId || o.orderNumber === latest.orderNumber)) return prev;
            return [latest, ...prev];
          });
        }
      }
    };
    
    enrichOrder();
  }, [liveOrders, isUserAdmin]);

  // Apply real-time status updates from WebSocket
  useEffect(() => {
    if (statusUpdates.length === 0) return;
    const { orderId, newStatus } = statusUpdates[0];

    const applyUpdate = (list) =>
      list.map(o =>
        o.orderId === orderId || o.id === orderId
          ? { ...o, status: newStatus }
          : o
      );

    // Remove from pending when no longer pending
    if (newStatus !== 'pending') {
      setPendingOrders(prev => prev.filter(o => o.orderId !== orderId && o.id !== orderId));
    } else {
      setPendingOrders(applyUpdate);
    }

    setOrders(applyUpdate);
    setUserOrders(applyUpdate);
  }, [statusUpdates]);

  // Apply real-time payment status updates from WebSocket
  useEffect(() => {
    if (paymentUpdates.length === 0) return;
    const { orderId, newPaymentStatus } = paymentUpdates[0];

    const applyUpdate = (list) =>
      list.map(o =>
        o.orderId === orderId || o.id === orderId
          ? { ...o, paymentStatus: newPaymentStatus }
          : o
      );

    setPendingOrders(applyUpdate);
    setOrders(applyUpdate);
    setUserOrders(applyUpdate);
  }, [paymentUpdates]);

  // Apply real-time wait time updates from WebSocket
  useEffect(() => {
    if (waitTimeUpdates.length === 0) return;
    const { orderId, newAvgWaitTime } = waitTimeUpdates[0];

    const applyUpdate = (list) =>
      list.map(o =>
        o.orderId === orderId || o.id === orderId
          ? { ...o, avgWaitTime: newAvgWaitTime }
          : o
      );

    setPendingOrders(applyUpdate);
    setOrders(applyUpdate);
    setUserOrders(applyUpdate);
  }, [waitTimeUpdates]);

  // Fetch all orders (staff/admin only)
  const fetchAllOrders = useCallback(async () => {
    if (!isStaffOrAdmin()) {
      setError('Access denied. Staff or admin privileges required.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await ordersApi.getAllOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching all orders:', err);
    } finally {
      setLoading(false);
    }
  }, [isUserAdmin]);

  // Fetch pending orders (public)
  const fetchPendingOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await ordersApi.getPendingOrders();
      setPendingOrders(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching pending orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user orders (public)
  const fetchUserOrders = useCallback(async (userId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await ordersApi.getUserOrders(userId);
      setUserOrders(data);
      if (registerUserOrderIds) registerUserOrderIds(data.map(o => String(o.orderId || o.id)));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Place new order (public)
  const placeOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ordersApi.placeOrder(orderData);
      
      // Refresh relevant order lists
      await fetchUserOrders();
      await fetchPendingOrders();
      
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error placing order:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserOrders, fetchPendingOrders]);

  // Update order status (staff/admin only)
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    if (!isStaffOrAdmin()) {
      setError('Access denied. Staff or admin privileges required.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Handle payment status updates separately
      if (newStatus.startsWith('payment:')) {
        const paymentStatus = newStatus.split(':')[1]; // Extract 'paid' or 'unpaid'
        await ordersApi.updatePaymentStatus(orderId, paymentStatus);
      } 
      // Handle avg wait time updates separately
      else if (newStatus.startsWith('waittime:')) {
        const waitTime = newStatus.split(':')[1]; // Extract wait time in minutes
        await ordersApi.updateAvgWaitTime(orderId, waitTime);
      } 
      else {
        await ordersApi.updateOrderStatus(orderId, newStatus);
      }
      
      // The WebSocket will handle the real-time update
      // But we can also refresh the data to be sure
      if (isUserAdmin) {
        await fetchAllOrders();
      }
      await fetchPendingOrders();
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating order status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isUserAdmin, fetchAllOrders, fetchPendingOrders]);

  // Get order by ID (public)
  const getOrderById = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await ordersApi.getOrderById(orderId);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching order:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    if (!isAuthenticated()) return;

    // Fetch initial data
    fetchPendingOrders();
    fetchUserOrders();
    
    // Fetch all orders if admin
    if (isUserAdmin) {
      fetchAllOrders();
    }
  }, [isUserAdmin, fetchPendingOrders, fetchUserOrders, fetchAllOrders]);

  return {
    // State
    orders,           // All orders (staff/admin only)
    pendingOrders,    // Pending orders (public)
    userOrders,       // Current user's orders (public)
    loading,
    error,
    wsConnected,
    isUserAdmin,
    userRole,
    statusUpdates,    // Latest status update from WebSocket
    paymentUpdates,   // Latest payment status update
    waitTimeUpdates,  // Latest wait time update
    clearLatestStatusUpdate,
    clearLatestPaymentUpdate,
    clearLatestWaitTimeUpdate,
    
    // Actions
    placeOrder,
    updateOrderStatus,     // Admin only
    getOrderById,
    fetchAllOrders,        // Admin only
    fetchPendingOrders,
    fetchUserOrders,
    
    // Utility
    clearError: () => setError(null),
    manualReconnect,   // Manual WebSocket reconnect
    refreshData: () => {
      fetchPendingOrders();
      fetchUserOrders();
      if (isUserAdmin) {
        fetchAllOrders();
      }
    },
  };
};