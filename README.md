# ChatApp Frontend

A modern React Native chat application with AI-powered conversations, speech-to-text functionality, and real-time messaging capabilities. Built with Expo for cross-platform compatibility.

## 🚀 Features

- 💬 **Real-time Chat**: Socket.io based messaging with instant delivery
- 🎤 **Speech-to-Text**: Voice input with microphone support across platforms
- 🌐 **Multi-language Support**: English and Vietnamese with automatic detection
- 🎨 **Modern UI/UX**: Clean, responsive design with dark/light theme support
- 📱 **Cross-platform**: Native iOS, Android, and Web support
- 🔐 **Secure Authentication**: User registration, login, and profile management
- 🤖 **AI Agents**: Customizable AI agents for different conversation types
- 🎵 **Audio Messages**: Voice message recording and playback
- 📊 **Real-time Status**: Connection status indicators and diagnostics
- 🔧 **Developer Tools**: Speech diagnostic tools and network troubleshooting

## 📋 Prerequisites

### Required Software
- **Node.js**: v16 or higher ([Download](https://nodejs.org/))
- **pnpm**: Fast, disk space efficient package manager
- **Expo CLI**: `ppnpm install -g @expo/cli`
- **Git**: For version control

### Development Environment
- **Physical Device**: Required for mobile speech recognition testing
- **Modern Browser**: Chrome/Edge recommended for web development
- **Android Studio**: For Android development (optional)
- **Xcode**: For iOS development (macOS only, optional)

## 🛠️ Installation & Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd ChatApp

# Install dependencies
pnpm install
```

### 2. Environment Configuration
```bash
# Copy environment template (if available)
cp .env.example .env

# Configure your environment variables
# Add your API endpoints, socket URLs, etc.
```

### 3. Start Development Server
```bash
# Start Expo development server
pnpm start

# Or run specific platforms
pnpm run android    # Android
pnpm run ios        # iOS  
pnpm run web        # Web browser
```

## 🎤 Speech Recognition Setup

### Mobile Platforms (iOS/Android)
Speech recognition requires a standalone app build (doesn't work in Expo Go):

```bash
# Install EAS CLI globally
pnpm install -g @expo/eas-cli

# Login to Expo account
eas login

# Build development version
eas build --platform android --profile development
eas build --platform ios --profile development

# Install on device
# Download APK/IPA from build link and install
```

### Web Platform
Works directly in modern browsers:
- **Chrome/Chromium**: Full support ✅
- **Edge**: Good support ✅
- **Safari**: Limited support ⚠️
- **Firefox**: No support ❌

**Requirements:**
- HTTPS connection (not HTTP)
- Microphone permission granted
- Modern browser with Web Speech API support

## 📁 Project Structure

```
ChatApp/
├── components/              # Reusable UI components
│   ├── AgentCard.tsx       # AI agent selection cards
│   ├── ChatInput.tsx       # Chat input with voice support
│   ├── SpeechToTextButton.tsx
│   └── ...
├── screens/                # Screen components
│   ├── ChatScreen.tsx      # Main chat interface
│   ├── HomeScreen.tsx      # Home/dashboard
│   └── ...
├── hooks/                  # Custom React hooks
│   ├── useSpeechToText.ts  # Speech recognition logic
│   ├── useSocket.ts        # Socket connection management
│   └── ...
├── services/               # External services
│   ├── api.ts             # REST API calls
│   ├── socketService.ts   # Socket.io client
│   └── ...
├── theme/                  # Theme and styling
├── i18n/                   # Internationalization
├── navigation/             # Navigation configuration
├── utils/                  # Utility functions
├── constants/              # App constants and config
└── types/                  # TypeScript type definitions
```

## 🔧 Key Components

### Core Components
- **`ChatScreen`**: Main chat interface with speech-to-text integration
- **`SpeechToTextButton`**: Microphone button with voice input handling
- **`ChatInput`**: Text input with voice recording capabilities
- **`AgentSelector`**: AI agent selection and customization

### Context Providers
- **`AuthContext`**: User authentication and session management
- **`ThemeContext`**: Dark/light theme switching
- **`LanguageContext`**: Multi-language support
- **`AgentContext`**: AI agent state management

### Utility Components
- **`SpeechDiagnostic`**: Speech recognition troubleshooting tool
- **`SocketStatusIndicator`**: Real-time connection status
- **`LoadingSpinner`**: Loading states and animations

## 🛠️ Technologies & Dependencies

### Core Framework
- **React Native**: 0.81.4 - Mobile app framework
- **Expo**: ~54.0.0 - Development platform and tools
- **TypeScript**: ~5.9.2 - Type-safe JavaScript
- **React**: 19.1.0 - UI library

### Key Libraries
- **Socket.io Client**: ^4.8.1 - Real-time communication
- **React Navigation**: ^7.x - Navigation library
- **@react-native-voice/voice**: ^3.2.4 - Speech recognition
- **React Native Vector Icons**: ^10.3.0 - Icon library
- **Expo AV**: ^16.0.7 - Audio/video handling
- **Expo Speech**: ~13.0.1 - Text-to-speech

### Development Tools
- **Babel**: ^7.25.2 - JavaScript compiler
- **Metro**: Bundler for React Native
- **EAS Build**: Cloud build service

## 🌐 Platform Support

### Mobile (iOS/Android)
- ✅ Native performance
- ✅ Full speech recognition
- ✅ Push notifications
- ✅ Offline capabilities
- ✅ Device-specific features

### Web
- ✅ Cross-browser compatibility
- ✅ Responsive design
- ✅ Web Speech API integration
- ⚠️ Limited offline support
- ⚠️ No push notifications

## 🎯 Development Commands

```bash
# Development
pnpm start                 # Start Expo dev server
pnpm run android          # Run on Android
pnpm run ios              # Run on iOS
pnpm run web              # Run on web

# Building
eas build --platform android --profile development
eas build --platform ios --profile development
eas build --platform all --profile production

# Testing
pnpm test                 # Run tests (if configured)
pnpm run lint             # Run linter (if configured)
```

## 🐛 Troubleshooting

### Speech Recognition Issues

**Mobile Platforms:**
- ❌ Doesn't work in Expo Go (requires standalone build)
- ✅ Use Speech Diagnostic tool to check availability
- ✅ Ensure microphone permissions are granted
- ✅ Test on physical device, not simulator
- ✅ Check device language settings

**Web Platform:**
- ✅ Requires HTTPS connection
- ✅ Grant microphone permission when prompted
- ✅ Use Chrome/Edge for best compatibility
- ❌ Firefox doesn't support Web Speech API

### Common Development Issues

**Metro Bundler:**
```bash
# Clear cache and restart
expo start --clear
# Or
npx expo start --clear
```

**Dependencies:**
```bash
# Clean install
rm -rf node_modules package-lock.json
pnpm install
```

**Build Issues:**
- Check EAS build logs for specific errors
- Verify app.json configuration
- Ensure all required permissions are set

**Network Issues:**
- Check API endpoints in constants/config.ts
- Verify socket connection settings
- Use network troubleshooting tools in utils/

## 🌍 Language Support

### Supported Languages
- **English**: `en-US` - Full support
- **Vietnamese**: `vi-VN` - Full support

### Language Features
- Automatic language detection based on user preference
- Dynamic speech recognition language switching
- Localized UI text and messages
- Cross-platform language consistency

### Testing Multi-language
1. Change app language in settings
2. Test speech recognition in both languages
3. Verify UI text translations
4. Check voice input/output language

## 📱 Platform-Specific Notes

### iOS
- Requires microphone permission in Info.plist
- Speech recognition works in standalone builds
- Supports Siri integration (if configured)
- Requires iOS 13+ for full feature support

### Android
- Requires RECORD_AUDIO permission
- Works with Google Speech Services
- Supports offline speech recognition
- Requires Android 6+ for full feature support

### Web
- Uses Web Speech API
- Requires HTTPS for microphone access
- Limited offline capabilities
- Cross-browser compatibility varies

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Submit a pull request

### Code Standards
- Use TypeScript for type safety
- Follow React Native best practices
- Write meaningful commit messages
- Test on multiple platforms
- Update documentation as needed

## 📄 License

This project is private and proprietary. All rights reserved.

## 📞 Support

For technical support or questions:
- Check the troubleshooting section above
- Review existing issues in the repository
- Contact the development team

---

**Last Updated**: 2024
**Version**: 1.0.0
**SDK Version**: Expo 54.0.0