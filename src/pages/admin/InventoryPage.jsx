import { useState, useEffect } from 'react';
import AdminTable from '../../components/admin/shared/AdminTable';
import FormModal from '../../components/admin/shared/FormModal';
import { ToastContainer } from '../../components/admin/shared/Toast';
import {
  inventoryApi,
  inventoryTransactionsApi,
} from '../../services/apiService';
import { validateInventoryTransaction } from '../../utils/validators';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';

// ─── Design tokens ───────────────────────────────────────────────────────────
const STYLE = `
  .inv-page { font-family: 'Inter', sans-serif; background: rgb(248 250 252); min-height: 100vh; }
  
  .inv-stat {
    background: white;
    border: 1px solid rgb(226 232 240);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    transition: box-shadow 0.2s;
  }
  .inv-stat:hover { box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.1); }

  .inv-btn-primary {
    background: linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234));
    color: white;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgb(168 85 247 / 0.3);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .inv-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgb(168 85 247 / 0.4); }

  .inv-field {
    width: 100%;
    padding: 10px 14px;
    background: white;
    border: 1px solid rgb(226 232 240);
    border-radius: 8px;
    font-size: 0.875rem;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .inv-field:focus { 
    border-color: rgb(168 85 247);
    box-shadow: 0 0 0 3px rgb(168 85 247 / 0.1);
  }
  .inv-field.error { border-color: rgb(239 68 68); }

  .inv-badge-low {
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
  .inv-badge-normal {
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
  .inv-badge-high {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgb(219 234 254);
    color: rgb(29 78 216);
  }

  .inv-quantity {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }

  .inv-transaction-type-in {
    background: rgb(220 252 231);
    color: rgb(5 150 105);
    border-radius: 16px;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .inv-transaction-type-out {
    background: rgb(254 226 226);
    color: rgb(220 38 38);
    border-radius: 16px;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .inv-transaction-type-adjustment {
    background: rgb(255 237 213);
    color: rgb(194 65 12);
    border-radius: 16px;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 600;
  }
`;

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'rgb(71 85 105)' }) => (
  <div className="inv-stat">
    <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgb(100 116 139)', marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'rgb(148 163 184)', marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
export const InventoryPage = () => {
  const { canCreate, canEdit } = useAdmin();
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Transaction Form State
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionFormData, setTransactionFormData] = useState({
    ingredientId: '',
    quantityChange: '',
    type: 'STOCK_IN',
    notes: '',
    createdBy: user?.id || '',
    cost: '',
    unit: '',
    minThreshold: '',
    costPerUnit: '',
  });
  const [transactionFormErrors, setTransactionFormErrors] = useState({});
  const [transactionFormLoading, setTransactionFormLoading] = useState(false);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [items, ingredientsData] = await Promise.all([
        inventoryApi.getAll(),
        fetchIngredients()
      ]);
      setInventoryItems(items);
      setIngredients(ingredientsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast(error.message, 'error');
      // Set empty data on error to prevent UI crashes
      setInventoryItems([]);
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch('https://menu-card-api-yvzycdnaqq-el.a.run.app/api/menu/ingredients', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      throw error;
    }
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  };

  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  // Transaction Handlers
  const handleCreateTransactionClick = () => {
    setTransactionFormData({
      ingredientId: '',
      quantityChange: '',
      type: 'STOCK_IN',
      notes: '',
      createdBy: user?.id || '',
      cost: '',
      unit: '',
      minThreshold: '',
      costPerUnit: '',
    });
    setTransactionFormErrors({});
    setShowTransactionForm(true);
  };

  const handleTransactionFormChange = (e) => {
    const { name, value } = e.target;
    
    // When ingredientId changes, try to find matching inventory item for auto-population
    if (name === 'ingredientId' && value) {
      // First check if there's a matching inventory item with this ingredient_id
      const matchingInventoryItem = inventoryItems.find(item => item.ingredient_id === parseInt(value));
      const selectedIngredient = ingredients.find(ing => ing.id === parseInt(value));
      
      if (matchingInventoryItem) {
        const newFormData = {
          ...transactionFormData,
          [name]: value,
          unit: matchingInventoryItem.unit || '',
          minThreshold: matchingInventoryItem.min_threshold || '',
          costPerUnit: matchingInventoryItem.cost_per_unit || '',
        };
        
        // Auto-calculate cost if quantity and costPerUnit are available
        if (newFormData.quantityChange && newFormData.costPerUnit) {
          newFormData.cost = (parseFloat(newFormData.quantityChange) * parseFloat(newFormData.costPerUnit)).toFixed(2);
        }
        
        setTransactionFormData(newFormData);
      } else if (selectedIngredient) {
        // If no inventory item matches, just set the ingredient info
        setTransactionFormData(prev => ({
          ...prev,
          [name]: value,
          unit: '', // Reset since no inventory data available
          minThreshold: '',
          costPerUnit: '',
        }));
      } else {
        setTransactionFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      const newFormData = { ...transactionFormData, [name]: value };
      
      // Auto-calculate cost when quantity or costPerUnit changes
      if ((name === 'quantityChange' || name === 'costPerUnit') && 
          newFormData.quantityChange && newFormData.costPerUnit) {
        newFormData.cost = (parseFloat(newFormData.quantityChange) * parseFloat(newFormData.costPerUnit)).toFixed(2);
      }
      
      setTransactionFormData(newFormData);
    }
    
    if (transactionFormErrors[name]) setTransactionFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTransactionFormSubmit = async () => {
    const { valid, errors } = validateInventoryTransaction(transactionFormData);
    if (!valid) {
      setTransactionFormErrors(errors);
      showToast('Please correct the errors in the form.', 'error');
      return;
    }

    try {
      setTransactionFormLoading(true);
      const payload = {
        type: transactionFormData.type,
        ingredientId: parseInt(transactionFormData.ingredientId),
        quantityChange: parseFloat(transactionFormData.quantityChange),
        notes: transactionFormData.notes || '',
        createdBy: parseInt(transactionFormData.createdBy),
        cost: parseFloat(transactionFormData.cost) || 0,
        unit: transactionFormData.unit,
        minThreshold: parseFloat(transactionFormData.minThreshold) || null,
        costPerUnit: parseFloat(transactionFormData.costPerUnit) || null,
      };
      
      await inventoryTransactionsApi.create(payload);
      showToast('Inventory transaction created successfully', 'success');
      setShowTransactionForm(false);
      await fetchAllData(); // Refresh inventory to show updated quantities
    } catch (error) {
      console.error('Failed to create inventory transaction:', error);
      showToast(error.message, 'error');
    } finally {
      setTransactionFormLoading(false);
    }
  };

  // Utility Functions
  const getStockStatus = (item) => {
    const quantity = item.quantity || 0;
    const minLevel = item.min_threshold || 10;
    
    if (quantity <= minLevel) return 'low';
    if (quantity > minLevel * 3) return 'high';
    return 'normal';
  };

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
  const totalItems = inventoryItems.length;
  const lowStockItems = inventoryItems.filter(item => getStockStatus(item) === 'low').length;
  const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const outOfStockItems = inventoryItems.filter(item => (item.quantity || 0) === 0).length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cost_per_unit || 0)), 0);

  // Table Configuration
  const columns = [
    {
      key: 'id',
      label: '#',
      sortable: true,
      render: (v) => <span style={{ color: 'rgb(148 163 184)', fontSize: '0.8rem' }}>#{v}</span>
    },
    {
      key: 'name',
      label: 'Item Name',
      sortable: true,
      render: (name) => <span style={{ fontWeight: 600, color: 'rgb(15 23 42)' }}>{name}</span>
    },
    {
      key: 'quantity',
      label: 'Stock',
      sortable: true,
      render: (quantity, row) => (
        <div className="inv-quantity">
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{quantity || 0}</span>
          <span style={{ fontSize: '0.75rem', color: 'rgb(107 114 128)' }}>
            {row.unit || 'units'}
          </span>
        </div>
      )
    },
    {
      key: 'min_threshold',
      label: 'Min Level',
      render: (minLevel) => (
        <span style={{ color: 'rgb(107 114 128)', fontSize: '0.875rem' }}>
          {minLevel || 0}
        </span>
      )
    },
    {
      key: 'cost_per_unit',
      label: 'Unit Cost',
      sortable: true,
      render: (cost) => (
        <span style={{ fontWeight: 600, color: 'rgb(34 197 94)' }}>
          ${parseFloat(cost || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const status = getStockStatus(row);
        const badgeClass = `inv-badge-${status}`;
        const icon = status === 'low' ? '⚠️' : status === 'high' ? '📈' : '✅';
        return (
          <span className={badgeClass}>
            {icon} {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      sortable: true,
      render: (date) => (
        <span style={{ fontSize: '0.875rem', color: 'rgb(100 116 139)' }}>
          {formatDate(date)}
        </span>
      )
    },
    {
      key: 'last_5_transactions',
      label: 'Recent Activity',
      render: (transactions) => {
        if (!transactions || transactions.length === 0) {
          return <span style={{ color: 'rgb(156 163 175)', fontSize: '0.75rem' }}>No activity</span>;
        }
        const lastTransaction = transactions[0];
        const typeColor = lastTransaction.type === 'STOCK_IN' ? 'rgb(34 197 94)' : 'rgb(239 68 68)';
        const typeIcon = lastTransaction.type === 'STOCK_IN' ? '📈' : '📉';
        return (
          <div title={`${lastTransaction.type}: ${lastTransaction.quantity_change} (${lastTransaction.notes})`}>
            <span style={{ color: typeColor, fontSize: '0.75rem', fontWeight: 600 }}>
              {typeIcon} {lastTransaction.type.replace('STOCK_', '')}
            </span>
            <div style={{ fontSize: '0.65rem', color: 'rgb(107 114 128)' }}>
              {Math.abs(lastTransaction.quantity_change)} {transactions.length > 1 ? `+${transactions.length-1} more` : ''}
            </div>
          </div>
        );
      }
    }
  ];

  const actions = [
    ...(canEdit('operations') ? [{
      label: 'Add Transaction',
            icon: '✏️',
      onClick: (item) => {
        setTransactionFormData({
          ingredientId: item.ingredient_id.toString(),
          quantityChange: '',
          type: 'STOCK_IN',
          notes: '',
          createdBy: user?.id || '',
          cost: '',
          unit: item.unit || '',
          minThreshold: item.min_threshold || '',
          costPerUnit: item.cost_per_unit || '',
        });
        setShowTransactionForm(true);
      },
      className: 'fi-act-edit'
    }] : [])
  ];

  return (
    <div className="inv-page">
      <style>{STYLE}</style>
      
      <div className="glass-card" style={{ margin: '20px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'rgb(15 23 42)', marginBottom: '20px' }}>
          📦 Inventory Management
        </h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
          <StatCard
            icon="📦"
            label="Total Items"
            value={totalItems}
            sub="In inventory"
            color="rgb(168 85 247)"
          />
          <StatCard
            icon="📊"
            label="Total Quantity"
            value={totalQuantity.toFixed(1)}
            sub="All items combined"
            color="rgb(59 130 246)"
          />
          <StatCard
            icon="💰"
            label="Total Value"
            value={`$${totalValue.toFixed(2)}`}
            sub="Inventory worth"
            color="rgb(34 197 94)"
          />
          <StatCard
            icon="⚠️"
            label="Low Stock"
            value={lowStockItems}
            sub="Needs restocking"
            color="rgb(245 101 101)"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {canCreate('operations') && (
            <button className="inv-btn-primary" onClick={handleCreateTransactionClick}>
              + Add Transaction
            </button>
          )}
        </div>

        {/* Alert for Low Stock Items */}
        {lowStockItems > 0 && (
          <div style={{
            background: 'rgb(254 242 242)',
            border: '1px solid rgb(252 165 165)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span style={{ color: 'rgb(185 28 28)', fontWeight: 500 }}>
              {lowStockItems} item{lowStockItems !== 1 ? 's' : ''} running low on stock. Consider restocking soon.
            </span>
          </div>
        )}

        {/* Table */}
        <AdminTable
          columns={columns}
          data={inventoryItems}
          loading={loading}
          actions={actions}
          emptyMessage="No inventory items found"
        />
      </div>

      {/* Transaction Form Modal */}
      <FormModal
        isOpen={showTransactionForm}
        title="Add Inventory Transaction"
        submitLabel="Create Transaction"
        onSubmit={handleTransactionFormSubmit}
        onCancel={() => setShowTransactionForm(false)}
        loading={transactionFormLoading}
        error={Object.keys(transactionFormErrors).length > 0 ? 'Please fix the errors below.' : null}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              Inventory Item *
            </label>
            <select
              className={`inv-field ${transactionFormErrors.ingredientId ? 'error' : ''}`}
              name="ingredientId"
              value={transactionFormData.ingredientId}
              onChange={handleTransactionFormChange}
            >
              <option value="">Select an ingredient</option>
              {ingredients.map(ingredient => {
                // Find matching inventory item to show current stock
                const inventoryItem = inventoryItems.find(item => item.ingredient_id === ingredient.id);
                const currentStock = inventoryItem ? `${inventoryItem.quantity || 0} ${inventoryItem.unit || 'units'}` : 'Not in inventory';
                
                return (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} (Stock: {currentStock})
                  </option>
                );
              })}
            </select>
            {transactionFormErrors.ingredientId && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{transactionFormErrors.ingredientId}</div>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              Transaction Type *
            </label>
            <select
              className={`inv-field ${transactionFormErrors.type ? 'error' : ''}`}
              name="type"
              value={transactionFormData.type}
              onChange={handleTransactionFormChange}
            >
              <option value="STOCK_IN">Stock In (Add inventory)</option>
              <option value="STOCK_OUT">Stock Out (Used inventory)</option>
              <option value="ADJUSTMENT">Adjustment (Manual correction)</option>
              <option value="WASTE">Waste (Discarded items)</option>
            </select>
            {transactionFormErrors.type && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{transactionFormErrors.type}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
                Quantity *
              </label>
              <input
                className={`inv-field ${transactionFormErrors.quantityChange ? 'error' : ''}`}
                name="quantityChange"
                type="number"
                step="0.001"
                value={transactionFormData.quantityChange}
                onChange={handleTransactionFormChange}
                placeholder="Enter quantity"
                min="0.001"
              />
              {transactionFormErrors.quantityChange && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{transactionFormErrors.quantityChange}</div>}
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
                Unit
              </label>
              <input
                className={`inv-field ${transactionFormErrors.unit ? 'error' : ''}`}
                name="unit"
                value={transactionFormData.unit}
                onChange={handleTransactionFormChange}
                placeholder="kg, pieces, etc."
                readOnly
              />
              {transactionFormErrors.unit && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{transactionFormErrors.unit}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
                Cost ($) 🧾
              </label>
              <input
                className={`inv-field ${transactionFormErrors.cost ? 'error' : ''}`}
                name="cost"
                type="number"
                step="0.01"
                value={transactionFormData.cost}
                onChange={handleTransactionFormChange}
                placeholder="Auto-calculated"
                min="0"
                title="Auto-calculated from Quantity × Cost Per Unit. You can edit manually if needed."
              />
              {transactionFormErrors.cost && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{transactionFormErrors.cost}</div>}
              <div style={{ fontSize: '0.65rem', color: 'rgb(107 114 128)', marginTop: '2px' }}>
                🧾 Auto: {transactionFormData.quantityChange && transactionFormData.costPerUnit ? 
                  `${transactionFormData.quantityChange} × $${transactionFormData.costPerUnit}` : 'Enter quantity & cost/unit'}
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
                Min Threshold
              </label>
              <input
                className={`inv-field ${transactionFormErrors.minThreshold ? 'error' : ''}`}
                name="minThreshold"
                type="number"
                step="0.001"
                value={transactionFormData.minThreshold}
                onChange={handleTransactionFormChange}
                placeholder="Auto-filled"
                readOnly
                style={{ backgroundColor: 'rgb(249 250 251)', color: 'rgb(107 114 128)' }}
              />
              {transactionFormErrors.minThreshold && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{transactionFormErrors.minThreshold}</div>}
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
                Cost Per Unit ($) ✏️
              </label>
              <input
                className={`inv-field ${transactionFormErrors.costPerUnit ? 'error' : ''}`}
                name="costPerUnit"
                type="number"
                step="0.01"
                value={transactionFormData.costPerUnit}
                onChange={handleTransactionFormChange}
                placeholder="Enter cost per unit"
                min="0"
                title="Editable - Changes here will auto-update total cost"
              />
              {transactionFormErrors.costPerUnit && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{transactionFormErrors.costPerUnit}</div>}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'rgb(71 85 105)' }}>
              Notes
            </label>
            <textarea
              className={`inv-field ${transactionFormErrors.notes ? 'error' : ''}`}
              name="notes"
              value={transactionFormData.notes}
              onChange={handleTransactionFormChange}
              placeholder="Optional notes about this transaction"
              rows={3}
            />
            {transactionFormErrors.notes && <div style={{ color: 'rgb(239 68 68)', fontSize: '0.75rem', marginTop: '4px' }}>{transactionFormErrors.notes}</div>}
          </div>

          <div style={{ background: 'rgb(249 250 251)', padding: '12px', borderRadius: '8px', border: '1px solid rgb(229 231 235)' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgb(107 114 128)', marginBottom: '4px' }}>💡 How it works</div>
            <div style={{ fontSize: '0.875rem', color: 'rgb(75 85 99)', lineHeight: 1.4 }}>
              • <strong>Ingredient Selection:</strong> Choose from all available ingredients<br/>
              • <strong>Auto-Population:</strong> If ingredient exists in inventory, unit/cost data auto-fills<br/>
              • <strong>New Ingredients:</strong> For ingredients not in inventory, enter details manually<br/>
              • <strong>Auto-Calculation:</strong> Total cost = Quantity × Cost Per Unit
            </div>
          </div>
        </div>
      </FormModal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default InventoryPage;