import React, { useState } from 'react';
import { useAuditLogs } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react';

export default function AuditLogs() {
  const [page,         setPage]         = useState(1);
  const [filterAction, setFilterAction] = useState('');

  const { data, isLoading } = useAuditLogs(page, { action: filterAction });
  const logs       = data?.data  || [];
  const totalPages = data?.totalPages || 1;

  const actionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'UPDATE': return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'DELETE': return 'bg-danger-50 text-danger-800 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800';
      default:       return 'bg-surface-100 text-surface-700 border-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:border-surface-600';
    }
  };

  const formatTs = (ts: string) => {
    const d = new Date(ts);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Audit Logs</h1>
        <p className="text-sm text-surface-500 mt-0.5">Complete history of all schedule changes and user actions</p>
      </div>

      {/* ── Accountability Banner ── */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <Info className="w-4 h-4 text-primary-700 dark:text-primary-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-primary-800 dark:text-primary-300">
            Accountability Tracking Active
          </p>
          <p className="text-xs text-primary-700 dark:text-primary-400 mt-0.5">
            All schedule changes are logged with: <strong>Performed By</strong> · <strong>Timestamp</strong> · <strong>Action Type</strong> · <strong>Affected Schedule</strong>
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
            className="form-input w-auto"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
          <p className="text-xs text-surface-400">
            {filterAction
              ? `Showing ${filterAction} actions`
              : 'Showing all actions'}
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Action</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Schedule / Event</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Performed By</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" />
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12">
                  <ClipboardList className="w-10 h-10 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                  <p className="text-sm text-surface-500">No audit logs found</p>
                </td></tr>
              ) : (
                logs.map((log: any, i: number) => {
                  const ts = formatTs(log.timestamp);
                  return (
                    <tr key={log._id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      {/* Action */}
                      <td className="px-5 py-4">
                        <span className={cn('badge border font-semibold', actionBadge(log.action))}>
                          {log.action}
                        </span>
                      </td>
                      {/* Schedule */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                          {log.scheduleId?.title || <span className="text-surface-400 italic">Deleted schedule</span>}
                        </p>
                      </td>
                      {/* Performed By */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                          {log.performedBy?.name || 'System'}
                        </p>
                        <p className="text-xs text-surface-400 mt-0.5">{log.performedBy?.email || ''}</p>
                      </td>
                      {/* Timestamp */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-surface-700 dark:text-surface-300 tabular-nums">{ts.date}</p>
                        <p className="text-xs text-surface-400 mt-0.5 tabular-nums">{ts.time}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-surface-200 dark:border-surface-700">
            <p className="text-xs text-surface-500">
              Page <span className="font-semibold text-surface-700 dark:text-surface-300">{page}</span> of{' '}
              <span className="font-semibold text-surface-700 dark:text-surface-300">{totalPages}</span>
            </p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="btn-secondary py-1 px-2 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="btn-secondary py-1 px-2 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
