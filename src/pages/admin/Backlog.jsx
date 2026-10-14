import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { issueService } from '../../services/issueService';
import { useNotifications } from '../../context/NotificationContext';
import { getDisplayName, getInitials } from '../../utils/userUtils';
import { Bug, CheckSquare, Zap, ChevronsUp, ChevronUp, Equal, ChevronDown, Check, Search } from 'lucide-react';
import ItemDetailModal from '../../components/ItemDetailModal';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };

const TYPE_CONFIG = {
  bug:   { icon: Bug,         color: 'hsl(var(--type-bug))',   bg: 'hsl(var(--type-bug) / 0.15)' },
  story: { icon: Zap,         color: 'hsl(var(--type-story))', bg: 'hsl(var(--type-story) / 0.15)' },
  task:  { icon: CheckSquare, color: 'hsl(var(--type-task))',  bg: 'hsl(var(--type-task) / 0.15)' },
};

const PRIORITY_CONFIG = {
  highest: { icon: ChevronsUp, color: 'hsl(var(--priority-highest))', text: 'Highest' },
  high:    { icon: ChevronUp,  color: 'hsl(var(--priority-high))',    text: 'High' },
  medium:  { icon: Equal,      color: 'hsl(var(--priority-medium))',  text: 'Medium' },
  low:     { icon: ChevronDown,color: 'hsl(var(--priority-low))',     text: 'Low' },
};

const STATUS_CONFIG = {
  'To Do':       { bg: 'hsl(var(--muted))',           color: 'hsl(var(--muted-foreground))', text: 'To Do' },
  'In Progress': { bg: 'hsl(var(--info) / 0.15)',     color: 'hsl(var(--info))',             text: 'In Progress' },
  'Testing':     { bg: 'hsl(var(--warning) / 0.15)',  color: 'hsl(var(--warning))',          text: 'Testing' },
  'Done':        { bg: 'hsl(var(--success) / 0.15)',  color: 'hsl(var(--success))',          text: 'Done' },
};

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Testing', 'Done'];

export default function AdminBacklog() {
  const { user } = useAuth();
  const { onDataUpdate } = useNotifications();
  const [backlog, setBacklog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusDropdowns, setStatusDropdowns] = useState({});
  const [dropdownPos, setDropdownPos] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    const close = () => setStatusDropdowns({});
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const fetchBacklog = () => {
    const req = isAdmin
      ? issueService.getAll({ status: 'To Do', page_size: 1000 })
      : issueService.getBacklog();
    req.then((r) => {
      const data = r.data?.results || r.data || [];
      setBacklog(Array.isArray(data) ? data : []);
    }).catch(() => setBacklog([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBacklog(); }, []);
  useEffect(() => onDataUpdate(() => fetchBacklog()), []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await issueService.update(id, { status: newStatus });
      setBacklog((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i));
      if (selectedItem?.id === id) setSelectedItem(prev => ({ ...prev, status: newStatus }));
    } catch {}
  };

  const filtered = backlog.filter(i =>
    i.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="responsive-page" style={{ width: '100%', maxWidth: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
      <div className="responsive-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Backlog</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            {loading ? 'Loading...' : `${filtered.length} issue${filtered.length !== 1 ? 's' : ''} in backlog`}
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search backlog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '7px 12px 7px 32px', borderRadius: 6, fontSize: 13, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', outline: 'none', width: 220 }}
            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--ring))'}
            onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
          />
        </div>
      </div>

      <div className="responsive-table-wrap" style={{ ...card, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Loading backlog...</div>
        ) : backlog.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>Backlog is empty</p>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>All issues are in progress or completed.</p>
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'hsl(var(--card))' }}>
              <tr>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 40 }}>Type</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 120 }}>Project</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 180 }}>Summary</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))' }}>Description</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 110 }}>Priority</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 130 }}>Status</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))', width: 110 }}>Project</th>
                {isAdmin && <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid hsl(var(--border))', width: 120 }}>Assignee</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const tc = TYPE_CONFIG[item.issue_type] || TYPE_CONFIG.task;
                const pc = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG['To Do'];
                const TypeIcon = tc.icon;
                const PriorityIcon = pc.icon;

                return (
                  <tr key={item.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid hsl(var(--border))' : 'none', transition: 'background 0.15s', backgroundColor: 'transparent', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => setSelectedItem({ ...item, itemType: 'issue', comments: item.comments || [] })}
                  >
                    {/* Type */}
                    <td style={{ padding: '5px 10px', textAlign: 'center', borderRight: '1px solid hsl(var(--border))' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TypeIcon size={12} color={tc.color} />
                      </div>
                    </td>

                    {/* Project */}
                    <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                        {item.project_name || '—'}
                      </span>
                    </td>

                    {/* Summary */}
                    <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))', maxWidth: 180 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {item.title}
                      </span>
                    </td>

                    {/* Description */}
                    <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                      <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {item.description || 'No description provided'}
                      </span>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <PriorityIcon size={14} color={pc.color} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: pc.color }}>{pc.text}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '5px 10px', borderRight: '1px solid hsl(var(--border))' }} onClick={(e) => e.stopPropagation()}>
                      <div>
                        <button
                          onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setDropdownPos({ top: r.bottom, left: r.left }); setStatusDropdowns(prev => ({ ...prev, [item.id]: !prev[item.id] })); }}
                          style={{ padding: '4px 8px', borderRadius: 4, border: 'none', backgroundColor: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                        >
                          <span style={{ whiteSpace: 'nowrap' }}>{sc.text.toUpperCase()}</span>
                          <ChevronDown size={12} />
                        </button>
                        {statusDropdowns[item.id] && (
                          <div style={{ position: 'fixed', top: dropdownPos.top + 4, left: dropdownPos.left, minWidth: 130, backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, boxShadow: 'var(--shadow-lg)', zIndex: 9999, overflow: 'hidden' }}>
                            {STATUS_OPTIONS.map((s) => {
                              const ssc = STATUS_CONFIG[s];
                              const active = item.status === s;
                              return (
                                <button key={s}
                                  onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, s); setStatusDropdowns({}); }}
                                  style={{ width: '100%', padding: '7px 10px', border: 'none', backgroundColor: active ? ssc.bg : 'transparent', color: active ? ssc.color : 'hsl(var(--foreground))', fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
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

                    {/* Project */}
                    <td style={{ padding: '5px 10px', borderRight: isAdmin ? '1px solid hsl(var(--border))' : 'none' }}>
                      <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{item.project_name || '—'}</span>
                    </td>

                    {/* Assignee */}
                    {isAdmin && (
                      <td style={{ padding: '5px 10px' }}>
                        {item.assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'white', flexShrink: 0 }}>
                              {getInitials(item.assignee)}
                            </div>
                            <span style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>{getDisplayName(item.assignee)}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStatusChange={(id, newStatus) => handleStatusChange(id, newStatus)}
          onAssigneeChange={(newAssignee) => {
            setBacklog(prev => prev.map(i => i.id === selectedItem.id ? { ...i, assignee: newAssignee } : i));
            setSelectedItem(prev => ({ ...prev, assignee: newAssignee }));
          }}
          onUpdate={(patch) => {
            setBacklog(prev => prev.map(i => i.id === selectedItem.id ? { ...i, ...patch } : i));
            setSelectedItem(prev => ({ ...prev, ...patch }));
          }}
        />
      )}
    </div>
  );
}
