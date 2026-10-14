import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, createUser, updateUser, resendInvite, deleteUser } from '../../services/userService';
import { getDisplayName, getInitials } from '../../utils/userUtils';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Mail, Plus } from 'lucide-react';

const card = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  boxShadow: 'var(--shadow-sm)',
};

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13,
  border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))', outline: 'none', boxSizing: 'border-box',
};

const roleStyle = {
  admin:              { bg: 'hsl(var(--type-epic) / 0.12)',    text: 'hsl(var(--type-epic))',    label: 'Admin' },
  manager:            { bg: 'hsl(var(--info) / 0.12)',        text: 'hsl(var(--info))',          label: 'Manager' },
  client:             { bg: 'hsl(var(--warning) / 0.12)',     text: 'hsl(var(--warning))',       label: 'Client' },
  frontend_developer: { bg: 'hsl(var(--success) / 0.12)',     text: 'hsl(var(--success))',       label: 'Frontend Developer' },
  backend_developer:  { bg: 'hsl(var(--primary) / 0.12)',     text: 'hsl(var(--primary))',       label: 'Backend Developer' },
  fullstack_developer:{ bg: 'hsl(var(--type-story) / 0.12)',  text: 'hsl(var(--type-story))',    label: 'Fullstack Developer' },
  devops:             { bg: 'hsl(var(--type-task) / 0.12)',   text: 'hsl(var(--type-task))',     label: 'DevOps Engineer' },
  qa_tester:          { bg: 'hsl(var(--type-bug) / 0.12)',    text: 'hsl(var(--type-bug))',      label: 'QA Tester' },
  ui_ux_designer:     { bg: 'hsl(var(--secondary) / 0.12)',   text: 'hsl(var(--secondary))',     label: 'UI/UX Designer' },
};

const inviteStyle = {
  pending:  { bg: 'hsl(var(--warning) / 0.12)', text: 'hsl(var(--warning))', label: 'Pending' },
  sent:     { bg: 'hsl(var(--info) / 0.12)',    text: 'hsl(var(--info))',    label: 'Sent' },
  failed:   { bg: 'hsl(var(--destructive) / 0.10)', text: 'hsl(var(--destructive))', label: 'Failed' },
  accepted: { bg: 'hsl(var(--success) / 0.12)', text: 'hsl(var(--success))', label: 'Accepted' },
};

const avatarColors = [
  'hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))',
  'hsl(var(--warning))', 'hsl(var(--type-epic))', 'hsl(var(--type-bug))',
];

const ROLES = [
  { value: 'frontend_developer',  label: 'Frontend Developer' },
  { value: 'backend_developer',   label: 'Backend Developer' },
  { value: 'fullstack_developer', label: 'Fullstack Developer' },
  { value: 'devops',              label: 'DevOps Engineer' },
  { value: 'qa_tester',           label: 'QA Tester' },
  { value: 'ui_ux_designer',      label: 'UI/UX Designer' },
  { value: 'manager',             label: 'Manager' },
  { value: 'client',              label: 'Client' },
];

