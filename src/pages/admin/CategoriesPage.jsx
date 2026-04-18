import { useState, useEffect } from 'react';
import AdminTable from '../../components/admin/shared/AdminTable';
import FormModal from '../../components/admin/shared/FormModal';
import FileUploadField from '../../components/admin/shared/FileUploadField';
import ConfirmDeleteModal from '../../components/admin/shared/ConfirmDeleteModal';
import { ToastContainer } from '../../components/admin/shared/Toast';
import { adminCategoriesApi } from '../../services/apiService';
import { validateCategory } from '../../utils/validators';
import { createFormData } from '../../utils/imageUploadHandler';
import { useAdmin } from '../../context/AdminContext';

// ─── Design tokens (shared system) ───────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --cat-cream:  #FDFCF9;
    --cat-sand:   #F5F0E8;
    --cat-amber:  #C97B2B;
    --cat-amber2: #E8943A;
    --cat-dark:   #1C1A17;
    --cat-muted:  #6B6459;
    --cat-border: #E4DDD2;
    --cat-red:    #B91C1C;
    --cat-shadow: 0 1px 3px rgba(28,26,23,.06), 0 4px 16px rgba(28,26,23,.06);
    --cat-shadow-lg: 0 4px 8px rgba(28,26,23,.08), 0 12px 40px rgba(28,26,23,.10);
  }

  .cat-page  { font-family: 'DM Sans', sans-serif; background: var(--cat-cream); }
  .cat-title { font-family: 'Fraunces', serif; letter-spacing: -.5px; }

  /* stat card */
  .cat-stat { background:#fff; border:1px solid var(--cat-border); border-radius:12px; padding:16px 20px; box-shadow:var(--cat-shadow); transition:box-shadow .2s; }
  .cat-stat:hover { box-shadow:var(--cat-shadow-lg); }

  /* primary button */
  .cat-btn-primary {
    background: linear-gradient(135deg, var(--cat-amber), var(--cat-amber2));
    color:#fff; border:none; border-radius:10px; padding:10px 22px;
    font-family:'DM Sans',sans-serif; font-weight:600; font-size:.875rem;
    cursor:pointer; box-shadow:0 2px 8px rgba(201,123,43,.30);
    transition:transform .15s, box-shadow .15s;
  }
  .cat-btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(201,123,43,.40); }
  .cat-btn-primary:active { transform:translateY(0); }

  /* section label */
  .cat-section-label {
    font-size:.625rem; font-weight:700; letter-spacing:.12em;
    text-transform:uppercase; color:var(--cat-amber); margin-bottom:10px;
  }

  /* field */
  .cat-field {
    width:100%; padding:9px 13px; background:#fff;
    border:1.5px solid var(--cat-border); border-radius:9px;
    font-family:'DM Sans',sans-serif; font-size:.875rem; color:var(--cat-dark);
    transition:border-color .15s, box-shadow .15s; outline:none;
    box-sizing:border-box;
  }
  .cat-field:focus { border-color:var(--cat-amber); box-shadow:0 0 0 3px rgba(201,123,43,.12); }
  .cat-field.err   { border-color:var(--cat-red); }
  .cat-err-msg { color:var(--cat-red); font-size:.75rem; margin-top:4px; }
  .cat-hint    { color:var(--cat-muted); font-size:.72rem; margin-top:4px; }

  /* category card grid */
  .cat-card-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:12px; margin-bottom:28px; }
  .cat-card {
    background:#fff; border:1.5px solid var(--cat-border); border-radius:14px;
    overflow:hidden; box-shadow:var(--cat-shadow); transition:box-shadow .2s, transform .2s;
    cursor:default;
  }
  .cat-card:hover { box-shadow:var(--cat-shadow-lg); transform:translateY(-2px); }
  .cat-card-img { width:100%; height:90px; object-fit:cover; background:var(--cat-sand); display:flex; align-items:center; justify-content:center; }
  .cat-card-body { padding:10px 12px; }
  .cat-card-name { font-weight:600; font-size:.82rem; color:var(--cat-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cat-card-slug { font-size:.7rem; color:var(--cat-muted); margin-top:2px; font-family:monospace; }
  .cat-card-order { font-size:.68rem; color:var(--cat-amber); font-weight:600; margin-top:4px; }

  /* slug preview */
  .cat-slug-preview {
    display:inline-flex; align-items:center; gap:6px;
    background:var(--cat-sand); border:1px solid var(--cat-border);
    border-radius:6px; padding:4px 10px; font-family:monospace;
    font-size:.75rem; color:var(--cat-muted);
  }
  .cat-slug-preview strong { color:var(--cat-dark); }

  /* order badge */
  .cat-order-badge {
    display:inline-flex; align-items:center; justify-content:center;
    width:26px; height:26px; border-radius:6px;
    background:var(--cat-sand); border:1px solid var(--cat-border);
    font-size:.78rem; font-weight:700; color:var(--cat-amber);
  }

  /* form section card */
  .cat-form-section { background:var(--cat-sand); border-radius:12px; padding:16px; }
`;

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub }) => (
  <div className="cat-stat">
    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Fraunces', serif", color: 'var(--cat-dark)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--cat-muted)', marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: '.7rem', color: 'var(--cat-amber)', marginTop: 2 }}>{sub}</div>}
  </div>
);

export const CategoriesPage = () => {
  const { canCreate, canDelete } = useAdmin();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', displayOrder: 0, image: null });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [fileError, setFileError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminCategoriesApi.getAll();
      setCategories(data);
    } catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  };
  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  const handleCreateClick = () => {
    setFormData({ name: '', slug: '', displayOrder: 0, image: null });
    setFormErrors({}); setFileError(null); setShowForm(true);
  };

  const generateSlug = (name) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, name: value, slug: generateSlug(value) }));
    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (file, error) => {
    setFormData(prev => ({ ...prev, image: file })); setFileError(error);
  };

  const handleFormSubmit = async () => {
    const { valid, errors } = validateCategory(formData);
    if (!valid || fileError) { setFormErrors(errors); return; }
    if (!formData.image) { setFormErrors({ ...formErrors, image: 'Image is required' }); return; }
    try {
      setFormLoading(true);
      const payload = createFormData(formData);
      await adminCategoriesApi.create(payload);
      showToast('Category created successfully', 'success');
      setShowForm(false); await fetchCategories();
    } catch (error) { showToast(error.message, 'error'); }
    finally { setFormLoading(false); }
  };

  const handleDeleteClick = (item) => { setDeleteTarget(item); setShowDeleteModal(true); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await adminCategoriesApi.delete(deleteTarget.id);
      showToast('Category deleted successfully', 'success');
      setShowDeleteModal(false); setDeleteTarget(null); await fetchCategories();
    } catch (error) { showToast(error.message, 'error'); }
    finally { setDeleteLoading(false); }
  };

  const sortedCategories = [...categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const columns = [
    {
      key: 'imageUrl', label: '',
      render: (url, row) => (
        <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: 'var(--cat-sand)', flexShrink: 0 }}>
          {url
            ? <img src={url} alt={row.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.3rem' }}>📂</span>}
        </div>
      ),
    },
    {
      key: 'name', label: 'Name', sortable: true,
      render: (name) => <span style={{ fontWeight: 600, color: 'var(--cat-dark)' }}>{name}</span>,
    },
    {
      key: 'slug', label: 'Slug', sortable: true,
      render: (slug) => (
        <span style={{ fontFamily: 'monospace', fontSize: '.78rem', background: 'var(--cat-sand)', padding: '3px 8px', borderRadius: 5, color: 'var(--cat-muted)' }}>
          {slug}
        </span>
      ),
    },
    {
      key: 'displayOrder', label: 'Order', sortable: true,
      render: (order) => <span className="cat-order-badge">{order ?? 0}</span>,
    },
    {
      key: 'id', label: '#', sortable: true,
      render: (v) => <span style={{ color: 'var(--cat-muted)', fontSize: '.78rem' }}>#{v}</span>,
    },
  ];

  const actions = [
    {
      label: 'Delete', icon: '🗑️', color: 'red',
      onClick: handleDeleteClick, disabled: () => !canDelete('categories'),
    },
  ];

  return (
    <div className="cat-page" style={{ minHeight: '100vh', padding: '28px 32px' }}>
      <style>{STYLE}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="cat-section-label" style={{ marginBottom: 4 }}>Menu Management</p>
          <h1 className="cat-title" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--cat-dark)', margin: 0 }}>
            Categories
          </h1>
          <p style={{ color: 'var(--cat-muted)', fontSize: '.85rem', marginTop: 4 }}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} · organised by display order
          </p>
        </div>
        {canCreate('categories') && (
          <button className="cat-btn-primary" onClick={handleCreateClick}>
            + Add Category
          </button>
        )}
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon="📂" label="Total Categories" value={categories.length} />
        <StatCard icon="🖼️" label="With Images" value={categories.filter(c => c.imageUrl).length} sub={`${categories.filter(c => !c.imageUrl).length} missing`} />
        <StatCard icon="🔢" label="Max Order" value={categories.length ? Math.max(...categories.map(c => c.displayOrder || 0)) : 0} />
        <StatCard icon="🔗" label="Slugs Set" value={categories.filter(c => c.slug).length} />
      </div>

      {/* ── Visual Card Grid ───────────────────────────────── */}
      {categories.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p className="cat-section-label">Visual Overview</p>
          <div className="cat-card-grid">
            {sortedCategories.map(cat => (
              <div key={cat.id} className="cat-card">
                <div className="cat-card-img">
                  {cat.imageUrl
                    ? <img src={cat.imageUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '2rem' }}>📂</span>}
                </div>
                <div className="cat-card-body">
                  <div className="cat-card-name" title={cat.name}>{cat.name}</div>
                  <div className="cat-card-slug">/{cat.slug}</div>
                  <div className="cat-card-order">Order: {cat.displayOrder ?? 0}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--cat-border)', boxShadow: 'var(--cat-shadow)', overflow: 'hidden' }}>
        <AdminTable
          columns={columns}
          data={categories}
          loading={loading}
          actions={actions}
          emptyMessage="No categories found"
        />
      </div>

      {/* ── Form Modal ─────────────────────────────────────── */}
      <FormModal
        isOpen={showForm}
        title="Add Category"
        submitLabel="Create Category"
        loading={formLoading}
        onSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* — Name & Slug ———————————————————————————————— */}
          <div className="cat-form-section">
            <p className="cat-section-label">Category Identity</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--cat-dark)', marginBottom: 5 }}>
                  Name <span style={{ color: 'var(--cat-red)' }}>*</span>
                </label>
                <input
                  type="text" name="name" value={formData.name}
                  onChange={handleNameChange} placeholder="e.g. Appetizers"
                  maxLength="100" autoFocus
                  className={`cat-field${formErrors.name ? ' err' : ''}`}
                />
                {formErrors.name && <p className="cat-err-msg">⚠ {formErrors.name}</p>}
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.8rem', fontWeight: 600, color: 'var(--cat-dark)', marginBottom: 5 }}>
                  <span>Slug <span style={{ color: 'var(--cat-red)' }}>*</span></span>
                  {formData.slug && (
                    <span className="cat-slug-preview">
                      /<strong>{formData.slug}</strong>
                    </span>
                  )}
                </label>
                <input
                  type="text" name="slug" value={formData.slug}
                  onChange={handleFormChange} placeholder="e.g. appetizers"
                  maxLength="100"
                  className={`cat-field${formErrors.slug ? ' err' : ''}`}
                  style={{ fontFamily: 'monospace', fontSize: '.85rem' }}
                />
                {formErrors.slug
                  ? <p className="cat-err-msg">⚠ {formErrors.slug}</p>
                  : <p className="cat-hint">Auto-generated from name · lowercase, hyphens and underscores only</p>}
              </div>
            </div>
          </div>

          {/* — Display Order ————————————————————————————— */}
          <div className="cat-form-section">
            <p className="cat-section-label">Display Settings</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--cat-dark)', marginBottom: 5 }}>
                  Display Order
                </label>
                <input
                  type="number" name="displayOrder" value={formData.displayOrder}
                  onChange={handleFormChange} min="0"
                  className="cat-field" style={{ maxWidth: 120 }}
                />
                <p className="cat-hint">Lower numbers appear first in menus</p>
              </div>

              {/* Live order preview */}
              <div style={{ textAlign: 'center', paddingTop: 8 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: 'rgba(201,123,43,.12)', border: '2px solid var(--cat-amber)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--cat-amber)',
                }}>
                  {formData.displayOrder || 0}
                </div>
                <div style={{ fontSize: '.65rem', color: 'var(--cat-muted)', marginTop: 4 }}>Position</div>
              </div>
            </div>
          </div>

          {/* — Image ————————————————————————————————————— */}
          <div>
            <p className="cat-section-label">Category Image</p>
            <FileUploadField
              label="Category Image"
              name="image"
              required={true}
              value={formData.image}
              onChange={handleFileChange}
              error={fileError || formErrors.image}
            />
          </div>
        </div>
      </FormModal>

      {/* ── Delete Modal ───────────────────────────────────── */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Delete Category"
        message="Are you sure you want to delete this category? Food items linked to it may be affected."
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

export default CategoriesPage;