import API from './api';

export const projectService = {
  getAll: () => API.get('/projects/'),
  getById: (id) => API.get(`/projects/${id}/`),
  getBySlug: (slug) => API.get(`/projects/${slug}/`),
  create: (data) => API.post('/projects/', data),
  update: (id, data) => API.patch(`/projects/${id}/`, data),
  delete: (id) => API.delete(`/projects/${id}/`),
  getClients: () => API.get('/projects/clients/'),
};

// Backward compatibility
export const getProjects = () => API.get('/projects/');
export const createProject = (data) => API.post('/projects/', data);
export const updateProject = (id, data) => API.patch(`/projects/${id}/`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}/`);
export const getDashboardStats = () => API.get('/projects/dashboard-stats/');
