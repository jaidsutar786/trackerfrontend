import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { projectService } from '../../services/projectService';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Bug, CheckSquare, Zap, ChevronUp, ChevronsUp, Equal, ChevronDown, Search, Filter, Plus, Pencil, Trash2, ChevronRight, ChevronLeft, X, Settings, Check } from 'lucide-react';
import ItemDetailModal from '../../components/ItemDetailModal';
import { getDisplayName, getInitials } from '../../utils/userUtils';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

// Type Icons & Colors - Using Theme Colors
const TYPE_CONFIG = {
  bug: { icon: Bug, color: 'hsl(var(--type-bug))', bg: 'hsl(var(--type-bug) / 0.15)' },
  story: { icon: Zap, color: 'hsl(var(--type-story))', bg: 'hsl(var(--type-story) / 0.15)' },
  task: { icon: CheckSquare, color: 'hsl(var(--type-task))', bg: 'hsl(var(--type-task) / 0.15)' }
};

// Priority Icons & Colors - Using Theme Colors
const PRIORITY_CONFIG = {
  highest: { icon: ChevronsUp, color: 'hsl(var(--priority-highest))', text: 'Highest' },
  high: { icon: ChevronUp, color: 'hsl(var(--priority-high))', text: 'High' },
  medium: { icon: Equal, color: 'hsl(var(--priority-medium))', text: 'Medium' },
  low: { icon: ChevronDown, color: 'hsl(var(--priority-low))', text: 'Low' }
};

