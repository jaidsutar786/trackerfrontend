import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data.map(n => ({
        ...n,
        type: 'direct',
        timestamp: n.created_at,
      })));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Poll for new notifications every 10 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [user]);

  const addNotification = (notification) => {
    // This is for local notifications only (not saved to backend)
    const newNotif = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      read: false,
      type: 'direct',
      ...notification,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Error marking as read:', error);
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
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
