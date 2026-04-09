/**
 * Production Environment Configuration
 * Update apiUrl with your Render backend URL after deployment
 */

export const environment = {
  production: true,
  apiUrl: 'https://crypto-secure-backend.onrender.com/api',

  // Google OAuth (replace with actual credentials)
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID',

  // Feature flags
  features: {
    googleOAuth: true,
    fileSharing: true,
    chat: true,
  },
};
