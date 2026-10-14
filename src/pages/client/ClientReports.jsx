import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { projectService } from '../../services/projectService';
import { issueService } from '../../services/issueService';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const avatarColors = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--type-epic))'];

export default function ClientReports() {
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
      setIssues(Array.isArray(iRes.data) ? iRes.data : (iRes.data?.results || []));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const completionRate = stats && stats.total_issues > 0
    ? Math.round((stats.completed_issues / stats.total_issues) * 100)
    : 0;

  const getProjectCompletion = (projectId) => {
    const projectIssues = issues.filter(i => i.project === projectId);
    if (projectIssues.length === 0) return 0;
    const completed = projectIssues.filter(i => i.status === 'Done').length;
    return Math.round((completed / projectIssues.length) * 100);
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Reports</h1>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>Overview of your project progress</p>
      </div>

      {/* Summary */}
      <div style={{ ...card, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Summary</h2>
        </div>
        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {[
              { label: 'Total Projects',   value: stats?.total_projects,   color: 'hsl(var(--primary))' },
              { label: 'Total Issues',     value: stats?.total_issues,     color: 'hsl(var(--info))' },
              { label: 'Completed Issues', value: stats?.completed_issues, color: 'hsl(var(--success))' },
              { label: 'Pending Issues',   value: stats?.pending_issues,   color: 'hsl(var(--warning))' },
              { label: 'Completion Rate',  value: `${completionRate}%`,    color: 'hsl(var(--foreground))' },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: r.color }} />
                  <span style={{ fontSize: 14, color: 'hsl(var(--foreground))' }}>{r.label}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 700, color: r.color }}>{r.value ?? 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Bar per project */}
      {!loading && projects.length > 0 && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Projects</h2>
          </div>
          <div style={{ padding: '8px 0' }}>
            {projects.map((p, i) => {
              const projectCompletion = getProjectCompletion(p.id);
              const teamSize = p.team_members?.length ?? 0;
              return (
                <div key={p.id} style={{ padding: '14px 20px', borderBottom: i < projects.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: avatarColors[p.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginLeft: 'auto' }}>{teamSize} members</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'hsl(var(--muted))', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${projectCompletion}%`, backgroundColor: avatarColors[p.id % avatarColors.length], borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', minWidth: 35 }}>{projectCompletion}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
