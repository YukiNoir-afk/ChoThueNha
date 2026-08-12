import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Hỗ trợ gửi cookie (cho admin sau này)
});

// Xử lý lỗi tập trung
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Có thể add toast notification ở đây
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
