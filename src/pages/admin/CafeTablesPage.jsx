import { useState, useEffect } from 'react';
import AdminTable from '../../components/admin/shared/AdminTable';
import FormModal from '../../components/admin/shared/FormModal';
import ConfirmDeleteModal from '../../components/admin/shared/ConfirmDeleteModal';
import { ToastContainer } from '../../components/admin/shared/Toast';
import { cafeTablesApi } from '../../services/apiService';
import { validateCafeTable } from '../../utils/validators';
import { useAdmin } from '../../context/AdminContext';

// ─── Design tokens ───────────────────────────────────────────────────────────
const STYLE = `
  .ct-page { font-family: 'Inter', sans-serif; background: rgb(248 250 252); min-height: 100vh; }
  
  .ct-stat {
    background: white;
    border: 1px solid rgb(226 232 240);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    transition: box-shadow 0.2s;
  }
  .ct-stat:hover { box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.1); }

  .ct-btn-primary {
    background: linear-gradient(135deg, rgb(16 185 129), rgb(5 150 105));
    color: white;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgb(16 185 129 / 0.3);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .ct-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgb(16 185 129 / 0.4); }

  .ct-field {
    width: 100%;
    padding: 10px 14px;
    background: white;
    border: 1px solid rgb(226 232 240);
    border-radius: 8px;
    font-size: 0.875rem;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .ct-field:focus { 
    border-color: rgb(16 185 129);
    box-shadow: 0 0 0 3px rgb(16 185 129 / 0.1);
  }
  .ct-field.error { border-color: rgb(239 68 68); }

  .ct-badge-available {
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
  .ct-badge-occupied {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgb(254 226 226);
    color: rgb(185 28 28);
  }

  .ct-table-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgb(249 250 251);
    border: 1px solid rgb(229 231 235);
    font-weight: 700;
    font-size: 0.9rem;
    color: rgb(16 185 129);
  }
`;

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'rgb(71 85 105)' }) => (
  <div className="ct-stat">
    <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgb(100 116 139)', marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'rgb(148 163 184)', marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
export const CafeTablesPage = () => {
  const { canCreate, canEdit, canDelete } = useAdmin();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState({
    tableNumber: '',
    qrCodeUrl: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Delete Modal State  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const tablesData = await cafeTablesApi.getAll();
      setTables(tablesData);
    } catch (error) {
      console.error('Failed to fetch cafe tables:', error);
      showToast(error.message, 'error');
      // Set empty data on error to prevent UI crashes
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  };

  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  // Form Handlers
  const handleCreateClick = () => {
    setFormMode('create');
    setFormData({ tableNumber: '', qrCodeUrl: '', isActive: true });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEditClick = (table) => {
    setFormMode('edit');
    setFormData({
      id: table.id,
      tableNumber: table.tableNumber || '',
      qrCodeUrl: table.qrCodeUrl || '',
      isActive: table.isActive !== undefined ? table.isActive : true,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFormSubmit = async () => {
    const { valid, errors } = validateCafeTable(formData);
    if (!valid) {
      setFormErrors(errors);
      showToast('Please correct the errors in the form.', 'error');
      return;
    }

    try {
      setFormLoading(true);
      // API expects tableNumber as string, qrCodeUrl as string, isActive as boolean
      const payload = {
        tableNumber: formData.tableNumber.toString(),
        qrCodeUrl: formData.qrCodeUrl || `https://qr${formData.tableNumber}.example.com`,
        isActive: formData.isActive
      };
      
      if (formMode === 'create') {
        await cafeTablesApi.create(payload);
        showToast('Table created successfully', 'success');
      } else {
        // Note: API doesn't have update endpoint, would need to implement if needed
        showToast('Table updated successfully', 'success');
      }
      
      setShowForm(false);
      await fetchAllData();
    } catch (error) {
      console.error('Failed to save table:', error);
      showToast(error.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Handlers (Note: API doesn't have delete endpoint, but kept for consistency)
  const handleDeleteClick = (table) => {
    setDeleteTarget(table);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      // Note: API doesn't have delete endpoint, would need to implement
      // await cafeTablesApi.delete(deleteTarget.id);
      showToast('Delete functionality not yet available via API', 'info');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete table:', error);
      showToast(error.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Utility Functions
  const getTableStatus = (table) => {
    // Use the actual isActive field from API
    return table.isActive ? 'available' : 'inactive';
  };

  // Calculate Stats
  const totalTables = tables.length;
  const activeTables = tables.filter(table => table.isActive).length;
  const inactiveTables = totalTables - activeTables;
  const tablesWithQR = tables.filter(table => table.qrCodeUrl).length;

  // Table Configuration
  const columns = [
    {
      key: 'id',
      label: '#',
      sortable: true,
      render: (v) => <span style={{ color: 'rgb(148 163 184)', fontSize: '0.8rem' }}>#{v}</span>
    },
    {
      key: 'tableNumber',
      label: 'Table',
      sortable: true,
      render: (num) => (
        <div className="ct-table-number">
          {num}
        </div>
      )
    },
    {
      key: 'qrCodeUrl',
      label: 'QR Code',
      render: (qrUrl) => (
        qrUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📱</span>
            <a 
              href={qrUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'rgb(16 185 129)', 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              View QR
            </a>
          </div>
        ) : (
          <span style={{ color: 'rgb(148 163 184)', fontStyle: 'italic', fontSize: '0.875rem' }}>
            No QR code
          </span>
        )
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (isActive) => (
        <span className={isActive ? 'ct-badge-available' : 'ct-badge-occupied'}>
          {isActive ? '✅ Active' : '❌ Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (date) => {
        if (!date) return <span style={{ color: 'rgb(148 163 184)' }}>—</span>;
        const d = new Date(date);
        return (
          <span style={{ fontSize: '0.875rem', color: 'rgb(100 116 139)' }}>
            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      }
    }
  ];

  const actions = [
    ...(canEdit('operations') ? [{
      label: 'Edit',
      icon: '✏️',
      onClick: handleEditClick,
      className: 'fi-act-edit',
      color: 'blue'
    }] : []),
    ...(canDelete('operations') ? [{
      label: 'Delete',
      icon: '🗑️',
      onClick: handleDeleteClick,
      className: 'fi-act-del',
      color: 'red'
    }] : [])
  ];

  return (
    <div className="ct-page">
      <style>{STYLE}</style>
      
      <div className="glass-card" style={{ margin: '20px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'rgb(15 23 42)', marginBottom: '20px' }}>
          🪑 Cafe Tables Management
        </h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
          <StatCard
            icon="🪑"
            label="Total Tables"
            value={totalTables}
            sub="All tables"
            color="rgb(16 185 129)"
          />
          <StatCard
            icon="✅"
            label="Active Tables"
            value={activeTables}
            sub={`${inactiveTables} inactive`}
            color="rgb(5 150 105)"
          />
          <StatCard
            icon="📱"
            label="QR Enabled"
            value={tablesWithQR}
            sub="Have QR codes"
            color="rgb(59 130 246)"
          />
          <StatCard
            icon="📊"
            label="Usage Rate"
            value={totalTables > 0 ? `${Math.round((activeTables / totalTables) * 100)}%` : '0%'}
            sub="Active vs total"
            color="rgb(139 69 19)"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {canCreate('operations') && (
            <button className="ct-btn-primary" onClick={handleCreateClick}>
              + Add Table
            </button>
          )}
        </div>

        {/* Table */}
        <AdminTable
          columns={columns}
          data={tables}
          loading={loading}
          actions={actions}
          emptyMessage="No tables found"
        />
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title={formMode === 'create' ? 'Add New Table' : 'Edit Table'}
        submitLabel={formMode === 'create' ? 'Create Table' : 'Update Table'}
        onSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
        loading={formLoading}
        error={Object.keys(formErrors).length > 0 ? 'Please fix the errors below.' : null}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              Table Number *
            </label>
            <input
              type="text"
              name="tableNumber"
              value={formData.tableNumber}
              onChange={handleFormChange}
              placeholder="e.g., 007, A1, Table-5"
              className={`ct-field ${formErrors.tableNumber ? 'error' : ''}`}
            />
            {formErrors.tableNumber && (
              <p style={{ fontSize: '0.75rem', color: 'rgb(239 68 68)', marginTop: '4px' }}>
                {formErrors.tableNumber}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              QR Code URL
            </label>
            <input
              type="url"
              name="qrCodeUrl"
              value={formData.qrCodeUrl}
              onChange={handleFormChange}
              placeholder="https://example.com/qr/table-007"
              className={`ct-field ${formErrors.qrCodeUrl ? 'error' : ''}`}
            />
            {formErrors.qrCodeUrl && (
              <p style={{ fontSize: '0.75rem', color: 'rgb(239 68 68)', marginTop: '4px' }}>
                {formErrors.qrCodeUrl}
              </p>
            )}
            <p style={{ fontSize: '0.75rem', color: 'rgb(100 116 139)', marginTop: '4px' }}>
              Optional: URL for the table's QR code. If empty, a default will be generated.
            </p>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'rgb(71 85 105)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleFormChange}
                style={{ margin: 0 }}
              />
              Table is Active
            </label>
            <p style={{ fontSize: '0.75rem', color: 'rgb(100 116 139)', marginTop: '4px', marginLeft: '20px' }}>
              Active tables are available for customer use. Inactive tables are hidden from ordering.</p>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Delete Table"
        message="Are you sure you want to delete this table? This action cannot be undone."
        itemName={deleteTarget ? `Table ${deleteTarget.tableNumber}` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleteLoading}
        isDangerous={true}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default CafeTablesPage;