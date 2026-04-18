import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer',
};

export const AdminProvider = ({ children }) => {
  const { user } = useAuth();

  // Get user role from authenticated user object
  // Default to 'viewer' if no role is defined
  const userRole = user?.role || ROLES.VIEWER;

  // Check if user has a specific role
  const hasRole = (role) => {
    if (typeof role === 'string') {
      return userRole === role;
    }
    // If it's an array of roles, check if user has any of them
    return Array.isArray(role) && role.includes(userRole);
  };

  // Check if user can perform action on a resource
  const canCreate = (resource) => {
    if (userRole === ROLES.ADMIN) return true;
    if (
      userRole === ROLES.MANAGER &&
      ['categories', 'foodItems', 'operations'].includes(resource)
    ) {
      return true;
    }
    return false;
  };

  const canEdit = (resource) => {
    if (userRole === ROLES.ADMIN) return true;
    if (
      userRole === ROLES.MANAGER &&
      ['categories', 'foodItems', 'operations'].includes(resource)
    ) {
      return true;
    }
    return false;
  };

  const canDelete = (resource) => {
    if (userRole === ROLES.ADMIN) return true;
    if (
      userRole === ROLES.MANAGER &&
      ['categories', 'foodItems', 'operations'].includes(resource)
    ) {
      return true;
    }
    return false;
  };

  const canView = (resource) => {
    // All authenticated users can view
    return true;
  };

  return (
    <AdminContext.Provider
      value={{
        userRole,
        hasRole,
        canCreate,
        canEdit,
        canDelete,
        canView,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
