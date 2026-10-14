import API from './api';

export const featureService = {
  // Features
  getAll:    (projectId)                    => API.get(`/projects/${projectId}/features/`),
  create:    (projectId, data)              => API.post(`/projects/${projectId}/features/`, data),
  getById:   (projectId, featureId)         => API.get(`/projects/${projectId}/features/${featureId}/`),
  getBySlug: (projectSlug, featureId)       => API.get(`/projects/${projectSlug}/features/${featureId}/`),
  update:    (projectId, featureId, data)   => API.patch(`/projects/${projectId}/features/${featureId}/`, data),
  delete:    (projectId, featureId)         => API.delete(`/projects/${projectId}/features/${featureId}/`),

  // Tasks
  getTasks:           (projectId, featureId)               => API.get(`/projects/${projectId}/features/${featureId}/tasks/`),
  createTask:         (projectId, featureId, data)         => API.post(`/projects/${projectId}/features/${featureId}/tasks/`, data),
  createTaskBySlug:   (projectSlug, featureId, data)       => API.post(`/projects/${projectSlug}/features/${featureId}/tasks/`, data),
  createTaskForFeature: (projectSlug, moduleSlug, featureDbId, data) => API.post(`/projects/${projectSlug}/modules/${moduleSlug}/features/${featureDbId}/tasks/`, data),
  updateTask:         (projectId, taskId, data)            => API.patch(`/projects/${projectId}/tasks/${taskId}/`, data),
  updateTaskBySlug:   (projectSlug, taskId, data)          => API.patch(`/projects/${projectSlug}/tasks/${taskId}/`, data),
  deleteTask:         (projectId, taskId)                  => API.delete(`/projects/${projectId}/tasks/${taskId}/`),
  deleteTaskBySlug:   (projectSlug, taskId)                => API.delete(`/projects/${projectSlug}/tasks/${taskId}/`),

  // Progress
  getProgress: (projectId)                  => API.get(`/projects/${projectId}/progress/`),
};
