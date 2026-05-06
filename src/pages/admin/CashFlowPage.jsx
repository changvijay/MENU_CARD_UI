import { useState, useEffect } from 'react';
import AdminTable from '../../components/admin/shared/AdminTable';
import FormModal from '../../components/admin/shared/FormModal';
import ConfirmDeleteModal from '../../components/admin/shared/ConfirmDeleteModal';
import { ToastContainer } from '../../components/admin/shared/Toast';
import {
  cashFlowApi,
} from '../../services/apiService';
import { validateCashFlow } from '../../utils/validators';
import { createFormData } from '../../utils/imageUploadHandler';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';

// ─── Design tokens ───────────────────────────────────────────────────────────
const STYLE = `
  .cf-page { font-family: 'Inter', sans-serif; background: rgb(248 250 252); min-height: 100vh; }
  
  .cf-stat {
    background: white;
    border: 1px solid rgb(226 232 240);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    transition: box-shadow 0.2s;
  }
  .cf-stat:hover { box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.1); }

  .cf-btn-primary {
    background: linear-gradient(135deg, rgb(59 130 246), rgb(37 99 235));
    color: white;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgb(59 130 246 / 0.3);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .cf-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgb(59 130 246 / 0.4); }
  
  .cf-btn-secondary {
    background: rgb(248 250 252);
    color: rgb(71 85 105);
    border: 1px solid rgb(226 232 240);
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .cf-btn-secondary:hover { background: rgb(241 245 249); }

  .cf-field {
    width: 100%;
    padding: 10px 14px;
    background: white;
    border: 1px solid rgb(226 232 240);
    border-radius: 8px;
    font-size: 0.875rem;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .cf-field:focus { 
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
  }
  .cf-field.error { border-color: rgb(239 68 68); }

  .cf-badge-income {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgb(220 252 231);
    color: rgb(5 150 105);
  }
  .cf-badge-expense {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgb(254 226 226);
    color: rgb(220 38 38);
  }

  .cf-range-selector {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  .cf-range-btn {
    padding: 6px 12px;
    border: 1px solid rgb(226 232 240);
    border-radius: 6px;
    background: white;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .cf-range-btn.active {
    background: rgb(59 130 246);
    color: white;
    border-color: rgb(59 130 246);
  }
  .cf-range-btn:hover:not(.active) { background: rgb(248 250 252); }
`;

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'rgb(71 85 105)' }) => (
  <div className="cf-stat">
    <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgb(100 116 139)', marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'rgb(148 163 184)', marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─── Range Selector ──────────────────────────────────────────────────────────
const RangeSelector = ({ activeRange, onRangeChange }) => {
  const ranges = [
    { value: 1, label: 'Today' },
    { value: 2, label: '7 days' },
    { value: 3, label: '30 days' },
    { value: 4, label: '365 days' },
    { value: 5, label: 'All time' },
  ];

  return (
    <div className="cf-range-selector">
      <span style={{ fontSize: '0.875rem', color: 'rgb(100 116 139)', alignSelf: 'center', marginRight: 8 }}>
        Show last:
      </span>
      {ranges.map(({ value, label }) => (
        <button
          key={value}
          className={`cf-range-btn ${activeRange === value ? 'active' : ''}`}
          onClick={() => onRangeChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const CashFlowPage = () => {
  const { canCreate, canEdit, canDelete } = useAdmin();
  const { user } = useAuth();
  const [cashFlowEntries, setCashFlowEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [range, setRange] = useState(2); // Default to 7 days
  
  // Categories State
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Cash Flow Entry Form State
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    type: 'income',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    referenceId: '',
    createdBy: user?.id || '', // Auto-populate with current user ID
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchAllData(); }, [range]);
  useEffect(() => { fetchCategories(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const entries = await cashFlowApi.getAll(range);
      setCashFlowEntries(entries);
    } catch (error) {
      console.error('Failed to fetch cash flow data:', error);
      showToast(error.message, 'error');
      // Set empty data on error to prevent UI crashes
      setCashFlowEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await cashFlowApi.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch cash flow categories:', error);
      showToast('Failed to load categories. Using default options.', 'error');
      // Set fallback categories if API fails
      setCategories([
        { id: 'fallback-1', name: 'Salary', type: 'income' },
        { id: 'fallback-2', name: 'Rent', type: 'expense' },
        { id: 'fallback-3', name: 'Utilities', type: 'expense' },
        { id: 'fallback-4', name: 'Office Supplies', type: 'expense' },
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  };

  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  // Cash Flow Entry Handlers
  const handleCreateClick = () => {
    setFormMode('create');
    setFormData({ 
      description: '', 
      amount: '', 
      category: '', 
      type: 'income',
      date: new Date().toISOString().split('T')[0],
      referenceId: '',
      createdBy: user?.id || '' // Auto-populate with current user ID
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    
    // Auto-update transaction type when category is selected
    if (name === 'category') {
      const selectedCategory = categories.find(cat => cat.name === value);
      if (selectedCategory) {
        setFormData(prev => ({ ...prev, [name]: value, type: selectedCategory.type }));
      }
    }
  };

  const handleFormSubmit = async () => {
    const { valid, errors } = validateCashFlow(formData);
    if (!valid) {
      setFormErrors(errors);
      showToast('Please correct the errors in the form.', 'error');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
        ...(formData.referenceId && { referenceId: parseInt(formData.referenceId) }),
        // Always include createdBy if we have user data
        ...(formData.createdBy && { createdBy: parseInt(formData.createdBy) })
      };
      
      if (formMode === 'create') {
        await cashFlowApi.create(payload);
        showToast('Cash flow entry created successfully', 'success');
      } else {
        await cashFlowApi.update(formData.id, payload);
        showToast('Cash flow entry updated successfully', 'success');
      }
      
      setShowForm(false);
      await fetchAllData();
    } catch (error) {
      console.error('Failed to save cash flow entry:', error);
      showToast(error.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Handlers
  const handleDeleteClick = (entry) => {
    setDeleteTarget(entry);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      await cashFlowApi.delete(deleteTarget.id);
      showToast('Cash flow entry deleted successfully', 'success');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchAllData();
    } catch (error) {
      console.error('Failed to delete cash flow entry:', error);
      showToast(error.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Utility Functions

  const formatCurrency = (amount) => `$${parseFloat(amount || 0).toFixed(2)}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Calculate Stats
  const totalIncome = cashFlowEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalExpenses = cashFlowEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const netCashFlow = totalIncome - totalExpenses;

  // Get range description for stats
  const getRangeDescription = (rangeValue) => {
    const rangeMap = {
      1: 'Today',
      2: 'Last 7 days',
      3: 'Last 30 days',
      4: 'Last 365 days',
      5: 'All time'
    };
    return rangeMap[rangeValue] || 'Selected period';
  };

  // Table Configuration
  const columns = [
    {
      key: 'id',
      label: '#',
      sortable: true,
      render: (v) => <span style={{ color: 'rgb(148 163 184)', fontSize: '0.8rem' }}>#{v}</span>
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (date) => <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{formatDate(date)}</span>
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (desc) => <span style={{ fontWeight: 600, color: 'rgb(15 23 42)' }}>{desc}</span>
    },
    {
      key: 'category',
      label: 'Category',
      render: (category) => (
        <span style={{
          background: 'rgb(241 245 249)',
          borderRadius: 16,
          padding: '4px 12px',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'rgb(71 85 105)'
        }}>
          {category || 'Uncategorized'}
        </span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (type) => (
        <span className={type === 'income' ? 'cf-badge-income' : 'cf-badge-expense'}>
          {type === 'income' ? '↗️' : '↘️'} {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (amount, row) => (
        <span style={{
          fontWeight: 700,
          fontSize: '0.9rem',
          color: row.type === 'income' ? 'rgb(5 150 105)' : 'rgb(220 38 38)'
        }}>
          {row.type === 'income' ? '+' : '-'}{formatCurrency(amount)}
        </span>
      )
    },
  ];

  // const actions = [
  //   ...(canEdit('operations') ? [{
  //     label: 'Edit',
  //     onClick: handleEdit,
  //     className: 'fi-act-edit'
  //   }] : []),
  //   ...(canDelete('operations') ? [{
  //     label: 'Delete',
  //     onClick: handleDeleteClick,
  //     className: 'fi-act-del'
  //   }] : [])
  // ];

   const actions = [
    ...(canDelete('operations') ? [{
      label: 'Delete',
      icon: '🗑️',
      onClick: handleDeleteClick,
      className: 'fi-act-del',
      color: 'red'
    }] : [])
  ];

  return (
    <div className="cf-page">
      <style>{STYLE}</style>
      
      <div className="glass-card" style={{ margin: '20px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'rgb(15 23 42)', marginBottom: '20px' }}>
          💰 Cash Flow Management
        </h1>

        <RangeSelector activeRange={range} onRangeChange={setRange} />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
          <StatCard
            icon="📈"
            label="Total Income"
            value={formatCurrency(totalIncome)}
            sub={getRangeDescription(range)}
            color="rgb(5 150 105)"
          />
          <StatCard
            icon="📉"
            label="Total Expenses"
            value={formatCurrency(totalExpenses)}
            sub={getRangeDescription(range)}
            color="rgb(220 38 38)"
          />
          <StatCard
            icon="💰"
            label="Net Cash Flow"
            value={formatCurrency(netCashFlow)}
            sub={netCashFlow >= 0 ? 'Positive flow' : 'Negative flow'}
            color={netCashFlow >= 0 ? 'rgb(5 150 105)' : 'rgb(220 38 38)'}
          />
          <StatCard
            icon="📊"
            label="Total Entries"
            value={cashFlowEntries.length}
            sub={getRangeDescription(range)}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {canCreate('operations') && (
            <button className="cf-btn-primary" onClick={handleCreateClick}>
              + Add Cash Flow Entry
            </button>
          )}
        </div>

        {/* Table */}
        <AdminTable
          columns={columns}
          data={cashFlowEntries}
          loading={loading}
          actions={actions}
          emptyMessage="No cash flow entries found"
        />
      </div>

      {/* Cash Flow Entry Form Modal */}
      <FormModal
        isOpen={showForm}
        title={formMode === 'create' ? 'Add Cash Flow Entry' : 'Edit Cash Flow Entry'}
        submitLabel={formMode === 'create' ? 'Create Entry' : 'Update Entry'}
        onSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
        loading={formLoading}
        error={Object.keys(formErrors).length > 0 ? 'Please fix the errors below.' : null}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              Description *
            </label>
            <input
              className={`cf-field ${formErrors.description ? 'error' : ''}`}
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="e.g., Coffee shop sales, Office supplies"
            />
            {formErrors.description && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.description}</div>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              Amount *
            </label>
            <input
              className={`cf-field ${formErrors.amount ? 'error' : ''}`}
              name="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={handleFormChange}
              placeholder="0.00"
            />
            {formErrors.amount && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.amount}</div>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              Transaction Type *
            </label>
            <select
              className={`cf-field ${formErrors.type ? 'error' : ''}`}
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              disabled={categoriesLoading}
            >
              <option value="">Select Transaction Type</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            {formErrors.type && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.type}</div>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              Category *
            </label>
            <select
              className={`cf-field ${formErrors.category ? 'error' : ''}`}
              name="category"
              value={formData.category}
              onChange={handleFormChange}
              disabled={categoriesLoading}
            >
              <option value="">Select Category</option>
              {categories
                .filter(cat => !formData.type || cat.type === formData.type)
                .map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name} ({category.type})
                  </option>
                ))}
            </select>
            {categoriesLoading && (
              <div style={{ fontSize: '0.75rem', color: 'rgb(148 163 184)', marginTop: '4px' }}>
                Loading categories...
              </div>
            )}
            {!categoriesLoading && categories.length === 0 && (
              <div style={{ fontSize: '0.75rem', color: 'rgb(239 68 68)', marginTop: '4px' }}>
                No categories available. Please add some categories first.
              </div>
            )}
            {formErrors.category && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.category}</div>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              Date *
            </label>
            <input
              className={`cf-field ${formErrors.date ? 'error' : ''}`}
              name="date"
              type="date"
              value={formData.date}
              onChange={handleFormChange}
            />
            {formErrors.date && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.date}</div>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              Reference ID
            </label>
            <input
              className={`cf-field ${formErrors.referenceId ? 'error' : ''}`}
              name="referenceId"
              type="number"
              value={formData.referenceId}
              onChange={handleFormChange}
              placeholder="Optional reference number"
            />
            {formErrors.referenceId && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{formErrors.referenceId}</div>}
          </div>

          {/* Hidden field - Created By is auto-populated with current user */}
          <input type="hidden" name="createdBy" value={formData.createdBy} />
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Delete Cash Flow Entry"
        message="Are you sure you want to delete this cash flow entry? This action cannot be undone."
        itemName={deleteTarget?.description}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleteLoading}
        isDangerous={true}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
    
  );
};

export default CashFlowPage;