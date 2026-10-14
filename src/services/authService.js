import API from './api';

export const login = (username, password) =>
  API.post('/auth/login/', { username, password });

export const getMe = () => API.get('/auth/me/');

export const forgotPassword = (email) =>
  API.post('/auth/forgot-password/', { email });

export const resetPassword = (token, new_password) =>
  API.post('/auth/reset-password/', { token, new_password });
