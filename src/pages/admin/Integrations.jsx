const card = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, boxShadow: 'var(--shadow-sm)' };

const integrations = [
  { id: 'slack',   name: 'Slack',    desc: 'Send issue notifications to Slack channels',   color: 'hsl(var(--success))' },
  { id: 'github',  name: 'GitHub',   desc: 'Link commits and PRs to issues automatically', color: 'hsl(var(--foreground))' },
  { id: 'jira',    name: 'Jira',     desc: 'Sync issues bidirectionally with Jira',         color: 'hsl(var(--info))' },
  { id: 'figma',   name: 'Figma',    desc: 'Attach Figma designs directly to issues',       color: 'hsl(var(--type-epic))' },
  { id: 'zapier',  name: 'Zapier',   desc: 'Automate workflows with 5000+ apps',            color: 'hsl(var(--warning))' },
];

export default function AdminIntegrations() {
  return (
    <div style={{ width: '100%', maxWidth: 720, padding: '0 20px', boxSizing: 'border-box', margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Integrations</h1>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>Connect Teople with your favourite tools</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {integrations.map((item) => {
          return (
            <div key={item.id} style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.name[0]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>{item.name}</p>
                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '3px 0 0' }}>{item.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Not configured</span>
                <button type="button" disabled title={`${item.name} integration is not configured`} style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600, cursor: 'not-allowed' }}>
                  Unavailable
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
