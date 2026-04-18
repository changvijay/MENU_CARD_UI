import { useState, useEffect } from 'react';
import AdminTable from '../../components/admin/shared/AdminTable';
import FormModal from '../../components/admin/shared/FormModal';
import ConfirmDeleteModal from '../../components/admin/shared/ConfirmDeleteModal';
import { ToastContainer } from '../../components/admin/shared/Toast';
import { ingredientsApi } from '../../services/apiService';
import { validateIngredient } from '../../utils/validators';
import { useAdmin } from '../../context/AdminContext';

// ─── Design tokens (shared system) ───────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --ing-cream:  #FDFCF9;
    --ing-sand:   #F5F0E8;
    --ing-amber:  #C97B2B;
    --ing-amber2: #E8943A;
    --ing-dark:   #1C1A17;
    --ing-muted:  #6B6459;
    --ing-border: #E4DDD2;
    --ing-red:    #B91C1C;
    --ing-green:  #2D6A4F;
    --ing-shadow: 0 1px 3px rgba(28,26,23,.06), 0 4px 16px rgba(28,26,23,.06);
    --ing-shadow-lg: 0 4px 8px rgba(28,26,23,.08), 0 12px 40px rgba(28,26,23,.10);
  }

  .ing-page  { font-family: 'DM Sans', sans-serif; background: var(--ing-cream); }
  .ing-title { font-family: 'Fraunces', serif; letter-spacing: -.5px; }

  .ing-stat { background:#fff; border:1px solid var(--ing-border); border-radius:12px; padding:16px 20px; box-shadow:var(--ing-shadow); transition:box-shadow .2s; }
  .ing-stat:hover { box-shadow:var(--ing-shadow-lg); }

  .ing-btn-primary {
    background: linear-gradient(135deg, var(--ing-amber), var(--ing-amber2));
    color:#fff; border:none; border-radius:10px; padding:10px 22px;
    font-family:'DM Sans',sans-serif; font-weight:600; font-size:.875rem;
    cursor:pointer; box-shadow:0 2px 8px rgba(201,123,43,.30);
    transition:transform .15s, box-shadow .15s;
  }
  .ing-btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(201,123,43,.40); }
  .ing-btn-primary:active { transform:translateY(0); }

  .ing-section-label {
    font-size:.625rem; font-weight:700; letter-spacing:.12em;
    text-transform:uppercase; color:var(--ing-amber); margin-bottom:10px;
  }

  .ing-field {
    width:100%; padding:9px 13px; background:#fff;
    border:1.5px solid var(--ing-border); border-radius:9px;
    font-family:'DM Sans',sans-serif; font-size:.875rem; color:var(--ing-dark);
    transition:border-color .15s, box-shadow .15s; outline:none;
    box-sizing:border-box;
  }
  .ing-field:focus { border-color:var(--ing-amber); box-shadow:0 0 0 3px rgba(201,123,43,.12); }
  .ing-field.err   { border-color:var(--ing-red); }
  .ing-err-msg { color:var(--ing-red); font-size:.75rem; margin-top:4px; }

  /* ingredient pill in table */
  .ing-pill {
    display:inline-flex; align-items:center; gap:6px;
    background:var(--ing-sand); border:1px solid var(--ing-border);
    border-radius:99px; padding:4px 13px;
    font-size:.78rem; font-weight:500; color:var(--ing-dark);
  }

  /* tag cloud chip */
  .ing-tag {
    display:inline-flex; align-items:center; gap:5px;
    background:#fff; border:1.5px solid var(--ing-border);
    border-radius:99px; padding:5px 13px;
    font-size:.78rem; font-weight:500; color:var(--ing-dark);
    box-shadow:var(--ing-shadow); transition:all .15s;
  }
  .ing-tag:hover { border-color:var(--ing-amber); background:rgba(201,123,43,.06); }

  /* suggestion chip */
  .ing-suggestion {
    display:inline-flex; align-items:center; gap:5px;
    background:#fff; border:1.5px solid var(--ing-border);
    border-radius:99px; padding:4px 12px;
    font-size:.75rem; font-weight:500; color:var(--ing-dark);
    cursor:pointer; transition:all .12s;
    font-family:'DM Sans',sans-serif;
  }
  .ing-suggestion:hover:not(:disabled) { border-color:var(--ing-amber); background:rgba(201,123,43,.08); color:var(--ing-amber); }
  .ing-suggestion.exists { opacity:.45; cursor:not-allowed; background:var(--ing-sand); }
  .ing-suggestion.selected { border-color:var(--ing-amber); background:rgba(201,123,43,.12); color:var(--ing-amber); font-weight:600; }

  /* search box */
  .ing-search {
    padding:8px 13px 8px 36px; background:#fff;
    border:1.5px solid var(--ing-border); border-radius:9px;
    font-family:'DM Sans',sans-serif; font-size:.85rem; color:var(--ing-dark);
    outline:none; transition:border-color .15s, box-shadow .15s; width:100%; box-sizing:border-box;
  }
  .ing-search:focus { border-color:var(--ing-amber); box-shadow:0 0 0 3px rgba(201,123,43,.12); }

  .ing-form-section { background:var(--ing-sand); border-radius:12px; padding:16px; }
