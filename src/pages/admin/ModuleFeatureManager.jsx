// ============================================
// Imports
// ============================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { moduleService } from '../../services/moduleService';
import { projectService } from '../../services/projectService';
import { featureService } from '../../services/featureService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import useMediaQuery from '../../hooks/useMediaQuery';
import { 
  ChevronLeft, Plus, Zap, CheckSquare, FolderOpen,
  Layers, Search, ArrowRight, Clock, AlertCircle, TrendingUp, X, User, Pencil, Trash2,
  CircleDot, ClipboardList, ChevronsUp, ChevronUp, Equal, ChevronDown
} from 'lucide-react';

// ============================================
// Theme-Based Style Definitions
// ============================================
const styles = {
  // Main Container
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: 'hsl(var(--background))',
    overflow: 'hidden',
  },

  // Top Navigation Bar
  topNav: {
    backgroundColor: 'hsl(var(--card))',
    borderBottom: '1px solid hsl(var(--border))',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: 'var(--shadow-sm)',
    flexShrink: 0,
  },

  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--muted-foreground))',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  projectInfo: {
    display: 'flex',
    flexDirection: 'column',
  },

  projectName: {
    fontSize: 15,
    fontWeight: 700,
    color: 'hsl(var(--foreground))',
    margin: 0,
  },

  projectMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },

  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: 'hsl(var(--muted-foreground))',
  },

  // Breadcrumb
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    fontSize: 13,
    color: 'hsl(var(--muted-foreground))',
  },

  breadcrumbLink: {
    color: 'hsl(var(--primary))',
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: 500,
  },

  // Main Content Area
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  // Left Sidebar - Modules List
  moduleSidebar: {
    width: 260,
    backgroundColor: 'hsl(var(--sidebar-background))',
    borderRight: '1px solid hsl(var(--sidebar-border))',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },

  sidebarHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid hsl(var(--border))',
  },

  sidebarHeaderTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sidebarTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'hsl(var(--foreground))',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    margin: 0,
  },

  searchBox: {
    position: 'relative',
    width: '100%',
  },

  searchInput: {
    width: '100%',
    padding: '7px 10px 7px 34px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--input))',
    backgroundColor: 'hsl(var(--background))',
    fontSize: 12,
    color: 'hsl(var(--foreground))',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  },

  moduleList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 10px',
  },

  moduleItem: (isActive) => ({
    padding: '10px 12px',
    marginBottom: 6,
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    backgroundColor: isActive ? 'hsl(var(--sidebar-accent))' : 'hsl(var(--card))',
    border: `1px solid ${isActive ? 'hsl(var(--sidebar-primary))' : 'hsl(var(--border))'}`,
    transition: 'all 0.2s',
    position: 'relative',
    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
  }),

  moduleItemHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  moduleItemTitle: (isActive) => ({
    fontSize: 13,
    fontWeight: 600,
    color: isActive ? 'hsl(var(--sidebar-accent-foreground))' : 'hsl(var(--foreground))',
    margin: 0,
  }),

  moduleItemDescription: {
    fontSize: 11,
    color: 'hsl(var(--muted-foreground))',
    marginTop: 2,
    lineHeight: 1.4,
  },

  moduleStats: {
    display: 'flex',
    gap: 10,
    padding: '6px 0',
    borderTop: '1px solid hsl(var(--border))',
  },

  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: 'hsl(var(--muted-foreground))',
  },

  statDot: (color) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: `hsl(var(--${color}))`,
  }),

  // Right Content Area
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'hsl(var(--background))',
  },

  // Content Header
  contentHeader: {
    padding: '14px 20px',
    backgroundColor: 'hsl(var(--card))',
    borderBottom: '1px solid hsl(var(--border))',
    boxShadow: 'var(--shadow-sm)',
    flexShrink: 0,
  },

  contentHeaderTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  contentTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'hsl(var(--foreground))',
    margin: 0,
  },

  contentSubtitle: {
    fontSize: 12,
    color: 'hsl(var(--muted-foreground))',
    marginTop: 2,
  },

  actionButtons: {
    display: 'flex',
    gap: 8,
  },

  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 'var(--radius)',
    border: 'none',
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: 'var(--shadow-sm)',
  },

  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Quick Stats
  quickStats: {
    display: 'flex',
    gap: 16,
  },

  quickStatCard: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: 'var(--shadow-sm)',
  },

  quickStatIcon: (colorVar) => ({
    width: 32,
    height: 32,
    borderRadius: 'var(--radius)',
    backgroundColor: `hsl(var(--${colorVar}) / 0.1)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: `hsl(var(--${colorVar}))`,
  }),

  quickStatContent: {
    flex: 1,
  },

  quickStatValue: {
    fontSize: 16,
    fontWeight: 700,
    color: 'hsl(var(--foreground))',
  },

  quickStatLabel: {
    fontSize: 11,
    color: 'hsl(var(--muted-foreground))',
    marginTop: 1,
  },

  // Feature Grid
  featuresContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },

  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 14,
  },

  featureCard: {
    padding: '16px',
    borderRadius: 'var(--radius)',
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.3s',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },

  featureCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius)',
    backgroundColor: 'hsl(var(--primary) / 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'hsl(var(--primary))',
    boxShadow: 'var(--shadow-sm)',
  },

  featureContent: {
    marginBottom: 10,
  },

  featureName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'hsl(var(--foreground))',
    marginBottom: 6,
  },

  featureMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  featureIdBadge: {
    padding: '3px 8px',
    borderRadius: 'var(--radius)',
    backgroundColor: 'hsl(var(--accent))',
    color: 'hsl(var(--accent-foreground))',
    fontSize: 11,
    fontWeight: 500,
  },

  statusChip: (status) => ({
    padding: '4px 10px',
    borderRadius: 'var(--radius)',
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: status === 'Done' 
      ? 'hsl(var(--success) / 0.1)' 
      : 'hsl(var(--warning) / 0.1)',
    color: status === 'Done' 
      ? 'hsl(var(--success))' 
      : 'hsl(var(--warning))',
  }),

  featureProgress: {
    marginTop: 12,
  },

  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'hsl(var(--secondary))',
    overflow: 'hidden',
    marginBottom: 8,
  },

  progressFill: (percent) => ({
    height: '100%',
    borderRadius: 3,
    backgroundColor: 'hsl(var(--primary))',
    width: `${percent}%`,
    transition: 'width 0.3s',
  }),

  featureFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTop: '1px solid hsl(var(--border))',
  },

  taskCount: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    color: 'hsl(var(--muted-foreground))',
  },

  addTaskBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    borderRadius: 'var(--radius)',
    border: 'none',
    backgroundColor: 'hsl(var(--accent))',
    color: 'hsl(var(--accent-foreground))',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
  },

  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 'var(--radius)',
    backgroundColor: 'hsl(var(--accent))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'hsl(var(--foreground))',
    marginBottom: 6,
  },

  emptyDescription: {
    fontSize: 13,
    color: 'hsl(var(--muted-foreground))',
    marginBottom: 16,
    maxWidth: 400,
    lineHeight: 1.6,
  },

  // No Selection State
  noSelection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'hsla(var(--foreground) / 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },

  modal: {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: 'var(--radius)',
    width: '100%',
    maxWidth: 480,
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid hsl(var(--border))',
    overflow: 'hidden',
    animation: 'slideDown 0.2s ease-out',
  },

  modalHeader: {
    padding: '24px 28px',
    borderBottom: '1px solid hsl(var(--border))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'hsl(var(--foreground))',
    margin: 0,
  },

  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius)',
    border: 'none',
    backgroundColor: 'hsl(var(--secondary))',
    color: 'hsl(var(--muted-foreground))',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },

  modalBody: {
    padding: '28px',
  },

  formGroup: {
    marginBottom: 20,
  },

  formLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: 'hsl(var(--foreground))',
    marginBottom: 8,
  },

  formInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--input))',
    backgroundColor: 'hsl(var(--background))',
    fontSize: 14,
    color: 'hsl(var(--foreground))',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  },

  errorMessage: {
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    backgroundColor: 'hsl(var(--destructive) / 0.1)',
    border: '1px solid hsl(var(--destructive) / 0.2)',
    color: 'hsl(var(--destructive))',
    fontSize: 13,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  modalFooter: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24,
  },

  btnCancel: {
    padding: '10px 24px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--muted-foreground))',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  btnSubmit: (disabled) => ({
    padding: '10px 24px',
    borderRadius: 'var(--radius)',
    border: 'none',
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    transition: 'all 0.2s',
  }),

  // Add Module Button (small icon button in sidebar)
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius)',
    border: 'none',
    backgroundColor: 'hsl(var(--accent))',
    color: 'hsl(var(--accent-foreground))',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },

  // Active indicator dot
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'hsl(var(--primary))',
    boxShadow: '0 0 0 4px hsl(var(--primary) / 0.2)',
  },
};

// ============================================
// Sub Components
// ============================================

// Quick Stats Cards
const QuickStats = ({ stats }) => (
  <div className="module-quick-stats" style={styles.quickStats}>
    <div style={styles.quickStatCard}>
      <div style={styles.quickStatIcon('primary')}>
        <Layers size={16} />
      </div>
      <div style={styles.quickStatContent}>
        <div style={styles.quickStatValue}>{stats.modules}</div>
        <div style={styles.quickStatLabel}>Total Modules</div>
      </div>
    </div>
    <div style={styles.quickStatCard}>
      <div style={styles.quickStatIcon('info')}>
        <Zap size={16} />
      </div>
      <div style={styles.quickStatContent}>
        <div style={styles.quickStatValue}>{stats.features}</div>
        <div style={styles.quickStatLabel}>Total Features</div>
      </div>
    </div>
    <div style={styles.quickStatCard}>
      <div style={styles.quickStatIcon('success')}>
        <CheckSquare size={16} />
      </div>
      <div style={styles.quickStatContent}>
        <div style={styles.quickStatValue}>{stats.tasks}</div>
        <div style={styles.quickStatLabel}>Direct Tasks</div>
      </div>
    </div>
    <div style={styles.quickStatCard}>
      <div style={styles.quickStatIcon('warning')}>
        <TrendingUp size={16} />
      </div>
      <div style={styles.quickStatContent}>
        <div style={styles.quickStatValue}>{stats.completion}%</div>
        <div style={styles.quickStatLabel}>Completed</div>
      </div>
    </div>
  </div>
);

// Module List Item
const ModuleListItem = ({ module, isActive, onClick, onDelete, canManage }) => {
  const completionPercent = module.progress || 0;

  return (
    <div
      className="module-list-item"
      style={styles.moduleItem(isActive)}
      onClick={() => onClick(module)}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'hsl(var(--sidebar-accent) / 0.5)';
          e.currentTarget.style.borderColor = 'hsl(var(--sidebar-primary) / 0.5)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'hsl(var(--card))';
          e.currentTarget.style.borderColor = 'hsl(var(--border))';
        }
      }}
    >
      <div style={styles.moduleItemHeader}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={styles.featureIdBadge}>{module.module_key || module.slug}</span>
            <span style={moduleStatusChip(module.status)}>{module.status_display || module.status || 'Planned'}</span>
            <h4 style={styles.moduleItemTitle(isActive)}>{module.title}</h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
            <User size={12} />
            <span>{module.owner ? getUserName(module.owner) : 'No owner'}</span>
          </div>

        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {canManage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(module);
              }}
              title="Delete module"
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--destructive))',
                cursor: 'pointer',
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 4,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Trash2 size={14} />
            </button>
          )}
          {isActive && <div style={styles.activeDot} />}
        </div>
      </div>
      
      <div style={styles.moduleStats}>
        <div style={styles.statItem}>
          <div style={styles.statDot('primary')} />
          <Zap size={14} />
          <span>{module.feature_count} features</span>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statDot('info')} />
          <CheckSquare size={14} />
          <span>{module.task_count} tasks</span>
        </div>
      </div>

      {(module.total_task_count || module.task_count || module.feature_count) > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={styles.progressBar}>
            <div style={styles.progressFill(completionPercent)} />
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', textAlign: 'right' }}>
            {completionPercent}% complete
          </div>
        </div>
      )}
    </div>
  );
};

const getInitialForm = (type, defaults = {}) => ({
  title: '',
  description: '',
  status: 'To Do',
  priority: 'medium',
  requirement_type: '',
  owner: '',
  health_summary: '',
  ...defaults,
});

const pointsToDescription = () => '';

const normalizePayload = (data, type) => {
  if (type === 'module') {
    return {
      title: data.title,
      owner: data.owner || null,
      status: data.status || 'planned',
      health_summary: data.health_summary || '',
    };
  }
  return ['title', 'description', 'requirement_type', 'status', 'priority', 'assignee']
    .reduce((payload, key) => {
      payload[key] = key === 'assignee' ? (data[key] || null) : (data[key] ?? '');
      return payload;
    }, {});
};

const PRIORITY_OPTIONS = [
  ['highest', 'Highest'],
  ['high', 'High'],
  ['medium', 'Medium'],
  ['low', 'Low'],
  ['lowest', 'Lowest'],
];

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Testing', 'Blocked', 'Done'];
const REQUIREMENT_OPTIONS = [
  ['New Screen', 'New Screen'],
  ['New Card Add', 'New Card Add'],
  ['Change Existing', 'Change Existing'],
  ['Bug Fix', 'Bug Fix'],
  ['API Integration', 'API Integration'],
  ['UI Change', 'UI Change'],
  ['Filter Add', 'Filter Add'],
  ['Report Export', 'Report Export'],
  ['Permission Change', 'Permission Change'],
];

const MODULE_STATUS_OPTIONS = [
  ['planned', 'Planned'],
  ['active', 'Active'],
  ['blocked', 'Blocked'],
  ['done', 'Done'],
];

const moduleStatusTone = {
  planned: 'hsl(var(--muted-foreground))',
  active: 'hsl(var(--info))',
  blocked: 'hsl(var(--warning))',
  done: 'hsl(var(--success))',
};

const moduleStatusChip = (status) => {
  const tone = moduleStatusTone[status] || 'hsl(var(--muted-foreground))';
  return {
    padding: '3px 7px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: `${tone}1f`,
    color: tone,
    border: `1px solid ${tone}40`,
    whiteSpace: 'nowrap',
  };
};

const getUserName = (person) => {
  if (!person) return 'Unassigned';
  const fullName = `${person.first_name || ''} ${person.last_name || ''}`.trim();
  return fullName || person.username || person.email || 'Unassigned';
};

const getFeatureAssigneeLabel = (feature) => {
  if (feature.assignee) return getUserName(feature.assignee);
  const taskAssignees = (feature.tasks || [])
    .map((task) => task.assignee)
    .filter(Boolean);
  const names = [...new Set(taskAssignees.map(getUserName))];
  if (names.length === 0) return 'Unassigned';
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
};

const priorityIconMap = {
  highest: { Icon: ChevronsUp, color: 'hsl(var(--priority-highest))' },
  high:    { Icon: ChevronUp,  color: 'hsl(var(--priority-high))' },
  medium:  { Icon: Equal,      color: 'hsl(var(--priority-medium))' },
  low:     { Icon: ChevronDown,color: 'hsl(var(--priority-low))' },
  lowest:  { Icon: ChevronDown,color: 'hsl(var(--muted-foreground))' },
};

const getPriorityLabel = (priority) => (
  PRIORITY_OPTIONS.find(([value]) => value === priority)?.[1] || 'Medium'
);

const priorityTone = (priority) => ({
  highest: ['hsl(var(--destructive) / 0.12)', 'hsl(var(--destructive))'],
  high: ['hsl(var(--warning) / 0.14)', 'hsl(var(--warning))'],
  medium: ['hsl(var(--primary) / 0.10)', 'hsl(var(--primary))'],
  low: ['hsl(var(--success) / 0.12)', 'hsl(var(--success))'],
  lowest: ['hsl(var(--muted))', 'hsl(var(--muted-foreground))'],
}[priority] || ['hsl(var(--muted))', 'hsl(var(--muted-foreground))']);

// Feature Card Component
const FeatureCardComponent = ({
  feature,
  onAddTask,
  onEditFeature,
  onDeleteFeature,
  canManage,
  isAddingAction,
  actionForm,
  actionSaving,
  actionError,
  projectMembers = [],
  onActionFormChange,
  onSubmitAction,
  onCancelAction,
  onOpenFeature,
}) => {
  const [priorityBg, priorityColor] = priorityTone(feature.priority);
  const tasks = feature.tasks || [];
  const doneTasks = tasks.filter((task) => task.status === 'Done').length;
  const progress = feature.progress || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          ...styles.featureCard,
          padding: 0,
          borderLeft: `4px solid ${priorityColor}`,
          cursor: 'pointer',
        }}
        onClick={() => onOpenFeature(feature)}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'hsl(var(--border))';
          e.currentTarget.style.borderLeft = `4px solid ${priorityColor}`;
        }}
      >
        <div className="module-feature-card-head" style={{ padding: '14px 16px 10px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={styles.featureIdBadge}>{feature.feature_id}</span>
              <span style={{ ...styles.statusChip(feature.status), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <CircleDot size={12} />
                {feature.status}
              </span>
              <span style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: priorityBg, color: priorityColor, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {(() => { const pm = priorityIconMap[feature.priority] || priorityIconMap.medium; return <pm.Icon size={12} strokeWidth={2.5} />; })()}
                {getPriorityLabel(feature.priority)}
              </span>
              {feature.requirement_type && (
                <span title={feature.requirement_type} style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: 'hsl(var(--warning) / 0.12)', color: 'hsl(var(--warning))', fontSize: 11, fontWeight: 700, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {feature.requirement_type}
                </span>
              )}
            </div>

            <h3 style={{ ...styles.featureName, fontSize: 14, marginBottom: 8 }}>{feature.title}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                <User size={13} />
                <span>{getFeatureAssigneeLabel(feature)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                <Clock size={13} />
                <span>{new Date(feature.updated_at).toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            {feature.description && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                {feature.description}
              </p>
            )}
          </div>

          <div className="module-feature-actions" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {canManage && (
              <>
                <button
                  style={{ ...styles.addTaskBtn, padding: '6px 8px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFeature(feature);
                  }}
                  title="Edit feature"
                >
                  <Pencil size={14} />
                </button>
                <button
                  style={{ ...styles.addTaskBtn, padding: '6px 8px', color: 'hsl(var(--destructive))' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFeature(feature);
                  }}
                  title="Delete feature"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {isAddingAction && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSubmitAction(feature);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ margin: '0 16px 12px', padding: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.35)', display: 'grid', gap: 10 }}
          >
            {actionError && <div style={styles.errorMessage}><AlertCircle size={16} />{actionError}</div>}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Task Title</label>
              <input
                style={styles.formInput}
                value={actionForm.title}
                onChange={(e) => onActionFormChange('title', e.target.value)}
                placeholder={feature.title}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Task Description</label>
              <textarea
                style={{ ...styles.formInput, minHeight: 76, resize: 'vertical' }}
                value={actionForm.description}
                onChange={(e) => onActionFormChange('description', e.target.value)}
                placeholder="Action details"
              />
            </div>
            <div className="module-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Assign To</label>
                <select style={styles.formInput} value={actionForm.assignee} onChange={(e) => onActionFormChange('assignee', e.target.value)}>
                  <option value="">Unassigned</option>
                  {projectMembers.map((member) => (
                    <option key={member.id} value={member.id}>{getUserName(member)}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Priority</label>
                <select style={styles.formInput} value={actionForm.priority} onChange={(e) => onActionFormChange('priority', e.target.value)}>
                  {PRIORITY_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Due Date</label>
                <input
                  type="date"
                  style={styles.formInput}
                  value={actionForm.due_date}
                  onChange={(e) => onActionFormChange('due_date', e.target.value)}
                />
              </div>
            </div>
            <div className="module-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Estimate Hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  style={styles.formInput}
                  value={actionForm.estimate_hours}
                  onChange={(e) => onActionFormChange('estimate_hours', e.target.value)}
                  placeholder="e.g. 4"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Labels</label>
                <input
                  style={styles.formInput}
                  value={actionForm.labels}
                  onChange={(e) => onActionFormChange('labels', e.target.value)}
                  placeholder="frontend, report"
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Blocker Reason</label>
              <textarea
                style={{ ...styles.formInput, minHeight: 64, resize: 'vertical' }}
                value={actionForm.blocker_reason}
                onChange={(e) => onActionFormChange('blocker_reason', e.target.value)}
                placeholder="Only fill when this task is blocked"
              />
            </div>
            <div className="module-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" style={styles.btnCancel} onClick={onCancelAction}>Cancel</button>
              <button type="submit" style={styles.btnSubmit(actionSaving)} disabled={actionSaving}>
              {actionSaving ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        )}

        <div className="module-feature-card-foot" style={{ padding: '10px 16px', borderTop: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.25)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ ...styles.progressBar, marginBottom: 5 }}>
              <div style={styles.progressFill(progress)} />
            </div>
            <div className="module-feature-progress-meta" style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <ClipboardList size={14} />
                {feature.task_count || 0} actions
              </span>
              <span>{doneTasks}/{tasks.length || feature.task_count || 0} done</span>
              <span>{progress}% complete</span>
            </div>
          </div>
          {canManage && (
            <button
              style={styles.addTaskBtn}
              onClick={(e) => {
                e.stopPropagation();
                onAddTask(feature);
              }}
            >
              <Plus size={16} />
              Add Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal Component
const CreateModal = ({ type, formData, saving, error, editingItem, projectMembers = [], onClose, onSubmit, onFormChange }) => (
  <div className="module-modal-overlay" style={styles.modalOverlay} onClick={(e) => {
    if (e.target === e.currentTarget) onClose();
  }}>
    <div className="module-modal" style={{ ...styles.modal, maxWidth: 720 }}>
      <div style={styles.modalHeader}>
        <h2 style={styles.modalTitle}>
          {editingItem
            ? `Edit ${type === 'module' ? 'Module' : 'Feature'}`
            : `Create ${type === 'module' ? 'Module' : 'Feature'}`}
        </h2>
        <button 
          style={styles.modalCloseBtn} 
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--secondary))';
          }}
        >
          ✕
        </button>
      </div>
      
      <div className="module-modal-body" style={styles.modalBody}>
        {error && (
          <div style={styles.errorMessage}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        
        <form onSubmit={onSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              {type === 'module' ? 'Module Title' : 'Feature Title'}
            </label>
            <input
              style={styles.formInput}
              value={formData.title}
              onChange={(e) => onFormChange('title', e.target.value)}
              placeholder={
                type === 'module'
                  ? 'e.g. Admin Login, Client Portal'
                  : 'Total Active Projects'
              }
              autoFocus
              required
            />
          </div>

          {type === 'module' && (
            <>
              <div className="module-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Owner</label>
                  <select
                    style={styles.formInput}
                    value={formData.owner}
                    onChange={(e) => onFormChange('owner', e.target.value)}
                  >
                    <option value="">No owner</option>
                    {projectMembers.map((member) => (
                      <option key={member.id} value={member.id}>{getUserName(member)}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Status</label>
                  <select
                    style={styles.formInput}
                    value={formData.status || 'planned'}
                    onChange={(e) => onFormChange('status', e.target.value)}
                  >
                    {MODULE_STATUS_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Health Summary</label>
                <textarea
                  style={{ ...styles.formInput, minHeight: 90, resize: 'vertical' }}
                  value={formData.health_summary}
                  onChange={(e) => onFormChange('health_summary', e.target.value)}
                  placeholder="Current module health, risks, or notes"
                />
              </div>
            </>
          )}

          {type === 'feature' && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Required</label>
                <select
                  style={styles.formInput}
                  value={formData.requirement_type}
                  onChange={(e) => onFormChange('requirement_type', e.target.value)}
                >
                  <option value="">Select requirement type</option>
                  {REQUIREMENT_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="module-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Status</label>
                  <select
                    style={styles.formInput}
                    value={formData.status}
                    onChange={(e) => onFormChange('status', e.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Priority</label>
                  <select
                    style={styles.formInput}
                    value={formData.priority}
                    onChange={(e) => onFormChange('priority', e.target.value)}
                  >
                    {PRIORITY_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Assign To</label>
                  <select
                    style={styles.formInput}
                    value={formData.assignee}
                    onChange={(e) => onFormChange('assignee', e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((member) => (
                      <option key={member.id} value={member.id}>{getUserName(member)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description / Sub Points</label>
                <textarea
                  style={{ ...styles.formInput, minHeight: 110, resize: 'vertical' }}
                  value={formData.description}
                  onChange={(e) => onFormChange('description', e.target.value)}
                  placeholder="Add sub points or notes here"
                />
              </div>
            </>
          )}

          <div className="module-form-actions" style={styles.modalFooter}>
            <button
              type="button"
              style={styles.btnCancel}
              onClick={onClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(var(--secondary))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.btnSubmit(saving)}
              disabled={saving}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--primary-hover))';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--primary))';
                }
              }}
            >
              {saving ? 'Saving...' : `${editingItem ? 'Save' : 'Create'} ${type === 'module' ? 'Module' : 'Feature'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

// ============================================
// Main Component
// ============================================
export default function ModuleFeatureManager() {
  const { projectSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  // State
  const [project, setProject] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'module' | 'feature' | null
  const [form, setForm] = useState(getInitialForm('module'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addTaskFeature, setAddTaskFeature] = useState(null);
  const [actionForm, setActionForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', due_date: '', estimate_hours: '', labels: '', blocker_reason: '' });
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, item }
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  // Load initial data
  useEffect(() => {
    Promise.all([
      projectService.getBySlug(projectSlug),
      moduleService.getByProjectSlug(projectSlug),
    ]).then(([pRes, mRes]) => {
      setProject(pRes.data);
      setModules(mRes.data);
      if (mRes.data.length > 0) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const requestedFromQuery = new URLSearchParams(window.location.search).get('module');
        const requestedModuleSlug = pathParts[pathParts.length - 1] !== 'modules'
          ? pathParts[pathParts.length - 1]
          : '';
        const initialModule = mRes.data.find((mod) => mod.module_id === (requestedFromQuery || requestedModuleSlug)) || mRes.data[0];
        setSelectedModule(initialModule);
        loadFeatures(initialModule);
        window.history.replaceState(null, '', `/projects/${projectSlug}/modules/${initialModule.module_id}`);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [projectSlug]);

  const loadFeatures = async (mod) => {
    try {
      const res = await moduleService.getFeaturesBySlug(projectSlug, mod.module_id);
      setFeatures(res.data);
    } catch {
      setFeatures([]);
    }
  };

  // Handlers
  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    loadFeatures(module);
    window.history.replaceState(null, '', `/projects/${projectSlug}/modules/${module.module_id}`);
  };

  const openFeatureBoard = (feature) => {
    if (!selectedModule) return;
    navigate(`/projects/${projectSlug}/tasks?module=${selectedModule.module_id}&feature=${feature.feature_id}`);
  };

  const openModal = (type, defaults = {}) => {
    setModal(type);
    setForm(getInitialForm(type, defaults));
    setEditingFeature(null);
    setEditingModule(null);
    setError('');
  };

  const openModuleEdit = (module) => {
    setEditingModule(module);
    setEditingFeature(null);
    setModal('module');
    setForm(getInitialForm('module', {
      title: module.title || '',
      owner: module.owner?.id || '',
      status: module.status || 'planned',
      health_summary: module.health_summary || '',
    }));
    setError('');
  };

  const openFeatureEdit = (feature) => {
    setEditingFeature(feature);
    setEditingModule(null);
    setModal('feature');
    setForm(getInitialForm('feature', {
      title: feature.title || '',
      description: feature.description || '',
      requirement_type: feature.requirement_type || '',
      status: feature.status || 'To Do',
      priority: feature.priority || 'medium',
      assignee: feature.assignee?.id || '',
    }));
    setError('');
  };

  const closeModal = () => {
    setModal(null);
    setForm(getInitialForm('module'));
    setEditingFeature(null);
    setEditingModule(null);
    setError('');
  };

  const openInlineAction = (feature) => {
    setAddTaskFeature(feature);
    setActionForm({
      title: feature.title || '',
      description: [
        feature.requirement_type ? `Required: ${feature.requirement_type}` : '',
        feature.description || '',
      ].filter(Boolean).join('\n'),
      priority: 'medium',
      assignee: feature.assignee?.id || '',
      due_date: '',
      estimate_hours: '',
      labels: '',
      blocker_reason: '',
    });
    setTaskError('');
  };

  const handleFeatureTaskSubmit = async (feature) => {
    setTaskSaving(true);
    setTaskError('');
    try {
      const payload = {
        title: actionForm.title.trim() || feature.title,
        description: actionForm.description.trim(),
        priority: actionForm.priority,
        assignee: actionForm.assignee || null,
        due_date: actionForm.due_date || null,
        estimate_hours: actionForm.estimate_hours || null,
        labels: (actionForm.labels || '').split(',').map(label => label.trim()).filter(Boolean),
        blocker_reason: actionForm.blocker_reason.trim(),
      };
      await featureService.createTaskForFeature(
        projectSlug,
        selectedModule.module_id,
        feature.id,
        payload
      );
      if (!feature.assignee && actionForm.assignee) {
        await featureService.update(projectSlug, feature.feature_id, {
          assignee: actionForm.assignee,
        });
      }
      await loadFeatures(selectedModule);
      setAddTaskFeature(null);
      setActionForm({ title: '', description: '', priority: 'medium', assignee: '', due_date: '', estimate_hours: '', labels: '', blocker_reason: '' });
    } catch (err) {
      setTaskError(err?.response?.data?.detail || 'Something went wrong');
    } finally {
      setTaskSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    setSaving(true);
    setError('');
    
    try {
      const payload = normalizePayload(form, modal);
      if (modal === 'module') {
        if (editingModule) {
          await moduleService.updateBySlug(projectSlug, editingModule.module_id, payload);
        } else {
          await moduleService.createBySlug(projectSlug, payload);
        }
        const res = await moduleService.getByProjectSlug(projectSlug);
        setModules(res.data);
        if (editingModule) {
          const updated = res.data.find((mod) => mod.id === editingModule.id);
          if (updated) setSelectedModule(updated);
        }
      } else if (modal === 'feature' && selectedModule) {
        if (editingFeature) {
          await featureService.update(projectSlug, editingFeature.feature_id, payload);
        } else {
          await moduleService.createFeatureBySlug(projectSlug, selectedModule.module_id, payload);
        }
        await loadFeatures(selectedModule);
      }
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'module') {
        await moduleService.deleteBySlug(projectSlug, deleteConfirm.item.module_id);
        const res = await moduleService.getByProjectSlug(projectSlug);
        setModules(res.data);
        if (res.data.length > 0) {
          setSelectedModule(res.data[0]);
          await loadFeatures(res.data[0]);
        } else {
          setSelectedModule(null);
          setFeatures([]);
        }
      } else if (deleteConfirm.type === 'feature') {
        await featureService.delete(projectSlug, deleteConfirm.item.feature_id);
        await loadFeatures(selectedModule);
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered modules based on search
  const filteredModules = modules.filter(mod => 
    mod.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalFeatures = modules.reduce((sum, mod) => sum + mod.feature_count, 0);
  const totalTrackedTasks = modules.reduce((sum, mod) => sum + (mod.total_task_count || mod.task_count || 0), 0);
  const totalDoneTasks = modules.reduce((sum, mod) => sum + (mod.completed_task_count || 0), 0);
  const completionRate = totalTrackedTasks > 0 ? Math.round((totalDoneTasks / totalTrackedTasks) * 100) : 0;
  if (loading) return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: 'hsl(var(--background))',
      gap: 12,
      color: 'hsl(var(--muted-foreground))',
      fontSize: 16,
      fontWeight: 500,
    }}>
      Loading...
    </div>
  );

  return (
    <div className="module-manager-page" style={styles.container}>
      {/* Top Navigation */}
      <nav className="module-manager-topnav" style={styles.topNav}>
        <div className="module-manager-navleft" style={styles.navLeft}>
          <button
            style={styles.backButton}
            onClick={() => navigate('/projects')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--secondary))';
              e.currentTarget.style.color = 'hsl(var(--foreground))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
              e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
            }}
          >
            <ChevronLeft size={14} />
            Back to Projects
          </button>
          
          <div style={styles.projectInfo}>
            <div style={styles.breadcrumb}>
              <span 
                style={styles.breadcrumbLink}
                onClick={() => navigate('/projects')}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Projects
              </span>
              <ArrowRight size={12} />
              <span style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{project?.name}</span>
            </div>
            <div className="module-project-meta" style={styles.projectMeta}>
              <span style={styles.metaItem}>
                <Layers size={14} />
                {modules.length} modules
              </span>
              <span style={styles.metaItem}>
                <Zap size={14} />
                {totalFeatures} features
              </span>
              <span style={styles.metaItem}>
                <CheckSquare size={14} />
                {totalTrackedTasks} tasks
              </span>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="module-top-actions" style={{ display: 'flex', gap: 8 }}>
            <button
              style={styles.btnSecondary}
              onClick={() => {
                if (selectedModule) {
                  navigate(`/projects/${projectSlug}/tasks?module=${selectedModule.module_id}&create=1`);
                }
              }}
              disabled={!selectedModule}
              title="Add task directly to this module"
            >
              <Plus size={18} />
              Add Module Task
            </button>
            <button
              style={styles.btnPrimary}
              onClick={() => openModal('module')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(var(--primary-hover))';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(var(--primary))';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <Plus size={18} />
              Create Module
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="module-manager-main" style={{ ...styles.mainContent, flexDirection: isTablet ? 'column' : 'row' }}>
        {/* Modules Sidebar */}
        <aside className="module-sidebar-panel" style={{ ...styles.moduleSidebar, width: isTablet ? '100%' : 260, maxHeight: isTablet ? (isMobile ? '34dvh' : '30dvh') : 'none', borderRight: isTablet ? 'none' : styles.moduleSidebar.borderRight, borderBottom: isTablet ? '1px solid hsl(var(--sidebar-border))' : 'none' }}>
          <div style={styles.sidebarHeader}>
            <div style={styles.sidebarHeaderTop}>
              <h3 style={styles.sidebarTitle}>
                <Layers size={16} style={{ color: 'hsl(var(--primary))' }} />
                Modules
              </h3>
              {canManage && (
                <button
                  style={styles.iconButton}
                  onClick={() => openModal('module')}
                  title="Add Module"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--primary))';
                    e.currentTarget.style.color = 'hsl(var(--primary-foreground))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                    e.currentTarget.style.color = 'hsl(var(--accent-foreground))';
                  }}
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
            
            <div style={styles.searchBox}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--muted-foreground))',
                  pointerEvents: 'none',
                }}
              />
              <input
                style={styles.searchInput}
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--ring))';
                  e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--ring) / 0.1)';
                  e.currentTarget.style.backgroundColor = 'hsl(var(--card))';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--input))';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
                }}
              />
            </div>
          </div>

          <div className="module-list-scroll" style={{ ...styles.moduleList, display: isTablet ? 'flex' : 'block', overflowX: isTablet ? 'auto' : 'hidden', overflowY: isTablet ? 'hidden' : 'auto' }}>
            {filteredModules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <FolderOpen size={48} style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 16 }} />
                <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginBottom: 16 }}>
                  {modules.length === 0 ? 'No modules created yet' : 'No modules match your search'}
                </p>
                {modules.length === 0 && canManage && (
                  <button
                    style={styles.btnPrimary}
                    onClick={() => openModal('module')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--primary-hover))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'hsl(var(--primary))';
                    }}
                  >
                    <Plus size={16} />
                    Create First Module
                  </button>
                )}
              </div>
            ) : (
              filteredModules.map((mod) => (
                <ModuleListItem
                  key={mod.id}
                  module={mod}
                  isActive={selectedModule?.id === mod.id}
                  onClick={handleModuleSelect}
                  onDelete={(module) => setDeleteConfirm({ type: 'module', item: module })}
                  canManage={canManage}
                />
              ))
            )}
          </div>
        </aside>

        {/* Feature Content Area */}
        <main className="module-content-area" style={styles.contentArea}>
          {selectedModule ? (
            <>
              <div className="module-content-header" style={styles.contentHeader}>
                <div className="module-content-header-top" style={styles.contentHeaderTop}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
                      <span style={styles.featureIdBadge}>{selectedModule.module_key || selectedModule.slug}</span>
                      <span style={moduleStatusChip(selectedModule.status)}>{selectedModule.status_display || selectedModule.status || 'Planned'}</span>
                      <h1 style={styles.contentTitle}>{selectedModule.title}</h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                      <span style={styles.contentSubtitle}>
                        Owner: {selectedModule.owner ? getUserName(selectedModule.owner) : 'No owner'}
                      </span>
                      <span style={styles.contentSubtitle}>
                        Progress: {selectedModule.progress || 0}%
                      </span>
                    </div>
                    {selectedModule.health_summary && (
                      <p style={{ ...styles.contentSubtitle, marginTop: 6, maxWidth: 720 }}>
                        {selectedModule.health_summary}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <div className="module-top-actions" style={styles.actionButtons}>
                      <button
                        style={styles.btnSecondary}
                        onClick={() => openModuleEdit(selectedModule)}
                        title="Edit module"
                      >
                        <Pencil size={18} />
                        Edit Module
                      </button>
                      <button
                        style={styles.btnPrimary}
                        onClick={() => openModal('feature')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'hsl(var(--primary-hover))';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'hsl(var(--primary))';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                      >
                        <Plus size={18} />
                        Add Feature
                      </button>
                    </div>
                  )}
                </div>

                {!isMobile && (
                  <QuickStats stats={{
                    modules: modules.length,
                    features: selectedModule.feature_count,
                    tasks: selectedModule.total_task_count || selectedModule.task_count,
                    completion: selectedModule.progress || 0,
                  }} />
                )}
              </div>

              <div className="module-features-container" style={styles.featuresContainer}>
                {features.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIconBox}>
                      <Zap size={40} style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                    <h2 style={styles.emptyTitle}>No Features Yet</h2>
                    <p style={styles.emptyDescription}>
                      Start by adding features to organize your tasks better.
                      Features help you group related tasks together for better project management.
                    </p>
                    {canManage && (
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          style={styles.btnPrimary}
                          onClick={() => openModal('feature')}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'hsl(var(--primary-hover))';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'hsl(var(--primary))';
                          }}
                        >
                          <Plus size={18} />
                          Add Your First Feature
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="module-mobile-section-title">
                      <span>Features</span>
                      <strong>{features.length}</strong>
                    </div>
                    <div className="module-features-grid" style={{ ...styles.featuresGrid, gridTemplateColumns: '1fr' }}>
                      {features.map((feature) => (
                        <FeatureCardComponent
                          key={feature.id}
                          feature={feature}
                          onAddTask={openInlineAction}
                          onEditFeature={openFeatureEdit}
                          onDeleteFeature={(feature) => setDeleteConfirm({ type: 'feature', item: feature })}
                          canManage={canManage}
                          isAddingAction={addTaskFeature?.id === feature.id}
                          actionForm={actionForm}
                          actionSaving={taskSaving}
                          actionError={addTaskFeature?.id === feature.id ? taskError : ''}
                          projectMembers={feature.project_members || project?.members || []}
                          onActionFormChange={(field, value) => setActionForm(prev => ({ ...prev, [field]: value }))}
                          onSubmitAction={handleFeatureTaskSubmit}
                          onCancelAction={() => {
                            setAddTaskFeature(null);
                            setTaskError('');
                          }}
                          onOpenFeature={openFeatureBoard}
                        />
                      ))}
                    </div>
                    {isMobile && (
                      <div className="module-mobile-stats">
                        <QuickStats stats={{
                          modules: modules.length,
                          features: selectedModule.feature_count,
                          tasks: selectedModule.total_task_count || selectedModule.task_count,
                          completion: selectedModule.progress || 0,
                        }} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={styles.noSelection}>
              <div style={styles.emptyIconBox}>
                <Layers size={48} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <h2 style={styles.emptyTitle}>Select a Module</h2>
              <p style={styles.emptyDescription}>
                Choose a module from the left sidebar to view and manage its features and tasks.
                Each module represents a different part of your project.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Create Module/Feature Modal */}
      {modal && (
        <CreateModal
          type={modal}
          formData={form}
          saving={saving}
          error={error}
          editingItem={editingFeature || editingModule}
          projectMembers={project?.members || []}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFormChange={(field, value) => setForm(prev => ({ ...prev, [field]: value }))}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirm !== null}
        title={deleteConfirm?.type === 'module' ? 'Delete Module' : 'Delete Feature'}
        message={deleteConfirm?.type === 'module' 
          ? 'This will delete the module and all its features. This action cannot be undone.'
          : 'This will delete the feature and all its tasks. This action cannot be undone.'}
        itemName={deleteConfirm?.item?.title}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        isDeleting={isDeleting}
      />

    </div>
  );
}
