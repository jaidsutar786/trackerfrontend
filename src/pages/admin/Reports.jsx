import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { projectService } from '../../services/projectService';
import { issueService } from '../../services/issueService';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      projectService.getAll(),
      issueService.getAll(),
    ]).then(([sRes, pRes, iRes]) => {
      setStats(sRes.data);
      setProjects(pRes.data);
      // Handle paginated response from issueService
      const issuesData = iRes.data.results || iRes.data || [];
      setIssues(Array.isArray(issuesData) ? issuesData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getProjectStats = (projectId) => {
    // Ensure issues is an array before filtering
    if (!Array.isArray(issues)) return { total: 0, done: 0, inprogress: 0, todo: 0 };
    
    const projectIssues = issues.filter(i => i.project === projectId);
    return {
      total: projectIssues.length,
      done: projectIssues.filter(i => i.status === 'Done').length,
      inprogress: projectIssues.filter(i => i.status === 'In Progress').length,
      todo: projectIssues.filter(i => i.status === 'To Do').length,
    };
  };

  const totalIssues = stats?.total_issues || 0;
  const completedIssues = stats?.completed_issues || 0;
  const avgResolution = totalIssues > 0 ? (completedIssues / totalIssues * 5).toFixed(1) : '0';
  const bugCount = Array.isArray(issues) ? issues.filter(i => i.issue_type === 'bug').length : 0;
  const bugRate = totalIssues > 0 ? Math.round((bugCount / totalIssues) * 100) : 0;

  const reportStats = [
    { label: 'Issues Resolved',  value: completedIssues, sub: 'Total completed',  color: 'hsl(var(--success))',  bg: 'hsl(var(--success) / 0.1)' },
    { label: 'Avg Resolution',   value: `${avgResolution}d`, sub: 'Per issue',  color: 'hsl(var(--info))',     bg: 'hsl(var(--info) / 0.1)' },
    { label: 'Total Projects',  value: stats?.total_projects || 0,  sub: 'Active projects', color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.1)' },
    { label: 'Bug Rate',         value: `${bugRate}%`, sub: 'Of all issues', color: 'hsl(var(--type-bug))', bg: 'hsl(var(--type-bug) / 0.1)' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Reports</h1>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>Overview of all project metrics</p>
      </div>

      {loading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Loading...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {reportStats.map((s) => (
              <div key={s.label} style={{ ...card, padding: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: s.color }} />
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Per-project breakdown */}
          <div style={{ ...card, overflow: 'auto', width: '100%' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Project Breakdown</h2>
            </div>
            {projects.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>No projects found</div>
            ) : (
              <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Project', 'Total', 'Done', 'In Progress', 'To Do', 'Progress'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => {
                    const pStats = getProjectStats(p.id);
                    const pct = pStats.total > 0 ? Math.round((pStats.done / pStats.total) * 100) : 0;
                    return (
                      <tr key={p.id} style={{ borderBottom: i < projects.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{p.name}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'hsl(var(--foreground))' }}>{pStats.total}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'hsl(var(--success))', fontWeight: 600 }}>{pStats.done}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'hsl(var(--info))', fontWeight: 600 }}>{pStats.inprogress}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{pStats.todo}</td>
                        <td style={{ padding: '14px 16px', minWidth: 140 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'hsl(var(--muted))' }}>
                              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: 'hsl(var(--success))' }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', minWidth: 30 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
