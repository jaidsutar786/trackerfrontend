import API from './api';

export const taskService = {
  // Get all tasks assigned to current user
  getMyTasks: () => API.get('/tasks/my-tasks/'),
  
  // Get all tasks (admin view)
  getAll: () => API.get('/tasks/'),
  
  // Create task
  create: (projectId, featureId, data) => API.post(`/projects/${projectId}/features/${featureId}/tasks/`, data),
  
  // Update task status
  update: (taskId, data) => API.patch(`/tasks/${taskId}/`, data),
  updateByProjectId: (projectId, taskId, data) => API.patch(`/projects/${projectId}/tasks/${taskId}/`, data),
  
  // Get task by ID
  getById: (taskId) => API.get(`/tasks/${taskId}/`),
  
  // Delete task
  delete: (projectId, taskId) => API.delete(`/projects/${projectId}/tasks/${taskId}/`),
  deleteBySlug: (projectSlug, taskId) => API.delete(`/projects/${projectSlug}/tasks/${taskId}/`),
  
  // Add comment to task
  addComment: (taskId, text) => API.post(`/tasks/${taskId}/comments/`, { text }),
  
  // Get task comments
  getComments: (taskId) => API.get(`/tasks/${taskId}/comments/`),
};