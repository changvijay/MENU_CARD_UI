import { createContext, useContext, useReducer, useEffect, useRef } from 'react';

const CartContext = createContext();

// Cart actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_TABLE_ID: 'SET_TABLE_ID',
  SET_DELIVERY_MODE: 'SET_DELIVERY_MODE',
  SET_NOTES: 'SET_NOTES',
  HYDRATE: 'HYDRATE',
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { item, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(
        cartItem => cartItem.foodItemId === item.id
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += quantity;
        return { ...state, items: updatedItems };
      } else {
        // Add new item
        const newItem = {
          foodItemId: item.id,
          name: item.name,
          quantity,
          unitPrice: item.price,
          image: item.image,
          subtotal: item.price * quantity,
        };
        return { ...state, items: [...state.items, newItem] };
      }
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { itemIndex, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((_, index) => index !== itemIndex),
        };
      }

      const updatedItems = [...state.items];
      updatedItems[itemIndex].quantity = quantity;
      updatedItems[itemIndex].subtotal = updatedItems[itemIndex].unitPrice * quantity;
      return { ...state, items: updatedItems };
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      const { itemIndex } = action.payload;
      return {
        ...state,
        items: state.items.filter((_, index) => index !== itemIndex),
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        notes: '',
      };

    case CART_ACTIONS.SET_TABLE_ID:
      return { ...state, tableId: action.payload };

    case CART_ACTIONS.SET_DELIVERY_MODE:
      return { ...state, deliveryMode: action.payload };

    case CART_ACTIONS.SET_NOTES:
      return { ...state, notes: action.payload };

    case CART_ACTIONS.HYDRATE:
      return { ...action.payload };

    default:
      return state;
  }
};

// Initial state
const initialState = {
  items: [],
  tableId: null,
  deliveryMode: 'dinein',
  notes: '',
};

// Cart Provider
export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState);
  const isHydrated = useRef(false);

  // Load cart from localStorage on mount (before persistence effect runs)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('menu_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart && Array.isArray(parsedCart.items)) {
          dispatch({ type: CART_ACTIONS.HYDRATE, payload: parsedCart });
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    isHydrated.current = true;
  }, []);

  // Persist cart to localStorage (skip during initial hydration)
  useEffect(() => {
    if (!isHydrated.current) return;
    localStorage.setItem('menu_cart', JSON.stringify(cart));
  }, [cart]);
  const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.0; // 0% tax
  const discount = 0; // Can be implemented later
  const finalAmount = subtotal + tax - discount;
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Cart actions
  const addItem = (item, quantity = 1) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { item, quantity },
    });
  };

  const updateQuantity = (itemIndex, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { itemIndex, quantity },
    });
  };

  const removeItem = (itemIndex) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: { itemIndex },
    });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  const setTableId = (tableId) => {
    dispatch({ type: CART_ACTIONS.SET_TABLE_ID, payload: tableId });
  };

  const setDeliveryMode = (mode) => {
    dispatch({ type: CART_ACTIONS.SET_DELIVERY_MODE, payload: mode });
  };

  const setNotes = (notes) => {
    dispatch({ type: CART_ACTIONS.SET_NOTES, payload: notes });
  };

  // Get order data for API
  const getOrderData = () => {
    return {
      tableId: cart.tableId,
      deliveryMode: cart.deliveryMode,
      notes: cart.notes,
      items: cart.items.map(item => ({
        foodItemId: item.foodItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      discount,
      tax,
    };
  };

  const value = {
    cart,
    subtotal,
    tax,
    discount,
    finalAmount,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setTableId,
    setDeliveryMode,
    setNotes,
    getOrderData,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};