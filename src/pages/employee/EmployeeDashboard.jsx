import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workItemService } from '../../services/workItemService';
import { projectService } from '../../services/projectService';
import API from '../../services/api';
import IssuesScrollList from '../../components/IssuesScrollList';
import StatusOverviewChart from '../../components/StatusOverviewChart';
import useMediaQuery from '../../hooks/useMediaQuery';
import { Bug, CheckSquare, Bookmark, ChevronsUp, ChevronUp, Equal, ChevronDown, PieChart, BarChart3, Maximize2, X } from 'lucide-react';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const statusStyle = { 'To Do': { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' }, 'In Progress': { bg: 'hsl(var(--info) / 0.12)', text: 'hsl(var(--info))' }, 'Testing': { bg: 'hsl(var(--warning) / 0.12)', text: 'hsl(var(--warning))' }, 'Done': { bg: 'hsl(var(--success) / 0.12)', text: 'hsl(var(--success))' } };
const priorityColor = { highest: 'hsl(var(--priority-highest))', high: 'hsl(var(--priority-high))', medium: 'hsl(var(--priority-medium))', low: 'hsl(var(--priority-low))' };

function ProjectOverviewCharts({ projects, issues, selectedProject }) {
  const [tasks, setTasks] = useState([]);
  const [chartType, setChartType] = useState('pie');
  const [workType, setWorkType] = useState('all');
  const isMobile = useMediaQuery('(max-width: 700px)');

  useEffect(() => {
    API.get('/projects/tasks/my-tasks/')
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
  const colors = ['hsl(215 16% 62%)', 'hsl(199 89% 48%)', 'hsl(38 95% 50%)', 'hsl(145 63% 38%)'];
  const taskData = { label: 'Tasks', labels, colors, values: [taskStats.todo, taskStats.inProgress, taskStats.testing, taskStats.done] };
  const issueData = { label: 'Issues', labels, colors, values: [issueStats.todo, issueStats.inProgress, issueStats.testing, issueStats.done] };

  const renderChartBlock = (data) => {
    return (
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{data.label}</h3>
        </div>
        <StatusOverviewChart data={data} type={chartType} height={isMobile ? 240 : 280} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid hsl(var(--border))', paddingTop: 10 }}>
          {labels.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors[i] }} />
              <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>{label}: {data.values[i]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const selectedData = workType === 'tasks' ? taskData : issueData;

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'tasks', 'issues'].map((type) => (
            <button key={type} onClick={() => setWorkType(type)} style={{ padding: '5px 9px', border: '1px solid hsl(var(--border))', backgroundColor: workType === type ? 'hsl(var(--primary))' : 'hsl(var(--card))', color: workType === type ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>{type}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { type: 'pie', Icon: PieChart, title: 'Pie chart' },
            { type: 'bar', Icon: BarChart3, title: 'Bar chart' },
          ].map(({ type, Icon, title }) => (
            <button key={type} title={title} onClick={() => setChartType(type)} style={{ width: 30, height: 28, border: '1px solid hsl(var(--border))', backgroundColor: chartType === type ? 'hsl(var(--accent))' : 'hsl(var(--card))', color: chartType === type ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={15} /></button>
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
const CHART_COLORS = ['hsl(215 16% 62%)', 'hsl(199 89% 48%)', 'hsl(38 95% 50%)', 'hsl(145 63% 38%)'];

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

function ProjectsChartCard({ projects, issues, navigate }) {
  const [showModal, setShowModal] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [modalTasks, setModalTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [modalChartType, setModalChartType] = useState('pie');
  const isMobile = useMediaQuery('(max-width: 700px)');

  const openModal = () => {
    setShowModal(true);
    setModalReady(false);
    API.get('/projects/tasks/my-tasks/')
      .then((res) => setModalTasks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setModalTasks([]));
    setTimeout(() => setModalReady(true), 600);
  };

  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>My Work Overview</h2>
              <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Task & Issue distribution</p>
            </div>
          </div>
          <button onClick={openModal}
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

        {/* Filters */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 8 }}>
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 12, cursor: 'pointer' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

        </div>

        <div style={{ padding: isMobile ? '14px 12px' : '20px 16px', overflowX: 'hidden', overflowY: 'hidden', minWidth: 0 }}>
          {projects.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>No projects assigned yet</div>
          ) : (
            <div style={{ width: '100%', minWidth: 0 }}>
              <ProjectOverviewCharts projects={projects} issues={issues} selectedProject={selectedProject} />
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
                    const pi = issues.filter(i => i.project === p.id || i.project_id === p.id);
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

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 700px)');
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [expandIssues, setExpandIssues] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const fetchData = () => {
    if (user?.id) {
      return Promise.all([
        workItemService.getMyWorkItems(user),
        projectService.getAll(), // This already filters by user role in backend
      ]).then(([workRes, pRes]) => {
        const myWorkItems = workRes.data;
        const myProjects = pRes.data; // Backend already filters assigned projects
        
        // Filter issues to only show those from user's assigned projects
        const projectIds = myProjects.map(p => p.id);
        let filteredIssues = myWorkItems.filter(item => 
          projectIds.includes(item.project) || projectIds.includes(item.project_id)
        );
        
        // IMPORTANT: For Employee role, only show ASSIGNED issues in charts
        // (workItemService already filters for employees, but double-check for charts)
        if (user.role === 'employee') {
          filteredIssues = filteredIssues.filter(item => {
            const isAssigned = item.assignee?.id === user.id;
            console.log(`ðŸ“Š Chart filtering - Issue "${item.title}": assignee=${item.assignee?.id}, user=${user.id}, showing=${isAssigned}`);
            return isAssigned;
          });
        }
        
        console.log('ðŸ” Employee Dashboard Data:');
        console.log('- User Role:', user.role);
        console.log('- My Projects:', myProjects.map(p => p.name));
        console.log('- All Work Items:', myWorkItems.length);
        console.log('- Filtered Issues for Charts:', filteredIssues.length);
        
        setIssues(filteredIssues);
        setProjects(myProjects);
      }).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for real-time updates
    const handleDashboardUpdate = (event) => {
      const data = event.detail;
      console.log('ðŸ”„ Employee Dashboard update received:', data);
      
      // Refresh data when relevant updates occur
      if (data.type === 'issue_created' || 
          data.type === 'issue_updated' || 
          data.type === 'project_created' || 
          data.type === 'project_updated' ||
          data.type === 'task_assigned' ||
          data.type === 'status_changed' ||
          data.type === 'assignee_changed') {
        console.log('ðŸ”„ Refreshing Employee Dashboard data due to:', data.type);
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
  }, [user?.id]);

  const total = issues.length;
  const inProgress = issues.filter((t) => t.status === 'In Progress').length;
  const done = issues.filter((t) => t.status === 'Done').length;
  const todo = issues.filter((t) => t.status === 'To Do').length;

  const statConfig = [
    { label: 'Assigned Tasks', value: total,      color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.1)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
    { label: 'To Do',         value: todo,       color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
    { label: 'In Progress',   value: inProgress, color: 'hsl(var(--info))',    bg: 'hsl(var(--info) / 0.1)',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'Completed',     value: done,       color: 'hsl(var(--success))', bg: 'hsl(var(--success) / 0.1)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Employee Dashboard</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            Welcome back, <strong>{user?.first_name || user?.username}</strong>! You have <strong style={{ color: 'hsl(var(--warning))' }}>{inProgress} assigned task{inProgress !== 1 ? 's' : ''} in progress</strong>.
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
              <div style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>
                {loading ? 'â€”' : s.value}
              </div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Work Overview + Recent Issues */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>

        {/* My Work Overview - Left */}
        <ProjectsChartCard projects={projects} issues={issues} navigate={navigate} />

        {/* My Assigned Work - Right */}
        <div style={{ ...card, padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', maxHeight: isMobile ? 'none' : 480, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 4px' }}>Recent Issues</h2>
              <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '0 0 14px' }}>Stay up to date with your assigned tasks.</p>
            </div>
            <button onClick={() => setExpandIssues(true)}
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
          <div style={{ overflowY: 'auto', maxHeight: 340 }}>
            {loading ? (
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Loading...</p>
            ) : issues.length === 0 ? (
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No work items assigned yet.</p>
            ) : (
            issues.slice(0, 10).map((issue, index) => {
              const ss = statusStyle[issue.status] || statusStyle['To Do'];
              const actionMap = { 'To Do': 'needs to work on', 'In Progress': 'is working on', 'Testing': 'submitted for review', 'Done': 'completed' };
              const action = actionMap[issue.status] || 'is working on';
              const assignee = issue.assignee?.first_name
                ? `${issue.assignee.first_name} ${issue.assignee.last_name || ''}`.trim()
                : (issue.assignee?.username || 'You');
              return (
                <div key={issue.uniqueId || `${issue.itemType}-${issue.id}-${index}`} style={{ display: 'flex', gap: 10, marginBottom: 12, cursor: 'pointer' }}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'white' }}>
                    {assignee.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
                      <strong>{assignee.toUpperCase()}</strong>{' '}{action.toUpperCase()}{' '}
                      <span style={{ color: 'hsl(var(--primary))', fontWeight: 500 }}>{issue.title}</span>{' '}
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: { 'To Do': 'hsl(215 16% 50%)', 'In Progress': 'hsl(199 89% 48%)', 'Testing': 'hsl(38 95% 50%)', 'Done': 'hsl(145 63% 38%)' }[issue.status] || 'hsl(215 16% 50%)', color: '#fff' }}>{issue.status}</span>
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                      {issue.project_name && <span style={{ color: 'hsl(var(--primary))', fontWeight: 500 }}>{issue.project_name}</span>}{issue.project_name && ' Â· '}{timeAgo(issue.updated_at || issue.created_at)}
                    </p>
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
          <div style={{ ...card, width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>My Assigned Work</h2>
                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '2px 0 0' }}>{issues.length} total</p>
              </div>
              <button onClick={() => setExpandIssues(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 20 }}>âœ•</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }} className="issues-scroll">
              {issues.map((issue, i) => {
                const typeStyle = { bug: { bg: 'hsl(var(--type-bug) / 0.12)', text: 'hsl(var(--type-bug))' }, task: { bg: 'hsl(var(--type-task) / 0.12)', text: 'hsl(var(--type-task))' }, story: { bg: 'hsl(var(--type-story) / 0.12)', text: 'hsl(var(--type-story))' } };
                const ss = statusStyle[issue.status] || statusStyle['To Do'];
                const ts = typeStyle[issue.issue_type] || typeStyle.task;
                return (
                  <div key={issue.uniqueId || `${issue.itemType}-${issue.id}-${i}`}
                    onClick={() => { setExpandIssues(false); setSelectedIssue(issue); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: i < issues.length - 1 ? '1px solid hsl(var(--border))' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: priorityColor[issue.priority], flexShrink: 0 }} />
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
        const typeStyle = { bug: { bg: 'hsl(var(--type-bug) / 0.12)', text: 'hsl(var(--type-bug))' }, task: { bg: 'hsl(var(--type-task) / 0.12)', text: 'hsl(var(--type-task))' }, story: { bg: 'hsl(var(--type-story) / 0.12)', text: 'hsl(var(--type-story))' } };
        const ss = statusStyle[selectedIssue.status] || statusStyle['To Do'];
        const ts = typeStyle[selectedIssue.issue_type] || typeStyle.task;
        
        // Status icons
        const statusIcons = {
          'To Do': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
          'In Progress': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
          'Testing': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
          'Done': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>
        };
        
        const handleStatusUpdate = async (newStatus) => {
          try {
            await workItemService.updateStatus(selectedIssue.id, newStatus, selectedIssue.itemType);
            setIssues(prev => prev.map(issue => 
              issue.id === selectedIssue.id ? { ...issue, status: newStatus } : issue
            ));
            setSelectedIssue(prev => ({ ...prev, status: newStatus }));
            setStatusDropdownOpen(false);
          } catch (error) {
            console.error('Failed to update status:', error);
          }
        };
        
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedIssue(null); }}
          >
            <div style={{ backgroundColor: 'hsl(var(--card))', borderRadius: 12, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-floating)', border: '1px solid hsl(var(--border))' }}>
              
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  {/* Left: Icons only */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Type Icon - Jira style like AdminDashboard */}
                    {selectedIssue.issue_type === 'bug' ? (
                      <Bug size={16} color="hsl(var(--type-bug))" strokeWidth={2} />
                    ) : selectedIssue.issue_type === 'story' ? (
                      <Bookmark size={16} color="hsl(var(--type-story))" strokeWidth={2} />
                    ) : (
                      <CheckSquare size={16} color="hsl(var(--type-task))" strokeWidth={2} />
                    )}

                    {/* Priority Icon */}
                    {selectedIssue.priority === 'highest' ? (
                      <ChevronsUp size={16} color="hsl(var(--priority-highest))" strokeWidth={2} />
                    ) : selectedIssue.priority === 'high' ? (
                      <ChevronUp size={16} color="hsl(var(--priority-high))" strokeWidth={2} />
                    ) : selectedIssue.priority === 'medium' ? (
                      <Equal size={16} color="hsl(var(--priority-medium))" strokeWidth={2} />
                    ) : (
                      <ChevronDown size={16} color="hsl(var(--priority-low))" strokeWidth={2} />
                    )}
                  </div>
                  
                  {/* Right: Status Dropdown + Close */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Status Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: ss.bg, color: ss.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {statusIcons[selectedIssue.status]}
                        {selectedIssue.status}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {statusDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 10, minWidth: 160 }}>
                          {['To Do', 'In Progress', 'Testing', 'Done'].map((status) => {
                            const sStyle = statusStyle[status];
                            const active = selectedIssue.status === status;
                            return (
                              <button key={status} onClick={() => { handleStatusUpdate(status); setStatusDropdownOpen(false); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: 'none', backgroundColor: active ? 'hsl(var(--accent))' : 'transparent', color: active ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', borderRadius: active ? 0 : 0 }}
                                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; }}
                                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: sStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ color: sStyle.text }}>{statusIcons[status]}</div>
                                </div>
                                {status}
                                {active && <span style={{ marginLeft: 'auto', fontSize: 10 }}>âœ“</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Close Button */}
                    <button onClick={() => setSelectedIssue(null)} 
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 16, flexShrink: 0, transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--background))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                    >
                      âœ•
                    </button>
                  </div>
                </div>
                
                {/* Title */}
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.3 }}>{selectedIssue.title}</h2>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                
                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
                  {[
                    { label: 'Project',  value: selectedIssue.project_name, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
                    { label: 'Assignee', value: selectedIssue.assignee?.username || 'Unassigned', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                    { label: 'Reporter', value: selectedIssue.reported_by?.username || 'â€”', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/></svg> },
                    { label: 'Created',  value: new Date(selectedIssue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ color: 'hsl(var(--muted-foreground))' }}>{item.icon}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</p>
                        <p style={{ margin: '3px 0 0', fontSize: 14, color: 'hsl(var(--foreground))', fontWeight: 500 }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {selectedIssue.description && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</p>
                    </div>
                    <div style={{ padding: '16px 18px', backgroundColor: 'hsl(var(--muted) / 0.5)', borderRadius: 10, fontSize: 14, color: 'hsl(var(--foreground))', lineHeight: 1.6 }}>
                      {selectedIssue.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '20px 24px', borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.3)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedIssue(null)}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--background))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                >
                  Close
                </button>
                <button onClick={() => { setSelectedIssue(null); navigate('/tasks'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  View Full Details
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
