import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, createClient, updateClient, deleteClient } from '../../services/clientService';
import { getUsers } from '../../services/userService';
import { AlertCircle, Plus } from 'lucide-react';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', outline: 'none', boxSizing: 'border-box' };
const avatarColors = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--type-epic))', 'hsl(var(--type-bug))'];

const emptyForm = { name: '', contact_person: '', email: '', phone: '', address: '', user_ids: [] };

export default function AdminClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [clientUsers, setClientUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = () =>
    Promise.all([getClients(), getUsers('client')])
      .then(([clientRes, userRes]) => {
        setClients(clientRes.data);
        setClientUsers(userRes.data);
        setLoadError('');
      })
      .catch(() => setLoadError('Clients could not be loaded. Please refresh and try again.'));

  useEffect(() => {
    fetchClients().finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setError('');
    setModal('create');
  };

  const openEdit = (client) => {
    setEditTarget(client);
    setForm({
      name: client.name,
      contact_person: client.contact_person,
      email: client.email,
      phone: client.phone,
      address: client.address,
      user_ids: (client.users || []).map((u) => u.id),
    });
    setError('');
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditTarget(null); setForm(emptyForm); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (modal === 'create') {
        await createClient(form);
      } else {
        await updateClient(editTarget.id, form);
      }
      await fetchClients();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteClient(deleteId);
      setClients((p) => p.filter((c) => c.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="responsive-page" style={{ width: '100%', maxWidth: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="responsive-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Clients</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            {loading ? 'Loading...' : `${clients.length} client${clients.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600 }}>
          <Plus size={14} strokeWidth={2.5} />
          Add Client
        </button>
      </div>

      {/* Clients Table */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Loading clients...</div>
      ) : loadError ? (
        <div style={{ ...card, padding: '56px 20px', textAlign: 'center' }}>
          <AlertCircle size={28} color="hsl(var(--destructive))" style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>Unable to load clients</p>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 16px' }}>{loadError}</p>
          <button onClick={fetchClients} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      ) : clients.length === 0 ? (
        <div style={{ ...card, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🏢</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>No clients yet</p>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 16px' }}>Add your first client company to get started.</p>
          <button onClick={openCreate} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add Client</button>
        </div>
      ) : (
        <div className="responsive-table-wrap" style={{ ...card, overflow: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: 920, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Client</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Contact Person</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Login Users</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Projects</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} style={{ borderBottom: '1px solid hsl(var(--border))', transition: 'background-color 0.2s', cursor: 'pointer' }}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: avatarColors[client.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏢</div> */}
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{client.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'hsl(var(--foreground))' }}>{client.contact_person || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'hsl(var(--muted-foreground))', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>{client.phone || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'hsl(var(--foreground))' }}>
                    {(client.users || []).length ? (
                      <span style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: 4, backgroundColor: 'hsl(var(--info) / 0.10)', color: 'hsl(var(--info))', fontSize: 12, fontWeight: 600 }}>
                        {client.users.length} linked
                      </span>
                    ) : (
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>No login linked</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 12, backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 600 }}>
                      {client.project_count}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View</button>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(client); }} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteId(client.id); }} style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid hsl(var(--destructive) / 0.4)', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="responsive-modal-card" style={{ ...card, width: '100%', maxWidth: 520, padding: 28, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>
                {modal === 'create' ? 'Add Client' : 'Edit Client'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 20 }}>✕</button>
            </div>

            {error && <p style={{ fontSize: 12, color: 'hsl(var(--destructive))', marginBottom: 14, padding: '10px 14px', backgroundColor: 'hsl(var(--destructive) / 0.08)', borderRadius: 6 }}>{error}</p>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Company Name *</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Google Inc." required style={inputStyle} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Contact Person</label>
                <input value={form.contact_person} onChange={(e) => setForm((p) => ({ ...p, contact_person: e.target.value }))} placeholder="e.g. John Doe" style={inputStyle} />
              </div>

              <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="contact@company.com" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+1-xxx-xxx-xxxx" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Client Login Users</label>
                <select
                  multiple
                  value={form.user_ids.map(String)}
                  onChange={(e) => setForm((p) => ({ ...p, user_ids: Array.from(e.target.selectedOptions, (option) => Number(option.value)) }))}
                  style={{ ...inputStyle, minHeight: 88 }}
                >
                  {clientUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.first_name || u.username} {u.last_name || ''} - {u.email}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Address</label>
                <textarea value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Company address..." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div className="responsive-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : modal === 'create' ? 'Add Client' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}
        >
          <div className="responsive-modal-card" style={{ ...card, width: 400, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 8px' }}>Delete Client</h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 20px' }}>
              Are you sure? This will delete all projects and data associated with this client.
            </p>
            <div className="responsive-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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
