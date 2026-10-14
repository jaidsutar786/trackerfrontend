import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, projectService } from '../../services/projectService';
import { issueService } from '../../services/issueService';
import { activityService } from '../../services/activityService';
import API from '../../services/api';
import { getInitials } from '../../utils/userUtils';
import StatusOverviewChart from '../../components/StatusOverviewChart';
import AdminBoard from './Board';
import AdminBacklog from './Backlog';
import AdminIssues from './Issues';
import AdminProjects from './Projects';
import AdminClients from './Clients';
import AdminUsers from './Users';
import useMediaQuery from '../../hooks/useMediaQuery';
import {
  CheckCircle2, PenLine, FilePlus2, Clock,
  LayoutGrid, Maximize2, X,
  Bug, CheckSquare, Bookmark,
  ChevronsUp, ChevronUp, Equal, ChevronDown,
  RefreshCw, MessageSquare, UserCheck, FolderPlus, FileEdit, Pin,
  Gauge, Kanban, ListTodo, FolderKanban, Building2, Users, Share2, Zap, MoreHorizontal, PieChart, BarChart3,
} from 'lucide-react';

const TABS = [
  { key: 'summary',  label: 'Summary',  Icon: Gauge },
  { key: 'board',    label: 'Board',    Icon: Kanban },
  { key: 'backlog',  label: 'Backlog',  Icon: ListTodo },
  { key: 'issues',   label: 'Issues',   Icon: Bug },
  { key: 'projects', label: 'Projects', Icon: FolderKanban },
  { key: 'clients',  label: 'Clients',  Icon: Building2 },
  { key: 'users',    label: 'Users',    Icon: Users },
];

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, boxShadow: 'var(--shadow-sm)' };

const STATUS_COLORS = {
  'To Do':       'hsl(var(--muted-foreground))',
  'In Progress': 'hsl(var(--info))',
  'Testing':   'hsl(var(--warning))',
  'Done':        'hsl(var(--success))',
};
const PRIORITY_COLORS = {
  highest: 'hsl(var(--priority-highest))',
  high:    'hsl(var(--priority-high))',
  medium:  'hsl(var(--priority-medium))',
  low:     'hsl(var(--priority-low))',
};
const TYPE_COLORS = {
  bug:   'hsl(var(--type-bug))',
  task:  'hsl(var(--type-task))',
  story: 'hsl(var(--type-story))',
};

const now = new Date();
const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

const PROJECT_PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--type-epic))',
  'hsl(var(--type-bug))',
  'hsl(var(--priority-high))',
  'hsl(var(--priority-low))',
];

const CHART_LABELS = ['To Do', 'In Progress', 'Testing', 'Done'];
const CHART_COLORS = ['hsl(222 47% 58%)', 'hsl(199 89% 48%)', 'hsl(38 95% 50%)', 'hsl(145 63% 38%)'];

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

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'yesterday';
  return `${Math.floor(diff / 86400)}d ago`;
}

const ROLE_COLORS = {
  admin:     { bg: 'hsl(var(--type-bug) / 0.15)',   text: 'hsl(var(--type-bug))' },
  manager:   { bg: 'hsl(var(--type-epic) / 0.15)',  text: 'hsl(var(--type-epic))' },
  client:    { bg: 'hsl(var(--info) / 0.15)',        text: 'hsl(var(--info))' },
  employee:  { bg: 'hsl(var(--success) / 0.15)',    text: 'hsl(var(--success))' },
  qa_tester: { bg: 'hsl(var(--warning) / 0.15)',    text: 'hsl(var(--warning))' },
};

const ACTION_META = {
  issue_created:    { label: 'reported a new issue', Icon: Bug },
  issue_updated:    { label: 'updated issue',         Icon: FileEdit },
  status_changed:   { label: 'changed status on',     Icon: RefreshCw },
  comment_added:    { label: 'commented on',           Icon: MessageSquare },
  assignee_changed: { label: 'changed assignee on',   Icon: UserCheck },
  project_created:  { label: 'created project',        Icon: FolderPlus },
  project_updated:  { label: 'updated project',        Icon: FileEdit },
};

