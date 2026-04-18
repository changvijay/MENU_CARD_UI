/**
 * ConfirmDeleteModal
 * Modal to confirm deletion of an item
 * 
 * Props:
 *   - isOpen: boolean - is modal open
 *   - title: string - modal title
 *   - message: string - confirmation message
 *   - itemName: string - name of item being deleted (shown in message)
 *   - loading: boolean - show loading state
 *   - onConfirm: function - called when user confirms
 *   - onCancel: function - called when user cancels
 *   - isDangerous: boolean - show as dangerous action (default: true)
 */
export const ConfirmDeleteModal = ({
  isOpen,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this item?',
  itemName = '',
  loading = false,
  onConfirm,
  onCancel,
  isDangerous = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            isDangerous ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
          }`}>
            {isDangerous ? '⚠️' : '❓'}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          {message}
          {itemName && <span className="font-semibold"> "{itemName}"</span>}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
