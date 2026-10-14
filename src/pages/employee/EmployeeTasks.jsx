import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workItemService } from '../../services/workItemService';
import { useNotifications } from '../../context/NotificationContext';
import { issueService } from '../../services/issueService';
import ItemDetailModal from '../../components/ItemDetailModal';
import API from '../../services/api';
import { Bug, CheckSquare, Bookmark, ChevronsUp, ChevronUp, Equal, ChevronDown, ChevronsDown, MessageSquare, Calendar, User, Wrench, CheckCircle2, XCircle, Check, MoreHorizontal, Trash2 } from 'lucide-react';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const typeStyle = { bug: { bg: 'hsl(var(--type-bug) / 0.12)', text: 'hsl(var(--type-bug))' }, task: { bg: 'hsl(var(--type-task) / 0.12)', text: 'hsl(var(--type-task))' }, story: { bg: 'hsl(var(--type-story) / 0.12)', text: 'hsl(var(--type-story))' } };
const priorityColor = { highest: 'hsl(var(--priority-highest))', high: 'hsl(var(--priority-high))', medium: 'hsl(var(--priority-medium))', low: 'hsl(var(--priority-low))' };
const statusStyle = { 'To Do': { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' }, 'In Progress': { bg: 'hsl(var(--info) / 0.12)', text: 'hsl(var(--info))' }, 'Testing': { bg: 'hsl(var(--warning) / 0.12)', text: 'hsl(var(--warning))' }, 'Done': { bg: 'hsl(var(--success) / 0.12)', text: 'hsl(var(--success))' } };
const STATUS_OPTIONS = ['To Do', 'In Progress', 'Testing', 'Done'];

function ScreenshotsSection({ issue }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const all = [
    ...(issue.screenshots || []).map((s) => s.url),
    ...((!(issue.screenshots?.length) && issue.screenshot_url) ? [issue.screenshot_url] : []),
  ];
  if (!all.length) return null;
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Screenshots ({all.length})</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {all.map((url, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid hsl(var(--border))', borderRadius: 7, backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 5, backgroundColor: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))' }}>Screenshot {idx + 1}</span>
              <button onClick={() => setLightboxIdx(idx)} style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View</button>
            </div>
          ))}
        </div>
      </div>
      {lightboxIdx !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 24 }} onClick={() => setLightboxIdx(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            {all.length > 1 && <button onClick={() => setLightboxIdx((i) => (i - 1 + all.length) % all.length)} style={{ position: 'absolute', left: -44, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg></button>}
            <img src={all[lightboxIdx]} alt="screenshot" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 8, display: 'block' }} />
            {all.length > 1 && <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{lightboxIdx + 1} / {all.length}</div>}
            {all.length > 1 && <button onClick={() => setLightboxIdx((i) => (i + 1) % all.length)} style={{ position: 'absolute', right: -44, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg></button>}
            <button onClick={() => setLightboxIdx(null)} style={{ position: 'absolute', top: -12, right: -12, width: 28, height: 28, borderRadius: '50%', border: 'none', backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
          </div>
        </div>
      )}
    </>
  );
}

function TaskDetail({ task, onClose, onStatusChange, onAddComment, onAssign, onApprove, onReject }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const isTester = user?.role === 'qa_tester';
  const isManager = user?.role === 'manager';
  const canReview = (isTester || isManager) && task.status === 'Testing';
  const ts = typeStyle[task.issue_type] || typeStyle.task;
  const ss = statusStyle[task.status] || statusStyle['To Do'];
  
  const getTypeIcon = (type) => {
    if (type === 'bug') return <Bug size={16} strokeWidth={2.5} />;
    if (type === 'story') return <Bookmark size={16} strokeWidth={2.5} />;
    return <CheckSquare size={16} strokeWidth={2.5} />;
  };
  
  const getPriorityIcon = (priority) => {
    if (priority === 'highest') return <ChevronsUp size={14} strokeWidth={2.5} />;
    if (priority === 'high') return <ChevronUp size={14} strokeWidth={2.5} />;
    if (priority === 'low') return <ChevronDown size={14} strokeWidth={2.5} />;
    return <Equal size={14} strokeWidth={2.5} />;
  };

  useEffect(() => {
    if (isTester && task.project) {
      API.get(`/projects/${task.project}/`)
        .then((res) => {
          const devs = (res.data.team_members || []).filter(
            (m) => !['qa_tester'].includes(m.user.role)
          );
          setProjectMembers(devs);
        })
        .catch(() => {});
    }
  }, [task.project, isTester]);

  const handleAssign = async (memberId) => {
    setAssigning(true);
    await onAssign(task.id, memberId);
    setAssigning(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    await onReject(task.id, rejectReason.trim());
    setRejecting(false);
    setShowRejectModal(false);
    setRejectReason('');
  };

  const submit = () => {
    if (!comment.trim()) return;
    onAddComment(task.id, comment.trim());
    setComment('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ ...card, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ color: ts.text }}>{getTypeIcon(task.issue_type, 18, task.itemType)}</div>
            <div style={{ color: priorityColor[task.priority] }}>{getPriorityIcon(task.priority)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: ss.bg, color: ss.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {task.status}
                <ChevronDown size={14} />
              </button>
              {statusDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: 160, backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
                  {STATUS_OPTIONS.map((s) => {
                    const sStyle = statusStyle[s];
                    const active = task.status === s;
                    return (
                      <button key={s} onClick={() => { onStatusChange(task.id, s); setStatusDropdownOpen(false); }}
                        style={{ width: '100%', padding: '8px 12px', border: 'none', backgroundColor: active ? sStyle.bg : 'transparent', color: active ? sStyle.text : 'hsl(var(--foreground))', fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        onMouseEnter={(e) => !active && (e.currentTarget.style.backgroundColor = 'hsl(var(--accent))')}
                        onMouseLeave={(e) => !active && (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {s}
                        {active && <Check size={14} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 20, flexShrink: 0 }}>✕</button>
          </div>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 20px', lineHeight: 1.4 }}>{task.title}</h2>

        {/* QA Review Actions — only for Tester/Manager when status is Testing */}
        {canReview && (
          <div style={{ ...card, padding: 18, marginBottom: 20, backgroundColor: 'hsl(var(--warning) / 0.08)', borderColor: 'hsl(var(--warning) / 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Wrench size={16} strokeWidth={2.5} style={{ color: 'hsl(var(--warning))' }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'hsl(var(--warning))', textTransform: 'uppercase', letterSpacing: 0.5 }}>QA Review</p>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.6 }}>
              This issue is ready for review. Test the implementation and approve or send back for fixes.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => onApprove(task.id)}
                style={{ flex: 1, padding: '9px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--success))', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <CheckCircle2 size={16} strokeWidth={2.5} />
                Approve & Close
              </button>
              <button onClick={() => setShowRejectModal(true)}
                style={{ flex: 1, padding: '9px 16px', borderRadius: 6, border: '1px solid hsl(var(--destructive))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--destructive))', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <XCircle size={16} strokeWidth={2.5} />
                Reject & Send Back
              </button>
            </div>
          </div>
        )}
        {/* Assign to Developer — only for QA Tester */}
        {isTester && (
          <div style={{ ...card, padding: 16, marginBottom: 20, backgroundColor: 'hsl(var(--warning) / 0.06)', borderColor: 'hsl(var(--warning) / 0.3)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'hsl(var(--warning))', textTransform: 'uppercase', letterSpacing: 0.5 }}>🔍 Assign to Developer</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={task.assignee?.id || ''}
                onChange={(e) => handleAssign(e.target.value ? Number(e.target.value) : null)}
                disabled={assigning}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 13, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', cursor: 'pointer' }}
              >
                <option value=''>— Unassigned —</option>
                {projectMembers.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.first_name || m.user.username} ({m.user.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
              {task.assignee && (
                <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
                  Currently: <strong style={{ color: 'hsl(var(--foreground))' }}>{task.assignee.username}</strong>
                </span>
              )}
            </div>
            {assigning && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Assigning...</p>}
          </div>
        )}



        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</p>
          <p style={{ margin: 0, fontSize: 14, color: 'hsl(var(--foreground))', lineHeight: 1.7, padding: '12px 14px', backgroundColor: 'hsl(var(--muted))', borderRadius: 6 }}>{task.description}</p>
        </div>

        <ScreenshotsSection issue={task} />

        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Created: <strong style={{ color: 'hsl(var(--foreground))' }}>{new Date(task.created_at).toLocaleDateString()}</strong></span>
        </div>

        <div>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Comments ({task.comments?.length || 0})
          </p>

          {(!task.comments || task.comments.length === 0) ? (
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 16px', fontStyle: 'italic' }}>No comments yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {task.comments.map((c) => (
                <div key={c.id} style={{ padding: '10px 14px', backgroundColor: 'hsl(var(--muted))', borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{c.author?.username}</span>
                    <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>{c.text}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." rows={2}
              style={{ ...inputStyle, resize: 'none', flex: 1 }}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            />
            <button onClick={submit} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}>
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowRejectModal(false); }}>
          <div style={{ ...card, width: '100%', maxWidth: 480, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Reject Issue</h3>
              <button onClick={() => setShowRejectModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 18 }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 12px', lineHeight: 1.5 }}>
              Please provide a reason for rejecting this issue. The developer will see this comment and fix the issues.
            </p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)..."
              rows={4}
              style={{ ...inputStyle, resize: 'none', marginBottom: 16 }}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectModal(false)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || rejecting}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: rejectReason.trim() ? 'hsl(var(--destructive))' : 'hsl(var(--muted))', color: rejectReason.trim() ? 'hsl(var(--destructive-foreground))' : 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 600, cursor: rejectReason.trim() ? 'pointer' : 'not-allowed' }}>
                {rejecting ? 'Rejecting...' : 'Reject & Send Back'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignSection({ taskId, projectId, currentAssignee, onAssign }) {
  const [projectMembers, setProjectMembers] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (projectId) {
      API.get(`/projects/${projectId}/`)
        .then((res) => {
          setProjectMembers((res.data.team_members || []).filter(m => m.user.role !== 'qa_tester'));
        })
        .catch(() => {});
    }
  }, [projectId]);

  const handleAssign = async (val) => {
    setAssigning(true);
    await onAssign(taskId, val ? Number(val) : null);
    setAssigning(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>Assign to</span>
      <div style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
        <select
          value={currentAssignee?.id || ''}
          onChange={(e) => handleAssign(e.target.value)}
          disabled={assigning}
          style={{
            width: '100%', padding: '7px 28px 7px 10px', borderRadius: 6, fontSize: 13,
            border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))', cursor: 'pointer', outline: 'none', appearance: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
          onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
        >
          <option value=''>Unassigned</option>
          {projectMembers.map((m) => (
            <option key={m.user.id} value={m.user.id}>
              {m.user.first_name || m.user.username}
            </option>
          ))}
        </select>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2"
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {assigning && <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Saving...</span>}
    </div>
  );
}

export default function EmployeeTasks() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const projects = [...new Set(tasks.map(t => t.project_name).filter(Boolean))];

  const { onDataUpdate } = useNotifications();

  const refreshWorkItems = useCallback(() => {
    if (!user?.id) return Promise.resolve();
    return workItemService.getMyWorkItems(user).then((res) => {
      setTasks([...res.data].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)));
    });
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      refreshWorkItems()
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id, refreshWorkItems]);

  useEffect(() => {
    if (!user?.id) return;
    return onDataUpdate((event) => {
      if (!event || ['task', 'issue', 'subtask', 'comment'].includes(event.entity)) {
        refreshWorkItems().catch(() => {});
      }
    });
  }, [user?.id, onDataUpdate, refreshWorkItems]);

  useEffect(() => {
    const taskId = searchParams.get('task');
    const issueId = searchParams.get('issue');
    if ((!taskId && !issueId) || tasks.length === 0) return;

    const matchingTask = tasks.find((task) =>
      taskId
        ? String(task.task_id) === String(taskId) || String(task.id) === String(taskId)
        : task.itemType === 'issue' && String(task.id) === String(issueId)
    );

    if (matchingTask) {
      setSelected(matchingTask);
    }
  }, [searchParams, tasks]);

  const closeSelectedItem = () => {
    setSelected(null);
    if (!searchParams.has('task') && !searchParams.has('issue')) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('task');
    nextParams.delete('issue');
    setSearchParams(nextParams, { replace: true });
  };

  const filtered = (filter === 'all' ? tasks : tasks.filter((t) => t.status === filter))
    .filter((t) => projectFilter === 'all' || t.project_name === projectFilter);

  const counts = {
    all: tasks.length,
    'To Do': tasks.filter((t) => t.status === 'To Do').length,
    'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
    'Done': tasks.filter((t) => t.status === 'Done').length,
  };

  // Debug logging
  console.log('🔍 Filter Debug:');
  console.log('- Current filter:', filter);
  console.log('- All tasks:', tasks.map(t => ({ id: t.id, title: t.title, status: t.status, itemType: t.itemType })));
  console.log('- Filtered tasks:', filtered.map(t => ({ id: t.id, title: t.title, status: t.status, itemType: t.itemType })));
  console.log('- Counts:', counts);

  const handleStatusChange = async (id, newStatus, itemType) => {
    try {
      setStatusMenu(null);
      const task = tasks.find(t => t.id === id);
      await workItemService.updateStatus(id, newStatus, itemType || task?.itemType);
      // Use uniqueId for proper matching since tasks and issues can have same id
      setTasks((prev) => prev.map((t) => 
        (t.id === id && t.itemType === (itemType || task?.itemType)) 
          ? { ...t, status: newStatus } 
          : t
      ));
      setSelected((prev) => 
        (prev?.id === id && prev?.itemType === (itemType || task?.itemType)) 
          ? { ...prev, status: newStatus } 
          : prev
      );
    } catch {}
  };

  const handleAssign = async (id, assigneeId) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (task?.itemType === 'task') {
        const tasksRes = await API.get('/projects/tasks/my-tasks/');
        const taskData = tasksRes.data.find(t => t.id === id);
        if (taskData) {
          const res = await API.patch(`/projects/${taskData.project}/tasks/${taskData.task_id}/`, { assignee: assigneeId || null });
          setTasks((prev) => prev.map((t) => 
            (t.id === id && t.itemType === 'task') 
              ? { ...t, assignee: res.data.assignee } 
              : t
          ));
          setSelected((prev) => 
            (prev?.id === id && prev?.itemType === 'task') 
              ? { ...prev, assignee: res.data.assignee } 
              : prev
          );
        }
      } else {
        const res = await API.patch(`/projects/issues/${id}/`, { assignee: assigneeId || null });
        setTasks((prev) => prev.map((t) => 
          (t.id === id && t.itemType === 'issue') 
            ? { ...t, assignee: res.data.assignee } 
            : t
        ));
        setSelected((prev) => 
          (prev?.id === id && prev?.itemType === 'issue') 
            ? { ...prev, assignee: res.data.assignee } 
            : prev
        );
      }
    } catch (error) { console.error('Error assigning:', error); }
  };

  const handleAddComment = async (id, text) => {
    try {
      const task = tasks.find(t => t.id === id);
      const res = await workItemService.addComment(id, text, task?.itemType);
      setTasks((prev) => prev.map((t) => 
        (t.id === id && t.itemType === task?.itemType) 
          ? { ...t, comments: [...(t.comments || []), res.data] } 
          : t
      ));
      setSelected((prev) => 
        (prev?.id === id && prev?.itemType === task?.itemType) 
          ? { ...prev, comments: [...(prev.comments || []), res.data] } 
          : prev
      );
    } catch {}
  };

  const handleApprove = async (id) => {
    try {
      const task = tasks.find(t => t.id === id);
      await workItemService.updateStatus(id, 'Done', task?.itemType);
      setTasks((prev) => prev.map((t) => 
        (t.id === id && t.itemType === task?.itemType) 
          ? { ...t, status: 'Done' } 
          : t
      ));
      setSelected((prev) => 
        (prev?.id === id && prev?.itemType === task?.itemType) 
          ? { ...prev, status: 'Done' } 
          : prev
      );
    } catch {}
  };

  const handleReject = async (id, reason) => {
    try {
      const task = tasks.find(t => t.id === id);
      await workItemService.addComment(id, `Rejected: ${reason}`, task?.itemType);
      await workItemService.updateStatus(id, 'In Progress', task?.itemType);
      setTasks((prev) => prev.map((t) => 
        (t.id === id && t.itemType === task?.itemType) 
          ? { ...t, status: 'In Progress', comments: [...(t.comments || []), { id: Date.now(), text: `Rejected: ${reason}`, author: { username: 'QA' }, created_at: new Date().toISOString() }] } 
          : t
      ));
      setSelected((prev) => 
        (prev?.id === id && prev?.itemType === task?.itemType) 
          ? { ...prev, status: 'In Progress', comments: [...(prev.comments || []), { id: Date.now(), text: `Rejected: ${reason}`, author: { username: 'QA' }, created_at: new Date().toISOString() }] } 
          : prev
      );
    } catch {}
  };

  const [detailStatusDropdown, setDetailStatusDropdown] = useState(false);
  const [statusMenu, setStatusMenu] = useState(null);

  const getTypeIcon = (type, size = 18, itemType = 'task') => {
    if (itemType === 'subtask') return <CheckSquare size={size} strokeWidth={2.5} />;
    if (type === 'bug') return <Bug size={size} strokeWidth={2.5} />;
    if (type === 'story') return <Bookmark size={size} strokeWidth={2.5} />;
    return <CheckSquare size={size} strokeWidth={2.5} />;
  };

  const getPriorityIcon = (priority, size = 16) => {
    if (priority === 'highest') return <ChevronsUp size={size} strokeWidth={2.5} />;
    if (priority === 'high') return <ChevronUp size={size} strokeWidth={2.5} />;
    if (priority === 'low') return <ChevronDown size={size} strokeWidth={2.5} />;
    return <Equal size={size} strokeWidth={2.5} />;
  };

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

  const openStatusMenu = (event, task) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setStatusMenu({
      key: task.uniqueId || `${task.itemType}-${task.id}`,
      item: task,
      top: rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 150),
      width: Math.max(rect.width, 130),
    });
  };

  const btnStyle = (active) => ({
    padding: '6px 14px', borderRadius: 6, border: '1px solid hsl(var(--border))', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    backgroundColor: active ? 'hsl(var(--primary))' : 'transparent',
    color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>
            {user?.role === 'qa_tester' ? 'QA Dashboard' : 'My Assigned Work'}
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            {user?.role === 'qa_tester' 
              ? `${filtered.length} issue${filtered.length !== 1 ? 's' : ''} in your assigned projects — manage and assign to developers`
              : `${filtered.length} work item${filtered.length !== 1 ? 's' : ''} assigned to you — includes both issues and tasks`
            }
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Project Filter */}
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              style={{
                padding: '7px 32px 7px 30px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))',
                color: projectFilter !== 'all' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                cursor: 'pointer', outline: 'none', appearance: 'none',
                borderColor: projectFilter !== 'all' ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))',
              }}
            >
              <option value="all">All Projects</option>
              {projects.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2"
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {['all', 'To Do', 'In Progress', 'Done'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={btnStyle(filter === f)}>
              {f === 'all' ? 'All' : f} <span style={{ opacity: 0.7 }}>({counts[f]})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ ...card, padding: '48px 20px', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Loading...</p>
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>No assigned work</p>
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No tasks or issues have been assigned to you yet. Check back later or contact your manager.</p>
            </div>
          ) : (
            <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'hsl(var(--card))' }}>
                  <tr>
                    <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: '40px' }}>Type</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: '120px' }}>Project</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: '180px' }}>Summary</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))' }}>Description</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: '110px' }}>Priority</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: '110px' }}>Status</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: '120px' }}>Assignee</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', width: '90px' }}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((task, i) => {
                    const ts = typeStyle[task.issue_type] || typeStyle.task;
                    const ss = statusStyle[task.status] || statusStyle['To Do'];
                    const taskKey = task.uniqueId || `${task.itemType}-${task.id}`;
                    const isStatusDropdownOpen = statusMenu?.key === taskKey;
                    
                    return (
                      <tr key={taskKey}
                        onClick={async () => {
                          try {
                            if (task.itemType === 'task') {
                              const tasksRes = await API.get('/projects/tasks/my-tasks/');
                              const taskData = tasksRes.data.find(t => t.id === task.id && t.itemType === 'task');
                              if (taskData) {
                                const res = await API.get(`/projects/${taskData.project}/tasks/${taskData.task_id}/`);
                                const fresh = { ...res.data, itemType: 'task', uniqueId: task.uniqueId, id: task.id };
                                setTasks(prev => prev.map(t => t.uniqueId === task.uniqueId ? fresh : t));
                                setSelected(fresh);
                              } else {
                                setSelected(task);
                              }
                            } else if (task.itemType === 'subtask') {
                              // For subtasks, just show the subtask data as-is
                              setSelected(task);
                            } else {
                              const res = await issueService.getById(task.id);
                              const fresh = { ...res.data, itemType: 'issue', uniqueId: task.uniqueId };
                              setTasks(prev => prev.map(t => t.uniqueId === task.uniqueId ? fresh : t));
                              setSelected(fresh);
                            }
                          } catch (error) {
                            console.error('Error fetching item details:', error);
                            setSelected(task);
                          }
                        }}
                        style={{
                          borderBottom: '1px solid hsl(var(--border))',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          backgroundColor: 'hsl(var(--card))'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--card))'}
                      >
                        {/* Type */}
                        <td style={{ padding: '5px 10px', textAlign: 'center', borderRight: '1px solid hsl(var(--border))' }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 3,
                            backgroundColor: ts.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <div style={{ color: ts.text, display: 'flex', alignItems: 'center' }}>
                              {getTypeIcon(task.issue_type, 12, task.itemType)}
                            </div>
                          </div>
                        </td>

                        {/* Project */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                            {task.project_name || '—'}
                          </span>
                        </td>

                        {/* Summary */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))', maxWidth: 180 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'column', alignItems: 'flex-start' }}>
                            {task.itemType === 'subtask' && task.parent_task_title && (
                              <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                                📌 {task.parent_task_title}
                              </span>
                            )}
                            <span style={{ fontSize: 13, color: 'hsl(var(--foreground))', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                              {task.itemType === 'subtask' ? '↳ ' : ''}{task.title}
                            </span>
                            {task.comments?.length > 0 && (
                              <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                💬 {task.comments.length}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Description */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {task.description || 'No description provided'}
                          </span>
                        </td>

                        {/* Priority */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ color: priorityColor[task.priority], display: 'flex', alignItems: 'center' }}>
                              {getPriorityIcon(task.priority, 14)}
                            </div>
                            <span style={{
                              fontSize: 13, color: priorityColor[task.priority],
                              fontWeight: 500
                            }}>
                              {task.priority === 'medium' ? 'Medium' : task.priority === 'highest' ? 'Highest' : task.priority === 'high' ? 'High' : 'Low'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }} onClick={(e) => e.stopPropagation()}>
                          <div>
                            <button
                              onClick={(e) => openStatusMenu(e, task)}
                              style={{ padding: '4px 8px', borderRadius: 4, border: 'none', backgroundColor: ss.bg, color: ss.text, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <span style={{ whiteSpace: 'nowrap' }}>{task.status}</span>
                              <ChevronDown size={12} style={{ transform: isStatusDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                            </button>
                          </div>
                        </td>

                        {/* Assignee */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                          {task.assignee ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 20, height: 20, borderRadius: '50%',
                                backgroundColor: 'hsl(var(--primary))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 600, color: 'hsl(var(--primary-foreground))'
                              }}>
                                {task.assignee?.username?.substring(0, 2).toUpperCase() || 'JS'}
                              </div>
                              <span style={{ fontSize: 13, color: 'hsl(var(--foreground))' }}>
                                {task.assignee?.first_name || task.assignee?.username}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Updated */}
                        <td style={{ padding: '5px 10px' }}>
                          <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                            {(() => {
                              const now = new Date();
                              const updated = new Date(task.updated_at);
                              const diffHours = Math.floor((now - updated) / (1000 * 60 * 60));

                              if (diffHours < 1) return 'Just now';
                              if (diffHours < 24) return `${diffHours}h ago`;
                              if (diffHours < 48) return '1d ago';
                              return `${Math.floor(diffHours / 24)}d ago`;
                            })()
                            }
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
          {STATUS_OPTIONS.map((s) => {
            const sc = statusStyle[s];
            const active = statusMenu.item.status === s;
            return (
              <button
                key={s}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(statusMenu.item.id, s, statusMenu.item.itemType);
                  setStatusMenu(null);
                }}
                style={{ width: '100%', padding: '8px 10px', border: 'none', backgroundColor: active ? sc.bg : 'transparent', color: active ? sc.text : 'hsl(var(--foreground))', fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'hsl(var(--accent))'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {s}
                {active && <Check size={12} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ItemDetailModal
          item={selected}
          onClose={closeSelectedItem}
          onStatusChange={(id, newStatus) => handleStatusChange(id, newStatus, selected.itemType)}
          onAssigneeChange={(newAssignee) => {
            setTasks(prev => prev.map(t =>
              t.id === selected.id && t.itemType === selected.itemType
                ? { ...t, assignee: newAssignee }
                : t
            ));
            setSelected(prev => prev ? { ...prev, assignee: newAssignee } : null);
          }}
          onUpdate={(patch) => {
            setTasks(prev => prev.map(t =>
              t.id === selected.id && t.itemType === selected.itemType
                ? { ...t, ...patch }
                : t
            ));
            setSelected(prev => prev ? { ...prev, ...patch } : null);
          }}
        />
      )}
    </div>
  );
}
