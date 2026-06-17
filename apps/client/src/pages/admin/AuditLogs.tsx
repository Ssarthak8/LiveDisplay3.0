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
    if (action.includes('CREATE') || action.includes('CREATED')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
    }
    if (action.includes('UPDATE') || action.includes('UPDATED') || action.includes('PASSWORD_RESET')) {
      return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }
    if (action.includes('DELETE') || action.includes('DELETED') || action.includes('DISABLED')) {
      return 'bg-danger-50 text-danger-800 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800';
    }
    return 'bg-surface-100 text-surface-700 border-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:border-surface-600';
  };

  const formatActionLabel = (action: string) => {
    switch (action) {
      case 'SCHEDULE_CREATED': return 'Schedule Created';
      case 'SCHEDULE_UPDATED': return 'Schedule Updated';
      case 'SCHEDULE_DELETED': return 'Schedule Deleted';
      case 'ROOM_CREATED':     return 'Room Created';
      case 'ROOM_UPDATED':     return 'Room Updated';
      case 'ROOM_DELETED':     return 'Room Deleted';
      case 'USER_CREATED':     return 'User Created';
      case 'USER_UPDATED':     return 'User Updated';
      case 'USER_DISABLED':    return 'User Disabled';
      case 'PASSWORD_RESET':   return 'Password Reset';
      case 'DISPLAY_CONTENT_CREATED': return 'Display Content Created';
      case 'DISPLAY_CONTENT_UPDATED': return 'Display Content Updated';
      case 'DISPLAY_CONTENT_DELETED': return 'Display Content Deleted';
      case 'DISPLAY_MEDIA_CREATED': return 'Display Media Created';
      case 'DISPLAY_MEDIA_UPDATED': return 'Display Media Updated';
      case 'DISPLAY_MEDIA_DELETED': return 'Display Media Deleted';
      default: return action;
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
            <option value="SCHEDULE_CREATED">Schedule Created</option>
            <option value="SCHEDULE_UPDATED">Schedule Updated</option>
            <option value="SCHEDULE_DELETED">Schedule Deleted</option>
            <option value="ROOM_CREATED">Room Created</option>
            <option value="ROOM_UPDATED">Room Updated</option>
            <option value="ROOM_DELETED">Room Deleted</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
            <option value="USER_DISABLED">User Disabled</option>
            <option value="PASSWORD_RESET">Password Reset</option>
          </select>
          <p className="text-xs text-surface-400">
            {filterAction
              ? `Showing ${formatActionLabel(filterAction)} actions`
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
                          {formatActionLabel(log.action)}
                        </span>
                      </td>
                      {/* Schedule / Event */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                          {log.resourceType === 'schedule' ? (
                            log.scheduleId?.title || log.details?.title || 'Deleted schedule'
                          ) : log.resourceType === 'room' ? (
                            log.details?.roomNumber ? `${log.details.roomNumber} (${log.details.building || ''})` : `Room: ${log.resourceId}`
                          ) : log.resourceType === 'user' ? (
                            log.details?.email || `User: ${log.resourceId}`
                          ) : log.resourceType === 'display-content' ? (
                            log.details?.title || `Display Content: ${log.resourceId}`
                          ) : log.resourceType === 'display-media' ? (
                            log.details?.title || `Display Media: ${log.resourceId}`
                          ) : (
                            log.scheduleId?.title || log.resourceId || '—'
                          )}
                        </p>
                      </td>
                      {/* Performed By */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                          {log.performedBy?.name || log.performedByName || 'System'}
                        </p>
                        <p className="text-xs text-surface-400 mt-0.5">{log.performedBy?.email || log.performedByEmail || ''}</p>
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
