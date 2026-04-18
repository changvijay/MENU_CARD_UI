import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CartIcon = ({ itemCount }) => (
  <Link
    to="/checkout"
    className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 8.32a1 1 0 00.95 1.18h9.46a1 1 0 00.95-1.18L15 13M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
    </svg>
    {itemCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {itemCount}
      </span>
    )}
  </Link>
);

const UserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-400"
          referrerPolicy="no-referrer"
        />
        <span className="hidden lg:block text-sm font-medium text-gray-700">
          {user.name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 glass rounded-xl py-2 z-50">
          <div className="px-4 py-3 border-b border-white/30">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
              {user.role}
            </span>
          </div>
          <Link
            to="/orders"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/40 transition"
          >
            My Orders
          </Link>
          <button
            onClick={() => { onLogout(); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-white/40 transition"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const location = useLocation();
  const { user, login, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `${
      isActive(path)
        ? 'text-primary-600 border-b-2 border-primary-500'
        : 'text-gray-600 hover:text-primary-600'
    } transition duration-200 pb-1 font-medium`;

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div>
            <Link to="/" className="text-xl font-bold text-gray-800">
              Menu UI
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={navLinkClass('/')}>Home</Link>
            <Link to="/about" className={navLinkClass('/about')}>About</Link>
            <Link to="/contact" className={navLinkClass('/contact')}>Contact</Link>
            
            {user && (
              <>
                <Link to="/orders" className={navLinkClass('/orders')}>Orders</Link>
                <CartIcon itemCount={itemCount} />
              </>
            )}

            {user && user.role === "admin" && (
              <Link to="/admin" className={navLinkClass('/admin')}>Admin</Link>
            )}

            {user ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <button onClick={() => login(2)} className="btn-primary">
                Login
              </button>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center space-x-2">
            {user && <CartIcon itemCount={itemCount} />}
            
            {user ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <button onClick={() => login(2)} className="btn-primary text-sm py-1.5 px-3">
                Login
              </button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-gray-600 hover:text-primary-600 focus:outline-none p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/" onClick={() => setMobileOpen(false)} className={`block py-2 px-3 rounded-xl ${isActive('/') ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-white/40'}`}>Home</Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className={`block py-2 px-3 rounded-xl ${isActive('/about') ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-white/40'}`}>About</Link>
            <Link to="/contact" onClick={() => setMobileOpen(false)} className={`block py-2 px-3 rounded-xl ${isActive('/contact') ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-white/40'}`}>Contact</Link>
            {user && (
              <Link to="/orders" onClick={() => setMobileOpen(false)} className={`block py-2 px-3 rounded-xl ${isActive('/orders') ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-white/40'}`}>Orders</Link>
            )}

            {user && user.role === "admin" && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className={`block py-2 px-3 rounded-xl ${isActive('/admin') ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-white/40'}`}>Admin</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;