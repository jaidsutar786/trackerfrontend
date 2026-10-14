import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { issueService } from '../services/issueService';
import { subtaskService } from '../services/subtaskService';
import API from '../services/api';
import { getDisplayName } from '../utils/userUtils';
import useMediaQuery from '../hooks/useMediaQuery';
import { 
  ChevronRight, 
  Paperclip, 
  AlignLeft, 
  ThumbsUp, 
  ChevronDown,
  ChevronsUp,
  ChevronUp,
  Equal,
  Home,
  Bug,
  Target,
  Flag,
  X,
  Check,
  MessageCircle,
  Loader2,
  Calendar,
  Plus,
  ListChecks,
  Trash2,
} from 'lucide-react';

// Add CSS animation for loading spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

const priorityColor = {
  highest: 'hsl(var(--priority-highest))',
  high: 'hsl(var(--priority-high))',
  medium: 'hsl(var(--priority-medium))',
  low: 'hsl(var(--priority-low))',
};
const statusAccent = {
  'To Do': 'hsl(var(--muted-foreground))',
  'In Progress': 'hsl(var(--info))',
  'Testing': 'hsl(var(--warning))',
  'Done': 'hsl(var(--success))',
};
const statusBg = {
  'To Do': 'hsl(var(--muted-foreground) / 0.15)',
  'In Progress': 'hsl(var(--info) / 0.15)',
  'Testing': 'hsl(var(--warning) / 0.15)',
  'Done': 'hsl(var(--success) / 0.15)',
};
const avatarColors = [
  'hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))',
  'hsl(var(--warning))', 'hsl(var(--type-epic))', 'hsl(var(--type-bug))',
];

function Avatar({ name, size = 28, id = 0 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: avatarColors[(id || 0) % avatarColors.length],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="item-detail-row" style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
      <span className="item-detail-label" style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', width: 96, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'hsl(var(--foreground))' }}>{children}</div>
    </div>
  );
}

