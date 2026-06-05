import { useState, useEffect } from 'react';
import AdminTable from '../../components/admin/shared/AdminTable';
import FormModal from '../../components/admin/shared/FormModal';
import FileUploadField from '../../components/admin/shared/FileUploadField';
import ConfirmDeleteModal from '../../components/admin/shared/ConfirmDeleteModal';
import { ToastContainer } from '../../components/admin/shared/Toast';
import {
  adminFoodItemsApi,
  adminCategoriesApi,
  ingredientsApi,
  allergensApi,
} from '../../services/apiService';
import { validateFoodItem } from '../../utils/validators';
import { createFormData } from '../../utils/imageUploadHandler';
import { useAdmin } from '../../context/AdminContext';

// ─── Tiny design tokens injected once ────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --fi-cream:  #FDFCF9;
    --fi-sand:   #F5F0E8;
    --fi-amber:  #C97B2B;
    --fi-amber2: #E8943A;
    --fi-dark:   #1C1A17;
    --fi-muted:  #6B6459;
    --fi-border: #E4DDD2;
    --fi-green:  #2D6A4F;
    --fi-red:    #B91C1C;
    --fi-shadow: 0 1px 3px rgba(28,26,23,.06), 0 4px 16px rgba(28,26,23,.06);
    --fi-shadow-lg: 0 4px 8px rgba(28,26,23,.08), 0 12px 40px rgba(28,26,23,.10);
  }

  .fi-page   { font-family: 'DM Sans', sans-serif; background: var(--fi-cream); }
  .fi-title  { font-family: 'Fraunces', serif; letter-spacing: -.5px; }

  /* stat card */
  .fi-stat { background:#fff; border:1px solid var(--fi-border); border-radius:12px; padding:16px 20px; box-shadow:var(--fi-shadow); transition:box-shadow .2s; }
  .fi-stat:hover { box-shadow:var(--fi-shadow-lg); }

  /* primary button */
  .fi-btn-primary {
    background: linear-gradient(135deg, var(--fi-amber), var(--fi-amber2));
    color: #fff; border:none; border-radius:10px; padding:10px 22px;
    font-family:'DM Sans',sans-serif; font-weight:600; font-size:.875rem;
    cursor:pointer; box-shadow:0 2px 8px rgba(201,123,43,.30);
    transition:transform .15s, box-shadow .15s;
  }
  .fi-btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(201,123,43,.40); }
  .fi-btn-primary:active { transform:translateY(0); }

  /* section label */
  .fi-section-label {
    font-size:.625rem; font-weight:700; letter-spacing:.12em;
    text-transform:uppercase; color:var(--fi-amber); margin-bottom:10px;
  }

  /* field */
  .fi-field {
    width:100%; padding:9px 13px; background:#fff;
    border:1.5px solid var(--fi-border); border-radius:9px;
    font-family:'DM Sans',sans-serif; font-size:.875rem; color:var(--fi-dark);
    transition:border-color .15s, box-shadow .15s; outline:none;
  }
  .fi-field:focus { border-color:var(--fi-amber); box-shadow:0 0 0 3px rgba(201,123,43,.12); }
  .fi-field.err   { border-color:var(--fi-red); }
  .fi-err-msg { color:var(--fi-red); font-size:.75rem; margin-top:4px; }

  /* checkbox row */
  .fi-check-row { display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:8px; cursor:pointer; transition:background .12s; }
  .fi-check-row:hover { background:var(--fi-sand); }
  .fi-check-row input[type=checkbox] { accent-color:var(--fi-amber); width:15px; height:15px; cursor:pointer; }

  /* chip */
  .fi-chip {
    display:inline-flex; align-items:center; gap:4px;
    background:var(--fi-sand); border:1px solid var(--fi-border);
    border-radius:99px; padding:3px 10px; font-size:.75rem; font-weight:500; color:var(--fi-dark);
    margin:2px; transition:background .12s;
  }
  .fi-chip.active { background:rgba(201,123,43,.15); border-color:var(--fi-amber); color:var(--fi-amber); font-weight:600; }

  /* scrollable list */
  .fi-scroll-list { max-height:180px; overflow-y:auto; border:1.5px solid var(--fi-border); border-radius:10px; padding:6px; background:#fff; }
  .fi-scroll-list::-webkit-scrollbar { width:4px; }
  .fi-scroll-list::-webkit-scrollbar-thumb { background:var(--fi-border); border-radius:4px; }

  /* toggle pill */
  .fi-toggle-wrap { display:flex; gap:12px; flex-wrap:wrap; }
  .fi-toggle { display:flex; align-items:center; gap:8px; padding:8px 14px; border-radius:99px;
    border:1.5px solid var(--fi-border); background:#fff; cursor:pointer; transition:all .15s; user-select:none; }
  .fi-toggle.on { border-color:var(--fi-amber); background:rgba(201,123,43,.09); }
  .fi-toggle input { display:none; }
  .fi-toggle-dot { width:18px;height:18px;border-radius:50%;border:2px solid var(--fi-border);
    display:flex;align-items:center;justify-content:center; transition:all .15s; }
  .fi-toggle.on .fi-toggle-dot { border-color:var(--fi-amber); background:var(--fi-amber); }
  .fi-toggle.on .fi-toggle-dot::after { content:''; width:6px;height:6px;border-radius:50%;background:#fff; }

  /* range */
  .fi-range-wrap { position:relative; }
  .fi-range { width:100%; -webkit-appearance:none; height:4px; border-radius:2px;
    background:linear-gradient(to right, var(--fi-amber) 0%, var(--fi-amber) var(--pct,0%), var(--fi-border) var(--pct,0%)); }
  .fi-range::-webkit-slider-thumb { -webkit-appearance:none; width:18px;height:18px;border-radius:50%;
    background:#fff; border:2px solid var(--fi-amber); box-shadow:0 1px 4px rgba(0,0,0,.15); cursor:pointer; }
  .fi-spice-val { font-size:.8rem; font-weight:600; color:var(--fi-amber); text-align:right; margin-top:2px; }

  /* status badge */
  .fi-badge-avail { display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;
    font-size:.72rem;font-weight:600; background:#D1FAE5;color:#065F46; }
  .fi-badge-unavail { display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;
    font-size:.72rem;font-weight:600; background:#FEE2E2;color:#991B1B; }
  .fi-badge-avail::before  { content:''; width:6px;height:6px;border-radius:50%;background:#10B981; }
  .fi-badge-unavail::before{ content:''; width:6px;height:6px;border-radius:50%;background:#EF4444; }

  /* form section card */
  .fi-form-section { background:var(--fi-sand); border-radius:12px; padding:16px; margin-bottom:4px; }

  /* edit/delete action btn */
  .fi-act-edit   { padding:5px 12px;border-radius:7px;background:#EFF6FF;color:#1D4ED8;
    border:1px solid #BFDBFE;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .12s; }
  .fi-act-edit:hover { background:#DBEAFE; }
  .fi-act-del    { padding:5px 12px;border-radius:7px;background:#FEF2F2;color:#DC2626;
    border:1px solid #FECACA;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .12s; }
  .fi-act-del:hover { background:#FEE2E2; }
`;

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub }) => (
  <div className="fi-stat">
    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Fraunces', serif", color: 'var(--fi-dark)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--fi-muted)', marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: '.7rem', color: 'var(--fi-amber)', marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─── Section Divider ─────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => <div className="fi-section-label">{children}</div>;

// ─── Toggle (checkbox styled as pill) ────────────────────────────────────────
const TogglePill = ({ name, checked, onChange, label }) => (
  <label className={`fi-toggle${checked ? ' on' : ''}`}>
    <input type="checkbox" name={name} checked={checked} onChange={onChange} />
    <div className="fi-toggle-dot" />
    <span style={{ fontSize: '.82rem', fontWeight: 500, color: checked ? 'var(--fi-amber)' : 'var(--fi-dark)' }}>{label}</span>
  </label>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const FoodItemsPage = () => {
  const { canCreate, canEdit, canDelete } = useAdmin();
  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', categoryId: '', categoryIds: [],
    allergenIds: [], ingredientIds: [], isVegan: false, isGlutenFree: false,
    spiceLevel: 0, preparationTimeMin: '', calories: '', available: true,
    displayOrder: 0, image: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [fileError, setFileError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [items, cats, allergs, ingrs] = await Promise.all([
        adminFoodItemsApi.getAll(), adminCategoriesApi.getAll(),
        allergensApi.getAll(), ingredientsApi.getAll(),
      ]);
      setFoodItems(items); setCategories(cats); setAllergens(allergs); setIngredients(ingrs);
    } catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  };
  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  const blankForm = () => ({
    name: '', description: '', price: '', categoryId: '', categoryIds: [],
    allergenIds: [], ingredientIds: [], isVegan: false, isGlutenFree: false,
    spiceLevel: 0, preparationTimeMin: '', calories: '', available: true,
    displayOrder: 0, image: null,
  });

  const handleCreateClick = () => {
    setFormMode('create'); setFormData(blankForm());
    setFormErrors({}); setFileError(null); setShowForm(true);
  };

  const handleEditClick = (item) => {
    setFormMode('edit');
    const primaryCategoryId = item.categoryId || (item.categories?.[0]?.id ?? '');
    setFormData({
      id: item.id, name: item.name, description: item.description,
      price: item.price || '', categoryId: primaryCategoryId,
      categoryIds: item.categories?.map(c => c.id) ?? item.categoryIds ?? [],
      allergenIds: item.allergens?.map(a => a.id) ?? item.allergenIds ?? [],
      ingredientIds: item.ingredients?.map(i => i.id) ?? item.ingredientIds ?? [],
      isVegan: item.isVegan || false, isGlutenFree: item.isGlutenFree || false,
      spiceLevel: item.spiceLevel || 0, preparationTimeMin: item.preparationTimeMin || '',
      calories: item.calories || '', available: item.available !== false,
      displayOrder: item.displayOrder || 0, image: null, imageUrl: item.imageUrl,
    });
    setFormErrors({}); setFileError(null); setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleMultiSelect = (name, id) => {
    setFormData(prev => {
      const arr = prev[name];
      return { ...prev, [name]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
    });
  };

  const handleFileChange = (file, error) => {
    setFormData(prev => ({ ...prev, image: file })); setFileError(error);
  };

  const handleFormSubmit = async () => {
    const { valid, errors } = validateFoodItem(formData);
    if (!valid) { setFormErrors(errors); return; }
    if (formMode === 'create' && !formData.image) { setFormErrors({ ...errors, image: 'Image is required' }); return; }
    if (fileError) return;
    try {
      setFormLoading(true);
      const payload = { ...formData };
      const newImageFile = payload.image instanceof File ? payload.image : null;
      if (formMode === 'edit') delete payload.image; // image handled separately for edit
      if (!payload.preparationTimeMin) delete payload.preparationTimeMin;
      if (!payload.calories) delete payload.calories;
      const formPayload = createFormData(payload);
      if (formMode === 'create') {
        await adminFoodItemsApi.create(formPayload);
        showToast('Food item created successfully', 'success');
      } else {
        await adminFoodItemsApi.update(formPayload);
        if (newImageFile) {
          await adminFoodItemsApi.updateImage(formData.id, newImageFile);
        }
        showToast('Food item updated successfully', 'success');
      }
      setShowForm(false); await fetchAllData();
    } catch (error) { showToast(error.message, 'error'); }
    finally { setFormLoading(false); }
  };

  const handleDeleteClick = (item) => { setDeleteTarget(item); setShowDeleteModal(true); };
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await adminFoodItemsApi.delete(deleteTarget.id);
      showToast('Food item deleted successfully', 'success');
      setShowDeleteModal(false); setDeleteTarget(null); await fetchAllData();
    } catch (error) { showToast(error.message, 'error'); }
    finally { setDeleteLoading(false); }
  };

  const getPrimaryCategoryName = (categoryId) =>
    categories.find(c => c.id === categoryId)?.name || '—';

  const availableCount = foodItems.filter(f => f.available).length;
  const veganCount = foodItems.filter(f => f.isVegan).length;

  const columns = [
    { key: 'id', label: '#', sortable: true, render: (v) => <span style={{ color: 'var(--fi-muted)', fontSize: '.78rem' }}>#{v}</span> },
    {
      key: 'imageUrl', label: '',
      render: (url) => (
        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--fi-sand)', flexShrink: 0 }}>
          {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.2rem' }}>🍽️</span>}
        </div>
      ),
    },
    { key: 'name', label: 'Name', sortable: true, render: (v) => <span style={{ fontWeight: 600, color: 'var(--fi-dark)' }}>{v}</span> },
    {
      key: 'categoryId', label: 'Category',
      render: (id) => (
        <span style={{ background: 'var(--fi-sand)', borderRadius: 99, padding: '3px 10px', fontSize: '.75rem', fontWeight: 500, color: 'var(--fi-muted)' }}>
          {getPrimaryCategoryName(id)}
        </span>
      ),
    },
    {
      key: 'price', label: 'Price', sortable: true,
      render: (price) => (
        <span style={{ fontWeight: 700, color: 'var(--fi-amber)', fontFamily: "'Fraunces', serif" }}>
          ${parseFloat(price || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'available', label: 'Status',
      render: (available) => (
        <span className={available ? 'fi-badge-avail' : 'fi-badge-unavail'}>
          {available ? 'Available' : 'Unavailable'}
        </span>
      ),
    },
    {
      key: 'isVegan', label: 'Tags',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {row.isVegan && <span title="Vegan" style={{ fontSize: '.9rem' }}>🌱</span>}
          {row.isGlutenFree && <span title="Gluten-Free" style={{ fontSize: '.9rem' }}>🌾</span>}
          {!row.isVegan && !row.isGlutenFree && <span style={{ color: 'var(--fi-border)' }}>—</span>}
        </div>
      ),
    },
  ];

  const actions = [
    { label: 'Edit', icon: '✏️', color: 'blue', onClick: handleEditClick, disabled: () => !canEdit('foodItems') },
    { label: 'Delete', icon: '🗑️', color: 'red', onClick: handleDeleteClick, disabled: () => !canDelete('foodItems') },
  ];

  // ─── Spice level gradient helper ────────────────────────────────────────────
  const spicePct = (formData.spiceLevel / 10) * 100;

  return (
    <div className="fi-page" style={{ minHeight: '100vh', padding: '28px 32px' }}>
      <style>{STYLE}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="fi-section-label" style={{ marginBottom: 4 }}>Menu Management</p>
          <h1 className="fi-title" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--fi-dark)', margin: 0 }}>
            Food Items
          </h1>
          <p style={{ color: 'var(--fi-muted)', fontSize: '.85rem', marginTop: 4 }}>
            {foodItems.length} items across {categories.length} categories
          </p>
        </div>
        {canCreate('foodItems') && (
          <button className="fi-btn-primary" onClick={handleCreateClick}>
            + Add Food Item
          </button>
        )}
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon="🍽️" label="Total Items" value={foodItems.length} />
        <StatCard icon="✅" label="Available" value={availableCount} sub={`${foodItems.length - availableCount} unavailable`} />
        <StatCard icon="🌱" label="Vegan Options" value={veganCount} />
        <StatCard icon="📂" label="Categories" value={categories.length} />
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--fi-border)', boxShadow: 'var(--fi-shadow)', overflow: 'hidden' }}>
        <AdminTable
          columns={columns}
          data={foodItems}
          loading={loading}
          actions={actions}
          emptyMessage="No food items found"
        />
      </div>

      {/* ── Form Modal ─────────────────────────────────────── */}
      <FormModal
        isOpen={showForm}
        title={formMode === 'create' ? 'Add Food Item' : 'Edit Food Item'}
        submitLabel={formMode === 'create' ? 'Create Item' : 'Save Changes'}
        loading={formLoading}
        onSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* — Basic Info ——————————————————————————————— */}
          <div className="fi-form-section">
            <SectionLabel>Basic Information</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 5 }}>
                  Name <span style={{ color: 'var(--fi-red)' }}>*</span>
                </label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange}
                  placeholder="e.g. Grilled Salmon Fillet" maxLength="200"
                  className={`fi-field${formErrors.name ? ' err' : ''}`} />
                {formErrors.name && <p className="fi-err-msg">⚠ {formErrors.name}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 5 }}>
                  Description <span style={{ color: 'var(--fi-red)' }}>*</span>
                </label>
                <textarea name="description" value={formData.description} onChange={handleFormChange}
                  placeholder="Describe the dish, its flavors and key ingredients…"
                  maxLength="1000" rows="3"
                  className={`fi-field${formErrors.description ? ' err' : ''}`}
                  style={{ resize: 'vertical' }} />
                {formErrors.description && <p className="fi-err-msg">⚠ {formErrors.description}</p>}
              </div>
            </div>
          </div>

          {/* — Pricing & Category ——————————————————————— */}
          <div className="fi-form-section">
            <SectionLabel>Pricing & Category</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 5 }}>
                  Price <span style={{ color: 'var(--fi-red)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fi-muted)', fontWeight: 600, fontSize: '.85rem' }}>$</span>
                  <input type="number" name="price" value={formData.price} onChange={handleFormChange}
                    placeholder="0.00" step="0.01" min="0"
                    className={`fi-field${formErrors.price ? ' err' : ''}`} style={{ paddingLeft: 26 }} />
                </div>
                {formErrors.price && <p className="fi-err-msg">⚠ {formErrors.price}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 5 }}>
                  Primary Category <span style={{ color: 'var(--fi-red)' }}>*</span>
                </label>
                <select name="categoryId" value={formData.categoryId} onChange={handleFormChange}
                  className={`fi-field${formErrors.categoryId ? ' err' : ''}`}>
                  <option value="">Select category…</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                {formErrors.categoryId && <p className="fi-err-msg">⚠ {formErrors.categoryId}</p>}
              </div>
            </div>

            {/* Additional Categories */}
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 4 }}>
                Additional Categories
                <span style={{ fontWeight: 400, color: 'var(--fi-muted)', marginLeft: 6 }}>(optional)</span>
              </label>
              {/* Selected chips preview */}
              {formData.categoryIds.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {formData.categoryIds.map(id => (
                    <span key={id} className="fi-chip active">
                      {categories.find(c => c.id === id)?.name}
                      <span style={{ cursor: 'pointer', marginLeft: 2 }} onClick={() => handleMultiSelect('categoryIds', id)}>×</span>
                    </span>
                  ))}
                </div>
              )}
              <div className="fi-scroll-list">
                {categories.length > 0 ? categories.map(cat => (
                  <label key={cat.id} className="fi-check-row">
                    <input type="checkbox" checked={formData.categoryIds.includes(cat.id)}
                      onChange={() => handleMultiSelect('categoryIds', cat.id)}
                      style={{ accentColor: 'var(--fi-amber)', width: 15, height: 15 }} />
                    <span style={{ fontSize: '.83rem', color: 'var(--fi-dark)' }}>{cat.name}</span>
                  </label>
                )) : <p style={{ fontSize: '.8rem', color: 'var(--fi-muted)', padding: '6px 0' }}>No categories available</p>}
              </div>
            </div>
          </div>

          {/* — Allergens & Ingredients ———————————————————— */}
          <div className="fi-form-section">
            <SectionLabel>Allergens & Ingredients</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 8 }}>
                  Allergens
                </label>
                {formData.allergenIds.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    {formData.allergenIds.map(id => (
                      <span key={id} className="fi-chip active" style={{ fontSize: '.68rem' }}>
                        {allergens.find(a => a.id === id)?.name}
                        <span style={{ cursor: 'pointer' }} onClick={() => handleMultiSelect('allergenIds', id)}>×</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="fi-scroll-list">
                  {allergens.length > 0 ? allergens.map(a => (
                    <label key={a.id} className="fi-check-row">
                      <input type="checkbox" checked={formData.allergenIds.includes(a.id)}
                        onChange={() => handleMultiSelect('allergenIds', a.id)}
                        style={{ accentColor: 'var(--fi-amber)', width: 14, height: 14 }} />
                      <span style={{ fontSize: '.8rem', color: 'var(--fi-dark)' }}>{a.name}</span>
                    </label>
                  )) : <p style={{ fontSize: '.78rem', color: 'var(--fi-muted)', padding: '4px 0' }}>None available</p>}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 8 }}>
                  Ingredients
                </label>
                {formData.ingredientIds.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    {formData.ingredientIds.map(id => (
                      <span key={id} className="fi-chip active" style={{ fontSize: '.68rem' }}>
                        {ingredients.find(i => i.id === id)?.name}
                        <span style={{ cursor: 'pointer' }} onClick={() => handleMultiSelect('ingredientIds', id)}>×</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="fi-scroll-list">
                  {ingredients.length > 0 ? ingredients.map(ing => (
                    <label key={ing.id} className="fi-check-row">
                      <input type="checkbox" checked={formData.ingredientIds.includes(ing.id)}
                        onChange={() => handleMultiSelect('ingredientIds', ing.id)}
                        style={{ accentColor: 'var(--fi-amber)', width: 14, height: 14 }} />
                      <span style={{ fontSize: '.8rem', color: 'var(--fi-dark)' }}>{ing.name}</span>
                    </label>
                  )) : <p style={{ fontSize: '.78rem', color: 'var(--fi-muted)', padding: '4px 0' }}>None available</p>}
                </div>
              </div>
            </div>
          </div>

          {/* — Dietary Tags & Availability ———————————————— */}
          <div className="fi-form-section">
            <SectionLabel>Dietary & Availability</SectionLabel>
            <div className="fi-toggle-wrap">
              <TogglePill name="isVegan" checked={formData.isVegan} onChange={handleFormChange} label="🌱 Vegan" />
              <TogglePill name="isGlutenFree" checked={formData.isGlutenFree} onChange={handleFormChange} label="🌾 Gluten-Free" />
              <TogglePill name="available" checked={formData.available} onChange={handleFormChange} label="✅ Available" />
            </div>
          </div>

          {/* — Details ——————————————————————————————————— */}
          <div className="fi-form-section">
            <SectionLabel>Item Details</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
              {/* Spice Level */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 8 }}>
                  <span>Spice Level</span>
                  <span className="fi-spice-val">{formData.spiceLevel > 0 ? '🌶'.repeat(Math.ceil(formData.spiceLevel / 3)).slice(0, 3) + ` ${formData.spiceLevel}/10` : '0/10'}</span>
                </label>
                <div className="fi-range-wrap">
                  <input type="range" name="spiceLevel" value={formData.spiceLevel}
                    onChange={handleFormChange} min="0" max="10"
                    className="fi-range"
                    style={{ '--pct': `${spicePct}%` }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 5 }}>
                  Prep Time (min)
                </label>
                <input type="number" name="preparationTimeMin" value={formData.preparationTimeMin}
                  onChange={handleFormChange} placeholder="15" min="0" className="fi-field" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 5 }}>
                  Calories
                </label>
                <input type="number" name="calories" value={formData.calories}
                  onChange={handleFormChange} placeholder="250" min="0" className="fi-field" />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--fi-dark)', marginBottom: 5 }}>
                Display Order
              </label>
              <input type="number" name="displayOrder" value={formData.displayOrder}
                onChange={handleFormChange} min="0" className="fi-field" style={{ maxWidth: 120 }} />
            </div>
          </div>

          {/* — Image Upload ——————————————————————————————— */}
          <div>
            <SectionLabel>Item Photo</SectionLabel>
            <FileUploadField
              label="Food Item Image"
              name="image"
              required={formMode === 'create'}
              value={formData.image}
              onChange={handleFileChange}
              previewUrl={formData.imageUrl}
              error={fileError || formErrors.image}
            />
          </div>
        </div>
      </FormModal>

      {/* ── Delete Modal ───────────────────────────────────── */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Delete Food Item"
        message="Are you sure you want to delete this food item? This action cannot be undone."
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

export default FoodItemsPage;