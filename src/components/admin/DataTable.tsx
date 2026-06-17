'use client';

import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search, Plus, Pencil, Trash2 } from 'lucide-react';

/* ─── Types ─── */

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
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
  loading?: boolean;
  skeletonRows?: number;
}

/* ─── Component ─── */

export default function DataTable<T>({
  columns, data, searchable = false, searchKeys, onAdd, onEdit, onDelete,
  addLabel = '新增', emptyText = '暂无数据', pageSize = 10, rowId,
  loading = false, skeletonRows = 5,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = query.trim()
    ? data.filter((row) => {
        const keys = searchKeys ?? columns.map((c) => c.key);
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

  const renderCell = (row: T, col: Column<T>) =>
    col.render ? col.render(row) : String((row as unknown as Record<string, unknown>)[col.key] ?? '');

  const resolveRowKey = (row: T, idx: number) =>
    rowId ? String((row as unknown as Record<string, unknown>)[rowId] ?? idx) : String(idx);

  return (
    <div className="bg-[#0c1324] border border-[rgba(212,168,83,0.08)] rounded-2xl overflow-hidden">
      {/* Toolbar */}
      {(searchable || onAdd) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(212,168,83,0.06)]">
          <div className="flex-1 max-w-sm">
            <TableSearch value={query} onChange={(v) => { setQuery(v); setPage(1); }} />
          </div>
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold
                         bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121]
                         rounded-xl hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)]
                         hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
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
            <tr className="bg-[rgba(212,168,83,0.03)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.06em] whitespace-nowrap ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.06em] whitespace-nowrap">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={columns.length} rows={skeletonRows} hasActions={hasActions} />
            ) : pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-4 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center">
                      <Search className="w-5 h-5 text-[var(--muted)]" />
                    </div>
                    <p className="text-sm text-[var(--muted)]">{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr
                  key={resolveRowKey(row, idx)}
                  className="border-t border-[rgba(212,168,83,0.04)] hover:bg-[rgba(212,168,83,0.03)] transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-[var(--foreground)] ${col.className ?? ''}`}
                    >
                      {renderCell(row, col)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-0.5">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all duration-200"
                            aria-label="编辑"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all duration-200"
                            aria-label="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(212,168,83,0.06)]">
          <span className="text-xs text-[var(--muted)]">
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
            <span className="px-3 text-xs text-[var(--foreground)] font-medium tabular-nums">
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

/* ─── Sub-components ─── */

export function TableSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
      <input
        type="text"
        placeholder="搜索..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 text-sm bg-[#080d18] border border-[rgba(212,168,83,0.1)] rounded-xl
                   text-[var(--foreground)] placeholder:text-[var(--muted)]
                   focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20
                   transition-all duration-200"
      />
    </div>
  );
}

function TableSkeleton({ columns, rows, hasActions }: { columns: number; rows: number; hasActions: boolean }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-[rgba(212,168,83,0.04)]">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 rounded-md bg-[rgba(212,168,83,0.06)] animate-skeleton"
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            </td>
          ))}
          {hasActions && (
            <td className="px-4 py-3">
              <div className="flex justify-end gap-2">
                <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,83,0.06)] animate-skeleton" />
                <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,83,0.06)] animate-skeleton" />
              </div>
            </td>
          )}
        </tr>
      ))}
    </>
  );
}