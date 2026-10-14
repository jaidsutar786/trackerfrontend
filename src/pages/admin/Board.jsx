import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workItemService } from '../../services/workItemService';
import { issueService } from '../../services/issueService';
import API from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import ItemDetailModal from '../../components/ItemDetailModal';
import { getDisplayName, getInitials } from '../../utils/userUtils';
import { Bug, CheckSquare, Zap, ChevronsUp, ChevronUp, Equal, ChevronDown, Calendar, UserCircle, Table2, KanbanSquare, Check, MessageCircle } from 'lucide-react';

const TYPE_CONFIG = {
  bug:   { Icon: Bug,         color: 'hsl(var(--type-bug))',   bg: 'hsl(var(--type-bug) / 0.12)' },
  task:  { Icon: CheckSquare, color: 'hsl(var(--type-task))',  bg: 'hsl(var(--type-task) / 0.12)' },
  story: { Icon: Zap,         color: 'hsl(var(--type-story))', bg: 'hsl(var(--type-story) / 0.12)' },
};

const PRIORITY_CONFIG = {
  highest: { Icon: ChevronsUp, color: 'hsl(var(--priority-highest))' },
  high:    { Icon: ChevronUp,  color: 'hsl(var(--priority-high))' },
  medium:  { Icon: Equal,      color: 'hsl(var(--priority-medium))' },
  low:     { Icon: ChevronDown,color: 'hsl(var(--priority-low))' },
  lowest:  { Icon: ChevronDown,color: 'hsl(var(--priority-lowest, var(--priority-low)))' },
};

const ISSUE_COLUMNS = [
  { id: 'To Do',       name: 'To Do',       accent: 'hsl(var(--muted-foreground))' },
  { id: 'In Progress', name: 'In Progress', accent: 'hsl(var(--info))' },
  { id: 'Testing',   name: 'Testing',   accent: 'hsl(var(--warning))' },
  { id: 'Done',        name: 'Done',        accent: 'hsl(var(--success))' },
];

const TASK_COLUMNS = [
  { id: 'To Do',       name: 'To Do',       accent: 'hsl(var(--muted-foreground))' },
  { id: 'In Progress', name: 'In Progress', accent: 'hsl(var(--info))' },
  { id: 'Testing',     name: 'Testing',     accent: 'hsl(var(--warning))' },
  { id: 'Done',        name: 'Done',        accent: 'hsl(var(--success))' },
];

