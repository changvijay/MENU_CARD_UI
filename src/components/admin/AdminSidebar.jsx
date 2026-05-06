import { Link, useLocation } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

/**
 * AdminSidebar
 * Navigation sidebar for admin panel with mobile-responsive design
 */
export const AdminSidebar = ({ isOpen, isMobile, onClose }) => {
  const location = useLocation();
  const { canView } = useAdmin();

  // Handle navigation click on mobile to close sidebar
  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: '📊',
    },
    {
      label: 'Ingredients',
      path: '/admin/ingredients',
      icon: '🥘',
    },
    {
      label: 'Allergens',
      path: '/admin/allergens',
      icon: '⚠️',
    },
    {
      label: 'Categories',
      path: '/admin/categories',
      icon: '📁',
    },
    {
      label: 'Food Items',
      path: '/admin/food-items',
      icon: '🍽️',
    },
    // Operations section
    {
      label: 'Cash Flow',
      path: '/admin/cash-flow',
      icon: '💰',
    },
    {
      label: 'Cafe Tables',
      path: '/admin/cafe-tables',
      icon: '🪑',
    },
    {
      label: 'Inventory',
      path: '/admin/inventory',
      icon: '📦',
    },
    {
      label: 'Users',
      path: '/admin/users',
      icon: '👥',
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      data-sidebar
      className={`
        ${isMobile 
          ? `fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ${
              isOpen ? 'translate-x-0' : '-translate-x-full'
            }` 
          : `${isOpen ? 'w-64' : 'w-20'} transition-all duration-300`
        }
        bg-gray-900 text-white overflow-y-auto shadow-xl
      `}
    >
      {/* Mobile close button and Logo/Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h1 className={`font-bold text-xl ${!isOpen && !isMobile && 'text-center'}`}>
          {isOpen || isMobile ? '🍴 Admin Panel' : '🍴'}
        </h1>
        {isMobile && isOpen && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            title={item.label}
            className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } ${isMobile ? 'min-h-[56px]' : ''}`}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            {(isOpen || isMobile) && (
              <span className="text-sm font-medium truncate">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer info */}
      {(isOpen || isMobile) && (
        <div className="mt-auto p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 text-center space-y-1">
            <p>Menu Admin v1.0</p>
            {isMobile && (
              <p className="text-gray-500">Tap outside to close</p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default AdminSidebar;
