import { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

/**
 * AdminLayout
 * Main layout component for all admin pages
 * Contains sidebar navigation and top bar with mobile-responsive design
 */
export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size and set mobile state
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      // On desktop, sidebar should be open by default
      // On mobile, sidebar should be closed by default
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event) => {
      // Close sidebar if clicking outside of it on mobile
      if (sidebarOpen && !event.target.closest('[data-sidebar]')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [sidebarOpen, isMobile]);

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <AdminTopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto rounded-lg p-3 md:p-6">
          <div className="max-w-12xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
