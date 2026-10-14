import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { featureService } from '../services/featureService';
import { ChevronLeft, Plus, MoreVertical, CheckCircle2, Clock, Target, Pencil, Trash2 } from 'lucide-react';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', outline: 'none', boxSizing: 'border-box' };
const avatarColors = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--type-epic))'];

const STATUS_COLORS = {
  'To Do': 'hsl(var(--muted-foreground))',
  'In Progress': 'hsl(var(--info))',
  'Done': 'hsl(var(--success))',
};
const PRIORITY_COLORS = {
  highest: 'hsl(var(--priority-highest))',
  high: 'hsl(var(--priority-high))',
  medium: 'hsl(var(--priority-medium))',
  low: 'hsl(var(--priority-low))',
};

const PROJECT_STATUS_TONE = {
  planning: 'hsl(var(--muted-foreground))',
  active: 'hsl(var(--info))',
  on_hold: 'hsl(var(--warning))',
  completed: 'hsl(var(--success))',
  cancelled: 'hsl(var(--destructive))',
};

const PROJECT_RISK_TONE = {
  low: 'hsl(var(--success))',
  medium: 'hsl(var(--info))',
  high: 'hsl(var(--warning))',
  critical: 'hsl(var(--destructive))',
};

const chipStyle = (tone) => ({
  padding: '3px 8px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  backgroundColor: `${tone}1f`,
  color: tone,
  border: `1px solid ${tone}40`,
});

