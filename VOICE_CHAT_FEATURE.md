# Voice Chat Feature

## Overview

The Voice Chat feature allows users to interact with the AI using voice input and receive audio responses, while maintaining text-based communication with the backend AI model.

## Key Features

### 🎤 Voice Mode Toggle
- **Location**: Header microphone icon
- **Function**: Toggle between normal chat and voice chat mode
- **Visual Indicator**: Golden microphone when active, white when inactive
- **Long Press**: Opens voice chat demo

### 🎵 Audio Message Display
- **When Active**: Messages display as audio players in the UI
- **Components**: Uses `AudioMessageBubble` for voice messages
- **Features**: 
  - Play/pause controls
  - Audio visualizer animation
  - Progress bar
  - Duration display

### 🔊 Text-to-Speech (TTS)
- **Trigger**: Automatically plays AI responses in voice mode
- **Language Support**: 
  - English (en-US)
  - Vietnamese (vi-VN)
- **Implementation**: Uses `expo-speech` for mobile, Web Speech API for web

### 🎙️ Speech-to-Text (STT)
- **Integration**: Uses existing `SpeechToTextButton` component
- **Language Support**: Matches current app language setting
- **Mode**: Works seamlessly in both normal and voice chat modes

## Technical Implementation

### Components

#### `AudioMessageBubble.tsx`
- Displays voice messages as audio players
- Features play/pause controls and visualizer
- Handles audio progress animation
- Supports both user and AI messages

#### `useTextToSpeech.ts`
- Custom hook for text-to-speech functionality
- Cross-platform support (mobile/web)
- Language detection and configuration
- Error handling and availability checking

#### `VoiceChatDemo.tsx`
- Demo component explaining voice chat features
- Interactive TTS demonstration
- Feature overview and usage instructions

### State Management

```typescript
// Voice mode state
const [isVoiceMode, setIsVoiceMode] = useState(false);
const [showVoiceDemo, setShowVoiceDemo] = useState(false);

// TTS hook
const { speak, stop: stopTTS, isSpeaking, isAvailable: ttsAvailable } = useTextToSpeech();
```

### Message Flow

1. **User Input**: 
   - Voice mode: Speech-to-text converts audio to text
   - Normal mode: Direct text input

2. **Backend Communication**: 
   - Always sends text to AI model
   - No changes to existing API endpoints

3. **AI Response**:
   - Received as text from backend
   - In voice mode: Automatically converted to speech
   - Display: Audio player in voice mode, text in normal mode

## Usage Instructions

### For Users

1. **Enable Voice Mode**: Tap the microphone icon in the header
2. **Record Message**: Tap the microphone button in the input area
3. **Listen to Response**: AI response plays automatically
4. **Control Playback**: Use play/pause controls on audio messages
5. **Disable Voice Mode**: Tap the microphone icon again

### For Developers

#### Adding Voice Support to New Components

```typescript
// Import the hook
import { useTextToSpeech } from '../hooks/useTextToSpeech';

// Use in component
const { speak, stop, isSpeaking, isAvailable } = useTextToSpeech();

// Speak text
await speak("Hello world", "en-US");
```

#### Creating Audio Messages

```typescript
// In message rendering
<ChatMessageBubble
  message={message.text}
  isUser={isUser}
  isVoiceMessage={isVoiceMode}
  // ... other props
/>
```

## Dependencies

### Required Packages
- `expo-speech`: Text-to-speech functionality
- `@react-native-voice/voice`: Speech-to-text (already installed)
- `react-native-vector-icons`: UI icons

### Installation
```bash
npm install expo-speech
```

## Platform Support

### Mobile (iOS/Android)
- **TTS**: Uses `expo-speech` with native speech synthesis
- **STT**: Uses `@react-native-voice/voice` with native recognition
- **Requirements**: Standalone app build (not compatible with Expo Go)

### Web
- **TTS**: Uses Web Speech API (`speechSynthesis`)
- **STT**: Uses Web Speech API (`SpeechRecognition`)
- **Browser Support**: Modern browsers with speech API support

## Limitations

### Current Limitations
1. **Expo Go**: Voice features require standalone app build
2. **Browser Support**: Web speech APIs have varying support
3. **Audio Storage**: No persistent audio file storage
4. **Custom Voices**: Limited to system/default voices

### Future Enhancements
1. **Audio File Storage**: Save and replay voice messages
2. **Custom Voice Selection**: Allow users to choose TTS voices
3. **Voice Cloning**: Implement custom voice synthesis
4. **Offline Support**: Cache audio for offline playback

## Troubleshooting

### Common Issues

#### TTS Not Working
- **Check**: Device/browser speech synthesis support
- **Solution**: Use standalone app build for mobile
- **Fallback**: Feature gracefully degrades to text-only

#### STT Not Working
- **Check**: Microphone permissions
- **Solution**: Grant audio recording permissions
- **Fallback**: Manual text input remains available

#### Audio Not Playing
- **Check**: Device volume and audio settings
- **Solution**: Ensure device is not in silent mode
- **Debug**: Check browser console for audio errors

### Debug Information
- Voice mode status displayed in header
- TTS availability checked on component mount
- Error messages logged to console
- Demo component provides feature testing

## API Considerations

### Backend Changes
- **No Changes Required**: Voice chat works with existing text-based API
- **Future**: Could add voice metadata for enhanced features
- **Compatibility**: Fully backward compatible

### Frontend Changes
- **Minimal Impact**: Voice features are additive
- **Performance**: TTS adds minimal overhead
- **Memory**: Audio components use standard React patterns

## Testing

### Manual Testing
1. **Voice Mode Toggle**: Test enable/disable functionality
2. **Speech Recognition**: Test microphone input
3. **Text-to-Speech**: Test AI response playback
4. **Audio Controls**: Test play/pause functionality
5. **Language Support**: Test with different languages

### Automated Testing
- Component rendering tests
- Hook functionality tests
- Error handling tests
- Cross-platform compatibility tests

## Security Considerations

### Privacy
- **Audio Data**: Not stored or transmitted to backend
- **Speech Recognition**: Handled locally on device
- **Text Conversion**: Only text is sent to AI model

### Permissions
- **Microphone**: Required for speech-to-text
- **Audio Playback**: Required for text-to-speech
- **Platform**: Handled by React Native/Expo

## Performance Impact

### Memory Usage
- **Minimal**: Audio components are lightweight
- **Cleanup**: Proper component unmounting
- **Caching**: No persistent audio storage

### CPU Usage
- **TTS**: Moderate during speech synthesis
- **STT**: Moderate during speech recognition
- **UI**: Minimal impact on rendering

### Battery Impact
- **TTS**: Moderate during playback
- **STT**: Moderate during recording
- **Optimization**: Automatic cleanup and efficient rendering
