# ChatApp Frontend

A modern React Native chat application with AI integration, built with Expo and TypeScript.

## 🚀 Features

- **AI Chat Integration**: Real-time chat with AI assistant
- **User Authentication**: Secure login and registration
- **Theme Support**: Light, dark, and auto themes
- **Responsive Design**: Works on iOS, Android, and Web
- **Offline Support**: Graceful handling of network issues
- **Modern UI**: Material Design inspired interface

## 📱 Screens

- **Welcome Screen**: App introduction and navigation to auth
- **Login/Register**: User authentication
- **Home Screen**: Dashboard with quick actions and statistics
- **Chat Screen**: AI conversation interface
- **Profile Screen**: User profile and settings access
- **Settings Screen**: App configuration and preferences

## 🛠 Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **AsyncStorage** for local data persistence
- **Socket.IO** for real-time communication
- **Vector Icons** for UI icons

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on your preferred platform**:
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 🔧 Configuration

### API Configuration

Update the API settings in `constants/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://your-backend-url:8000',
  SOCKET_URL: 'http://your-backend-url:8000',
  // ... other settings
};
```

### Environment Setup

1. **Backend Connection**: Ensure your backend server is running
2. **Network Configuration**: Update IP addresses for your development environment
3. **API Endpoints**: Verify all API endpoints are accessible

## 📁 Project Structure

```
ChatApp/
├── components/          # Reusable UI components
│   ├── AuthContext.tsx # Authentication context
│   ├── LoginScreen.tsx # Login interface
│   ├── RegisterScreen.tsx # Registration interface
│   └── ...
├── screens/            # Main app screens
│   ├── HomeScreen.tsx  # Dashboard
│   ├── ChatScreen.tsx  # AI chat interface
│   ├── ProfileScreen.tsx # User profile
│   └── SettingsScreen.tsx # App settings
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── services/          # API and socket services
│   ├── api.ts         # REST API client
│   └── socketService.ts # WebSocket client
├── theme/             # Theme configuration
│   └── ThemeContext.tsx
├── constants/         # App constants
│   └── config.ts      # API and app configuration
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
└── types/            # TypeScript type definitions
```

## 🔐 Authentication Flow

1. **Welcome Screen**: App introduction
2. **Login/Register**: User authentication
3. **Main App**: Authenticated user interface
4. **Auto-login**: Persistent session management

## 🎨 Theming

The app supports three theme modes:
- **Light**: Bright, clean interface
- **Dark**: Easy on the eyes
- **Auto**: Follows system preference

Theme settings are persisted using AsyncStorage.

## 🌐 API Integration

### Endpoints

- `POST /api/v1/users/login` - User authentication
- `POST /api/v1/users/` - User registration
- `POST /api/v1/chat/` - Send chat message
- `GET /api/v1/chat/{user_id}` - Get chat history
- `DELETE /api/v1/chat/{message_id}` - Delete message

### Error Handling

- Network error detection
- Automatic retry with fallback URLs
- Offline mode support
- User-friendly error messages

## 🚨 Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Check backend server is running
   - Verify IP address in `config.ts`
   - Test network connectivity

2. **Build Errors**:
   - Clear Metro cache: `npx expo start --clear`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

3. **TypeScript Errors**:
   - Check type definitions in `types/` directory
   - Verify import paths are correct

### Development Tips

- Use Expo DevTools for debugging
- Enable React Native Debugger for better debugging
- Check console logs for API responses
- Test on multiple devices/platforms

## 📄 License

This project is part of the IoT Kit Rental system.

## 🤝 Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test on multiple platforms
4. Update documentation as needed

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Test with the provided demo credentials 