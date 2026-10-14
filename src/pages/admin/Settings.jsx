import { useEffect, useState } from 'react';
import { Building2, CreditCard, FolderKanban, Save, Users } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';

const panelStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
};

const inputStyle = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 6,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
  boxSizing: 'border-box',
};

function UsageMeter({ icon: Icon, label, usage }) {
  const percent = usage?.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  return (
    <div style={{ ...panelStyle, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700 }}>
        <Icon size={16} />{label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, margin: '12px 0 10px', color: 'hsl(var(--foreground))' }}>
        <strong style={{ fontSize: 24 }}>{usage?.used ?? 0}</strong>
        <span style={{ fontSize: 12 }}>/ {usage?.limit ?? 0}</span>
      </div>
      <div role="progressbar" aria-label={`${label} usage`} aria-valuemin="0" aria-valuemax={usage?.limit ?? 0} aria-valuenow={usage?.used ?? 0} style={{ height: 6, borderRadius: 4, background: 'hsl(var(--muted))', overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: percent >= 90 ? 'hsl(var(--destructive))' : 'hsl(var(--success))' }} />
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [workspace, setWorkspace] = useState(null);
  const [usage, setUsage] = useState(null);
  const [name, setName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPermission, setSavingPermission] = useState(false);
  const [billingAction, setBillingAction] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadWorkspace = async () => {
    setLoading(true);
    setError('');
    try {
      const [settingsResponse, usageResponse] = await Promise.all([
        workspaceService.getSettings(),
        workspaceService.getUsage(),
      ]);
      setWorkspace(settingsResponse.data);
      setUsage(usageResponse.data);
      setName(settingsResponse.data.name);
      setBillingEmail(settingsResponse.data.billing_email || '');
      setRolePermissions(settingsResponse.data.role_permissions || {});
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Unable to load workspace settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkspace(); }, []);

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await workspaceService.updateSettings({
        name,
        billing_email: billingEmail,
      });
      setWorkspace(response.data);
      setMessage('Workspace settings saved.');
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Unable to save workspace settings.');
    } finally {
      setSaving(false);
    }
  };

  const updateRolePermission = async (role, module, allowed) => {
    const previousPermissions = rolePermissions;
    const nextPermissions = {
      ...previousPermissions,
      [role]: { ...previousPermissions[role], [module]: allowed },
    };
    setRolePermissions(nextPermissions);
    setSavingPermission(true);
    setError('');
    setMessage('');

    try {
      const response = await workspaceService.updateSettings({ role_permissions: nextPermissions });
      setWorkspace(response.data);
      setRolePermissions(response.data.role_permissions || nextPermissions);
      setMessage('Role permission saved.');
    } catch (requestError) {
      setRolePermissions(previousPermissions);
      setError(requestError?.response?.data?.role_permissions?.[role]?.[module]
        || requestError?.response?.data?.error
        || 'Unable to save role permission.');
    } finally {
      setSavingPermission(false);
    }
  };

  const startTrial = async () => {
    setBillingAction('trial');
    setError('');
    setMessage('');
    try {
      await workspaceService.startTrial();
      await loadWorkspace();
      setMessage('Trial started.');
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Unable to start a trial.');
    } finally {
      setBillingAction('');
    }
  };

  const openBillingLink = async (action) => {
    setBillingAction(action);
    setError('');
    try {
      const response = action === 'checkout'
        ? await workspaceService.createCheckout()
        : await workspaceService.createPortal();
      window.location.assign(response.data.url);
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Unable to open billing.');
      setBillingAction('');
    }
  };

  if (loading) return <div style={{ padding: 28, color: 'hsl(var(--muted-foreground))' }}>Loading workspace...</div>;

  return (
    <main style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: '0 20px 24px', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Building2 size={22} color="hsl(var(--primary))" />
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: 'hsl(var(--foreground))' }}>Workspace Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{workspace?.slug}</p>
        </div>
      </header>

      {error && <div role="alert" style={{ ...panelStyle, padding: 12, marginBottom: 14, color: 'hsl(var(--destructive))' }}>{error}</div>}

      <form onSubmit={saveSettings} style={{ display: 'grid', gap: 14 }}>
        <section style={{ ...panelStyle, padding: 18 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 14, color: 'hsl(var(--foreground))' }}>Workspace</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
              Workspace name
              <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
              Billing email
              <input type="email" value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} style={inputStyle} />
            </label>
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18, overflowX: 'auto' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 14, color: 'hsl(var(--foreground))' }}>Role permissions</h2>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Changes save immediately. Admin access is fixed; unchecked roles use the workspace defaults unless overridden.</p>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '9px 8px', textAlign: 'left', fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Role</th>
                {Object.keys(workspace?.default_role_permissions?.manager || {}).map((module) => (
                  <th key={module} style={{ padding: '9px 7px', textAlign: 'center', fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'capitalize' }}>{module}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(workspace?.default_role_permissions || {}).map(([role, defaults]) => (
                <tr key={role} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  <th scope="row" style={{ padding: '9px 8px', textAlign: 'left', fontSize: 12, color: 'hsl(var(--foreground))', textTransform: 'capitalize' }}>{role.replaceAll('_', ' ')}</th>
                  {Object.entries(defaults).map(([module, defaultAllowed]) => {
                    const allowed = rolePermissions[role]?.[module] ?? defaultAllowed;
                    return (
                      <td key={module} style={{ padding: '8px 7px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          aria-label={`${role.replaceAll('_', ' ')} ${module}`}
                          checked={allowed}
                          disabled={savingPermission}
                          onChange={(event) => updateRolePermission(role, module, event.target.checked)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 style={{ margin: '0 0 10px', fontSize: 14, color: 'hsl(var(--foreground))' }}>Usage</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <UsageMeter icon={Users} label="Active seats" usage={usage?.seats} />
            <UsageMeter icon={FolderKanban} label="Projects" usage={usage?.projects} />
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CreditCard size={17} color="hsl(var(--primary))" />
            <h2 style={{ margin: 0, fontSize: 14, color: 'hsl(var(--foreground))' }}>Plan and billing</h2>
          </div>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, margin: 0 }}>
            {[
              ['Plan', usage?.plan || workspace?.plan],
              ['Subscription status', (usage?.subscription_status || workspace?.subscription_status || '').replace('_', ' ')],
              ['Current period ends', workspace?.current_period_end ? new Date(workspace.current_period_end).toLocaleDateString() : 'Not set'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{label}</dt>
                <dd style={{ margin: '5px 0 0', fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', textTransform: 'capitalize' }}>{value}</dd>
              </div>
            ))}
          </dl>
          {workspace?.trial_ends_at && (
            <p style={{ margin: '14px 0 0', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
              Trial ends {new Date(workspace.trial_ends_at).toLocaleDateString()}.
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {usage?.plan === 'free' && usage?.subscription_status !== 'canceled' && (
              <button type="button" onClick={startTrial} disabled={Boolean(billingAction)} style={{ padding: '8px 12px', border: '1px solid hsl(var(--border))', borderRadius: 6, background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', cursor: billingAction ? 'wait' : 'pointer' }}>
                {billingAction === 'trial' ? 'Starting trial...' : 'Start 14-day trial'}
              </button>
            )}
            <button type="button" onClick={() => openBillingLink('checkout')} disabled={Boolean(billingAction)} style={{ padding: '8px 12px', border: 0, borderRadius: 6, background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontWeight: 700, cursor: billingAction ? 'wait' : 'pointer' }}>
              {billingAction === 'checkout' ? 'Opening checkout...' : 'Upgrade plan'}
            </button>
            {workspace?.billing_customer_id && (
              <button type="button" onClick={() => openBillingLink('portal')} disabled={Boolean(billingAction)} style={{ padding: '8px 12px', border: '1px solid hsl(var(--border))', borderRadius: 6, background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', cursor: billingAction ? 'wait' : 'pointer' }}>
                {billingAction === 'portal' ? 'Opening billing...' : 'Manage billing'}
              </button>
            )}
          </div>
        </section>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: 0, borderRadius: 6, background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
            <Save size={15} />{saving ? 'Saving...' : 'Save changes'}
          </button>
          {message && <span role="status" style={{ fontSize: 12, color: 'hsl(var(--success))' }}>{message}</span>}
        </div>
      </form>
    </main>
  );
}
