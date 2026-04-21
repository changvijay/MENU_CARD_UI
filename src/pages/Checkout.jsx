import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrderManagement } from '../hooks/useOrderManagement';
import { isAuthenticated } from '../services/apiService';

/* ─── Inline design tokens (no external deps) ─── */
const tokens = {
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F3EE',
  border: '#E8E4DC',
  borderLight: '#F0EDE6',
  accent: '#C8823A',
  accentLight: '#FDF3E7',
  accentDark: '#A3651E',
  text: '#1C1917',
  textMuted: '#6B6560',
  textLight: '#A09B95',
  green: '#2D6A4F',
  greenBg: '#EDFAF4',
  red: '#B91C1C',
  redBg: '#FEF2F2',
  shadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  shadowHover: '0 4px 20px rgba(0,0,0,0.10)',
  radius: '14px',
  radiusSm: '8px',
};

/* ─── Reusable atoms ─── */
const Card = ({ children, style = {} }) => (
  <div style={{
    background: tokens.surface,
    border: `1px solid ${tokens.border}`,
    borderRadius: tokens.radius,
    boxShadow: tokens.shadow,
    padding: '28px',
    ...style,
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: '20px' }}>
    <h2 style={{
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '18px',
      fontWeight: 700,
      color: tokens.text,
      letterSpacing: '-0.01em',
      margin: 0,
    }}>{children}</h2>
    {sub && <p style={{ fontSize: '12px', color: tokens.textLight, marginTop: '3px' }}>{sub}</p>}
  </div>
);

const Label = ({ children }) => (
  <label style={{
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: tokens.textMuted,
    marginBottom: '7px',
  }}>{children}</label>
);

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  border: `1px solid ${tokens.border}`,
  borderRadius: tokens.radiusSm,
  background: tokens.surfaceAlt,
  fontSize: '14px',
  color: tokens.text,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
};

/* ─── Success State ─── */
const SuccessView = ({ orderResponse, navigate }) => (
  <div style={{
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: tokens.bg,
    fontFamily: '"DM Sans", system-ui, sans-serif',
  }}>
    <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
      {/* Animated checkmark ring */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: tokens.greenBg,
        border: `2px solid ${tokens.green}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={tokens.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '26px',
        fontWeight: 700,
        color: tokens.text,
        margin: '0 0 10px',
      }}>Order Confirmed!</h2>

      <p style={{ color: tokens.textMuted, fontSize: '15px', margin: '0 0 6px' }}>
        Order <strong style={{ color: tokens.text }}>#{orderResponse.orderNumber}</strong> has been received.
      </p>
      <p style={{ color: tokens.textLight, fontSize: '13px', margin: '0 0 32px' }}>
        Redirecting to your orders in a moment…
      </p>

      {/* Progress bar */}
      <div style={{
        height: '3px',
        background: tokens.border,
        borderRadius: '2px',
        margin: '0 0 28px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: tokens.green,
          animation: 'fillBar 3s linear forwards',
          borderRadius: '2px',
        }} />
      </div>

      <button
        onClick={() => navigate('/orders')}
        style={{
          width: '100%',
          padding: '13px',
          background: tokens.text,
          color: '#fff',
          border: 'none',
          borderRadius: tokens.radiusSm,
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          letterSpacing: '0.02em',
          fontFamily: 'inherit',
        }}
      >
        View Orders
      </button>
    </div>

    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
      @keyframes popIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes fillBar { from { width: 0% } to { width: 100% } }
    `}</style>
  </div>
);

/* ─── Quantity Stepper ─── */
const Stepper = ({ value, onDecrement, onIncrement }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <button onClick={onDecrement} style={{
      width: '30px', height: '30px', borderRadius: '50%',
      border: `1px solid ${tokens.border}`, background: tokens.surface,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', fontSize: '16px', color: tokens.textMuted,
      transition: 'all 0.15s', lineHeight: 1,
    }}>−</button>
    <span style={{ width: '24px', textAlign: 'center', fontWeight: 600, fontSize: '14px', color: tokens.text }}>
      {value}
    </span>
    <button onClick={onIncrement} style={{
      width: '30px', height: '30px', borderRadius: '50%',
      border: `1px solid ${tokens.border}`, background: tokens.surface,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', fontSize: '16px', color: tokens.textMuted,
      transition: 'all 0.15s', lineHeight: 1,
    }}>+</button>
  </div>
);

