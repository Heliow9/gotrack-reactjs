import axios from 'axios';

const api = axios.create({
  baseURL: 'http://168.75.78.51/api/api/restaurantes', // Ajuste se necessário
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export default api;
