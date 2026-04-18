import { useState, useEffect } from 'react';
import AdminTable from '../../components/admin/shared/AdminTable';
import { ToastContainer } from '../../components/admin/shared/Toast';
import FormModal from '../../components/admin/shared/FormModal';
import { usersApi } from '../../services/apiService';
import { useAdmin } from '../../context/AdminContext';

// ─── Design tokens ───────────────────────────────────────────────────────────
const STYLE = `
  .users-page { font-family: 'Inter', sans-serif; background: rgb(248 250 252); min-height: 100vh; }
  
  .users-stat {
    background: white;
    border: 1px solid rgb(226 232 240);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    transition: box-shadow 0.2s;
  }
  .users-stat:hover { box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.1); }

  .users-badge-active {
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
  .users-badge-inactive {
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
  .users-badge-admin {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgb(165 180 252);
    color: rgb(79 70 229);
  }
  .users-badge-user {
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

  .users-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgb(226 232 240);
  }

  .users-email {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: rgb(71 85 105);
  }

  .users-provider {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    background: rgb(243 244 246);
    color: rgb(75 85 99);
  }

  .users-action-btn {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    background: rgb(79 70 229);
    color: white;
  }
  .users-action-btn:hover {
    background: rgb(67 56 202);
    transform: translateY(-1px);
  }

  .users-field {
    width: 100%;
    padding: 10px 14px;
    background: white;
    border: 1px solid rgb(226 232 240);
    border-radius: 8px;
    font-size: 0.875rem;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .users-field:focus { 
    border-color: rgb(168 85 247);
    box-shadow: 0 0 0 3px rgb(168 85 247 / 0.1);
  }

  .users-btn-primary {
    background: linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234));
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgb(168 85 247 / 0.3);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .users-btn-primary:hover { 
    transform: translateY(-1px); 
    box-shadow: 0 4px 14px rgb(168 85 247 / 0.4); 
  }
`;

