import axios, { AxiosInstance, } from 'axios';
// import { getAuthToken, removeAuthToken } from '../utils/tokenManager';

// Create a single Axios instance
const httpClient: AxiosInstance = axios.create({
  baseURL: 'https://api.themoviedb.org/',
  timeout: 15000,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
    Accept: "application/json",
  },
});

httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("❌ API Error:", error);
    return Promise.reject(error);
  }
);

// // 🔹 Request Interceptor
// httpClient.interceptors.request.use(
//   (config: AxiosRequestConfig) => {
//     const token = getAuthToken();
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     // Example: Add correlation ID or custom headers
//     config.headers['X-Request-Source'] = 'react-vite-client';
//     return config;
//   },
//   (error: AxiosError) => {
//     console.error('[Request Error]:', error);
//     return Promise.reject(error);
//   }
// );

// // 🔹 Response Interceptor
// httpClient.interceptors.response.use(
//   (response: AxiosResponse) => {
//     // Transform response if needed
//     return response.data;
//   },
//   (error: AxiosError) => {
//     if (error.response) {
//       const { status } = error.response;

//       // Handle common HTTP errors
//       if (status === 401) {
//         removeAuthToken();
//         window.location.href = '/login';
//       } else if (status === 403) {
//         console.warn('Access forbidden: insufficient permissions.');
//       } else if (status === 500) {
//         console.error('Internal Server Error');
//       }
//     } else if (error.request) {
//       console.error('Network error or no response received.');
//     }

//     return Promise.reject(error);
//   }
// );

export default httpClient;