const PRIORITY_ICONS = {
  highest: ChevronsUp, high: ChevronUp, medium: Equal, low: ChevronDown,
};

const TYPE_ICONS = { bug: Bug, task: CheckSquare, story: Bookmark };

function TabBar({ activeTab, setActiveTab }) {
  const isMobile = useMediaQuery('(max-width: 700px)');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const visibleTabs = isMobile ? TABS.slice(0, 4) : TABS;
  const overflowTabs = isMobile ? TABS.slice(4) : [];
  const overflowActive = overflowTabs.some((tab) => tab.key === activeTab);

  useEffect(() => {
    if (!isMobile) {
      setMoreOpen(false);
      return undefined;
    }
    const closeMore = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', closeMore);
    return () => document.removeEventListener('mousedown', closeMore);
  }, [isMobile]);

  const renderTabButton = (tab) => {
    const active = activeTab === tab.key;
    const Icon = tab.Icon;
    return (
      <button
        key={tab.key}
        onClick={() => {
          setActiveTab(tab.key);
          setMoreOpen(false);
        }}
        style={{
          height: 34,
          padding: 0,
          border: 'none',
          borderBottom: active ? '2px solid hsl(var(--primary))' : '2px solid transparent',
          whiteSpace: 'nowrap',
          backgroundColor: 'transparent',
          color: active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
          fontWeight: active ? 700 : 500,
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          transition: 'color 0.15s, border-color 0.15s',
          scrollSnapAlign: 'start',
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.color = 'hsl(var(--primary))';
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.color = 'hsl(var(--foreground))';
        }}
      >
        <Icon size={15} strokeWidth={2} />
        {tab.label}
      </button>
    );
  };

  return (
    <div style={{ position: 'relative', margin: isMobile ? '-14px -12px 16px' : '-20px -24px 18px', backgroundColor: 'hsl(var(--background))', borderBottom: '1px solid hsl(var(--border))', boxShadow: '0 1px 0 hsl(var(--border) / 0.45)' }}>
      <div style={{ padding: isMobile ? '12px 14px 0' : '16px 24px 0' }}>
        <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>Spaces</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'hsl(var(--primary))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LayoutGrid size={15} />
            </div>
            <h1 style={{ fontSize: isMobile ? 18 : 21, fontWeight: 750, color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Admin Dashboard
            </h1>
          </div>
          <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 8 }}>
            {[
              { title: 'Share', Icon: Share2 },
              { title: 'Quick actions', Icon: Zap },
              { title: 'Expand', Icon: Maximize2 },
              { title: 'More', Icon: MoreHorizontal },
            ].map(({ title, Icon }) => (
              <button
                key={title}
                title={title}
                style={{ width: 32, height: 32, border: '1px solid hsl(var(--border))', borderRadius: 6, backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.7)'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--background))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', overflowX: isMobile ? 'visible' : 'auto', gap: isMobile ? 16 : 24, padding: isMobile ? '10px 14px 0' : '12px 24px 0', scrollSnapType: 'x proximity' }} className="scrollbar-thin">
        {visibleTabs.map(renderTabButton)}
        {isMobile && overflowTabs.length > 0 && (
          <div ref={moreRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMoreOpen((open) => !open)}
              style={{
                height: 34,
                padding: 0,
                border: 'none',
                borderBottom: overflowActive || moreOpen ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                whiteSpace: 'nowrap',
                backgroundColor: 'transparent',
                color: overflowActive || moreOpen ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                fontWeight: overflowActive || moreOpen ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              More
              <span style={{ minWidth: 16, height: 16, borderRadius: 999, background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                {overflowTabs.length}
              </span>
              <ChevronDown size={14} strokeWidth={2.2} />
            </button>
            {moreOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 37,
                  right: 0,
                  width: 206,
                  padding: '6px 0',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  background: 'hsl(var(--card))',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 1200,
                }}
              >
                {overflowTabs.map((tab) => {
                  const active = activeTab === tab.key;
                  const Icon = tab.Icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setMoreOpen(false);
                      }}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        border: 0,
                        background: active ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                        color: active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Icon size={15} strokeWidth={2} />
                      <span style={{ flex: 1 }}>{tab.label}</span>
                      {active && <MoreHorizontal size={15} strokeWidth={2} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabShell({ activeTab, setActiveTab, user, children }) {
  return (
    <div className="dashboard-flat-buttons" style={{ width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="admin-tab-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [issues, setIssues] = useState([]);
  const [logs, setLogs]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [modalChartType, setModalChartType] = useState('pie');
  const isMobile = useMediaQuery('(max-width: 700px)');
  const isCompactLaptop = useMediaQuery('(min-width: 701px) and (max-width: 1440px)');

  const [modalTasks, setModalTasks] = useState([]);

  const openModal = () => {
    setShowAllProjects(true);
    setModalReady(false);
    API.get('/projects/work-overview/')
      .then((res) => setModalTasks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setModalTasks([]));
    setTimeout(() => setModalReady(true), 600);
  };

  const fetchData = () => {
    return Promise.all([getDashboardStats(), issueService.getAll({ page_size: 1000 }), activityService.getAll(), projectService.getAll(), projectService.getClients()])
      .then(([, iRes, aRes, pRes, cRes]) => {
        // Handle paginated response for issues
        const issuesData = iRes.data?.results || iRes.data || [];
        setIssues([...issuesData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        setLogs(aRes.data.slice(0, 20));
        setProjects(pRes.data || []);
        setClients(cRes.data || []);
        
        console.log('✅ Admin Dashboard data loaded:', {
          issues: issuesData,
          logs: aRes.data,
          projects: pRes.data,
          clients: cRes.data
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();

    // Listen for real-time updates
    const handleDashboardUpdate = (event) => {
      const data = event.detail;
      console.log('🔄 Admin Dashboard update received:', data);
      
      // Refresh data when relevant updates occur
      if (data.type === 'issue_created' || 
          data.type === 'issue_updated' || 
          data.type === 'project_created' || 
          data.type === 'project_updated' ||
          data.type === 'activity_logged' ||
          data.type === 'status_changed' ||
          data.type === 'assignee_changed') {
        console.log('🔄 Refreshing Admin Dashboard data due to:', data.type);
        // Add small delay to ensure backend is updated
        setTimeout(() => {
          fetchData();
        }, 500);
      }
    };

    // Also listen for general WebSocket messages
    const handleWebSocketMessage = (event) => {
      console.log('📡 WebSocket message received:', event.detail);
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

  const last7Completed = issues.filter((i) => i.status === 'Done' && new Date(i.updated_at) >= sevenDaysAgo).length;
  const last7Updated   = issues.filter((i) => new Date(i.updated_at) >= sevenDaysAgo).length;
  const last7Created   = issues.filter((i) => new Date(i.created_at) >= sevenDaysAgo).length;
  const openCount      = issues.filter((i) => i.status !== 'Done').length;

  const statusCounts = Object.entries(
    issues.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const priorityCounts = ['highest', 'high', 'medium', 'low'].map((p) => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    key: p,
    value: issues.filter((i) => i.priority === p).length,
  }));

  const typeCounts = ['bug', 'task', 'story'].map((t) => ({
    name: t === 'story' ? 'Feature' : t.charAt(0).toUpperCase() + t.slice(1),
    key: t,
    count: issues.filter((i) => i.issue_type === t).length,
    pct: issues.length ? Math.round((issues.filter((i) => i.issue_type === t).length / issues.length) * 100) : 0,
  }));

  const topCards = [
    { label: 'completed', sub: 'in the last 7 days', value: last7Completed, Icon: CheckCircle2, color: 'hsl(var(--success))', bg: 'hsl(var(--success) / 0.08)', border: 'hsl(var(--success) / 0.2)' },
    { label: 'updated',   sub: 'in the last 7 days', value: last7Updated,   Icon: PenLine,      color: 'hsl(var(--info))',    bg: 'hsl(var(--info) / 0.08)',    border: 'hsl(var(--info) / 0.2)' },
    { label: 'created',   sub: 'in the last 7 days', value: last7Created,   Icon: FilePlus2,    color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.08)', border: 'hsl(var(--primary) / 0.2)' },
    { label: 'open',      sub: 'total open issues',  value: openCount,      Icon: Clock,        color: 'hsl(var(--warning))', bg: 'hsl(var(--warning) / 0.08)', border: 'hsl(var(--warning) / 0.2)' },
  ];

  // Non-summary tabs render directly
  if (activeTab === 'board')    return <TabShell activeTab={activeTab} setActiveTab={setActiveTab} user={user}><AdminBoard /></TabShell>;
  if (activeTab === 'backlog')  return <TabShell activeTab={activeTab} setActiveTab={setActiveTab} user={user}><AdminBacklog /></TabShell>;
  if (activeTab === 'issues')   return <TabShell activeTab={activeTab} setActiveTab={setActiveTab} user={user}><AdminIssues /></TabShell>;
  if (activeTab === 'projects') return <TabShell activeTab={activeTab} setActiveTab={setActiveTab} user={user}><AdminProjects /></TabShell>;
  if (activeTab === 'clients')  return <TabShell activeTab={activeTab} setActiveTab={setActiveTab} user={user}><AdminClients /></TabShell>;
  if (activeTab === 'users')    return <TabShell activeTab={activeTab} setActiveTab={setActiveTab} user={user}><AdminUsers /></TabShell>;

  return (
    <div className="dashboard-flat-buttons" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

      {/* ── Tab Bar ── */}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── Page Header ── */}
      {/* ── Top 4 Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: isMobile ? 10 : 12, marginBottom: 16 }}>
        {topCards.map((s) => (
          <div key={s.label} style={{ ...card, padding: isMobile ? '14px 12px' : '16px 18px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.Icon size={17} color={s.color} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>
                {loading ? '—' : s.value} {s.label}
              </div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Charts + Recent Activity ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: (isMobile || isCompactLaptop) ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))', 
        gap: 14, 
        marginBottom: 14
      }}>

        {/* Projects Overview */}
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
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
                <Maximize2 size={12} />
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'hidden', overflowY: 'hidden', minWidth: 0 }}>
            {loading ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>Loading...</div>
            ) : projects.length === 0 ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>No projects yet</div>
            ) : (
              <div style={{ width: '100%', minWidth: 0 }}>
                <ProjectOverviewCharts projects={projects} issues={issues} selectedProject={selectedProject} />
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ ...card, padding: isMobile ? 14 : 18, display: 'flex', flexDirection: 'column', maxHeight: (isMobile || isCompactLaptop) ? 'none' : 480, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 2px' }}>Recent Activity</h2>
              <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Stay up to date with what's happening.</p>
            </div>
            <button onClick={() => setActiveTab('activity')}
              style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
              <Maximize2 size={11} />
            </button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 380, marginTop: 8 }}>
            {loading ? (
              <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Loading...</p>
            ) : logs.length === 0 ? (
              <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No activity yet.</p>
            ) : logs.map((log) => {
              const meta = ACTION_META[log.action] || { label: log.action, Icon: Pin };
              const rc = ROLE_COLORS[log.actor_role] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
              return (
                <div key={log.id} style={{ display: 'flex', gap: 8, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid hsl(var(--border))' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'white' }}>
                    {getInitials({ username: log.actor_name, first_name: log.actor_name })}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--foreground))', lineHeight: 1.4, wordBreak: 'break-word' }}>
                      <strong>{(log.actor_name || '').toUpperCase()}</strong>
                      {log.actor_role && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, backgroundColor: rc.bg, color: rc.text, marginLeft: 4, textTransform: 'uppercase' }}>{log.actor_role.replace('_', ' ')}</span>}
                      {' '}{meta.label.toUpperCase()}{' '}
                      <span style={{ color: 'hsl(var(--primary))', fontWeight: 500 }}>{log.target}</span>
                      {log.extra?.from && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 6, verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: STATUS_COLORS[log.extra.from] || 'hsl(var(--muted))', color: '#fff' }}>{log.extra.from}</span>
                          <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>→</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: STATUS_COLORS[log.extra.to] || 'hsl(var(--muted))', color: '#fff' }}>{log.extra.to}</span>
                        </span>
                      )}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
                      {log.project_name && <span style={{ color: 'hsl(var(--primary))', fontWeight: 500 }}>{log.project_name}</span>}{log.project_name && ' · '}{timeAgo(log.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Priority Breakdown + Types of Work ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>

        {/* Priority Breakdown */}
        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 4px' }}>Priority breakdown</h2>
          <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '0 0 16px' }}>Holistic view of how work is being prioritized.</p>
          {loading || issues.length === 0 ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>
              {loading ? 'Loading...' : 'No data'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {priorityCounts.map((p) => {
                const maxVal = Math.max(...priorityCounts.map((x) => x.value), 1);
                const PIcon = PRIORITY_ICONS[p.key] || Equal;
                return (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PIcon size={16} color={PRIORITY_COLORS[p.key]} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'hsl(var(--foreground))', width: 64, flexShrink: 0 }}>{p.name}</span>
                    <div style={{ flex: 1, height: 24, backgroundColor: 'hsl(var(--muted))', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(p.value / maxVal) * 100}%`, backgroundColor: PRIORITY_COLORS[p.key], borderRadius: 5, transition: 'width 0.6s ease', minWidth: p.value > 0 ? 6 : 0 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', width: 22, textAlign: 'right', flexShrink: 0 }}>{p.value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Types of Work */}
        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 4px' }}>Types of work</h2>
          <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '0 0 14px' }}>
            Breakdown of issues by type.{' '}
            <span onClick={() => setActiveTab('issues')} style={{ color: 'hsl(var(--primary))', cursor: 'pointer', fontWeight: 500 }}>View all items</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '88px minmax(0, 1fr) 32px' : '110px 1fr 36px', gap: '0 10px', marginBottom: 10 }}>
            {['Type', 'Distribution', 'Count'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</span>
            ))}
          </div>
          {typeCounts.map((t) => {
            const TIcon = TYPE_ICONS[t.key] || CheckSquare;
            return (
              <div key={t.key} style={{ display: 'grid', gridTemplateColumns: isMobile ? '88px minmax(0, 1fr) 32px' : '110px 1fr 36px', gap: '0 10px', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TIcon size={15} color={TYPE_COLORS[t.key]} strokeWidth={2} />
                  <span style={{ fontSize: 13, color: 'hsl(var(--foreground))' }}>{t.name}</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, backgroundColor: 'hsl(var(--muted))', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.pct}%`, backgroundColor: TYPE_COLORS[t.key], borderRadius: 5, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', textAlign: 'right' }}>{t.count}</span>
              </div>
            );
          })}
          {issues.length === 0 && !loading && (
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No issues yet.</p>
          )}
        </div>
      </div>

      {/* ── All Projects Modal ── */}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {showAllProjects && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: isMobile ? 10 : 0 }}
            onClick={() => { setShowAllProjects(false); setModalReady(false); }}>
            <div className="dashboard-flat-buttons" style={{ ...card, position: 'relative', zIndex: 1, width: isMobile ? '100%' : 'min(1248px, 92vw)', maxHeight: isMobile ? '88vh' : '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', borderRadius: 4 }}
              onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>All Projects</h2>
                  <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '2px 0 0' }}>{projects.length} projects · hover on chart for details</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {[
                    { type: 'pie', Icon: PieChart, title: 'Pie chart' },
                    { type: 'bar', Icon: BarChart3, title: 'Bar chart' },
                  ].map(({ type, Icon, title }) => (
                    <button key={type} title={title} onClick={() => setModalChartType(type)}
                      style={{ width: 30, height: 30, borderRadius: 3, border: '1px solid hsl(var(--border))', background: modalChartType === type ? 'hsl(var(--accent))' : 'hsl(var(--card))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: modalChartType === type ? 'hsl(var(--accent-foreground))' : 'hsl(var(--muted-foreground))' }}>
                      <Icon size={15} />
                    </button>
                  ))}
                  <button onClick={() => { setShowAllProjects(false); setModalReady(false); }}
                    title="Close"
                    style={{ width: 30, height: 30, borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--card))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
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
                        <div key={p.id} style={{ ...card, padding: 16, borderRadius: 6 }}>
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
        </>
      )}
    </div>
  );
}