/* ─── Main Component ─── */
const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cart, subtotal, tax, discount, finalAmount, itemCount,
    updateQuantity, removeItem, clearCart,
    setTableId, setDeliveryMode, setNotes, getOrderData,
  } = useCart();

  const { placeOrder, loading, error, clearError } = useOrderManagement();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderResponse, setOrderResponse] = useState(null);
  const orderPlacedRef = useRef(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);

  // Resolve scanned table once and keep it stable for the component's lifetime
  const [scannedTable] = useState(() => {
    try {
      return (
        location.state?.scannedTable ||
        JSON.parse(sessionStorage.getItem('scanned_table') || 'null')
      );
    } catch {
      return null;
    }
  });

  // Table number only required for dine-in
  const needsTable = cart.deliveryMode === 'dinein';

  // Pre-fill table from QR-code scan
  useEffect(() => {
    if (scannedTable) {
      setTableId(scannedTable.id);   // numeric FK for API
      setDeliveryMode('dinein');
      sessionStorage.removeItem('scanned_table');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all active tables for the manual dropdown (skip if came via QR)
  useEffect(() => {
    if (scannedTable) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setTablesLoading(true);
    fetch('https://menu-card-api-yvzycdnaqq-el.a.run.app/api/operations/cafe-tables', {
      headers: { 'Accept': 'text/plain', 'Authorization': `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const active = (json.data || []).filter((t) => t.isActive);
        setAvailableTables(active);
      })
      .catch(() => setAvailableTables([]))
      .finally(() => setTablesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/'); return; }
  }, [navigate]);

  useEffect(() => {
    if (!loading && itemCount === 0 && !orderPlacedRef.current) navigate('/');
  }, [itemCount, loading, navigate]);

  // When switching away from dine-in, reset tableId to 0
  const handleDeliveryModeChange = (mode) => {
    setDeliveryMode(mode);
    if (mode !== 'dinein') setTableId(0);
  };

  const handlePlaceOrder = async () => {
    if (itemCount === 0) return;
    clearError();
    try {
      // Force tableId = 0 for non-dine-in modes
      if (!needsTable) setTableId(0);
      const orderData = getOrderData();
      const response = await placeOrder(orderData);
      setOrderResponse(response);
      setOrderPlaced(true);
      orderPlacedRef.current = true;
      clearCart();
      setTimeout(() => navigate('/orders'), 3000);
    } catch (err) {
      console.error('Error placing order:', err);
    }
  };

  const formatPrice = (price) => `₹${price.toFixed(2)}`;

  if (orderPlaced && orderResponse) {
    return <SuccessView orderResponse={orderResponse} navigate={navigate} />;
  }

  const inputStyle = (name) => ({
    ...inputBase,
    borderColor: focusedInput === name ? tokens.accent : tokens.border,
    boxShadow: focusedInput === name ? `0 0 0 3px ${tokens.accentLight}` : 'none',
  });

  const canPlace = !loading && itemCount > 0 && (needsTable ? !!cart.tableId : true);

  return (
    <div
      className="checkout-page"
      style={{
        minHeight: '100vh',
        background: tokens.bg,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        padding: '32px 16px 64px',
      }}>
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { outline: none; }
        button:hover { opacity: 0.88; }
        .item-row:hover { background: ${tokens.accentLight} !important; }
        .remove-btn { color: ${tokens.textLight}; font-size: 12px; cursor: pointer; background: none; border: none; padding: 0; font-family: inherit; transition: color 0.15s; }
        .remove-btn:hover { color: ${tokens.red} !important; opacity: 1 !important; }
        .delivery-chip { padding: 8px 16px; border-radius: 20px; border: 1.5px solid ${tokens.border}; background: transparent; cursor: pointer; font-size: 13px; font-weight: 500; color: ${tokens.textMuted}; transition: all 0.15s; font-family: inherit; }
        .delivery-chip.active { border-color: ${tokens.accent}; background: ${tokens.accentLight}; color: ${tokens.accentDark}; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .checkout-grid { animation: slideUp 0.35s ease; }
      `}</style>

      <div style={{ maxWidth: '980px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: tokens.textMuted, fontSize: '13px', display: 'flex',
              alignItems: 'center', gap: '5px', padding: 0, fontFamily: 'inherit',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <h1 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '28px',
            fontWeight: 700,
            color: tokens.text,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>Checkout</h1>
          <span style={{
            marginLeft: 'auto',
            background: tokens.accentLight,
            color: tokens.accentDark,
            fontSize: '12px',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '20px',
          }}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        </div>

        {/* ── Two-column grid ── */}
        <div className="checkout-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,0.85fr)',
          gap: '24px',
          alignItems: 'start',
        }}>

          {/* ── LEFT: Order Items ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card>
              <SectionTitle sub="Review and adjust your selections">Your Items</SectionTitle>

              {cart.items.length === 0 ? (
                <p style={{ color: tokens.textLight, textAlign: 'center', padding: '32px 0', fontSize: '14px' }}>
                  Your cart is empty
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {cart.items.map((item, index) => (
                    <div
                      key={index}
                      className="item-row"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 12px',
                        borderRadius: tokens.radiusSm,
                        transition: 'background 0.15s',
                        background: 'transparent',
                      }}
                    >
                      {/* Image */}
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: `1px solid ${tokens.borderLight}` }}
                        />
                      ) : (
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '10px',
                          background: tokens.surfaceAlt, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${tokens.borderLight}`,
                          fontSize: '22px',
                        }}>🍽️</div>
                      )}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: tokens.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: tokens.textLight }}>
                          {formatPrice(item.unitPrice)} each
                        </p>
                        {item.specialRequest && (
                          <p style={{ margin: '3px 0 0', fontSize: '11px', color: tokens.accent, fontStyle: 'italic' }}>
                            "{item.specialRequest}"
                          </p>
                        )}
                      </div>

                      {/* Stepper */}
                      <Stepper
                        value={item.quantity}
                        onDecrement={() => updateQuantity(index, item.quantity - 1)}
                        onIncrement={() => updateQuantity(index, item.quantity + 1)}
                      />

                      {/* Price + Remove */}
                      <div style={{ textAlign: 'right', minWidth: '68px' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: tokens.text }}>
                          {formatPrice(item.subtotal)}
                        </p>
                        <button className="remove-btn" onClick={() => removeItem(index)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Delivery Details card — moved below items on left */}
            <Card>
              <SectionTitle sub="Tell us how you'd like this served">Delivery Details</SectionTitle>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Delivery mode chips */}
                <div>
                  <Label>Service Type</Label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { value: 'dinein', label: '🪑 Dine In' },
                      { value: 'takeaway', label: '📦 Takeaway' },
                      { value: 'delivery', label: '🛵 Delivery' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        className={`delivery-chip${cart.deliveryMode === value ? ' active' : ''}`}
                        onClick={() => handleDeliveryModeChange(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table number — only shown for dine-in */}
                {needsTable && (
                  <div>
                    <Label>Table Number *</Label>

                    {/* ── QR scan: locked display ── */}
                    {scannedTable ? (
                      <>
                        <input
                          type="text"
                          disabled
                          value={scannedTable.tableNumber}
                          style={{
                            ...inputStyle('table'),
                            background: tokens.accentLight,
                            borderColor: `${tokens.accent}44`,
                            color: tokens.accentDark,
                            cursor: 'not-allowed',
                            fontWeight: 600,
                          }}
                        />
                        <p style={{ fontSize: '11px', color: tokens.accent, margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          Pre-filled from QR scan
                        </p>
                      </>
                    ) : (
                      /* ── Manual: dropdown of active tables ── */
                      <select
                        value={cart.tableId || ''}
                        onChange={(e) => setTableId(parseInt(e.target.value) || null)}
                        onFocus={() => setFocusedInput('table')}
                        onBlur={() => setFocusedInput(null)}
                        style={{
                          ...inputStyle('table'),
                          cursor: tablesLoading ? 'wait' : 'pointer',
                        }}
                        disabled={tablesLoading}
                      >
                        <option value="">
                          {tablesLoading ? 'Loading tables…' : '— Select a table —'}
                        </option>
                        {availableTables.map((tbl) => (
                          <option key={tbl.id} value={tbl.id}>
                            {tbl.tableNumber}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Special instructions */}
                <div>
                  <Label>Special Instructions</Label>
                  <textarea
                    value={cart.notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onFocus={() => setFocusedInput('notes')}
                    onBlur={() => setFocusedInput(null)}
                    style={{ ...inputStyle('notes'), height: '80px', resize: 'none' }}
                    placeholder="Dietary needs, allergies, preferences…"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="summary-sticky" style={{ position: 'sticky', top: '24px' }}>
            <Card>
              <SectionTitle sub="Estimated total before payment">Order Summary</SectionTitle>

              {/* Line items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: tokens.textMuted }}>
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span style={{ color: tokens.text, fontWeight: 500 }}>{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: tokens.textMuted }}>
                  <span>Tax (10%)</span>
                  <span style={{ color: tokens.text, fontWeight: 500 }}>{formatPrice(tax)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: tokens.green }}>
                    <span>Discount applied</span>
                    <span style={{ fontWeight: 600 }}>−{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: tokens.border, margin: '0 0 16px' }} />

              {/* Total */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '24px',
              }}>
                <span style={{ fontWeight: 600, fontSize: '15px', color: tokens.text }}>Total</span>
                <span style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: tokens.text,
                  letterSpacing: '-0.02em',
                }}>{formatPrice(finalAmount)}</span>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: tokens.redBg,
                  border: `1px solid ${tokens.red}22`,
                  borderRadius: tokens.radiusSm,
                  padding: '10px 14px',
                  color: tokens.red,
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* Missing table warning — only for dine-in */}
              {needsTable && !cart.tableId && (
                <div style={{
                  background: tokens.accentLight,
                  borderRadius: tokens.radiusSm,
                  padding: '10px 14px',
                  color: tokens.accentDark,
                  fontSize: '12px',
                  marginBottom: '16px',
                  fontWeight: 500,
                }}>
                  ⚠️ Please enter a table number to continue.
                </div>
              )}

              {/* CTA Button — hidden on mobile, shown on desktop */}
              <button
                className="desktop-cta"
                onClick={handlePlaceOrder}
                disabled={!canPlace}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: canPlace ? tokens.accent : tokens.border,
                  color: canPlace ? '#fff' : tokens.textLight,
                  border: 'none',
                  borderRadius: tokens.radiusSm,
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: canPlace ? 'pointer' : 'not-allowed',
                  letterSpacing: '0.01em',
                  transition: 'background 0.2s',
                  fontFamily: 'inherit',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".25"/>
                      <path d="M21 12a9 9 0 0 0-9-9"/>
                    </svg>
                    Placing Order…
                  </>
                ) : (
                  <>
                    Place Order
                    <span style={{ opacity: 0.85, fontWeight: 400, fontSize: '13px' }}>· {formatPrice(finalAmount)}</span>
                  </>
                )}
              </button>

              <p style={{ fontSize: '11px', color: tokens.textLight, textAlign: 'center', marginTop: '12px', lineHeight: '1.6' }}>
                By placing this order, you agree to our <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>terms & conditions</span>.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky CTA bar ── */}
      <div
        className="mobile-cta-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: tokens.surface,
          borderTop: `1px solid ${tokens.border}`,
          padding: '12px 16px',
          display: 'none', // overridden by CSS on mobile
          flexDirection: 'column',
          gap: '6px',
          zIndex: 100,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.07)',
        }}
      >
        {/* Mini summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontSize: '12px', color: tokens.textMuted }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} · Tax {formatPrice(tax)}
          </span>
          <span style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700, fontSize: '18px', color: tokens.text,
          }}>{formatPrice(finalAmount)}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={!canPlace}
          style={{
            width: '100%',
            padding: '14px',
            background: canPlace ? tokens.accent : tokens.border,
            color: canPlace ? '#fff' : tokens.textLight,
            border: 'none',
            borderRadius: tokens.radiusSm,
            fontSize: '15px',
            fontWeight: 600,
            cursor: canPlace ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? 'Placing Order…' : 'Place Order'}
        </button>
        {needsTable && !cart.tableId && (
          <p style={{ fontSize: '11px', color: tokens.accentDark, textAlign: 'center', margin: 0 }}>
            ⚠️ Enter a table number above to continue
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Mobile-first responsive ── */
        @media (max-width: 680px) {
          .checkout-grid { grid-template-columns: 1fr !important; }

          /* Tighter page padding on small screens */
          .checkout-page { padding: 16px 12px 100px !important; }

          /* Smaller header */
          .checkout-header h1 { font-size: 22px !important; }

          /* Card padding reduction */
          .checkout-grid > div > div,
          .checkout-grid > div > div > div {
            padding: 18px !important;
          }

          /* Item row: stack image+info above stepper+price */
          .item-row {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .item-row-right {
            width: 100% !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }

          /* Sticky CTA bar pinned to bottom on mobile */
          .mobile-cta-bar {
            display: flex !important;
          }

          /* Hide the in-card CTA button on mobile */
          .desktop-cta { display: none !important; }

          /* Summary card — remove sticky on mobile */
          .summary-sticky { position: static !important; }
        }

        @media (min-width: 681px) {
          .mobile-cta-bar { display: none !important; }
          .desktop-cta { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Checkout;