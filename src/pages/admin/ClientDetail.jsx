import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClient, getClientProjects } from '../../services/clientService';
import { createProject, updateProject, deleteProject } from '../../services/projectService';
import { getUsers } from '../../services/userService';
import ExpandableText from '../../components/ExpandableText';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', outline: 'none' };

const emptyForm = { name: '', description: '', start_date: '', end_date: '', team: [] };
const ROLES = ['manager', 'lead', 'developer', 'tester', 'devops'];

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    Promise.all([
      getClient(id).then(r => setClient(r.data)),
      getClientProjects(id).then(r => setProjects(r.data)),
      getUsers().then(r => setUsers(r.data.filter(u => u.role !== 'client')))
    ]).finally(() => setLoading(false));
  }, [id]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal('create');
  };

  const openEdit = (project) => {
    setEditTarget(project);
    setForm({
      name: project.name,
      description: project.description,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      team: project.team_members.map(m => ({ user_id: m.user.id, project_role: m.project_role }))
    });
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditTarget(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, client: parseInt(id) };
      if (modal === 'create') {
        await createProject(payload);
      } else {
        await updateProject(editTarget.id, payload);
      }
      const res = await getClientProjects(id);
      setProjects(res.data);
      closeModal();
    } catch { } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(deleteId);
      setProjects(p => p.filter(pr => pr.id !== deleteId));
      setDeleteId(null);
    } catch { setDeleteId(null); }
  };

  const addTeamMember = () => setForm(p => ({ ...p, team: [...p.team, { user_id: '', project_role: 'developer' }] }));
  const removeTeamMember = (idx) => setForm(p => ({ ...p, team: p.team.filter((_, i) => i !== idx) }));
  const updateTeamMember = (idx, field, value) => setForm(p => ({ ...p, team: p.team.map((m, i) => i === idx ? { ...m, [field]: value } : m) }));

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Loading...</div>;
  if (!client) return <div style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--destructive))' }}>Client not found</div>;

  return (
    <div className="responsive-page client-detail-page" style={{ width: '100%', maxWidth: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => navigate('/clients')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Clients
        </button>
        <div className="responsive-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0, wordBreak: 'break-word' }}>{client.name}</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {client.contact_person && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>👤 {client.contact_person}</p>}
              {client.email && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>✉️ {client.email}</p>}
              {client.phone && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>📞 {client.phone}</p>}
            </div>
          </div>
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Project
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 12 }}>Projects ({projects.length})</h2>
      {projects.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', margin: '0 0 12px' }}>No projects yet</p>
          <button onClick={openCreate} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add First Project</button>
        </div>
      ) : (
        <div className="responsive-table-wrap" style={{ ...card, overflow: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Project Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Duration</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Team</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{project.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'hsl(var(--muted-foreground))', maxWidth: 300 }}>
                    {project.description ? (
                      <ExpandableText text={project.description} lines={2} />
                    ) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                    {project.start_date || project.end_date ? (
                      <div>
                        <div>{project.start_date || '—'}</div>
                        <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}>to {project.end_date || '—'}</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {project.team_members.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {project.team_members.slice(0, 3).map(member => (
                          <span key={member.id} style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, backgroundColor: 'hsl(var(--muted))', fontSize: 11, color: 'hsl(var(--foreground))' }}>
                            {member.user.username}
                          </span>
                        ))}
                        {project.team_members.length > 3 && (
                          <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', padding: '3px 8px' }}>+{project.team_members.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>No team</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(project)} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => setDeleteId(project.id)} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid hsl(var(--destructive) / 0.4)', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="responsive-modal-card" style={{ ...card, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>{modal === 'create' ? 'Add Project' : 'Edit Project'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 20 }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Project Name *</label>
                <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. E-commerce Platform" required style={inputStyle} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Project details..." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              {/* Team Members */}
              <div style={{ marginBottom: 20 }}>
                <div className="client-detail-team-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Assign Team Members</label>
                  <button type="button" onClick={addTeamMember} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid hsl(var(--primary))', backgroundColor: 'transparent', color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add Member</button>
                </div>

                {form.team.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: 16, backgroundColor: 'hsl(var(--muted) / 0.3)', borderRadius: 6 }}>No team members assigned yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {form.team.map((member, idx) => (
                      <div className="client-detail-team-row" key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr auto', gap: 8, alignItems: 'end' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 4 }}>Employee</label>
                          <select value={member.user_id} onChange={(e) => updateTeamMember(idx, 'user_id', parseInt(e.target.value))} required style={inputStyle}>
                            <option value="">Select...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username} ({u.role})</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 4 }}>Role</label>
                          <select value={member.project_role} onChange={(e) => updateTeamMember(idx, 'project_role', e.target.value)} required style={inputStyle}>
                            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                          </select>
                        </div>
                        <button type="button" onClick={() => removeTeamMember(idx)} style={{ padding: '8px 10px', borderRadius: 5, border: '1px solid hsl(var(--destructive) / 0.4)', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', fontSize: 12, cursor: 'pointer', marginBottom: 0, alignSelf: 'flex-end' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="responsive-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : modal === 'create' ? 'Create Project' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div className="responsive-modal-card" style={{ ...card, width: 400, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 8px' }}>Delete Project</h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 20px' }}>Are you sure? This will delete all data associated with this project.</p>
            <div className="responsive-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
