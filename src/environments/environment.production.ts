/**
 * Production Environment Configuration
 */

export const environment = {
  production: true,
  apiUrl: 'https://crypto-secure-backend.onrender.com/api',

  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerUser: 50,

  // Security settings
  tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 60 * 60 * 1000, // 1 hour

};
