import API from './api';

export const notificationService = {
  getAll: (params = {}) => API.get('/notifications/', { params }),
  getSummary: () => API.get('/notifications/summary/'),
  getPreferences: () => API.get('/notifications/preferences/'),
  updatePreferences: (payload) => API.patch('/notifications/preferences/', payload),
  markAsRead: (id) => API.patch(`/notifications/${id}/read/`),
  markAllAsRead: () => API.post('/notifications/mark-all-read/'),
  delete: (id) => API.delete(`/notifications/${id}/delete/`),
};
