import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import ExpandableText from '../../components/ExpandableText';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const avatarColors = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--type-epic))'];

export default function ManagerProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService.getAll().then((r) => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="responsive-page" style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Projects</h1>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
          {loading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''} assigned`}
        </p>
      </div>

      <div className="responsive-table-wrap" style={{ ...card, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0 0 6px' }}>No projects assigned</p>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Contact your admin to get assigned to a project.</p>
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Project Name', 'Description', 'Members', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < projects.length - 1 ? '1px solid hsl(var(--border))' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{p.name}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'hsl(var(--muted-foreground))', maxWidth: 300 }}>
                    <ExpandableText text={p.description} lines={2} empty="No description" />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {(p.members || []).slice(0, 4).map((m, idx) => (
                        <div key={m.id} title={m.username} style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: avatarColors[m.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', border: '2px solid hsl(var(--card))', marginLeft: idx > 0 ? -8 : 0 }}>
                          {m.username[0].toUpperCase()}
                        </div>
                      ))}
                      {(p.members?.length ?? 0) > 4 && (
                        <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'hsl(var(--secondary-foreground))', border: '2px solid hsl(var(--card))', marginLeft: -8 }}>
                          +{p.members.length - 4}
                        </div>
                      )}
                      {(p.members?.length ?? 0) === 0 && <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/projects/${p.slug}/modules`)} style={{ padding: '6px 14px', borderRadius: 5, border: '1px solid hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Modules</button>
                      <button onClick={() => navigate(`/projects/${p.id}`)} style={{ padding: '6px 14px', borderRadius: 5, border: '1px solid hsl(var(--border))', backgroundColor: 'transparent', color: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
