import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';

/**
 * AdminTopBar
 * Top navigation bar with user info, logout button, and mobile-responsive design
 */
export const AdminTopBar = ({ sidebarOpen, onToggleSidebar, isMobile }) => {
  const { user, logout } = useAuth();
  const { userRole } = useAdmin();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-4 flex items-center justify-between">
      {/* Left side - Sidebar toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
          title={isMobile ? (sidebarOpen ? 'Close menu' : 'Open menu') : 'Toggle sidebar'}
          aria-label={isMobile ? (sidebarOpen ? 'Close menu' : 'Open menu') : 'Toggle sidebar'}
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobile && sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {isMobile && (
          <h1 className="text-lg font-semibold text-gray-800">Admin</h1>
        )}
      </div>

      {/* Right side - User info and logout */}
      <div className="flex items-center gap-2 md:gap-6">
        {user && (
          <div className="flex items-center gap-2 md:gap-3">
            {!isMobile && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            )}
            <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="px-3 py-2 md:px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors touch-manipulation"
        >
          {isMobile ? 'Exit' : 'Logout'}
        </button>
      </div>
    </header>
  );
};

export default AdminTopBar;
