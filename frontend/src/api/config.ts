export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  useMock: import.meta.env.VITE_USE_MOCK === 'true', // Defaults to false, connected to live backend
  timeoutMs: 10000,
};
