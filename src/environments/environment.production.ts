/**
 * Production Environment Configuration
 */

export const environment = {
  production: true,
  apiUrl: 'https://crypto-secure-backend.onrender.com/api',

  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerUser: 50,

  tokenRefreshInterval: 15 * 60 * 1000,
  sessionTimeout: 60 * 60 * 1000,
};