/**
 * UsersPage - Admin page for managing users
 * Displays all registered users with their details
 */
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    regularUsers: 0
  });
  const { canView } = useAdmin();
  const [errors, setErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Role update modal state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [roleUpdateLoading, setRoleUpdateLoading] = useState(false);

  // Available roles
  const availableRoles = ['Cook', 'Server', 'Cashier', 'Admin'];

  // ─── Toast management ─────────────────────────────────────────────────────
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  };

  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  // ─── Search functionality ─────────────────────────────────────────────────
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      user.name?.toLowerCase().includes(term.toLowerCase()) ||
      user.email?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // Update filtered users when users data changes
  useEffect(() => {
    handleSearch(searchTerm);
  }, [users, searchTerm]);

  // ─── Role update handlers ─────────────────────────────────────────────────
  const handleRoleUpdateClick = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleModalOpen(true);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !newRole) return;
    
    setRoleUpdateLoading(true);
    try {
      await usersApi.updateRole(selectedUser.id, newRole.toLowerCase());
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, role: newRole.toLowerCase() }
            : user
        )
      );
      
      // Recalculate stats
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, role: newRole.toLowerCase() }
          : user
      );
      calculateStats(updatedUsers);
      
      showToast(`User role updated to ${newRole} successfully`, 'success');
      setRoleModalOpen(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast(error.message, 'error');
    } finally {
      setRoleUpdateLoading(false);
    }
  };

  const cancelRoleUpdate = () => {
    setRoleModalOpen(false);
    setSelectedUser(null);
    setNewRole('');
  };

  // ─── Data fetching ─────────────────────────────────────────────────────────
  const fetchAllData = async () => {
    if (!canView('users')) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const usersData = await usersApi.getAll();
      setUsers(usersData);
      setFilteredUsers(usersData);
      calculateStats(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      const message = error.message || 'Failed to fetch users data';
      setErrors({ fetch: message });
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData) => {
    const activeUsers = usersData.filter(user => user.isActive);
    const adminUsers = usersData.filter(user => user.role === 'admin');
    
    setStats({
      total: usersData.length,
      active: activeUsers.length,
      inactive: usersData.length - activeUsers.length,
      admins: adminUsers.length,
      regularUsers: usersData.length - adminUsers.length
    });
  };

  useEffect(() => { 
    fetchAllData(); 
  }, []);

  // ─── Table configuration ──────────────────────────────────────────────────
  const tableColumns = [
    { 
      key: 'avatar', 
      label: 'Avatar',
      render: (value, row) => (
        <img 
          src={row.avatarUrl || '/default-avatar.png'} 
          alt={`${row.name} avatar`}
          className="users-avatar"
          onError={(e) => {
            e.target.src = '/default-avatar.png';
          }}
        />
      )
    },
    { key: 'name', label: 'Name' },
    { 
      key: 'email', 
      label: 'Email',
      render: (value) => <span className="users-email">{value}</span>
    },
    { 
      key: 'role', 
      label: 'Role',
      render: (value) => (
        <span className={value === 'admin' ? 'users-badge-admin' : 'users-badge-user'}>
          {value === 'admin' ? '👑' : '👤'} {value.toUpperCase()}
        </span>
      )
    },
    { 
      key: 'provider', 
      label: 'Provider',
      render: (value) => <span className="users-provider">{value}</span>
    },
    { key: 'phone', label: 'Phone', render: (value) => value || 'N/A' },
    { 
      key: 'lastLoginAt', 
      label: 'Last Login',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never'
    },
    { 
      key: 'createdAt', 
      label: 'Joined',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions', 
      render: (_, row) => (
        <button
          onClick={() => handleRoleUpdateClick(row)}
          className="users-action-btn"
          title="Update Role"
        >
          🔄 Update Role
        </button>
      )
    }
  ];

  // ─── Permission check ─────────────────────────────────────────────────────
  if (!canView('users')) {
    return (
      <div className="users-page">
        <style>{STYLE}</style>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view users.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <style>{STYLE}</style>
      
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Users Management</h1>
            <p className="text-gray-600">Manage and view all registered users</p>
          </div>
          
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            disabled={loading}
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="users-stat">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          
          <div className="users-stat">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="users-stat">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="text-3xl">❌</div>
            </div>
          </div>

          <div className="users-stat">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.admins}</p>
              </div>
              <div className="text-3xl">👑</div>
            </div>
          </div>

          <div className="users-stat">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regular Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.regularUsers}</p>
              </div>
              <div className="text-3xl">👤</div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {errors.fetch && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-500 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-800">Error Loading Users</h3>
                <p className="text-red-700">{errors.fetch}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <AdminTable
            columns={tableColumns}
            data={filteredUsers}
            loading={loading}
            emptyMessage={searchTerm ? `No users found matching "${searchTerm}"` : "No users found"}
            searchable={false}
            itemsPerPage={20}
          />
        </div>
      </div>

      {/* Role Update Modal */}
      <FormModal
        isOpen={roleModalOpen}
        onCancel={cancelRoleUpdate}
        title={`Update Role for ${selectedUser?.name}`}
        onSubmit={handleRoleUpdate}
        loading={roleUpdateLoading}
        submitLabel="Update Role"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current User
            </label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <img 
                src={selectedUser?.avatarUrl || '/default-avatar.png'} 
                alt={`${selectedUser?.name} avatar`}
                className="w-10 h-10 rounded-full border"
                onError={(e) => e.target.src = '/default-avatar.png'}
              />
              <div>
                <div className="font-medium text-gray-900">{selectedUser?.name}</div>
                <div className="text-sm text-gray-500">{selectedUser?.email}</div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="users-field"
              required
            >
              <option value="">Select a role...</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          
          {selectedUser && (
            <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
              <strong>Note:</strong> Changing from "{selectedUser.role}" to "{newRole}" will update the user's permissions immediately.
            </div>
          )}
        </div>
      </FormModal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default UsersPage;