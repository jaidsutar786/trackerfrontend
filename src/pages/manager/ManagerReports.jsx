import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };

export default function ManagerReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats().then((r) => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const rows = stats ? [
    { label: 'Total Projects',    value: stats.total_projects,    color: 'hsl(var(--primary))' },
    { label: 'Total Issues',      value: stats.total_issues,      color: 'hsl(var(--info))' },
    { label: 'Completed Issues',  value: stats.completed_issues,  color: 'hsl(var(--success))' },
    { label: 'Pending Issues',    value: stats.pending_issues,    color: 'hsl(var(--warning))' },
    { label: 'Completion Rate',   value: stats.total_issues > 0 ? `${Math.round((stats.completed_issues / stats.total_issues) * 100)}%` : '0%', color: 'hsl(var(--foreground))' },
  ] : [];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Reports</h1>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>Project and issue summary</p>
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Overview</h2>
        </div>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Loading...</div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {rows.map((r, i) => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < rows.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: r.color }} />
                  <span style={{ fontSize: 14, color: 'hsl(var(--foreground))' }}>{r.label}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 700, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
