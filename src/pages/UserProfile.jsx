import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { getDisplayName, getInitials } from '../utils/userUtils';
import { useAuth } from '../context/AuthContext';

const avatarColors = [
  'hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))',
  'hsl(var(--warning))', 'hsl(var(--type-epic))', 'hsl(var(--type-bug))',
];

const roleStyle = {
  admin:               { bg: 'hsl(var(--type-epic) / 0.12)', text: 'hsl(var(--type-epic))',   label: 'Admin' },
  manager:             { bg: 'hsl(var(--info) / 0.12)',       text: 'hsl(var(--info))',         label: 'Manager' },
  client:              { bg: 'hsl(var(--warning) / 0.12)',    text: 'hsl(var(--warning))',      label: 'Client' },
  frontend_developer:  { bg: 'hsl(var(--success) / 0.12)',    text: 'hsl(var(--success))',      label: 'Frontend Developer' },
  backend_developer:   { bg: 'hsl(var(--primary) / 0.12)',    text: 'hsl(var(--primary))',      label: 'Backend Developer' },
  fullstack_developer: { bg: 'hsl(var(--type-story) / 0.12)', text: 'hsl(var(--type-story))',   label: 'Fullstack Developer' },
  devops:              { bg: 'hsl(var(--type-task) / 0.12)',  text: 'hsl(var(--type-task))',    label: 'DevOps Engineer' },
  qa_tester:           { bg: 'hsl(var(--type-bug) / 0.12)',   text: 'hsl(var(--type-bug))',     label: 'QA Tester' },
  ui_ux_designer:      { bg: 'hsl(var(--secondary) / 0.12)',  text: 'hsl(var(--secondary))',    label: 'UI/UX Designer' },
};

const statusStyle = {
  'To Do':       { bg: 'hsl(var(--muted))',            text: 'hsl(var(--muted-foreground))' },
  'In Progress': { bg: 'hsl(var(--info) / 0.12)',      text: 'hsl(var(--info))' },
  'Testing':     { bg: 'hsl(var(--warning) / 0.12)',   text: 'hsl(var(--warning))' },
  'Done':        { bg: 'hsl(var(--success) / 0.12)',   text: 'hsl(var(--success))' },
};

const priorityColor = {
  highest: 'hsl(var(--priority-highest))',
  high:    'hsl(var(--priority-high))',
  medium:  'hsl(var(--priority-medium))',
  low:     'hsl(var(--priority-low))',
};

const ACTION_META = {
  issue_created:    'reported a new issue',
  issue_updated:    'updated issue',
  status_changed:   'changed status on',
  comment_added:    'commented on',
  assignee_changed: 'changed assignee on',
  project_created:  'created project',
  project_updated:  'updated project',
};

const ROLE_COLORS = {
  admin:     { bg: 'hsl(var(--type-bug) / 0.15)',   text: 'hsl(var(--type-bug))' },
  manager:   { bg: 'hsl(var(--type-epic) / 0.15)',  text: 'hsl(var(--type-epic))' },
  client:    { bg: 'hsl(var(--info) / 0.15)',        text: 'hsl(var(--info))' },
  employee:  { bg: 'hsl(var(--success) / 0.15)',    text: 'hsl(var(--success))' },
  qa_tester: { bg: 'hsl(var(--warning) / 0.15)',    text: 'hsl(var(--warning))' },
};

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 };

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'yesterday';
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...card, padding: '16px 20px', flex: 1, minWidth: 100 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || 'hsl(var(--foreground))' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</h3>;
}

