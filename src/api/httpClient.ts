import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAuthToken } from '../utils/tokenManager';
import { SERVER_URL } from '../constants/url.constant';


// Create a single Axios instance
const httpClient: AxiosInstance = axios.create({
  baseURL: SERVER_URL.HTTP,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
    Accept: "application/json",
  },
});

httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // console.error("❌ API Error:", error);
    return Promise.reject(error);
  }
);

// // 🔹 Request Interceptor
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[Request Error]:', error);
    return Promise.reject(error);
  }
);

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
