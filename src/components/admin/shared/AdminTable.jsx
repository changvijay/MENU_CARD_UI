import { useState } from 'react';

/**
 * AdminTable
 * Reusable table component for listing admin items
 * 
 * Props:
 *   - columns: array of {key, label, sortable?, render?}
 *   - data: array of row data objects
 *   - loading: boolean - show loading state
 *   - actions: array of {label, icon, onClick(row), color?, disabled?(row)?}
 *   - onSort?: function(key, direction) - called when column is sorted
 *   - pagination?: {page, pageSize, total, onPageChange}
 *   - emptyMessage?: string - message when no data
 */
export const AdminTable = ({
  columns = [],
  data = [],
  loading = false,
  actions = [],
  onSort,
  pagination,
  emptyMessage = 'No items found',
}) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (key) => {
    if (!key) return;

    const newDirection =
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);

    if (onSort) {
      onSort(key, newDirection);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-600 rounded-full"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        {/* Table Header */}
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-2 hover:text-indigo-600 transition"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
            {actions.length > 0 && (
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            )}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="hover:bg-gray-50 transition"
            >
              {columns.map((col) => (
                <td
                  key={`${rowIdx}-${col.key}`}
                  className="px-6 py-4 text-sm text-gray-700"
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key]}
                </td>
              ))}
              {actions.length > 0 && (
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    {actions.map((action, actionIdx) => {
                      const isDisabled = action.disabled && action.disabled(row);
                      return (
                        <button
                          key={actionIdx}
                          onClick={() => action.onClick(row)}
                          disabled={isDisabled}
                          title={action.label}
                          className={`p-2 rounded-lg transition ${
                            isDisabled
                              ? 'opacity-50 cursor-not-allowed'
                              : `text-${
                                  action.color || 'gray'
                                }-600 hover:bg-${action.color || 'gray'}-50`
                          }`}
                        >
                          {action.icon}
                        </button>
                      );
                    })}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && (
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of{' '}
            {Math.ceil(pagination.total / pagination.pageSize) || 1} •{' '}
            {pagination.total} total items
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                pagination.onPageChange(Math.max(1, pagination.page - 1))
              }
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                pagination.onPageChange(pagination.page + 1)
              }
              disabled={
                pagination.page >=
                Math.ceil(pagination.total / pagination.pageSize)
              }
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTable;