export default function AdminBoard() {
  const { user } = useAuth();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [activeTab, setActiveTab] = useState('issues');
  const [viewMode, setViewMode] = useState('board');
  const [statusMenu, setStatusMenu] = useState(null);
  const [assigneeDropdown, setAssigneeDropdown] = useState(null); // Track which card's assignee dropdown is open
  const [projectMembers, setProjectMembers] = useState([]); // Store project members for assignee dropdown
  const dragId = useRef(null);
  const { addNotification } = useNotifications();
  const { onDataUpdate } = useNotifications();

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        workItemService.getMyWorkItems(user),
        API.get('/auth/users/').then((res) => res.data)
      ])
        .then(([workItemsRes, usersRes]) => {
          setAllItems(workItemsRes.data);
          setProjectMembers(Array.isArray(usersRes) ? usersRes : usersRes.results || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Real-time refresh via WebSocket
  useEffect(() => {
    if (!user?.id) return;

    const handleBoardUpdate = (event) => {
      const data = event.detail;
      console.log('🔄 Admin Board update received:', data);
      
      // Refresh board data when relevant updates occur
      if (data.type === 'issue_updated' || 
          data.type === 'task_updated' || 
          data.type === 'status_changed' ||
          data.type === 'assignee_changed') {
        workItemService.getMyWorkItems(user)
          .then((res) => {
            setAllItems(res.data);
            setSelectedItem(prev => prev ? (res.data.find(i => i.uniqueId === prev.uniqueId) || prev) : null);
          })
          .catch(() => {});
      }
    };

    window.addEventListener('dashboardUpdate', handleBoardUpdate);
    
    // Legacy notification context (keeping for backward compatibility)
    const unsub = onDataUpdate((event) => {
      if (event.entity === 'issue' || event.entity === 'task' || event.entity === 'subtask') {
        workItemService.getMyWorkItems(user).then((res) => {
          setAllItems(res.data);
          setSelectedItem(prev => prev ? (res.data.find(i => i.uniqueId === prev.uniqueId) || prev) : null);
        }).catch(() => {});
      }
    });
    
    return () => {
      window.removeEventListener('dashboardUpdate', handleBoardUpdate);
      unsub();
    };
  }, [user?.id]);

  // Close assignee dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assigneeDropdown && !event.target.closest('[data-assignee-dropdown]')) {
        setAssigneeDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [assigneeDropdown]);

  useEffect(() => {
    if (!statusMenu) return;
    const close = () => setStatusMenu(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('mousedown', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('mousedown', close);
    };
  }, [statusMenu]);

  const issues = allItems.filter(item => item.itemType === 'issue');
  const tasks = allItems.filter(item => item.itemType === 'task' || item.itemType === 'subtask');
  const currentItems = activeTab === 'issues' ? issues : tasks;
  const currentColumns = activeTab === 'issues' ? ISSUE_COLUMNS : TASK_COLUMNS;

  const handleDrop = (colId) => {
    if (dragId.current) {
      const item = currentItems.find((i) => i.uniqueId === dragId.current);
      if (item && item.status !== colId) handleStatusChange(item.id, colId, item.itemType);
    }
    setDragOver(null);
    dragId.current = null;
  };

  const handleStatusChange = async (itemId, newStatus, itemType) => {
    const item = allItems.find((i) => i.id === itemId && i.itemType === itemType);
    if (!item) return;

    setAllItems((prev) => prev.map((i) =>
      i.id === itemId && i.itemType === itemType ? { ...i, status: newStatus } : i
    ));

    addNotification({
      title: 'Status Updated',
      message: `"${item.title}" moved to ${newStatus}`,
      icon: '🔄',
      type: 'direct',
    });

    try {
      // Backend will trigger WebSocket events automatically
      await workItemService.updateStatus(itemId, newStatus, itemType);
    } catch (error) {
      console.error('API Error:', error);
      if (user?.id) {
        workItemService.getMyWorkItems(user).then((res) => setAllItems(res.data)).catch(() => {});
      }
    }
  };

  const handleAssigneeChange = async (itemId, itemType, newAssigneeId) => {
    const item = allItems.find((i) => i.id === itemId && i.itemType === itemType);
    if (!item) return;

    const newAssignee = projectMembers.find(m => m.id === parseInt(newAssigneeId)) || null;
    
    // Update local state immediately
    setAllItems((prev) => prev.map((i) =>
      i.id === itemId && i.itemType === itemType ? { ...i, assignee: newAssignee } : i
    ));

    // Close dropdown
    setAssigneeDropdown(null);

    addNotification({
      title: 'Assignee Updated',
      message: `"${item.title}" assigned to ${newAssignee ? getDisplayName(newAssignee) : 'Unassigned'}`,
      icon: '👤',
      type: 'direct',
    });

    try {
      if (itemType === 'task') {
        // For tasks, we need to use the task update endpoint
        const tasksRes = await workItemService.getMyWorkItems(user);
        const taskData = tasksRes.data.find(t => t.uniqueId === `task-${itemId}`);
        if (taskData) {
          await API.patch(`/projects/${taskData.project}/tasks/${taskData.task_id}/`, { assignee: newAssigneeId || null });
        }
      } else {
        // For issues, use issueService
        await issueService.update(itemId, { assignee: newAssigneeId || null });
      }
    } catch (error) {
      console.error('API Error:', error);
      // Revert on error
      if (user?.id) {
        workItemService.getMyWorkItems(user).then((res) => setAllItems(res.data)).catch(() => {});
      }
    }
  };

  const byStatus = (status) => currentItems.filter((i) => i.status === status);

  const openStatusMenu = (event, item) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setStatusMenu({
      item,
      top: rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 150),
      width: Math.max(rect.width, 130),
    });
  };

  const openItem = async (item) => {
    try {
      if (item.itemType === 'task') {
        const tasksRes = await workItemService.getMyWorkItems(user);
        const taskData = tasksRes.data.find(t => t.uniqueId === item.uniqueId);
        setSelectedItem(taskData || item);
      } else if (item.itemType === 'subtask') {
        // For subtasks, use the data we already have from MyTasksView
        // No need to refetch as subtasks are already fully loaded
        setSelectedItem(item);
      } else {
        // For issues, fetch from issue endpoint
        const res = await issueService.getById(item.id);
        const fresh = { ...res.data, itemType: 'issue', uniqueId: item.uniqueId };
        setAllItems(prev => prev.map(i => i.uniqueId === item.uniqueId ? fresh : i));
        setSelectedItem(fresh);
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
      setSelectedItem(item);
    }
  };

  const tabStyle = (tab) => ({
    padding: '8px 16px',
    border: 'none',
    background: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    borderBottom: activeTab === tab ? '2px solid hsl(var(--primary))' : '2px solid transparent',
    color: activeTab === tab ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
    transition: 'all 0.2s',
  });

  return (
    <div className="responsive-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <div className="responsive-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Board</h1>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
              {viewMode === 'board' ? 'Kanban' : 'Table'} view — {allItems.length} total items
            </p>
          </div>
          <button
            type="button"
            onClick={() => setViewMode((mode) => mode === 'board' ? 'table' : 'board')}
            title={viewMode === 'board' ? 'Switch to table view' : 'Switch to board view'}
            style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {viewMode === 'board' ? <Table2 size={16} /> : <KanbanSquare size={16} />}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, borderBottom: '1px solid hsl(var(--border))' }}>
          <button onClick={() => setActiveTab('issues')} style={tabStyle('issues')}>
            Issues ({issues.length})
          </button>
          <button onClick={() => setActiveTab('tasks')} style={tabStyle('tasks')}>
            Tasks ({tasks.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>
          Loading board...
        </div>
      ) : viewMode === 'table' ? (
        <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', minHeight: 0, flex: 1 }}>
          {currentItems.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>No {activeTab}</div>
          ) : (
            <div style={{ overflow: 'auto', height: '100%' }} className="scrollbar-thin responsive-table-wrap">
              <table style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'hsl(var(--card))' }}>
                  <tr>
                    {['Type', 'Project', 'Summary', 'Description', 'Priority', 'Status', 'Assignee', 'Updated'].map((heading, index) => (
                      <th key={heading} style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: index === 7 ? 'none' : '1px solid hsl(var(--border))', width: heading === 'Type' ? 44 : heading === 'Project' ? 130 : heading === 'Summary' ? 220 : heading === 'Priority' || heading === 'Status' ? 120 : heading === 'Assignee' ? 140 : heading === 'Updated' ? 100 : 'auto' }}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item) => {
                    const typeKey = item.issue_type || item.itemType || 'task';
                    const tc = TYPE_CONFIG[typeKey] || TYPE_CONFIG.task;
                    const pc = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                    const sc = currentColumns.find((column) => column.id === item.status) || currentColumns[0];
                    const TIcon = tc.Icon;
                    const PIcon = pc.Icon;
                    const updated = item.updated_at ? new Date(item.updated_at) : null;
                    return (
                      <tr
                        key={item.uniqueId}
                        onClick={() => openItem(item)}
                        style={{ borderBottom: '1px solid hsl(var(--border))', cursor: 'pointer', backgroundColor: 'hsl(var(--card))', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--card))'}
                      >
                        <td style={{ padding: '6px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                          <span style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TIcon size={13} /></span>
                        </td>
                        <td style={{ padding: '6px 10px', borderRight: '1px solid hsl(var(--border))', fontSize: 12, fontWeight: 500 }}>{item.project_name || '—'}</td>
                        <td style={{ padding: '6px 10px', borderRight: '1px solid hsl(var(--border))', maxWidth: 240 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.title}</span>
                            {item.comments && item.comments.length > 0 && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, padding: '2px 6px', borderRadius: 3, backgroundColor: 'hsl(var(--info) / 0.12)', color: 'hsl(var(--info))', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                <MessageCircle size={10} />
                                {item.comments.length}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '6px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description || 'No description provided'}</span>
                        </td>
                        <td style={{ padding: '6px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: pc.color }}>
                            <PIcon size={14} />
                            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{item.priority || 'medium'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '6px 10px', borderRight: '1px solid hsl(var(--border))' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => openStatusMenu(e, item)}
                            style={{ padding: '4px 8px', borderRadius: 4, border: 'none', backgroundColor: 'hsl(var(--muted))', color: sc.accent, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            {item.status}
                            <ChevronDown size={12} />
                          </button>
                        </td>
                        <td style={{ padding: '6px 10px', borderRight: '1px solid hsl(var(--border))', fontSize: 12 }}>
                          {item.assignee ? getDisplayName(item.assignee) : <span style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>Unassigned</span>}
                        </td>
                        <td style={{ padding: '6px 10px', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                          {updated ? updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', flex: 1, paddingBottom: 16 }} className="scrollbar-thin responsive-board-scroll">
          {currentColumns.map((col) => {
            const colItems = byStatus(col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(col.id)}
                style={{ flex: '1 1 240px', minWidth: 220, backgroundColor: dragOver === col.id ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--column-bg))', borderRadius: 8, display: 'flex', flexDirection: 'column', flexShrink: 0, border: dragOver === col.id ? '2px dashed hsl(var(--primary))' : '2px solid transparent', transition: 'all 0.15s' }}
              >
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', flex: 1 }}>{col.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 10, backgroundColor: 'hsl(var(--background) / 0.7)', color: 'hsl(var(--muted-foreground))' }}>
                    {colItems.length}
                  </span>
                </div>

                <div style={{ flex: 1, padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }} className="scrollbar-thin">
                  {colItems.length === 0 ? (
                    <div style={{ padding: '24px 8px', textAlign: 'center', border: '2px dashed hsl(var(--border))', borderRadius: 6, margin: '4px 0' }}>
                      <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No {activeTab}</p>
                    </div>
                  ) : (
                    colItems.map((item) => (
                      <article
                        key={item.uniqueId}
                        draggable
                        onDragStart={() => { dragId.current = item.uniqueId; }}
                        onDragEnd={() => { dragId.current = null; setDragOver(null); }}
        onClick={async () => {
                          try {
                            if (item.itemType === 'task') {
                              // For tasks, fetch from tasks endpoint
                              const tasksRes = await workItemService.getMyWorkItems(user);
                              const taskData = tasksRes.data.find(t => t.uniqueId === item.uniqueId);
                              if (taskData) {
                                setSelectedItem(taskData);
                              } else {
                                setSelectedItem(item);
                              }
                            } else if (item.itemType === 'subtask') {
                              // For subtasks, use the data we already have
                              setSelectedItem(item);
                            } else {
                              // For issues, use issueService
                              const res = await issueService.getById(item.id);
                              const fresh = { ...res.data, itemType: 'issue', uniqueId: item.uniqueId };
                              setAllItems(prev => prev.map(i => i.uniqueId === item.uniqueId ? fresh : i));
                              setSelectedItem(fresh);
                            }
                          } catch (error) {
                            console.error('Error fetching item details:', error);
                            setSelectedItem(item);
                          }
                        }}
                        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, padding: '10px 12px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.2s, border-color 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
                      >
                        {/* Top row: priority icon + title */}
                        {(() => {
                          const typeKey = item.issue_type || item.itemType || 'task';
                          const tc = TYPE_CONFIG[typeKey] || TYPE_CONFIG.task;
                          const pc = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                          const PIcon = pc.Icon;
                          const TIcon = tc.Icon;
                          const isOverdue = item.due_date && new Date(item.due_date) < new Date();
                          return (
                            <>
                              {/* Title row */}
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
                                <PIcon size={14} color={pc.color} style={{ flexShrink: 0, marginTop: 2 }} />
                                <p style={{ fontSize: 13, color: 'hsl(var(--foreground))', margin: 0, fontWeight: 500, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {item.title}
                                </p>
                              </div>

                              {/* Due date */}
                              {item.due_date && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8, padding: '2px 6px', borderRadius: 4, width: 'fit-content', backgroundColor: isOverdue ? 'hsl(var(--destructive) / 0.12)' : 'hsl(var(--muted))', border: `1px solid ${isOverdue ? 'hsl(var(--destructive) / 0.3)' : 'hsl(var(--border))'}` }}>
                                  <Calendar size={10} color={isOverdue ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'} />
                                  <span style={{ fontSize: 10, fontWeight: 500, color: isOverdue ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' }}>
                                    {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              )}

                              {/* Created date */}
                              {item.created_at && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8, padding: '2px 6px', borderRadius: 4, width: 'fit-content', backgroundColor: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border))' }}>
                                  <Calendar size={10} color="hsl(var(--muted-foreground))" />
                                  <span style={{ fontSize: 10, fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
                                    Created {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              )}

                              {/* Comments count badge */}
                              {item.comments && item.comments.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8, padding: '2px 6px', borderRadius: 4, width: 'fit-content', backgroundColor: 'hsl(var(--info) / 0.12)', border: '1px solid hsl(var(--info) / 0.3)' }}>
                                  <MessageCircle size={10} color="hsl(var(--info))" />
                                  <span style={{ fontSize: 10, fontWeight: 500, color: 'hsl(var(--info))' }}>
                                    {item.comments.length} comment{item.comments.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}

                              {/* Footer: type icon + id + assignee */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <TIcon size={12} color={tc.color} />
                                  <span style={{ fontSize: 10, color: 'hsl(var(--primary))', fontWeight: 600, backgroundColor: 'hsl(var(--primary) / 0.12)', padding: '2px 7px', borderRadius: 10, border: '1px solid hsl(var(--primary) / 0.25)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>
                                    {item.project_name || 'No Project'}
                                  </span>
                                </div>
                                
                                {/* Assignee with dropdown */}
                                <div style={{ position: 'relative' }} data-assignee-dropdown>
                                  {item.assignee ? (
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAssigneeDropdown(assigneeDropdown === item.uniqueId ? null : item.uniqueId);
                                      }}
                                      style={{ 
                                        width: 22, height: 22, borderRadius: '50%', 
                                        backgroundColor: 'hsl(var(--primary))', color: 'white', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                        fontSize: 9, fontWeight: 700, 
                                        border: '1px solid hsl(var(--border))',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                      }}
                                    >
                                      {item.assignee.first_name ? getInitials(item.assignee) : getInitials(item.assignee)}
                                    </div>
                                  ) : (
                                    <UserCircle 
                                      size={20} 
                                      color="hsl(var(--muted-foreground))" 
                                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAssigneeDropdown(assigneeDropdown === item.uniqueId ? null : item.uniqueId);
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = 'hsl(var(--primary))';
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
                                        e.currentTarget.style.transform = 'scale(1)';
                                      }}
                                    />
                                  )}
                                  
                                  {/* Assignee Dropdown */}
                                  {assigneeDropdown === item.uniqueId && (
                                    <div 
                                      style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: 6,
                                        zIndex: 1000,
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 8,
                                        boxShadow: 'var(--shadow-lg)',
                                        minWidth: 200,
                                        fontSize: 12,
                                        overflow: 'hidden'
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* Unassigned */}
                                      <div 
                                        onClick={() => handleAssigneeChange(item.id, item.itemType, null)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 8,
                                          padding: '8px 12px',
                                          cursor: 'pointer',
                                          color: 'hsl(var(--foreground))',
                                          backgroundColor: !item.assignee ? 'hsl(var(--accent))' : 'transparent',
                                          borderBottom: '1px solid hsl(var(--border))'
                                        }}
                                        onMouseEnter={(e) => { if (item.assignee) e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; }}
                                        onMouseLeave={(e) => { if (item.assignee) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                      >
                                        <UserCircle size={16} color="hsl(var(--muted-foreground))" />
                                        <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>Unassigned</span>
                                      </div>

                                      {/* Team Members */}
                                      {projectMembers
                                        .filter(member => member.role !== 'client')
                                        .slice(0, 5)
                                        .map((member) => {
                                        const isCurrentUser = member.id === user?.id;
                                        const isAssigned = item.assignee?.id === member.id;
                                        const initials = getInitials(member);
                                        const avatarColors = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--type-epic))', 'hsl(var(--type-bug))'];
                                        const bgColor = avatarColors[member.id % avatarColors.length];
                                        return (
                                          <div 
                                            key={member.id}
                                            onClick={() => handleAssigneeChange(item.id, item.itemType, member.id)}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 8,
                                              padding: '8px 12px',
                                              cursor: 'pointer',
                                              backgroundColor: isAssigned ? 'hsl(var(--accent))' : 'transparent'
                                            }}
                                            onMouseEnter={(e) => { if (!isAssigned) e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; }}
                                            onMouseLeave={(e) => { if (!isAssigned) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                          >
                                            <div style={{
                                              width: 22, height: 22, borderRadius: '50%',
                                              backgroundColor: bgColor,
                                              color: 'hsl(var(--primary-foreground))',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              fontSize: 9, fontWeight: 700, flexShrink: 0
                                            }}>
                                              {initials}
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                              <div style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {getDisplayName(member)}
                                                {isCurrentUser && <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}> (me)</span>}
                                              </div>
                                            </div>
                                            {isAssigned && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', flexShrink: 0 }} />}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {statusMenu && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: statusMenu.top,
            left: statusMenu.left,
            width: statusMenu.width,
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 6,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 3000,
            overflow: 'hidden',
          }}
        >
          {(statusMenu.item.itemType === 'issue' ? ISSUE_COLUMNS : TASK_COLUMNS).map((column) => {
            const active = statusMenu.item.status === column.id;
            return (
              <button
                key={column.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(statusMenu.item.id, column.id, statusMenu.item.itemType);
                  setStatusMenu(null);
                }}
                style={{ width: '100%', padding: '8px 10px', border: 'none', backgroundColor: active ? 'hsl(var(--muted))' : 'transparent', color: active ? column.accent : 'hsl(var(--foreground))', fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'hsl(var(--accent))'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {column.name}
                {active && <Check size={12} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStatusChange={(id, newStatus, itemType) => {
            handleStatusChange(id, newStatus, itemType);
            setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null);
          }}
          onAssigneeChange={(newAssignee) => {
            setAllItems(prev => prev.map(i =>
              i.id === selectedItem.id && i.itemType === selectedItem.itemType
                ? { ...i, assignee: newAssignee }
                : i
            ));
            setSelectedItem(prev => prev ? { ...prev, assignee: newAssignee } : null);
          }}
          onUpdate={(patch) => {
            setAllItems(prev => prev.map(i =>
              i.id === selectedItem.id && i.itemType === selectedItem.itemType
                ? { ...i, ...patch }
                : i
            ));
            setSelectedItem(prev => prev ? { ...prev, ...patch } : null);
          }}
        />
      )}
    </div>
  );
}
