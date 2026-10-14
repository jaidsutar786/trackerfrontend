import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, updateProject, deleteProject } from '../../services/projectService';
import { userService } from '../../services/userService';
import { clientService } from '../../services/clientService';
import { X, Folder, Users, Calendar, Key, AlignLeft, AlertTriangle, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import ExpandableText from '../../components/ExpandableText';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', outline: 'none', boxSizing: 'border-box' };
const avatarColors = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--type-epic))', 'hsl(var(--type-bug))'];

const PROJECT_ROLES = [
  { value: 'manager',   label: 'Manager',   color: 'hsl(var(--type-epic))' },
  { value: 'lead',      label: 'Lead',      color: 'hsl(var(--primary))' },
  { value: 'developer', label: 'Developer', color: 'hsl(var(--info))' },
  { value: 'tester',    label: 'Tester',    color: 'hsl(var(--success))' },
  { value: 'devops',    label: 'DevOps',    color: 'hsl(var(--warning))' },
];

const PROJECT_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PROJECT_RISK_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const badgeStyle = (tone) => ({
  padding: '3px 8px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  backgroundColor: `${tone}1f`,
  color: tone,
  border: `1px solid ${tone}40`,
  whiteSpace: 'nowrap',
});

const projectStatusTone = {
  planning: 'hsl(var(--muted-foreground))',
  active: 'hsl(var(--info))',
  on_hold: 'hsl(var(--warning))',
  completed: 'hsl(var(--success))',
  cancelled: 'hsl(var(--destructive))',
};

const projectRiskTone = {
  low: 'hsl(var(--success))',
  medium: 'hsl(var(--info))',
  high: 'hsl(var(--warning))',
  critical: 'hsl(var(--destructive))',
};

const ROLE_USER_MAP = {
  manager:   ['manager'],
  lead:      ['manager', 'fullstack_developer'],
  developer: ['frontend_developer', 'backend_developer', 'fullstack_developer'],
  tester:    ['qa_tester'],
  devops:    ['devops'],
};

const emptyForm = {
  client: '',
  name: '',
  description: '',
  project_key: '',
  status: 'planning',
  risk: 'low',
  health_summary: '',
  blockers: '',
  start_date: '',
  end_date: '',
  team: [],
  milestones: [],
};

// Auto-generate project key from name
const generateKey = (name) => name.toUpperCase().split(' ').map(w => w[0]).join('').slice(0, 6);

