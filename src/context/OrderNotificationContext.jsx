import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { isAdmin } from '../services/apiService';
import { useWebSocketOrders } from '../hooks/useWebSocketOrders';

const OrderNotificationContext = createContext(null);

export const useOrderNotification = () => useContext(OrderNotificationContext);

/* ─── Design tokens (matches ViewOrders palette) ─── */
const s = {
  surface: '#FFFFFF',
  border: '#E4DDD0',
  text: '#1A1612',
  textMuted: '#6E675E',
  textLight: '#A39A8E',
  shadowMd: '0 4px 24px rgba(0,0,0,0.09)',
  accent: '#C07A2E',
  accentLight: '#FDF0E0',
};

const STATUS_CFG = {
  pending:   { icon: '⏳', color: '#F59E0B', bg: '#FFFBEB', border: '#F59E0B25', label: 'Pending' },
  confirmed: { icon: '✅', color: '#3B82F6', bg: '#EFF6FF', border: '#3B82F625', label: 'Confirmed' },
  preparing: { icon: '🍳', color: '#F97316', bg: '#FFF7ED', border: '#F9731625', label: 'Preparing' },
  ready:     { icon: '🔔', color: '#10B981', bg: '#ECFDF5', border: '#10B98125', label: 'Ready for pickup!' },
  completed: { icon: '✓',  color: '#6B7280', bg: '#F9FAFB', border: '#6B728025', label: 'Completed' },
  cancelled: { icon: '✕',  color: '#EF4444', bg: '#FEF2F2', border: '#EF444425', label: 'Cancelled' },
};

const PAYMENT_CFG = {
  paid:     { icon: '💳', color: '#10B981', bg: '#ECFDF5', border: '#10B98125', label: 'Payment received' },
  unpaid:   { icon: '⏳', color: '#F59E0B', bg: '#FFFBEB', border: '#F59E0B25', label: 'Marked unpaid' },
  refunded: { icon: '↩',  color: '#8B5CF6', bg: '#F5F3FF', border: '#8B5CF625', label: 'Payment refunded' },
};

/* ─── Single notification card ─── */
const OrderNotification = ({ notif, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, notif.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [onDismiss, notif.duration]);

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '14px 16px',
      background: notif.bg || s.surface,
      border: `1px solid ${notif.border || s.border}`,
      borderRadius: '14px',
      boxShadow: s.shadowMd,
      minWidth: '300px', maxWidth: '380px',
      animation: 'orderNotifSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"DM Sans", system-ui, sans-serif',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
        background: notif.color || s.accent,
        borderRadius: '14px 0 0 14px',
      }} />
      <span style={{ fontSize: '18px', flexShrink: 0, marginLeft: '6px' }}>{notif.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: s.text, lineHeight: 1.3 }}>{notif.title}</p>
        <p style={{ margin: '3px 0 0', fontSize: '12px', color: s.textMuted, lineHeight: 1.4 }}>{notif.body}</p>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: s.textLight, fontSize: '18px', padding: '0 0 0 4px',
          lineHeight: 1, flexShrink: 0, fontFamily: 'inherit',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = s.textMuted; }}
        onMouseLeave={e => { e.currentTarget.style.color = s.textLight; }}
      >×</button>
    </div>
  );
};

/* ─── Stacked overlay (rendered inside provider, visible on all pages) ─── */
const NotificationStack = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;
  return (
    <>
      <style>{`@keyframes orderNotifSlideIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }`}</style>
      <div style={{
        position: 'fixed', top: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {notifications.map(n => (
          <div key={n.id} style={{ pointerEvents: 'auto' }}>
            <OrderNotification notif={n} onDismiss={() => onDismiss(n.id)} />
          </div>
        ))}
      </div>
    </>
  );
};

/* ─── Provider ─── */
export const OrderNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const userOrderIdsRef = useRef(new Set());

  const { statusUpdates, paymentUpdates, waitTimeUpdates } = useWebSocketOrders();

  const pushNotif = useCallback((notif) => {
    setNotifications(prev => [{ ...notif, id: Date.now() + Math.random() }, ...prev].slice(0, 5));
  }, []);

  /* Call this from useOrderManagement after fetching user orders */
  const registerUserOrderIds = useCallback((ids) => {
    ids.forEach(id => userOrderIdsRef.current.add(String(id)));
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const isUserOrder = (orderId) =>
    isAdmin() || userOrderIdsRef.current.has(String(orderId));

  /* Status update notifications */
  useEffect(() => {
    if (!statusUpdates.length) return;
    const { orderId, newStatus, orderNumber } = statusUpdates[0];
    if (!isUserOrder(orderId)) return;
    const cfg = STATUS_CFG[newStatus] || { icon: '📋', color: s.accent, bg: s.accentLight, border: `${s.accent}25`, label: newStatus };
    pushNotif({
      icon: cfg.icon,
      title: `Order #${orderNumber || orderId} — ${cfg.label}`,
      body: isAdmin()
        ? `Order status updated to "${cfg.label}"`
        : `Your order status is now "${cfg.label}"`,
      color: cfg.color, bg: cfg.bg, border: cfg.border,
    });
  }, [statusUpdates]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Payment update notifications */
  useEffect(() => {
    if (!paymentUpdates.length) return;
    const { orderId, orderNumber, newPaymentStatus } = paymentUpdates[0];
    if (!isUserOrder(orderId)) return;
    const cfg = PAYMENT_CFG[newPaymentStatus] || { icon: '💳', color: s.accent, bg: s.accentLight, border: `${s.accent}25`, label: newPaymentStatus };
    pushNotif({
      icon: cfg.icon,
      title: `Order #${orderNumber || orderId} — ${cfg.label}`,
      body: isAdmin()
        ? `Payment marked as "${newPaymentStatus}"`
        : `Your payment for order #${orderNumber || orderId} has been updated`,
      color: cfg.color, bg: cfg.bg, border: cfg.border,
    });
  }, [paymentUpdates]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Wait time update notifications */
  useEffect(() => {
    if (!waitTimeUpdates.length) return;
    const { orderId, orderNumber, newAvgWaitTime } = waitTimeUpdates[0];
    if (!isUserOrder(orderId)) return;
    pushNotif({
      icon: '⏱',
      title: `Order #${orderNumber || orderId} — Wait Time Updated`,
      body: `Estimated wait is now ${newAvgWaitTime} min`,
      color: '#7C3AED', bg: '#F5F3FF', border: '#8B5CF625',
    });
  }, [waitTimeUpdates]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <OrderNotificationContext.Provider value={{ pushNotif, registerUserOrderIds }}>
      {children}
      <NotificationStack notifications={notifications} onDismiss={dismiss} />
    </OrderNotificationContext.Provider>
  );
};

