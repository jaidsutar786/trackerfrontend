const ITEM_HEIGHT = 49;
const VISIBLE = 6;

const priorityColor = { highest: 'hsl(var(--priority-highest))', high: 'hsl(var(--priority-high))', medium: 'hsl(var(--priority-medium))', low: 'hsl(var(--priority-low))' };
const statusStyle = { 'To Do': { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' }, 'Testing': { bg: 'hsl(var(--info) / 0.12)', text: 'hsl(var(--info))' }, 'Testing': { bg: 'hsl(var(--warning) / 0.12)', text: 'hsl(var(--warning))' }, 'Done': { bg: 'hsl(var(--success) / 0.12)', text: 'hsl(var(--success))' } };

export default function IssuesScrollList({ issues, onSelect }) {
  const needsScroll = issues.length > VISIBLE;

  return (
    <div
      className="issues-scroll"
      style={{
        maxHeight: needsScroll ? VISIBLE * ITEM_HEIGHT : 'none',
        overflowY: needsScroll ? 'auto' : 'visible',
      }}
    >
      {issues.map((issue, i) => {
        const ss = statusStyle[issue.status] || statusStyle['To Do'];
        return (
          <div key={issue.id}
            onClick={() => onSelect(issue)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < issues.length - 1 ? '1px solid hsl(var(--border))' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: priorityColor[issue.priority], flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: 'hsl(var(--foreground))', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</span>
            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>{issue.project_name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: ss.bg, color: ss.text, whiteSpace: 'nowrap' }}>{issue.status}</span>
          </div>
        );
      })}
    </div>
  );
}
