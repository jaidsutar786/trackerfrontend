// Delete Confirmation Modal Component
export const DeleteConfirmationModal = ({ isOpen, title, message, itemName, onConfirm, onCancel, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'hsla(var(--foreground) / 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: 'hsl(var(--card))',
        borderRadius: 'var(--radius)',
        width: '100%',
        maxWidth: 400,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid hsl(var(--border))',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'hsl(var(--foreground))',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius)',
              backgroundColor: 'hsl(var(--destructive) / 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--destructive))',
            }}>
              🗑️
            </div>
            {title}
          </h2>
        </div>

        <div style={{ padding: '28px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: 'hsl(var(--foreground))', lineHeight: 1.6 }}>
            {message}
          </p>
          {itemName && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'hsl(var(--destructive) / 0.08)',
              border: '1px solid hsl(var(--destructive) / 0.2)',
              fontSize: 13,
              fontWeight: 600,
              color: 'hsl(var(--destructive))',
              marginBottom: 16,
              wordBreak: 'break-word',
            }}>
              "{itemName}"
            </div>
          )}
          <p style={{
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--muted-foreground))',
            fontStyle: 'italic',
          }}>
            This action cannot be undone.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
          padding: '28px',
          borderTop: '1px solid hsl(var(--border))',
          backgroundColor: 'hsl(var(--muted) / 0.25)',
        }}>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius)',
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--muted-foreground))',
              fontSize: 14,
              fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isDeleting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.backgroundColor = 'hsl(var(--secondary))';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius)',
              border: 'none',
              backgroundColor: 'hsl(var(--destructive))',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.9)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--destructive))';
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
