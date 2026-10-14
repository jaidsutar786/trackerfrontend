import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, ArrowLeft, User, CheckSquare, CalendarDays, ChevronsUp, ChevronUp, Equal, ChevronDown, Filter } from 'lucide-react';
import API from '../../services/api';
import { moduleService } from '../../services/moduleService';
import { featureService } from '../../services/featureService';
import { projectService } from '../../services/projectService';
import ItemDetailModal from '../../components/ItemDetailModal';
import useMediaQuery from '../../hooks/useMediaQuery';

const STATUSES = ['To Do', 'In Progress', 'Testing', 'Blocked', 'Done'];
const PRIORITIES = [
  ['highest', 'Highest'],
  ['high', 'High'],
  ['medium', 'Medium'],
  ['low', 'Low'],
  ['lowest', 'Lowest'],
];

const priorityIconMap = {
  highest: { Icon: ChevronsUp, color: 'hsl(var(--priority-highest))' },
  high:    { Icon: ChevronUp,  color: 'hsl(var(--priority-high))' },
  medium:  { Icon: Equal,      color: 'hsl(var(--priority-medium))' },
  low:     { Icon: ChevronDown,color: 'hsl(var(--priority-low))' },
  lowest:  { Icon: ChevronDown,color: 'hsl(var(--muted-foreground))' },
};

const columnTone = {
  'To Do': '#64748b',
  'In Progress': '#0ea5e9',
  Testing: '#f59e0b',
  Blocked: '#ef4444',
  Done: '#22c55e',
};

const card = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  boxShadow: 'var(--shadow-sm)',
};

const boardStyles = {
  page: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'hsl(var(--background))',
    overflow: 'hidden',
  },
  topBar: {
    flexShrink: 0,
    padding: '12px 20px',
    background: 'hsl(var(--card))',
    borderBottom: '1px solid hsl(var(--border))',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
    color: 'hsl(var(--foreground))',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  headerRow: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '14px 20px 12px',
    borderBottom: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
  },
  boardWrapper: {
    flex: 1,
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '16px 20px',
  },
};

const getUserName = (user) => {
  if (!user) return 'Unassigned';
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.username || user.email || 'Unassigned';
};

