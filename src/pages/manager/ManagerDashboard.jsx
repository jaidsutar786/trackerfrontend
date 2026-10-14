import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { projectService } from '../../services/projectService';
import { issueService } from '../../services/issueService';
import { activityService } from '../../services/activityService';
import API from '../../services/api';
import IssuesScrollList from '../../components/IssuesScrollList';
import StatusOverviewChart from '../../components/StatusOverviewChart';
import useMediaQuery from '../../hooks/useMediaQuery';
import { Bug, CheckSquare, Bookmark, ChevronsUp, ChevronUp, Equal, ChevronDown, PieChart, BarChart3, Maximize2, X } from 'lucide-react';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const statusStyle = { 'To Do': { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' }, 'In Progress': { bg: 'hsl(var(--info) / 0.12)', text: 'hsl(var(--info))' }, 'Testing': { bg: 'hsl(var(--warning) / 0.12)', text: 'hsl(var(--warning))' }, 'Done': { bg: 'hsl(var(--success) / 0.12)', text: 'hsl(var(--success))' } };

function ProjectOverviewCharts({ projects, issues, selectedProject }) {
  const [tasks, setTasks] = useState([]);
  const [chartType, setChartType] = useState('pie');
  const [workType, setWorkType] = useState('all');
  const isMobile = useMediaQuery('(max-width: 700px)');

  useEffect(() => {
    API.get('/projects/work-overview/')
      .then((res) => setTasks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTasks([]));
  }, []);

  const filteredProjects = selectedProject === 'all' ? projects : projects.filter(p => p.id === parseInt(selectedProject));

  const taskStats = filteredProjects.reduce((acc, proj) => {
    const pt = tasks.filter(t => t.project === proj.id || t.project_id === proj.id);
    acc.total += pt.length;
    acc.done += pt.filter(t => t.status === 'Done').length;
    acc.inProgress += pt.filter(t => t.status === 'In Progress').length;
    acc.testing += pt.filter(t => t.status === 'Testing').length;
    acc.todo += pt.filter(t => t.status === 'To Do').length;
    return acc;
  }, { total: 0, done: 0, inProgress: 0, testing: 0, todo: 0 });

  const issueStats = filteredProjects.reduce((acc, proj) => {
    const pi = issues.filter(i => i.project === proj.id || i.project_id === proj.id);
    acc.total += pi.length;
    acc.done += pi.filter(i => i.status === 'Done').length;
    acc.inProgress += pi.filter(i => i.status === 'In Progress').length;
    acc.testing += pi.filter(i => i.status === 'Testing').length;
    acc.todo += pi.filter(i => i.status === 'To Do').length;
    return acc;
  }, { total: 0, done: 0, inProgress: 0, testing: 0, todo: 0 });

  const labels = ['To Do', 'In Progress', 'Testing', 'Done'];
  const colors = ['hsl(222 47% 58%)', 'hsl(199 89% 48%)', 'hsl(38 95% 50%)', 'hsl(145 63% 38%)'];
  const taskData = {
    label: 'Tasks',
    labels,
    colors,
    values: [taskStats.todo, taskStats.inProgress, taskStats.testing, taskStats.done],
  };
  const issueData = {
    label: 'Issues',
    labels,
    colors,
    values: [issueStats.todo, issueStats.inProgress, issueStats.testing, issueStats.done],
  };
  const selectedData = workType === 'tasks' ? taskData : issueData;

  const renderChartBlock = (chartData) => {
    return (
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{chartData.label}</h3>
        </div>
        <StatusOverviewChart data={chartData} type={chartType} height={isMobile ? 240 : 280} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid hsl(var(--border))', paddingTop: 10 }}>
          {labels.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors[i] }} />
              <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>{label}: {chartData.values[i]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'tasks', 'issues'].map((type) => (
            <button key={type} onClick={() => setWorkType(type)} style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: workType === type ? 'hsl(var(--primary))' : 'hsl(var(--card))', color: workType === type ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>{type}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { type: 'pie', Icon: PieChart, title: 'Pie chart' },
            { type: 'bar', Icon: BarChart3, title: 'Bar chart' },
          ].map(({ type, Icon, title }) => (
            <button key={type} title={title} onClick={() => setChartType(type)} style={{ width: 30, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: chartType === type ? 'hsl(var(--accent))' : 'hsl(var(--card))', color: chartType === type ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={15} /></button>
          ))}
        </div>
      </div>
      {workType === 'all' ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 18 }}>
          {renderChartBlock(taskData)}
          {renderChartBlock(issueData)}
        </div>
      ) : renderChartBlock(selectedData)}
    </div>
  );
}

const CHART_LABELS = ['To Do', 'In Progress', 'Testing', 'Done'];
const CHART_COLORS = ['hsl(222 47% 58%)', 'hsl(199 89% 48%)', 'hsl(38 95% 50%)', 'hsl(145 63% 38%)'];

function buildDonutData(project, issues) {
  const proj = issues.filter((i) => (i.project || i.project_id) === project.id);
  const done = proj.filter((i) => i.status === 'Done').length;
  const inProgress = proj.filter((i) => i.status === 'In Progress').length;
  const inReview = proj.filter((i) => i.status === 'Testing').length;
  const todo = proj.filter((i) => i.status === 'To Do').length;
  const total = proj.length;
  return { total, done, inProgress, inReview, todo };
}

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

function ProjectsChartCard({ projects, recentIssues, navigate, clients }) {
  const [showModal, setShowModal] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [modalTasks, setModalTasks] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [modalChartType, setModalChartType] = useState('pie');
  const isMobile = useMediaQuery('(max-width: 700px)');

  const openModal = () => {
    setShowModal(true);
    setModalReady(false);
    API.get('/projects/work-overview/')
      .then((res) => setModalTasks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setModalTasks([]));
    setTimeout(() => setModalReady(true), 600);
  };

  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ ...card, padding: isMobile ? 14 : 18, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 2px' }}>Projects overview</h2>
            <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Task & Issue distribution</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <select value={selectedClient} onChange={(e) => { setSelectedClient(e.target.value); setSelectedProject('all'); }}
              style={{ width: isMobile ? '100%' : 150, height: 28, padding: '3px 8px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 11, cursor: 'pointer' }}>
              <option value="all">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
              style={{ width: isMobile ? '100%' : 170, height: 28, padding: '3px 8px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 11, cursor: 'pointer' }}>
              <option value="all">All Projects</option>
              {(selectedClient === 'all' ? projects : projects.filter(p => p.client_id === parseInt(selectedClient))).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={openModal}
              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'hidden', overflowY: 'hidden', minWidth: 0 }}>
          {projects.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>No projects assigned yet</div>
          ) : (
            <div style={{ width: '100%', minWidth: 0 }}>
              <ProjectOverviewCharts projects={projects} issues={recentIssues} selectedProject={selectedProject} />
            </div>
          )}
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
                  style={{ width: 30, height: 30, borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', transition: 'all 0.15s' }}
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
                    const issueVals = [pi.filter(i=>i.status==='To Do').length, pi.filter(i=>i.status==='In Progress').length, pi.filter(i=>i.status==='Testing').length, pi.filter(i=>i.status==='Done').length];
                    const pt = modalTasks.filter(t => t.project === p.id || t.project_id === p.id);
                    const taskVals = [pt.filter(t=>t.status==='To Do').length, pt.filter(t=>t.status==='In Progress').length, pt.filter(t=>t.status==='Testing').length, pt.filter(t=>t.status==='Done').length];
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

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'yesterday';
  return `${Math.floor(diff / 86400)}d ago`;
}

function IssueActivityRow({ issue, onClick, isLast }) {
  const reporter = issue.reported_by?.username || 'Unknown';
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
      <div style={{ position: 'relative', flexShrink: 0 }}>
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

const statConfig = [
  { key: 'total_projects', label: 'Active Projects', color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.1)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg> },
  { key: 'total_issues',   label: 'Total Issues',   color: 'hsl(var(--info))',    bg: 'hsl(var(--info) / 0.1)',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> },
  { key: 'completed_issues', label: 'Completed',    color: 'hsl(var(--success))', bg: 'hsl(var(--success) / 0.1)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> },
  { key: 'pending_issues', label: 'Pending',        color: 'hsl(var(--warning))', bg: 'hsl(var(--warning) / 0.1)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 700px)');
  const isCompactLaptop = useMediaQuery('(min-width: 701px) and (max-width: 1440px)');
  const [stats, setStats] = useState({ total_projects: 0, total_issues: 0, completed_issues: 0, pending_issues: 0 });
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [expandIssues, setExpandIssues] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const fetchData = () => {
    return Promise.all([
      dashboardService.getStats(),
      projectService.getAll(),
      issueService.getAll(),
      projectService.getClients(),
      activityService.getAll(),
    ]).then(([sRes, pRes, iRes, cRes, aRes]) => {
      const myProjects = pRes.data;
      const allIssues = Array.isArray(iRes.data) ? iRes.data : (iRes.data?.results || []);
      const projectIds = myProjects.map(p => p.id);
      const filteredIssues = allIssues.filter(issue =>
        projectIds.includes(issue.project) || projectIds.includes(issue.project_id)
      );
      setStats(sRes.data);
      setProjects(myProjects);
      setRecentIssues(filteredIssues);
      setClients(cRes.data || []);
      setActivityLogs(aRes.data.slice(0, 20));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();

    // Listen for real-time updates
    const handleDashboardUpdate = (event) => {
      const data = event.detail;
      console.log('ðŸ”„ Manager Dashboard update received:', data);
      
      // Refresh data when relevant updates occur
      if (data.type === 'issue_created' || 
          data.type === 'issue_updated' || 
          data.type === 'project_created' || 
          data.type === 'project_updated' ||
          data.type === 'team_updated' ||
          data.type === 'status_changed' ||
          data.type === 'assignee_changed') {
        console.log('ðŸ”„ Refreshing Manager Dashboard data due to:', data.type);
        // Add small delay to ensure backend is updated
        setTimeout(() => {
          fetchData();
        }, 500);
      }
    };

    // Also listen for general WebSocket messages
    const handleWebSocketMessage = (event) => {
      console.log('ðŸ“¡ WebSocket message received:', event.detail);
      // Refresh data for any WebSocket update
      setTimeout(() => {
        fetchData();
      }, 500);
    };

    window.addEventListener('dashboardUpdate', handleDashboardUpdate);
    window.addEventListener('websocketMessage', handleWebSocketMessage);
    
    return () => {
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate);
      window.removeEventListener('websocketMessage', handleWebSocketMessage);
    };
  }, []);

  return (
    <div className="dashboard-flat-buttons" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Manager Dashboard</h1>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
          Welcome back, <strong>{user?.first_name || user?.username}</strong>!
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: isMobile ? 10 : 12, marginBottom: 16 }}>
        {statConfig.map((s) => (
          <div key={s.key} style={{ ...card, padding: isMobile ? '14px 12px' : '16px 18px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '20%', border: '2px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ color: s.color }}>{s.icon}</div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>
                {loading ? 'â€”' : stats[s.key] ?? 0}
              </div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: (isMobile || isCompactLaptop) ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: 14,
        marginBottom: 14,
      }}>
        {/* My Projects Card */}
        <ProjectsChartCard projects={projects} recentIssues={recentIssues} navigate={navigate} clients={clients} />

        {/* Recent Activity - same as AdminDashboard */}
        <div style={{ ...card, maxHeight: isMobile ? 'none' : 480, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Recent Activity</h2>
          </div>
          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          ) : activityLogs.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>No activity yet.</div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 380, flex: 1 }}>
              {activityLogs.map((log) => {
                const ACTION_META = {
                  issue_created:    'reported a new issue',
                  issue_updated:    'updated issue',
                  status_changed:   'changed status on',
                  comment_added:    'commented on',
                  assignee_changed: 'changed assignee on',
                  project_created:  'created project',
                  project_updated:  'updated project',
                };
                const ROLE_COLORS = {
                  admin:     { bg: 'hsl(var(--type-bug) / 0.15)',   text: 'hsl(var(--type-bug))' },
                  manager:   { bg: 'hsl(var(--type-epic) / 0.15)',  text: 'hsl(var(--type-epic))' },
                  client:    { bg: 'hsl(var(--info) / 0.15)',        text: 'hsl(var(--info))' },
                  employee:  { bg: 'hsl(var(--success) / 0.15)',    text: 'hsl(var(--success))' },
                  qa_tester: { bg: 'hsl(var(--warning) / 0.15)',    text: 'hsl(var(--warning))' },
                };
                const meta = ACTION_META[log.action] || log.action?.replace(/_/g, ' ');
                const rc = ROLE_COLORS[log.actor_role] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
                const timeAgoFn = (dateStr) => {
                  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
                  if (diff < 60) return 'just now';
                  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                  if (diff < 172800) return 'yesterday';
                  return `${Math.floor(diff / 86400)}d ago`;
                };
                return (
                  <div key={log.id} style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#fff' }}>
                      {log.actor_initials || (log.actor_name || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
                        <strong>{(log.actor_name || '').toUpperCase()}</strong>
                        {log.actor_role && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, backgroundColor: rc.bg, color: rc.text, marginLeft: 4, textTransform: 'uppercase' }}>{log.actor_role.replace('_', ' ')}</span>}
                        {' '}{meta?.toUpperCase()}{' '}
                        <span style={{ color: 'hsl(var(--primary))', fontWeight: 500 }}>{log.target}</span>
                        {log.extra?.from && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 6, verticalAlign: 'middle' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: { 'To Do': 'hsl(215 16% 50%)', 'In Progress': 'hsl(199 89% 48%)', 'Testing': 'hsl(38 95% 50%)', 'Done': 'hsl(145 63% 38%)' }[log.extra.from] || 'hsl(215 16% 50%)', color: '#fff' }}>{log.extra.from}</span>
                            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>â†’</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: { 'To Do': 'hsl(215 16% 50%)', 'In Progress': 'hsl(199 89% 48%)', 'Testing': 'hsl(38 95% 50%)', 'Done': 'hsl(145 63% 38%)' }[log.extra.to] || 'hsl(215 16% 50%)', color: '#fff' }}>{log.extra.to}</span>
                          </span>
                        )}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                        {log.project_name && <span>{log.project_name} Â· </span>}
                        {timeAgoFn(log.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
        const handleStatusUpdate = async (newStatus) => {
          try {
            await issueService.update(selectedIssue.id, { status: newStatus });
            setRecentIssues(prev => prev.map(i => i.id === selectedIssue.id ? { ...i, status: newStatus } : i));
            setSelectedIssue(prev => ({ ...prev, status: newStatus }));
            setStatusDropdownOpen(false);
          } catch (e) { console.error(e); }
        };
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
            onClick={(e) => { if (e.target === e.currentTarget) { setSelectedIssue(null); setStatusDropdownOpen(false); } }}
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
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: ss.bg, color: ss.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {statusIcons[selectedIssue.status]}{selectedIssue.status}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {statusDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 10, minWidth: 160 }}>
                          {['To Do', 'In Progress', 'Testing', 'Done'].map((status) => {
                            const sStyle = statusStyle[status]; const active = selectedIssue.status === status;
                            return (
                              <button key={status} onClick={() => handleStatusUpdate(status)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: 'none', backgroundColor: active ? 'hsl(var(--accent))' : 'transparent', color: active ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; }}
                                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: sStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sStyle.text }}>{statusIcons[status]}</div>
                                {status}{active && <span style={{ marginLeft: 'auto', fontSize: 10 }}>âœ“</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <button onClick={() => { setSelectedIssue(null); setStatusDropdownOpen(false); }}
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
                <button onClick={() => { setSelectedIssue(null); setStatusDropdownOpen(false); }}
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
