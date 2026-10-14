import { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import BarChart from './BarChart';
import StatusOverviewChart from './StatusOverviewChart';
import { dashboardService } from '../services/dashboardService';

const panelStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
};

const statusOrder = ['To Do', 'In Progress', 'Testing', 'Blocked', 'Done'];
const statusColors = [
  'hsl(var(--muted-foreground))',
  'hsl(var(--info))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--success))',
];

const formatDays = (value) => value == null ? 'No data' : `${value}d`;

export default function AnalyticsReports() {
  const [period, setPeriod] = useState(30);
  const [projectId, setProjectId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    dashboardService.getAnalytics({
      days: period,
      ...(projectId ? { project_id: projectId } : {}),
    }).then(({ data }) => {
      if (active) setReport(data);
    }).catch((requestError) => {
      if (active) setError(requestError?.response?.data?.error || 'Unable to load analytics.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [period, projectId]);

  const downloadReport = async () => {
    setExporting(true);
    setError('');
    try {
      const { data } = await dashboardService.exportAnalytics(
        projectId ? { project_id: projectId } : {},
      );
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tracker-report.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Unable to export this report.');
    } finally {
      setExporting(false);
    }
  };

  const summary = report?.summary;
  const trendData = {
    label: 'Tasks',
    labels: (report?.trend || []).map((item) => item.date.slice(5)),
    series: [
      { label: 'Created', color: 'hsl(var(--info))', values: (report?.trend || []).map((item) => item.created) },
      { label: 'Completed', color: 'hsl(var(--success))', values: (report?.trend || []).map((item) => item.completed) },
    ],
  };
  const statusData = {
    label: 'Tasks by status',
    labels: statusOrder,
    colors: statusColors,
    values: statusOrder.map((status) => report?.status_breakdown?.[status] || 0),
  };
  const workloadData = {
    label: 'Open tasks',
    labels: (report?.workload || []).map((person) => person.assignee),
    values: (report?.workload || []).map((person) => person.open_tasks),
    colors: (report?.workload || []).map((_person, index) => index % 2 ? 'hsl(var(--info))' : 'hsl(var(--success))'),
  };
  const metrics = [
    ['Open tasks', summary?.open_tasks ?? 0],
    ['Overdue', summary?.overdue_tasks ?? 0],
    ['Blocked', summary?.blocked_tasks ?? 0],
    ['Throughput', `${summary?.throughput_per_week ?? 0}/week`],
    ['Lead time', formatDays(summary?.lead_time_avg_days)],
    ['Cycle time', formatDays(summary?.cycle_time_avg_days)],
  ];

  return (
    <main style={{ width: '100%', maxWidth: 1320, margin: '0 auto', padding: '0 20px 24px', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Delivery Analytics</h1>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Task flow, delivery time, workload and project progress</p>
        </div>
        <button type="button" onClick={downloadReport} disabled={exporting || loading} title="Export task report as CSV" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid hsl(var(--border))', borderRadius: 6, background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', cursor: exporting || loading ? 'wait' : 'pointer', opacity: exporting || loading ? 0.6 : 1 }}>
          <Download size={15} />{exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div role="group" aria-label="Report period" style={{ display: 'inline-flex', border: '1px solid hsl(var(--border))', borderRadius: 6, overflow: 'hidden' }}>
          {[7, 30, 90].map((days) => (
            <button key={days} type="button" onClick={() => setPeriod(days)} aria-pressed={period === days} style={{ padding: '8px 12px', border: 0, borderRight: days !== 90 ? '1px solid hsl(var(--border))' : 0, background: period === days ? 'hsl(var(--primary))' : 'hsl(var(--card))', color: period === days ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{days} days</button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
          Project
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} style={{ minWidth: 180, padding: '8px 10px', border: '1px solid hsl(var(--border))', borderRadius: 6, background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
            <option value="">All visible projects</option>
            {(report?.projects || []).map((project) => <option key={project.project_id} value={project.project_id}>{project.project_name}</option>)}
          </select>
        </label>
      </div>

      {error && <div role="alert" style={{ ...panelStyle, padding: 12, marginBottom: 14, color: 'hsl(var(--destructive))' }}>{error}</div>}

      {loading ? (
        <div style={{ ...panelStyle, padding: 36, textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}><RefreshCw size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Loading analytics...</div>
      ) : (
        <>
          <section aria-label="Delivery metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10, marginBottom: 14 }}>
            {metrics.map(([label, value]) => (
              <div key={label} style={{ ...panelStyle, padding: '13px 15px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ marginTop: 6, fontSize: 21, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{value}</div>
              </div>
            ))}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 14, marginBottom: 14 }}>
            <div style={{ ...panelStyle, padding: '14px 16px' }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Created vs completed</h2>
              <BarChart data={trendData} height={280} />
            </div>
            <div style={{ ...panelStyle, padding: '14px 16px' }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Current status</h2>
              <StatusOverviewChart data={statusData} type="bar" height={280} />
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 14 }}>
            <div style={{ ...panelStyle, overflow: 'auto' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}><h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Workload</h2></div>
              {!!report?.workload?.length && <BarChart data={workloadData} height={190} />}
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 340 }}>
                <thead><tr>{['Assignee', 'Open', 'Overdue', 'Hours'].map((label) => <th key={label} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{label}</th>)}</tr></thead>
                <tbody>
                  {(report?.workload || []).map((person) => (
                    <tr key={person.user_id ?? 'unassigned'} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'hsl(var(--foreground))' }}>{person.assignee}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>{person.open_tasks}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: person.overdue_tasks ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))' }}>{person.overdue_tasks}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>{person.estimate_hours}</td>
                    </tr>
                  ))}
                  {!report?.workload?.length && <tr><td colSpan="4" style={{ padding: 18, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>No open work in this view.</td></tr>}
                </tbody>
              </table>
            </div>

            <div style={{ ...panelStyle, overflow: 'auto' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}><h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Project summaries</h2></div>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                <thead><tr>{['Project', 'Done', 'Blocked', 'Overdue', 'Progress'].map((label) => <th key={label} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{label}</th>)}</tr></thead>
                <tbody>
                  {(report?.projects || []).map((project) => (
                    <tr key={project.project_id} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{project.project_name}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>{project.completed_tasks}/{project.total_tasks}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>{project.blocked_tasks}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: project.overdue_tasks ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))' }}>{project.overdue_tasks}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>{project.completion_rate}%</td>
                    </tr>
                  ))}
                  {!report?.projects?.length && <tr><td colSpan="5" style={{ padding: 18, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>No project tasks in this view.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}