`;

// ─── Ingredient icon mapper ───────────────────────────────────────────────────
const getIngredientIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.match(/tomato/))                         return '🍅';
  if (n.match(/onion/))                          return '🧅';
  if (n.match(/garlic/))                         return '🧄';
  if (n.match(/lemon|lime/))                     return '🍋';
  if (n.match(/chilli|chili|pepper/))            return '🌶️';
  if (n.match(/carrot/))                         return '🥕';
  if (n.match(/lettuce|spinach|kale|greens/))    return '🥬';
  if (n.match(/broccoli/))                       return '🥦';
  if (n.match(/corn|maize/))                     return '🌽';
  if (n.match(/potato/))                         return '🥔';
  if (n.match(/avocado/))                        return '🥑';
  if (n.match(/egg/))                            return '🥚';
  if (n.match(/cheese/))                         return '🧀';
  if (n.match(/butter|cream|milk|dairy/))        return '🧈';
  if (n.match(/chicken|poultry/))                return '🍗';
  if (n.match(/beef|steak|meat/))                return '🥩';
  if (n.match(/fish|salmon|tuna|cod/))           return '🐟';
  if (n.match(/shrimp|prawn|lobster|crab/))      return '🦐';
  if (n.match(/mushroom/))                       return '🍄';
  if (n.match(/rice/))                           return '🍚';
  if (n.match(/bread|flour|wheat/))              return '🍞';
  if (n.match(/pasta|noodle/))                   return '🍝';
  if (n.match(/oil|olive/))                      return '🫙';
  if (n.match(/salt|pepper|spice|herb/))         return '🧂';
  if (n.match(/sugar|honey/))                    return '🍯';
  if (n.match(/apple/))                          return '🍎';
  if (n.match(/strawberr/))                      return '🍓';
  if (n.match(/banana/))                         return '🍌';
  if (n.match(/coconut/))                        return '🥥';
  if (n.match(/bean|lentil|legume/))             return '🫘';
  if (n.match(/nut|almond|walnut|cashew/))       return '🥜';
  if (n.match(/ginger/))                         return '🫚';
  if (n.match(/cucumber/))                       return '🥒';
  if (n.match(/tofu|soy/))                       return '🫘';
  if (n.match(/wine|vinegar/))                   return '🍷';
  return '🥗';
};

// ─── Common ingredient suggestions by category ────────────────────────────────
const SUGGESTIONS = [
  'Tomato', 'Onion', 'Garlic', 'Ginger', 'Lemon', 'Lime',
  'Chilli', 'Bell Pepper', 'Carrot', 'Spinach', 'Broccoli',
  'Mushroom', 'Avocado', 'Potato', 'Cucumber', 'Corn',
  'Chicken', 'Beef', 'Salmon', 'Shrimp', 'Tofu',
  'Cheese', 'Butter', 'Cream', 'Egg', 'Milk',
  'Olive Oil', 'Salt', 'Sugar', 'Honey', 'Rice', 'Pasta', 'Flour',
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub }) => (
  <div className="ing-stat">
    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'Fraunces', serif", color: 'var(--ing-dark)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--ing-muted)', marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: '.7rem', color: 'var(--ing-amber)', marginTop: 2 }}>{sub}</div>}
  </div>
);

export const IngredientsPage = () => {
  const { canCreate, canDelete } = useAdmin();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchIngredients(); }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const data = await ingredientsApi.getAll();
      setIngredients(data);
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
    const { valid, errors } = validateIngredient(formData);
    if (!valid) { setFormErrors(errors); return; }
    try {
      setFormLoading(true);
      await ingredientsApi.create(formData.name);
      showToast('Ingredient created successfully', 'success');
      setShowForm(false); await fetchIngredients();
    } catch (error) { showToast(error.message, 'error'); }
    finally { setFormLoading(false); }
  };

  const handleDeleteClick = (item) => { setDeleteTarget(item); setShowDeleteModal(true); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await ingredientsApi.delete(deleteTarget.id);
      showToast('Ingredient deleted successfully', 'success');
      setShowDeleteModal(false); setDeleteTarget(null); await fetchIngredients();
    } catch (error) { showToast(error.message, 'error'); }
    finally { setDeleteLoading(false); }
  };

  // ─── Filtered list for tag cloud & table ─────────────────────────────────
  const filtered = searchQuery.trim()
    ? ingredients.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : ingredients;

  const columns = [
    {
      key: 'id', label: '#', sortable: true,
      render: (v) => <span style={{ color: 'var(--ing-muted)', fontSize: '.78rem' }}>#{v}</span>,
    },
    {
      key: 'name', label: 'Ingredient', sortable: true,
      render: (name) => (
        <div className="ing-pill">
          <span style={{ fontSize: '1rem' }}>{getIngredientIcon(name)}</span>
          <span style={{ fontWeight: 600, color: 'var(--ing-dark)' }}>{name}</span>
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: 'Delete', icon: '🗑️', color: 'red',
      onClick: handleDeleteClick, disabled: () => !canDelete('ingredients'),
    },
  ];

  return (
    <div className="ing-page" style={{ minHeight: '100vh', padding: '28px 32px' }}>
      <style>{STYLE}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="ing-section-label" style={{ marginBottom: 4 }}>Menu Management</p>
          <h1 className="ing-title" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--ing-dark)', margin: 0 }}>
            Ingredients
          </h1>
          <p style={{ color: 'var(--ing-muted)', fontSize: '.85rem', marginTop: 4 }}>
            {ingredients.length} ingredients in your master list
          </p>
        </div>
        {canCreate('ingredients') && (
          <button className="ing-btn-primary" onClick={handleCreateClick}>
            + Add Ingredient
          </button>
        )}
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon="🥗" label="Total Ingredients" value={ingredients.length} />
        <StatCard
          icon="🍖"
          label="Proteins"
          value={ingredients.filter(i => i.name?.toLowerCase().match(/chicken|beef|fish|salmon|tuna|shrimp|prawn|pork|lamb|tofu|egg/)).length}
          sub="meat, seafood & plant"
        />
        <StatCard
          icon="🥦"
          label="Vegetables"
          value={ingredients.filter(i => i.name?.toLowerCase().match(/tomato|onion|carrot|spinach|broccoli|pepper|lettuce|cucumber|potato|corn|mushroom|avocado|garlic|ginger/)).length}
        />
        <StatCard
          icon="🧂"
          label="Pantry Items"
          value={ingredients.filter(i => i.name?.toLowerCase().match(/oil|salt|sugar|flour|rice|pasta|butter|cream|milk|cheese|honey|vinegar|spice|herb/)).length}
        />
      </div>

      {/* ── Tag Cloud ──────────────────────────────────────── */}
      {ingredients.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p className="ing-section-label" style={{ margin: 0 }}>All Ingredients</p>
            <span style={{ fontSize: '.72rem', color: 'var(--ing-muted)' }}>{filtered.length} shown</span>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 12, maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: '.9rem', pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              className="ing-search"
              placeholder="Filter ingredients…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {filtered.map(ing => (
              <div key={ing.id} className="ing-tag">
                <span>{getIngredientIcon(ing.name)}</span>
                <span>{ing.name}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p style={{ fontSize: '.82rem', color: 'var(--ing-muted)', padding: '4px 0' }}>No ingredients match your search.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--ing-border)', boxShadow: 'var(--ing-shadow)', overflow: 'hidden' }}>
        <AdminTable
          columns={columns}
          data={filtered}
          loading={loading}
          actions={actions}
          emptyMessage="No ingredients found"
        />
      </div>

      {/* ── Form Modal ─────────────────────────────────────── */}
      <FormModal
        isOpen={showForm}
        title="Add Ingredient"
        submitLabel="Create Ingredient"
        loading={formLoading}
        onSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Live preview banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--ing-sand)', borderRadius: 12, padding: '14px 18px',
          }}>
            <span style={{ fontSize: '2rem' }}>{getIngredientIcon(formData.name)}</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--ing-dark)', fontFamily: "'Fraunces', serif", fontSize: '1rem' }}>
                {formData.name || 'New Ingredient'}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--ing-muted)', marginTop: 2 }}>
                Icon auto-detected as you type
              </div>
            </div>
          </div>

          {/* Name input */}
          <div className="ing-form-section">
            <p className="ing-section-label">Ingredient Name</p>
            <input
              type="text" name="name" value={formData.name}
              onChange={handleFormChange}
              placeholder="e.g. Tomato, Garlic, Olive Oil…"
              maxLength="100" autoFocus
              className={`ing-field${formErrors.name ? ' err' : ''}`}
            />
            {formErrors.name && <p className="ing-err-msg">⚠ {formErrors.name}</p>}
          </div>

          {/* Quick suggestions */}
          <div>
            <p className="ing-section-label">Quick Add Suggestions</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map(s => {
                const exists = ingredients.some(i => i.name.toLowerCase() === s.toLowerCase());
                const selected = formData.name.toLowerCase() === s.toLowerCase();
                return (
                  <button
                    key={s}
                    className={`ing-suggestion${exists ? ' exists' : ''}${selected ? ' selected' : ''}`}
                    onClick={() => !exists && setFormData({ name: s })}
                    disabled={exists}
                    title={exists ? 'Already added' : `Use "${s}"`}
                  >
                    <span>{getIngredientIcon(s)}</span>
                    <span>{s}</span>
                    {exists && <span style={{ fontSize: '.65rem' }}>✓</span>}
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
        title="Delete Ingredient"
        message="Are you sure you want to delete this ingredient? It may be linked to existing food items."
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

export default IngredientsPage;