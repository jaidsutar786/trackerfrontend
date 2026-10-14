import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { dashboardService } from '../../services/dashboardService';
import { projectService } from '../../services/projectService';
import { issueService } from '../../services/issueService';
import IssuesScrollList from '../../components/IssuesScrollList';
import StatusOverviewChart from '../../components/StatusOverviewChart';
import useMediaQuery from '../../hooks/useMediaQuery';
import { Bug, CheckSquare, Bookmark, ChevronsUp, ChevronUp, Equal, ChevronDown, PieChart, BarChart3, Maximize2, X } from 'lucide-react';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const avatarColors = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))'];
const statusStyle = { 'To Do': { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' }, 'In Progress': { bg: 'hsl(var(--info) / 0.12)', text: 'hsl(var(--info))' }, 'Testing': { bg: 'hsl(var(--warning) / 0.12)', text: 'hsl(var(--warning))' }, 'Done': { bg: 'hsl(var(--success) / 0.12)', text: 'hsl(var(--success))' } };

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'yesterday';
  return `${Math.floor(diff / 86400)}d ago`;
}

const CHART_LABELS = ['To Do', 'In Progress', 'Testing', 'Done'];
const CHART_COLORS = ['hsl(215 16% 62%)', 'hsl(199 89% 48%)', 'hsl(38 95% 50%)', 'hsl(145 63% 38%)'];

function SkeletonBlock({ w, h, radius = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      backgroundColor: 'hsl(var(--muted))',
      background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  );
}

function ProjectSkeletonItem() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SkeletonBlock w={120} h={11} />
      <SkeletonBlock w={'100%'} h={120} />
    </div>
  );
}

