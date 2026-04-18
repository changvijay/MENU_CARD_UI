import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, 
  AlertTriangle, 
  FolderOpen, 
  ChefHat,
  BarChart3,
  Settings,
  HelpCircle 
} from 'lucide-react';

/**
 * Modern Sidebar with micro-interactions and better iconography
 */
export const ModernSidebar = ({ isOpen, onToggle }) => {
  const navItems = [
    { 
      section: 'Menu Management',
      items: [
        { label: 'Food Items', path: '/admin/food-items', icon: UtensilsCrossed, badge: null },
        { label: 'Categories', path: '/admin/categories', icon: FolderOpen, badge: null },
        { label: 'Ingredients', path: '/admin/ingredients', icon: ChefHat, badge: null },
        { label: 'Allergens', path: '/admin/allergens', icon: AlertTriangle, badge: 'New' },
      ]
    },
    {
      section: 'Analytics', 
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: BarChart3, badge: null },
      ]
    },
    {
      section: 'System',
      items: [
        { label: 'Settings', path: '/admin/settings', icon: Settings, badge: null },
        { label: 'Help', path: '/admin/help', icon: HelpCircle, badge: null },
      ]
    }
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 280 : 72 }}
      className="bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-lg relative z-10"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-100">
        <motion.div
          layout
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              >
                FoodAdmin
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-6">
        {navItems.map((section) => (
          <div key={section.section}>
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3"
                >
                  {section.section}
                </motion.h3>
              )}
            </AnimatePresence>
            
            <ul className="space-y-1">
              {section.items.map((item) => (
                <NavItem 
                  key={item.path}
                  item={item}
                  isOpen={isOpen}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="w-3 h-3 border-r-2 border-b-2 border-gray-400 transform rotate-45"
        />
      </motion.button>
    </motion.aside>
  );
};

/**
 * Individual navigation item with hover effects  
 */
const NavItem = ({ item, isOpen }) => {
  const isActive = location.pathname === item.path;
  
  return (
    <li>
      <Link 
        to={item.path}
        className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-gray-50"
      >
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg"
          />
        )}
        
        <div className="relative z-10 flex items-center gap-3 flex-1">
          <item.icon 
            className={`w-5 h-5 transition-colors ${
              isActive ? 'text-indigo-600' : 'text-gray-600 group-hover:text-gray-900'
            }`} 
          />
          
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center justify-between flex-1"
              >
                <span className={`font-medium ${
                  isActive ? 'text-indigo-700' : 'text-gray-700'
                }`}>
                  {item.label}
                </span>
                
                {item.badge && (
                  <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </li>
  );
};