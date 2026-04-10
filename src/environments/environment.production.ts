/**
 * Production Environment Configuration
 * Update apiUrl after your Render backend is deployed
 */

export const environment = {
  production: true,
  apiUrl: 'https://crypto-secure-backend.onrender.com/api',

  googleClientId: 'YOUR_GOOGLE_CLIENT_ID',

  features: {
    googleOAuth: true,
    fileSharing: true,
    chat: true,
  },
};