// Dashboard-style activity row — same as AdminDashboard Recent Activity
function ActivityRow({ log, isLast }) {
  const firstName = log['actor__first_name'];
  const username  = log['actor__username'] || '';
  const actorName = firstName ? `${firstName} ${log['actor__last_name'] || ''}`.trim() : username;
  const actorRole = log['actor__role'] || log.actor_role || '';
  const initials  = (actorName || 'U').slice(0, 2).toUpperCase();
  const rc = ROLE_COLORS[actorRole] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
  const action = ACTION_META[log.action] || log.action?.replace(/_/g, ' ');
  const statusBadge = (val) => {
    const colors = { 'To Do': 'hsl(215 16% 50%)', 'In Progress': 'hsl(199 89% 48%)', 'Testing': 'hsl(38 95% 50%)', 'Done': 'hsl(145 63% 38%)' };
    return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: colors[val] || 'hsl(215 16% 50%)', color: '#fff' }}>{val}</span>;
  };
  const extra = log.extra || {};
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: isLast ? 'none' : '1px solid hsl(var(--border))' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#fff' }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--foreground))', lineHeight: 1.6 }}>
          <strong>{actorName.toUpperCase()}</strong>
          {actorRole && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, backgroundColor: rc.bg, color: rc.text, marginLeft: 4, textTransform: 'uppercase' }}>{actorRole.replace('_', ' ')}</span>}
          {' '}{action?.toUpperCase()}{' '}
          <span style={{ color: 'hsl(var(--primary))', fontWeight: 500 }}>{log.target}</span>
          {extra.from && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4, verticalAlign: 'middle' }}>
              {statusBadge(extra.from)}
              <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>→</span>
              {statusBadge(extra.to)}
            </span>
          )}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
          {log['project__name'] && <span>{log['project__name']} · </span>}
          {timeAgo(log.created_at)}
        </p>
      </div>
    </div>
  );
}

// Dashboard-style issue row — same as Manager/Employee/Client dashboard Recent Issues
function IssueRow({ issue, isLast, showAssignee }) {
  const firstName = showAssignee ? issue['assignee__first_name'] : issue['reported_by__first_name'];
  const username  = showAssignee ? (issue['assignee__username'] || 'Unknown') : (issue['reported_by__username'] || 'Unknown');
  const reporter  = firstName ? `${firstName} ${showAssignee ? (issue['assignee__last_name'] || '') : (issue['reported_by__last_name'] || '')}`.trim() : username;
  const role      = showAssignee ? (issue['assignee__role'] || '') : (issue['reported_by__role'] || '');
  const rc = ROLE_COLORS[role] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
  const actionMap = { 'To Do': 'assigned to work on', 'In Progress': 'is working on', 'Testing': 'is testing', 'Done': 'completed' };
  const action = showAssignee ? (actionMap[issue.status] || 'assigned to') : ({ 'To Do': 'reported a new issue', 'In Progress': 'is working on', 'Testing': 'submitted for review', 'Done': 'resolved issue' }[issue.status] || 'reported a new issue');
  const pc = priorityColor[issue.priority];
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: isLast ? 'none' : '1px solid hsl(var(--border))' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#fff' }}>
        {reporter.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
          <strong>{reporter.toUpperCase()}</strong>
          {role && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, backgroundColor: rc.bg, color: rc.text, marginLeft: 4, textTransform: 'uppercase' }}>{role.replace('_', ' ')}</span>}
          {' '}{action.toUpperCase()}{' '}
          <span style={{ color: 'hsl(var(--primary))', fontWeight: 500 }}>{issue.title}</span>{' '}
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: { 'To Do': 'hsl(215 16% 50%)', 'In Progress': 'hsl(199 89% 48%)', 'Testing': 'hsl(38 95% 50%)', 'Done': 'hsl(145 63% 38%)' }[issue.status] || 'hsl(215 16% 50%)', color: '#fff' }}>{issue.status}</span>
          {pc && <span style={{ fontSize: 10, color: pc, fontWeight: 600, marginLeft: 4, textTransform: 'capitalize' }}>{issue.priority}</span>}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
          {issue['project__name'] && <span>{issue['project__name']} · </span>}
          {timeAgo(issue.created_at)}
        </p>
      </div>
    </div>
  );
}

