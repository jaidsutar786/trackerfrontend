import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { activityService } from '../../services/activityService';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };

const actionMeta = {
  issue_created:   { label: 'created issue',    group: 'Issues', bg: 'hsl(var(--success) / 0.12)',     text: 'hsl(var(--success))' },
  issue_updated:   { label: 'updated issue',    group: 'Issues', bg: 'hsl(var(--warning) / 0.12)',     text: 'hsl(var(--warning))' },
  issue_deleted:   { label: 'deleted issue',    group: 'Issues', bg: 'hsl(var(--type-bug) / 0.12)',    text: 'hsl(var(--type-bug))' },
  status_changed:  { label: 'changed status',   group: 'Workflow', bg: 'hsl(var(--info) / 0.12)',      text: 'hsl(var(--info))' },
  comment_added:   { label: 'commented on',     group: 'Collaboration', bg: 'hsl(var(--primary) / 0.12)', text: 'hsl(var(--primary))' },
  project_created: { label: 'created project',  group: 'Projects', bg: 'hsl(var(--success) / 0.12)',   text: 'hsl(var(--success))' },
  project_updated: { label: 'updated project',  group: 'Projects', bg: 'hsl(var(--warning) / 0.12)',   text: 'hsl(var(--warning))' },
  module_created:  { label: 'created module',   group: 'Modules', bg: 'hsl(var(--success) / 0.12)',    text: 'hsl(var(--success))' },
  module_updated:  { label: 'updated module',   group: 'Modules', bg: 'hsl(var(--warning) / 0.12)',    text: 'hsl(var(--warning))' },
  module_deleted:  { label: 'deleted module',   group: 'Modules', bg: 'hsl(var(--type-bug) / 0.12)',   text: 'hsl(var(--type-bug))' },
  feature_created: { label: 'created feature',  group: 'Features', bg: 'hsl(var(--success) / 0.12)',   text: 'hsl(var(--success))' },
  feature_updated: { label: 'updated feature',  group: 'Features', bg: 'hsl(var(--warning) / 0.12)',   text: 'hsl(var(--warning))' },
  feature_deleted: { label: 'deleted feature',  group: 'Features', bg: 'hsl(var(--type-bug) / 0.12)',  text: 'hsl(var(--type-bug))' },
  task_created:    { label: 'created task',     group: 'Tasks', bg: 'hsl(var(--success) / 0.12)',      text: 'hsl(var(--success))' },
  task_updated:    { label: 'updated task',     group: 'Tasks', bg: 'hsl(var(--warning) / 0.12)',      text: 'hsl(var(--warning))' },
  task_deleted:    { label: 'deleted task',     group: 'Tasks', bg: 'hsl(var(--type-bug) / 0.12)',     text: 'hsl(var(--type-bug))' },
  subtask_created: { label: 'created subtask',  group: 'Subtasks', bg: 'hsl(var(--success) / 0.12)',   text: 'hsl(var(--success))' },
  subtask_updated: { label: 'updated subtask',  group: 'Subtasks', bg: 'hsl(var(--warning) / 0.12)',   text: 'hsl(var(--warning))' },
  subtask_deleted: { label: 'deleted subtask',  group: 'Subtasks', bg: 'hsl(var(--type-bug) / 0.12)',  text: 'hsl(var(--type-bug))' },
  user_invited:    { label: 'invited user',      group: 'Users', bg: 'hsl(var(--type-epic) / 0.12)',    text: 'hsl(var(--type-epic))' },
  invite_resent:   { label: 'resent invite',     group: 'Users', bg: 'hsl(var(--info) / 0.12)',         text: 'hsl(var(--info))' },
  user_updated:    { label: 'updated user',      group: 'Users', bg: 'hsl(var(--warning) / 0.12)',      text: 'hsl(var(--warning))' },
  role_changed:    { label: 'changed role',      group: 'Users', bg: 'hsl(var(--primary) / 0.12)',      text: 'hsl(var(--primary))' },
  user_disabled:   { label: 'deactivated user',  group: 'Users', bg: 'hsl(var(--destructive) / 0.10)',  text: 'hsl(var(--destructive))' },
  user_deleted:    { label: 'deleted user',      group: 'Users', bg: 'hsl(var(--type-bug) / 0.12)',     text: 'hsl(var(--type-bug))' },
  client_created:  { label: 'created client',    group: 'Clients', bg: 'hsl(var(--success) / 0.12)',    text: 'hsl(var(--success))' },
  client_updated:  { label: 'updated client',    group: 'Clients', bg: 'hsl(var(--warning) / 0.12)',    text: 'hsl(var(--warning))' },
  client_deleted:  { label: 'deleted client',    group: 'Clients', bg: 'hsl(var(--type-bug) / 0.12)',   text: 'hsl(var(--type-bug))' },
  assignee_changed:{ label: 'reassigned',        group: 'Workflow', bg: 'hsl(var(--warning) / 0.12)',   text: 'hsl(var(--warning))' },
};

