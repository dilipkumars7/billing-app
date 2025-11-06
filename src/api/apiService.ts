import httpClient from './httpClient';

export const ApiService = {
  get: async <T>(url: string, params?: any): Promise<T> => {
    return await httpClient.get(url, { params });
  },

  post: async <T>(url: string, data: any): Promise<T> => {
    return await httpClient.post(url, data);
  },

  put: async <T>(url: string, data: any): Promise<T> => {
    return await httpClient.put(url, data);
  },

  delete: async <T>(url: string): Promise<T> => {
    return await httpClient.delete(url);
  },
};
