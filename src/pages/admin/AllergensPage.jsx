import { useState, useEffect } from 'react';
import AdminTable from '../../components/admin/shared/AdminTable';
import FormModal from '../../components/admin/shared/FormModal';
import ConfirmDeleteModal from '../../components/admin/shared/ConfirmDeleteModal';
import { ToastContainer } from '../../components/admin/shared/Toast';
import { allergensApi } from '../../services/apiService';
import { validateAllergen } from '../../utils/validators';
import { useAdmin } from '../../context/AdminContext';

// ─── Design tokens (same system as FoodItemsPage) ────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --al-cream:  #FDFCF9;
    --al-sand:   #F5F0E8;
    --al-amber:  #C97B2B;
    --al-amber2: #E8943A;
    --al-dark:   #1C1A17;
    --al-muted:  #6B6459;
    --al-border: #E4DDD2;
    --al-red:    #B91C1C;
    --al-shadow: 0 1px 3px rgba(28,26,23,.06), 0 4px 16px rgba(28,26,23,.06);
    --al-shadow-lg: 0 4px 8px rgba(28,26,23,.08), 0 12px 40px rgba(28,26,23,.10);
  }

  .al-page  { font-family: 'DM Sans', sans-serif; background: var(--al-cream); }
  .al-title { font-family: 'Fraunces', serif; letter-spacing: -.5px; }

  /* stat card */
  .al-stat { background:#fff; border:1px solid var(--al-border); border-radius:12px; padding:16px 20px; box-shadow:var(--al-shadow); transition:box-shadow .2s; }
  .al-stat:hover { box-shadow:var(--al-shadow-lg); }

  /* primary button */
  .al-btn-primary {
    background: linear-gradient(135deg, var(--al-amber), var(--al-amber2));
    color:#fff; border:none; border-radius:10px; padding:10px 22px;
    font-family:'DM Sans',sans-serif; font-weight:600; font-size:.875rem;
    cursor:pointer; box-shadow:0 2px 8px rgba(201,123,43,.30);
    transition:transform .15s, box-shadow .15s;
  }
  .al-btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(201,123,43,.40); }
  .al-btn-primary:active { transform:translateY(0); }

  /* section label */
  .al-section-label {
    font-size:.625rem; font-weight:700; letter-spacing:.12em;
    text-transform:uppercase; color:var(--al-amber); margin-bottom:10px;
  }

  /* field */
  .al-field {
    width:100%; padding:9px 13px; background:#fff;
    border:1.5px solid var(--al-border); border-radius:9px;
    font-family:'DM Sans',sans-serif; font-size:.875rem; color:var(--al-dark);
    transition:border-color .15s, box-shadow .15s; outline:none;
    box-sizing: border-box;
  }
  .al-field:focus { border-color:var(--al-amber); box-shadow:0 0 0 3px rgba(201,123,43,.12); }
  .al-field.err   { border-color:var(--al-red); }
  .al-err-msg { color:var(--al-red); font-size:.75rem; margin-top:4px; }

  /* allergen pill in table */
  .al-pill {
    display:inline-flex; align-items:center; gap:6px;
    background:var(--al-sand); border:1px solid var(--al-border);
    border-radius:99px; padding:4px 13px;
    font-size:.78rem; font-weight:500; color:var(--al-dark);
  }
  .al-pill-dot { width:7px; height:7px; border-radius:50%; background:var(--al-amber); flex-shrink:0; }

  /* empty state */
  .al-empty { text-align:center; padding:48px 24px; }
  .al-empty-icon { font-size:2.4rem; margin-bottom:12px; }
  .al-empty-title { font-family:'Fraunces',serif; font-size:1.1rem; color:var(--al-dark); margin:0 0 6px; }
  .al-empty-sub { font-size:.82rem; color:var(--al-muted); }

  /* quick-add inline form */
  .al-quick-form {
    background:#fff; border:1.5px solid var(--al-border); border-radius:12px;
    padding:18px 20px; box-shadow:var(--al-shadow);
  }