const emptyForm = { first_name: '', last_name: '', email: '', role: 'frontend_developer' };

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser, setUser } = useAuth();
  const [hoverCard, setHoverCard] = useState(null); // { user, x, y }
  const hoverTimeout = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'invite' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [actionBusyId, setActionBusyId] = useState(null);

  const showCard = (e, u) => {
    clearTimeout(hoverTimeout.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverCard({ user: u, x: rect.left, y: rect.bottom + 6 });
  };
  const hideCard = () => {
    hoverTimeout.current = setTimeout(() => setHoverCard(null), 150);
  };

  const fetchUsers = () =>
    getUsers()
      .then((r) => {
        setUsers(r.data);
        setLoadError('');
      })
      .catch(() => setLoadError('Users could not be loaded. Please refresh and try again.'));

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  const openInvite = () => {
    setForm(emptyForm);
    setError('');
    setEmailSent(false);
    setModal('invite');
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, role: u.role });
    setError('');
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditTarget(null); setForm(emptyForm); setError(''); setEmailSent(false); };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createUser(form);
      setEmailSent(true);
      await fetchUsers();
      // show success for 1.5s then close
      setTimeout(() => closeModal(), 1800);
    } catch (err) {
      const msg = err?.response?.data;
      if (msg?.email) setError('This email is already registered.');
      else if (msg?.username) setError('Username conflict. Try a different email.');
      else setError(msg?.error || 'Failed to invite user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await updateUser(editTarget.id, form);
      // Agar current logged-in user ka role update hua toh AuthContext bhi update karo
      if (currentUser?.id === editTarget.id) {
        setUser(res.data);
      }
      await fetchUsers();
      closeModal();
    } catch {
      setError('Failed to update user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(deleteId);
      setUsers((p) => p.filter((u) => u.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleResendInvite = async (u) => {
    setActionBusyId(u.id);
    try {
      await resendInvite(u.id);
      await fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'Invite could not be resent. Please try again.');
      setEditTarget(u);
      setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, role: u.role });
      setModal('edit');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleToggleActive = async (u) => {
    setActionBusyId(u.id);
    try {
      await updateUser(u.id, { is_active: u.is_active === false });
      await fetchUsers();
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="responsive-page" style={{ width: '100%', maxWidth: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="responsive-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Users</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            {loading ? 'Loading...' : `${users.length} member${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={openInvite}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600 }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--primary-hover))'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--primary))'}
        >
          <Plus size={14} strokeWidth={2.5} />
          Invite User
        </button>
      </div>

      {/* Table */}
      <div className="responsive-table-wrap" style={{ ...card, overflow: 'auto', width: '100%' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Loading users...</div>
        ) : loadError ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <AlertCircle size={26} color="hsl(var(--destructive))" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>Unable to load users</p>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 16px' }}>{loadError}</p>
            <button onClick={fetchUsers} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>No users yet</p>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 16px' }}>Invite your first team member.</p>
            <button onClick={openInvite} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Invite User</button>
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'hsl(var(--card))' }}>
              <tr>
                {[{ label: '', w: 36 }, { label: 'User' }, { label: 'Email' }, { label: 'Role', w: 180 }, { label: 'Status', w: 90 }, { label: 'Invite', w: 110 }, { label: 'Actions', w: 230 }].map(({ label, w }, i, arr) => (
                  <th key={label + i} style={{ padding: '9px 12px', textAlign: label === 'Actions' ? 'center' : 'left', fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', letterSpacing: '0.4px', borderBottom: '1px solid hsl(var(--border))', borderRight: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none', width: w, whiteSpace: 'nowrap', backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
                    {label === '' ? <input type="checkbox" style={{ cursor: 'pointer' }} /> : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const rs = roleStyle[u.role] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', label: u.role };
                const invite = inviteStyle[u.invite_status] || inviteStyle.pending;
                const active = u.is_active !== false;
                return (
                  <tr key={u.id}
                    style={{ borderBottom: '1px solid hsl(var(--border))', transition: 'background 0.12s', backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '0 12px', borderRight: '1px solid hsl(var(--border))', textAlign: 'center', width: 36 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} />
                    </td>
                    {/* User */}
                    <td style={{ padding: '8px 12px', borderRight: '1px solid hsl(var(--border))' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        onMouseEnter={(e) => showCard(e, u)}
                        onMouseLeave={hideCard}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: avatarColors[u.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {getInitials(u)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--primary))' }}>{getDisplayName(u)}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '8px 12px', fontSize: 13, color: 'hsl(var(--muted-foreground))', borderRight: '1px solid hsl(var(--border))' }}>{u.email}</td>
                    {/* Role */}
                    <td style={{ padding: '8px 12px', borderRight: '1px solid hsl(var(--border))' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, backgroundColor: rs.bg, color: rs.text, whiteSpace: 'nowrap' }}>
                        {rs.label}
                      </span>
                    </td>
                    {/* Status */}
                    <td style={{ padding: '8px 12px', borderRight: '1px solid hsl(var(--border))' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, backgroundColor: active ? 'hsl(var(--success) / 0.12)' : 'hsl(var(--muted))', color: active ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', borderRight: '1px solid hsl(var(--border))' }}>
                      <span title={u.invite_sent_at ? `Last sent ${new Date(u.invite_sent_at).toLocaleString()}` : ''}
                        style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, backgroundColor: invite.bg, color: invite.text, whiteSpace: 'nowrap' }}>
                        {invite.label}
                      </span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => handleResendInvite(u)} disabled={actionBusyId === u.id}
                          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid hsl(var(--info) / 0.35)', backgroundColor: 'transparent', color: 'hsl(var(--info))', fontSize: 12, fontWeight: 500, cursor: actionBusyId === u.id ? 'not-allowed' : 'pointer', opacity: actionBusyId === u.id ? 0.6 : 1 }}
                        >Resend</button>
                        <button onClick={() => openEdit(u)}
                          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >Edit</button>
                        <button onClick={() => handleToggleActive(u)} disabled={actionBusyId === u.id}
                          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: active ? 'hsl(var(--warning))' : 'hsl(var(--success))', fontSize: 12, fontWeight: 500, cursor: actionBusyId === u.id ? 'not-allowed' : 'pointer', opacity: actionBusyId === u.id ? 0.6 : 1 }}
                        >{active ? 'Deactivate' : 'Activate'}</button>
                        <button onClick={() => setDeleteId(u.id)}
                          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid hsl(var(--destructive) / 0.3)', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} style={{ padding: '8px 16px', borderTop: '1px solid hsl(var(--border))', fontSize: 12, color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                  {users.length} of {users.length}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Hover Profile Card */}
      {hoverCard && (() => {
        const u = hoverCard.user;
        const rs = roleStyle[u.role] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', label: u.role };
        const ac = avatarColors[u.id % avatarColors.length];
        return (
          <div
            onMouseEnter={() => clearTimeout(hoverTimeout.current)}
            onMouseLeave={hideCard}
            style={{ position: 'fixed', top: hoverCard.y, left: hoverCard.x, zIndex: 2000, width: 260, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
          >
            {/* Blue banner */}
            <div style={{ height: 56, background: 'linear-gradient(135deg, hsl(var(--primary) / 0.85) 0%, hsl(var(--info) / 0.7) 100%)' }} />
            {/* Avatar overlapping banner */}
            <div style={{ padding: '0 16px' }}>
              <div style={{ marginTop: -24, marginBottom: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', border: '3px solid hsl(var(--card))' }}>
                  {getInitials(u)}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'hsl(var(--foreground))', marginBottom: 2 }}>{getDisplayName(u)}</div>
              <div style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: rs.bg, color: rs.text, display: 'inline-block', marginBottom: 8 }}>{rs.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{u.email}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 14 }}>
                <button
                  onClick={() => { setHoverCard(null); navigate(`/profile/${u.id}`); }}
                  style={{ flex: 1, padding: '6px 0', borderRadius: 5, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >View profile</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Invite / Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="responsive-modal-card" style={{ ...card, width: 520, maxWidth: '90vw', padding: 24, boxShadow: 'var(--shadow-lg)' }}>

            {/* Email sent success state */}
            {emailSent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'hsl(var(--success) / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 8px' }}>Invitation Sent!</h2>
                <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                  Login credentials have been sent to <strong>{form.email}</strong>
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>
                    {modal === 'invite' ? 'Invite User' : 'Edit User'}
                  </h2>
                  <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 18 }}>✕</button>
                </div>
                 {error && (
                  <p style={{ fontSize: 12, color: 'hsl(var(--destructive))', marginBottom: 12, padding: '8px 12px', backgroundColor: 'hsl(var(--destructive) / 0.08)', borderRadius: 6 }}>{error}</p>
                )}

                <form onSubmit={modal === 'invite' ? handleInvite : handleEdit}>
                  {/* Name row */}
                  <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>First Name</label>
                      <input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} placeholder="Enter first name" style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
                        onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Last Name</label>
                      <input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} placeholder="Enter last name" style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
                        onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>
                      Email Address *
                    </label>
                    <input
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Enter email address"
                      type="email"
                      required
                      disabled={modal === 'edit'}
                      style={{ ...inputStyle, opacity: modal === 'edit' ? 0.6 : 1, cursor: modal === 'edit' ? 'not-allowed' : 'text' }}
                      onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
                      onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                    />
                    {modal === 'edit' && (
                      <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>Email cannot be changed after account creation.</p>
                    )}
                  </div>

                  {/* Role */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Position / Role *</label>
                    <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} required style={{ ...inputStyle, cursor: 'pointer' }}>
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>

                  <div className="responsive-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={closeModal}
                      style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                      {modal === 'invite' ? (
                        <>
                          <Mail size={13} strokeWidth={2.5} />
                          {saving ? 'Sending...' : 'Send Invite'}
                        </>
                      ) : (
                        saving ? 'Saving...' : 'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}
        >
          <div className="responsive-modal-card" style={{ ...card, width: 360, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 8px' }}>Remove User</h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 20px' }}>
              Are you sure you want to remove this user? They will lose access immediately.
            </p>
            <div className="responsive-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