function ProjectsChartCard({ projects, recentIssues, taskOverview, navigate }) {
  const [showModal, setShowModal] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [selectedProject, setSelectedProject] = useState('all');
  const [chartType, setChartType] = useState('pie');
  const [modalChartType, setModalChartType] = useState('pie');
  const isMobile = useMediaQuery('(max-width: 700px)');
  const visible = projects.slice(0, 2);

  const openModal = () => {
    setShowModal(true);
    setModalReady(false);
    setTimeout(() => setModalReady(true), 600);
  };

  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div className="dashboard-flat-buttons" style={{ ...card, padding: isMobile ? 14 : 18, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 2px' }}>My Projects Overview</h2>
            <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Task & Issue distribution</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
              style={{ width: isMobile ? '100%' : 170, height: 28, padding: '3px 8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 11, cursor: 'pointer' }}>
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={openModal}
              style={{ width: 28, height: 28, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <Maximize2 size={12} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {projects.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>No projects yet</div>
          ) : (() => {
            const filtered = selectedProject === 'all' ? projects : projects.filter(p => p.id === parseInt(selectedProject));
            const issueStats = filtered.reduce((acc, proj) => {
              const pi = recentIssues.filter(i => i.project === proj.id || i.project_id === proj.id);
              acc[0] += pi.filter(i => i.status === 'To Do').length;
              acc[1] += pi.filter(i => i.status === 'In Progress').length;
              acc[2] += pi.filter(i => i.status === 'Testing').length;
              acc[3] += pi.filter(i => i.status === 'Done').length;
              return acc;
            }, [0, 0, 0, 0]);
            const taskStats = filtered.reduce((acc, proj) => {
              const pt = taskOverview.filter(t => t.project === proj.id || t.project_id === proj.id);
              acc[0] += pt.filter(t => t.status === 'To Do').length;
              acc[1] += pt.filter(t => t.status === 'In Progress').length;
              acc[2] += pt.filter(t => t.status === 'Testing').length;
              acc[3] += pt.filter(t => t.status === 'Done').length;
              return acc;
            }, [0, 0, 0, 0]);
            const renderChart = (data) => (
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{data.label}</h3>
                </div>
                <StatusOverviewChart data={data} type={chartType} height={isMobile ? 240 : 280} />
              </div>
            );
            return (
              <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
                {[
                  { type: 'pie', Icon: PieChart, title: 'Pie chart' },
                  { type: 'bar', Icon: BarChart3, title: 'Bar chart' },
                ].map(({ type, Icon, title }) => (
                  <button key={type} title={title} onClick={() => setChartType(type)}
                    style={{ width: 30, height: 28, border: '1px solid hsl(var(--border))', backgroundColor: chartType === type ? 'hsl(var(--accent))' : 'hsl(var(--card))', color: chartType === type ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} />
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16 }}>
                {renderChart({ label: 'Tasks', labels: CHART_LABELS, colors: CHART_COLORS, values: taskStats })}
                {renderChart({ label: 'Issues', labels: CHART_LABELS, colors: CHART_COLORS, values: issueStats })}
              </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* All Projects Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: isMobile ? 10 : 0 }}
          onClick={() => { setShowModal(false); setModalReady(false); }}>
          <div className="dashboard-flat-buttons" style={{ ...card, position: 'relative', zIndex: 1, width: isMobile ? '100%' : 'min(1248px, 92vw)', maxHeight: isMobile ? '88vh' : '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', borderRadius: 4 }}
            onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>All Projects</h2>
                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '2px 0 0' }}>{projects.length} projects Â· hover on chart for details</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {[
                  { type: 'pie', Icon: PieChart, title: 'Pie chart' },
                  { type: 'bar', Icon: BarChart3, title: 'Bar chart' },
                ].map(({ type, Icon, title }) => (
                  <button key={type} title={title} onClick={() => setModalChartType(type)}
                    style={{ width: 30, height: 30, borderRadius: 3, border: '1px solid hsl(var(--border))', background: modalChartType === type ? 'hsl(var(--accent))' : 'hsl(var(--card))', color: modalChartType === type ? 'hsl(var(--accent-foreground))' : 'hsl(var(--muted-foreground))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} />
                  </button>
                ))}
              <button onClick={() => { setShowModal(false); setModalReady(false); }}
                title="Close"
                style={{ width: 30, height: 30, borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 0, transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--card))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
              >
                <X size={15} />
              </button>
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, padding: isMobile ? '10px 14px' : '10px 20px', borderBottom: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', overflowX: 'auto' }}>
              {[['Done', 'hsl(145 63% 38%)'], ['In Progress', 'hsl(199 89% 48%)'], ['Testing', 'hsl(38 95% 50%)'], ['To Do', 'hsl(215 16% 62%)']].map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
                  <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
            {/* Modal Body */}
            <div style={{ overflowY: 'auto', padding: isMobile ? 14 : 20 }}>
              {!modalReady ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {projects.map((p) => <ProjectSkeletonItem key={p.id} />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {projects.map((p) => {
                    const pi = recentIssues.filter(i => i.project === p.id || i.project_id === p.id);
                    const pt = taskOverview.filter(t => t.project === p.id || t.project_id === p.id);
                    const issueVals = [
                      pi.filter(i => i.status === 'To Do').length,
                      pi.filter(i => i.status === 'In Progress').length,
                      pi.filter(i => i.status === 'Testing').length,
                      pi.filter(i => i.status === 'Done').length,
                    ];
                    const taskVals = [
                      pt.filter(t => t.status === 'To Do').length,
                      pt.filter(t => t.status === 'In Progress').length,
                      pt.filter(t => t.status === 'Testing').length,
                      pt.filter(t => t.status === 'Done').length,
                    ];
                    return (
                      <div key={p.id} style={{ ...card, padding: isMobile ? 12 : 16, borderRadius: 6 }}>
                        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{p.name}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                          <div>
                            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Tasks</p>
                            <StatusOverviewChart data={{ label: 'Tasks', labels: CHART_LABELS, colors: CHART_COLORS, values: taskVals }} type={modalChartType} height={modalChartType === 'pie' ? 190 : 130} />
                          </div>
                          <div>
                            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Issues</p>
                            <StatusOverviewChart data={{ label: 'Issues', labels: CHART_LABELS, colors: CHART_COLORS, values: issueVals }} type={modalChartType} height={modalChartType === 'pie' ? 190 : 130} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function IssueActivityRow({ issue, onClick, isLast }) {
  const firstName = issue.reported_by?.first_name;
  const reporter = firstName ? `${firstName} ${issue.reported_by?.last_name || ''}`.trim() : (issue.reported_by?.username || 'Unknown');
  const role = issue.reported_by?.role || '';
  const initials = reporter.slice(0, 2).toUpperCase();
  const ss = statusStyle[issue.status] || statusStyle['To Do'];
  const actionMap = { 'To Do': 'reported a new issue', 'In Progress': 'is working on', 'Testing': 'submitted for review', 'Done': 'resolved issue' };
  const action = actionMap[issue.status] || 'reported a new issue';
  const roleColors = { admin: { bg: 'hsl(var(--type-bug) / 0.15)', text: 'hsl(var(--type-bug))' }, manager: { bg: 'hsl(var(--type-epic) / 0.15)', text: 'hsl(var(--type-epic))' }, client: { bg: 'hsl(var(--info) / 0.15)', text: 'hsl(var(--info))' }, employee: { bg: 'hsl(var(--success) / 0.15)', text: 'hsl(var(--success))' }, qa_tester: { bg: 'hsl(var(--warning) / 0.15)', text: 'hsl(var(--warning))' } };
  const rc = roleColors[role] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: isLast ? 'none' : '1px solid hsl(var(--border))', cursor: 'pointer', transition: 'background 0.15s' }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{ flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
          {initials}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
          <strong>{reporter.toUpperCase()}</strong>
          {role && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, backgroundColor: rc.bg, color: rc.text, marginLeft: 5, textTransform: 'uppercase' }}>{role.replace('_', ' ')}</span>}
          {' '}{action.toUpperCase()} <span style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>{issue.title}</span>
          {' '}<span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, backgroundColor: ss.bg, color: ss.text, letterSpacing: '0.3px' }}>{issue.status}</span>
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{timeAgo(issue.created_at)}</p>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { onDataUpdate } = useNotifications();
  const isMobile = useMediaQuery('(max-width: 700px)');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProjects: 0, totalIssues: 0, openIssues: 0, resolvedIssues: 0 });
  const [projects, setProjects] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [taskOverview, setTaskOverview] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [expandIssues, setExpandIssues] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, projectsRes, issuesRes, tasksRes] = await Promise.all([
        dashboardService.getStats(),
        projectService.getAll(),
        issueService.getAll({ page_size: 1000 }), // Get all issues without pagination limit
        dashboardService.getWorkOverview(),
      ]);
      
      setStats(statsRes.data);
      setProjects(projectsRes.data);
      
      // Handle paginated response for issues
      const issuesData = issuesRes.data?.results || issuesRes.data || [];
      setRecentIssues(Array.isArray(issuesData) ? issuesData : []);
      setTaskOverview(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      
      console.log('âœ… Client Dashboard data loaded:', {
        stats: statsRes.data,
        projects: projectsRes.data,
        issues: issuesData,
        tasks: tasksRes.data,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setRecentIssues([]); // Ensure it's always an array
      setTaskOverview([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for real-time updates via NotificationContext
    const unsubscribe = onDataUpdate((data) => {
      console.log('ðŸ”„ Client Dashboard - Data update received:', data);
      
      // Check if it's a data_update event with entity and action
      if (data.type === 'data_update') {
        console.log(`ðŸ”„ Data update: entity=${data.entity}, action=${data.action}`);
        
        // Refresh on issue or project updates
        if (data.entity === 'issue' || data.entity === 'project') {
          console.log('ðŸ”„ Refreshing Client Dashboard data...');
          setTimeout(() => {
            fetchData();
          }, 500);
        }
      }
    });

    // Also listen for window events (fallback)
    const handleDashboardUpdate = (event) => {
      const data = event.detail;
      console.log('ðŸ”„ Client Dashboard - Window event received:', data);
      
      // Handle both notification and data_update types
      if (data.type === 'data_update' && (data.entity === 'issue' || data.entity === 'project')) {
        console.log('ðŸ”„ Refreshing via window event...');
        setTimeout(() => {
          fetchData();
        }, 500);
      }
    };

    window.addEventListener('dashboardUpdate', handleDashboardUpdate);
    window.addEventListener('websocketMessage', handleDashboardUpdate);
    
    return () => {
      unsubscribe();
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate);
      window.removeEventListener('websocketMessage', handleDashboardUpdate);
    };
  }, [onDataUpdate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
      </div>
    );
  }

  const statConfig = [
    { label: 'My Projects',   value: stats.totalProjects || 0, color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.1)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg> },
    { label: 'Open Issues',   value: stats.openIssues || 0,    color: 'hsl(var(--warning))', bg: 'hsl(var(--warning) / 0.1)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> },
    { label: 'Resolved',      value: stats.resolvedIssues || 0, color: 'hsl(var(--success))', bg: 'hsl(var(--success) / 0.1)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Client Dashboard</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            Welcome back, <strong>{user?.first_name || user?.username}</strong>! Track your projects and report issues.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: isMobile ? 10 : 12, marginBottom: 24 }}>
        {statConfig.map((s) => (
          <div key={s.label} style={{ ...card, padding: isMobile ? '14px 12px' : '16px 18px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '20%', border: '2px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ color: s.color }}>{s.icon}</div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'start' }}>
        {/* Projects - Left */}
        <ProjectsChartCard projects={projects} recentIssues={recentIssues} taskOverview={taskOverview} navigate={navigate} />

        {/* Recent Issues - Right */}
        <div style={{ ...card, padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', maxHeight: isMobile ? 'none' : 480, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 4px' }}>Recent Issues</h2>
              <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '0 0 14px' }}>Stay up to date with your reported issues.</p>
            </div>
            <button
              onClick={() => setExpandIssues(true)}
              style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Loading...</p>
            ) : recentIssues.length === 0 ? (
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No issues yet.</p>
            ) : (
              recentIssues.slice(0, 10).map((issue, i) => {
              const ss = statusStyle[issue.status] || statusStyle['To Do'];
              const actionMap = { 'To Do': 'reported a new issue', 'In Progress': 'is working on', 'Testing': 'submitted for review', 'Done': 'resolved issue' };
              const action = actionMap[issue.status] || 'reported a new issue';
              const reporter = issue.reported_by?.first_name
                ? `${issue.reported_by.first_name} ${issue.reported_by.last_name || ''}`.trim()
                : (issue.reported_by?.username || 'Unknown');
              const role = issue.reported_by?.role || '';
              const roleColors = { admin: { bg: 'hsl(var(--type-bug) / 0.15)', text: 'hsl(var(--type-bug))' }, manager: { bg: 'hsl(var(--type-epic) / 0.15)', text: 'hsl(var(--type-epic))' }, client: { bg: 'hsl(var(--info) / 0.15)', text: 'hsl(var(--info))' }, employee: { bg: 'hsl(var(--success) / 0.15)', text: 'hsl(var(--success))' }, qa_tester: { bg: 'hsl(var(--warning) / 0.15)', text: 'hsl(var(--warning))' } };
              const rc = roleColors[role] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
              return (
                <div key={issue.id} style={{ display: 'flex', gap: 10, marginBottom: 12, cursor: 'pointer' }}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'white' }}>
                    {reporter.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
                      <strong>{reporter.toUpperCase()}</strong>
                      {role && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, backgroundColor: rc.bg, color: rc.text, marginLeft: 5, textTransform: 'uppercase' }}>{role.replace('_', ' ')}</span>}
                      {' '}{action.toUpperCase()}{' '}
                      <span style={{ color: 'hsl(var(--primary))', fontWeight: 500 }}>{issue.title}</span>
                      {' '}<span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: { 'To Do': 'hsl(215 16% 50%)', 'In Progress': 'hsl(199 89% 48%)', 'Testing': 'hsl(38 95% 50%)', 'Done': 'hsl(145 63% 38%)' }[issue.status] || 'hsl(215 16% 50%)', color: '#fff' }}>{issue.status}</span>
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{timeAgo(issue.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
        </div>

      {/* Expanded Issues Modal */}
      {expandIssues && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setExpandIssues(false); }}
        >
          <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>All Issues</h2>
                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '2px 0 0' }}>{recentIssues.length} total</p>
              </div>
              <button onClick={() => setExpandIssues(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 20 }}>âœ•</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }} className="issues-scroll">
              {recentIssues.map((issue, i) => {
                const pColor = { highest: 'hsl(var(--priority-highest))', high: 'hsl(var(--priority-high))', medium: 'hsl(var(--priority-medium))', low: 'hsl(var(--priority-low))' };
                const sStyle = { 'To Do': { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' }, 'In Progress': { bg: 'hsl(var(--info) / 0.12)', text: 'hsl(var(--info))' }, 'Testing': { bg: 'hsl(var(--warning) / 0.12)', text: 'hsl(var(--warning))' }, 'Done': { bg: 'hsl(var(--success) / 0.12)', text: 'hsl(var(--success))' } };
                const tStyle = { bug: { bg: 'hsl(var(--type-bug) / 0.12)', text: 'hsl(var(--type-bug))' }, task: { bg: 'hsl(var(--type-task) / 0.12)', text: 'hsl(var(--type-task))' }, story: { bg: 'hsl(var(--type-story) / 0.12)', text: 'hsl(var(--type-story))' } };
                const ss = sStyle[issue.status] || sStyle['To Do'];
                const ts = tStyle[issue.issue_type] || tStyle.task;
                return (
                  <div key={issue.id} onClick={() => { setExpandIssues(false); setSelectedIssue(issue); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: i < recentIssues.length - 1 ? '1px solid hsl(var(--border))' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: pColor[issue.priority], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: 'hsl(var(--foreground))', fontWeight: 500 }}>{issue.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: ts.bg, color: ts.text, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{issue.issue_type}</span>
                    <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap', minWidth: 80 }}>{issue.project_name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: ss.bg, color: ss.text, whiteSpace: 'nowrap' }}>{issue.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedIssue && (() => {
        const ss = statusStyle[selectedIssue.status] || statusStyle['To Do'];
        const statusIcons = {
          'To Do': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
          'In Progress': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
          'Testing': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
          'Done': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>
        };
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedIssue(null); }}
          >
            <div style={{ backgroundColor: 'hsl(var(--card))', borderRadius: 12, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-floating)', border: '1px solid hsl(var(--border))' }}>
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {selectedIssue.issue_type === 'bug' ? <Bug size={16} color="hsl(var(--type-bug))" strokeWidth={2} /> : selectedIssue.issue_type === 'story' ? <Bookmark size={16} color="hsl(var(--type-story))" strokeWidth={2} /> : <CheckSquare size={16} color="hsl(var(--type-task))" strokeWidth={2} />}
                    {selectedIssue.priority === 'highest' ? <ChevronsUp size={16} color="hsl(var(--priority-highest))" strokeWidth={2} /> : selectedIssue.priority === 'high' ? <ChevronUp size={16} color="hsl(var(--priority-high))" strokeWidth={2} /> : selectedIssue.priority === 'medium' ? <Equal size={16} color="hsl(var(--priority-medium))" strokeWidth={2} /> : <ChevronDown size={16} color="hsl(var(--priority-low))" strokeWidth={2} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: ss.bg, color: ss.text, fontSize: 12, fontWeight: 600 }}>
                      {statusIcons[selectedIssue.status]}{selectedIssue.status}
                    </div>
                    <button onClick={() => setSelectedIssue(null)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 16 }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--background))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                    >âœ•</button>
                  </div>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.3 }}>{selectedIssue.title}</h2>
              </div>
              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
                  {[{ label: 'Project', value: selectedIssue.project_name, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> }, { label: 'Assignee', value: selectedIssue.assignee?.username || 'Unassigned', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }, { label: 'Reporter', value: selectedIssue.reported_by?.username || 'â€”', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/></svg> }, { label: 'Created', value: new Date(selectedIssue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ color: 'hsl(var(--muted-foreground))' }}>{item.icon}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</p>
                        <p style={{ margin: '3px 0 0', fontSize: 14, color: 'hsl(var(--foreground))', fontWeight: 500 }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedIssue.description && (
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</p>
                    <div style={{ padding: '16px 18px', backgroundColor: 'hsl(var(--muted) / 0.5)', borderRadius: 10, fontSize: 14, color: 'hsl(var(--foreground))', lineHeight: 1.6 }}>{selectedIssue.description}</div>
                  </div>
                )}
              </div>
              {/* Footer */}
              <div style={{ padding: '20px 24px', borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.3)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedIssue(null)}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--background))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                >Close</button>
                <button onClick={() => { setSelectedIssue(null); navigate('/issues'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >View Full Details <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
