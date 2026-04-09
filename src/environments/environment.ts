/**
 * Environment Configuration
 * Development environment settings
 * WARNING: Do not commit sensitive credentials
 */

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  wsUrl: 'ws://localhost:6379',
  
  // Google OAuth (replace with actual credentials)
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID',
  
  // Feature flags
  features: {
    googleOAuth: true,
    fileSharing: true,
    chat: true,
  },
  
  // Limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerUser: 50,
  
  // Security settings
  tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 60 * 60 * 1000, // 1 hour
};
