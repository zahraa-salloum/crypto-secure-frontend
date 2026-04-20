# Frontend - CryptoSecure

Angular-based frontend for the Stream Cipher RC4/A5 Cryptography Project.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Application will be available at http://localhost:4200
```

### Build for Production

```bash
npm run build

# Output will be in dist/cryptography-frontend/
```

## 📝 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests

## 🎨 Design System

### Color Palette
Security-themed color palette:

- **Primary**: `#1a237e` (Deep Indigo)
- **Secondary**: `#00695c` (Teal)
- **Accent**: `#0288d1` (Light Blue)
- **Success**: `#2e7d32` (Green)
- **Warning**: `#f57c00` (Orange)
- **Danger**: `#c62828` (Red)

### Spacing
Uses an 8px grid system: 8, 16, 24, 32, 48, 64px

### Typography
System font stack with fallback to sans-serif

## 🏗️ Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── crypto/          # RC4 and A5/1 client-side implementations
│   │   ├── guards/          # Auth and admin route guards
│   │   ├── interceptors/    # HTTP auth & error interceptors
│   │   └── services/        # Auth, chat, file, encryption services
│   ├── features/
│   │   ├── auth/            # Login, register, forgot/reset password
│   │   ├── admin/           # Admin dashboard (stats, user management)
│   │   ├── dashboard/       # User dashboard with stats
│   │   ├── chat/            # Encrypted real-time chat
│   │   ├── encryption/      # Text encryption/decryption tool
│   │   ├── files/           # Encrypted file upload & download
│   │   ├── profile/         # User profile & password management
│   │   ├── home/            # Landing page
│   │   ├── about/           # About page
│   │   └── how-it-works/    # How it works page
│   ├── shared/
│   │   ├── components/      # Navbar, toast, dialog
│   │   └── validators/      # Password strength validators
│   └── models/              # TypeScript interfaces
├── environments/            # Dev and production configs
└── styles.scss              # Global styles
```

## 🔒 Security Features

- Token-based authentication with Sanctum (stored in sessionStorage)
- Automatic token refresh every 15 minutes via `POST /auth/refresh`
- Session timeout: forced logout after 1 hour of user inactivity
- Route guards for authenticated and admin-only routes
- HTTP interceptors for auth token injection and error handling
- Password strength validation (uppercase, number, special character)
- XSS prevention via Angular's built-in sanitization
- Content Security Policy headers
- Input validation on all forms

## 📚 Implemented Features

### Authentication
- ✅ Register with password strength validation
- ✅ Login with redirect logic (admin → /admin, user → /dashboard)
- ✅ Forgot password (sends reset email)
- ✅ Reset password with token + email from URL
- ✅ Change password from profile

### Admin Panel
- ✅ Platform statistics (users, files, messages, storage)
- ✅ User list with search and role filter
- ✅ Create users (admin or regular)
- ✅ Ban / unban users

### Dashboard
- ✅ Stats overview (encrypted chats, files, messages)
- ✅ Quick action links

### Encrypted Chat
- ✅ Start conversations with other users
- ✅ Client-side RC4 / A5/1 message encryption
- ✅ Per-message nonce combined with key to prevent keystream reuse
- ✅ Per-conversation encryption key
- ✅ Messages stored encrypted on server

### File Encryption
- ✅ Client-side file encryption (RC4 or A5/1) before upload
- ✅ Encrypted file storage on server
- ✅ Client-side decryption on download
- ✅ Key never sent to server
- ✅ Per-user file limit (10 files)

### Text Encryption Tool
- ✅ Encrypt/decrypt text with RC4 or A5/1
- ✅ Copy to clipboard

### Profile
- ✅ Update display name
- ✅ Upload avatar (stored as base64)
- ✅ Change password with strength validation
- ✅ Delete account

## 🔧 Environment Configuration

Edit `src/environments/environment.ts` for development:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 60 * 60 * 1000, // 1 hour
};
```

For production, `src/environments/environment.production.ts` is used automatically.

## 📦 Key Dependencies

- Angular 17+
- RxJS 7.8+
- TypeScript 5.2+
- socket.io-client (real-time chat)

## 👥 Team

- Zahraa Salloum
- Mariam Abou Merhi
- Mohammad Nassar
- Tara Elkhoury

## ⚠️ Security Notice

This is an educational project implementing deprecated cryptographic algorithms (RC4 and A5/1). These algorithms have known vulnerabilities and should **NOT** be used in production systems.

## 📄 License

MIT License - Educational use only
