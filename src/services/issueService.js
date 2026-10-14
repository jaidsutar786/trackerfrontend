import API from './api';

export const issueService = {
  getAll: (params = {}) => {
    // Add default pagination params if not provided
    const defaultParams = {
      page: 1,
      page_size: 10,
      ...params
    };
    return API.get('/projects/issues/', { params: defaultParams });
  },
  
  getBacklog: () => API.get('/projects/issues/', { params: { status: 'To Do' } }),
  
  create: (formData) => API.post('/projects/issues/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  getById: (id) => API.get(`/projects/issues/${id}/`),
  
  update: (id, data) => API.patch(`/projects/issues/${id}/`, data),
  
  delete: (id) => API.delete(`/projects/issues/${id}/`),
  
  addComment: (issueId, commentData) => {
    // Handle both string and object input
    const data = typeof commentData === 'string' 
      ? { text: commentData } 
      : commentData;
    return API.post(`/projects/issues/${issueId}/comments/`, data);
  },
  
  toggleCommentLike: (commentId) => API.post(`/projects/comments/${commentId}/like/`),
};
