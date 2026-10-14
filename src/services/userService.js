import API from './api';

export const userService = {
  getAll: (role) => API.get('/auth/users/', { params: role ? { role } : {} }),
  getById: (id) => API.get(`/auth/users/${id}/`),
  getProfileStats: (id) => API.get(`/auth/users/${id}/profile-stats/`),
  create: (data) => API.post('/auth/users/', data),
  update: (id, data) => API.patch(`/auth/users/${id}/`, data),
  resendInvite: (id) => API.post(`/auth/users/${id}/resend-invite/`),
  delete: (id) => API.delete(`/auth/users/${id}/`),
};

// Backward compatibility
export const getUsers = (role) => API.get('/auth/users/', { params: role ? { role } : {} });
export const createUser = (data) => API.post('/auth/users/', data);
export const updateUser = (id, data) => API.patch(`/auth/users/${id}/`, data);
export const resendInvite = (id) => API.post(`/auth/users/${id}/resend-invite/`);
export const deleteUser = (id) => API.delete(`/auth/users/${id}/`);
