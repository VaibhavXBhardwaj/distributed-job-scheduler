import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4100/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('loom_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('loom_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
