import axios from 'axios';

const api = axios.create({
  baseURL: 'https://suraksha-maps-api-2026.onrender.com',
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response || error.message);
    return Promise.reject(error);
  }
);

export default api;