// Small dropdown menu component
function ActionMenu({ onEdit, onDelete }) {
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
        style={{ padding: 6, borderRadius: 4, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, boxShadow: 'var(--shadow-lg)', minWidth: 140, overflow: 'hidden' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [features, setFeatures] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);       // 'create' | 'edit' | 'delete'
  const [activeFeature, setActiveFeature] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', status: 'To Do' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const basePath = '';

  const refresh = async () => {
    const [fRes, prRes] = await Promise.all([featureService.getAll(id), featureService.getProgress(id)]);
    setFeatures(fRes.data);
    setProgress(prRes.data);
  };

  useEffect(() => {
    Promise.all([
      projectService.getById(id),
      featureService.getAll(id),
      featureService.getProgress(id),
    ]).then(([pRes, fRes, prRes]) => {
      setProject(pRes.data);
      setFeatures(fRes.data);
      setProgress(prRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const openCreate = () => {
    setForm({ title: '', description: '', priority: 'medium', assignee: '', status: 'To Do' });
    setActiveFeature(null);
    setModal('create');
  };

  const openEdit = (f) => {
    setActiveFeature(f);
    setForm({ title: f.title, description: f.description || '', priority: f.priority, assignee: f.assignee?.id || '', status: f.status });
    setModal('edit');
  };

  const openDelete = (f) => {
    setActiveFeature(f);
    setModal('delete');
  };

  const closeModal = () => { setModal(null); setActiveFeature(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, assignee: form.assignee || null };
      if (modal === 'create') {
        await featureService.create(id, payload);
      } else {
        await featureService.update(id, activeFeature.feature_id, payload);
      }
      await refresh();
      closeModal();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await featureService.delete(id, activeFeature.feature_id);
      await refresh();
      closeModal();
    } catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Loading project...</div>;
  if (!project) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'hsl(var(--destructive))' }}>Project not found</div>;

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => navigate(`${basePath}/projects`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
          <ChevronLeft size={16} /> Back to Projects
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>{project.name}</h1>
                <span style={chipStyle(PROJECT_STATUS_TONE[project.status] || 'hsl(var(--muted-foreground))')}>{project.status_display || project.status || 'Planning'}</span>
                <span style={chipStyle(PROJECT_RISK_TONE[project.risk] || 'hsl(var(--muted-foreground))')}>{project.risk_display || project.risk || 'Low'} Risk</span>
              </div>
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{project.client?.name} • {project.project_key}</p>
            </div>
          </div>
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600 }}>
            <Plus size={16} /> Create Feature
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: Target, color: 'warning', value: project.module_count || 0, label: 'Modules' },
          { icon: Target, color: 'primary', value: progress?.feature_count || 0, label: 'Features' },
          { icon: Clock,  color: 'info',    value: progress?.total_tasks || 0,   label: 'Total Tasks' },
          { icon: CheckCircle2, color: 'success', value: `${progress?.progress || 0}%`, label: 'Completed' },
        ].map(({ icon: Icon, color, value, label }) => (
          <div key={label} style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: `hsl(var(--${color}) / 0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={`hsl(var(--${color}))`} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress Bar ── */}
      {progress?.total_tasks > 0 && (
        <div style={{ ...card, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Overall Progress</span>
            <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{progress.completed_tasks} of {progress.total_tasks} tasks completed</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, backgroundColor: 'hsl(var(--muted))', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress.progress}%`, backgroundColor: 'hsl(var(--success))', transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )}

      {/* ── Features List ── */}
      <div style={{ ...card, padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 8px' }}>Health Summary</h2>
            <p style={{ fontSize: 13, color: project.health_summary ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', margin: 0, lineHeight: 1.6 }}>{project.health_summary || 'No health summary added.'}</p>
          </div>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 8px' }}>Blockers</h2>
            <p style={{ fontSize: 13, color: project.blockers ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', margin: 0, lineHeight: 1.6 }}>{project.blockers || 'No blockers reported.'}</p>
          </div>
        </div>
        {project.milestones?.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid hsl(var(--border))' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 10px' }}>Milestones</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {project.milestones.map((milestone) => (
                <div key={milestone.id || milestone.title} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>{milestone.title}</strong>
                    <span style={chipStyle(PROJECT_STATUS_TONE[milestone.status] || 'hsl(var(--muted-foreground))')}>{milestone.status_display || milestone.status}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: '6px 0 0' }}>{milestone.due_date || 'No due date'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ ...card, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 16px' }}>Features</h2>

        {features.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>No features yet</p>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 16px' }}>Create your first feature to start organizing tasks.</p>
            <button onClick={openCreate} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Create Feature</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {features.map((f) => (
              <div key={f.id}
                onClick={() => navigate(`${basePath}/projects/${id}/features/${f.feature_id}`)}
                style={{ ...card, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.1)', padding: '2px 6px', borderRadius: 4 }}>{f.feature_id}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, backgroundColor: STATUS_COLORS[f.status] + '22', color: STATUS_COLORS[f.status] }}>{f.status}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, backgroundColor: PRIORITY_COLORS[f.priority] + '22', color: PRIORITY_COLORS[f.priority], textTransform: 'capitalize' }}>{f.priority}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 4px' }}>{f.title}</h3>
                    {f.description && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0, lineHeight: 1.5 }}>{f.description}</p>}
                  </div>
                  {/* Action Menu */}
                  <ActionMenu onEdit={() => openEdit(f)} onDelete={() => openDelete(f)} />
                </div>

                {/* Progress */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid hsl(var(--border))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                      {f.tasks?.filter(t => t.status === 'Done').length || 0} / {f.tasks?.length || 0} tasks
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{f.progress || 0}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: 'hsl(var(--muted))', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${f.progress || 0}%`, backgroundColor: 'hsl(var(--success))', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* Assignee */}
                {f.assignee && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: avatarColors[f.assignee.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                      {f.assignee.username[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                      {f.assignee.first_name ? `${f.assignee.first_name} ${f.assignee.last_name}` : f.assignee.username}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ ...card, width: '100%', maxWidth: 500, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>
                {modal === 'create' ? 'Create Feature' : 'Edit Feature'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Title *</label>
                <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. User Authentication" required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
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
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Assignee</label>
                <select value={form.assignee} onChange={(e) => setForm(p => ({ ...p, assignee: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => (
                    <option key={m.id} value={m.id}>{m.first_name ? `${m.first_name} ${m.last_name}` : m.username}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : modal === 'create' ? 'Create Feature' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {modal === 'delete' && activeFeature && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ ...card, width: 400, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'hsl(var(--destructive) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={18} color="hsl(var(--destructive))" />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Delete Feature</h2>
            </div>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 6px' }}>
              Are you sure you want to delete <strong style={{ color: 'hsl(var(--foreground))' }}>{activeFeature.feature_id} — {activeFeature.title}</strong>?
            </p>
            <p style={{ fontSize: 12, color: 'hsl(var(--destructive))', margin: '0 0 20px' }}>
              This will also delete all tasks inside this feature. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--destructive))', color: '#fff', fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Delete Feature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
