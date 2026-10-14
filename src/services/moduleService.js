import api from './api';

export const moduleService = {
  // Get all modules for a project
  getByProject: (projectId) => api.get(`/projects/${projectId}/modules/`),
  getByProjectSlug: (projectSlug) => api.get(`/projects/${projectSlug}/modules/`),
  
  // Get single module with features
  getById: (projectId, moduleId) => api.get(`/projects/${projectId}/modules/${moduleId}/`),
  
  // Slug-based methods
  getBySlug: (projectSlug, moduleSlug) => api.get(`/projects/${projectSlug}/modules/${moduleSlug}/`),
  getTasksBySlug: (projectSlug, moduleSlug) => api.get(`/projects/${projectSlug}/modules/${moduleSlug}/tasks/`),
  createTaskBySlug: (projectSlug, moduleSlug, data) => api.post(`/projects/${projectSlug}/modules/${moduleSlug}/tasks/`, data),
  
  // Create module
  create: (projectId, data) => api.post(`/projects/${projectId}/modules/`, data),
  createBySlug: (projectSlug, data) => api.post(`/projects/${projectSlug}/modules/`, data),
  
  // Update module
  update: (projectId, moduleId, data) => api.put(`/projects/${projectId}/modules/${moduleId}/`, data),
  updateBySlug: (projectSlug, moduleSlug, data) => api.patch(`/projects/${projectSlug}/modules/${moduleSlug}/`, data),
  
  // Delete module
  delete: (projectId, moduleId) => api.delete(`/projects/${projectId}/modules/${moduleId}/`),
  deleteBySlug: (projectSlug, moduleSlug) => api.delete(`/projects/${projectSlug}/modules/${moduleSlug}/`),
  
  // Get features for a module
  getFeatures: (projectId, moduleId) => api.get(`/projects/${projectId}/modules/${moduleId}/features/`),
  getFeaturesBySlug: (projectSlug, moduleSlug) => api.get(`/projects/${projectSlug}/modules/${moduleSlug}/features/`),
  
  // Create feature in module
  createFeature: (projectId, moduleId, data) => api.post(`/projects/${projectId}/modules/${moduleId}/features/`, data),
  createFeatureBySlug: (projectSlug, moduleSlug, data) => api.post(`/projects/${projectSlug}/modules/${moduleSlug}/features/`, data),
  
  // Get direct tasks for module (when no features)
  getTasks: (projectId, moduleId) => api.get(`/projects/${projectId}/modules/${moduleId}/tasks/`),
  
  // Create direct task in module
  createTask: (projectId, moduleId, data) => api.post(`/projects/${projectId}/modules/${moduleId}/tasks/`, data),
};
