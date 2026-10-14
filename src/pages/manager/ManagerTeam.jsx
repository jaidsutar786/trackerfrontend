import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';

const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };
const avatarColors = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--type-epic))', 'hsl(var(--type-bug))'];
const roleColor = { admin: 'hsl(var(--type-epic))', manager: 'hsl(var(--primary))', employee: 'hsl(var(--info))', client: 'hsl(var(--success))' };

export default function ManagerTeam() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getAll().then((r) => setMembers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Team</h1>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
          {loading ? 'Loading...' : `${members.length} team member${members.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Loading team...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {members.map((m) => (
            <div key={m.id} style={{ ...card, padding: 20, display: 'flex', alignItems: 'center', gap: 14, transition: 'box-shadow 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: avatarColors[m.id % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(m.first_name || m.username)[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.first_name ? `${m.first_name} ${m.last_name}` : m.username}
                </p>
                <p style={{ margin: '2px 0 6px', fontSize: 12, color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: (roleColor[m.role] || 'hsl(var(--muted))') + '22', color: roleColor[m.role] || 'hsl(var(--muted-foreground))', textTransform: 'capitalize' }}>
                  {m.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
