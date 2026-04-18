import { useEffect } from 'react';

/**
 * Toast
 * Simple toast notification component
 * 
 * Props:
 *   - message: string - toast message
 *   - type: 'success' | 'error' | 'info' | 'warning' - toast type
 *   - duration: number - auto-dismiss duration in ms (default: 3000)
 *   - onDismiss: function - callback when toast is dismissed
 */
export const Toast = ({ message, type = 'info', duration = 3000, onDismiss }) => {
  useEffect(() => {
    if (duration && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }[type];

  return (
    <div
      className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top`}
    >
      <span className="text-xl">{icon}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="text-white hover:opacity-80 flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
};

/**
 * ToastContainer
 * Container for displaying multiple toasts
 * 
 * Props:
 *   - toasts: array of {id, message, type, duration}
 *   - onDismiss: function(id) - called when toast is dismissed
 */
export const ToastContainer = ({ toasts = [], onDismiss }) => {
  return (
    <div className="fixed top-6 right-6 space-y-4 z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;
