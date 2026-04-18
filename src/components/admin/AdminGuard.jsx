import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdmin, ROLES } from '../../context/AdminContext';

/**
 * AdminGuard component
 * Protects admin routes by checking user authentication and role
 * 
 * Props:
 *   - children: React component to render if authorized
 *   - requiredRole: string or array of strings indicating required roles (default: any authenticated user)
 *   - fallbackPath: where to redirect if unauthorized (default: '/')
 */
export const AdminGuard = ({
  children,
  requiredRole = null,
  fallbackPath = '/',
}) => {
  const { token, user } = useAuth();
  const { userRole } = useAdmin();

  // Check if user is authenticated
  if (!token || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // If no specific role required, just check authentication
  if (!requiredRole) {
    return children;
  }

  // Check if user has required role
  const hasRequiredRole = Array.isArray(requiredRole)
    ? requiredRole.includes(userRole)
    : userRole === requiredRole;

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-xl text-gray-600 mb-8">Access Denied</p>
          <p className="text-gray-500 mb-8">
            You do not have permission to access this page. Your current role is:{' '}
            <span className="font-semibold">{userRole}</span>
          </p>
          <a
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminGuard;
