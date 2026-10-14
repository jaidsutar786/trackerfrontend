import API from './api';

export const dashboardService = {
  getStats: () => API.get('/projects/dashboard-stats/'),
  getWorkOverview: () => API.get('/projects/work-overview/'),
  getAnalytics: (params = {}) => API.get('/projects/analytics/summary/', { params }),
  exportAnalytics: (params = {}) => API.get('/projects/analytics/export.csv', {
    params,
    responseType: 'blob',
  }),
};
