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
# Build the application
npm run build

# Output will be in dist/cryptography-frontend/
```

## 📝 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run watch` - Build and watch for changes
- `npm run lint` - Run linter

## 🎨 Design System

### Color Palette
The application uses a security-themed color palette:

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
│   ├── core/                 # Core functionality
│   │   ├── guards/          # Route guards
│   │   ├── interceptors/    # HTTP interceptors
│   │   └── services/        # Singleton services
│   ├── features/            # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── dashboard/      # Dashboard
│   │   ├── chat/           # Chat feature
│   │   ├── encryption/     # Encryption tools
│   │   └── files/          # File management
│   ├── shared/             # Shared components
│   │   └── components/     # Reusable components
│   └── models/             # TypeScript interfaces
├── assets/                  # Static assets
├── environments/            # Environment configs
└── styles.scss             # Global styles
```

## 🔒 Security Features

- JWT authentication with HTTP-only session storage
- CSRF protection
- XSS prevention (Angular's built-in sanitization)
- Route guards for authentication
- Secure token management
- Input validation and sanitization
- Rate limiting on API calls

## 🔧 Configuration

### Environment Variables

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  wsUrl: 'ws://localhost:6379',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID',
  // ... other configs
};
```

### API URL

The frontend communicates with the Laravel backend. Ensure the `apiUrl` in environment configuration matches your backend URL.

## 📚 Features

### Implemented
- ✅ Authentication (Login, Register, Forgot Password)
- ✅ JWT token management
- ✅ Route guards
- ✅ HTTP interceptors
- ✅ Security-themed UI design
- ✅ Responsive navigation
- ✅ Global styles and design system

### In Progress
- 🔨 Dashboard
- 🔨 Encryption/Decryption tools
- 🔨 Real-time chat
- 🔨 File management
- 🔨 Profile management

### Planned
- 📋 Google OAuth integration
- 📋 File sharing
- 📋 Notification system

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run e2e tests
npm run e2e
```

## 📦 Dependencies

### Core
- Angular 17+
- RxJS 7.8+
- TypeScript 5.2+

### Additional
- socket.io-client (for real-time chat)

## 🐛 Known Issues

- Google OAuth redirect needs backend configuration
- WebSocket connection requires Redis setup
- File upload progress tracking needs implementation

## 📖 Documentation

- [Angular Documentation](https://angular.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [RxJS Documentation](https://rxjs.dev/)

## 👥 Team

- Zahraa Salloum
- Mariam Abou Merhi
- Mohammad Nassar
- Tara Elkhoury

## ⚠️ Security Notice

This is an educational project implementing deprecated cryptographic algorithms (RC4 and A5/1). These algorithms have known vulnerabilities and should NOT be used in production systems.

## 📄 License

MIT License - Educational use only
