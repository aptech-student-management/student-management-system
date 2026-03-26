import { ReactNode } from 'react';
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
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b ui-divider bg-slate-50/70 dark:bg-white/[0.04]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="ui-text-muted px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b ui-divider">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4">
                    <div className="h-4 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/[0.08]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b ui-divider bg-slate-50/70 dark:bg-white/[0.04]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`ui-text-muted whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] ${col.className ?? ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-14 text-center">
                <div className="ui-subtle-surface ui-text-muted mx-auto flex max-w-sm flex-col items-center gap-3 rounded-[24px] border-dashed px-6 py-8">
                  <div className="ui-panel-surface flex h-12 w-12 items-center justify-center rounded-full">
                    <InboxIcon className="h-6 w-6" />
                  </div>
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={keyExtractor ? keyExtractor(row) : rowIdx}
                className="border-b ui-divider transition-colors hover:bg-slate-100/55 dark:hover:bg-white/[0.05]"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`ui-text-base px-5 py-4 ${col.className ?? ''}`}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
