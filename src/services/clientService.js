import API from './api';

export const clientService = {
  getAll: () => API.get('/projects/clients/'),
  getById: (id) => API.get(`/projects/clients/${id}/`),
  create: (data) => API.post('/projects/clients/', data),
  update: (id, data) => API.patch(`/projects/clients/${id}/`, data),
  delete: (id) => API.delete(`/projects/clients/${id}/`),
  getProjects: (id) => API.get(`/projects/clients/${id}/projects/`),
};

// Backward compatibility
export const getClients = () => API.get('/projects/clients/');
export const getClient = (id) => API.get(`/projects/clients/${id}/`);
export const createClient = (data) => API.post('/projects/clients/', data);
export const updateClient = (id, data) => API.patch(`/projects/clients/${id}/`, data);
export const deleteClient = (id) => API.delete(`/projects/clients/${id}/`);
export const getClientProjects = (id) => API.get(`/projects/clients/${id}/projects/`);
