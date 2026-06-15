import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  PaginationState
} from '@tanstack/react-table';

interface TanstackTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  isLoading?: boolean;
  pageCount?: number;
  pagination?: PaginationState;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationState>>;
  emptyMessage?: string;
}

export function TanstackTable<T>({
  data,
  columns,
  isLoading,
  pageCount,
  pagination,
  setPagination,
  emptyMessage = 'No results found.',
}: TanstackTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-300">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-4 font-semibold whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-zinc-500">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="bg-white dark:bg-zinc-950 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors duration-150"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-200">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-zinc-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {pagination && setPagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-500 font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <button
              className="px-3 py-1.5 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
