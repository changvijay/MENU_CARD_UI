import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender 
} from '@tanstack/react-table';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modern, high-performance data table with advanced features
 */
export const ModernDataTable = ({ 
  data, 
  columns, 
  loading,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found"
}) => {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: filtering,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Table Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={filtering}
              onChange={(e) => setFiltering(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
            />
          </div>

          {/* Filters */}
          <ColumnFiltersDropdown table={table} />
          
          {/* View Options */}
          <ViewOptionsDropdown table={table} />
        </div>

        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          
          {onAdd && (
            <motion.button
              onClick={onAdd}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add New
            </motion.button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 select-none ${
                            header.column.getCanSort() ? 'cursor-pointer hover:text-indigo-600' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          
                          <AnimatePresence mode="wait">
                            {header.column.getCanSort() && (
                              <motion.div
                                key={header.column.getIsSorted() || 'normal'}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col"
                              >
                                {header.column.getIsSorted() === 'desc' && (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                                {header.column.getIsSorted() === 'asc' && (
                                  <ChevronUp className="w-4 h-4" />
                                )}
                                {!header.column.getIsSorted() && (
                                  <div className="w-4 h-4 opacity-50">
                                    <ChevronUp className="w-3 h-3" />
                                    <ChevronDown className="w-3 h-3 -mt-1" />
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 w-24">
                    Actions
                  </th>
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence mode="popLayout">
                {table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td 
                        key={cell.id}
                        className="px-6 py-4 text-sm text-gray-900"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <RowActionsDropdown 
                        row={row.original}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">{emptyMessage}</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <TablePagination table={table} />
        )}
      </div>
    </div>
  );
};

/**
 * Row actions dropdown with accessible menu
 */
const RowActionsDropdown = ({ row, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
            >
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(row);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(row);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};