`;

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub }) => (
  <div className="al-stat">
    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Fraunces', serif", color: 'var(--al-dark)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--al-muted)', marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: '.7rem', color: 'var(--al-amber)', marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─── Allergen icon map (common allergens get an emoji) ────────────────────────
const getAllergenIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('peanut') || n.includes('nut')) return '🥜';
  if (n.includes('milk') || n.includes('dairy') || n.includes('lactose')) return '🥛';
  if (n.includes('egg')) return '🥚';
  if (n.includes('wheat') || n.includes('gluten')) return '🌾';
  if (n.includes('soy')) return '🫘';
  if (n.includes('fish') || n.includes('shellfish') || n.includes('shrimp') || n.includes('crab')) return '🐟';
  if (n.includes('sesame') || n.includes('seed')) return '🌿';
  if (n.includes('sulphite') || n.includes('sulfite')) return '🧪';
  if (n.includes('celery')) return '🥬';
  if (n.includes('mustard')) return '🌼';
  if (n.includes('lupin')) return '🌸';
  if (n.includes('mollusc') || n.includes('mollusk')) return '🦑';
  return '⚠️';
};

export const AllergensPage = () => {
  const { canCreate, canDelete } = useAdmin();
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchAllergens(); }, []);

  const fetchAllergens = async () => {
    try {
      setLoading(true);
      const data = await allergensApi.getAll();
      setAllergens(data);
    } catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  };
  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  const handleCreateClick = () => { setFormData({ name: '' }); setFormErrors({}); setShowForm(true); };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: '' });
  };

  const handleFormSubmit = async () => {
    const { valid, errors } = validateAllergen(formData);
    if (!valid) { setFormErrors(errors); return; }
    try {
      setFormLoading(true);
      await allergensApi.create(formData.name);
      showToast('Allergen created successfully', 'success');
      setShowForm(false);
      await fetchAllergens();
    } catch (error) { showToast(error.message, 'error'); }
    finally { setFormLoading(false); }
  };

  const handleDeleteClick = (item) => { setDeleteTarget(item); setShowDeleteModal(true); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await allergensApi.delete(deleteTarget.id);
      showToast('Allergen deleted successfully', 'success');
      setShowDeleteModal(false); setDeleteTarget(null);
      await fetchAllergens();
    } catch (error) { showToast(error.message, 'error'); }
    finally { setDeleteLoading(false); }
  };

  const columns = [
    {
      key: 'id', label: '#', sortable: true,
      render: (v) => <span style={{ color: 'var(--al-muted)', fontSize: '.78rem' }}>#{v}</span>,
    },
    {
      key: 'name', label: 'Allergen', sortable: true,
      render: (name) => (
        <div className="al-pill">
          <span className="al-pill-dot" />
          <span style={{ fontSize: '1rem' }}>{getAllergenIcon(name)}</span>
          <span style={{ fontWeight: 600, color: 'var(--al-dark)' }}>{name}</span>
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: 'Delete',
      icon: '🗑️',
      color: 'red',
      onClick: handleDeleteClick,
      disabled: () => !canDelete('allergens'),
    },
  ];

  return (
    <div className="al-page" style={{ minHeight: '100vh', padding: '28px 32px' }}>
      <style>{STYLE}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="al-section-label" style={{ marginBottom: 4 }}>Menu Management</p>
          <h1 className="al-title" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--al-dark)', margin: 0 }}>
            Allergens
          </h1>
          <p style={{ color: 'var(--al-muted)', fontSize: '.85rem', marginTop: 4 }}>
            Track and manage allergen declarations for your menu items
          </p>
        </div>
        {canCreate('allergens') && (
          <button className="al-btn-primary" onClick={handleCreateClick}>
            + Add Allergen
          </button>
        )}
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon="⚠️" label="Total Allergens" value={allergens.length} />
        <StatCard
          icon="🥜"
          label="Nut Allergens"
          value={allergens.filter(a => a.name?.toLowerCase().includes('nut')).length}
          sub="peanut / tree nut"
        />
        <StatCard
          icon="🌾"
          label="Gluten / Wheat"
          value={allergens.filter(a => a.name?.toLowerCase().match(/gluten|wheat/)).length}
        />
        <StatCard
          icon="🥛"
          label="Dairy"
          value={allergens.filter(a => a.name?.toLowerCase().match(/milk|dairy|lactose/)).length}
        />
      </div>

      {/* ── Allergen Grid (visual chips) ───────────────────── */}
      {allergens.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p className="al-section-label">All Allergens</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allergens.map(a => (
              <div key={a.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#fff', border: '1.5px solid var(--al-border)',
                borderRadius: 99, padding: '6px 14px',
                fontSize: '.82rem', fontWeight: 500, color: 'var(--al-dark)',
                boxShadow: 'var(--al-shadow)',
              }}>
                <span>{getAllergenIcon(a.name)}</span>
                <span>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--al-border)', boxShadow: 'var(--al-shadow)', overflow: 'hidden' }}>
        <AdminTable
          columns={columns}
          data={allergens}
          loading={loading}
          actions={actions}
          emptyMessage="No allergens found"
        />
      </div>

      {/* ── Form Modal ─────────────────────────────────────── */}
      <FormModal
        isOpen={showForm}
        title="Add Allergen"
        submitLabel="Create Allergen"
        loading={formLoading}
        onSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Icon preview */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--al-sand)', borderRadius: 12, padding: '14px 18px',
          }}>
            <span style={{ fontSize: '2rem' }}>{getAllergenIcon(formData.name)}</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--al-dark)', fontFamily: "'Fraunces', serif", fontSize: '1rem' }}>
                {formData.name || 'New Allergen'}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--al-muted)', marginTop: 2 }}>
                Icon updates as you type
              </div>
            </div>
          </div>

          {/* Name input */}
          <div>
            <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--al-dark)', marginBottom: 5 }}>
              Allergen Name <span style={{ color: 'var(--al-red)' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="e.g. Peanuts, Dairy, Wheat…"
              maxLength="100"
              className={`al-field${formErrors.name ? ' err' : ''}`}
              autoFocus
            />
            {formErrors.name && <p className="al-err-msg">⚠ {formErrors.name}</p>}
          </div>

          {/* Common suggestions */}
          <div>
            <p className="al-section-label">Common Allergens</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame', 'Mustard', 'Celery', 'Sulphites'].map(suggestion => {
                const alreadyExists = allergens.some(a => a.name.toLowerCase() === suggestion.toLowerCase());
                return (
                  <button
                    key={suggestion}
                    onClick={() => !alreadyExists && setFormData({ name: suggestion })}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: alreadyExists ? 'var(--al-sand)' : '#fff',
                      border: `1.5px solid ${formData.name === suggestion ? 'var(--al-amber)' : 'var(--al-border)'}`,
                      borderRadius: 99, padding: '4px 12px', cursor: alreadyExists ? 'not-allowed' : 'pointer',
                      fontSize: '.75rem', fontWeight: 500,
                      color: alreadyExists ? 'var(--al-muted)' : formData.name === suggestion ? 'var(--al-amber)' : 'var(--al-dark)',
                      opacity: alreadyExists ? 0.5 : 1,
                      transition: 'all .12s',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    title={alreadyExists ? 'Already added' : `Use "${suggestion}"`}
                  >
                    <span>{getAllergenIcon(suggestion)}</span>
                    <span>{suggestion}</span>
                    {alreadyExists && <span style={{ fontSize: '.65rem', color: 'var(--al-muted)' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </FormModal>

      {/* ── Delete Modal ───────────────────────────────────── */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Delete Allergen"
        message="Are you sure you want to delete this allergen? It may be associated with existing food items."
        itemName={deleteTarget?.name}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      {/* ── Toasts ─────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default AllergensPage;