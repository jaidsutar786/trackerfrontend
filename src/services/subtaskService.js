import api from './api';

export const subtaskService = {
  getByTask: (taskId) => api.get(`/projects/tasks/${taskId}/subtasks/`),
  create: (taskId, data) => api.post(`/projects/tasks/${taskId}/subtasks/`, data),
  update: (subtaskId, data) => api.patch(`/projects/subtasks/${subtaskId}/`, data),
  delete: (subtaskId) => api.delete(`/projects/subtasks/${subtaskId}/`),
};
