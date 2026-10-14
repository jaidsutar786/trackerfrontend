import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { featureService } from '../services/featureService';
import { ChevronLeft, Plus, MoreVertical, ChevronUp, ChevronsUp, Equal, ChevronDown, Pencil, Trash2 } from 'lucide-react';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', outline: 'none', boxSizing: 'border-box' };
const avatarColors = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--type-epic))'];

const COLUMNS = [
  { id: 'To Do',       name: 'To Do',       color: 'hsl(var(--muted-foreground))' },
  { id: 'In Progress', name: 'In Progress', color: 'hsl(var(--info))' },
  { id: 'Testing',     name: 'Testing',     color: 'hsl(var(--warning))' },
  { id: 'Done',        name: 'Done',        color: 'hsl(var(--success))' },
];

const PRIORITY_ICONS = {
  highest: { Icon: ChevronsUp, color: 'hsl(var(--priority-highest))' },
  high:    { Icon: ChevronUp,  color: 'hsl(var(--priority-high))' },
  medium:  { Icon: Equal,      color: 'hsl(var(--priority-medium))' },
  low:     { Icon: ChevronDown,color: 'hsl(var(--priority-low))' },
};

// Dropdown menu for task actions
function TaskMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(p => !p); }}
        style={{ padding: 3, borderRadius: 3, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, boxShadow: 'var(--shadow-lg)', minWidth: 130, overflow: 'hidden' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function FeatureDetail() {
  const { projectSlug, featureId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feature, setFeature] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);       // 'create' | 'edit' | 'delete'
  const [activeTask, setActiveTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', status: 'To Do', due_date: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const basePath = '';

  const refresh = async () => {
    const res = await featureService.getBySlug(projectSlug, featureId);
    setFeature(res.data);
    setTasks(res.data.tasks || []);
  };

  useEffect(() => {
    featureService.getBySlug(projectSlug, featureId)
      .then((res) => { setFeature(res.data); setTasks(res.data.tasks || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectSlug, featureId]);

  const openCreate = (status = 'To Do') => {
    setForm({ title: '', description: '', priority: 'medium', assignee: '', status, due_date: '' });
    setActiveTask(null);
    setModal('create');
  };

  const openEdit = (task) => {
    setActiveTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignee: task.assignee?.id || '',
      status: task.status,
      due_date: task.due_date || '',
    });
    setModal('edit');
  };

  const openDelete = (task) => {
    setActiveTask(task);
    setModal('delete');
  };

  const closeModal = () => { setModal(null); setActiveTask(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, assignee: form.assignee || null, due_date: form.due_date || null };
      if (modal === 'create') {
        await featureService.createTaskBySlug(projectSlug, featureId, payload);
      } else {
        await featureService.updateTaskBySlug(projectSlug, activeTask.task_id, payload);
      }
      await refresh();
      closeModal();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await featureService.deleteTaskBySlug(projectSlug, activeTask.task_id);
      await refresh();
      closeModal();
    } catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await featureService.updateTaskBySlug(projectSlug, task.task_id, { status: newStatus });
      await refresh();
    } catch (err) { console.error(err); }
  };

  // Members list from feature's project_members
  const members = feature?.project_members || [];

  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Loading feature...</div>;
  if (!feature) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'hsl(var(--destructive))' }}>Feature not found</div>;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <button onClick={() => navigate(`/projects/${projectSlug}/modules`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
          <ChevronLeft size={16} /> Back to Module Management
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.1)', padding: '3px 8px', borderRadius: 4 }}>{feature.feature_id}</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>{feature.status}</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 4px' }}>{feature.title}</h1>
        {feature.description && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>{feature.description}</p>}
      </div>

      {/* ── Kanban Board ── */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ display: 'flex', gap: 16, height: '100%', minWidth: 'max-content', paddingBottom: 20 }}>
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>{col.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', backgroundColor: 'hsl(var(--muted))', padding: '2px 6px', borderRadius: 10 }}>{colTasks.length}</span>
                  </div>
                  <button onClick={() => openCreate(col.id)} style={{ padding: 4, borderRadius: 4, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--primary))'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Task Cards */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '0 4px' }} className="scrollbar-thin">
                  {colTasks.map((task) => {
                    const pm = PRIORITY_ICONS[task.priority] || PRIORITY_ICONS.medium;
                    const PIcon = pm.Icon;
                    return (
                      <div key={task.id}
                        style={{ ...card, padding: 14, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                      >
                        {/* Card Top Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{task.task_id}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <PIcon size={14} color={pm.color} />
                            <TaskMenu onEdit={() => openEdit(task)} onDelete={() => openDelete(task)} />
                          </div>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px', lineHeight: 1.4 }}>{task.title}</h3>

                        {/* Description */}
                        {task.description && (
                          <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '0 0 10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {task.description}
                          </p>
                        )}

                        {/* Due Date */}
                        {task.due_date && (
                          <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
                            📅 {task.due_date}
                          </div>
                        )}

                        {/* Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid hsl(var(--border))' }}>
                          {task.assignee ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: avatarColors[task.assignee.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                                {task.assignee.username[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                                {task.assignee.first_name ? `${task.assignee.first_name} ${task.assignee.last_name}` : task.assignee.username}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>Unassigned</span>
                          )}
                          {/* Quick Status Change */}
                          <select value={task.status} onChange={(e) => handleStatusChange(task, e.target.value)} onClick={(e) => e.stopPropagation()} style={{ fontSize: 10, padding: '3px 6px', borderRadius: 4, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', cursor: 'pointer' }}>
                            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Task Button */}
                  <button onClick={() => openCreate(col.id)}
                    style={{ padding: '10px', borderRadius: 6, border: '2px dashed hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.color = 'hsl(var(--primary))'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                  >
                    <Plus size={14} /> Add Task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Create / Edit Task Modal ── */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ ...card, width: '100%', maxWidth: 500, padding: 24, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>
                {modal === 'create' ? 'Create Task' : `Edit Task — ${activeTask?.task_id}`}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Title *</label>
                <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Implement login API" required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Task details..." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="highest">Highest</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Status</label>
                  <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Testing">Testing</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Assignee</label>
                  <select value={form.assignee} onChange={(e) => setForm(p => ({ ...p, assignee: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.first_name ? `${m.first_name} ${m.last_name}` : m.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm(p => ({ ...p, due_date: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : modal === 'create' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Task Confirm Modal ── */}
      {modal === 'delete' && activeTask && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ ...card, width: 400, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'hsl(var(--destructive) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={18} color="hsl(var(--destructive))" />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Delete Task</h2>
            </div>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 6px' }}>
              Are you sure you want to delete <strong style={{ color: 'hsl(var(--foreground))' }}>{activeTask.task_id} — {activeTask.title}</strong>?
            </p>
            <p style={{ fontSize: 12, color: 'hsl(var(--destructive))', margin: '0 0 20px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--destructive))', color: '#fff', fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
