import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { getProjects } from '../../services/projectService';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { getDisplayName, getInitials } from '../../utils/userUtils';
import { X, Image as ImageIcon, Send, User, Calendar, Flag, Folder, AlertCircle, MessageSquare, ChevronLeft, ChevronRight, Paperclip, AlignLeft, ThumbsUp, Smile, CornerDownRight, MoreHorizontal, Home, ChevronDown, Circle, Plus, ChevronsUp, ChevronUp, Equal, Edit2, Trash2, Bug, Zap, Target, ArrowUpCircle, Minus, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const typeStyle = { bug: { bg: 'hsl(var(--type-bug) / 0.12)', text: 'hsl(var(--type-bug))' }, task: { bg: 'hsl(var(--type-task) / 0.12)', text: 'hsl(var(--type-task))' }, story: { bg: 'hsl(var(--type-story) / 0.12)', text: 'hsl(var(--type-story))' } };
const statusStyle = { 'To Do': { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' }, 'In Progress': { bg: 'hsl(var(--info) / 0.12)', text: 'hsl(var(--info))' }, 'Testing': { bg: 'hsl(var(--warning) / 0.12)', text: 'hsl(var(--warning))' }, 'Done': { bg: 'hsl(var(--success) / 0.12)', text: 'hsl(var(--success))' } };

const priorityColor = {
  highest: 'hsl(var(--priority-highest))',
  high: 'hsl(var(--priority-high))',
  medium: 'hsl(var(--priority-medium))',
  low: 'hsl(var(--priority-low))',
};

const PRIORITY_CONFIG = {
  highest: { icon: ChevronsUp, text: 'Highest' },
  high:    { icon: ChevronUp,  text: 'High' },
  medium:  { icon: Equal,      text: 'Medium' },
  low:     { icon: ChevronDown,text: 'Low' },
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
      fontSize: size * 0.36, fontWeight: 700,
      color: 'hsl(var(--primary-foreground))', flexShrink: 0,
    }}>
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
      <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', width: 80, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <div style={{ flex: 1, fontSize: 13, color: 'hsl(var(--foreground))' }}>{children}</div>
    </div>
  );
}

