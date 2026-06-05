import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderManagement } from '../hooks/useOrderManagement';
import { isAuthenticated } from '../services/apiService';

/* ─── Design Tokens ─── */
const t = {
  bg: '#F7F4EE',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F1E8',
  surfaceHover: '#FDFBF7',
  border: '#E4DDD0',
  borderLight: '#EDE8DE',
  accent: '#C07A2E',
  accentLight: '#FDF0E0',
  accentDark: '#8F561A',
  accentGlow: 'rgba(192,122,46,0.15)',
  text: '#1A1612',
  textMuted: '#6E675E',
  textLight: '#A39A8E',
  shadow: '0 1px 4px rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 24px rgba(0,0,0,0.09)',
  shadowLg: '0 8px 40px rgba(0,0,0,0.12)',
  radius: '16px',
  radiusSm: '10px',
  radiusXs: '7px',
};

/* ─── Status config ─── */
const STATUS = {
  pending:          { dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E', label: 'Pending',          strip: '#F59E0B' },
  confirmed:        { dot: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF', label: 'Confirmed',        strip: '#3B82F6' },
  preparing:        { dot: '#F97316', bg: '#FFF7ED', text: '#9A3412', label: 'Preparing',        strip: '#F97316' },
  ready:            { dot: '#10B981', bg: '#ECFDF5', text: '#065F46', label: 'Ready',            strip: '#10B981' },
  out_for_delivery: { dot: '#8B5CF6', bg: '#F5F3FF', text: '#5B21B6', label: 'Out for Delivery', strip: '#8B5CF6' },
  delivered:        { dot: '#10B981', bg: '#ECFDF5', text: '#065F46', label: 'Delivered',        strip: '#10B981' },
  completed:        { dot: '#6B7280', bg: '#F9FAFB', text: '#374151', label: 'Completed',        strip: '#9CA3AF' },
  cancelled:        { dot: '#EF4444', bg: '#FEF2F2', text: '#991B1B', label: 'Cancelled',        strip: '#EF4444' },
};

/* ─── Role-based status flows ─── */
const ROLE_STATUS_FLOWS = {
  COOK: [
    { target: 'preparing',        label: 'Start Preparing',   icon: '👨‍🍳' },
    { target: 'out_for_delivery', label: 'Out for Delivery',  icon: '🛵' },
  ],
  SERVER: [
    { target: 'delivered',        label: 'Mark Delivered',    icon: '✓' },
  ],
  admin: [
    { target: 'preparing',        label: 'Preparing',         icon: '👨‍🍳' },
    { target: 'ready',            label: 'Ready',             icon: '🔔' },
    { target: 'out_for_delivery', label: 'Out for Delivery',  icon: '🛵' },
    { target: 'delivered',        label: 'Delivered',         icon: '📦' },
    { target: 'completed',        label: 'Complete',          icon: '✓' },
    { target: 'cancelled',        label: 'Cancel',            icon: '✕', danger: true },
  ],
};

/* ─── Role permission helpers ─── */
const canUpdatePayment  = (role) => ['admin', 'cashier'].includes((role || '').toLowerCase());
const canUpdateWaitTime = (role) => ['admin', 'cook'].includes((role || '').toLowerCase());

const getStatusButtons = (order, role) => {
  const done = ['completed', 'cancelled'].includes(order.status);
  if (done) return [];
  const flow = ROLE_STATUS_FLOWS[role] || [];
  return flow.filter(s => {
    if (s.target === order.status) return false;
    // SERVER may only transition out_for_delivery → delivered
    if (role === 'SERVER' && s.target === 'delivered' && order.status !== 'out_for_delivery') return false;
    return true;
  });
};

/* ─── Helpers ─── */
const formatPrice = (p) => `₹${(Number(p) || 0).toFixed(2)}`;

const formatDate = (ds) => {
  const d = new Date(ds);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const deliveryIcon = (m) => ({ dinein: '🪑', takeaway: '📦', delivery: '🛵' }[m] || '📋');
const deliveryLabel = (m) => ({ dinein: 'Dine In', takeaway: 'Takeaway', delivery: 'Delivery' }[m] || m);

/* ─── StatusBadge ─── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS[status] || STATUS.pending;
  const pulse = status === 'pending' || status === 'preparing' || status === 'out_for_delivery';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px',
      background: cfg.bg,
      color: cfg.text,
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      borderRadius: '20px',
      border: `1px solid ${cfg.dot}40`,
    }}>
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: cfg.dot,
        flexShrink: 0,
        ...(pulse ? { animation: 'pulse 1.8s ease-in-out infinite' } : {}),
      }} />
      {cfg.label}
    </span>
  );
};

/* ─── PaymentBadge ─── */
const PaymentBadge = ({ status }) => {
  const map = {
    paid:     { bg: '#ECFDF5', color: '#065F46', border: '#10B98130', icon: '✓', label: 'Paid' },
    unpaid:   { bg: '#FFFBEB', color: '#92400E', border: '#F59E0B30', icon: '○', label: 'Unpaid' },
    refunded: { bg: '#F5F3FF', color: '#5B21B6', border: '#8B5CF630', icon: '↩', label: 'Refunded' },
  };
  const cfg = map[status] || map.unpaid;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 9px', borderRadius: '20px',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
    }}>
      <span style={{ fontSize: '9px' }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};

/* ─── Status progress steps ─── */
const STATUS_STEPS = [
  { key: 'preparing',        label: 'Preparing',        icon: '👨‍🍳' },
  { key: 'ready',            label: 'Ready',            icon: '🔔' },
  { key: 'out_for_delivery', label: 'Out for\nDelivery', icon: '🛵' },
  { key: 'delivered',        label: 'Delivered',        icon: '📦' },
  { key: 'completed',        label: 'Complete',         icon: '✓' },
];

/* ─── StatusStepper ─── */
const StatusStepper = ({ status }) => {
  if (status === 'cancelled') return null;
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);
  return (
    <div style={{
      padding: '14px 20px 12px',
      background: '#FDFCFA',
      borderTop: `1px solid ${t.borderLight}`,
      display: 'flex',
      alignItems: 'flex-start',
      flexShrink: 0,
    }}>
      {STATUS_STEPS.flatMap((step, i) => {
        const isDone   = currentIdx > i;
        const isActive = currentIdx === i;
        const els = [];
        els.push(
          <div key={`step-${step.key}`} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '5px',
            flex: '0 0 auto', width: '56px',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: isDone || isActive ? t.accent : t.surface,
              border: `2px solid ${isDone || isActive ? t.accent : t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px',
              color: isDone || isActive ? '#fff' : t.textLight,
              flexShrink: 0,
              transition: 'all 0.3s',
              ...(isActive ? { boxShadow: `0 0 0 4px ${t.accentGlow}` } : {}),
            }}>
              {isDone ? '✓' : step.icon}
            </div>
            <span style={{
              fontSize: '9px',
              fontWeight: isActive ? 700 : 500,
              color: isDone || isActive ? t.accentDark : t.textLight,
              textAlign: 'center',
              lineHeight: 1.3,
              whiteSpace: 'pre-line',
            }}>{step.label}</span>
          </div>
        );
        if (i < STATUS_STEPS.length - 1) {
          els.push(
            <div key={`conn-${i}`} style={{
              flex: 1,
              height: '2px',
              background: isDone ? t.accent : t.borderLight,
              marginBottom: '18px',
              transition: 'background 0.3s',
              minWidth: '6px',
            }} />
          );
        }
        return els;
      })}
    </div>
  );
};

/* ─── OrderItemsModal ─── */
const OrderItemsModal = ({ order, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26, 22, 18, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.surface,
          borderRadius: t.radius,
          boxShadow: t.shadowLg,
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${t.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div style={{ minWidth: 0, flex: 1, marginRight: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {order.user?.avatarUrl && (
                <img src={order.user.avatarUrl} alt="" referrerPolicy="no-referrer"
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${t.border}`, objectFit: 'cover' }} />
              )}
              <span style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '18px', fontWeight: 700, color: t.text,
              }}>Order #{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {order.user?.name && (
                <span style={{ fontSize: '12px', color: t.text, fontWeight: 600 }}>{order.user.name}</span>
              )}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', color: t.textMuted,
                padding: '2px 8px', borderRadius: '20px',
                background: t.surfaceAlt, border: `1px solid ${t.borderLight}`,
              }}>
                {deliveryIcon(order.deliveryMode)} {deliveryLabel(order.deliveryMode)}
                {order.tableId > 0 && ` · T${order.tableId}`}
              </span>
              {order.paymentStatus && <PaymentBadge status={order.paymentStatus} />}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              borderRadius: '8px',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: t.textMuted,
              fontSize: '20px', lineHeight: 1,
              fontFamily: 'inherit',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#B91C1C'; e.currentTarget.style.borderColor = '#EF444430'; }}
            onMouseLeave={e => { e.currentTarget.style.background = t.surfaceAlt; e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.border; }}
          >×</button>
        </div>

        <StatusStepper status={order.status} />

        {/* Notes */}
        {order.notes && (
          <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
            <div style={{
              padding: '9px 12px',
              background: t.accentLight, borderRadius: t.radiusXs,
              fontSize: '12px', color: t.accentDark,
              borderLeft: `3px solid ${t.accent}`,
              display: 'flex', gap: '6px', alignItems: 'flex-start',
            }}>
              <span style={{ flexShrink: 0 }}>📝</span>
              <span><strong>Note: </strong>{order.notes}</span>
            </div>
          </div>
        )}

        {/* Items list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 48px 72px 80px',
            gap: '8px',
            padding: '6px 4px 8px',
            borderBottom: `1px solid ${t.border}`,
            marginBottom: '4px',
          }}>
            {[['Item', 'left'], ['Qty', 'center'], ['Price', 'right'], ['Subtotal', 'right']].map(([h, align]) => (
              <span key={h} style={{
                fontSize: '10px', fontWeight: 700,
                color: t.textLight, letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textAlign: align,
              }}>{h}</span>
            ))}
          </div>

          {/* Item rows */}
          {order.items?.length > 0 ? order.items.map((item, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 48px 72px 80px',
              gap: '8px',
              padding: '11px 4px',
              borderBottom: i < order.items.length - 1 ? `1px dashed ${t.borderLight}` : 'none',
              alignItems: 'start',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: t.text, lineHeight: 1.3 }}>
                  {item.foodItemName || item.name}
                </p>
                {item.specialRequest && (
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: t.accent, fontStyle: 'italic', lineHeight: 1.3 }}>
                    ✨ {item.specialRequest}
                  </p>
                )}
              </div>
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '22px', marginTop: '1px',
                background: t.accentLight, color: t.accentDark,
                borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                alignSelf: 'start',
              }}>{item.quantity}</span>
              <span style={{ fontSize: '13px', color: t.textMuted, textAlign: 'right', paddingTop: '2px' }}>
                {formatPrice(item.price != null ? item.price : (item.subtotal / Math.max(item.quantity, 1)))}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: t.text, textAlign: 'right', paddingTop: '2px' }}>
                {formatPrice(item.subtotal)}
              </span>
            </div>
          )) : (
            <p style={{ textAlign: 'center', color: t.textMuted, fontSize: '13px', padding: '20px 0' }}>No items</p>
          )}
        </div>

        {/* Totals footer */}
        <div style={{
          padding: '14px 24px 20px',
          borderTop: `1px solid ${t.border}`,
          background: t.surfaceAlt,
          flexShrink: 0,
        }}>
          {order.totalAmount != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: t.textMuted, marginBottom: '6px' }}>
              <span>Subtotal</span><span>{formatPrice(order.totalAmount)}</span>
            </div>
          )}
          {Number(order.discount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#065F46', marginBottom: '6px' }}>
              <span>Discount</span><span>−{formatPrice(order.discount)}</span>
            </div>
          )}
          {Number(order.tax) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: t.textMuted, marginBottom: '6px' }}>
              <span>Tax</span><span>{formatPrice(order.tax)}</span>
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '8px', borderTop: `1px solid ${t.border}`, marginTop: '4px',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: t.text }}>Total</span>
            <span style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '20px', fontWeight: 700, color: t.text,
            }}>{formatPrice(order.finalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── OrderCard ─── */
const OrderCard = ({ order, showActions, userRole, onStatusUpdate, onCardClick, loading, wsConnected, manualReconnect, animDelay = 0 }) => {
  const [showWaitInput, setShowWaitInput] = useState(false);
  const [waitVal, setWaitVal] = useState(order.avgWaitTime || '');
  const cfg = STATUS[order.status] || STATUS.pending;
  const isDone = ['completed', 'cancelled', 'delivered'].includes(order.status);

  const handlePayment = (v) => {
    if (!wsConnected) manualReconnect();
    onStatusUpdate(order.id, `payment:${v}`);
  };

  const statusButtons = showActions ? getStatusButtons(order, userRole) : [];
  const showPayment   = showActions && canUpdatePayment(userRole);
  const showWaitTime  = showActions && canUpdateWaitTime(userRole);
  const hasAnyAction  = statusButtons.length > 0 || showPayment || showWaitTime;

  return (
    <div
      onClick={onCardClick}
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: t.radius,
        boxShadow: t.shadow,
        overflow: 'hidden',
        cursor: 'pointer',
        animation: `slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both`,
        animationDelay: `${animDelay}ms`,
        opacity: isDone ? 0.72 : 1,
        transition: 'box-shadow 0.2s, transform 0.2s, opacity 0.3s',
        display: 'flex',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = t.shadowMd;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = t.shadow;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Status strip */}
      <div style={{
        width: '4px',
        background: cfg.strip,
        flexShrink: 0,
        borderRadius: `${t.radius} 0 0 ${t.radius}`,
        ...(['pending', 'preparing', 'out_for_delivery'].includes(order.status)
          ? { animation: 'stripPulse 2s ease-in-out infinite' } : {}),
      }} />

      {/* Card body */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* ── Header ── */}
        <div style={{ padding: '18px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>

            {/* Left */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {order.user?.avatarUrl && (
                  <img src={order.user.avatarUrl} alt="" referrerPolicy="no-referrer"
                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: `2px solid ${t.border}`, objectFit: 'cover' }} />
                )}
                <span style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '17px', fontWeight: 700, color: t.text,
                }}>#{order.orderNumber}</span>
                <StatusBadge status={order.status} />
                {order.paymentStatus && <PaymentBadge status={order.paymentStatus} />}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                {order.user?.name && (
                  <span style={{ fontSize: '12px', color: t.text, fontWeight: 600 }}>{order.user.name}</span>
                )}
                <span style={{ fontSize: '11px', color: t.textLight }}>
                  {order.createdAt && formatDate(order.createdAt)}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '11px', color: t.textMuted,
                  padding: '2px 8px', borderRadius: '20px',
                  background: t.surfaceAlt, border: `1px solid ${t.borderLight}`,
                }}>
                  {deliveryIcon(order.deliveryMode)} {deliveryLabel(order.deliveryMode)}
                  {order.tableId > 0 && ` · T${order.tableId}`}
                </span>
                {order.avgWaitTime && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', color: '#7C3AED',
                    padding: '2px 8px', borderRadius: '20px',
                    background: '#F5F3FF', border: '1px solid #8B5CF625',
                  }}>⏱ {order.avgWaitTime} min</span>
                )}
              </div>
            </div>

            {/* Right */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '20px', fontWeight: 700, color: t.text, margin: '0 0 4px',
              }}>{formatPrice(order.finalAmount)}</p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', color: t.accent, fontWeight: 600,
                letterSpacing: '0.03em',
              }}>
                {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                <span style={{ fontSize: '12px', fontWeight: 400 }}>›</span>
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{
              marginTop: '12px', padding: '8px 12px',
              background: t.accentLight, borderRadius: t.radiusXs,
              fontSize: '12px', color: t.accentDark,
              borderLeft: `3px solid ${t.accent}`,
              display: 'flex', gap: '6px', alignItems: 'flex-start',
            }}>
              <span style={{ flexShrink: 0, marginTop: '1px' }}>📝</span>
              <span><strong>Note: </strong>{order.notes}</span>
            </div>
          )}
        </div>

        <StatusStepper status={order.status} />

        {/* ── Actions ── */}
        {hasAnyAction && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '12px 20px',
              borderTop: `1px solid ${t.borderLight}`,
              display: 'flex', flexWrap: 'wrap', gap: '8px',
              alignItems: 'center',
              background: '#FDFCFA',
            }}>

            {/* Left: role-based status buttons */}
            {statusButtons.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {statusButtons.map(({ target, label, icon, danger }) => (
                  <button key={target}
                    onClick={() => onStatusUpdate(order.id, target)}
                    disabled={loading}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: danger ? `1.5px solid #EF444440` : `1.5px solid ${t.border}`,
                      background: danger ? '#FEF2F2' : t.surfaceAlt,
                      color: danger ? '#B91C1C' : t.text,
                      fontSize: '12px', fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      opacity: loading ? 0.6 : 1,
                    }}
                    onMouseEnter={e => {
                      if (loading) return;
                      e.currentTarget.style.background = danger ? '#FEE2E2' : t.accentLight;
                      if (!danger) e.currentTarget.style.borderColor = t.accent;
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = danger ? '#FEF2F2' : t.surfaceAlt;
                      e.currentTarget.style.borderColor = danger ? '#EF444440' : t.border;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{ fontSize: '11px' }}>{icon}</span> {label}
                  </button>
                ))}
              </div>
            )}

            {/* Right: payment + wait time (role-gated) */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>

              {!wsConnected && (
                <span style={{
                  fontSize: '10px', fontWeight: 600, color: '#DC2626',
                  background: '#FEE2E2', padding: '4px 8px',
                  borderRadius: '6px', border: '1px solid #FCA5A5',
                }}>⚡ WS Offline</span>
              )}

              {/* Payment dropdown — CASHIER and admin only */}
              {showPayment && (
                <div style={{ position: 'relative' }}>
                  <select
                    value={order.paymentStatus || 'unpaid'}
                    onChange={e => handlePayment(e.target.value)}
                    disabled={loading}
                    style={{
                      padding: '6px 28px 6px 12px',
                      borderRadius: '20px',
                      border: `1.5px solid #8B5CF640`,
                      background: '#F8F5FF',
                      color: '#5B21B6',
                      fontSize: '11px', fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      appearance: 'none',
                      letterSpacing: '0.03em',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%235B21B6' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      transition: 'all 0.15s',
                      opacity: loading ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (!loading) e.target.style.background = '#EDE9FE'; }}
                    onMouseLeave={e => { e.target.style.background = '#F8F5FF'; }}
                  >
                    <option value="unpaid">⏳ Unpaid</option>
                    <option value="paid">✓ Paid</option>
                    <option value="refunded">↩ Refunded</option>
                  </select>
                </div>
              )}

              {/* Wait time — COOK and admin only */}
              {showWaitTime && (
                !showWaitInput ? (
                  <button
                    onClick={() => { setShowWaitInput(true); setWaitVal(order.avgWaitTime || ''); }}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: `1.5px solid #8B5CF640`,
                      background: '#F8F5FF', color: '#5B21B6',
                      fontSize: '11px', fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                      opacity: loading ? 0.6 : 1,
                      letterSpacing: '0.03em',
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#EDE9FE'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F8F5FF'; }}
                  >
                    ⏱ {order.avgWaitTime ? `${order.avgWaitTime} min` : 'Wait time'}
                  </button>
                ) : (
                  <div style={{
                    display: 'flex', gap: '5px', alignItems: 'center',
                    padding: '4px 8px 4px 4px',
                    background: '#F8F5FF', border: `1.5px solid #8B5CF640`,
                    borderRadius: '20px',
                  }}>
                    <input
                      type="number"
                      value={waitVal}
                      onChange={e => setWaitVal(e.target.value)}
                      min="0" max="999"
                      placeholder="min"
                      autoFocus
                      style={{
                        width: '54px', padding: '3px 8px',
                        borderRadius: '14px', border: `1px solid #8B5CF640`,
                        fontSize: '12px', fontFamily: 'inherit',
                        outline: 'none', background: 'white',
                        color: '#5B21B6', fontWeight: 600,
                      }}
                      onFocus={e => e.target.style.borderColor = '#8B5CF6'}
                      onBlur={e => e.target.style.borderColor = '#8B5CF640'}
                    />
                    <button
                      onClick={() => {
                        if (waitVal && !isNaN(waitVal)) {
                          onStatusUpdate(order.id, `waittime:${waitVal}`);
                          setShowWaitInput(false);
                        }
                      }}
                      disabled={loading || !waitVal}
                      style={{
                        padding: '4px 10px', borderRadius: '14px', border: 'none',
                        background: '#7C3AED', color: 'white', fontSize: '11px', fontWeight: 700,
                        cursor: loading || !waitVal ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', opacity: !waitVal ? 0.5 : 1, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (waitVal) e.currentTarget.style.background = '#6D28D9'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#7C3AED'; }}
                    >Save</button>
                    <button
                      onClick={() => setShowWaitInput(false)}
                      style={{
                        padding: '4px 8px', borderRadius: '14px',
                        border: 'none', background: 'transparent',
                        color: '#9CA3AF', fontSize: '11px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#6B7280'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                    >✕</button>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── StatPill (summary footer) ─── */
const StatPill = ({ label, val, color, icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 18px',
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: '12px',
    flex: '1 1 120px',
    minWidth: 0,
    transition: 'box-shadow 0.15s',
    boxShadow: t.shadow,
  }}
  onMouseEnter={e => e.currentTarget.style.boxShadow = t.shadowMd}
  onMouseLeave={e => e.currentTarget.style.boxShadow = t.shadow}
  >
    <span style={{
      width: '32px', height: '32px', borderRadius: '8px',
      background: `${color}18`,
      border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '14px', flexShrink: 0,
    }}>{icon}</span>
    <div>
      <p style={{ fontSize: '18px', fontWeight: 700, color: t.text, margin: 0, lineHeight: 1.1, fontFamily: '"Playfair Display", Georgia, serif' }}>{val}</p>
      <p style={{ fontSize: '11px', color: t.textMuted, margin: 0, letterSpacing: '0.04em', marginTop: '2px' }}>{label}</p>
    </div>
  </div>
);

/* ─── Skeleton ─── */
const SkeletonCard = ({ delay = 0 }) => (
  <div style={{
    background: t.surface, border: `1px solid ${t.border}`,
    borderRadius: t.radius, padding: '20px', display: 'flex', gap: '14px',
    animation: `slideUp 0.3s ease both`, animationDelay: `${delay}ms`,
  }}>
    <div style={{ width: '4px', borderRadius: '4px', background: t.surfaceAlt, animation: 'shimmer 1.5s ease-in-out infinite' }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[['55%', '14px'], ['35%', '10px'], ['75%', '10px']].map(([w, h], i) => (
        <div key={i} style={{
          width: w, height: h, background: t.surfaceAlt,
          borderRadius: '5px', animation: 'shimmer 1.5s ease-in-out infinite',
          animationDelay: `${i * 150}ms`,
        }} />
      ))}
    </div>
  </div>
);

/* ─── EmptyState ─── */
const EmptyState = ({ emoji, title, sub, action }) => (
  <div style={{ textAlign: 'center', padding: '56px 24px' }}>
    <div style={{ fontSize: '44px', marginBottom: '16px', opacity: 0.4, animation: 'slideUp 0.4s ease both' }}>{emoji}</div>
    <h3 style={{
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '18px', fontWeight: 700, color: t.text, margin: '0 0 8px',
    }}>{title}</h3>
    <p style={{ color: t.textMuted, fontSize: '13px', margin: '0 0 20px', maxWidth: '260px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>{sub}</p>
    {action}
  </div>
);

/* ─── Main ─── */
const ViewOrders = () => {
  const navigate = useNavigate();
  const {
    orders, pendingOrders, userOrders, loading, error,
    isUserAdmin, userRole, wsConnected, manualReconnect,
    updateOrderStatus, fetchAllOrders, fetchPendingOrders, clearError,
  } = useOrderManagement();

  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/'); return; }
  }, [navigate]);

  useEffect(() => {
    setActiveTab(isUserAdmin ? 'pending' : 'myOrders');
  }, [isUserAdmin]);

  const ROLE_SUBTITLES = {
    CASHIER: 'View orders and manage payment status',
    SERVER:  'View orders and mark deliveries',
    COOK:    'View orders, update status and wait times',
    admin:   'Manage and track all restaurant orders',
  };
  const headerSub = ROLE_SUBTITLES[userRole] || 'Track your order history';

  const handleStatusUpdate = async (orderId, newStatus) => {
    try { await updateOrderStatus(orderId, newStatus); }
    catch (err) { console.error('Error updating status:', err); }
  };

  const tabs = isUserAdmin
    ? [
        { id: 'pending',         label: 'Pending',          count: pendingOrders.length },
        { id: 'preparing',       label: 'Preparing',        count: orders.filter(o => o.status === 'preparing').length },
        { id: 'ready',           label: 'Ready',            count: orders.filter(o => o.status === 'ready').length },
        { id: 'outForDelivery',  label: 'Out for Delivery', count: orders.filter(o => o.status === 'out_for_delivery').length },
        { id: 'delivered',       label: 'Delivered',        count: orders.filter(o => o.status === 'delivered').length },
        { id: 'completed',       label: 'Completed',        count: orders.filter(o => o.status === 'completed').length },
        { id: 'all',             label: 'All Orders',       count: orders.length },
      ]
    : [{ id: 'myOrders', label: 'My Orders', count: userOrders.length }];

  const currentOrders =
    activeTab === 'pending'        ? pendingOrders :
    activeTab === 'preparing'      ? orders.filter(o => o.status === 'preparing') :
    activeTab === 'ready'          ? orders.filter(o => o.status === 'ready') :
    activeTab === 'outForDelivery' ? orders.filter(o => o.status === 'out_for_delivery') :
    activeTab === 'delivered'      ? orders.filter(o => o.status === 'delivered') :
    activeTab === 'completed'      ? orders.filter(o => o.status === 'completed') :
    activeTab === 'all'            ? orders :
    userOrders;

  // Show actions panel for any staff/admin role on the management tabs
  const showActionsForTab = isUserAdmin && activeTab !== 'myOrders';

  if (!isAuthenticated()) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: t.bg,
      fontFamily: '"DM Sans", system-ui, sans-serif',
      padding: '36px 16px 80px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideUp   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse     { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes shimmer   { 0%,100%{opacity:1;} 50%{opacity:0.45;} }
        @keyframes fadeIn    { from{opacity:0;} to{opacity:1;} }
        @keyframes stripPulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        button { cursor: pointer; }
        select { cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: '880px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          marginBottom: '32px',
          animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            flexWrap: 'wrap', gap: '16px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: t.accentLight,
                  border: `1px solid ${t.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px',
                }}>📋</div>
                <h1 style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '28px', fontWeight: 700, color: t.text,
                  margin: 0, letterSpacing: '-0.02em',
                }}>Orders</h1>
              </div>
              <p style={{ fontSize: '13px', color: t.textLight, margin: 0, paddingLeft: '48px' }}>
                {headerSub}
              </p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* WS pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '7px 14px',
                background: wsConnected ? '#F0FDF4' : t.surfaceAlt,
                border: `1px solid ${wsConnected ? '#10B98130' : t.border}`,
                borderRadius: '20px',
                fontSize: '12px', fontWeight: 600,
                color: wsConnected ? '#065F46' : t.textMuted,
                cursor: !wsConnected ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
              onClick={!wsConnected ? manualReconnect : undefined}
              title={!wsConnected ? 'Click to reconnect' : 'Live connection active'}
              >
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: wsConnected ? '#10B981' : '#9CA3AF',
                  flexShrink: 0,
                  ...(wsConnected ? { animation: 'pulse 2s ease-in-out infinite' } : {}),
                }} />
                {wsConnected ? 'Live' : 'Offline'}
              </div>

              {isUserAdmin && (
                <button
                  onClick={() => { fetchAllOrders(); fetchPendingOrders(); }}
                  disabled={loading}
                  style={{
                    padding: '7px 14px',
                    background: t.surface, border: `1px solid ${t.border}`,
                    borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    color: t.textMuted, display: 'flex', alignItems: 'center', gap: '6px',
                    fontFamily: 'inherit', transition: 'all 0.15s', opacity: loading ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accentDark; e.currentTarget.style.background = t.accentLight; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = t.surface; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={loading ? { animation: 'spin 0.8s linear infinite' } : {}}>
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Refresh
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '20px',
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: '12px', padding: '4px',
          overflowX: 'auto',
          animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.05s both',
          boxShadow: t.shadow,
        }}>
          {tabs.map(({ id, label, count }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding: '8px 20px',
                borderRadius: '9px', border: 'none',
                background: active ? t.accent : 'transparent',
                color: active ? '#fff' : t.textMuted,
                fontSize: '13px', fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '7px',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.accentLight; if (!active) e.currentTarget.style.color = t.accentDark; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; if (!active) e.currentTarget.style.color = t.textMuted; }}
              >
                {label}
                {count > 0 && (
                  <span style={{
                    background: active ? 'rgba(255,255,255,0.25)' : t.accentLight,
                    color: active ? '#fff' : t.accentDark,
                    fontSize: '10px', fontWeight: 700,
                    padding: '2px 7px', borderRadius: '10px',
                    minWidth: '22px', textAlign: 'center',
                    transition: 'all 0.2s',
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px',
            background: '#FEF2F2', border: '1px solid #EF444430',
            borderRadius: t.radiusSm, marginBottom: '16px',
            fontSize: '13px', color: '#B91C1C',
            animation: 'fadeIn 0.2s ease',
          }}>
            <span>⚠ {error}</span>
            <button onClick={clearError} style={{
              background: 'none', border: 'none', color: '#B91C1C',
              fontSize: '16px', padding: '0 4px', lineHeight: 1,
              cursor: 'pointer',
            }}>×</button>
          </div>
        )}

        {/* ── Orders List ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading && currentOrders.length === 0 ? (
            [0, 100, 200].map(d => <SkeletonCard key={d} delay={d} />)
          ) : currentOrders.length === 0 ? (
            <div style={{
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: t.radius, boxShadow: t.shadow,
            }}>
              {activeTab === 'pending' && <EmptyState emoji="📋" title="No pending orders" sub="New orders will appear here in real-time as customers place them." />}
              {activeTab === 'myOrders' && (
                <EmptyState emoji="🛒" title="No orders yet" sub="Browse the menu and place your first order."
                  action={
                    <button onClick={() => navigate('/')} style={{
                      padding: '10px 24px',
                      background: t.accent, color: '#fff', border: 'none',
                      borderRadius: t.radiusSm, fontSize: '13px', fontWeight: 600,
                      fontFamily: 'inherit', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = t.accentDark}
                    onMouseLeave={e => e.currentTarget.style.background = t.accent}
                    >Browse Menu</button>
                  }
                />
              )}
              {activeTab === 'all' && <EmptyState emoji="📈" title="No orders found" sub="All restaurant orders will appear here." />}
            </div>
          ) : (
            currentOrders.map((order, i) => (
              <OrderCard
                key={order.orderNumber || i}
                order={order}
                showActions={showActionsForTab}
                userRole={userRole}
                onStatusUpdate={handleStatusUpdate}
                onCardClick={() => setSelectedOrder(order)}
                loading={loading}
                wsConnected={wsConnected}
                manualReconnect={manualReconnect}
                animDelay={i * 35}
              />
            ))
          )}
        </div>

        {/* ── Stats Footer (staff/admin only) ── */}
        {isUserAdmin && orders.length > 0 && (
          <div style={{
            marginTop: '36px',
            display: 'flex', flexWrap: 'wrap', gap: '10px',
            animation: 'slideUp 0.4s ease 0.2s both',
          }}>
            <StatPill label="Pending"    val={pendingOrders.length}                              color={STATUS.pending.dot}   icon="⏳" />
            <StatPill label="Total"      val={orders.length}                                     color={t.accent}             icon="📋" />
            <StatPill label="Completed"  val={orders.filter(o => o.status === 'completed').length} color={STATUS.completed.dot} icon="✓" />
            <StatPill label="Cancelled"  val={orders.filter(o => o.status === 'cancelled').length} color={STATUS.cancelled.dot} icon="✕" />
            <StatPill
              label="Revenue"
              val={formatPrice(orders.filter(o => o.status === 'completed').reduce((s, o) => s + (Number(o.finalAmount) || 0), 0))}
              color="#10B981" icon="₹"
            />
          </div>
        )}
      </div>
      {selectedOrder && (
        <OrderItemsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default ViewOrders;