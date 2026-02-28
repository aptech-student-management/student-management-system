import React from 'react';
import { InboxIcon } from 'lucide-react';
interface Column<T> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
  className?: string;
}
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (row: T) => string;
}
export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  keyExtractor
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {columns.map((col) =>
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">

                    {col.label}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) =>
              <tr key={i} className="border-b border-slate-100">
                  {columns.map((col) =>
                <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-slate-200 rounded animate-pulse" />
                    </td>
                )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>);

  }
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) =>
            <th
              key={col.key}
              className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.className ?? ''}`}>

                {col.label}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ?
          <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <InboxIcon className="w-8 h-8" />
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </td>
            </tr> :

          data.map((row, rowIdx) =>
          <tr
            key={keyExtractor ? keyExtractor(row) : rowIdx}
            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">

                {columns.map((col) =>
            <td
              key={col.key}
              className={`px-4 py-3 text-slate-700 ${col.className ?? ''}`}>

                    {col.render ?
              col.render(row[col.key], row) :
              String(row[col.key] ?? '')}
                  </td>
            )}
              </tr>
          )
          }
        </tbody>
      </table>
    </div>);

}