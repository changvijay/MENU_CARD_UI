/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { businessDashboardApi } from '../../services/apiService';

// ─── Design tokens ────────────────────────────────────────────────────────────
const STYLE = `
  .bd-page { font-family: 'Inter', sans-serif; background: #FDFCF9; min-height: 100vh; color: #1e293b; padding: 24px; }

  .bd-header { margin-bottom: 28px; }
  .bd-title { font-size: 1.75rem; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
  .bd-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 4px; }

  /* Range filter pills */
  .bd-range-group { display: flex; gap: 6px; flex-wrap: wrap; }
  .bd-range-btn {
    padding: 7px 16px; border-radius: 9999px; font-size: 0.8125rem; font-weight: 500;
    border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer;
    transition: all 0.15s; line-height: 1;
  }
  .bd-range-btn:hover { border-color: #3b82f6; color: #3b82f6; }
  .bd-range-btn.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }

  /* Cards */
  .bd-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
    padding: 20px 24px; box-shadow: 0 1px 3px rgb(0 0 0 / .06), 0 1px 2px rgb(0 0 0 / .04);
    transition: box-shadow 0.2s;
  }
  .bd-card:hover { box-shadow: 0 4px 16px rgb(0 0 0 / .08); }
  .bd-card-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 12px; }

  /* KPI cards */
  .bd-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
  .bd-kpi-value { font-size: 1.875rem; font-weight: 700; color: #0f172a; line-height: 1.1; }
  .bd-kpi-label { font-size: 0.8125rem; color: #64748b; margin-top: 4px; }
  .bd-delta { display: inline-flex; align-items: center; gap: 3px; font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 9999px; margin-top: 10px; }
  .bd-delta.up { background: #dcfce7; color: #16a34a; }
  .bd-delta.down { background: #fee2e2; color: #dc2626; }
  .bd-delta.neutral { background: #f1f5f9; color: #64748b; }
  .bd-kpi-icon { font-size: 1.5rem; margin-bottom: 8px; }

  /* Alert badge */
  .bd-alert-badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px;
    border-radius: 8px; font-size: 0.8rem; font-weight: 600;
    background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
  }

  /* Stock bar */
  .bd-stock-bar-bg { height: 8px; border-radius: 4px; background: #f1f5f9; overflow: hidden; margin-top: 6px; }
  .bd-stock-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }

  /* Layout helpers */
  .bd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .bd-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
  .bd-grid-3-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 20px; }
  .bd-mb { margin-bottom: 20px; }

  /* Empty / loading state */
  .bd-empty { color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 24px 0; }

  /* Section heading */
  .bd-section-heading { font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

  /* Top item row */
  .bd-item-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
  .bd-item-row:last-child { border-bottom: none; }
  .bd-item-rank { width: 24px; height: 24px; border-radius: 50%; background: #f1f5f9; color: #64748b; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .bd-item-rank.gold { background: #fef3c7; color: #b45309; }
  .bd-item-share-bar { flex: 1; height: 6px; border-radius: 3px; background: #f1f5f9; margin: 0 10px; overflow: hidden; }
  .bd-item-share-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); }

  /* Cash flow */
  .bd-cf-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f8fafc; }
  .bd-cf-row:last-child { border-bottom: none; }
  .bd-cf-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

  /* Responsive */
  @media (max-width: 900px) {
    .bd-grid-2, .bd-grid-3, .bd-grid-3-1 { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .bd-kpi-grid { grid-template-columns: 1fr 1fr; }
    .bd-kpi-value { font-size: 1.4rem; }
    .bd-title { font-size: 1.4rem; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, decimals = 0) =>
  n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtCurrency = (n) =>
  n == null ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const deltaClass = (n) => {
  if (n == null) return 'neutral';
  if (n > 0) return 'up';
  if (n < 0) return 'down';
  return 'neutral';
};

const deltaArrow = (n) => {
  if (n == null) return '';
  return n >= 0 ? '▲' : '▼';
};

// Chart palette
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];
const STATUS_COLORS = { completed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444' };

// Range options
const RANGES = [
  { label: '1 day', value: '1d' },
  { label: '7 days', value: '7d' },
  { label: '1 month', value: '1m' },
  { label: '1 year', value: '1y' },
];

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, currency = false }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgb(0 0 0 / .12)', fontSize: 13 }}>
      {label && <p style={{ color: '#64748b', marginBottom: 6, fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ color: '#64748b' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>
            {currency ? fmtCurrency(p.value) : fmt(p.value, 2)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, delta, prefix = '', suffix = '' }) => (
  <div className="bd-card">
    <div className="bd-kpi-icon">{icon}</div>
    <div className="bd-kpi-value">{prefix}{value}{suffix}</div>
    <div className="bd-kpi-label">{label}</div>
    {delta != null && (
      <div className={`bd-delta ${deltaClass(delta)}`}>
        <span>{deltaArrow(delta)}</span>
        <span>{Math.abs(delta).toFixed(1)}% vs prev period</span>
      </div>
    )}
  </div>
);

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = ({ title, icon, children, className = '' }) => (
  <div className={`bd-card ${className}`}>
    <div className="bd-section-heading">
      <span>{icon}</span>
      <span>{title}</span>
    </div>
    {children}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BusinessDashboardPage() {
  const [range, setRange] = useState('1m');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const load = useCallback(async (r) => {
    setLoading(true);
    setError(null);
    try {
      const result = await businessDashboardApi.get(r);
      setData(result);
      setMeta(result?.meta);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  // ── derived data ────────────────────────────────────────────────────────────
  const summary = data?.summary;
  const revenueTrend = (data?.revenue_trend || []).map((d) => ({
    ...d,
    date: d.period?.slice(5), // "MM-DD"
    revenue: d.revenue,
    orders: d.order_count,
    aov: d.aov,
  }));

  const topItems = (data?.top_items?.top_selling || []).slice(0, 8).map((it, i) => ({
    ...it,
    label: it.food_name || `Item #${it.food_item_id}`,
    rank: i + 1,
  }));

  const leastItems = (data?.top_items?.least_selling || []).map((it, i) => ({
    ...it,
    label: it.food_name || `Item #${it.food_item_id}`,
    rank: i + 1,
  }));

  const topCategories = (data?.top_categories || []).map((c) => ({
    name: c.category_name,
    value: c.total_revenue,
    qty: c.total_qty,
  }));

  const statusData = (data?.status_breakdown || []).map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    pct: s.pct,
    revenue: s.revenue,
  }));

  const peakHours = (data?.peak_hours || [])
    .filter((h) => h.order_count > 0)
    .sort((a, b) => a.hour_24 - b.hour_24)
    .map((h) => ({ hour: h.hour, revenue: h.revenue, orders: h.order_count, aov: h.aov || 0 }));

  const cashFlowSummary = data?.cash_flow?.summary;
  const cashFlowCategories = (data?.cash_flow?.top_categories || []).map((c) => ({
    name: c.category,
    value: c.amount,
  }));

  const customerBehavior = data?.customer_behavior;
  const customerChartData = customerBehavior
    ? [
        { name: 'Repeat', value: customerBehavior.repeat_customers },
        { name: 'First-time', value: customerBehavior.unique_customers - customerBehavior.repeat_customers },
      ].filter((d) => d.value > 0)
    : [];

  const lowStock = data?.inventory?.low_stock || [];
  const menuMix = data?.menu_mix;

  // Format date range for subtitle
  const dateRange = meta
    ? `${meta.from?.slice(0, 10)} → ${meta.to?.slice(0, 10)}`
    : '';

  return (
    <div className="bd-page">
      <style>{STYLE}</style>

      {/* ── Header ── */}
      <div className="bd-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="bd-title">Business Dashboard</h1>
          {dateRange && <p className="bd-subtitle">{dateRange}</p>}
          {!loading && error && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: 6 }}>⚠ {error}</p>
          )}
        </div>
        <div className="bd-range-group">
          {RANGES.map((r) => (
            <button
              key={r.value}
              className={`bd-range-btn${range === r.value ? ' active' : ''}`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
          <button
            className="bd-range-btn"
            onClick={() => load(range)}
            style={{ borderColor: '#e2e8f0' }}
            title="Refresh"
          >
            {loading ? '⟳' : '↺ Refresh'}
          </button>
        </div>
      </div>

      {/* ── Abbreviation Note ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginBottom: 20, padding: '10px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.75rem', color: '#64748b' }}>
        <span style={{ fontWeight: 700, color: '#94a3b8', marginRight: 4 }}>Glossary:</span>
        {[
          ['AOV', 'Average Order Value'],
          ['Avg', 'Average'],
          ['Qty', 'Quantity'],
          ['Pct / %', 'Percentage'],
          ['vs prev period', 'Compared to the previous equivalent time range'],
        ].map(([short, full]) => (
          <span key={short}>
            <span style={{ fontWeight: 600, color: '#475569' }}>{short}</span>
            <span style={{ color: '#94a3b8' }}> — {full}</span>
          </span>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '32px 0', color: '#64748b' }}>
          <span style={{ display: 'inline-block', width: 20, height: 20, border: '2.5px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Loading dashboard data…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── Low Stock Alerts ── */}
          {lowStock.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {lowStock.map((item) => {
                const pct = Math.min((item.quantity / item.min_threshold) * 100, 100);
                return (
                  <div key={item.ingredient_id} className="bd-card" style={{ background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span className="bd-alert-badge">⚠ Low Stock</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</span>
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {item.quantity} {item.unit} remaining — min threshold: {item.min_threshold} {item.unit}
                    </span>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div className="bd-stock-bar-bg">
                        <div className="bd-stock-bar-fill" style={{ width: `${pct}%`, background: pct < 40 ? '#ef4444' : '#f59e0b' }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{pct.toFixed(0)}% of threshold</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div className="bd-kpi-grid">
            <KpiCard
              icon="💰"
              label="Total Revenue"
              value={fmtCurrency(summary?.total_revenue)}
              delta={summary?.deltas?.revenue_pct}
            />
            <KpiCard
              icon="🧾"
              label="Total Orders"
              value={fmt(summary?.total_orders)}
              delta={summary?.deltas?.orders_pct}
            />
            <KpiCard
              icon="📊"
              label="Avg Order Value"
              value={fmtCurrency(summary?.avg_order_value)}
              delta={summary?.deltas?.aov_pct}
            />
            <KpiCard
              icon="❌"
              label="Cancellation Rate"
              value={summary?.cancellation_rate_pct != null ? `${summary.cancellation_rate_pct.toFixed(1)}%` : '—'}
              delta={null}
            />
          </div>

          {/* Secondary KPI row */}
          <div className="bd-kpi-grid" style={{ marginBottom: 20 }}>
            <div className="bd-card" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div className="bd-card-title">Completed Orders</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{fmt(summary?.completed_orders)}</div>
              </div>
              <div>
                <div className="bd-card-title">Cancelled Orders</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: summary?.cancelled_orders > 0 ? '#ef4444' : '#94a3b8' }}>{fmt(summary?.cancelled_orders)}</div>
              </div>
              <div>
                <div className="bd-card-title">Total Taxes</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{fmtCurrency(summary?.total_taxes)}</div>
              </div>
              <div>
                <div className="bd-card-title">Total Discounts</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{fmtCurrency(summary?.total_discounts)}</div>
              </div>
            </div>
            {menuMix && (
              <div className="bd-card" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div className="bd-card-title">Menu Items</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{menuMix.available_items} / {menuMix.total_items}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>available</div>
                </div>
                <div>
                  <div className="bd-card-title">Avg Price</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{fmtCurrency(menuMix.avg_price)}</div>
                </div>
                <div>
                  <div className="bd-card-title">Vegan</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{menuMix.vegan_items}</div>
                </div>
                <div>
                  <div className="bd-card-title">Gluten-Free</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{menuMix.gluten_free_items}</div>
                </div>
              </div>
            )}
          </div>

          {/* ── Revenue Trend + Order Status ── */}
          <div className="bd-grid-3-1">
            <Section title="Revenue Trend" icon="📈">
              {revenueTrend.every((d) => d.revenue === 0) ? (
                <div className="bd-empty">No revenue data for this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={revenueTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip currency />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="aov" name="AOV" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Section>

            <Section title="Order Status" icon="🔄">
              {statusData.length === 0 ? (
                <div className="bd-empty">No order data.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name.toLowerCase()] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, name, props) => [`${v} orders (${props.payload.pct?.toFixed(1)}%)`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 8 }}>
                    {statusData.map((s) => (
                      <div key={s.name} className="bd-cf-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="bd-cf-dot" style={{ background: STATUS_COLORS[s.name.toLowerCase()] || '#94a3b8' }} />
                          <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 500 }}>{s.name}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.value} ({s.pct?.toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Section>
          </div>

          {/* ── Top Items + Top Categories ── */}
          <div className="bd-grid-2">
            <Section title="Top Selling Items" icon="🏆">
              {topItems.length === 0 ? (
                <div className="bd-empty">No item data.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topItems.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 8, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={60} />
                      <Tooltip content={<ChartTooltip currency />} />
                      <Bar dataKey="total_revenue" name="Revenue" radius={[0, 4, 4, 0]} fill="url(#blueGrad)">
                        {topItems.slice(0, 6).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 12 }}>
                    {topItems.slice(0, 5).map((item, i) => (
                      <div key={item.name} className="bd-item-row">
                        <span className={`bd-item-rank${i === 0 ? ' gold' : ''}`}>{item.rank}</span>
                        <span style={{ flex: 1, marginLeft: 10, fontSize: '0.8125rem', color: '#1e293b' }}>{item.label}</span>
                        <div className="bd-item-share-bar">
                          <div className="bd-item-share-fill" style={{ width: `${item.revenue_share_pct}%` }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: 40, textAlign: 'right' }}>{item.revenue_share_pct?.toFixed(1)}%</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', minWidth: 80, textAlign: 'right' }}>{fmtCurrency(item.total_revenue)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Section>

            <Section title="Least Selling Items" icon="📉">
              {leastItems.length === 0 ? (
                <div className="bd-empty">No data.</div>
              ) : (
                <div>
                  {leastItems.map((item) => (
                    <div key={item.name} className="bd-item-row">
                      <span className="bd-item-rank">{item.rank}</span>
                      <span style={{ flex: 1, marginLeft: 10, fontSize: '0.8125rem', color: '#1e293b' }}>{item.label}</span>
                      <div className="bd-item-share-bar">
                        <div className="bd-item-share-fill" style={{ width: `${item.revenue_share_pct}%`, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: 40, textAlign: 'right' }}>{item.revenue_share_pct?.toFixed(2)}%</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', minWidth: 80, textAlign: 'right' }}>{fmtCurrency(item.total_revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* ── Top Categories ── */}
          <Section title="Revenue by Category" icon="📁" className="bd-mb">
              {topCategories.length === 0 ? (
                <div className="bd-empty">No category data.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={topCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={42} paddingAngle={3}>
                        {topCategories.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmtCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    {topCategories.map((cat, i) => (
                      <div key={cat.name} className="bd-cf-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="bd-cf-dot" style={{ background: COLORS[i % COLORS.length] }} />
                          <span style={{ fontSize: '0.8125rem', color: '#1e293b', fontWeight: 500 }}>{cat.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{cat.qty} qty</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{fmtCurrency(cat.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </Section>

          {/* ── Peak Hours + Cash Flow + Customer Behavior ── */}
          <div className="bd-grid-3">
            <Section title="Peak Hours" icon="⏰">
              {peakHours.length === 0 ? (
                <div className="bd-empty">No peak hour data.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={peakHours} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip content={<ChartTooltip currency />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                    <Bar dataKey="orders" name="Orders" radius={[4, 4, 0, 0]} fill="#e0e7ff" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>

            <Section title="Cash Flow" icon="💵">
              {cashFlowSummary ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Income</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#14532d', marginTop: 4 }}>{fmtCurrency(cashFlowSummary.income)}</div>
                    </div>
                    <div style={{ background: '#fef2f2', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expense</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#7f1d1d', marginTop: 4 }}>{fmtCurrency(cashFlowSummary.expense)}</div>
                    </div>
                  </div>
                  <div style={{ background: cashFlowSummary.net_cash_flow >= 0 ? '#eff6ff' : '#fef2f2', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: cashFlowSummary.net_cash_flow >= 0 ? '#1d4ed8' : '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Cash Flow</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: cashFlowSummary.net_cash_flow >= 0 ? '#1e3a8a' : '#7f1d1d', marginTop: 4 }}>{fmtCurrency(cashFlowSummary.net_cash_flow)}</div>
                  </div>
                  {cashFlowCategories.length > 0 && (
                    <div>
                      <div className="bd-card-title">By Category</div>
                      {cashFlowCategories.map((c, i) => (
                        <div key={c.name} className="bd-cf-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="bd-cf-dot" style={{ background: COLORS[i % COLORS.length] }} />
                            <span style={{ fontSize: '0.8125rem', color: '#1e293b', fontWeight: 500 }}>{c.name}</span>
                          </div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{fmtCurrency(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="bd-empty">No cash flow data.</div>
              )}
            </Section>

            <Section title="Customer Behavior" icon="👥">
              {customerBehavior ? (
                <>
                  {customerChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={customerChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={62} innerRadius={32} paddingAngle={4}>
                          <Cell fill="#3b82f6" />
                          <Cell fill="#e0e7ff" />
                        </Pie>
                        <Tooltip formatter={(v, name) => [`${v} customers`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div>
                    {[
                      { label: 'Total Customer Orders', value: fmt(customerBehavior.customer_orders) },
                      { label: 'Guest Orders', value: fmt(customerBehavior.guest_orders) },
                      { label: 'Unique Customers', value: fmt(customerBehavior.unique_customers) },
                      { label: 'Repeat Customers', value: fmt(customerBehavior.repeat_customers) },
                      { label: 'Repeat Orders', value: fmt(customerBehavior.repeat_orders) },
                      { label: 'Avg Orders / Customer', value: customerBehavior.avg_orders_per_customer?.toFixed(2) },
                      { label: 'Repeat Customer Rate', value: `${customerBehavior.repeat_customer_rate_pct?.toFixed(1)}%`, highlight: true },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="bd-cf-row">
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{label}</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: highlight ? 700 : 600, color: highlight ? '#3b82f6' : '#0f172a' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bd-empty">No customer data.</div>
              )}
            </Section>
          </div>

          {/* ── Revenue Orders Count bar chart ── */}
          <Section title="Daily Order Count" icon="📅" className="bd-mb">
            {revenueTrend.every((d) => d.orders === 0) ? (
              <div className="bd-empty">No order count data for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="orders" name="Orders" radius={[4, 4, 0, 0]} fill="#8b5cf6" maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