// Status Colors - Using Theme Colors
const STATUS_CONFIG = {
  'To Do': { bg: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', text: 'To Do' },
  'In Progress': { bg: 'hsl(var(--info) / 0.15)', color: 'hsl(var(--info))', text: 'In Progress' },
  'Testing': { bg: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', text: 'Testing' },
  'Done': { bg: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))', text: 'Done' }
};

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Testing', 'Done'];

function CreateIssueModal({ onClose, onSubmit, projects, editMode = false, initialData = null }) {
  const [form, setForm] = useState({
    title: editMode && initialData ? initialData.title : '',
    description: editMode && initialData ? initialData.description : '',
    issue_type: editMode && initialData ? initialData.issue_type : 'bug',
    priority: editMode && initialData ? initialData.priority : 'medium',
    project: editMode && initialData ? initialData.project : (projects.length > 0 ? projects[0].id : ''),
    screenshots: [],
  });
  const [previews, setPreviews] = useState([]);
  const [previewIdx, setPreviewIdx] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (projects.length > 0 && !form.project) set('project', projects[0].id);
  }, [projects]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;
    set('screenshots', [...form.screenshots, ...newFiles]);
    setPreviews((p) => [...p, ...newFiles.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeFile = (idx) => {
    set('screenshots', form.screenshots.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' };
  const sel = { ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 30 };
  const isValid = form.title.trim() && form.description.trim() && form.project;
  const showPreview = previewIdx !== null;

  const typeOptions = [
    { value: 'bug', label: 'Bug', color: 'hsl(var(--type-bug))' },
    { value: 'story', label: 'Feature Request', color: 'hsl(var(--type-story))' },
    { value: 'task', label: 'Task', color: 'hsl(var(--type-task))' },
  ];
  const priorityOptions = [
    { value: 'highest', label: 'Highest', color: 'hsl(var(--priority-highest))' },
    { value: 'high', label: 'High', color: 'hsl(var(--priority-high))' },
    { value: 'medium', label: 'Medium', color: 'hsl(var(--priority-medium))' },
    { value: 'low', label: 'Low', color: 'hsl(var(--priority-low))' },
  ];
  const selectedType = typeOptions.find((t) => t.value === form.issue_type);
  const selectedPriority = priorityOptions.find((p) => p.value === form.priority);

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="responsive-modal-card" style={{ ...card, width: '100%', maxWidth: 800, maxHeight: '82vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.2 }}>{editMode ? 'Edit Issue' : 'Create Issue'}</h2>
                <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: '2px 0 0' }}>{editMode ? 'Update issue details' : 'Report a bug or request a feature'}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'hsl(var(--muted))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {/* Project + Summary in one row */}
            <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Project <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                {projects.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No projects available.</p>
                ) : (
                  <select value={form.project} onChange={(e) => set('project', e.target.value)} style={sel}>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label style={lbl}>Summary <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Short summary of the issue"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
                  onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                />
              </div>
            </div>

            {/* Type + Priority */}
            <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Issue Type</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.issue_type} onChange={(e) => set('issue_type', e.target.value)} style={{ ...sel, paddingLeft: 30 }}>
                    {typeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', backgroundColor: selectedType?.color, pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.priority} onChange={(e) => set('priority', e.target.value)} style={{ ...sel, paddingLeft: 30 }}>
                    {priorityOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', backgroundColor: selectedPriority?.color, pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={lbl}>Description <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
                onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>

            {/* Screenshots */}
            <div>
              <label style={lbl}>Attachments <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              {form.screenshots.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {form.screenshots.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid hsl(var(--border))', borderRadius: 7, backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 5, backgroundColor: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      </div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button onClick={() => setPreviewIdx(idx)} style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>View</button>
                      <button onClick={() => removeFile(idx)} style={{ width: 24, height: 24, borderRadius: 5, border: 'none', background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', border: '2px dashed hsl(var(--border))', borderRadius: 8, cursor: 'pointer', backgroundColor: 'hsl(var(--muted) / 0.4)', transition: 'border-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'hsl(var(--border))'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                  {form.screenshots.length === 0 ? 'Click to attach screenshots' : 'Add more screenshots'}
                </span>
                <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Fields marked <span style={{ color: 'hsl(var(--destructive))' }}>*</span> are required</span>
            <div className="responsive-actions" style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button
                onClick={() => { if (isValid) { onSubmit(form); onClose(); } }}
                disabled={!isValid}
                style={{ padding: '7px 20px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: isValid ? 'pointer' : 'not-allowed', opacity: isValid ? 1 : 0.5, transition: 'opacity 0.2s' }}
              >{editMode ? 'Update Issue' : 'Create Issue'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot Preview Modal */}
      {showPreview && previews[previewIdx] && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 24 }} onClick={() => setPreviewIdx(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            {previews.length > 1 && (
              <button onClick={() => setPreviewIdx((i) => (i - 1 + previews.length) % previews.length)} style={{ position: 'absolute', left: -44, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}
            <img src={previews[previewIdx]} alt="preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 8, display: 'block' }} />
            {previews.length > 1 && <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{previewIdx + 1} / {previews.length}</div>}
            {previews.length > 1 && (
              <button onClick={() => setPreviewIdx((i) => (i + 1) % previews.length)} style={{ position: 'absolute', right: -44, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}
            <button onClick={() => setPreviewIdx(null)} style={{ position: 'absolute', top: -12, right: -12, width: 28, height: 28, borderRadius: '50%', border: 'none', backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function IssueDetailModal({ issue, onClose, onStatusChange, onAddComment, onAssigneeChange, projectMembers = [], onApprove, onReject }) {
  const { user } = useAuth();
  const { onDataUpdate } = useNotifications();
  const isManager = user?.role === 'manager';
  const isTester = user?.role === 'qa_tester';
  const canReview = (isManager || isTester) && issue.status === 'Testing';
  const [comment, setComment] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [comments, setComments] = useState(issue.comments || []);
  const statusRef = useRef(null);

  // Real-time comment updates for admin modal
  useEffect(() => {
    return onDataUpdate((data) => {
      console.log('🔄 Admin IssueDetailModal received WebSocket data:', data);
      
      if (data.entity === 'comment' && data.action === 'created') {
        const { issue_id, comment } = data.data;
        console.log('📝 New comment for issue:', issue_id, 'Current issue:', issue.id);
        
        if (issue.id === issue_id) {
          console.log('✅ Updating admin modal comments');
          setComments(prev => [...prev, comment]);
        }
      }
    });
  }, [issue.id, onDataUpdate]);

  const typeConfig = TYPE_CONFIG[issue.issue_type] || TYPE_CONFIG.task;
  const statusConfig = STATUS_CONFIG[issue.status] || STATUS_CONFIG['To Do'];
  const priorityConfig = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.medium;
  const TypeIcon = typeConfig.icon;
  const PriorityIcon = priorityConfig.icon;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Combine comments and status changes for activity - recalculate on every render
  const allActivity = useMemo(() => {
    const activities = [];

    // Add comments
    if (comments) {
      comments.forEach(c => {
        activities.push({
          type: 'comment',
          id: `comment-${c.id}`,
          author: c.author ? getDisplayName(c.author) : (c.author_name || 'Unknown'),
          text: c.text,
          created_at: c.created_at
        });
      });
    }

    // Add status changes (if available from backend)
    if (issue.activity_logs) {
      issue.activity_logs.forEach(log => {
        if (log.action === 'status_changed' || log.type === 'status_change') {
          activities.push({
            type: 'status_change',
            id: log.id ? `status-${log.id}` : log.id,
            author: log.actor ? getDisplayName(log.actor) : (log.author || 'Unknown'),
            from: log.extra?.from || log.from,
            to: log.extra?.to || log.to,
            created_at: log.created_at
          });
        }
      });
    }

    // Sort by date
    activities.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return activities;
  }, [comments, issue.activity_logs]);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ ...card, width: '100%', maxWidth: 1200, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
        {/* Modal Header */}
        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 3, backgroundColor: typeConfig.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TypeIcon size={14} color={typeConfig.color} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}>HRM-{issue.id}</span>
            <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>/ {issue.project_name}</span>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'hsl(var(--muted))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Title */}
            <h1 style={{ fontSize: 20, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.3 }}>{issue.title}</h1>

            {/* QA Review Actions — only for Manager/Tester when status is Testing */}
            {canReview && (
              <div style={{ ...card, padding: 16, backgroundColor: 'hsl(var(--info) / 0.06)', borderColor: 'hsl(var(--info) / 0.3)' }}>
                <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'hsl(var(--info))', textTransform: 'uppercase', letterSpacing: 0.5 }}>🧪 Review Actions</p>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
                  This issue is ready for review. Please test the implementation and approve or reject it.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onApprove(issue.id)}
                    style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--success))', color: 'hsl(var(--success-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✅ Approve & Close
                  </button>
                  <button onClick={() => setShowRejectModal(true)}
                    style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--destructive))', backgroundColor: 'transparent', color: 'hsl(var(--destructive))', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ❌ Reject & Send Back
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 12px' }}>Description</h3>
              <p style={{ fontSize: 14, color: 'hsl(var(--foreground))', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {issue.description || 'No description provided.'}
              </p>
            </div>

            {/* Activity Section */}
            <div>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', padding: 0, marginBottom: 12 }}>
                <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} /> Activity
              </button>

              {/* Tabs */}
              <div style={{
                display: 'flex',
                gap: 4,
                padding: '4px',
                backgroundColor: 'hsl(var(--muted) / 0.5)',
                borderRadius: 6,
                marginBottom: 16,
              }}>
                {['All', 'Comments', 'History'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    style={{
                      padding: '6px 12px',
                      border: activeTab === tab.toLowerCase() ? '1px solid hsl(var(--primary))' : '1px solid transparent',
                      background: activeTab === tab.toLowerCase() ? 'hsl(var(--background))' : 'transparent',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      borderRadius: 4,
                      color: activeTab === tab.toLowerCase() ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { if (activeTab !== tab.toLowerCase()) e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                    onMouseLeave={(e) => { if (activeTab !== tab.toLowerCase()) e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                  >{tab}</button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'all' && (
                <>
                  {/* All Activity - No comment box */}
                  {allActivity.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', margin: 0 }}>No activity yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {allActivity.map((activity) => (
                        <div key={activity.id} style={{ display: 'flex', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#fff' }}>
                            {getInitials({ username: activity.author, first_name: activity.author })}
                          </div>
                          <div style={{ flex: 1 }}>
                            {activity.type === 'comment' ? (
                              <>
                                <div style={{ marginBottom: 6 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{activity.author}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
                                  {new Date(activity.created_at).toLocaleString()}
                                </div>
                                <p style={{ margin: 0, fontSize: 14, color: 'hsl(var(--foreground))', lineHeight: 1.5, padding: '9px 12px', backgroundColor: 'hsl(var(--muted))', borderRadius: 5 }}>
                                  {activity.text}
                                </p>
                              </>
                            ) : (
                              <>
                                <div style={{ marginBottom: 6 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{activity.author}</span>
                                  <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginLeft: 4 }}>changed the Status</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 10 }}>
                                  {(() => {
                                    const now = new Date();
                                    const created = new Date(activity.created_at);
                                    const diffMinutes = Math.floor((now - created) / (1000 * 60));

                                    if (diffMinutes < 1) return 'Just now';
                                    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
                                    const diffHours = Math.floor(diffMinutes / 60);
                                    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                                    const diffDays = Math.floor(diffHours / 24);
                                    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                  })()
                                  }
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    backgroundColor: STATUS_CONFIG[activity.from]?.bg || 'hsl(var(--muted))',
                                    color: STATUS_CONFIG[activity.from]?.color || 'hsl(var(--foreground))',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {activity.from}
                                  </span>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                  </svg>
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    backgroundColor: STATUS_CONFIG[activity.to]?.bg || 'hsl(var(--muted))',
                                    color: STATUS_CONFIG[activity.to]?.color || 'hsl(var(--foreground))',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {activity.to}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'comments' && (
                <>
                  {/* Add Comment Box - Only in Comments tab */}
                  <div style={{ marginBottom: 20 }}>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                      onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
                      onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                    />
                    {comment.trim() && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          onClick={() => { if (comment.trim()) { onAddComment(issue.id, comment.trim()); setComment(''); } }}
                          style={{ padding: '6px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Comment
                        </button>
                        <button onClick={() => setComment('')} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comments List */}
                  {(!comments || comments.length === 0) ? (
                    <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', margin: 0 }}>No comments yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {comments.map((c) => (
                        <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#fff' }}>
                            {getInitials(c.author)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{getDisplayName(c.author)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
                              {new Date(c.created_at).toLocaleString()}
                            </div>
                            <p style={{ margin: 0, fontSize: 14, color: 'hsl(var(--foreground))', lineHeight: 1.5, padding: '9px 12px', backgroundColor: 'hsl(var(--muted))', borderRadius: 5 }}>
                              {c.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'history' && (
                <>
                  {/* Current Status Info */}
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: 'hsl(var(--muted) / 0.5)',
                    borderRadius: 6,
                    marginBottom: 16,
                    border: '1px solid hsl(var(--border))'
                  }}>
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                      Current status: <strong style={{ color: statusConfig.color }}>{issue.status}</strong>
                    </p>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                      Created: {issue.created_at ? new Date(issue.created_at).toLocaleString() : '—'}
                    </p>
                    {issue.updated_at && (
                      <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                        Last updated: {new Date(issue.updated_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Status Change History */}
                  {(() => {
                    const statusChanges = allActivity.filter(a => a.type === 'status_change');
                    if (statusChanges.length === 0) {
                      return (
                        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', margin: 0 }}>
                          No status changes yet.
                        </p>
                      );
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {statusChanges.map((activity) => (
                          <div key={activity.id} style={{ display: 'flex', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#fff' }}>
                              {getInitials({ username: activity.author, first_name: activity.author })}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{activity.author}</span>
                                <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginLeft: 4 }}>changed the Status</span>
                              </div>
                              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 10 }}>
                                {(() => {
                                  const now = new Date();
                                  const created = new Date(activity.created_at);
                                  const diffMinutes = Math.floor((now - created) / (1000 * 60));

                                  if (diffMinutes < 1) return 'Just now';
                                  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
                                  const diffHours = Math.floor(diffMinutes / 60);
                                  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                                  const diffDays = Math.floor(diffHours / 24);
                                  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                })()}
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '9px 12px',
                                backgroundColor: 'hsl(var(--muted))',
                                borderRadius: 5
                              }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  backgroundColor: STATUS_CONFIG[activity.from]?.bg || 'hsl(var(--muted))',
                                  color: STATUS_CONFIG[activity.from]?.color || 'hsl(var(--foreground))',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  {activity.from}
                                </span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                  <polyline points="12 5 19 12 12 19" />
                                </svg>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  backgroundColor: STATUS_CONFIG[activity.to]?.bg || 'hsl(var(--muted))',
                                  color: STATUS_CONFIG[activity.to]?.color || 'hsl(var(--foreground))',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  {activity.to}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar - Details */}
          <div style={{ width: 320, backgroundColor: 'hsl(var(--muted) / 0.3)', overflowY: 'auto', flexShrink: 0 }}>
            {/* Status Dropdown */}
            <div style={{ padding: '16px 16px 0', position: 'relative' }} ref={statusRef}>
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                style={{
                  width: 'auto', padding: '6px 28px 6px 10px', borderRadius: 5, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer', outline: 'none',
                  backgroundColor: statusConfig.bg,
                  color: statusConfig.color,
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                {issue.status}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {statusDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 16, right: 16, marginTop: 4, zIndex: 100,
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden',
                  padding: '6px'
                }}>
                  {STATUS_OPTIONS.map((s) => {
                    const isSelected = s === issue.status;
                    let bgColor, textColor;

                    if (s === 'Done') {
                      bgColor = isSelected ? 'hsl(var(--success))' : 'transparent';
                      textColor = isSelected ? '#ffffff' : 'hsl(var(--success))';
                    } else if (s === 'In Progress') {
                      bgColor = isSelected ? 'hsl(var(--info))' : 'transparent';
                      textColor = isSelected ? '#ffffff' : 'hsl(var(--info))';
                    } else if (s === 'Testing') {
                      bgColor = isSelected ? 'hsl(var(--warning))' : 'transparent';
                      textColor = isSelected ? '#ffffff' : 'hsl(var(--warning))';
                    } else { // To Do
                      bgColor = isSelected ? 'hsl(var(--muted-foreground))' : 'transparent';
                      textColor = isSelected ? '#ffffff' : 'hsl(var(--muted-foreground))';
                    }

                    return (
                      <button
                        key={s}
                        onClick={() => {
                          onStatusChange(issue.id, s);
                          setStatusDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'block',
                          padding: '8px 12px',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          backgroundColor: bgColor,
                          color: textColor,
                          textTransform: 'uppercase',
                          borderRadius: '3px',
                          marginBottom: s === 'Done' ? '0' : '2px',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details Collapsible Box */}
            <div style={{ margin: '16px', border: '1px solid hsl(var(--border))', borderRadius: 6, overflow: 'hidden' }}>
              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', border: 'none', background: 'hsl(var(--background))', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))',
                  borderBottom: detailsOpen ? '1px solid hsl(var(--border))' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ChevronRight size={16} style={{ transform: detailsOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  <span>Details</span>
                </div>
                <Settings size={14} color="hsl(var(--muted-foreground))" />
              </button>

              {detailsOpen && (
                <div style={{ padding: '16px', backgroundColor: 'hsl(var(--background))' }}>
                  {/* Assignee */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                    <label style={{ width: 100, fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', paddingTop: 8 }}>Assignee</label>
                    <div style={{ flex: 1 }}>
                      <select
                        value={issue.assignee?.id || ''}
                        onChange={(e) => onAssigneeChange(issue.id, e.target.value || null)}
                        style={{ ...inputStyle, fontSize: 13, padding: '6px 10px' }}
                      >
                        <option value="">Unassigned</option>
                        {projectMembers.map((m) => (
                          <option key={m.user.id} value={m.user.id}>{getDisplayName(m.user)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Priority */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                    <label style={{ width: 100, fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', paddingTop: 8 }}>Priority</label>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                      <PriorityIcon size={16} color={priorityConfig.color} />
                      <span style={{ fontSize: 13, color: priorityConfig.color, fontWeight: 500, textTransform: 'capitalize' }}>{issue.priority}</span>
                    </div>
                  </div>

                  {/* Parent */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                    <label style={{ width: 100, fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', paddingTop: 8 }}>Parent</label>
                    <div style={{ flex: 1, padding: '6px 0' }}>
                      <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>None</span>
                    </div>
                  </div>

                  {/* Due date */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                    <label style={{ width: 100, fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', paddingTop: 8 }}>Due date</label>
                    <div style={{ flex: 1, padding: '6px 0' }}>
                      <span style={{ fontSize: 13, color: 'hsl(var(--foreground))' }}>{issue.due_date || 'None'}</span>
                    </div>
                  </div>

                  {/* Labels */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                    <label style={{ width: 100, fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', paddingTop: 8 }}>Labels</label>
                    <div style={{ flex: 1, padding: '6px 0' }}>
                      <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>None</span>
                    </div>
                  </div>

                  {/* Reporter */}
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <label style={{ width: 100, fontSize: 12, fontWeight: 500, color: 'hsl(var(--muted-foreground))', paddingTop: 8 }}>Reporter</label>
                    <div style={{ flex: 1, padding: '6px 0' }}>
                      <span style={{ fontSize: 13, color: 'hsl(var(--foreground))' }}>{getDisplayName(issue.reported_by)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
              style={{ ...inputStyle, width: '100%', resize: 'none', marginBottom: 16 }}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectModal(false)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={async () => {
                if (!rejectReason.trim()) return;
                setRejecting(true);
                await onReject(issue.id, rejectReason.trim());
                setRejecting(false);
                setShowRejectModal(false);
                setRejectReason('');
              }} disabled={!rejectReason.trim() || rejecting}
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

export default function AdminIssues() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [statusDropdowns, setStatusDropdowns] = useState({});

  useEffect(() => {
    const close = () => setStatusDropdowns({});
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  const { addNotification } = useNotifications();
  const { onDataUpdate } = useNotifications();

  const fetchIssues = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
        ...filters
      };
      
      const response = await issueService.getAll(params);
      
      if (response.data.results) {
        // Paginated response
        setIssues(response.data.results);
        setTotalCount(response.data.count);
        setTotalPages(Math.ceil(response.data.count / pageSize));
        setCurrentPage(page);
      } else {
        // Non-paginated response (fallback)
        setIssues(response.data);
        setTotalCount(response.data.length);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchIssues(1),
      projectService.getAll(),
    ])
      .then(([_, pRes]) => {
        setProjects(pRes.data);
      })
      .catch(() => { });
  }, [pageSize]);

  // Real-time refresh via WebSocket
  useEffect(() => {
    const unsub = onDataUpdate((event) => {
      console.log('🔄 Admin Issues received WebSocket data:', event);
      
      if (event.entity === 'comment' && event.action === 'created') {
        const { issue_id, comment } = event.data;
        console.log('📝 New comment for issue:', issue_id, comment);
        
        // Update issues list
        setIssues(prev => prev.map(issue => {
          if (issue.id === issue_id) {
            console.log('✅ Updating admin issue comments in list');
            return {
              ...issue,
              comments: [...(issue.comments || []), comment]
            };
          }
          return issue;
        }));
        
        // Update selected issue if it matches
        setSelected(prev => {
          if (prev && prev.id === issue_id) {
            console.log('✅ Updating admin selected issue comments');
            return {
              ...prev,
              comments: [...(prev.comments || []), comment]
            };
          }
          return prev;
        });
      } else if (event.entity === 'issue' && event.action === 'assigned_for_testing') {
        const { issue } = event.data;
        setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, assignee: issue.assignee } : i));
        setSelected(prev => prev?.id === issue.id ? { ...prev, assignee: issue.assignee } : prev);
        addNotification({ title: '🧪 Ready for Testing', message: event.data.message, icon: '🧪', type: 'direct' });
      } else if (event.entity === 'issue' && event.action === 'rejected_from_testing') {
        const { issue } = event.data;
        setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, assignee: issue.assignee, status: issue.status } : i));
        setSelected(prev => prev?.id === issue.id ? { ...prev, assignee: issue.assignee, status: issue.status } : prev);
        addNotification({ title: '❌ Issue Rejected', message: event.data.message, icon: '❌', type: 'direct' });
        fetchIssues(currentPage);
      } else if (event.entity === 'issue') {
        fetchIssues(currentPage);
      }
    });
    return unsub;
  }, [onDataUpdate]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const issue = issues.find((i) => i.id === id);
      const oldStatus = issue?.status;

      await issueService.update(id, { status: newStatus });
      setIssues((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i));

      // Update selected issue with new status and add activity log
      setSelected((prev) => {
        if (prev?.id === id) {
          const newActivityLog = {
            type: 'status_change',
            id: `status-${Date.now()}`,
            author: 'You', // Current user
            from: oldStatus,
            to: newStatus,
            created_at: new Date().toISOString()
          };

          // Add to activity_logs if it exists, otherwise create it
          const updatedActivityLogs = prev.activity_logs ? [...prev.activity_logs, newActivityLog] : [newActivityLog];

          return {
            ...prev,
            status: newStatus,
            activity_logs: updatedActivityLogs
          };
        }
        return prev;
      });

      // Add notification for admin/manager when status changes
      if (issue) {
        addNotification({
          title: 'Status Updated',
          message: `"${issue.title}" moved to ${newStatus}`,
          icon: '🔄',
          type: 'direct',
        });
      }
    } catch { }
  };

  const handleAddComment = async (id, text) => {
    try {
      const res = await issueService.addComment(id, text);
      setIssues((prev) => prev.map((i) => i.id === id ? { ...i, comments: [...(i.comments || []), res.data] } : i));
      setSelected((prev) => prev?.id === id ? { ...prev, comments: [...(prev.comments || []), res.data] } : prev);

      // Add notification for client (issue reporter)
      const issue = issues.find((i) => i.id === id);
      if (issue && issue.reported_by) {
        addNotification({
          title: 'New Comment',
          message: `${res.data.author.username} commented on "${issue.title}"`,
          icon: '💬',
          type: 'direct',
        });
      }
    } catch { }
  };

  const handleAssigneeChange = async (id, userId) => {
    try {
      const res = await issueService.update(id, { assignee: userId });
      setIssues((prev) => prev.map((i) => i.id === id ? { ...i, assignee: res.data.assignee } : i));
      setSelected((prev) => prev?.id === id ? { ...prev, assignee: res.data.assignee } : prev);
      const issue = issues.find((i) => i.id === id);
      if (issue && res.data.assignee) {
        addNotification({ title: 'Issue Assigned', message: `${issue.title} assigned to ${res.data.assignee.username}`, icon: '👤' });
      }
    } catch { }
  };

  const handleSelectIssue = async (issue) => {
    setSelected({ ...issue, itemType: 'issue' });
    try {
      const freshRes = await issueService.getById(issue.id);
      setSelected({ ...freshRes.data, itemType: 'issue' });
      setIssues(prev => prev.map(i => i.id === issue.id ? freshRes.data : i));
    } catch { }
  };

  const closeSelectedIssue = () => {
    setSelected(null);
    if (!searchParams.has('issue')) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('issue');
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    const issueId = searchParams.get('issue');
    if (!issueId) return;

    let cancelled = false;
    const openIssueFromNotification = async () => {
      try {
        const res = await issueService.getById(issueId);
        if (cancelled) return;
        setSelected({ ...res.data, itemType: 'issue' });
        setIssues(prev => {
          const exists = prev.some(i => String(i.id) === String(issueId));
          return exists ? prev.map(i => String(i.id) === String(issueId) ? res.data : i) : [res.data, ...prev];
        });
      } catch (error) {
        console.error('Unable to open issue from notification:', error);
      }
    };

    openIssueFromNotification();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchIssues(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    fetchIssues(1);
  };

  const handleCreateIssue = async (form) => {
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('issue_type', form.issue_type);
      formData.append('priority', form.priority);
      formData.append('project', form.project);
      form.screenshots.forEach((file) => formData.append('screenshots', file));

      const res = await issueService.create(formData);
      setIssues((prev) => [res.data, ...prev]);
      addNotification({ title: 'Issue Created', message: `"${res.data.title}" has been created`, icon: '✓' });
    } catch {
      addNotification({ title: 'Error', message: 'Failed to create issue', icon: '✗' });
    }
  };

  const handleEditIssue = async (form) => {
    try {
      const res = await issueService.update(editingIssue.id, {
        title: form.title,
        description: form.description,
        issue_type: form.issue_type,
        priority: form.priority,
        project: form.project,
      });
      setIssues((prev) => prev.map(i => i.id === editingIssue.id ? res.data : i));
      addNotification({ title: 'Issue Updated', message: `"${res.data.title}" has been updated`, icon: '✓' });
    } catch {
      addNotification({ title: 'Error', message: 'Failed to update issue', icon: '✗' });
    }
  };

  const handleDeleteIssue = async (issue) => {
    if (!confirm(`Delete "${issue.title}"?`)) return;
    try {
      await issueService.delete(issue.id);
      setIssues((prev) => prev.filter(i => i.id !== issue.id));
      addNotification({ title: 'Issue Deleted', message: `"${issue.title}" has been deleted`, icon: '✓' });
    } catch {
      addNotification({ title: 'Error', message: 'Failed to delete issue', icon: '✗' });
    }
  };

  const handleApprove = async (id) => {
    try {
      await issueService.update(id, { status: 'Done' });
      setIssues((prev) => prev.map((i) => i.id === id ? { ...i, status: 'Done' } : i));
      setSelected((prev) => prev?.id === id ? { ...prev, status: 'Done' } : prev);
      
      const issue = issues.find((i) => i.id === id);
      if (issue) {
        addNotification({
          title: 'Issue Approved',
          message: `"${issue.title}" has been approved and closed`,
          icon: '✅',
          type: 'direct',
        });
      }
    } catch {}
  };

  const handleReject = async (id, reason) => {
    try {
      await issueService.addComment(id, `Rejected: ${reason}`);
      await issueService.update(id, { status: 'To Do' });
      setIssues((prev) => prev.map((i) => i.id === id ? { 
        ...i, 
        status: 'To Do',
        comments: [...(i.comments || []), { id: Date.now(), text: `Rejected: ${reason}`, author: { username: 'QA' }, created_at: new Date().toISOString() }]
      } : i));
      setSelected((prev) => prev?.id === id ? { 
        ...prev, 
        status: 'To Do',
        comments: [...(prev.comments || []), { id: Date.now(), text: `Rejected: ${reason}`, author: { username: 'QA' }, created_at: new Date().toISOString() }]
      } : prev);
      
      const issue = issues.find((i) => i.id === id);
      if (issue) {
        addNotification({
          title: 'Issue Rejected',
          message: `"${issue.title}" was rejected and sent back for fixes`,
          icon: '❌',
          type: 'direct',
        });
      }
    } catch {}
  };


  const counts = {
    all: totalCount,
    'To Do': issues.filter((i) => i.status === 'To Do').length,
    'In Progress': issues.filter((i) => i.status === 'In Progress').length,
    'Testing': issues.filter((i) => i.status === 'Testing').length,
    'Done': issues.filter((i) => i.status === 'Done').length,
  };

  const btnStyle = (active) => ({
    padding: '6px 14px', borderRadius: 6, border: '1px solid hsl(var(--border))', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    backgroundColor: active ? 'hsl(var(--primary))' : 'transparent',
    color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
  });

  return (
    <div className="responsive-page" style={{ width: '100%', maxWidth: '100%', padding: '16px', boxSizing: 'border-box', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'hsl(var(--background))' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div className="responsive-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Issues</h1>
            <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginTop: 4, margin: 0 }}>All issues across HRM Platform</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', border: 'none',
                borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Create Issue
            </button>
          )}
        </div>

        {/* Search & Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 40px', border: '1px solid hsl(var(--border))',
                borderRadius: 6, fontSize: 14, backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))', outline: 'none'
              }}
            />
          </div>
          {['all', 'To Do', 'In Progress', 'Testing', 'Done'].map((f) => (
            <button key={f} onClick={() => {
              setFilter(f);
              setCurrentPage(1);
              fetchIssues(1, { status: f === 'all' ? undefined : f });
            }} style={btnStyle(filter === f)}>
              {f === 'all' ? 'All' : f} ({f === 'all' ? totalCount : counts[f]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ ...card, padding: '48px 20px', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Loading...</p>
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden', width: '100%', border: '1px solid hsl(var(--border))' }}>
          {issues.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>No issues found</p>
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No issues reported yet.</p>
            </div>
          ) : (
            <div className="responsive-table-wrap" style={{ overflow: 'auto', height: '100%' }}>
              <table style={{ width: '100%', minWidth: 1000, borderCollapse: 'collapse' }}>
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
                    {isAdmin && <th style={{ padding: '9px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderLeft: '1px solid hsl(var(--border))', width: '80px' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue, i) => {
                    const typeConfig = TYPE_CONFIG[issue.issue_type] || TYPE_CONFIG.task;
                    const priorityConfig = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.medium;
                    const statusConfig = STATUS_CONFIG[issue.status] || STATUS_CONFIG['To Do'];
                    const TypeIcon = typeConfig.icon;
                    const PriorityIcon = priorityConfig.icon;

                    return (
                      <tr key={issue.id}
                        onClick={() => handleSelectIssue(issue)}
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
                            backgroundColor: typeConfig.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <TypeIcon size={12} color={typeConfig.color} />
                          </div>
                        </td>

                        {/* Project */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                            {issue.project_name || '—'}
                          </span>
                        </td>

                        {/* Summary */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))', maxWidth: 180 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, color: 'hsl(var(--foreground))', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {issue.title}
                            </span>
                            {issue.comments?.length > 0 && (
                              <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                💬 {issue.comments.length}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Description */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {issue.description || 'No description provided'}
                          </span>
                        </td>

                        {/* Priority */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <PriorityIcon size={14} color={priorityConfig.color} />
                            <span style={{
                              fontSize: 13, color: priorityConfig.color,
                              fontWeight: 500
                            }}>
                              {priorityConfig.text}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setStatusDropdowns(prev => ({ ...prev, [issue.id]: !prev[issue.id] })); }}
                              style={{ padding: '4px 8px', borderRadius: 4, border: 'none', backgroundColor: statusConfig.bg, color: statusConfig.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <span style={{ whiteSpace: 'nowrap' }}>{statusConfig.text.toUpperCase()}</span>
                              <ChevronDown size={12} />
                            </button>
                            {statusDropdowns[issue.id] && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 130, backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
                                {STATUS_OPTIONS.map((s) => {
                                  const sc = STATUS_CONFIG[s];
                                  const active = issue.status === s;
                                  return (
                                    <button key={s}
                                      onClick={(e) => { e.stopPropagation(); handleStatusChange(issue.id, s); setStatusDropdowns({}); }}
                                      style={{ width: '100%', padding: '7px 10px', border: 'none', backgroundColor: active ? sc.bg : 'transparent', color: active ? sc.color : 'hsl(var(--foreground))', fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
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
                          </div>
                        </td>

                        {/* Assignee */}
                        <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }} onClick={(e) => e.stopPropagation()}>
                          <select
                            value={issue.assignee?.id || ''}
                            onChange={(e) => handleAssigneeChange(issue.id, e.target.value || null)}
                            style={{ fontSize: 12, padding: '4px 6px', borderRadius: 4, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', cursor: 'pointer', maxWidth: 130, outline: 'none' }}
                          >
                            <option value="">Unassigned</option>
                            {(projects.find(p => p.id === issue.project)?.team_members || []).map((m) => (
                              <option key={m.user.id} value={m.user.id}>{getDisplayName(m.user)}</option>
                            ))}
                          </select>
                        </td>

                        {/* Updated */}
                        <td style={{ padding: '5px 10px' }}>
                          <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                            {(() => {
                              const now = new Date();
                              const updated = new Date(issue.updated_at);
                              const diffHours = Math.floor((now - updated) / (1000 * 60 * 60));

                              if (diffHours < 1) return 'Just now';
                              if (diffHours < 24) return `${diffHours}h ago`;
                              if (diffHours < 48) return '1d ago';
                              return `${Math.floor(diffHours / 24)}d ago`;
                            })()
                            }
                          </span>
                        </td>

                        {/* Actions */}
                        {isAdmin && (
                          <td style={{ padding: '5px 10px', textAlign: 'center', borderLeft: '1px solid hsl(var(--border))' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <button
                                onClick={() => { setEditingIssue(issue); setShowEditModal(true); }}
                                style={{
                                  padding: '6px', borderRadius: 4, border: 'none',
                                  backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Edit Issue"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteIssue(issue)}
                                style={{
                                  padding: '6px', borderRadius: 4, border: 'none',
                                  backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Delete Issue"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Pagination Footer */}
              <div style={{ 
                padding: '12px 16px', 
                borderTop: '1px solid hsl(var(--border))', 
                backgroundColor: 'hsl(var(--card))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Show:</span>
                  <select 
                    value={pageSize} 
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    style={{ 
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      border: '1px solid hsl(var(--border))', 
                      backgroundColor: 'hsl(var(--background))', 
                      color: 'hsl(var(--foreground))',
                      fontSize: 12, 
                      cursor: 'pointer' 
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                    Showing {totalCount > 0 ? ((currentPage - 1) * pageSize) + 1 : 0}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                  </span>
                  
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{ 
                          width: 28, height: 28, borderRadius: 4, border: '1px solid hsl(var(--border))', 
                          backgroundColor: 'hsl(var(--background))', 
                          color: 'hsl(var(--foreground))',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: currentPage === 1 ? 0.5 : 1
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      
                      <span style={{ fontSize: 12, color: 'hsl(var(--foreground))', padding: '0 8px' }}>
                        {currentPage} of {totalPages}
                      </span>
                      
                      <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{ 
                          width: 28, height: 28, borderRadius: 4, border: '1px solid hsl(var(--border))', 
                          backgroundColor: 'hsl(var(--background))', 
                          color: 'hsl(var(--foreground))',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: currentPage === totalPages ? 0.5 : 1
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selected && (
        <ItemDetailModal
          item={selected}
          onClose={closeSelectedIssue}
          onStatusChange={(id, newStatus) => handleStatusChange(id, newStatus)}
          onAddComment={handleAddComment}
          onAssigneeChange={(id, userId) => handleAssigneeChange(id, userId)}
          projectMembers={projects.find(p => p.id === selected.project)?.team_members || []}
          onApprove={handleApprove}
          onReject={handleReject}
          onUpdate={(patch) => {
            setIssues(prev => prev.map(i => i.id === selected.id ? { ...i, ...patch } : i));
            setSelected(prev => prev ? { ...prev, ...patch } : null);
          }}
        />
      )}

      {isAdmin && showCreateModal && <CreateIssueModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateIssue} projects={projects} />}
      {isAdmin && showEditModal && editingIssue && <CreateIssueModal onClose={() => { setShowEditModal(false); setEditingIssue(null); }} onSubmit={handleEditIssue} projects={projects} editMode={true} initialData={editingIssue} />}
    </div>
  );
}