const avatarColors = [
  'hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))',
  'hsl(var(--warning))', 'hsl(var(--type-epic))', 'hsl(var(--type-bug))',
];

const initialFilters = {
  search: '',
  action: '',
  project: '',
  date_from: '',
  date_to: '',
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${Math.max(diff, 0)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function dayLabel(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries({ ...filters, limit: 150 }).filter(([, value]) => value));
      const res = await activityService.getAll(params);
      setLogs(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadLogs, 250);
    return () => clearTimeout(timer);
  }, [filters]);

  const projects = useMemo(() => {
    const map = new Map();
    logs.forEach((log) => {
      if (log.project_id && log.project_name) map.set(log.project_id, log.project_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  const groupedLogs = useMemo(() => (
    logs.reduce((groups, log) => {
      const label = dayLabel(log.created_at);
      groups[label] = groups[label] || [];
      groups[label].push(log);
      return groups;
    }, {})
  ), [logs]);

  const summary = useMemo(() => ({
    total: logs.length,
    workflow: logs.filter((log) => ['status_changed', 'assignee_changed'].includes(log.action)).length,
    comments: logs.filter((log) => log.action === 'comment_added').length,
  }), [logs]);

  return (
    <div style={{ width: '100%', maxWidth: 1080, padding: '0 20px', boxSizing: 'border-box', margin: '0 auto' }}>
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Activity Logs</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            {loading ? 'Loading...' : `${summary.total} activities grouped by day`}
          </p>
        </div>
        <button onClick={loadLogs} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', cursor: 'pointer', fontWeight: 700 }}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
        {[
          ['Total', summary.total],
          ['Workflow', summary.workflow],
          ['Comments', summary.comments],
        ].map(([label, value]) => (
          <div key={label} style={{ ...card, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, padding: 14, marginBottom: 14, display: 'grid', gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(4, minmax(130px, 1fr)) auto', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
          <input value={filters.search} onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))} placeholder="Search actor or target" style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }} />
        </div>
        <select value={filters.action} onChange={(e) => setFilters(p => ({ ...p, action: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
          <option value="">All actions</option>
          {Object.entries(actionMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
        </select>
        <select value={filters.project} onChange={(e) => setFilters(p => ({ ...p, project: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
          <option value="">All visible projects</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters(p => ({ ...p, date_from: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }} />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters(p => ({ ...p, date_to: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }} />
        <button onClick={() => setFilters(initialFilters)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', cursor: 'pointer' }}>
          <Filter size={14} />
          Clear
        </button>
      </div>

      {error && <div style={{ ...card, padding: 14, marginBottom: 14, color: 'hsl(var(--destructive))' }}>{error}</div>}

      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>No activity found</p>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Try changing filters or date range.</p>
          </div>
        ) : (
          Object.entries(groupedLogs).map(([group, items]) => (
            <section key={group}>
              <div style={{ padding: '10px 20px', background: 'hsl(var(--muted) / 0.35)', borderBottom: '1px solid hsl(var(--border))', fontSize: 12, fontWeight: 800, color: 'hsl(var(--muted-foreground))' }}>
                {group} ({items.length})
              </div>
              {items.map((log, i) => {
                const meta = actionMeta[log.action] || { label: log.action, group: 'Other', bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
                const avatarColor = avatarColors[(log.actor_name || '').charCodeAt(0) % avatarColors.length];
                const extraText = log.action === 'status_changed' && log.extra?.from
                  ? ` (${log.extra.from} -> ${log.extra.to})`
                  : log.action === 'assignee_changed' && log.extra?.assignee
                  ? ` -> ${log.extra.assignee}`
                  : '';

                return (
                  <div key={log.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px',
                    borderBottom: i < items.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {log.actor_initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--foreground))' }}>
                        <strong>{log.actor_name}</strong>{' '}
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>{meta.label}</span>{' '}
                        <span style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>{log.target}</span>
                        {extraText && <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>{extraText}</span>}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, backgroundColor: meta.bg, color: meta.text }}>{meta.group}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, backgroundColor: meta.bg, color: meta.text }}>{meta.label}</span>
                        {log.project_name && <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{log.project_name}</span>}
                        <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{timeAgo(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
