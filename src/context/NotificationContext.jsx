import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import websocketService from '../services/websocketService';

const NotificationContext = createContext(null);

const getNotificationKey = (notification) => {
  if (!notification) return '';
  const rawTimestamp = notification.created_at || notification.timestamp || '';
  const parsedTimestamp = rawTimestamp ? new Date(rawTimestamp).getTime() : 0;
  const minuteBucket = Number.isFinite(parsedTimestamp) && parsedTimestamp > 0
    ? Math.floor(parsedTimestamp / 60000)
    : '';

  return [
    notification.notification_type || '',
    notification.title || '',
    notification.message || '',
    notification.issue_id || '',
    notification.project_id || '',
    notification.feature_id || '',
    notification.task_id || '',
    notification.subtask_id || '',
    minuteBucket,
  ].join('|').toLowerCase();
};

const dedupeNotifications = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = getNotificationKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const prependNotification = (prev, notification) => {
  const nextKey = getNotificationKey(notification);
  const alreadyExists = prev.some((item) => getNotificationKey(item) === nextKey);
  return alreadyExists ? prev : [notification, ...prev];
};

const normalizeNotification = (notification) => ({
  ...notification,
  type: notification.type || 'direct',
  timestamp: notification.timestamp || notification.created_at,
  actor_name: notification.actor_name || null,
  actor_role: notification.actor_role || null,
  issue_id: notification.issue_id || notification.issue?.id || null,
  project_id: notification.project_id || notification.project?.id || notification.issue?.project_id || notification.task?.project_id || notification.feature?.project_id || notification.subtask?.project_id || null,
  feature_id: notification.feature_id || notification.feature?.feature_id || notification.task?.feature_id || null,
  task_id: notification.task_id || notification.task?.task_id || notification.subtask?.task_id || null,
  subtask_id: notification.subtask_id || notification.subtask?.id || null,
});

