import { useState } from 'react';

export default function ExpandableText({ text, lines = 2, empty = '—', limit = 90 }) {
  const [expanded, setExpanded] = useState(false);
  const value = (text || '').trim();
  const canToggle = value.length > limit;

  if (!value) {
    return <span style={{ fontStyle: 'italic' }}>{empty}</span>;
  }

  return (
    <span style={{ display: 'block', minWidth: 0 }}>
      <span
        style={{
          display: expanded ? 'block' : '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : lines,
          WebkitBoxOrient: 'vertical',
          overflow: expanded ? 'visible' : 'hidden',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
      {canToggle && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((current) => !current);
          }}
          style={{
            marginTop: 4,
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: 'hsl(var(--primary))',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </span>
  );
}