// Dashboard-style task row — same as Employee dashboard
function TaskRow({ task, isLast }) {
  const firstName = task['assignee__first_name'];
  const username  = task['assignee__username'] || 'You';
  const assignee  = firstName ? `${firstName} ${task['assignee__last_name'] || ''}`.trim() : username;
  const role      = task['assignee__role'] || '';
  const rc = ROLE_COLORS[role] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
  const ss = statusStyle[task.status] || statusStyle['To Do'];
  const actionMap = { 'To Do': 'needs to work on', 'In Progress': 'is working on', 'Testing': 'submitted for review', 'Done': 'completed' };
  const action = actionMap[task.status] || 'is working on';
  const pc = priorityColor[task.priority];
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: isLast ? 'none' : '1px solid hsl(var(--border))' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#fff' }}>
        {assignee.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
          <strong>{assignee.toUpperCase()}</strong>
          {role && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, backgroundColor: rc.bg, color: rc.text, marginLeft: 4, textTransform: 'uppercase' }}>{role.replace('_', ' ')}</span>}
          {' '}{action.toUpperCase()}{' '}
          <span style={{ color: 'hsl(var(--primary))', fontWeight: 500 }}>{task.title}</span>{' '}
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: { 'To Do': 'hsl(215 16% 50%)', 'In Progress': 'hsl(199 89% 48%)', 'Testing': 'hsl(38 95% 50%)', 'Done': 'hsl(145 63% 38%)' }[task.status] || 'hsl(215 16% 50%)', color: '#fff' }}>{task.status}</span>
          {pc && <span style={{ fontSize: 10, color: pc, fontWeight: 600, marginLeft: 4, textTransform: 'capitalize' }}>{task.priority}</span>}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
          {task['project__name'] && <span>{task['project__name']} · </span>}
          {timeAgo(task.created_at)}
        </p>
      </div>
    </div>
  );
}

function CardSection({ title, children, empty }) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
        <SectionTitle>{title}</SectionTitle>
      </div>
      {empty
        ? <p style={{ padding: '16px', fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>{empty}</p>
        : children}
    </div>
  );
}

// ── Role-wise content ─────────────────────────────────────────────────────────

function AdminContent({ stats, recent_activity }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatCard label="Total Users"    value={stats?.total_users}    color="hsl(var(--primary))" />
        <StatCard label="Total Projects" value={stats?.total_projects} color="hsl(var(--info))" />
        <StatCard label="Total Issues"   value={stats?.total_issues}   color="hsl(var(--warning))" />
        <StatCard label="Open Issues"    value={stats?.open_issues}    color="hsl(var(--destructive))" />
      </div>
      <CardSection title="Recent Activity" empty={!recent_activity?.length ? 'No activity yet.' : null}>
        {recent_activity?.map((a, i) => <ActivityRow key={i} log={a} isLast={i === recent_activity.length - 1} />)}
      </CardSection>
    </>
  );
}

function ManagerContent({ stats, projects, recent_activity }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatCard label="Projects"    value={stats?.total_projects} color="hsl(var(--primary))" />
        <StatCard label="Issues"      value={stats?.total_issues}   color="hsl(var(--warning))" />
        <StatCard label="Open Issues" value={stats?.open_issues}    color="hsl(var(--destructive))" />
        <StatCard label="Team Size"   value={stats?.team_members}   color="hsl(var(--info))" />
      </div>
      {!!projects?.length && (
        <CardSection title="Projects">
          {projects.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < projects.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))' }}>{p.name}</span>
              {p.start_date && <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{p.start_date} – {p.end_date || '—'}</span>}
            </div>
          ))}
        </CardSection>
      )}
      <CardSection title="Recent Activity" empty={!recent_activity?.length ? 'No activity yet.' : null}>
        {recent_activity?.map((a, i) => <ActivityRow key={i} log={a} isLast={i === recent_activity.length - 1} />)}
      </CardSection>
    </>
  );
}

function ClientContent({ stats, recent_issues }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatCard label="Projects"        value={stats?.total_projects}  color="hsl(var(--primary))" />
        <StatCard label="Issues Reported" value={stats?.total_issues}    color="hsl(var(--warning))" />
        <StatCard label="Open"            value={stats?.open_issues}     color="hsl(var(--destructive))" />
        <StatCard label="Resolved"        value={stats?.resolved_issues} color="hsl(var(--success))" />
      </div>
      <CardSection title="Recent Issues" empty={!recent_issues?.length ? 'No issues reported yet.' : null}>
        {recent_issues?.map((issue, i) => <IssueRow key={issue.id} issue={issue} isLast={i === recent_issues.length - 1} />)}
      </CardSection>
    </>
  );
}