// Status dropdown button (Jira style: "Done ▾")
function getScreenshotUrl(screenshot) {
  if (!screenshot) return '';
  if (typeof screenshot === 'string') return screenshot;
  const rawUrl = screenshot.url || screenshot.image || screenshot.screenshot_url || '';
  if (!rawUrl) return '';
  const apiOrigin = (API.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return rawUrl.startsWith('http') ? rawUrl : `${apiOrigin}${rawUrl}`;
}

function getCommentAttachments(comment) {
  const byIdOrUrl = new Map();
  [...(comment.attachments || []), ...(comment.uploaded_screenshots || [])].forEach((attachment, index) => {
    const url = getScreenshotUrl(attachment);
    if (!url) return;
    const key = attachment?.id || url || index;
    byIdOrUrl.set(key, attachment);
  });
  return Array.from(byIdOrUrl.values());
}

function getCommentTimestamp(comment) {
  const value = comment?.created_at ? new Date(comment.created_at).getTime() : 0;
  return Number.isNaN(value) ? 0 : value;
}

function StatusDropdown({ current, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const acc = statusAccent[current] || 'hsl(var(--primary))';
  const bg = statusBg[current] || 'hsl(var(--primary) / 0.15)';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 5, border: 'none',
          backgroundColor: bg, color: acc,
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        {current}
        <ChevronDown size={12} color="currentColor" />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 100,
          backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
          borderRadius: 6, boxShadow: 'var(--shadow-lg)', minWidth: 160, overflow: 'hidden',
        }}>
          {options.map((s) => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                fontSize: 13, fontWeight: s === current ? 700 : 400,
                backgroundColor: s === current ? statusBg[s] : 'transparent',
                color: s === current ? statusAccent[s] : 'hsl(var(--foreground))',
              }}
              onMouseEnter={(e) => { if (s !== current) e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; }}
              onMouseLeave={(e) => { if (s !== current) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusAccent[s], flexShrink: 0 }} />
              {s}
              {s === current && (
                <Check size={13} color="currentColor" style={{ marginLeft: 'auto' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ItemDetailModal({ item, onClose, onStatusChange, onAssigneeChange, onUpdate }) {
  const { user } = useAuth();
  const { onDataUpdate } = useNotifications();
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [comments, setComments] = useState(item.comments || []);
  const [attachments, setAttachments] = useState(item.screenshots || []);
  const [commentFiles, setCommentFiles] = useState([]);
  const [commentPreviews, setCommentPreviews] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(item.status);
  const [lightbox, setLightbox] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAttachments, setShowAttachments] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [projectMembers, setProjectMembers] = useState([]);
  const [assignee, setAssignee] = useState(item.assignee);
  const [assigning, setAssigning] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [likes, setLikes] = useState(() => {
    const initialLikes = {};
    (item.comments || []).forEach(c => {
      if (c.id) initialLikes[c.id] = { count: c.likes_count || 0, liked: c.user_has_liked || false };
    });
    return initialLikes;
  });
  const [expandedComments, setExpandedComments] = useState({});

  // SubTask state
  const [subtasks, setSubtasks] = useState(item.subtasks || []);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskForm, setSubtaskForm] = useState({ title: '', description: '', status: 'To Do', assignee: '', priority: 'medium', due_date: '' });
  const [savingSubtask, setSavingSubtask] = useState(false);
  const [subtaskError, setSubtaskError] = useState('');
  const fileInputRef = useRef(null);
  const commentsRef = useRef(comments);
  const attachmentsRef = useRef(attachments);

  const canAssign = ['qa_tester', 'admin', 'manager'].includes(user?.role);
  const canManageSubtasks = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const appendComment = useCallback((newComment) => {
    if (!newComment) return;
    const exists = newComment.id && commentsRef.current.some((c) => c.id === newComment.id);
    if (exists) return;

    const nextComments = [newComment, ...commentsRef.current];
    const commentAttachments = getCommentAttachments(newComment);
    const nextAttachments = commentAttachments.length
      ? [...attachmentsRef.current, ...commentAttachments]
      : attachmentsRef.current;

    commentsRef.current = nextComments;
    attachmentsRef.current = nextAttachments;
    setComments(nextComments);
    setAttachments(nextAttachments);
    onUpdate?.({ comments: nextComments, screenshots: nextAttachments });

    if (commentAttachments.length) {
      setShowAttachments(true);
    }
    if (newComment.id) {
      setLikes(prev => ({ ...prev, [newComment.id]: { count: newComment.likes_count || 0, liked: newComment.user_has_liked || false } }));
    }
  }, [onUpdate]);

  // Real-time comment updates
  useEffect(() => {
    return onDataUpdate((data) => {
      console.log('🔄 ItemDetailModal received WebSocket data:', data);
      
      if (data.entity === 'comment' && data.action === 'created') {
        const { issue_id, comment } = data.data;
        console.log('📝 New comment for issue:', issue_id, 'Current item:', item.id);
        
        if (item.id === issue_id) {
          console.log('✅ Updating modal comments');
          appendComment(comment);
        }
      }
      
      // Handle like updates
      if (data.entity === 'comment_like' && data.action === 'toggled') {
        const { issue_id, comment_id, likes_count, user_id, liked } = data.data;
        
        if (item.id === issue_id) {
          console.log('👍 Like update for comment:', comment_id);
          setLikes(prev => ({
            ...prev,
            [comment_id]: {
              count: likes_count,
              liked: user_id === user?.id ? liked : prev[comment_id]?.liked || false
            }
          }));
        }
      }
    });
  }, [item.id, onDataUpdate, user?.id, appendComment]);

  useEffect(() => {
    if (canAssign && item.project) {
      API.get(`/projects/${item.project}/`)
        .then((res) => setProjectMembers(res.data.team_members || []))
        .catch(() => {});
    }
  }, [item.project, canAssign]);

  useEffect(() => {
    return () => {
      commentPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [commentPreviews]);

  const handleAssign = async (userId) => {
    setAssigning(true);
    try {
      let res;
      if (item.itemType === 'task' && item.project && item.task_id) {
        res = await API.patch(`/projects/${item.project}/tasks/${item.task_id}/`, { assignee: userId || null });
      } else {
        res = await API.patch(`/projects/issues/${item.id}/`, { assignee: userId || null });
      }
      setAssignee(res.data.assignee);
      onAssigneeChange?.(res.data.assignee);
    } catch (e) { console.error(e); }
    finally { setAssigning(false); }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!subtaskForm.title.trim()) return;
    setSavingSubtask(true);
    setSubtaskError('');
    try {
      const res = await subtaskService.create(item.id, {
        title: subtaskForm.title.trim(),
        description: subtaskForm.description.trim(),
        status: subtaskForm.status,
        priority: subtaskForm.priority,
        assignee: subtaskForm.assignee || null,
        due_date: subtaskForm.due_date || null,
      });
      setSubtasks(prev => [...prev, res.data]);
      setSubtaskForm({ title: '', description: '', status: 'To Do', assignee: '', priority: 'medium', due_date: '' });
      setShowSubtaskForm(false);
    } catch (err) {
      const data = err?.response?.data || {};
      const message = data.error || data.detail || Object.values(data).flat?.().join(' ') || 'Unable to add sub-task.';
      setSubtaskError(message);
    }
    finally { setSavingSubtask(false); }
  };

  const handleSubtaskStatusChange = async (subtask, newStatus) => {
    try {
      await subtaskService.update(subtask.id, { status: newStatus });
      setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, status: newStatus } : s));
    } catch (err) { console.error(err); }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await subtaskService.delete(subtaskId);
      setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
    } catch (err) { console.error(err); }
  };

  const isIssue = item.itemType === 'issue';
  const isTask = item.itemType === 'task';
  const isSubtask = item.itemType === 'subtask';
  const canAttachComment = (isIssue || isTask || isSubtask);  // Allow attachments for all types
  const columns = isIssue
    ? ['To Do', 'In Progress', 'Testing', 'Blocked', 'Done']
    : ['To Do', 'In Progress', 'Testing', 'Blocked', 'Done'];

  const handleStatusChange = (newStatus) => {
    if (newStatus === currentStatus) return;
    setCurrentStatus(newStatus);
    onStatusChange?.(item.id, newStatus, item.itemType);
    // WebSocket events will be triggered by backend automatically
  };

  const handleSelectCommentFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setCommentFiles((prev) => [...prev, ...files]);
    setCommentPreviews((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
    event.target.value = '';
  };

  const clearCommentDraft = () => {
    setComment('');
    commentPreviews.forEach((url) => URL.revokeObjectURL(url));
    setCommentFiles([]);
    setCommentPreviews([]);
  };

  const removeCommentFile = (index) => {
    URL.revokeObjectURL(commentPreviews[index]);
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
    setCommentPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePostComment = async () => {
    if (!comment.trim() && commentFiles.length === 0) return;
    setPosting(true);
    try {
      let res;
      if (isIssue) {
        console.log('💬 ItemDetailModal adding comment to issue:', comment.trim());
        if (commentFiles.length > 0) {
          const formData = new FormData();
          formData.append('text', comment.trim());
          commentFiles.forEach((file) => formData.append('screenshots', file));
          res = await issueService.addComment(item.id, formData);
        } else {
          res = await issueService.addComment(item.id, { text: comment.trim() });
        }
        console.log('✅ ItemDetailModal comment added:', res.data);
      } else if (item.itemType === 'subtask') {
        // Subtask: add comment to parent task
        console.log('💬 ItemDetailModal adding comment to subtask (parent task):', comment.trim());
        const taskCommentPayload = commentFiles.length > 0 ? new FormData() : { text: comment.trim() };
        if (commentFiles.length > 0) {
          taskCommentPayload.append('text', comment.trim());
          commentFiles.forEach((file) => taskCommentPayload.append('screenshots', file));
        }
        if (item.project && item.task_id) {
          res = await API.post(`/projects/${item.project}/tasks/${item.task_id}/comments/`, taskCommentPayload);
        } else {
          console.error('❌ Missing project or task_id for subtask comment');
        }
      } else {
        // Task: add comment to task
        console.log('💬 ItemDetailModal adding comment to task:', comment.trim());
        const taskCommentPayload = commentFiles.length > 0 ? new FormData() : { text: comment.trim() };
        if (commentFiles.length > 0) {
          taskCommentPayload.append('text', comment.trim());
          commentFiles.forEach((file) => taskCommentPayload.append('screenshots', file));
        }
        if (item.project && item.task_id) {
          res = await API.post(`/projects/${item.project}/tasks/${item.task_id}/comments/`, taskCommentPayload);
        } else {
          const tasksRes = await API.get('/projects/tasks/my-tasks/');
          const task = tasksRes.data.find(t => t.id === item.id);
          if (task) res = await API.post(`/projects/${task.project}/tasks/${task.task_id}/comments/`, taskCommentPayload);
        }
      }
      if (res?.data) {
        appendComment(res.data);
        console.log('✅ ItemDetailModal local state updated');
      }
      clearCommentDraft();
    } catch (e) { 
      console.error('❌ ItemDetailModal comment error:', e);
    }
    finally { setPosting(false); }
  };

  const formatCommentTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const itemLabel = item.itemType === 'subtask' 
    ? 'Sub-Task'
    : item.issue_type
    ? item.issue_type.charAt(0).toUpperCase() + item.issue_type.slice(1)
    : item.itemType === 'task' ? 'Task' : 'Issue';

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isNarrow = useMediaQuery('(max-width: 900px)');

  const content = (
    <div style={{
      backgroundColor: 'hsl(var(--card))',
      borderRadius: isMobile ? 8 : 6,
      width: '100%',
      maxWidth: isMobile ? 'calc(100vw - 16px)' : isNarrow ? 'calc(100vw - 32px)' : 1000,
      maxHeight: isMobile ? 'calc(100dvh - 16px)' : '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      border: '1px solid hsl(var(--border))',
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '10px 12px' : '12px 20px',
        borderBottom: '1px solid hsl(var(--border))',
        flexShrink: 0,
        gap: 12,
        backgroundColor: 'hsl(var(--muted) / 0.3)',
      }}>
        {/* Breadcrumb Box */}
        <div style={{
        display: 'inline-flex', alignItems: 'center', gap: isMobile ? 6 : 8,
        padding: isMobile ? '5px 8px' : '5px 12px',
        borderRadius: 5,
        backgroundColor: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
        minWidth: 0,
        overflow: 'hidden',
      }}>
          {/* Project Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Home size={14} color="hsl(var(--muted-foreground))" />
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: 'hsl(var(--muted-foreground))',
              maxWidth: isMobile ? 92 : 140, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.project_name}
            </span>
          </div>

          {/* Separator */}
          <div style={{
            width: 1, height: 16,
            backgroundColor: 'hsl(var(--border))',
          }} />

          {/* Issue Type Badge */}
          <div style={{ position: 'relative' }}>
            <div
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '3px 7px' : '3px 10px', borderRadius: 4,
                backgroundColor: isIssue
                  ? item.issue_type === 'bug'
                    ? 'hsl(var(--type-bug) / 0.12)'
                    : item.issue_type === 'story'
                    ? 'hsl(var(--type-story) / 0.12)'
                    : 'hsl(var(--type-task) / 0.12)'
                  : 'hsl(var(--type-task) / 0.12)',
                cursor: 'default',
              }}
            >
              {isIssue && item.issue_type === 'bug' ? (
                <Bug size={12} color={isIssue
                  ? item.issue_type === 'bug'
                    ? 'hsl(var(--type-bug))'
                    : item.issue_type === 'story'
                    ? 'hsl(var(--type-story))'
                    : 'hsl(var(--type-task))'
                  : 'hsl(var(--type-task))'} />
              ) : isIssue && item.issue_type === 'story' ? (
                <Target size={12} color={isIssue
                  ? item.issue_type === 'bug'
                    ? 'hsl(var(--type-bug))'
                    : item.issue_type === 'story'
                    ? 'hsl(var(--type-story))'
                    : 'hsl(var(--type-task))'
                  : 'hsl(var(--type-task))'} />
              ) : (
                <Flag size={12} color={isIssue
                  ? item.issue_type === 'bug'
                    ? 'hsl(var(--type-bug))'
                    : item.issue_type === 'story'
                    ? 'hsl(var(--type-story))'
                    : 'hsl(var(--type-task))'
                  : 'hsl(var(--type-task))'} />
              )}
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: isIssue
                  ? item.issue_type === 'bug'
                    ? 'hsl(var(--type-bug))'
                    : item.issue_type === 'story'
                    ? 'hsl(var(--type-story))'
                    : 'hsl(var(--type-task))'
                  : 'hsl(var(--type-task))',
                textTransform: 'capitalize',
              }}>
                {itemLabel}
              </span>
            </div>
            {showTooltip && (
              <div style={{
                position: 'absolute', top: '130%', left: 0, zIndex: 200,
                backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))',
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                whiteSpace: 'nowrap', boxShadow: 'var(--shadow-lg)',
                pointerEvents: 'none', maxWidth: 300,
              }}>
                {item.title}
              </div>
            )}
          </div>
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Close */}
          <button
            title="Close"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 6,
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))',
              fontSize: 16, transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)';
              e.currentTarget.style.color = 'hsl(var(--destructive))';
              e.currentTarget.style.borderColor = 'hsl(var(--destructive) / 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
              e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
              e.currentTarget.style.borderColor = 'hsl(var(--border))';
            }}
          ><X size={16} /></button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flexDirection: isNarrow ? 'column' : 'row', flex: 1, overflow: 'hidden' }}>

        {/* ── Left Panel ── */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: isMobile ? '14px 12px' : '20px 24px', backgroundColor: 'hsl(var(--background))' }} className="scrollbar-thin">

          {/* Title + meta */}
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid hsl(var(--border))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {isIssue && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  backgroundColor: item.issue_type === 'bug' ? 'hsl(var(--type-bug) / 0.12)' : item.issue_type === 'story' ? 'hsl(var(--type-story) / 0.12)' : 'hsl(var(--type-task) / 0.12)',
                  color: item.issue_type === 'bug' ? 'hsl(var(--type-bug))' : item.issue_type === 'story' ? 'hsl(var(--type-story))' : 'hsl(var(--type-task))' }}>
                  {item.issue_type === 'bug' ? <Bug size={11} /> : item.issue_type === 'story' ? <Target size={11} /> : <Flag size={11} />}
                  <span style={{ textTransform: 'capitalize' }}>{item.issue_type}</span>
                </div>
              )}
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                backgroundColor: statusBg[currentStatus], color: statusAccent[currentStatus] }}>
                {currentStatus}
              </span>
              {item.priority && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {item.priority === 'highest' ? <ChevronsUp size={13} color={priorityColor[item.priority]} strokeWidth={2.5} /> : item.priority === 'high' ? <ChevronUp size={13} color={priorityColor[item.priority]} strokeWidth={2.5} /> : item.priority === 'low' ? <ChevronDown size={13} color={priorityColor[item.priority]} strokeWidth={2.5} /> : <Equal size={13} color={priorityColor[item.priority]} strokeWidth={2.5} />}
                  <span style={{ fontSize: 11, fontWeight: 600, color: priorityColor[item.priority], textTransform: 'capitalize' }}>{item.priority}</span>
                </div>
              )}
            </div>
            <h1 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>
              {item.title}
            </h1>
          </div>

          {/* Description */}
          <section style={{ marginBottom: 20 }}>
            <div
              onClick={() => setShowDescription(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: showDescription ? 10 : 0, padding: '6px 0' }}
            >
              <ChevronRight size={14} color="hsl(var(--muted-foreground))" style={{ transform: showDescription ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
              <AlignLeft size={13} color="hsl(var(--muted-foreground))" />
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</h3>
            </div>
            {showDescription && (
              <div style={{ padding: '10px 14px', fontSize: 13, color: item.description ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', lineHeight: 1.7, whiteSpace: 'pre-wrap', backgroundColor: 'hsl(var(--muted) / 0.4)', borderRadius: 8, border: '1px solid hsl(var(--border))' }}>
                {item.description || 'No description provided.'}
              </div>
            )}
          </section>

          {/* SubTasks - only for tasks */}
          {!isIssue && (
            <section style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', marginBottom: 10, padding: '6px 0', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ListChecks size={13} color="hsl(var(--muted-foreground))" />
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Sub-Tasks ({subtasks.length})
                  </h3>
                </div>
                {canManageSubtasks && (
                  <button
                    onClick={() => setShowSubtaskForm(p => !p)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Plus size={12} /> Add Sub-Task
                  </button>
                )}
              </div>

              {showSubtaskForm && (
                <form onSubmit={handleAddSubtask} style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.3)', marginBottom: 10 }}>
                  {subtaskError && (
                    <div style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid hsl(var(--destructive) / 0.25)', backgroundColor: 'hsl(var(--destructive) / 0.08)', color: 'hsl(var(--destructive))', fontSize: 12 }}>
                      {subtaskError}
                    </div>
                  )}
                  <input
                    autoFocus
                    value={subtaskForm.title}
                    onChange={e => setSubtaskForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Sub-task title (e.g. Frontend UI, Backend API)"
                    required
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, outline: 'none' }}
                  />
                  <textarea
                    value={subtaskForm.description}
                    onChange={e => setSubtaskForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Sub-task description"
                    rows={2}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, outline: 'none', resize: 'vertical' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                    <select value={subtaskForm.status} onChange={e => setSubtaskForm(p => ({ ...p, status: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 12 }}>
                      {['To Do','In Progress','Testing','Done'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={subtaskForm.priority} onChange={e => setSubtaskForm(p => ({ ...p, priority: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 12 }}>
                      {['highest','high','medium','low','lowest'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                    </select>
                    <select value={subtaskForm.assignee} onChange={e => setSubtaskForm(p => ({ ...p, assignee: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 12 }}>
                      <option value="">Unassigned</option>
                      {projectMembers.map(m => <option key={m.user.id} value={m.user.id}>{getDisplayName(m.user)}</option>)}
                    </select>
                    <input type="date" value={subtaskForm.due_date} onChange={e => setSubtaskForm(p => ({ ...p, due_date: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 12 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => { setShowSubtaskForm(false); setSubtaskError(''); }} style={{ padding: '6px 14px', borderRadius: 5, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={savingSubtask} style={{ padding: '6px 14px', borderRadius: 5, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {savingSubtask ? 'Saving...' : 'Add'}
                    </button>
                  </div>
                </form>
              )}

              {subtasks.length === 0 ? (
                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', padding: '8px 0' }}>No sub-tasks yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {subtasks.map(st => (
                    <div key={st.id} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                      <select
                        value={st.status}
                        onChange={e => handleSubtaskStatusChange(st, e.target.value)}
                        style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid hsl(var(--border))', backgroundColor: statusBg[st.status] || 'hsl(var(--muted))', color: statusAccent[st.status] || 'hsl(var(--foreground))', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                      >
                        {['To Do','In Progress','Testing','Done'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 13, color: 'hsl(var(--foreground))', textDecoration: st.status === 'Done' ? 'line-through' : 'none', opacity: st.status === 'Done' ? 0.6 : 1, wordBreak: 'break-word' }}>{st.title}</span>
                        {(st.description || st.due_date) && (
                          <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: 'hsl(var(--muted-foreground))', lineHeight: 1.4 }}>
                            {[st.description, st.due_date ? `Due: ${new Date(st.due_date).toLocaleDateString('en-IN')}` : ''].filter(Boolean).join(' | ')}
                          </span>
                        )}
                      </div>
                      {st.assignee && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Avatar name={getDisplayName(st.assignee)} size={20} id={st.assignee.id} />
                          <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{getDisplayName(st.assignee)}</span>
                        </div>
                      )}
                      {canManageSubtasks && (
                        <button onClick={() => handleDeleteSubtask(st.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 2, display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Screenshots */}
          {isIssue && attachments.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <div
                onClick={() => setShowAttachments(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: showAttachments ? 12 : 0 }}
              >
                <ChevronRight size={14} color="hsl(var(--muted-foreground))" style={{ transform: showAttachments ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                <Paperclip size={13} color="hsl(var(--muted-foreground))" />
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Attachments ({attachments.length})</h3>
              </div>
              {showAttachments && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingLeft: 22 }}>
                  {attachments.map((s, i) => {
                    const imgUrl = getScreenshotUrl(s);
                    return (
                      <div
                        key={i}
                        onClick={() => setLightbox(imgUrl)}
                        style={{ width: 80, height: 60, borderRadius: 6, overflow: 'hidden', border: '2px solid hsl(var(--border))', cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s, transform 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.transform = 'scale(1.04)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <img src={imgUrl} alt={`attachment-${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Activity */}
          <section style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Activity</h3>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', fontWeight: 600 }}>
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Add Comment Box */}
              <div style={{ display: 'flex', gap: isMobile ? 8 : 12, marginBottom: 22, flexShrink: 0 }}>
                {!isMobile && <Avatar name={user?.name} size={36} id={user?.id || 0} />}
                <div style={{ 
                  flex: 1, 
                  border: comment.trim() || commentFiles.length > 0 ? '1px solid hsl(var(--primary) / 0.75)' : '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  overflow: 'hidden', 
                  transition: 'all 0.2s ease',
                  backgroundColor: 'hsl(var(--card))',
                  position: 'relative',
                  boxShadow: comment.trim() || commentFiles.length > 0 ? '0 0 0 3px hsl(var(--primary) / 0.08)' : 'none'
                }}>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isIssue ? 'Add a test note, rejection reason, or update...' : 'Add a comment...'}
                    rows={comment.trim() || commentFiles.length > 0 ? 4 : 3}
                    style={{
                      width: '100%', 
                      padding: '13px 14px', 
                      fontSize: 13,
                      border: 'none', 
                      backgroundColor: 'transparent',
                      color: 'hsl(var(--foreground))', 
                      outline: 'none', 
                      resize: 'none',
                      fontFamily: 'inherit', 
                      boxSizing: 'border-box',
                      lineHeight: 1.55,
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = 'hsl(var(--primary) / 0.75)';
                      e.target.parentElement.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.08)';
                    }}
                    onBlur={(e) => {
                      if (!comment.trim() && commentFiles.length === 0) {
                        e.target.parentElement.style.borderColor = 'hsl(var(--border))';
                        e.target.parentElement.style.boxShadow = 'none';
                      }
                    }}
                  />
                  {commentPreviews.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 14px 12px' }}>
                      {commentPreviews.map((preview, index) => (
                        <div key={preview} style={{ position: 'relative', width: 84, height: 62, borderRadius: 6, overflow: 'hidden', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted))' }}>
                          <img src={preview} alt={`upload-${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          <button
                            type="button"
                            onClick={() => removeCommentFile(index)}
                            style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                          >
                            <X size={11} color="#fff" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(canAttachComment || comment.trim() || commentFiles.length > 0) && (
                    <div style={{ 
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'stretch' : 'center',
                      justifyContent: 'space-between', 
                      gap: 10, 
                      padding: '9px 10px 9px 12px', 
                      borderTop: '1px solid hsl(var(--border) / 0.5)', 
                      backgroundColor: 'hsl(var(--muted) / 0.22)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ 
                          fontSize: 11, 
                          color: 'hsl(var(--muted-foreground))',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span style={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            backgroundColor: 'hsl(var(--success))',
                            display: 'inline-block'
                          }}></span>
                          {comment.length} chars
                          {commentFiles.length > 0 ? ` · ${commentFiles.length} attachment${commentFiles.length > 1 ? 's' : ''}` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                        {canAttachComment && (
                          <>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleSelectCommentFiles}
                              style={{ display: 'none' }}
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, flex: isMobile ? '1 1 90px' : '0 0 auto' }}
                            >
                              <Paperclip size={13} />
                              Attach
                            </button>
                          </>
                        )}
                        <button 
                          onClick={clearCommentDraft}
                          style={{ 
                            padding: '6px 14px',
                            borderRadius: 6, 
                            border: '1px solid hsl(var(--border))', 
                            backgroundColor: 'hsl(var(--background))', 
                            color: 'hsl(var(--muted-foreground))', 
                            fontSize: 12, 
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            flex: isMobile ? '1 1 90px' : '0 0 auto'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'hsl(var(--muted))';
                            e.target.style.borderColor = 'hsl(var(--muted-foreground) / 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'hsl(var(--background))';
                            e.target.style.borderColor = 'hsl(var(--border))';
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handlePostComment} 
                          disabled={posting || (!comment.trim() && commentFiles.length === 0)}
                          style={{ 
                            padding: '6px 18px', 
                            borderRadius: 6, 
                            border: 'none', 
                            backgroundColor: posting ? 'hsl(var(--muted))' : 'hsl(var(--primary))', 
                            color: posting ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))', 
                            fontSize: 12, 
                            fontWeight: 600, 
                            cursor: posting ? 'not-allowed' : 'pointer', 
                            opacity: posting ? 0.7 : 1,
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: !posting ? '0 2px 8px hsl(var(--primary) / 0.2)' : 'none',
                            justifyContent: 'center',
                            flex: isMobile ? '1 1 90px' : '0 0 auto'
                          }}
                          onMouseEnter={(e) => {
                            if (!posting) {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!posting) {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px hsl(var(--primary) / 0.2)';
                            }
                          }}
                        >
                          {posting ? (
                            <>
                              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                              Posting...
                            </>
                          ) : (
                            <>
                              <MessageCircle size={14} />
                              Post
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments List with nested replies - Scrollable */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }} className="scrollbar-thin">
                {comments.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No comments yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {comments
                      .filter(c => !c.parent_id) // Only show top-level comments
                      .sort((a, b) => getCommentTimestamp(b) - getCommentTimestamp(a))
                      .map((c, i) => {
                        const authorName = c.author ? getDisplayName(c.author) : (c.author_name || 'Unknown');
                        const commentAttachments = getCommentAttachments(c);
                        const cKey = c.id || i;
                        const likeData = likes[cKey] || { count: c.likes_count || 0, liked: c.user_has_liked || false };
                        const isLiked = likeData.liked;
                        const likeCount = likeData.count;
                        
                        // Get replies for this comment
                        const replies = comments
                          .filter(reply => reply.parent_id === c.id)
                          .sort((a, b) => getCommentTimestamp(b) - getCommentTimestamp(a));
                        const showReplies = expandedComments[cKey];

                        return (
                          <div key={cKey} style={{ marginBottom: 18 }}>
                            {/* Main Comment */}
                            <div style={{ display: 'flex', gap: 10, padding: '8px 0' }}>
                              <Avatar name={authorName} size={28} id={c.author?.id || i} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Name + time */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{authorName}</span>
                                  <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                                    {formatCommentTime(c.created_at)}
                                  </span>
                                </div>

                                {/* Comment bubble */}
                                <div style={{ fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.55, padding: '9px 12px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px 10px 10px 10px', display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word', marginBottom: 8 }}>
                                  {c.text}
                                </div>

                                {commentAttachments.length > 0 && (
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                    {commentAttachments.map((s, si) => {
                                      const imgUrl = getScreenshotUrl(s);
                                      return (
                                        <button
                                          key={s.id || si}
                                          type="button"
                                          onClick={() => setLightbox(imgUrl)}
                                          style={{ width: 92, height: 66, borderRadius: 6, overflow: 'hidden', border: '1px solid hsl(var(--border))', padding: 0, backgroundColor: 'hsl(var(--muted))', cursor: 'pointer' }}
                                        >
                                          <img src={imgUrl} alt={`comment-attachment-${si + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Action buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <button
                                    onClick={async () => {
                                      const cKey = c.id || i;
                                      try {
                                        const res = await issueService.toggleCommentLike(c.id);
                                        setLikes(p => ({ 
                                          ...p, 
                                          [cKey]: { 
                                            liked: res.data.liked, 
                                            count: res.data.likes_count 
                                          } 
                                        }));
                                      } catch (e) {
                                        console.error('Like error:', e);
                                      }
                                    }}
                                    style={{ fontSize: 11, fontWeight: 600, color: isLiked ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 4 }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <ThumbsUp size={11} fill={isLiked ? 'hsl(var(--primary))' : 'none'} />
                                    {likeCount > 0 && <span>{likeCount}</span>}
                                  </button>
                                  
                                  <button
                                    onClick={() => { setReplyingTo(cKey); setReplyText(`@${authorName} `); }}
                                    style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--primary))'; e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  >
                                    Reply
                                  </button>
                                </div>

                                {/* Inline Reply Box */}
                                {replyingTo === cKey && (
                                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    {!isMobile && <Avatar name={user?.name} size={26} id={user?.id || 0} />}
                                    <div style={{ flex: 1, border: '1px solid hsl(var(--primary) / 0.5)', borderRadius: 8, overflow: 'hidden', backgroundColor: 'hsl(var(--background))' }}>
                                      <textarea
                                        autoFocus
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Reply to ${authorName}...`}
                                        rows={2}
                                        style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: 'none', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                      />
                                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '6px 10px', borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
                                        <button
                                          onClick={async () => {
                                            if (!replyText.trim()) return;
                                            setPosting(true);
                                            try {
                                              let res;
                                              if (isIssue) {
                                                res = await issueService.addComment(item.id, { text: replyText.trim(), parent_id: c.id });
                                              }
                                              if (res?.data) setComments(prev => [...prev, res.data]);
                                              setReplyText(''); setReplyingTo(null);
                                            } catch (e) { console.error(e); }
                                            finally { setPosting(false); }
                                          }}
                                          style={{ padding: '4px 14px', borderRadius: 5, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                                        >Reply</button>
                                        <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                          style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 11, cursor: 'pointer' }}
                                        >Cancel</button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Show Replies Toggle */}
                            {replies.length > 0 && (
                              <div style={{ marginLeft: isMobile ? 0 : 44, marginTop: 8, marginBottom: 8 }}>
                                <button
                                  onClick={() => setExpandedComments(prev => ({ ...prev, [cKey]: !prev[cKey] }))}
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 6, 
                                    padding: '4px 8px', 
                                    borderRadius: 16, 
                                    border: 'none', 
                                    backgroundColor: 'hsl(var(--primary) / 0.1)', 
                                    color: 'hsl(var(--primary))', 
                                    fontSize: 11, 
                                    fontWeight: 600, 
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.2)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.1)'}
                                >
                                  <Avatar name={replies[0].author?.name || 'U'} size={16} id={replies[0].author?.id || 0} />
                                  <ChevronDown size={10} style={{ transform: showReplies ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                                </button>
                              </div>
                            )}

                            {/* Nested Replies */}
                            {showReplies && replies.length > 0 && (
                              <div style={{ marginLeft: isMobile ? 0 : 44, paddingLeft: isMobile ? 10 : 16, borderLeft: '2px solid hsl(var(--border))' }}>
                                {replies.map((reply, ri) => {
                                  const replyAuthorName = reply.author?.first_name
                                    ? `${reply.author.first_name} ${reply.author.last_name || ''}`.trim()
                                    : (reply.author?.name || reply.author_name || 'Unknown');
                                  const replyKey = reply.id || `reply-${ri}`;
                                  const replyLikeData = likes[replyKey] || { count: reply.likes_count || 0, liked: reply.user_has_liked || false };
                                  const isReplyLiked = replyLikeData.liked;
                                  const replyLikeCount = replyLikeData.count;

                                  return (
                                    <div key={replyKey} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: ri < replies.length - 1 ? '1px solid hsl(var(--border) / 0.3)' : 'none' }}>
                                      <Avatar name={replyAuthorName} size={28} id={reply.author?.id || ri} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                          <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{replyAuthorName}</span>
                                          <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
                                            {formatCommentTime(reply.created_at)}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'hsl(var(--foreground))', lineHeight: 1.5, padding: '6px 10px', backgroundColor: 'hsl(var(--muted) / 0.7)', borderRadius: '4px 10px 10px 10px', display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word', marginBottom: 6 }}>
                                          {reply.text}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <button
                                            onClick={async () => {
                                              const replyKey = reply.id || `reply-${ri}`;
                                              try {
                                                const res = await issueService.toggleCommentLike(reply.id);
                                                setLikes(p => ({ 
                                                  ...p, 
                                                  [replyKey]: { 
                                                    liked: res.data.liked, 
                                                    count: res.data.likes_count 
                                                  } 
                                                }));
                                              } catch (e) {
                                                console.error('Like error:', e);
                                              }
                                            }}
                                            style={{ fontSize: 10, fontWeight: 600, color: isReplyLiked ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 3, borderRadius: 3 }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                          >
                                            <ThumbsUp size={9} fill={isReplyLiked ? 'hsl(var(--primary))' : 'none'} />
                                            {replyLikeCount > 0 && <span>{replyLikeCount}</span>}
                                          </button>
                                          <button
                                            onClick={() => { setReplyingTo(cKey); setReplyText(`@${replyAuthorName} `); }}
                                            style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 3 }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--primary))'; e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                          >
                                            Reply
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ── Right Panel ── */}
        <div style={{ width: isNarrow ? '100%' : 280, flexShrink: 0, maxHeight: isNarrow ? (isMobile ? '38dvh' : '32vh') : 'none', overflowY: 'auto', borderLeft: isNarrow ? 'none' : '1px solid hsl(var(--border))', borderTop: isNarrow ? '1px solid hsl(var(--border))' : 'none', backgroundColor: 'hsl(var(--background))' }} className="scrollbar-thin">

          {/* Status Dropdown at top */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
            <StatusDropdown
              current={currentStatus}
              options={columns}
              onChange={handleStatusChange}
            />
          </div>

          {/* Details */}
          <div style={{ padding: '12px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Details</p>
            <div style={{ borderTop: '1px solid hsl(var(--border) / 0.5)' }}>

              <DetailRow label="Assignee">
                {canAssign ? (
                  <div style={{ position: 'relative' }}>
                    <select
                      value={assignee?.id || ''}
                      onChange={(e) => handleAssign(e.target.value ? Number(e.target.value) : null)}
                      disabled={assigning}
                      style={{
                        width: '100%', padding: '5px 24px 5px 8px', borderRadius: 5, fontSize: 12,
                        border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))', cursor: 'pointer', outline: 'none', appearance: 'none',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                      onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                    >
                      <option value=''>Unassigned</option>
                      {projectMembers.map((m) => (
                        <option key={m.user.id} value={m.user.id}>{getDisplayName(m.user)}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} color="hsl(var(--muted-foreground))" 
                      style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                ) : assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={getDisplayName(assignee)} size={22} id={assignee.id || 0} />
                    <span style={{ fontWeight: 500 }}>{getDisplayName(assignee)}</span>
                  </div>
                ) : (
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Unassigned</span>
                )}
              </DetailRow>

              <DetailRow label="Reporter">
                {(item.reported_by || item.reporter) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={getDisplayName(item.reported_by || item.reporter)} size={22} id={(item.reported_by || item.reporter).id || 1} />
                    <span style={{ fontWeight: 500 }}>{getDisplayName(item.reported_by || item.reporter)}</span>
                  </div>
                ) : (
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>
                )}
              </DetailRow>

              <DetailRow label="Priority">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {(() => {
                    const PIcon = item.priority === 'highest' ? ChevronsUp : item.priority === 'high' ? ChevronUp : item.priority === 'low' ? ChevronDown : Equal;
                    return <PIcon size={14} color={priorityColor[item.priority] || priorityColor.medium} strokeWidth={2.5} />;
                  })()}
                  <span style={{ color: priorityColor[item.priority] || priorityColor.medium, fontWeight: 600, textTransform: 'capitalize' }}>
                    {item.priority || 'Medium'}
                  </span>
                </div>
              </DetailRow>

              <DetailRow label="Type">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.issue_type === 'bug' ? <Bug size={13} color="hsl(var(--type-bug))" /> : item.issue_type === 'story' ? <Target size={13} color="hsl(var(--type-story))" /> : <Flag size={13} color="hsl(var(--type-task))" />}
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{item.issue_type || item.itemType || '—'}</span>
                </div>
              </DetailRow>

              <DetailRow label="Project">
                <span>{item.project_name || '—'}</span>
              </DetailRow>

              <DetailRow label="Created">
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} color="hsl(var(--muted-foreground))" />
                  <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</span>
                </div>
              </DetailRow>

              {item.due_date && (
                <DetailRow label="Due Date">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={12} color="hsl(var(--warning))" />
                    <span>{new Date(item.due_date).toLocaleDateString()}</span>
                  </div>
                </DetailRow>
              )}

              {item.estimate_hours && (
                <DetailRow label="Estimate">
                  <span>{item.estimate_hours}h</span>
                </DetailRow>
              )}

              {!!item.labels?.length && (
                <DetailRow label="Labels">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {item.labels.map((label) => (
                      <span key={label} style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))' }}>
                        {label}
                      </span>
                    ))}
                  </div>
                </DetailRow>
              )}

              {item.blocker_reason && (
                <DetailRow label="Blocker">
                  <span style={{ color: 'hsl(var(--destructive))', fontWeight: 600 }}>{item.blocker_reason}</span>
                </DetailRow>
              )}

              {typeof item.subtask_progress === 'number' && (
                <DetailRow label="Subtasks">
                  <span>{item.completed_subtask_count || 0}/{item.subtask_count || 0} done ({item.subtask_progress}%)</span>
                </DetailRow>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Centered modal with overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? 8 : 16,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {content}
      </div>

      {/* Screenshot Lightbox */}
      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: isMobile ? 10 : 24 }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Screenshot" style={{ maxWidth: isMobile ? '96vw' : '90vw', maxHeight: isMobile ? '86dvh' : '85vh', borderRadius: 8, boxShadow: '0 0 60px rgba(0,0,0,0.6)' }} />
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer', borderRadius: 6, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} color="#fff" />
          </button>
        </div>
      )}
    </>
  );
}
