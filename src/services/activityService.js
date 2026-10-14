import API from './api';

export const activityService = {
  getAll: (params = {}) => API.get('/projects/activity-logs/', { params }),
};
