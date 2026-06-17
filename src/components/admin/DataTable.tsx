'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Plus, Pencil, Trash2 } from 'lucide-react';

// 类型宽松的列定义
export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: string[];
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  addLabel?: string;
  emptyText?: string;
  pageSize?: number;
  rowId?: string;
}

export default function DataTable<T>({
  columns,
  data,
  searchable = false,
  searchKeys,
  onAdd,
  onEdit,
  onDelete,
  addLabel = '新增',
  emptyText = '暂无数据',
  pageSize = 10,
  rowId,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = query.trim()
    ? data.filter((row) => {
        const keys = searchKeys || columns.map((c) => c.key);
        return keys.some((k) => {
          const val = (row as unknown as Record<string, unknown>)[k];
          return String(val ?? '').toLowerCase().includes(query.toLowerCase());
        });
      })
    : data;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasActions = !!onAdd || !!onEdit || !!onDelete;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
      {/* Toolbar */}
      {(searchable || onAdd) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--card-border)]">
          {searchable ? (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="搜索..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]/50"
              />
            </div>
          ) : (
            <div />
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] transition-all"
            >
              <Plus className="w-4 h-4" />
              {addLabel}
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--accent-muted)]/30">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left font-semibold text-[var(--foreground)] whitespace-nowrap ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right font-semibold text-[var(--foreground)] whitespace-nowrap">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-4 py-12 text-center text-[var(--muted)]"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => {
                const id = rowId
                  ? String((row as unknown as Record<string, unknown>)[rowId] ?? idx)
                  : String(idx);
                return (
                  <tr
                    key={id}
                    className="border-t border-[var(--card-border)] hover:bg-[var(--accent-muted)]/20 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={`px-4 py-3 text-[var(--foreground)] ${col.className || ''}`}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as unknown as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
                              aria-label="编辑"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                              aria-label="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--card-border)] text-sm">
          <span className="text-[var(--muted)]">
            共 {filtered.length} 条记录
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-[var(--foreground)]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