function IssueDetail({ issue, onClose, onAddComment }) {
  const [comment, setComment] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [showDescription, setShowDescription] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);
  const [activityTab, setActivityTab] = useState('comments');
  const [posting, setPosting] = useState(false);

  // Combine new screenshots array + legacy single screenshot_url
  const allScreenshots = [
    ...(issue.screenshots || []).map((s) => s.url),
    ...((issue.screenshots?.length === 0 && issue.screenshot_url) ? [issue.screenshot_url] : []),
  ];

  const handlePostComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await onAddComment(issue.id, comment.trim());
      setComment('');
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  const isMobile = window.innerWidth < 768;

  const content = (
    <div style={{
      backgroundColor: 'hsl(var(--card))',
      borderRadius: 6,
      width: '100%',
      maxWidth: isMobile ? '95vw' : 1000,
      maxHeight: isMobile ? '95vh' : '85vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      border: '1px solid hsl(var(--border))',
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid hsl(var(--border))',
        flexShrink: 0,
        gap: 12,
        backgroundColor: 'hsl(var(--muted) / 0.3)',
      }}>
        {/* Breadcrumb Box */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 12px',
          borderRadius: 5,
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
        }}>
          {/* Project Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Home size={14} color="hsl(var(--muted-foreground))" />
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: 'hsl(var(--muted-foreground))',
              maxWidth: 140, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {issue.project_name}
            </span>
          </div>

          {/* Separator */}
          <div style={{
            width: 1, height: 16,
            backgroundColor: 'hsl(var(--border))',
          }} />

          {/* Issue Type Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 4,
            backgroundColor: issue.issue_type === 'bug'
              ? 'hsl(var(--type-bug) / 0.12)'
              : issue.issue_type === 'story'
              ? 'hsl(var(--type-story) / 0.12)'
              : 'hsl(var(--type-task) / 0.12)',
          }}>
            {issue.issue_type === 'bug' ? (
              <Bug size={12} color="hsl(var(--type-bug))" />
            ) : issue.issue_type === 'story' ? (
              <Target size={12} color="hsl(var(--type-story))" />
            ) : (
              <Flag size={12} color="hsl(var(--type-task))" />
            )}
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: issue.issue_type === 'bug'
                ? 'hsl(var(--type-bug))'
                : issue.issue_type === 'story'
                ? 'hsl(var(--type-story))'
                : 'hsl(var(--type-task))',
              textTransform: 'capitalize',
            }}>
              {issue.issue_type}
            </span>
          </div>

          {/* Status Badge */}
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
            backgroundColor: statusBg[issue.status],
            color: statusAccent[issue.status]
          }}>
            {issue.status}
          </span>

          {/* Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {issue.priority === 'highest' ? (
              <ArrowUpCircle size={8} color={priorityColor[issue.priority]} />
            ) : issue.priority === 'high' ? (
              <ArrowUp size={8} color={priorityColor[issue.priority]} />
            ) : issue.priority === 'medium' ? (
              <Minus size={8} color={priorityColor[issue.priority]} />
            ) : (
              <ArrowDown size={8} color={priorityColor[issue.priority]} />
            )}
            <span style={{ fontSize: 11, fontWeight: 600, color: priorityColor[issue.priority], textTransform: 'capitalize' }}>
              {issue.priority}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: 6,
            border: '1px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'hsl(var(--muted-foreground))',
            transition: 'all 0.15s',
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
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left Panel ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Title */}
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 20px', lineHeight: 1.3 }}>
            {issue.title}
          </h1>

          {/* Description */}
          <section style={{ marginBottom: 24 }}>
            <div
              onClick={() => setShowDescription(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: showDescription ? 8 : 0 }}
            >
              <ChevronRight size={14} color="hsl(var(--foreground))" style={{ transform: showDescription ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
              <AlignLeft size={13} color="hsl(var(--muted-foreground))" />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Description</h3>
            </div>
            {showDescription && (
              <div style={{ padding: '6px 0 0 22px', fontSize: 13, color: issue.description ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {issue.description || 'No description provided.'}
              </div>
            )}
          </section>

          {/* Screenshots */}
          {allScreenshots.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <div
                onClick={() => setShowAttachments(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: showAttachments ? 12 : 0 }}
              >
                <ChevronRight size={14} color="hsl(var(--foreground))" style={{ transform: showAttachments ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                <Paperclip size={13} color="hsl(var(--muted-foreground))" />
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Attachments ({allScreenshots.length})</h3>
              </div>
              {showAttachments && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingLeft: 22 }}>
                  {allScreenshots.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setLightbox(url)}
                      style={{ width: 80, height: 60, borderRadius: 6, overflow: 'hidden', border: '2px solid hsl(var(--border))', cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s, transform 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.transform = 'scale(1.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <img src={url} alt={`attachment-${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Activity Section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Activity</h3>
              <div style={{ display: 'inline-flex', border: '1px solid hsl(var(--border))', borderRadius: 6, overflow: 'hidden' }}>
                <button
                  onClick={() => setActivityTab('comments')}
                  style={{
                    padding: '6px 14px', border: 'none',
                    background: 'hsl(var(--primary))',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px',
                    color: 'hsl(var(--primary-foreground))',
                    transition: 'all 0.15s',
                  }}
                >
                  COMMENTS
                </button>
              </div>
            </div>

            {/* Add Comment Box */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <Avatar name="You" size={34} id={0} />
              <div style={{ flex: 1, borderBottom: '1px solid hsl(var(--border))', overflow: 'hidden', transition: 'border-color 0.15s' }}
                onFocusCapture={(e) => e.currentTarget.style.borderBottomColor = 'hsl(var(--primary))'}
                onBlurCapture={(e) => e.currentTarget.style.borderBottomColor = 'hsl(var(--border))'}
              >
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add more details or ask for an update..."
                  rows={comment ? 3 : 2}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13,
                    border: 'none', backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))', outline: 'none', resize: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                {comment.trim() && (
                  <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
                    <button onClick={handlePostComment} disabled={posting}
                      style={{ padding: '5px 16px', borderRadius: 5, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 12, fontWeight: 600, cursor: posting ? 'not-allowed' : 'pointer', opacity: posting ? 0.7 : 1 }}>
                      {posting ? 'Posting...' : 'Post'}
                    </button>
                    <button onClick={() => setComment('')}
                      style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 12, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Comments List */}
            {(!issue.comments || issue.comments.length === 0) ? (
              <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No comments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {issue.comments.map((c, i) => {
                  const authorName = getDisplayName(c.author) || 'Unknown';
                  return (
                    <div key={c.id || i} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: i < issue.comments.length - 1 ? '1px solid hsl(var(--border) / 0.4)' : 'none' }}>
                      <Avatar name={authorName} size={34} id={c.author?.id || i} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{authorName}</span>
                          <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                            {c.created_at ? new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.55, padding: '8px 12px', backgroundColor: 'hsl(var(--muted))', borderRadius: '4px 12px 12px 12px', display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word' }}>
                          {c.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Right Panel ── */}
        <div style={{ width: 280, flexShrink: 0, overflowY: 'auto', borderLeft: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}>

          {/* Status Badge at top */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 5,
              backgroundColor: statusBg[issue.status],
              color: statusAccent[issue.status],
              fontSize: 13, fontWeight: 700,
            }}>
              {issue.status}
            </div>
          </div>

          {/* Details */}
          <div style={{ padding: '12px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Details</p>
            <div style={{ borderTop: '1px solid hsl(var(--border) / 0.5)' }}>

              <DetailRow label="Assignee">
                {issue.assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={getDisplayName(issue.assignee)} size={22} id={issue.assignee.id || 0} />
                    <span style={{ fontWeight: 500 }}>{getDisplayName(issue.assignee)}</span>
                  </div>
                ) : (
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Unassigned</span>
                )}
              </DetailRow>

              <DetailRow label="Reporter">
                {issue.reported_by ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={getDisplayName(issue.reported_by)} size={22} id={issue.reported_by.id || 1} />
                    <span style={{ fontWeight: 500 }}>{getDisplayName(issue.reported_by)}</span>
                  </div>
                ) : (
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>You</span>
                )}
              </DetailRow>

              <DetailRow label="Priority">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {issue.priority === 'highest' ? (
                    <ArrowUpCircle size={10} color={priorityColor[issue.priority]} />
                  ) : issue.priority === 'high' ? (
                    <ArrowUp size={10} color={priorityColor[issue.priority]} />
                  ) : issue.priority === 'medium' ? (
                    <Minus size={10} color={priorityColor[issue.priority]} />
                  ) : (
                    <ArrowDown size={10} color={priorityColor[issue.priority]} />
                  )}
                  <span style={{ color: priorityColor[issue.priority], fontWeight: 600, textTransform: 'capitalize' }}>
                    {issue.priority}
                  </span>
                </div>
              </DetailRow>

              <DetailRow label="Type">
                <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                  {issue.issue_type}
                </span>
              </DetailRow>

              <DetailRow label="Project">
                <span>{issue.project_name}</span>
              </DetailRow>

              <DetailRow label="Created">
                <span>{new Date(issue.created_at).toLocaleDateString()}</span>
              </DetailRow>
            </div>

            {/* Status Info */}
            {issue.status !== 'Done' && (
              <div style={{ marginTop: 16, padding: '12px', backgroundColor: 'hsl(var(--info) / 0.08)', border: '1px solid hsl(var(--info) / 0.2)', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={14} color="hsl(var(--info))" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: 'hsl(var(--info))', lineHeight: 1.4 }}>Your team is working on this. You can add comments to track progress.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Lightbox */}
      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}
          onClick={() => setLightbox(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img src={lightbox} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 8, boxShadow: '0 0 60px rgba(0,0,0,0.6)' }} />
            <button onClick={() => setLightbox(null)}
              style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}
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
          padding: 16,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {content}
      </div>

      {/* Screenshot Lightbox */}
      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Screenshot" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8, boxShadow: '0 0 60px rgba(0,0,0,0.6)' }} />
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer', borderRadius: 6, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}

export function ReportIssueModal({ onClose, onSubmit, projects: propProjects, editIssue = null }) {
  const [fetchedProjects, setFetchedProjects] = useState([]);
  useEffect(() => {
    if (!propProjects || propProjects.length === 0) {
      getProjects().then(r => setFetchedProjects(r.data)).catch(() => {});
    }
  }, []);
  const projects = (propProjects && propProjects.length > 0) ? propProjects : fetchedProjects;
  const [form, setForm] = useState({
    title: editIssue?.title || '',
    description: editIssue?.description || '',
    issue_type: editIssue?.issue_type || 'bug',
    priority: editIssue?.priority || 'medium',
    project: editIssue?.project || (projects.length > 0 ? projects[0].id : ''),
    screenshots: [],
  });
  const [previews, setPreviews] = useState([]);
  const [previewIdx, setPreviewIdx] = useState(null);
  const [existingScreenshots, setExistingScreenshots] = useState(editIssue?.screenshots || []);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (projects.length > 0 && !form.project) set('project', projects[0].id);
  }, [projects]);

  const removeExistingScreenshot = (idx) => {
    setExistingScreenshots((prev) => prev.filter((_, i) => i !== idx));
  };

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
  const sel = { ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 30 };
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
        <div style={{ ...card, width: '100%', maxWidth: 800, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bug size={15} color="hsl(var(--primary))" />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.2 }}>{editIssue ? 'Edit Issue' : 'Report Issue'}</h2>
                <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: '2px 0 0' }}>{editIssue ? 'Update issue details' : 'Report a bug or request a feature'}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'hsl(var(--muted))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>

            {/* Row 1: Project + Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Project <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                {projects.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No projects available. Contact admin.</p>
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

            {/* Row 2: Issue Type + Priority as icon buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Issue Type</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.issue_type} onChange={(e) => set('issue_type', e.target.value)}
                    style={{ ...sel, paddingLeft: 32 }}>
                    {typeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {form.issue_type === 'bug' ? <Bug size={14} color={selectedType?.color} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  : form.issue_type === 'story' ? <Target size={14} color={selectedType?.color} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  : <Flag size={14} color={selectedType?.color} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />}
                </div>
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                    style={{ ...sel, paddingLeft: 32 }}>
                    {priorityOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  {(() => { const PIcon = PRIORITY_CONFIG[form.priority]?.icon || Equal; return <PIcon size={14} color={selectedPriority?.color} strokeWidth={2.5} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />; })()}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={lbl}>Description <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the issue in detail — steps to reproduce, expected vs actual behavior..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
                onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>

            {/* Screenshots */}
            <div>
              <label style={lbl}>Attachments <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>

              {/* Existing screenshots (for edit mode) */}
              {editIssue && existingScreenshots.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginBottom: 6, fontWeight: 600 }}>Current Attachments:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {existingScreenshots.map((screenshot, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid hsl(var(--border))', borderRadius: 7, backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 5, backgroundColor: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Screenshot {idx + 1}</span>
                        <button
                          onClick={() => setPreviewIdx(`existing-${idx}`)}
                          style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                        >View</button>
                        <button
                          onClick={() => removeExistingScreenshot(idx)}
                          style={{ width: 24, height: 24, borderRadius: 5, border: 'none', background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded files list */}
              {form.screenshots.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {form.screenshots.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid hsl(var(--border))', borderRadius: 7, backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 5, backgroundColor: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      </div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button
                        onClick={() => setPreviewIdx(idx)}
                        style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                      >View</button>
                      <button
                        onClick={() => removeFile(idx)}
                        style={{ width: 24, height: 24, borderRadius: 5, border: 'none', background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload area — always visible to add more */}
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button
                onClick={() => { if (isValid) { onSubmit(form, editIssue?.id); onClose(); } }}
                disabled={!isValid}
                style={{ padding: '7px 20px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600, cursor: isValid ? 'pointer' : 'not-allowed', opacity: isValid ? 1 : 0.5, transition: 'opacity 0.2s' }}
              >{editIssue ? 'Update Issue' : 'Create Issue'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot Preview Modal */}
      {showPreview && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 24 }}
          onClick={() => setPreviewIdx(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            {/* Display existing or new screenshot */}
            {typeof previewIdx === 'string' && previewIdx.startsWith('existing-') ? (
              <img 
                src={existingScreenshots[parseInt(previewIdx.split('-')[1])]?.url} 
                alt="existing screenshot" 
                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 8, display: 'block' }} 
              />
            ) : (
              <img 
                src={previews[previewIdx]} 
                alt="preview" 
                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 8, display: 'block' }} 
              />
            )}
            <button
              onClick={() => setPreviewIdx(null)}
              style={{ position: 'absolute', top: -12, right: -12, width: 28, height: 28, borderRadius: '50%', border: 'none', backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SplitMiddleContent({ selected, setLightbox, handleAddComment }) {
  const [showDesc, setShowDesc] = useState(true);
  const [showAttach, setShowAttach] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [activityTab, setActivityTab] = useState('comments'); // 'comments' only
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [likes, setLikes] = useState({});
  const [hoveredComment, setHoveredComment] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const { user } = useAuth();

  // Helper to format comment timestamp
  const formatCommentTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Get history items (mock - replace with actual history from API if available)
  const historyItems = [
    {
      type: 'status',
      date: selected.updated_at,
      from: 'Previous Status',
      to: selected.status,
    },
    {
      type: 'created',
      date: selected.created_at,
      title: selected.title,
      by: selected.reported_by,
    },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px', minHeight: 0 }} className="split-scroll">
      
      {/* Description */}
      <section style={{ marginBottom: 24 }}>
        <div onClick={() => setShowDesc(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer' }}>
          <ChevronRight size={16} color="hsl(var(--muted-foreground))" style={{ transform: showDesc ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          <AlignLeft size={13} color="hsl(var(--muted-foreground))" />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Description</h3>
        </div>
        {showDesc && (
          <div style={{ padding: '8px 0 0 24px', fontSize: 14, color: selected.description ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {selected.description || 'No description provided.'}
          </div>
        )}
      </section>

      {/* Attachments */}
      {selected.screenshots?.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <div onClick={() => setShowAttach(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer' }}>
            <ChevronRight size={16} color="hsl(var(--muted-foreground))" style={{ transform: showAttach ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            <Paperclip size={13} color="hsl(var(--muted-foreground))" />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Attachments ({selected.screenshots.length})</h3>
          </div>
          {showAttach && (
            <div style={{ padding: '8px 0 0 24px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {selected.screenshots.map((s, i) => (
                <div key={i} onClick={() => setLightbox(s.url)}
                  style={{ width: 120, height: 80, borderRadius: 6, overflow: 'hidden', border: '2px solid hsl(var(--border))', cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'hsl(var(--primary))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
                >
                  <img src={s.url} alt={`attachment-${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Activity Section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showActivity ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setShowActivity(p => !p)}>
            <ChevronRight size={16} color="hsl(var(--muted-foreground))" style={{ transform: showActivity ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Activity</h3>
          </div>
          {showActivity && (
            <div style={{ display: 'inline-flex', border: '1px solid hsl(var(--border))', borderRadius: 6, overflow: 'hidden' }}>
              <button
                onClick={() => setActivityTab('comments')}
                style={{
                  padding: '6px 14px', border: 'none',
                  background: 'hsl(var(--primary))',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px',
                  color: 'hsl(var(--primary-foreground))',
                  transition: 'all 0.15s',
                }}
              >COMMENTS</button>
            </div>
          )}
        </div>

        {showActivity && (
          <>
            {/* Comment Box */}
            <SplitCommentBox 
              issueId={selected.id} 
              onAddComment={handleAddComment}
              user={user}
              Avatar={Avatar}
            />

            {/* Comments List with nested replies */}
            {(!selected.comments || selected.comments.length === 0) ? (
              <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No comments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {selected.comments
                  .filter(c => !c.parent_id) // Only show top-level comments
                  .map((c, i) => {
                    const authorName = c.author?.first_name
                      ? `${c.author.first_name} ${c.author.last_name || ''}`.trim()
                      : (c.author?.username || c.author_name || 'Unknown');
                    const cKey = c.id || i;
                    const isLiked = likes[cKey];
                    const isHovered = hoveredComment === cKey;
                    
                    // Get replies for this comment
                    const replies = selected.comments.filter(reply => reply.parent_id === c.id);
                    const showReplies = expandedComments[cKey];

                    return (
                      <div key={cKey} style={{ marginBottom: 16 }}>
                        {/* Main Comment */}
                        <div
                          onMouseEnter={() => setHoveredComment(cKey)}
                          onMouseLeave={() => setHoveredComment(null)}
                          style={{ display: 'flex', gap: 10, padding: '8px 0' }}
                        >
                          <Avatar name={authorName} size={34} id={c.author?.id || i} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Name + time + hover actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{authorName}</span>
                              <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                                {formatCommentTime(c.created_at)}
                              </span>
                            </div>

                            {/* Comment bubble */}
                            <div style={{ fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.55, padding: '8px 12px', backgroundColor: 'hsl(var(--muted))', borderRadius: '4px 12px 12px 12px', display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word', marginBottom: 8 }}>
                              {c.text}
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <button
                                onClick={() => setLikes(p => ({ ...p, [cKey]: !p[cKey] }))}
                                style={{ fontSize: 11, fontWeight: 600, color: isLiked ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 4 }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <ThumbsUp size={11} fill={isLiked ? 'hsl(var(--primary))' : 'none'} />
                                {isLiked ? '1' : ''}
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
                                <Avatar name={getDisplayName(user)} size={26} id={user?.id || 0} />
                                <div style={{ flex: 1, border: '1px solid hsl(var(--primary) / 0.5)', borderRadius: 8, overflow: 'hidden', backgroundColor: 'hsl(var(--background))' }}>
                                  <textarea
                                    autoFocus
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Reply to ${authorName}...`}
                                    rows={2}
                                    style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: 'none', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                  />
                                  <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
                                    <button
                                      onClick={async () => {
                                        if (!replyText.trim()) return;
                                        try {
                                          await handleAddComment(selected.id, replyText.trim(), c.id); // Pass parent comment ID
                                          setReplyText('');
                                          setReplyingTo(null);
                                        } catch (e) { console.error(e); }
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
                          <div style={{ marginLeft: 44, marginTop: 8, marginBottom: 8 }}>
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
                              <Avatar name={replies[0].author?.username || 'U'} size={16} id={replies[0].author?.id || 0} />
                              <ChevronDown size={10} style={{ transform: showReplies ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                            </button>
                          </div>
                        )}

                        {/* Nested Replies */}
                        {showReplies && replies.length > 0 && (
                          <div style={{ marginLeft: 44, paddingLeft: 16, borderLeft: '2px solid hsl(var(--border))' }}>
                            {replies.map((reply, ri) => {
                              const replyAuthorName = reply.author?.first_name
                                ? `${reply.author.first_name} ${reply.author.last_name || ''}`.trim()
                                : (reply.author?.username || reply.author_name || 'Unknown');
                              const replyKey = reply.id || `reply-${ri}`;
                              const isReplyLiked = likes[replyKey];

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
                                        onClick={() => setLikes(p => ({ ...p, [replyKey]: !p[replyKey] }))}
                                        style={{ fontSize: 10, fontWeight: 600, color: isReplyLiked ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 3, borderRadius: 3 }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                      >
                                        <ThumbsUp size={9} fill={isReplyLiked ? 'hsl(var(--primary))' : 'none'} />
                                        {isReplyLiked ? '1' : ''}
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
          </>
        )}
      </section>
    </div>
  );
}

// Updated SplitCommentBox with the same style as ItemDetailModal
function SplitCommentBox({ issueId, onAddComment, user, Avatar }) {
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await onAddComment(issueId, comment.trim(), null); // null for top-level comment
      setComment('');
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
      <Avatar name={getDisplayName(user)} size={34} id={user?.id || 0} />
      <div style={{ flex: 1, borderBottom: '1px solid hsl(var(--border))', overflow: 'hidden', transition: 'border-color 0.15s' }}
        onFocusCapture={(e) => e.currentTarget.style.borderBottomColor = 'hsl(var(--primary))'}
        onBlurCapture={(e) => e.currentTarget.style.borderBottomColor = 'hsl(var(--border))'}
      >
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          rows={comment ? 3 : 2}
          style={{
            width: '100%', padding: '10px 14px', fontSize: 13,
            border: 'none', backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))', outline: 'none', resize: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
        {comment.trim() && (
          <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.4)' }}>
            <button onClick={handlePost} disabled={posting}
              style={{ padding: '5px 16px', borderRadius: 5, border: 'none', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 12, fontWeight: 600, cursor: posting ? 'not-allowed' : 'pointer', opacity: posting ? 0.7 : 1 }}>
              {posting ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setComment('')}
              style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 12, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientIssues({ showCreateModal, onCloseCreateModal }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'split'
  const [splitIssues, setSplitIssues] = useState([]);
  const [splitLoading, setSplitLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [editIssue, setEditIssue] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { onDataUpdate, addNotification } = useNotifications();

  const closeSelectedIssue = () => {
    setSelected(null);
    if (!searchParams.has('issue')) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('issue');
    setSearchParams(nextParams, { replace: true });
  };

  // Open modal when navbar Report Issue button is clicked
  useEffect(() => {
    if (showCreateModal) {
      setShowReport(true);
      onCloseCreateModal?.();
    }
  }, [showCreateModal]);

  // Browser back button support
  useEffect(() => {
    if (viewMode === 'split') {
      window.history.pushState({ splitView: true }, '');
    }
    const handlePop = () => {
      setViewMode('table');
      closeSelectedIssue();
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [viewMode]);

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

  const loadSplitIssues = async (selectedIssue = null) => {
    try {
      setSplitLoading(true);
      const response = await issueService.getAll({ page: 1, page_size: 1000 });
      const allIssues = response.data.results || response.data || [];
      setSplitIssues(() => {
        if (!selectedIssue) return allIssues;
        const exists = allIssues.some((issue) => issue.id === selectedIssue.id);
        return exists ? allIssues : [selectedIssue, ...allIssues];
      });
    } catch (error) {
      console.error('Error fetching split issues:', error);
      setSplitIssues(selectedIssue ? [selectedIssue, ...issues] : issues);
    } finally {
      setSplitLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchIssues(1),
      getProjects(),
    ]).then(([_, pRes]) => {
      setProjects(pRes.data);
    }).catch(() => {});
  }, [pageSize]);

  useEffect(() => {
    return onDataUpdate((data) => {
      console.log('🔄 ClientIssues received WebSocket data:', data);
      
      if (data.entity === 'comment' && data.action === 'created') {
        const { issue_id, comment } = data.data;
        setIssues(prev => prev.map(issue => {
          if (issue.id === issue_id) {
            return { ...issue, comments: [...(issue.comments || []), comment] };
          }
          return issue;
        }));
        setSplitIssues(prev => prev.map(issue => {
          if (issue.id === issue_id) {
            return { ...issue, comments: [...(issue.comments || []), comment] };
          }
          return issue;
        }));
        setSelected(prev => {
          if (prev && prev.id === issue_id) {
            return { ...prev, comments: [...(prev.comments || []), comment] };
          }
          return prev;
        });
      } else if (data.entity === 'issue' && data.action === 'status_changed_client') {
        const { issue_id, new_status, message } = data.data;
        // Update issue status in list
        setIssues(prev => prev.map(i => i.id === issue_id ? { ...i, status: new_status } : i));
        setSplitIssues(prev => prev.map(i => i.id === issue_id ? { ...i, status: new_status } : i));
        setSelected(prev => prev?.id === issue_id ? { ...prev, status: new_status } : prev);
        // Show notification
        const icons = { 'Done': '✅', 'In Progress': '🔧', 'Testing': '🧪', 'To Do': '📋' };
        addNotification({
          title: `Issue ${new_status}`,
          message,
          icon: icons[new_status] || '🔔',
          type: 'direct',
        });
      } else {
        fetchIssues(currentPage);
        if (viewMode === 'split') loadSplitIssues(selected);
      }
    });
  }, [onDataUpdate, viewMode, selected]);

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

  const handleSubmit = async (form, issueId = null) => {
    try {
      if (issueId) {
        // Update existing issue
        if (form.screenshots.length > 0) {
          // If new screenshots are added, use FormData
          const formData = new FormData();
          formData.append('title', form.title);
          formData.append('description', form.description);
          formData.append('issue_type', form.issue_type);
          formData.append('priority', form.priority);
          formData.append('project', form.project);
          form.screenshots.forEach((file) => formData.append('screenshots', file));
          
          const res = await issueService.update(issueId, formData);
          setIssues((prev) => prev.map(i => i.id === issueId ? res.data : i));
          setSplitIssues((prev) => prev.map(i => i.id === issueId ? res.data : i));
          setSelected(res.data);
        } else {
          // No new screenshots, just update text fields
          const updateData = {
            title: form.title,
            description: form.description,
            issue_type: form.issue_type,
            priority: form.priority,
            project: form.project,
          };
          const res = await issueService.update(issueId, updateData);
          setIssues((prev) => prev.map(i => i.id === issueId ? res.data : i));
          setSplitIssues((prev) => prev.map(i => i.id === issueId ? res.data : i));
          setSelected(res.data);
        }
        setToast('Issue updated successfully!');
      } else {
        // Create new issue
        let res;
        if (form.screenshots.length > 0) {
          const formData = new FormData();
          formData.append('title', form.title);
          formData.append('description', form.description);
          formData.append('issue_type', form.issue_type);
          formData.append('priority', form.priority);
          formData.append('project', form.project);
          form.screenshots.forEach((file) => formData.append('screenshots', file));
          res = await issueService.create(formData);
        } else {
          // No screenshots, send as JSON
          res = await issueService.create({
            title: form.title,
            description: form.description,
            issue_type: form.issue_type,
            priority: form.priority,
            project: form.project,
          });
        }
        setIssues((prev) => [res.data, ...prev]);
        setSplitIssues((prev) => [res.data, ...prev]);
        setToast('Issue reported! Your team has been notified.');
      }
      setTimeout(() => setToast(null), 4000);
    } catch (error) {
      console.error('Submit error:', error);
      setToast(issueId ? 'Failed to update issue. Try again.' : 'Failed to create issue. Try again.');
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    try {
      await issueService.delete(issueId);
      setIssues((prev) => prev.filter(i => i.id !== issueId));
      setSplitIssues((prev) => prev.filter(i => i.id !== issueId));
      if (selected?.id === issueId) {
        closeSelectedIssue();
      }
      setShowDeleteConfirm(null);
      setToast('Issue deleted successfully!');
      setTimeout(() => setToast(null), 4000);
    } catch {
      setToast('Failed to delete issue. Try again.');
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleEditIssue = (issue) => {
    setEditIssue(issue);
    setShowReport(true);
  };

  const handleAddComment = async (id, text, parentId = null) => {
    try {
      const commentData = parentId ? { text, parent_id: parentId } : { text };
      console.log('💬 Adding comment:', commentData);
      const res = await issueService.addComment(id, commentData);
      console.log('✅ Comment added successfully:', res.data);
      
      // Immediately update local state (optimistic update)
      setIssues((prev) => prev.map((i) => i.id === id ? { ...i, comments: [...(i.comments || []), res.data] } : i));
      setSplitIssues((prev) => prev.map((i) => i.id === id ? { ...i, comments: [...(i.comments || []), res.data] } : i));
      setSelected((prev) => prev?.id === id ? { ...prev, comments: [...(prev.comments || []), res.data] } : prev);
    } catch (error) {
      console.error('❌ Add comment error:', error);
    }
  };

  const handleIssueClick = (issue) => {
    setSelected(issue);
    setViewMode('split'); // Automatically switch to split view
    loadSplitIssues(issue);
  };

  useEffect(() => {
    const issueId = searchParams.get('issue');
    if (!issueId) return;

    let cancelled = false;
    const openIssueFromNotification = async () => {
      try {
        const res = await issueService.getById(issueId);
        if (cancelled) return;
        setSelected(res.data);
        setViewMode('split');
        loadSplitIssues(res.data);
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

  const visibleIssues = viewMode === 'split' && splitIssues.length > 0 ? splitIssues : issues;
  const filteredBase = (filterStatus === 'all' ? visibleIssues : filterStatus === 'open' ? visibleIssues.filter((i) => i.status !== 'Done') : visibleIssues.filter((i) => i.status === filterStatus))
    .filter((i) => projectFilter === 'all' || i.project_name === projectFilter);
  const filtered = viewMode === 'split' && selected
    ? [
        ...filteredBase.filter((i) => i.id === selected.id),
        ...filteredBase.filter((i) => i.id !== selected.id),
      ]
    : filteredBase;

  const counts = {
    all: issues.length,
    open: issues.filter((i) => i.status !== 'Done').length,
    Done: issues.filter((i) => i.status === 'Done').length,
  };

  const titleRowRef = useRef(null);
  const [titleRowHeight, setTitleRowHeight] = useState(48);

  useEffect(() => {
    if (!titleRowRef.current) return;
    const ro = new ResizeObserver(() => {
      setTitleRowHeight(titleRowRef.current?.offsetHeight || 48);
    });
    ro.observe(titleRowRef.current);
    return () => ro.disconnect();
  }, [selected]);

  const btnStyle = (active) => ({
    padding: '6px 14px', borderRadius: 6, border: '1px solid hsl(var(--border))', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    backgroundColor: active ? 'hsl(var(--primary))' : 'transparent',
    color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
  });

  if (viewMode === 'split' && selected) {
    return (
      <>
      <div className="responsive-split-view" style={{ display: 'flex', height: 'calc(100vh - 56px)', backgroundColor: 'hsl(var(--background))', overflow: 'hidden',
        animation: 'splitFadeIn 0.2s ease'
      }}>
        {/* Left Panel - Issues List */}
        <div className="responsive-split-list" style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'hsl(var(--background))', height: '100%', overflow: 'hidden' }}>
          {/* Header - matches middle panel top header height */}
          <div style={{ flexShrink: 0, backgroundColor: 'hsl(var(--background))' }}>
            <div style={{ height: 37, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
              <button
                onClick={() => { setViewMode('table'); closeSelectedIssue(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 5, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', cursor: 'pointer', color: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
              >
                <ChevronLeft size={14} />
                Back
              </button>
            </div>
            <div style={{ height: titleRowHeight, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
                {splitLoading ? 'Loading all issues...' : `${filtered.length} issue${filtered.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
          {/* Issues List */}
          <div style={{ flex: 1, overflowY: 'scroll', overflowX: 'hidden', padding: '8px', minHeight: 0 }} className="split-scroll">
            {filtered.map((issue) => {
              const isSelected = selected?.id === issue.id;
              return (
                <div
                  key={issue.id}
                  onClick={() => {
                    console.log('🔵 Clicked issue:', issue.id, issue.title, 'Status:', issue.status, 'Priority:', issue.priority);
                    console.log('📦 Full issue object:', issue);
                    setSelected(issue);
                  }}
                  style={{
                    padding: '12px 16px',
                    marginBottom: '4px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'hsl(var(--accent) / 0.3)' : 'hsl(var(--card))',
                    border: isSelected ? '1px solid hsl(var(--primary) / 0.3)' : '1px solid hsl(var(--border))',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.5)';
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--card))';
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    }
                  }}
                >
                  {/* Issue Title */}
                  <div style={{ marginBottom: 8 }}>
                    <h4 style={{ 
                      fontSize: 14, 
                      fontWeight: 500, 
                      color: 'hsl(var(--foreground))', 
                      margin: 0, 
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {issue.title}
                    </h4>
                  </div>

                  {/* Issue Key and Type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {issue.issue_type === 'bug' ? (
                      <Bug size={14} color="hsl(var(--type-bug))" />
                    ) : issue.issue_type === 'story' ? (
                      <Target size={14} color="hsl(var(--type-story))" />
                    ) : (
                      <Flag size={14} color="hsl(var(--type-task))" />
                    )}
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--primary))' }}>{issue.project_name}</span>
                  </div>

                  {/* Status and Priority */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        padding: '2px 6px', 
                        borderRadius: 3, 
                        fontSize: 10, 
                        fontWeight: 600,
                        backgroundColor: statusBg[issue.status], 
                        color: statusAccent[issue.status]
                      }}>
                        {issue.status}
                      </span>
                    </div>
                    
                    {/* Assignee Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {issue.assignee ? (
                        <Avatar name={getDisplayName(issue.assignee)} size={20} id={issue.assignee.id || 0} />
                      ) : (
                        <User size={16} color="hsl(var(--muted-foreground))" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Panel - Issue Detail */}
        <div className="responsive-split-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'hsl(var(--background))' }}>

          {/* Top Header - Fixed */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'hsl(var(--background))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px' }}>
              {selected.issue_type === 'bug'
                ? <Bug size={13} color="hsl(var(--type-bug))" />
                : selected.issue_type === 'story'
                ? <Target size={13} color="hsl(var(--type-story))" />
                : <Flag size={13} color="hsl(var(--type-task))" />}
              <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--primary))' }}>{selected.project_name}-{selected.id}</span>
            </div>
            <div ref={titleRowRef} style={{ padding: '12px 20px', minHeight: 'auto', maxHeight: '120px', overflowY: 'auto' }}>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                {selected.title}
              </h1>
            </div>
          </div>

          {/* Main Content - Scrollable */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <SplitMiddleContent selected={selected} setLightbox={setLightbox} handleAddComment={handleAddComment} />
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="responsive-split-details" key={selected.id} style={{ width: 260, flexShrink: 0, backgroundColor: 'hsl(var(--background))', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

          {/* Header - matches middle panel top header height */}
          <div style={{ flexShrink: 0, backgroundColor: 'hsl(var(--background))' }}>
            <div style={{ height: 37 }} />
            <div style={{ height: titleRowHeight, display: 'flex', alignItems: 'center', padding: '0 14px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Details</span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'scroll', minHeight: 0 }} className="split-scroll">

          {/* Details Section */}
          <div>

            {/* Compact Detail Rows */}
            {[
              {
                label: 'Status',
                value: (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 8px',
                    borderRadius: 4,
                    backgroundColor: statusBg[selected.status],
                    color: statusAccent[selected.status],
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    {selected.status}
                  </div>
                )
              },
              {
                label: 'Assignee',
                value: selected.assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar name={getDisplayName(selected.assignee)} size={18} id={selected.assignee.id || 0} />
                    <span>{getDisplayName(selected.assignee)}</span>
                  </div>
                ) : <span style={{ color: 'hsl(var(--muted-foreground))' }}>Unassigned</span>
              },
              {
                label: 'Reporter',
                value: selected.reported_by ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar name={getDisplayName(selected.reported_by)} size={18} id={selected.reported_by.id || 1} />
                    <span>{getDisplayName(selected.reported_by)}</span>
                  </div>
                ) : <span style={{ color: 'hsl(var(--muted-foreground))' }}>You</span>
              },
              {
                label: 'Priority',
                value: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {selected.priority === 'highest' ? (
                      <ArrowUpCircle size={13} color={priorityColor[selected.priority]} />
                    ) : selected.priority === 'high' ? (
                      <ArrowUp size={13} color={priorityColor[selected.priority]} />
                    ) : selected.priority === 'medium' ? (
                      <Minus size={13} color={priorityColor[selected.priority]} />
                    ) : (
                      <ArrowDown size={13} color={priorityColor[selected.priority]} />
                    )}
                    <span style={{ color: priorityColor[selected.priority], fontWeight: 600, textTransform: 'capitalize' }}>{selected.priority}</span>
                  </div>
                )
              },
              {
                label: 'Type',
                value: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {selected.issue_type === 'bug'
                      ? <Bug size={13} color="hsl(var(--type-bug))" />
                      : selected.issue_type === 'story'
                      ? <Target size={13} color="hsl(var(--type-story))" />
                      : <Flag size={13} color="hsl(var(--type-task))" />}
                    <span style={{ textTransform: 'capitalize' }}>{selected.issue_type}</span>
                  </div>
                )
              },
              { label: 'Project', value: <span>{selected.project_name}</span> },
              {
                label: 'Created',
                value: <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '7px 14px' }}>
                <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', width: 72, flexShrink: 0 }}>{label}</span>
                <div style={{ fontSize: 12, color: 'hsl(var(--foreground))', flex: 1, minWidth: 0 }}>{value}</div>
              </div>
            ))}
          </div>
          </div>
        </div>
        </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Screenshot" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8, boxShadow: '0 0 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer', borderRadius: 6, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>
      )}
      </>
    );
  }

  // Default List View
  return (
    <div className="responsive-page" style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="responsive-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Issues</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            {counts.open} open · {counts.Done} resolved
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Project Filter */}
          <div style={{ position: 'relative' }}>
            <Folder size={14} color="hsl(var(--muted-foreground))" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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
              {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <ChevronDown size={12} color="hsl(var(--muted-foreground))" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          <button onClick={() => setShowReport(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontSize: 13, fontWeight: 600 }}
          >
            <Plus size={14} />
            Create
          </button>


        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={() => setFilterStatus('all')} style={btnStyle(filterStatus === 'all')}>All ({counts.all})</button>
        <button onClick={() => setFilterStatus('open')} style={btnStyle(filterStatus === 'open')}>Open ({counts.open})</button>
        <button onClick={() => setFilterStatus('Done')} style={btnStyle(filterStatus === 'Done')}>Resolved ({counts.Done})</button>
      </div>

      {loading ? (
        <div style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Loading...</p>
        </div>
      ) : (
        /* Jira-style Table View */
        <div className="responsive-table-wrap" style={{ ...card, flex: 1, overflow: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Table */}
          <div className="responsive-table-wrap" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'hsl(var(--muted))' }}>
              <tr>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 36 }}>Type</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))' }}>Issue</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))' }}>Description</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 120 }}>Assignee</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 120 }}>Reporter</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 100 }}>Priority</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 110 }}>Status</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 100 }}>Created</th>
                <th style={{ padding: '9px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid hsl(var(--border))', width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>No issues found</p>
                  <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>No issues in this category.</p>
                </td></tr>
              ) : filtered.map((issue) => (
                <React.Fragment key={issue.id}>
                <tr
                  onClick={() => handleIssueClick(issue)}
                  style={{ borderBottom: selected?.id === issue.id ? 'none' : '1px solid hsl(var(--border))', cursor: 'pointer', transition: 'background 0.15s', backgroundColor: selected?.id === issue.id ? 'hsl(var(--accent) / 0.3)' : 'transparent' }}
                  onMouseEnter={(e) => { if (selected?.id !== issue.id) e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selected?.id === issue.id ? 'hsl(var(--accent) / 0.3)' : 'transparent'; }}
                >
                  {/* Type */}
                  <td style={{ padding: '5px 10px', textAlign: 'center', borderRight: '1px solid hsl(var(--border))' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: issue.issue_type === 'bug' ? 'hsl(var(--type-bug) / 0.15)' : issue.issue_type === 'story' ? 'hsl(var(--type-story) / 0.15)' : 'hsl(var(--type-task) / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {issue.issue_type === 'bug' ? <Bug size={12} color="hsl(var(--type-bug))" /> : issue.issue_type === 'story' ? <Target size={12} color="hsl(var(--type-story))" /> : <Flag size={12} color="hsl(var(--type-task))" />}
                    </div>
                  </td>
                  {/* Issue title + project */}
                  <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))', maxWidth: 200 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{issue.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.1)', padding: '1px 5px', borderRadius: 3 }}>{issue.project_name}</span>
                  </td>
                  {/* Description */}
                  <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                    <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {issue.description || <span style={{ fontStyle: 'italic' }}>No description</span>}
                    </span>
                  </td>
                  {/* Assignee */}
                  <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {issue.assignee ? <><Avatar name={getDisplayName(issue.assignee)} size={20} id={issue.assignee.id || 0} /><span style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>{getDisplayName(issue.assignee)}</span></> : <><User size={14} color="hsl(var(--muted-foreground))" /><span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Unassigned</span></>}
                    </div>
                  </td>
                  {/* Reporter */}
                  <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {issue.reported_by ? <><Avatar name={getDisplayName(issue.reported_by)} size={20} id={issue.reported_by.id || 1} /><span style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>{getDisplayName(issue.reported_by)}</span></> : <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>You</span>}
                    </div>
                  </td>
                  {/* Priority */}
                  <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {(() => { const pc = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.medium; const Icon = pc.icon; return <Icon size={13} color={priorityColor[issue.priority]} strokeWidth={2.5} />; })()}
                      <span style={{ fontSize: 12, color: priorityColor[issue.priority], fontWeight: 500, textTransform: 'capitalize' }}>{issue.priority}</span>
                    </div>
                  </td>
                  {/* Status */}
                  <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: statusBg[issue.status], color: statusAccent[issue.status], whiteSpace: 'nowrap' }}>
                      {issue.status}
                    </span>
                  </td>
                  {/* Created */}
                  <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                    <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{new Date(issue.created_at).toLocaleDateString()}</span>
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '5px 10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <button onClick={(e) => { e.stopPropagation(); handleEditIssue(issue); }} title="Edit"
                        style={{ width: 26, height: 26, borderRadius: 4, border: 'none', backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(issue.id); }} title="Delete"
                        style={{ width: 26, height: 26, borderRadius: 4, border: 'none', backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Inline Expanded Detail Row */}
                {selected?.id === issue.id && (
                  <tr key={`detail-${issue.id}`}>
                    <td colSpan={9} style={{ padding: 0, backgroundColor: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' }}>
                      <div style={{
                        maxHeight: '0px',
                        overflow: 'hidden',
                        animation: 'expandRow 0.3s ease-out forwards',
                      }}>
                        <div style={{ padding: '16px 20px' }}>
                          {/* Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              {selected.issue_type === 'bug'
                                ? <Bug size={16} color="hsl(var(--type-bug))" />
                                : selected.issue_type === 'story'
                                ? <Target size={16} color="hsl(var(--type-story))" />
                                : <Flag size={16} color="hsl(var(--type-task))" />}
                              <span style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{selected.title}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 5, backgroundColor: statusBg[selected.status], color: statusAccent[selected.status] }}>{selected.status}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditIssue(selected); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--background))'; e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
                              >
                                <Edit2 size={14} />
                                Edit
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(selected.id); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: '1px solid hsl(var(--destructive) / 0.3)', backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.2)'; e.currentTarget.style.borderColor = 'hsl(var(--destructive) / 0.5)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)'; e.currentTarget.style.borderColor = 'hsl(var(--destructive) / 0.3)'; }}
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setViewMode('split'); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--background))'; e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
                                Split
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); closeSelectedIssue(); }}
                                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', transition: 'all 0.15s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; e.currentTarget.style.borderColor = 'hsl(var(--destructive) / 0.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--background))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Body */}
                          <div style={{ display: 'flex', gap: 20 }}>
                            {/* Left - Content */}
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</p>
                              <p style={{ fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.6, margin: '0 0 16px' }}>{selected.description || 'No description provided.'}</p>

                              {selected.comments?.length > 0 && (
                                <>
                                  <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comments ({selected.comments.length})</p>
                                  {selected.comments.slice(0, 3).map((c, i) => (
                                    <div key={c.id || i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                      <Avatar name={c.author?.username || 'U'} size={24} id={c.author?.id || i} />
                                      <div>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{getDisplayName(c.author)} </span>
                                        <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                                        <p style={{ fontSize: 12, color: 'hsl(var(--foreground))', margin: '4px 0 0', padding: '6px 10px', backgroundColor: 'hsl(var(--muted))', borderRadius: 6 }}>{c.text}</p>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>

                            {/* Right - Details */}
                            <div style={{ width: 220, flexShrink: 0, borderLeft: '1px solid hsl(var(--border))', paddingLeft: 20 }}>
                              {[
                                { label: 'Assignee', value: selected.assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar name={getDisplayName(selected.assignee)} size={16} id={selected.assignee.id || 0} /><span>{getDisplayName(selected.assignee)}</span></div> : <span style={{ color: 'hsl(var(--muted-foreground))' }}>Unassigned</span> },
                                { label: 'Reporter', value: selected.reported_by ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar name={getDisplayName(selected.reported_by)} size={16} id={selected.reported_by.id || 1} /><span>{getDisplayName(selected.reported_by)}</span></div> : <span style={{ color: 'hsl(var(--muted-foreground))' }}>You</span> },
                                { 
                                  label: 'Priority', 
                                  value: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                      {selected.priority === 'highest' ? (
                                        <ArrowUpCircle size={8} color={priorityColor[selected.priority]} />
                                      ) : selected.priority === 'high' ? (
                                        <ArrowUp size={8} color={priorityColor[selected.priority]} />
                                      ) : selected.priority === 'medium' ? (
                                        <Minus size={8} color={priorityColor[selected.priority]} />
                                      ) : (
                                        <ArrowDown size={8} color={priorityColor[selected.priority]} />
                                      )}
                                      <span style={{ color: priorityColor[selected.priority], fontWeight: 600, textTransform: 'capitalize' }}>{selected.priority}</span>
                                    </div>
                                  )
                                },
                                { label: 'Type', value: <span style={{ textTransform: 'capitalize' }}>{selected.issue_type}</span> },
                                { label: 'Project', value: <span>{selected.project_name}</span> },
                                { label: 'Created', value: <span style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(selected.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> },
                              ].map(({ label, value }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid hsl(var(--border) / 0.4)' }}>
                                  <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', width: 64, flexShrink: 0 }}>{label}</span>
                                  <div style={{ fontSize: 12, color: 'hsl(var(--foreground))', flex: 1 }}>{value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          </div>

          {/* Table Footer with Pagination */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setShowReport(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, border: 'none', backgroundColor: 'transparent', color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Plus size={12} />
                Create
              </button>
              
              {/* Page Size Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Show:</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 12, cursor: 'pointer' }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            
            {/* Pagination Info and Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
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

      {showReport && (
        <ReportIssueModal 
          onClose={() => { setShowReport(false); setEditIssue(null); }} 
          onSubmit={handleSubmit} 
          projects={projects} 
          editIssue={editIssue}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(null); }}
        >
          <div style={{ ...card, width: '100%', maxWidth: 400, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'hsl(var(--destructive) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="hsl(var(--destructive))" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Delete Issue</h3>
                <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '2px 0 0' }}>This action cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'hsl(var(--foreground))', marginBottom: 20, lineHeight: 1.5 }}>
              Are you sure you want to delete this issue? All comments and attachments will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteIssue(showDeleteConfirm)}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Delete Issue
              </button>
            </div>
          </div>
        </div>
      )}



      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'hsl(var(--success))', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: 'var(--shadow-lg)', zIndex: 2000 }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
