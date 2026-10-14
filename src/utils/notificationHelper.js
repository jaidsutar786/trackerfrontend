// Notification Helper - Role-based notification triggers

export const NotificationTypes = {
  // Admin Notifications
  NEW_CLIENT: { icon: '🏢', title: 'New Client Added' },
  NEW_PROJECT: { icon: '📁', title: 'New Project Created' },
  NEW_USER: { icon: '👤', title: 'New User Added' },
  NEW_ISSUE: { icon: '🐛', title: 'New Issue Reported' },
  
  // Manager Notifications
  ISSUE_ASSIGNED: { icon: '👤', title: 'Issue Assigned' },
  ISSUE_STATUS_CHANGED: { icon: '🔄', title: 'Issue Status Updated' },
  PROJECT_UPDATED: { icon: '📝', title: 'Project Updated' },
  TEAM_MEMBER_ADDED: { icon: '👥', title: 'Team Member Added' },
  
  // Employee/Developer Notifications
  ASSIGNED_TO_YOU: { icon: '✅', title: 'Assigned to You' },
  ISSUE_COMMENT: { icon: '💬', title: 'New Comment' },
  STATUS_CHANGED: { icon: '🔄', title: 'Status Changed' },
  DEADLINE_REMINDER: { icon: '⏰', title: 'Deadline Reminder' },
  
  // Client Notifications
  ISSUE_RESOLVED: { icon: '✅', title: 'Issue Resolved' },
  ISSUE_IN_PROGRESS: { icon: '⚙️', title: 'Issue In Progress' },
  PROJECT_MILESTONE: { icon: '🎯', title: 'Project Milestone' },
  TEAM_UPDATE: { icon: '📢', title: 'Team Update' },
};

// Helper function to create notifications based on role
export const createNotification = (type, message, additionalData = {}) => {
  const notifType = NotificationTypes[type] || { icon: '📢', title: 'Notification' };
  
  return {
    ...notifType,
    message,
    ...additionalData,
  };
};

// Role-based notification filters
export const shouldNotify = (userRole, notificationType) => {
  const roleNotifications = {
    admin: [
      'NEW_CLIENT', 'NEW_PROJECT', 'NEW_USER', 'NEW_ISSUE',
      'ISSUE_ASSIGNED', 'ISSUE_STATUS_CHANGED', 'PROJECT_UPDATED',
    ],
    manager: [
      'NEW_ISSUE', 'ISSUE_ASSIGNED', 'ISSUE_STATUS_CHANGED',
      'PROJECT_UPDATED', 'TEAM_MEMBER_ADDED', 'ISSUE_COMMENT',
    ],
    employee: [
      'ASSIGNED_TO_YOU', 'ISSUE_COMMENT', 'STATUS_CHANGED',
      'DEADLINE_REMINDER', 'PROJECT_UPDATED',
    ],
    client: [
      'ISSUE_RESOLVED', 'ISSUE_IN_PROGRESS', 'PROJECT_MILESTONE',
      'TEAM_UPDATE', 'ISSUE_COMMENT',
    ],
  };

  const developerRoles = [
    'frontend_developer', 'backend_developer', 'fullstack_developer',
    'devops', 'qa_tester', 'ui_ux_designer',
  ];
  
  if (developerRoles.includes(userRole)) {
    return roleNotifications.employee.includes(notificationType);
  }

  return roleNotifications[userRole]?.includes(notificationType) || false;
};
