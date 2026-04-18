/**
 * FormModal
 * Reusable modal for forms with header, body, and footer
 * 
 * Props:
 *   - isOpen: boolean - is modal open
 *   - title: string - modal title
 *   - children: ReactNode - modal content/form
 *   - submitLabel: string - submit button label (default: 'Save')
 *   - onSubmit: function - called when form is submitted
 *   - onCancel: function - called when modal is closed
 *   - loading: boolean - show loading state
 *   - error: string - error message to display
 *   - submitDisabled: boolean - disable submit button
 */
export const FormModal = ({
  isOpen,
  title = 'Form',
  children,
  submitLabel = 'Save',
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  submitDisabled = false,
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none transition disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">⚠️ Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {children}

          {/* Footer with actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || submitDisabled}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;
