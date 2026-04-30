export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('sa_token') : null;

export const setToken = (token: string) =>
  localStorage.setItem('sa_token', token);

export const clearToken = () =>
  localStorage.removeItem('sa_token');

export const isAuthenticated = () => !!getToken();
