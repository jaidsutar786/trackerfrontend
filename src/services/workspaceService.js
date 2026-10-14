import API from './api';

export const workspaceService = {
  getSettings: () => API.get('/auth/workspace/'),
  updateSettings: (payload) => API.patch('/auth/workspace/', payload),
  getUsage: () => API.get('/auth/workspace/usage/'),
  startTrial: () => API.post('/auth/workspace/trial/'),
  createCheckout: () => API.post('/auth/workspace/billing/checkout/'),
  createPortal: () => API.post('/auth/workspace/billing/portal/'),
};
