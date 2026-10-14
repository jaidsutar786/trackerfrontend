import { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import ExpandableText from '../../components/ExpandableText';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const avatarColors = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--type-epic))'];

const PROJECT_ROLES = [
  { value: 'manager',   label: 'Manager',   color: 'hsl(var(--type-epic))' },
  { value: 'lead',      label: 'Lead',      color: 'hsl(var(--primary))' },
  { value: 'developer', label: 'Developer', color: 'hsl(var(--info))' },
  { value: 'tester',    label: 'Tester',    color: 'hsl(var(--success))' },
  { value: 'devops',    label: 'DevOps',    color: 'hsl(var(--warning))' },
];

const getRoleColor = (role) => PROJECT_ROLES.find((r) => r.value === role)?.color || 'hsl(var(--muted-foreground))';
const getRoleLabel = (role) => PROJECT_ROLES.find((r) => r.value === role)?.label || role;

export default function ClientProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    projectService.getAll().then((r) => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleRow = (id) => setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const vals = { name: [a.name, b.name], start: [a.start_date||'', b.start_date||''], end: [a.end_date||'', b.end_date||''] };
    const [av, bv] = vals[sortCol] || [a.name, b.name];
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const SortIcon = ({ col }) => {
    if (sortCol === col && sortDir === 'asc') return <ArrowUp size={13} style={{ marginLeft: 3, color: 'hsl(var(--primary))', flexShrink: 0 }} />;
    if (sortCol === col && sortDir === 'desc') return <ArrowDown size={13} style={{ marginLeft: 3, color: 'hsl(var(--primary))', flexShrink: 0 }} />;
    return <ChevronsUpDown size={13} style={{ marginLeft: 3, color: 'hsl(var(--muted-foreground))', opacity: 0.5, flexShrink: 0 }} />;
  };

  return (
    <div className="responsive-page" style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>My Projects</h1>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
          {loading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>No projects yet</p>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Contact your admin to get assigned to a project.</p>
        </div>
      ) : (
        <div className="responsive-table-wrap" style={{ ...card, overflow: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid hsl(var(--border))' }}>
                {[['','NAME',200],['','KEY',80],['','DESCRIPTION',null],['start','START DATE',110],['end','END DATE',110],['','TEAM',80]].map(([col, label, w]) => (
                  <th key={label} onClick={col ? () => handleSort(col) : undefined}
                    style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: sortCol === col ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', letterSpacing: '0.5px', cursor: col ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', width: w || undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {label}{col && <SortIcon col={col} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((p) => {
                const isExpanded = !!expandedRows[p.id];
                const members = p.team_members || [];
                return (
                  <>
                    <tr key={p.id}
                      style={{ borderBottom: '1px solid hsl(var(--border))', transition: 'background 0.12s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => toggleRow(p.id)}
                            style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>
                            {isExpanded ? '−' : '›'}
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.1)', padding: '3px 8px', borderRadius: 4, letterSpacing: 1 }}>
                          {p.project_key || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', maxWidth: 260, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                        <ExpandableText text={p.description} lines={2} limit={70} empty="No description" />
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>{p.start_date || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>{p.end_date || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        {members.length > 0 ? (
                          <div style={{ display: 'flex' }}>
                            {members.slice(0, 4).map((m, idx) => (
                              <div key={m.id} title={m.user.first_name ? `${m.user.first_name} ${m.user.last_name}` : m.user.username}
                                style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: avatarColors[m.user.id % avatarColors.length], border: '2px solid hsl(var(--card))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', marginLeft: idx === 0 ? 0 : -8, zIndex: members.length - idx, position: 'relative' }}>
                                {(m.user.first_name || m.user.username)[0].toUpperCase()}
                              </div>
                            ))}
                            {members.length > 4 && (
                              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'hsl(var(--muted))', border: '2px solid hsl(var(--card))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'hsl(var(--muted-foreground))', marginLeft: -8, position: 'relative' }}>
                                +{members.length - 4}
                              </div>
                            )}
                          </div>
                        ) : <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>—</span>}
                      </td>
                    </tr>

                    {/* Expanded team sub-rows */}
                    {isExpanded && members.map((m, idx) => {
                      const name = m.user.first_name ? `${m.user.first_name} ${m.user.last_name}` : m.user.username;
                      const roleColor = getRoleColor(m.project_role);
                      return (
                        <tr key={`${p.id}-m-${m.id}`}
                          style={{ borderBottom: idx < members.length - 1 ? '1px solid hsl(var(--border) / 0.4)' : '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.25)' }}>
                          <td style={{ padding: '8px 14px 8px 50px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: avatarColors[m.user.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                {(m.user.first_name || m.user.username)[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: 13, color: 'hsl(var(--foreground))', fontWeight: 500 }}>{name}</span>
                            </div>
                          </td>
                          <td colSpan={2} style={{ padding: '8px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, backgroundColor: roleColor + '18', color: roleColor, border: `1px solid ${roleColor}33` }}>
                              {getRoleLabel(m.project_role)}
                            </span>
                          </td>
                          <td colSpan={3} style={{ padding: '8px 14px', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                            {m.user.email || ''}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
