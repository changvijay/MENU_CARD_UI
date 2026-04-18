import { createContext, useContext } from 'react';

const OrderNotificationContext = createContext(null);

export const useOrderNotification = () => useContext(OrderNotificationContext);

export const OrderNotificationProvider = ({ children }) => (
  <OrderNotificationContext.Provider value={{ popup: null, dismissPopup: () => {} }}>
    {children}
  </OrderNotificationContext.Provider>
);

