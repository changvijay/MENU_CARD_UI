import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FoodItems from '../components/FoodItems';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cafeTablesApi } from '../services/apiService';

/* ── Token helpers (no external deps) ── */
const getValidToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

/* ── Design tokens (matches app palette) ── */
const t = {
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F3EE',
  border: '#E8E4DC',
  accent: '#C8823A',
  accentLight: '#FDF3E7',
  accentDark: '#A3651E',
  text: '#1C1917',
  textMuted: '#6B6560',
  textLight: '#A09B95',
  red: '#B91C1C',
  redBg: '#FEF2F2',
  green: '#2D6A4F',
  greenBg: '#EDFAF4',
  radius: '14px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

/* ── Inline form card ── */
const CenteredCard = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: t.bg,
    fontFamily: '"DM Sans", system-ui, sans-serif',
  }}>
    <div style={{
      width: '100%',
      maxWidth: '420px',
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: t.radius,
      boxShadow: t.shadow,
      padding: '36px 32px',
    }}>
      {children}
    </div>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
  </div>
);

/* ── Loading spinner ── */
const Spinner = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ animation: 'spin 0.8s linear infinite', display: 'block' }}>
    <path d="M21 12a9 9 0 1 1-18 0" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

/* ── Main component ── */
const Home = () => {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const { setTableId, setDeliveryMode } = useCart();
  const { login, user } = useAuth();

  // Table-scan flow state
  const [phase, setPhase] = useState('idle'); // idle | checking | login | fetching | success | error
  const [flowError, setFlowError] = useState('');

  /* ── Fetch cafe tables and match the scanned tableNumber ── */
  const fetchAndMatchTable = async (tblNum) => {
    const targetTable = tblNum || tableNumber;
    setPhase('fetching');
    setFlowError('');
    try {
      const tables = await cafeTablesApi.getAll();

      const matched = tables.find(
        (tbl) => String(tbl.tableNumber).toLowerCase() === String(targetTable).toLowerCase()
      );
      console.log('Scanned table number:', targetTable);
      console.log('Matched table:', matched);
      if (!matched) {
        setFlowError(`Table "${targetTable}" was not found. Please check with a staff member.`);
        setPhase('error');
        return;
      }

      if (!matched.isActive) {
        setFlowError(`Table "${targetTable}" is currently inactive. Please check with a staff member.`);
        setPhase('error');
        return;
      }

      // Pre-fill cart and navigate to checkout
      setTableId(matched.id);  // numeric FK sent to API
      setDeliveryMode('dinein');
      sessionStorage.setItem('scanned_table', JSON.stringify(matched));
      sessionStorage.setItem('tableNumber', targetTable);  // Store the table number
      sessionStorage.setItem('tableId', matched.id);  // Store the table ID
      sessionStorage.removeItem('pending_table_scan');
      setPhase('success');
      navigate('/checkout', { state: { scannedTable: matched, tableNumber: targetTable, tableId: matched.id } });
    } catch (err) {
      setFlowError(err.message || 'Failed to verify table. Please try again.');
      setPhase('error');
    }
  };

  /* ── Recovery: if auth redirect lost the table URL, redirect back to it ── */
  useEffect(() => {
    if (tableNumber) {
      sessionStorage.removeItem('pending_table_scan');
      return;
    }
    const pendingTable = sessionStorage.getItem('pending_table_scan');
    if (pendingTable && getValidToken()) {
      sessionStorage.removeItem('pending_table_scan');
      navigate(`/${pendingTable}`, { replace: true });
    }
  }, [tableNumber, navigate, user]);

  /* ── On mount and when user logs in: if tableNumber present, begin flow ── */
  useEffect(() => {
    if (!tableNumber) return;
    
    const token = getValidToken();
    console.log('Token check:', !!token, 'User:', user);
    
    if (!token) {
      setPhase('login');
    } else {
      // Token exists, fetch table data
      fetchAndMatchTable();
    }
  }, [tableNumber, user]);

  /* ── No tableNumber → render normal menu ── */
  if (!tableNumber) {
    return <FoodItems />;
  }

  /* ── Checking phase (brief) ── */
  if (phase === 'checking') {
    return (
      <CenteredCard>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: t.accent }}>
            <Spinner />
          </div>
          <p style={{ color: t.textMuted, fontSize: '14px', margin: 0 }}>
            Verifying session…
          </p>
        </div>
      </CenteredCard>
    );
  }

  /* ── Fetching phase ── */
  if (phase === 'fetching') {
    return (
      <CenteredCard>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: t.accent }}>
            <Spinner />
          </div>
          <p style={{ fontWeight: 600, fontSize: '15px', color: t.text, marginBottom: '6px' }}>
            Looking up Table {tableNumber}
          </p>
          <p style={{ color: t.textLight, fontSize: '13px', margin: 0 }}>
            Fetching table information…
          </p>
        </div>
      </CenteredCard>
    );
  }

  /* ── Login phase ── */
  if (phase === 'login') {
    return (
      <CenteredCard>
        {/* Table badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: t.accentLight,
          color: t.accentDark,
          fontSize: '12px',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: '20px',
          marginBottom: '20px',
          letterSpacing: '0.04em',
        }}>
          🪑 TABLE {tableNumber}
        </div>

        <h2 style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '22px',
          fontWeight: 700,
          color: t.text,
          margin: '0 0 6px',
        }}>
          Sign in to continue
        </h2>
        <p style={{ color: t.textMuted, fontSize: '14px', margin: '0 0 24px' }}>
          Sign in to view the menu and order from your table.
        </p>

        <button
          onClick={() => {
            sessionStorage.setItem('pending_table_scan', tableNumber);
            login(2);
          }}
          style={{
            width: '100%',
            padding: '12px',
            background: t.accent,
            color: '#fff',
            border: 'none',
            borderRadius: t.radiusSm,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
        >
          Sign In
        </button>
      </CenteredCard>
    );
  }

  /* ── Error phase ── */
  if (phase === 'error') {
    return (
      <CenteredCard>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: t.redBg, border: `2px solid ${t.red}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.red}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <h2 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '20px', fontWeight: 700, color: t.text,
            margin: '0 0 10px',
          }}>
            Table Not Found
          </h2>

          <p style={{ color: t.textMuted, fontSize: '14px', margin: '0 0 24px', lineHeight: '1.6' }}>
            {flowError}
          </p>

          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              padding: '12px',
              background: t.text,
              color: '#fff',
              border: 'none',
              borderRadius: t.radiusSm,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Browse Menu
          </button>
        </div>
      </CenteredCard>
    );
  }

  /* ── Success / fallback (navigate fires immediately, this is rarely shown) ── */
  return (
    <CenteredCard>
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: t.green }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p style={{ fontWeight: 600, fontSize: '15px', color: t.text, margin: 0 }}>
          Table confirmed — redirecting…
        </p>
      </div>
    </CenteredCard>
  );
};

export default Home;