export function CreateProjectModal({ onClose, onCreated }) {
  const [clients, setClients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([userService.getAll(), clientService.getAll()]).then(([uRes, cRes]) => {
      setAllUsers(uRes.data.filter((u) => u.role !== 'admin' && u.role !== 'client'));
      setClients(cRes.data);
    }).catch(() => {});
  }, []);

  const addTeamMember = () => setForm((p) => ({ ...p, team: [...p.team, { user_id: '', project_role: 'developer' }] }));
  const removeTeamMember = (idx) => setForm((p) => ({ ...p, team: p.team.filter((_, i) => i !== idx) }));
  const addMilestone = () => setForm((p) => ({ ...p, milestones: [...p.milestones, { title: '', due_date: '', status: 'planned', notes: '' }] }));
  const removeMilestone = (idx) => setForm((p) => ({ ...p, milestones: p.milestones.filter((_, i) => i !== idx) }));
  const updateMilestone = (idx, field, value) => {
    setForm((p) => ({
      ...p,
      milestones: p.milestones.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };
  const updateTeamMember = (idx, field, value) => {
    setForm((p) => ({
      ...p,
      team: p.team.map((m, i) => {
        if (i !== idx) return m;
        const updated = { ...m, [field]: value };
        if (field === 'project_role') updated.user_id = '';
        return updated;
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client || !form.name.trim()) return;
    const userIds = form.team.map((m) => m.user_id).filter(Boolean);
    if (new Set(userIds).size !== userIds.length) {
      setError('Same user cannot be assigned multiple roles in one project.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createProject({ ...form });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="responsive-modal-card" style={{ ...card, width: '100%', maxWidth: 900, maxHeight: '85vh', overflowY: 'auto', padding: '20px 24px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Create Project</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 18 }}>✕</button>
        </div>

        {error && <p style={{ fontSize: 12, color: 'hsl(var(--destructive))', marginBottom: 12, padding: '8px 12px', backgroundColor: 'hsl(var(--destructive) / 0.08)', borderRadius: 6, border: '1px solid hsl(var(--destructive) / 0.2)' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Client *</label>
              <select value={form.client} onChange={(e) => setForm((p) => ({ ...p, client: parseInt(e.target.value) }))} required style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select client...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Project Name *</label>
              <input value={form.name} onChange={(e) => {
                const name = e.target.value;
                setForm((p) => ({ ...p, name, project_key: p.project_key || generateKey(name) }));
              }} placeholder="e.g. Solar Plant Management" required style={inputStyle} />
            </div>
          </div>

          <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Project Key *</label>
              <input value={form.project_key} onChange={(e) => setForm((p) => ({ ...p, project_key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) }))} placeholder="e.g. SPM" required style={{ ...inputStyle, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }} />
              <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', margin: '3px 0 0' }}>Max 6 chars · SPM-1, SPM-2...</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description..." rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Status</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {PROJECT_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Risk</label>
              <select value={form.risk} onChange={(e) => setForm((p) => ({ ...p, risk: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {PROJECT_RISK_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Health Summary</label>
              <textarea value={form.health_summary} onChange={(e) => setForm((p) => ({ ...p, health_summary: e.target.value }))} rows={2} placeholder="Delivery health snapshot..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Blockers</label>
              <textarea value={form.blockers} onChange={(e) => setForm((p) => ({ ...p, blockers: e.target.value }))} rows={2} placeholder="Known delivery blockers..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Milestones ({form.milestones.length})</label>
              <button type="button" onClick={addMilestone} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Add Milestone</button>
            </div>
            {form.milestones.map((milestone, idx) => (
              <div key={idx} className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 130px 130px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input value={milestone.title} onChange={(e) => updateMilestone(idx, 'title', e.target.value)} placeholder="Milestone title" style={inputStyle} />
                <input type="date" value={milestone.due_date} onChange={(e) => updateMilestone(idx, 'due_date', e.target.value)} style={inputStyle} />
                <select value={milestone.status} onChange={(e) => updateMilestone(idx, 'status', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
                <button type="button" onClick={() => removeMilestone(idx)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid hsl(var(--destructive) / 0.35)', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', cursor: 'pointer' }}>Remove</button>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Team Members ({form.team.length})</label>
              <button type="button" onClick={addTeamMember} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: '1px solid hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Role
              </button>
            </div>
            {form.team.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', border: '2px dashed hsl(var(--border))', borderRadius: 8, backgroundColor: 'hsl(var(--muted))' }}>
                <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No team members yet. Click "Add Role" to assign people.</p>
              </div>
            ) : (
              <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {form.team.map((member, idx) => {
                  const roleObj = PROJECT_ROLES.find((r) => r.value === member.project_role);
                  const allowedRoles = ROLE_USER_MAP[member.project_role] || [];
                  const filteredUsers = allUsers.filter((u) => allowedRoles.includes(u.role));
                  const selectedUser = allUsers.find((u) => u.id === member.user_id);
                  return (
                    <div key={idx} style={{ padding: '10px 12px', backgroundColor: 'hsl(var(--muted))', borderRadius: 8, border: '1px solid hsl(var(--border))' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Role</label>
                          <select value={member.project_role} onChange={(e) => updateTeamMember(idx, 'project_role', e.target.value)} style={{ ...inputStyle, cursor: 'pointer', padding: '5px 8px' }}>
                            {PROJECT_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1.5 }}>
                          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assign To</label>
                          <select value={member.user_id} onChange={(e) => updateTeamMember(idx, 'user_id', parseInt(e.target.value))} style={{ ...inputStyle, cursor: 'pointer', padding: '5px 8px' }}>
                            <option value="">{filteredUsers.length === 0 ? 'No users for this role' : 'Select person...'}</option>
                            {filteredUsers.map((u) => <option key={u.id} value={u.id}>{u.first_name ? `${u.first_name} ${u.last_name}` : u.username}</option>)}
                          </select>
                        </div>
                        <button type="button" onClick={() => removeTeamMember(idx)} style={{ marginTop: 16, padding: '5px 7px', borderRadius: 5, border: '1px solid hsl(var(--destructive) / 0.4)', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                      {selectedUser && (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: avatarColors[selectedUser.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
                            {(selectedUser.first_name || selectedUser.username)[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: 11, color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                            {selectedUser.first_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : selectedUser.username}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, backgroundColor: (roleObj?.color || 'hsl(var(--muted))') + '22', color: roleObj?.color || 'hsl(var(--muted-foreground))' }}>
                            {roleObj?.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="responsive-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const fetchProjects = () => getProjects().then((r) => setProjects(r.data)).catch(() => {});

  useEffect(() => {
    Promise.all([getProjects(), userService.getAll(), clientService.getAll()]).then(([pRes, uRes, cRes]) => {
      setProjects(pRes.data);
      // Filter out only admin and client roles, include all position-based roles
      setAllUsers(uRes.data.filter((u) => u.role !== 'admin' && u.role !== 'client'));
      setClients(cRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setError('');
    setModal('create');
  };

  const openEdit = (project) => {
    setEditTarget(project);
    setForm({
      client: project.client.id,
      name: project.name,
      description: project.description,
      project_key: project.project_key || '',
      status: project.status || 'planning',
      risk: project.risk || 'low',
      health_summary: project.health_summary || '',
      blockers: project.blockers || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      team: project.team_members.map((m) => ({
        user_id: m.user.id,
        project_role: m.project_role,
      })),
      milestones: (project.milestones || []).map((m) => ({
        title: m.title || '',
        due_date: m.due_date || '',
        status: m.status || 'planned',
        notes: m.notes || '',
      })),
    });
    setError('');
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditTarget(null); setForm(emptyForm); setError(''); };

  const addTeamMember = () => {
    setForm((p) => ({ ...p, team: [...p.team, { user_id: '', project_role: 'developer' }] }));
  };

  const addMilestone = () => {
    setForm((p) => ({ ...p, milestones: [...p.milestones, { title: '', due_date: '', status: 'planned', notes: '' }] }));
  };

  const removeMilestone = (idx) => {
    setForm((p) => ({ ...p, milestones: p.milestones.filter((_, i) => i !== idx) }));
  };

  const updateMilestone = (idx, field, value) => {
    setForm((p) => ({
      ...p,
      milestones: p.milestones.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const removeTeamMember = (idx) => {
    setForm((p) => ({ ...p, team: p.team.filter((_, i) => i !== idx) }));
  };

  const updateTeamMember = (idx, field, value) => {
    setForm((p) => ({
      ...p,
      team: p.team.map((m, i) => {
        if (i !== idx) return m;
        const updated = { ...m, [field]: value };
        if (field === 'project_role') updated.user_id = '';
        return updated;
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client || !form.name.trim()) return;
    
    // Validation: check duplicate users
    const userIds = form.team.map((m) => m.user_id).filter(Boolean);
    if (new Set(userIds).size !== userIds.length) {
      setError('Same user cannot be assigned multiple roles in one project.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (modal === 'create') {
        await createProject(payload);
      } else {
        await updateProject(editTarget.id, payload);
      }
      await fetchProjects();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(deleteId);
      setProjects((p) => p.filter((x) => x.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const [expandedRows, setExpandedRows] = useState({});
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => { setDescExpanded(false); }, [selectedProject?.id]);

  const getRoleColor = (role) => PROJECT_ROLES.find((r) => r.value === role)?.color || 'hsl(var(--muted-foreground))';
  const getRoleLabel = (role) => PROJECT_ROLES.find((r) => r.value === role)?.label || role;

  const toggleRow = (id) => setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
  };

  const filteredProjects = projects.filter((project) => (
    (!statusFilter || project.status === statusFilter) &&
    (!riskFilter || project.risk === riskFilter)
  ));

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortCol === 'team') {
      const av = a.team_members?.length || 0;
      const bv = b.team_members?.length || 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    }
    const vals = { name: [a.name, b.name], client: [a.client?.name||'', b.client?.name||''], key: [a.project_key||'', b.project_key||''], status: [a.status||'', b.status||''], risk: [a.risk||'', b.risk||''], start: [a.start_date||'', b.start_date||''], end: [a.end_date||'', b.end_date||''] };
    const [av, bv] = vals[sortCol] || [a.name, b.name];
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const SortIcon = ({ col }) => {
    if (sortCol === col && sortDir === 'asc') return <ArrowUp size={13} style={{ marginLeft: 3, color: 'hsl(var(--primary))', flexShrink: 0 }} />;
    if (sortCol === col && sortDir === 'desc') return <ArrowDown size={13} style={{ marginLeft: 3, color: 'hsl(var(--primary))', flexShrink: 0 }} />;
    return <ChevronsUpDown size={13} style={{ marginLeft: 3, color: 'hsl(var(--muted-foreground))', opacity: 0.5, flexShrink: 0 }} />;
  };

  return (
    <div className="responsive-page" style={{ width: '100%', maxWidth: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="responsive-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Projects</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            {loading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Project
        </button>
      </div>

      {/* Projects Table */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div style={{ ...card, padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>No projects yet</p>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 16px' }}>Create your first project to get started.</p>
          <button onClick={openCreate} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Create Project</button>
        </div>
      ) : (
        <>
        <div style={{ ...card, padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
            Showing <strong style={{ color: 'hsl(var(--foreground))' }}>{sortedProjects.length}</strong> of {projects.length} projects
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 150, cursor: 'pointer' }}>
              <option value="">All Statuses</option>
              {PROJECT_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ ...inputStyle, width: 130, cursor: 'pointer' }}>
              <option value="">All Risks</option>
              {PROJECT_RISK_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <div className="responsive-table-wrap" style={{ ...card, overflow: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid hsl(var(--border))' }}>
                {[['','NAME',200],['','KEY',80],['','CLIENT',120],['','HEALTH',180],['status','STATUS',105],['risk','RISK',90],['start','START DATE',110],['end','END DATE',110],['','TEAM',80],['','ACTIONS',120]].map(([col, label, w]) => (
                  <th key={label} onClick={col ? () => handleSort(col) : undefined}
                    style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: sortCol === col ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', letterSpacing: '0.5px', cursor: col ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', width: w || undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {label}{col && <SortIcon col={col} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((p) => {
                const isExpanded = !!expandedRows[p.id];
                const members = p.team_members || [];
                return (
                  <>
                    <tr key={p.id}
                      style={{ borderBottom: '1px solid hsl(var(--border))', transition: 'background 0.12s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => toggleRow(p.id)}
                            style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>
                            {isExpanded ? '−' : '›'}
                          </button>
                          <button type="button" onClick={() => setSelectedProject(p)} style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', cursor: 'pointer', textAlign: 'left' }}>{p.name}</button>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.1)', padding: '3px 8px', borderRadius: 4, letterSpacing: 1 }}>
                          {p.project_key || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: 'hsl(var(--foreground))' }}>{p.client?.name || '—'}</td>
                      <td style={{ padding: '11px 14px', maxWidth: 260, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                        <ExpandableText text={p.health_summary || p.description} lines={2} limit={70} empty="No health summary" />
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={badgeStyle(projectStatusTone[p.status] || 'hsl(var(--muted-foreground))')}>{p.status_display || p.status || 'Planning'}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={badgeStyle(projectRiskTone[p.risk] || 'hsl(var(--muted-foreground))')}>{p.risk_display || p.risk || 'Low'}</span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>{p.start_date || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>{p.end_date || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        {members.length > 0 ? (
                          <div style={{ display: 'flex' }}>
                            {members.slice(0, 4).map((m, idx) => (
                              <div key={m.id} title={m.user.first_name ? `${m.user.first_name} ${m.user.last_name}` : m.user.username}
                                style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: avatarColors[m.user.id % avatarColors.length], border: '2px solid hsl(var(--card))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', marginLeft: idx === 0 ? 0 : -8, zIndex: members.length - idx, position: 'relative' }}>
                                {(m.user.first_name || m.user.username)[0].toUpperCase()}
                              </div>
                            ))}
                            {members.length > 4 && (
                              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'hsl(var(--muted))', border: '2px solid hsl(var(--card))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'hsl(var(--muted-foreground))', marginLeft: -8, position: 'relative' }}>
                                +{members.length - 4}
                              </div>
                            )}
                          </div>
                        ) : <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>—</span>}
                      </td>
                      <td style={{ padding: '11px 14px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <button onClick={() => openEdit(p)} title="Edit"
                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.1)'; e.currentTarget.style.color = 'hsl(var(--primary))'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => setDeleteId(p.id)} title="Delete"
                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                          <button onClick={() => navigate(`/projects/${p.slug}/modules`)} title="Open Modules"
                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded team sub-rows */}
                    {isExpanded && members.map((m, idx) => {
                      const name = m.user.first_name ? `${m.user.first_name} ${m.user.last_name}` : m.user.username;
                      const roleColor = getRoleColor(m.project_role);
                      return (
                        <tr key={`${p.id}-m-${m.id}`}
                          style={{ borderBottom: idx < members.length - 1 ? '1px solid hsl(var(--border) / 0.4)' : '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.25)' }}>
                          <td style={{ padding: '8px 14px 8px 50px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: avatarColors[m.user.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                {(m.user.first_name || m.user.username)[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: 13, color: 'hsl(var(--foreground))', fontWeight: 500 }}>{name}</span>
                            </div>
                          </td>
                          <td colSpan={2} style={{ padding: '8px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, backgroundColor: roleColor + '18', color: roleColor, border: `1px solid ${roleColor}33` }}>
                              {getRoleLabel(m.project_role)}
                            </span>
                          </td>
                          <td colSpan={7} style={{ padding: '8px 14px', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                            {m.user.email || ''}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="responsive-modal-card" style={{ ...card, width: '100%', maxWidth: 900, maxHeight: '85vh', overflowY: 'auto', padding: '20px 24px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>
                {modal === 'create' ? 'Create Project' : 'Edit Project'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 18 }}>✕</button>
            </div>

            {error && <p style={{ fontSize: 12, color: 'hsl(var(--destructive))', marginBottom: 12, padding: '8px 12px', backgroundColor: 'hsl(var(--destructive) / 0.08)', borderRadius: 6, border: '1px solid hsl(var(--destructive) / 0.2)' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
              {/* Row 1: Client + Project Name */}
              <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Client *</label>
                  <select value={form.client} onChange={(e) => setForm((p) => ({ ...p, client: parseInt(e.target.value) }))} required style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select client...</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Project Name *</label>
                  <input value={form.name} onChange={(e) => {
                    const name = e.target.value;
                    setForm((p) => ({ ...p, name, project_key: p.project_key || generateKey(name) }));
                  }} placeholder="e.g. Solar Plant Management" required style={inputStyle} />
                </div>
              </div>

              {/* Row 2: Project Key + Dates */}
              <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Project Key *</label>
                  <input
                    value={form.project_key}
                    onChange={(e) => setForm((p) => ({ ...p, project_key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) }))}
                    placeholder="e.g. SPM"
                    required
                    style={{ ...inputStyle, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}
                  />
                  <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', margin: '3px 0 0' }}>Max 6 chars · SPM-1, SPM-2...</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description..." rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Status</label>
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {PROJECT_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Risk</label>
                  <select value={form.risk} onChange={(e) => setForm((p) => ({ ...p, risk: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {PROJECT_RISK_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Health Summary</label>
                  <textarea value={form.health_summary} onChange={(e) => setForm((p) => ({ ...p, health_summary: e.target.value }))} rows={2} placeholder="Delivery health snapshot..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 5 }}>Blockers</label>
                  <textarea value={form.blockers} onChange={(e) => setForm((p) => ({ ...p, blockers: e.target.value }))} rows={2} placeholder="Known delivery blockers..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Milestones ({form.milestones.length})</label>
                  <button type="button" onClick={addMilestone} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Add Milestone</button>
                </div>
                {form.milestones.map((milestone, idx) => (
                  <div key={idx} className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 130px 130px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input value={milestone.title} onChange={(e) => updateMilestone(idx, 'title', e.target.value)} placeholder="Milestone title" style={inputStyle} />
                    <input type="date" value={milestone.due_date} onChange={(e) => updateMilestone(idx, 'due_date', e.target.value)} style={inputStyle} />
                    <select value={milestone.status} onChange={(e) => updateMilestone(idx, 'status', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <button type="button" onClick={() => removeMilestone(idx)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid hsl(var(--destructive) / 0.35)', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', cursor: 'pointer' }}>Remove</button>
                  </div>
                ))}
              </div>

              {/* Team Section */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Team Members ({form.team.length})
                  </label>
                  <button type="button" onClick={addTeamMember} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: '1px solid hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Add Role
                  </button>
                </div>

                {form.team.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', border: '2px dashed hsl(var(--border))', borderRadius: 8, backgroundColor: 'hsl(var(--muted))' }}>
                    <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No team members yet. Click "Add Role" to assign people.</p>
                  </div>
                ) : (
                  <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {form.team.map((member, idx) => {
                      const roleObj = PROJECT_ROLES.find((r) => r.value === member.project_role);
                      const allowedRoles = ROLE_USER_MAP[member.project_role] || [];
                      const filteredUsers = allUsers.filter((u) => allowedRoles.includes(u.role));
                      const selectedUser = allUsers.find((u) => u.id === member.user_id);
                      return (
                        <div key={idx} style={{ padding: '10px 12px', backgroundColor: 'hsl(var(--muted))', borderRadius: 8, border: '1px solid hsl(var(--border))' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Role</label>
                              <select value={member.project_role} onChange={(e) => updateTeamMember(idx, 'project_role', e.target.value)} style={{ ...inputStyle, cursor: 'pointer', padding: '5px 8px' }}>
                                {PROJECT_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1.5 }}>
                              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assign To</label>
                              <select value={member.user_id} onChange={(e) => updateTeamMember(idx, 'user_id', parseInt(e.target.value))} style={{ ...inputStyle, cursor: 'pointer', padding: '5px 8px' }}>
                                <option value="">{filteredUsers.length === 0 ? 'No users for this role' : 'Select person...'}</option>
                                {filteredUsers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.first_name ? `${u.first_name} ${u.last_name}` : u.username}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button type="button" onClick={() => removeTeamMember(idx)} style={{ marginTop: 16, padding: '5px 7px', borderRadius: 5, border: '1px solid hsl(var(--destructive) / 0.4)', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </div>
                          {selectedUser && (
                            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: avatarColors[selectedUser.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
                                {(selectedUser.first_name || selectedUser.username)[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: 11, color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                                {selectedUser.first_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : selectedUser.username}
                              </span>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, backgroundColor: (roleObj?.color || 'hsl(var(--muted))') + '22', color: roleObj?.color || 'hsl(var(--muted-foreground))' }}>
                                {roleObj?.label}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : modal === 'create' ? 'Create Project' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProject(null); }}
        >
          <div style={{ ...card, width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Folder size={18} color="hsl(var(--primary))" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>{selectedProject.name}</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.1)', padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>{selectedProject.project_key}</span>
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)}
                style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--background))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
              ><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', borderRight: '1px solid hsl(var(--border))', minWidth: 0 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <AlignLeft size={13} color="hsl(var(--muted-foreground))" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</span>
                  </div>
                  <div style={{ fontSize: 13, color: selectedProject.description ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', lineHeight: 1.7, padding: '12px 14px', backgroundColor: 'hsl(var(--muted) / 0.4)', borderRadius: 8, fontStyle: selectedProject.description ? 'normal' : 'italic', wordBreak: 'break-word' }}>
                    <p style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: descExpanded ? 'unset' : 3, WebkitBoxOrient: 'vertical', overflow: descExpanded ? 'visible' : 'hidden' }}>
                      {selectedProject.description || 'No description provided.'}
                    </p>
                    {selectedProject.description && selectedProject.description.length > 150 && (
                      <button onClick={() => setDescExpanded(p => !p)}
                        style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: 'hsl(var(--primary))', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block' }}>
                        {descExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <AlertTriangle size={13} color="hsl(var(--muted-foreground))" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Health</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ padding: '12px 14px', backgroundColor: 'hsl(var(--muted) / 0.4)', borderRadius: 8 }}>
                      <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: '0 0 6px', fontWeight: 700 }}>Summary</p>
                      <p style={{ fontSize: 13, color: selectedProject.health_summary ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', margin: 0, lineHeight: 1.6 }}>{selectedProject.health_summary || 'No health summary added.'}</p>
                    </div>
                    <div style={{ padding: '12px 14px', backgroundColor: 'hsl(var(--muted) / 0.4)', borderRadius: 8 }}>
                      <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: '0 0 6px', fontWeight: 700 }}>Blockers</p>
                      <p style={{ fontSize: 13, color: selectedProject.blockers ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', margin: 0, lineHeight: 1.6 }}>{selectedProject.blockers || 'No blockers reported.'}</p>
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Calendar size={13} color="hsl(var(--muted-foreground))" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Milestones</span>
                  </div>
                  {!selectedProject.milestones?.length ? (
                    <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', margin: 0 }}>No milestones added.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {selectedProject.milestones.map((milestone) => (
                        <div key={milestone.id || milestone.title} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>{milestone.title}</p>
                            <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: '3px 0 0' }}>{milestone.due_date || 'No due date'}</p>
                          </div>
                          <span style={badgeStyle(projectStatusTone[milestone.status] || 'hsl(var(--muted-foreground))')}>{milestone.status_display || milestone.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Users size={13} color="hsl(var(--muted-foreground))" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Team</span>
                  </div>
                  {!selectedProject.team_members?.length ? (
                    <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', margin: 0 }}>No team members assigned.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
                      {selectedProject.team_members.map((m) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: avatarColors[m.user.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {(m.user.first_name || m.user.username)[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 500, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.user.first_name ? `${m.user.first_name} ${m.user.last_name}` : m.user.username}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', flexShrink: 0 }}>
                            {getRoleLabel(m.project_role)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ width: 210, flexShrink: 0, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>Details</p>
                {[
                  { label: 'Client', value: selectedProject.client?.name || '—' },
                  { label: 'Key', value: <span style={{ fontWeight: 700, letterSpacing: 1, color: 'hsl(var(--primary))' }}>{selectedProject.project_key || '—'}</span> },
                  { label: 'Start', value: selectedProject.start_date || '—' },
                  { label: 'End', value: selectedProject.end_date || '—' },
                  { label: 'Status', value: <span style={badgeStyle(projectStatusTone[selectedProject.status] || 'hsl(var(--muted-foreground))')}>{selectedProject.status_display || selectedProject.status || 'Planning'}</span> },
                  { label: 'Risk', value: <span style={badgeStyle(projectRiskTone[selectedProject.risk] || 'hsl(var(--muted-foreground))')}>{selectedProject.risk_display || selectedProject.risk || 'Low'}</span> },
                  { label: 'Progress', value: `${selectedProject.progress || 0}%` },
                  { label: 'Modules', value: selectedProject.module_count || 0 },
                  { label: 'Members', value: `${selectedProject.team_members?.length || 0} people` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                    <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', width: 65, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 12, color: 'hsl(var(--foreground))', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}

              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}
        >
          <div style={{ ...card, width: 380, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 8px' }}>Delete Project</h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 20px' }}>
              Are you sure? This action cannot be undone. All team assignments and issues will be deleted.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
