import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';

// Notification Context
const NotificationContext = createContext();

/**
 * Enhanced notification system with accessibility and better UX
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState('');

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      persistent: false,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Screen reader announcement
    setAnnouncements(`${newNotification.type}: ${newNotification.message}`);
    setTimeout(() => setAnnouncements(''), 100);

    // Auto-remove non-persistent notifications
    if (!newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => 
    addNotification({ message, type: 'success', ...options }), [addNotification]);

  const error = useCallback((message, options = {}) => 
    addNotification({ message, type: 'error', persistent: true, ...options }), [addNotification]);

  const warning = useCallback((message, options = {}) => 
    addNotification({ message, type: 'warning', ...options }), [addNotification]);

  const info = useCallback((message, options = {}) => 
    addNotification({ message, type: 'info', ...options }), [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Container */}
      <NotificationContainer />
      
      {/* Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcements}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

/**
 * Notification container with advanced positioning and animations
 */
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-6 right-6 z-50 space-y-4 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Individual notification with rich content and interactions
 */
const Notification = ({ notification, onClose, index }) => {
  const { type, title, message, actions = [], persistent } = notification;

  const config = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  };

  const { bg, text, icon: Icon, iconColor } = config[type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: 1,
        transition: { delay: index * 0.1 }
      }}
      exit={{ 
        opacity: 0, 
        x: 300, 
        scale: 0.9,
        transition: { duration: 0.2 }
      }}
      className={`
        ${bg} border-2 rounded-xl p-4 shadow-lg backdrop-blur-sm
        focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold ${text} mb-1`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${text}`}>
            {message}
          </p>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={`
                    px-3 py-1 text-xs font-medium rounded-md transition-colors
                    ${action.primary 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors ${text}`}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar for timed notifications */}
      {!persistent && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-xl"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: notification.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

/**
 * Accessibility improvements for the entire app
 */
export const AccessibilityProvider = ({ children }) => {
  return (
    <div>
      {/* Skip to main content */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-indigo-600 text-white rounded-md"
      >
        Skip to main content
      </a>

      {/* Focus trap for modals */}
      <FocusTrap>
        {children}
      </FocusTrap>
    </div>
  );
};

/**
 * Focus management system
 */
const FocusTrap = ({ children }) => {
  // Focus management logic would go here
  // This is a simplified version - real implementation would be more complex
  return children;
};

/**
 * Keyboard navigation hook
 */
export const useKeyboardNavigation = () => {
  const handleKeyDown = useCallback((event, callbacks = {}) => {
    const { 
      onEscape,
      onEnter,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab
    } = callbacks;

    switch (event.key) {
      case 'Escape':
        onEscape?.(event);
        break;
      case 'Enter':
        onEnter?.(event);
        break;
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.(event);
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.(event);
        break;
      case 'ArrowLeft':
        onArrowLeft?.(event);
        break;
      case 'ArrowRight':
        onArrowRight?.(event);
        break;
      case 'Tab':
        onTab?.(event);
        break;
    }
  }, []);

  return { handleKeyDown };
};

/**
 * Enhanced loading states with accessibility
 */
export const AccessibleLoadingSpinner = ({ 
  size = 'md', 
  label = 'Loading...',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          border-2 border-gray-300 border-t-indigo-600 
          rounded-full animate-spin
        `}
        role="status"
        aria-label={label}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

/**
 * Better button component with loading and accessibility states
 */
export const AccessibleButton = ({ 
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      aria-busy={loading}
    >
      {loading && (
        <AccessibleLoadingSpinner size="sm" label="Processing..." />
      )}
      {children}
    </button>
  );
};