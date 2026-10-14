import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teoLogo from '../assets/Teople.jpeg';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { getDisplayName, getInitials } from '../utils/userUtils';
import { projectService } from '../services/projectService';
import { issueService } from '../services/issueService';
import { Search, Plus, Settings } from 'lucide-react';
import useMediaQuery from '../hooks/useMediaQuery';

function PanelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
      <path d="m10 15-3-3 3-3" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

const roleColors = {
  admin: 'hsl(var(--type-epic))',
  manager: 'hsl(var(--info))',
  employee: 'hsl(var(--success))',
  client: 'hsl(var(--warning))',
};

const navbarStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 300,
  height: 56,
  backgroundColor: 'hsl(var(--navbar))',
  color: 'hsl(var(--navbar-foreground))',
  borderBottom: '1px solid hsl(var(--border))',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  gap: 8,
  flexShrink: 0,
};

const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: 'hsl(var(--navbar-foreground))',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function Navbar({ sidebarOpen, onToggle, onToggleHoverEnter, onToggleHoverLeave, onCreateProject, onCreateIssue }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, preferences, markAsRead, markAllAsRead, deleteNotification, updatePreferences } = useNotifications();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const color = roleColors[user?.role] || 'hsl(var(--primary))';
  const isMobile = useMediaQuery('(max-width: 700px)');

  // Search functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      setSearchLoading(true);
      const searchTimeout = setTimeout(async () => {
        try {
          const [projectsRes, issuesRes] = await Promise.all([
            projectService.getAll(),
            issueService.getAll()
          ]);
          
          const projects = projectsRes.data || [];
          const issues = (issuesRes.data.results || issuesRes.data || []);
          
          const filteredProjects = projects.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
          ).slice(0, 3);
          
          const filteredIssues = issues.filter(i => 
            i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.description?.toLowerCase().includes(searchQuery.toLowerCase())
          ).slice(0, 5);
          
          setSearchResults([
            ...filteredProjects.map(p => ({ type: 'project', ...p })),
            ...filteredIssues.map(i => ({ type: 'issue', ...i }))
          ]);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 300);
      
      return () => clearTimeout(searchTimeout);
    } else {
      setSearchResults([]);
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const handleCreateClick = () => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      onCreateProject?.();
    } else if (user?.role === 'client') {
      onCreateIssue?.();
    }
  };

  const shouldShowCreateButton = user?.role !== 'employee';

  // Adjust navbar style based on sidebar state
  const dynamicNavbarStyle = {
    ...navbarStyle,
    padding: isMobile ? '0 8px' : navbarStyle.padding,
    gap: isMobile ? 6 : navbarStyle.gap,
    overflow: 'visible',
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const notificationTabs = [
    { key: 'all', label: 'All', types: null },
    { key: 'assignments', label: 'Assignments', types: ['project_assigned', 'feature_assigned', 'task_assigned', 'subtask_assigned', 'issue_assigned'] },
    { key: 'comments', label: 'Comments', types: ['issue_comment'] },
    { key: 'status', label: 'Status', types: ['issue_status_changed', 'task_status_changed', 'subtask_status_changed', 'task_completed'] },
  ];

  const activeTypes = notificationTabs.find((tab) => tab.key === activeTab)?.types;
  const filteredNotifications = notifications
    .filter((n) => !activeTypes || activeTypes.includes(n.notification_type))
    .filter((n) => !showUnreadOnly || !n.read);

  const toggleMutedType = (type) => {
    const muted = new Set(preferences?.muted_types || []);
    if (muted.has(type)) muted.delete(type);
    else muted.add(type);
    updatePreferences?.({ muted_types: Array.from(muted) });
  };

  const handleNotificationClick = async (notif) => {
    await markAsRead(notif.id);
  };

  return (
    <header style={dynamicNavbarStyle}>
      {/* Logo + Toggle - only when sidebar closed */}
      {!sidebarOpen && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: isMobile ? 0 : 8, minWidth: 0, flexShrink: 0 }}>
            <img src={teoLogo} alt="Teople" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
            <span style={{ fontWeight: 600, fontSize: 15, color: 'hsl(var(--navbar-foreground))', display: isMobile ? 'none' : 'inline' }}>Teople</span>
          </div>
          <button
            onClick={onToggle}
            onMouseEnter={onToggleHoverEnter}
            onMouseLeave={onToggleHoverLeave}
            style={{ ...iconBtnStyle, flexShrink: 0, marginLeft: isMobile ? 2 : 12 }}
            title="Expand sidebar"
          >
            <PanelIcon />
          </button>
        </>
      )}

      {/* Center - Search Box & Create Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-end' : 'center', flex: 1, gap: isMobile ? 6 : 12, minWidth: 0 }}>
        {/* Search Box */}
        <div ref={searchRef} style={{ position: 'relative', maxWidth: isMobile ? 'none' : 500, width: isMobile ? 'auto' : '100%', flexShrink: 0 }}>
          {isMobile ? (
            <button
              onClick={() => setSearchOpen((p) => !p)}
              style={{ ...iconBtnStyle, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
              title="Search"
            >
              <Search size={18} />
            </button>
          ) : (
          <div style={{ position: 'relative' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: 12, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'hsl(var(--muted-foreground))' 
              }} 
            />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 40px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'hsl(var(--primary))';
                setSearchOpen(true);
              }}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
          </div>
          )}
          
          {/* Search Results Dropdown */}
          {isMobile && searchOpen && (
            <div style={{
              position: 'fixed',
              top: 64,
              left: 10,
              right: 10,
              zIndex: 1500,
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              boxShadow: 'var(--shadow-lg)',
              padding: 10,
            }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    fontSize: 14,
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {searchOpen && (searchQuery.length > 1 || searchResults.length > 0) && (
            <div style={{
              position: isMobile ? 'fixed' : 'absolute',
              top: isMobile ? 122 : '100%',
              left: isMobile ? 10 : 0,
              right: isMobile ? 10 : 0,
              marginTop: isMobile ? 0 : 4,
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1500,
              maxHeight: isMobile ? '60vh' : 400,
              overflowY: 'auto'
            }}>
              {searchLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                  Searching...
                </div>
              ) : searchResults.length === 0 && searchQuery.length > 1 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <div>
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      style={{
                        padding: '12px 16px',
                        borderBottom: index < searchResults.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(var(--muted))'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        if (result.type === 'project') {
                          navigate('/projects');
                        } else if (result.type === 'issue') {
                          navigate('/issues');
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          backgroundColor: result.type === 'project' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--type-bug) / 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 600,
                          color: result.type === 'project' ? 'hsl(var(--primary))' : 'hsl(var(--type-bug))'
                        }}>
                          {result.type === 'project' ? 'P' : 'I'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                            {result.type === 'project' ? result.name : result.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                            {result.type === 'project' ? 'Project' : `Issue • HRM-${result.id}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Button */}
        {shouldShowCreateButton && (
          <button
            onClick={handleCreateClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 0 : 6,
              padding: isMobile ? '8px 10px' : '8px 16px',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              border: 'none',
              borderRadius: 6,
              fontSize: isMobile ? 0 : 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
            title={user?.role === 'admin' || user?.role === 'manager' ? 'Create Project' : 'Create Issue'}
          >
            <Plus size={16} />
            {!isMobile && (user?.role === 'client' ? 'Report Issue' : 'Create')}
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 4, flexShrink: 0 }}>
        {/* Theme Toggle */}
        <button onClick={toggleTheme} style={iconBtnStyle} title="Toggle theme">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen((p) => !p)} style={{ ...iconBtnStyle, position: 'relative' }} title="Notifications">
            <BellIcon />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, backgroundColor: 'hsl(var(--destructive))', color: '#fff', borderRadius: '50%', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              style={{
                position: 'absolute', top: 40, right: isMobile ? -42 : 0, width: isMobile ? 'min(92vw, 360px)' : 420,
                backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 1400, maxHeight: 600, display: 'flex', flexDirection: 'column',
              }}
              onMouseLeave={() => setNotifOpen(false)}
            >
              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'hsl(var(--foreground))' }}>Notifications</div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{unreadCount} unread</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => markAllAsRead()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 700, padding: 0 }}
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={() => setShowNotifPrefs((p) => !p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: showNotifPrefs ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', padding: 0, display: 'flex' }}
                    title="Notification preferences"
                  >
                    <Settings size={16} />
                  </button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}>
                    <span>Only show unread</span>
                    <div
                      onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                      style={{
                        width: 36, height: 20, borderRadius: 10, backgroundColor: showUnreadOnly ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff',
                        position: 'absolute', top: 2, left: showUnreadOnly ? 18 : 2, transition: 'left 0.2s',
                      }} />
                    </div>
                  </label>
                  <button
                    onClick={() => setNotifOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 18, padding: 0 }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {showNotifPrefs && (
                <div style={{ padding: 14, borderBottom: '1px solid hsl(var(--border))', display: 'grid', gap: 12, background: 'hsl(var(--muted) / 0.25)' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, color: 'hsl(var(--foreground))' }}>
                    <span>In-app notifications</span>
                    <input type="checkbox" checked={preferences?.in_app_enabled !== false} onChange={(e) => updatePreferences?.({ in_app_enabled: e.target.checked })} />
                  </label>
                  <label style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, color: 'hsl(var(--foreground))' }}>
                    <span>Email digests</span>
                    <input type="checkbox" checked={preferences?.email_enabled !== false} onChange={(e) => updatePreferences?.({ email_enabled: e.target.checked })} />
                  </label>
                  <label style={{ display: 'grid', gap: 5, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                    Digest frequency
                    <select disabled={preferences?.email_enabled === false} value={preferences?.email_digest || 'off'} onChange={(e) => updatePreferences?.({ email_digest: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
                      <option value="off">Off</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </label>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>Mute types</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(preferences?.available_types || []).map((type) => {
                        const muted = (preferences?.muted_types || []).includes(type.value);
                        return (
                          <button
                            key={type.value}
                            onClick={() => toggleMutedType(type.value)}
                            style={{ border: '1px solid hsl(var(--border))', borderRadius: 5, padding: '4px 7px', fontSize: 11, cursor: 'pointer', background: muted ? 'hsl(var(--destructive) / 0.10)' : 'hsl(var(--background))', color: muted ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))' }}
                          >
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border))', padding: '0 16px' }}>
                {notificationTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, color: activeTab === tab.key ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      borderBottom: activeTab === tab.key ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                      marginBottom: -1,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div style={{ overflowY: 'auto', maxHeight: 460 }} className="scrollbar-thin">
                {filteredNotifications.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>🔔</div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 4px' }}>
                      {showUnreadOnly ? 'No unread notifications' : 'You have no notifications'}
                    </p>
                    <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                      {showUnreadOnly ? 'All caught up!' : 'from the last 30 days.'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: '12px 16px 12px 20px', borderBottom: '1px solid hsl(var(--border))',
                        backgroundColor: notif.read ? 'transparent' : 'hsl(var(--accent) / 0.4)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        display: 'flex',
                        gap: 10,
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.read ? 'transparent' : 'hsl(var(--accent) / 0.4)'}
                    >
                      {!notif.read && (
                        <div style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 3px', fontSize: 13, lineHeight: 1.5, color: 'hsl(var(--foreground))' }}>
                          <strong style={{ fontWeight: 700 }}>
                            {notif.actor_name || (notif.title || '').replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim()}
                          </strong>
                          {notif.actor_role && (
                            <span style={{
                              fontSize: 10, fontWeight: 600,
                              padding: '1px 6px', borderRadius: 4, marginLeft: 6,
                              backgroundColor: 'hsl(var(--primary) / 0.12)',
                              color: 'hsl(var(--primary))',
                              textTransform: 'uppercase',
                              verticalAlign: 'middle',
                            }}>
                              {notif.actor_role.replace('_', ' ')}
                            </span>
                          )}
                        </p>
                        <p style={{ margin: '0 0 5px', fontSize: 12, fontWeight: 400, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, textTransform: 'uppercase' }}>
                          {(notif.message || notif.title || '').replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim()}
                        </p>
                        <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{getTimeAgo(notif.timestamp)}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 16, flexShrink: 0, padding: 4, opacity: 0.5, alignSelf: 'flex-start' }}
                        title="Delete"
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
                      >
                        ×
                      </button>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((p) => !p)}
            style={{ ...iconBtnStyle, width: 32, height: 32, borderRadius: '50%', backgroundColor: color, fontWeight: 700, fontSize: 13, padding: 0 }}
            title="Profile"
          >
            {getInitials(user)}
          </button>

          {dropdownOpen && (
            <div
              style={{ position: 'absolute', top: 40, right: 0, width: isMobile ? 200 : 220, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 1400, overflow: 'hidden' }}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'hsl(var(--foreground))' }}>{getDisplayName(user)}</div>
                <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{user?.email || `${user?.username}@teople.com`}</div>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Profile
              </button>
              <button
                onClick={() => { setDropdownOpen(false); logout(); }}
                style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'hsl(var(--destructive))', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