const getIssueProjectId = (issue) => {
  if (!issue?.project) return issue?.project_id || null;
  return typeof issue.project === 'object' ? issue.project.id : issue.project;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const dataUpdateListeners = useRef([]);

  const onDataUpdate = useCallback((callback) => {
    dataUpdateListeners.current.push(callback);
    return () => {
      dataUpdateListeners.current = dataUpdateListeners.current.filter(cb => cb !== callback);
    };
  }, []);

  // Fetch initial notifications from backend
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Fetching notifications for user:', user.username);
      const res = await notificationService.getAll();
      console.log('✅ Notifications fetched:', res.data);
      setNotifications(dedupeNotifications(res.data.map(normalizeNotification)));
    } catch (error) {
      console.error('❌ Error fetching notifications:', error.response?.data || error.message);
    }
  };

  const fetchPreferences = async () => {
    if (!user) return;
    try {
      const res = await notificationService.getPreferences();
      setPreferences(res.data);
    } catch (error) {
      console.error('Error fetching notification preferences:', error.response?.data || error.message);
    }
  };

  const updatePreferences = async (patch) => {
    const next = { ...(preferences || {}), ...patch };
    setPreferences(next);
    try {
      const res = await notificationService.updatePreferences(patch);
      setPreferences(res.data);
    } catch (error) {
      console.error('Error updating notification preferences:', error.response?.data || error.message);
      fetchPreferences();
    }
  };

  // Load notifications on mount
  useEffect(() => {
    if (user) {
      // Add delay to ensure token is properly set
      setTimeout(() => {
        fetchNotifications();
        fetchPreferences();
      }, 100);
    }
  }, [user]);

  // Setup WebSocket connection (disabled on Render free tier)
  useEffect(() => {
    if (!user) return;

    const token = sessionStorage.getItem('access_token');
    if (!token) return;

    // Check if we're on production (Render)
    const isProduction = window.location.hostname.includes('onrender.com');
    
    if (isProduction) {
      console.log('⚠️ WebSocket disabled on Render free tier - using polling instead');
      return; // Skip WebSocket on production
    }

    // Connect to WebSocket (local development only)
    websocketService.connect(token);

    // Listen for incoming notifications
    const handleNotification = (data) => {
      console.log('📨 WebSocket data received:', data);
      
      if (data.type === 'notification') {
        const newNotif = normalizeNotification(data.notification);
        setNotifications((prev) => prependNotification(prev, newNotif));
        if (newNotif.task_id) {
          dataUpdateListeners.current.forEach(cb => cb({
            type: 'data_update',
            entity: 'task',
            action: newNotif.notification_type || 'notification',
            data: {
              task_id: newNotif.task_id,
              project_id: newNotif.project_id,
              feature_id: newNotif.feature_id,
              task: newNotif.task || null,
            },
          }));
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotif.title, { body: newNotif.message, icon: newNotif.icon });
        }
      } else if (data.type === 'data_update') {
        // Issue-created notifications are already sent by the backend notification event.

        // Handle status change notification for client
        if (data.entity === 'issue' && data.action === 'status_changed_client') {
          const { message, new_status } = data.data;
          const icons = { 'Done': '✅', 'In Progress': '🔧', 'Testing': '🧪', 'To Do': '📋' };
          const localNotif = {
            id: `local_status_${Date.now()}`,
            title: `Issue ${new_status}`,
            message,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            issue_id: data.data.issue_id,
            project_id: data.data.project_id,
            read: false, type: 'direct', isLocal: true,
            icon: icons[new_status] || '🔔',
          };
          setNotifications((prev) => prependNotification(prev, localNotif));
        }

        // Handle assigned_for_testing notification for tester
        if (data.entity === 'issue' && data.action === 'assigned_for_testing') {
          const issue = data.data.issue || null;
          const localNotif = {
            id: `local_testing_${Date.now()}`,
            title: 'Issue Ready for Testing',
            message: data.data.message,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            issue,
            project: typeof issue?.project === 'object' ? issue.project : null,
            issue_id: issue?.id || data.data.issue_id,
            project_id: getIssueProjectId(issue) || data.data.project_id,
            read: false, type: 'direct', isLocal: true, icon: '🧪',
          };
          setNotifications((prev) => prependNotification(prev, normalizeNotification(localNotif)));
        }

        // Handle rejected_from_testing notification for developer
        if (data.entity === 'issue' && data.action === 'rejected_from_testing') {
          const issue = data.data.issue || null;
          const localNotif = {
            id: `local_rejected_${Date.now()}`,
            title: 'Issue Needs Attention',
            message: data.data.message,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            issue,
            project: typeof issue?.project === 'object' ? issue.project : null,
            issue_id: issue?.id || data.data.issue_id,
            project_id: getIssueProjectId(issue) || data.data.project_id,
            read: false, type: 'direct', isLocal: true, icon: '❌',
          };
          setNotifications((prev) => prependNotification(prev, normalizeNotification(localNotif)));
        }

        // Handle approved_from_testing notification for developer
        if (data.entity === 'issue' && data.action === 'approved_from_testing') {
          const issue = data.data.issue || null;
          const localNotif = {
            id: `local_approved_${Date.now()}`,
            title: 'Issue Approved',
            message: data.data.message,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            issue,
            project: typeof issue?.project === 'object' ? issue.project : null,
            issue_id: issue?.id || data.data.issue_id,
            project_id: getIssueProjectId(issue) || data.data.project_id,
            read: false, type: 'direct', isLocal: true, icon: '✅',
          };
          setNotifications((prev) => prependNotification(prev, normalizeNotification(localNotif)));
        }

        // Handle subtask assigned notification
        if (data.entity === 'subtask' && data.action === 'assigned') {
          const subtask = data.data.subtask || null;
          const localNotif = {
            id: `local_subtask_assigned_${Date.now()}`,
            title: 'Sub-task Assigned',
            message: data.data.message,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            subtask,
            project_id: data.data.project_id,
            task_id: data.data.task_id,
            subtask_id: data.data.subtask_id,
            read: false, type: 'direct', isLocal: true, icon: '📌',
          };
          setNotifications((prev) => prependNotification(prev, localNotif));
          console.log('📌 Sub-task assigned notification added:', localNotif);
        }

        // Handle subtask status changed notification
        if (data.entity === 'subtask' && data.action === 'status_changed') {
          const { message, old_status, new_status } = data.data;
          const icons = { 'Done': '✅', 'In Progress': '🔧', 'Testing': '🧪', 'To Do': '📋' };
          const localNotif = {
            id: `local_subtask_status_${Date.now()}`,
            title: `Sub-task ${new_status}`,
            message,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            project_id: data.data.project_id,
            task_id: data.data.task_id,
            subtask_id: data.data.subtask_id,
            read: false, type: 'direct', isLocal: true,
            icon: icons[new_status] || '🔔',
          };
          setNotifications((prev) => prependNotification(prev, localNotif));
          console.log('📌 Sub-task status changed notification added:', localNotif);
        }

        // Handle task assigned notification
        if (data.entity === 'task' && data.action === 'task_reassigned') {
          const task = data.data.task || null;
          const localNotif = {
            id: `local_task_assigned_${Date.now()}`,
            title: 'Task Assigned',
            message: data.data.message,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            task,
            project_id: data.data.project_id,
            task_id: data.data.task_id,
            read: false, type: 'direct', isLocal: true, icon: '📋',
          };
          setNotifications((prev) => prependNotification(prev, localNotif));
          console.log('📋 Task assigned notification added:', localNotif);
        }

        // Handle task ready for testing notification
        if (data.entity === 'task' && data.action === 'task_testing') {
          const task = data.data.task || null;
          const localNotif = {
            id: `local_task_testing_${Date.now()}`,
            title: 'Task Ready for Testing',
            message: data.data.message,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            task,
            project_id: data.data.project_id,
            task_id: data.data.task_id,
            read: false, type: 'direct', isLocal: true, icon: '🧪',
          };
          setNotifications((prev) => prependNotification(prev, localNotif));
          console.log('🧪 Task ready for testing notification added:', localNotif);
        }

        // Handle task rejected notification
        if (data.entity === 'task' && data.action === 'task_rejected') {
          const task = data.data.task || null;
          const localNotif = {
            id: `local_task_rejected_${Date.now()}`,
            title: 'Task Needs Attention',
            message: data.data.message,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            task,
            project_id: data.data.project_id,
            task_id: data.data.task_id,
            read: false, type: 'direct', isLocal: true, icon: '❌',
          };
          setNotifications((prev) => prependNotification(prev, localNotif));
          console.log('❌ Task rejected notification added:', localNotif);
        }

        // Handle task approved notification
        if (data.entity === 'task' && data.action === 'task_approved') {
          const task = data.data.task || null;
          const localNotif = {
            id: `local_task_approved_${Date.now()}`,
            title: 'Task Approved',
            message: data.data.message,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            task,
            project_id: data.data.project_id,
            task_id: data.data.task_id,
            read: false, type: 'direct', isLocal: true, icon: '✅',
          };
          setNotifications((prev) => prependNotification(prev, localNotif));
          console.log('✅ Task approved notification added:', localNotif);
        }
        
        dataUpdateListeners.current.forEach(cb => cb(data));
      }
      
      // Trigger dashboard update events for real-time charts
      window.dispatchEvent(new CustomEvent('dashboardUpdate', { detail: data }));
      window.dispatchEvent(new CustomEvent('websocketMessage', { detail: data }));
    };

    websocketService.addListener(handleNotification);

    // Cleanup on unmount
    return () => {
      websocketService.removeListener(handleNotification);
      websocketService.disconnect();
    };
  }, [user]);

  // Setup polling for notifications (production fallback)
  useEffect(() => {
    if (!user) return;

    const isProduction = window.location.hostname.includes('onrender.com');
    if (!isProduction) return; // Only poll on production

    console.log('📡 Starting notification polling (production mode)');
    
    // Poll every 5 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [user]);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const addNotification = (notification) => {
    // This is for local notifications only (not saved to backend)
    const newNotif = {
      id: `local_${Date.now()}`, // String ID for local notifications
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      read: false,
      type: 'direct',
      isLocal: true,
      ...notification,
    };
    setNotifications((prev) => prependNotification(prev, newNotif));
  };

  const markAsRead = async (id) => {
    // Skip backend call for local notifications
    if (String(id).startsWith('local_')) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      return;
    }
    
    try {
      console.log('🔄 Marking notification as read:', id);
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('❌ Error marking as read:', error.response?.data || error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    // Skip backend call for local notifications
    if (String(id).startsWith('local_')) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      return;
    }
    
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updatePreferences,
        clearAll,
        onDataUpdate,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