const formatDate = (value) => {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const emptyForm = (status = 'To Do', assignee = '') => ({
  title: '',
  description: '',
  priority: 'medium',
  assignee,
  due_date: '',
  estimate_hours: '',
  labels: '',
  blocker_reason: '',
  status,
});

const parseLabels = (value) => (
  (value || '')
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
);

export default function ModuleTaskBoard() {
  const { projectSlug, taskSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const moduleSlug = searchParams.get('module');
  const featureKey = searchParams.get('feature');
  const startCreate = searchParams.get('create') === '1';

  const [project, setProject] = useState(null);
  const [moduleInfo, setModuleInfo] = useState(null);
  const [directTasks, setDirectTasks] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createTarget, setCreateTarget] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [draggedTask, setDraggedTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    feature: featureKey || 'all',
    assignee: 'all',
    priority: 'all',
    status: 'all',
  });
  const closingTaskKeyRef = useRef(null);

  const projectMembers = project?.members || [];
  const selectedTaskKey = searchParams.get('task') || taskSlug;

  const selectedFeature = useMemo(
    () => features.find((feature) => feature.feature_id === featureKey) || null,
    [features, featureKey]
  );

  const boardItems = useMemo(() => {
    const featureItems = features.flatMap((feature) => (
      (feature.tasks || []).map((task) => ({
        ...task,
        issue_type: 'task',
        type: 'task',
        item_type: 'task',
        project_id: project?.id,
        project_name: project?.name,
        module_title: moduleInfo?.title,
        source: 'feature',
        feature_key: feature.feature_id,
        feature_title: feature.title,
      }))
    ));

    const moduleItems = directTasks.map((task) => ({
      ...task,
      issue_type: 'task',
      type: 'task',
      item_type: 'task',
      project_id: project?.id,
      project_name: project?.name,
      module_title: moduleInfo?.title,
      source: 'module',
      feature_key: null,
      feature_title: moduleInfo?.title || 'Module task',
    }));

    return [...moduleItems, ...featureItems];
  }, [directTasks, features, moduleInfo, project]);

  const filteredBoardItems = useMemo(() => (
    boardItems.filter((task) => {
      if (filters.feature === 'module' && task.source !== 'module') return false;
      if (filters.feature !== 'all' && filters.feature !== 'module' && task.feature_key !== filters.feature) return false;
      if (filters.assignee === 'unassigned' && task.assignee) return false;
      if (filters.assignee !== 'all' && filters.assignee !== 'unassigned' && String(task.assignee?.id || '') !== String(filters.assignee)) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      return true;
    })
  ), [boardItems, filters]);

  const visibleStatuses = filters.status === 'all' ? STATUSES : [filters.status];

  const loadBoard = async () => {
    if (!moduleSlug) {
      setLoading(false);
      setError('Module is missing from the URL.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [projectRes, moduleRes, taskRes, featureRes] = await Promise.all([
        projectService.getBySlug(projectSlug),
        moduleService.getBySlug(projectSlug, moduleSlug),
        moduleService.getTasksBySlug(projectSlug, moduleSlug),
        moduleService.getFeaturesBySlug(projectSlug, moduleSlug),
      ]);
      setProject(projectRes.data);
      setModuleInfo(moduleRes.data);
      setDirectTasks(taskRes.data);
      setFeatures(featureRes.data);
      setFilters((current) => ({
        ...current,
        feature: current.feature === 'all' && featureKey ? featureKey : current.feature,
      }));

      if (startCreate) {
        setCreateTarget({ type: 'module', status: 'To Do' });
        setForm(emptyForm('To Do'));
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to load board.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
  }, [projectSlug, moduleSlug]);

  const openCreate = (status) => {
    const feature = selectedFeature;
    setCreateTarget(feature ? { type: 'feature', feature, status } : { type: 'module', status });
    setForm({
      ...emptyForm(status, feature?.assignee?.id || ''),
      title: feature?.title || '',
      description: feature
        ? [
            feature.requirement_type ? `Required: ${feature.requirement_type}` : '',
            feature.description || '',
          ].filter(Boolean).join('\n')
        : '',
    });
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    if (saving) return;

    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      assignee: form.assignee || null,
      due_date: form.due_date || null,
      estimate_hours: form.estimate_hours || null,
      labels: parseLabels(form.labels),
      blocker_reason: form.blocker_reason.trim(),
    };

    try {
      if (createTarget?.type === 'feature') {
        await featureService.createTaskForFeature(
          projectSlug,
          moduleSlug,
          createTarget.feature.id,
          payload
        );
      } else {
        await moduleService.createTaskBySlug(projectSlug, moduleSlug, payload);
      }
      setCreateTarget(null);
      setForm(emptyForm());
      await loadBoard();
    } catch (err) {
      const data = err?.response?.data || {};
      setError(data.error || data.detail || Object.values(data).flat?.().join(' ') || 'Unable to create task.');
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (task, status) => {
    if (task.status === status) return;
    const previousStatus = task.status;
    setSelectedTask((current) => (
      current?.id === task.id ? { ...current, status } : current
    ));

    if (task.source === 'module') {
      setDirectTasks((tasks) => tasks.map((item) => (
        item.id === task.id ? { ...item, status } : item
      )));
    } else {
      setFeatures((list) => list.map((feature) => ({
        ...feature,
        tasks: (feature.tasks || []).map((item) => (
          item.id === task.id ? { ...item, status } : item
        )),
      })));
    }

    try {
      await featureService.updateTaskBySlug(projectSlug, task.task_id || task.id, { status });
    } catch {
      setSelectedTask((current) => (
        current?.id === task.id ? { ...current, status: previousStatus } : current
      ));
      if (task.source === 'module') {
        setDirectTasks((tasks) => tasks.map((item) => (
          item.id === task.id ? { ...item, status: previousStatus } : item
        )));
      } else {
        setFeatures((list) => list.map((feature) => ({
          ...feature,
          tasks: (feature.tasks || []).map((item) => (
            item.id === task.id ? { ...item, status: previousStatus } : item
          )),
        })));
      }
    }
  };

  const moduleManagementUrl = `/projects/${projectSlug}/modules?module=${moduleSlug || ''}`;

  const getTaskRouteKey = (task) => task.task_id || task.id;

  const getBoardSearch = (overrides = {}) => {
    const params = new URLSearchParams(searchParams);
    if (moduleSlug) params.set('module', moduleSlug);
    if (featureKey) params.set('feature', featureKey);
    params.delete('create');

    Object.entries(overrides).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    return params.toString();
  };

  const openTaskModal = async (task, options = {}) => {
    const taskKey = getTaskRouteKey(task);
    closingTaskKeyRef.current = null;
    if (options.updateUrl !== false) {
      const query = getBoardSearch({
        feature: task.feature_key || null,
        task: taskKey,
      });
      navigate(`/projects/${projectSlug}/tasks/${taskKey}${query ? `?${query}` : ''}`, { replace: false });
    }

    const base = { ...task, itemType: 'task', project: project?.id, project_name: project?.name, project_slug: projectSlug, issue_type: task.issue_type || 'task' };
    setSelectedTask(base);
    try {
      const res = await API.get(`/projects/${projectSlug}/tasks/${task.task_id || task.id}/`);
      setSelectedTask({
        ...base,
        ...res.data,
        itemType: 'task',
        project: project?.id,
        project_name: project?.name,
        project_slug: projectSlug,
        issue_type: res.data.issue_type || 'task',
        source: task.source,
        feature_key: task.feature_key,
        feature_title: task.feature_title,
      });
    } catch {
      setSelectedTask(base);
    }
  };

  useEffect(() => {
    if (!selectedTaskKey) {
      closingTaskKeyRef.current = null;
      return;
    }
    if (closingTaskKeyRef.current === String(selectedTaskKey) || boardItems.length === 0) return;
    if (
      selectedTask &&
      (String(selectedTask.task_id) === String(selectedTaskKey) || String(selectedTask.id) === String(selectedTaskKey))
    ) {
      return;
    }

    const matchingTask = boardItems.find((task) => (
      String(task.task_id) === String(selectedTaskKey) || String(task.id) === String(selectedTaskKey)
    ));

    if (matchingTask) {
      openTaskModal(matchingTask, { updateUrl: false });
    }
  }, [selectedTaskKey, boardItems, selectedTask]);

  const handleDrop = (status) => {
    if (!draggedTask) return;
    updateTaskStatus(draggedTask, status);
    setDraggedTask(null);
  };

  const refreshAfterModalUpdate = async () => {
    await loadBoard();
    setSelectedTask(null);
  };

  const closeTaskModal = () => {
    if (selectedTaskKey) {
      closingTaskKeyRef.current = String(selectedTaskKey);
    }
    const query = getBoardSearch({ task: null });
    navigate(`/projects/${projectSlug}/tasks${query ? `?${query}` : ''}`, { replace: true });
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'hsl(var(--muted-foreground))' }}>
        Loading board...
      </div>
    );
  }

  return (
    <div className="module-task-board-page" style={boardStyles.page}>
      <div className="module-task-board-topbar" style={{ ...boardStyles.topBar, padding: isMobile ? '10px 12px' : boardStyles.topBar.padding }}>
        <button style={boardStyles.backButton} onClick={() => navigate(moduleManagementUrl)}>
          <ArrowLeft size={14} />
          Back to Module Management
        </button>
      </div>

      <div className="module-task-board-header" style={{ ...boardStyles.headerRow, padding: isMobile ? '12px' : boardStyles.headerRow.padding, alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 8px', borderRadius: 6, background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))', fontSize: 12, fontWeight: 700 }}>
              {moduleInfo?.module_key || moduleSlug}
            </span>
            {selectedFeature && (
              <span style={{ padding: '4px 8px', borderRadius: 6, background: 'hsl(var(--primary) / 0.10)', color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 700 }}>
                Adding to {selectedFeature.feature_id}
              </span>
            )}
          </div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'hsl(var(--foreground))', lineHeight: 1.25, wordBreak: 'break-word' }}>
            {moduleInfo?.title || 'Module'} board
          </h1>
          <p style={{ margin: '4px 0 0', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>
            {filteredBoardItems.length} of {boardItems.length} module and feature tasks
          </p>
        </div>
        <button
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 14px', borderRadius: 8, border: 'none', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => openCreate('To Do')}
        >
          <Plus size={16} />
          {selectedFeature ? 'Add Task for Feature' : 'Add Module Task'}
        </button>
      </div>

      {error && (
        <div style={{ ...card, padding: 12, margin: '0 20px 12px', color: 'hsl(var(--destructive))', flexShrink: 0 }}>
          {error}
        </div>
      )}

      <div
        className="module-task-board-filters"
        style={{
          flexShrink: 0,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'auto repeat(4, minmax(150px, 1fr))',
          gap: 10,
          padding: isMobile ? '12px' : '12px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--card))',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700 }}>
          <Filter size={14} />
          Filters
        </div>
        <select value={filters.feature} onChange={(e) => setFilters(p => ({ ...p, feature: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13 }}>
          <option value="all">All work</option>
          <option value="module">Module tasks only</option>
          {features.map((feature) => (
            <option key={feature.id} value={feature.feature_id}>{feature.feature_id} - {feature.title}</option>
          ))}
        </select>
        <select value={filters.assignee} onChange={(e) => setFilters(p => ({ ...p, assignee: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13 }}>
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {projectMembers.map((member) => (
            <option key={member.id} value={member.id}>{getUserName(member)}</option>
          ))}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters(p => ({ ...p, priority: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13 }}>
          <option value="all">All priorities</option>
          {PRIORITIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13 }}>
          <option value="all">All statuses</option>
          {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      <div className="module-task-board-wrapper" style={{ ...boardStyles.boardWrapper, padding: isMobile ? '12px' : boardStyles.boardWrapper.padding }}>
        <div className="module-task-board-columns" style={{ display: 'flex', gap: 12, height: '100%', minWidth: isMobile ? 0 : 1100 }}>
          {visibleStatuses.map((status) => {
            const colTasks = filteredBoardItems.filter((task) => task.status === status);
            const accent = columnTone[status];
            return (
              <div
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(status)}
                style={{ flex: '1 1 240px', minWidth: isMobile ? 'min(82vw, 320px)' : 220, backgroundColor: 'hsl(var(--column-bg))', borderRadius: 8, display: 'flex', flexDirection: 'column', flexShrink: 0, border: '2px solid transparent', transition: 'all 0.15s' }}
              >
                {/* Column Header */}
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', flex: 1 }}>{status}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 10, backgroundColor: 'hsl(var(--background) / 0.7)', color: 'hsl(var(--muted-foreground))' }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ flex: 1, padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }} className="scrollbar-thin">
                  {colTasks.map((task) => {
                    const pm = priorityIconMap[task.priority] || priorityIconMap.medium;
                    const PIcon = pm.Icon;
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                    return (
                      <article
                        key={`${task.source}-${task.id}`}
                        draggable
                        onDragStart={() => setDraggedTask(task)}
                        onDragEnd={() => setDraggedTask(null)}
                        onClick={() => openTaskModal(task)}
                        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, padding: '10px 12px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.2s, border-color 0.2s', opacity: draggedTask?.id === task.id ? 0.55 : 1 }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
                      >
                        {/* Priority + Title */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
                          <PIcon size={14} color={pm.color} style={{ flexShrink: 0, marginTop: 2 }} />
                          <p style={{ fontSize: 13, color: 'hsl(var(--foreground))', margin: 0, fontWeight: 500, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {task.title}
                          </p>
                        </div>

                        {!!task.labels?.length && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                            {task.labels.slice(0, 3).map((label) => (
                              <span key={label} style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--foreground))', background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '2px 5px' }}>
                                {label}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Due date */}
                        {task.due_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8, padding: '2px 6px', borderRadius: 4, width: 'fit-content', backgroundColor: isOverdue ? 'hsl(var(--destructive) / 0.12)' : 'hsl(var(--muted))', border: `1px solid ${isOverdue ? 'hsl(var(--destructive) / 0.3)' : 'hsl(var(--border))'}` }}>
                            <CalendarDays size={10} color={isOverdue ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'} />
                            <span style={{ fontSize: 10, fontWeight: 500, color: isOverdue ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' }}>
                              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        )}

                        {/* Footer: task id + assignee */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 10, color: 'hsl(var(--primary))', fontWeight: 600, backgroundColor: 'hsl(var(--primary) / 0.12)', padding: '2px 7px', borderRadius: 10, border: '1px solid hsl(var(--primary) / 0.25)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>
                            {task.feature_key || task.task_id || moduleInfo?.module_key}
                          </span>
                          {task.assignee ? (
                            <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, border: '1px solid hsl(var(--border))' }}>
                              {(task.assignee.first_name?.[0] || task.assignee.username?.[0] || '?').toUpperCase()}
                            </div>
                          ) : (
                            <User size={18} color="hsl(var(--muted-foreground))" />
                          )}
                        </div>
                      </article>
                    );
                  })}

                  {/* Inline Create Form */}
                  {createTarget?.status === status && (
                    <form onSubmit={createTask} style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, padding: 12, display: 'grid', gap: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: 13 }}>{createTarget.type === 'feature' ? 'Feature Task' : 'Module Task'}</strong>
                        <button type="button" onClick={() => setCreateTarget(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
                      </div>
                      {createTarget.type === 'feature' ? (
                        <div style={{ padding: 10, borderRadius: 7, background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>
                          Adding task under {createTarget.feature.feature_id}
                        </div>
                      ) : (
                        null
                      )}
                      <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" required style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, outline: 'none' }} />
                      <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Task description" rows={2} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, resize: 'vertical', outline: 'none' }} />
                      <select value={form.priority} onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13 }}>
                        {PRIORITIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <select value={form.assignee} onChange={(e) => setForm(p => ({ ...p, assignee: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13 }}>
                        <option value="">Unassigned</option>
                        {projectMembers.map((m) => <option key={m.id} value={m.id}>{getUserName(m)}</option>)}
                      </select>
                      <input type="date" value={form.due_date} onChange={(e) => setForm(p => ({ ...p, due_date: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13 }} />
                      <input type="number" min="0" step="0.25" value={form.estimate_hours} onChange={(e) => setForm(p => ({ ...p, estimate_hours: e.target.value }))} placeholder="Estimate hours" style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13 }} />
                      <input value={form.labels} onChange={(e) => setForm(p => ({ ...p, labels: e.target.value }))} placeholder="Labels, comma separated" style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13 }} />
                      {form.status === 'Blocked' && (
                        <textarea value={form.blocker_reason} onChange={(e) => setForm(p => ({ ...p, blocker_reason: e.target.value }))} placeholder="Blocker reason" rows={2} style={{ padding: 9, borderRadius: 7, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, resize: 'vertical', outline: 'none' }} />
                      )}
                      <button type="submit" disabled={saving} style={{ padding: 9, borderRadius: 7, border: 'none', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                        {saving ? 'Saving...' : 'Create'}
                      </button>
                    </form>
                  )}

                  {/* Add Button */}
                  {!createTarget && (
                    <button
                      style={{ padding: '9px 10px', borderRadius: 6, border: '2px dashed hsl(var(--border))', background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
                      onClick={() => openCreate(status)}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.color = 'hsl(var(--primary))'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                    >
                      <Plus size={14} /> Create Task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTask && (
        <ItemDetailModal
          item={selectedTask}
          onClose={closeTaskModal}
          onStatusChange={(id, newStatus) => updateTaskStatus(selectedTask, newStatus)}
          onAssigneeChange={(newAssignee) => {
            setSelectedTask(prev => prev ? { ...prev, assignee: newAssignee } : null);
          }}
          onUpdate={(patch) => {
            setSelectedTask(prev => prev ? { ...prev, ...patch } : null);
          }}
        />
      )}
    </div>
  );
}
