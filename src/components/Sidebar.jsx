import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teoLogo from '../assets/Teople.jpeg';

export const DRAWER_WIDTH = 240;
export const COLLAPSED_WIDTH = 56;

// SVG Icons
const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  clients: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  projects: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  issues: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  board: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="11" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" />
    </svg>
  ),
  backlog: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  reports: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  activity: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2" />
    </svg>
  ),
  subtasks: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" /><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.35 0 4.48.9 6.08 2.38" />
    </svg>
  ),
  integrations: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  ),
};

const roleMenus = {
  admin: [
    { label: 'Dashboard',      path: '/dashboard',      icon: icons.dashboard },
    { label: 'Clients',        path: '/clients',        icon: icons.clients },
    { label: 'Projects',       path: '/projects',       icon: icons.projects },
    { label: 'Users',          path: '/users',          icon: icons.users },
    { label: 'Issues',         path: '/issues',         icon: icons.issues },
    { label: 'Board',          path: '/board',          icon: icons.board },
    { label: 'Backlog',        path: '/backlog',        icon: icons.backlog },
    { label: 'Reports',        path: '/reports',        icon: icons.reports },
    { label: 'Activity Logs',  path: '/activity',       icon: icons.activity },
    { label: 'Settings',       path: '/settings',       icon: icons.settings },
    { label: 'Integrations',   path: '/integrations',   icon: icons.integrations },
  ],
  manager: [
    { label: 'Dashboard', path: '/dashboard', icon: icons.dashboard },
    { label: 'Projects',  path: '/projects',  icon: icons.projects },
    { label: 'Team',      path: '/team',      icon: icons.users },
    { label: 'Issues',    path: '/issues',    icon: icons.issues },
    { label: 'Board',     path: '/board',     icon: icons.board },
    { label: 'Backlog',   path: '/backlog',   icon: icons.backlog },
    { label: 'Reports',   path: '/reports',   icon: icons.reports },
  ],
  client: [
    { label: 'Dashboard',    path: '/dashboard', icon: icons.dashboard },
    { label: 'My Projects',  path: '/projects',  icon: icons.projects },
    { label: 'Issues',       path: '/issues',    icon: icons.issues },
    { label: 'Reports',      path: '/reports',   icon: icons.reports },
  ],
};

const employeeMenu = [
  { label: 'Dashboard',  path: '/dashboard', icon: icons.dashboard },
  { label: 'My Tasks',   path: '/tasks',     icon: icons.issues },
  { label: 'Reports',    path: '/reports',   icon: icons.reports },
  { label: 'Board',      path: '/board',     icon: icons.board },
  { label: 'Backlog',    path: '/backlog',   icon: icons.backlog },
];

const employeeRoles = ['employee', 'frontend_developer', 'backend_developer', 'fullstack_developer', 'devops', 'qa_tester', 'ui_ux_designer'];
employeeRoles.forEach(role => {
  roleMenus[role] = employeeMenu;
});

export default function Sidebar({ open, onToggle, width: sidebarWidth = DRAWER_WIDTH }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const menus = roleMenus[user?.role] || [];
  const width = open ? DRAWER_WIDTH : COLLAPSED_WIDTH;
  const visibleMenus = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const moduleByPath = {
      '/clients': 'clients',
      '/users': 'users',
      '/projects': 'projects',
      '/issues': 'issues',
      '/board': 'tasks',
      '/backlog': 'tasks',
      '/tasks': 'tasks',
      '/reports': 'reports',
      '/activity': 'activity',
      '/settings': 'settings',
      '/integrations': 'settings',
    };
    return menus.filter((item) => {
      const module = moduleByPath[item.path];
      const permitted = !module || user?.workspace_permissions?.[module] !== false;
      return permitted && (!query || item.label.toLowerCase().includes(query));
    });
  }, [menus, searchQuery, user?.workspace_permissions]);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div style={{
      width: sidebarWidth, minWidth: sidebarWidth, height: '100vh',
      backgroundColor: 'hsl(var(--sidebar-background))',
      color: 'hsl(var(--sidebar-foreground))',
      borderRight: '1px solid hsl(var(--sidebar-border))',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header - Logo + Toggle */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={teoLogo} alt="Teople" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: 'hsl(var(--sidebar-foreground))' }}>Teople</span>
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '6px', borderRadius: 6, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'hsl(var(--sidebar-foreground))',
          }}
          title="Collapse sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M15 3v18" />
            <path d="m10 15-3-3 3-3" />
          </svg>
        </button>
      </div>

      <div style={{ padding: '10px 10px 0', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            style={{
              width: '100%',
              height: 36,
              padding: '8px 10px 8px 34px',
              borderRadius: 7,
              border: '1px solid hsl(var(--sidebar-border))',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '24px 6px 10px', overflowY: 'auto' }} className="scrollbar-thin">
        {visibleMenus.map((item) => {
          const active = isActive(item.path);
          return (
            <div key={item.path} style={{ position: 'relative', marginBottom: 2 }}>
              {active && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 2,
                  height: 20,
                  backgroundColor: 'hsl(var(--primary))',
                  borderRadius: 1,
                }} />
              )}
              <button
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 12, justifyContent: 'flex-start',
                  padding: '8px 10px',
                  borderRadius: 3, border: 'none', cursor: 'pointer',
                  backgroundColor: active ? 'hsl(var(--sidebar-accent))' : 'transparent',
                  color: active ? 'hsl(var(--sidebar-accent-foreground))' : 'hsl(var(--sidebar-foreground))',
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'hsl(0 0% 100% / 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          </div>
          );
        })}
      </nav>

      <div style={{ height: 1, backgroundColor: 'hsl(var(--sidebar-border))', margin: '0 8px' }} />
      <div style={{ height: 8 }} />
    </div>
  );
}