function EmployeeContent({ stats, projects, recent_tasks, recent_issues }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatCard label="Total Tasks"  value={stats?.total_tasks}     color="hsl(var(--primary))" />
        <StatCard label="Completed"    value={stats?.completed_tasks} color="hsl(var(--success))" />
        <StatCard label="In Progress"  value={stats?.in_progress}     color="hsl(var(--info))" />
        <StatCard label="Projects"     value={stats?.total_projects}  color="hsl(var(--warning))" />
      </div>
      {!!projects?.length && (
        <CardSection title="Projects">
          {projects.map((p, i) => (
            <div key={p.id} style={{ padding: '10px 16px', borderBottom: i < projects.length - 1 ? '1px solid hsl(var(--border))' : 'none', fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))' }}>
              {p.name}
            </div>
          ))}
        </CardSection>
      )}
      <CardSection title="Recent Tasks" empty={!recent_tasks?.length ? 'No tasks assigned yet.' : null}>
        {recent_tasks?.map((task, i) => <TaskRow key={task.id} task={task} isLast={i === recent_tasks.length - 1} />)}
      </CardSection>
      <CardSection title="Assigned Issues" empty={!recent_issues?.length ? 'No issues assigned yet.' : null}>
        {recent_issues?.map((issue, i) => <IssueRow key={issue.id} issue={issue} isLast={i === recent_issues.length - 1} showAssignee />)}
      </CardSection>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const EMPLOYEE_ROLES = ['frontend_developer', 'backend_developer', 'fullstack_developer', 'devops', 'qa_tester', 'ui_ux_designer', 'employee'];

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const profileId = id || currentUser?.id;

  useEffect(() => {
    if (!profileId) return;
    Promise.all([
      userService.getById(profileId),
      userService.getProfileStats(profileId),
    ]).then(([uRes, sRes]) => {
      setUser(uRes.data);
      setStats(sRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [profileId]);

  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Loading profile...</div>;
  if (!user) return <div style={{ padding: '60px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>User not found.</div>;

  const rs = roleStyle[user.role] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', label: user.role };
  const avatarColor = avatarColors[user.id % avatarColors.length];
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Banner */}
      <div style={{ height: 130, background: 'linear-gradient(135deg, hsl(var(--primary) / 0.85) 0%, hsl(var(--info) / 0.6) 100%)' }} />

      <div style={{ padding: '0 28px 32px' }}>
        {/* Avatar + settings */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -38 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', backgroundColor: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff', border: '4px solid hsl(var(--background))' }}>
            {getInitials(user)}
          </div>
          {isOwnProfile && (
            <button onClick={() => navigate('/settings')} style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 4 }}>
              Account settings
            </button>
          )}
        </div>

        {/* Name + Role */}
        <div style={{ marginTop: 12, marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>{getDisplayName(user)}</h1>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 4, backgroundColor: rs.bg, color: rs.text }}>{rs.label}</span>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
            {user.role === 'admin'   && <AdminContent    stats={stats?.stats} recent_activity={stats?.recent_activity} />}
            {user.role === 'manager' && <ManagerContent  stats={stats?.stats} projects={stats?.projects} recent_activity={stats?.recent_activity} />}
            {user.role === 'client'  && <ClientContent   stats={stats?.stats} recent_issues={stats?.recent_issues} />}
            {EMPLOYEE_ROLES.includes(user.role) && <EmployeeContent stats={stats?.stats} projects={stats?.projects} recent_tasks={stats?.recent_tasks} recent_issues={stats?.recent_issues} />}
          </div>

          {/* Details panel */}
          <div style={{ width: 240, flexShrink: 0 }}>
            <div style={{ ...card, padding: '16px 20px' }}>
              <div style={{ marginBottom: 12 }}>
                <SectionTitle>Details</SectionTitle>
              </div>
              {[
                { label: 'Email',    value: user.email },
                { label: 'Username', value: user.username },
                { label: 'Status',   value: user.is_active !== false ? 'Active' : 'Inactive' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', width: 68, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, color: 'hsl(var(--foreground))', fontWeight: 500, wordBreak: 'break-all' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
