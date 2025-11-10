import Cookies from "js-cookie";

export const getAuthToken = (): string | null => {
  return Cookies.get('authToken');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

export const API_TOKEN = '?api_key=ecd1484bdf4c4701a8e2c072903553ee'
