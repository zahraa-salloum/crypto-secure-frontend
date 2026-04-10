/**
 * Environment Configuration
 * Development environment settings
 * WARNING: Do not commit sensitive credentials
 */

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  
  // Limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerUser: 50,
  
  // Security settings
  tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 60 * 60 * 1000, // 1 hour
};
