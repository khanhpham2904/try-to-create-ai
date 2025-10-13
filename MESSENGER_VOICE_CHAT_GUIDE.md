# Messenger-Style Voice Chat Implementation

## 🎤 **Overview**

This implementation provides a Messenger-style voice chat experience where:
1. **UI**: Messages display as audio players with waveforms (like Messenger)
2. **Recording**: Users record audio messages
3. **Processing**: Audio is sent to backend for speech-to-text conversion
4. **AI Response**: Backend processes text and returns AI response
5. **TTS**: AI response is played as audio to the user

## 🎯 **Key Features**

### **Voice Message UI**
- **Waveform Visualization**: Animated bars showing audio content
- **Play/Pause Controls**: Interactive audio player
- **Progress Bar**: Shows playback progress
- **Duration Display**: Shows current time and total duration
- **Messenger-like Design**: Clean, modern interface

### **Voice Recording**
- **Hold-to-Record**: Tap and hold to record (like Messenger)
- **Visual Feedback**: Real-time waveform during recording
- **Duration Limit**: Maximum 60 seconds per message
- **Cancel/Send**: Options to cancel or send recording

### **Backend Processing**
- **Speech-to-Text**: Converts audio to text using Google Speech Recognition
- **AI Processing**: Sends transcribed text to AI model
- **Response Generation**: AI generates contextual response
- **Audio Storage**: Stores audio files for playback

### **Text-to-Speech**
- **Automatic Playback**: AI responses play automatically in voice mode
- **Language Support**: English and Vietnamese
- **Cross-Platform**: Works on web and mobile

## 🏗️ **Architecture**

### **Frontend Components**

#### `VoiceMessage.tsx`
- Displays voice messages as audio players
- Features waveform visualization and playback controls
- Handles play/pause and progress tracking
- Supports both user and AI messages

#### `VoiceRecorder.tsx`
- Full-screen voice recording interface
- Real-time waveform visualization
- Hold-to-record functionality
- Cancel/send options

#### `ChatMessageBubble.tsx` (Updated)
- Detects voice messages using `[VOICE_MESSAGE:uri:duration]` format
- Renders `VoiceMessage` component for voice messages
- Falls back to text messages for regular content

### **Backend API**

#### `voice.py` Endpoint
- **POST `/api/v1/voice/process`**: Process voice message
- **POST `/api/v1/voice/upload`**: Upload voice file
- **GET `/api/v1/voice/health`**: Health check

#### **Processing Flow**
1. Receive base64 encoded audio data
2. Convert audio to text using SpeechRecognition
3. Send transcribed text to AI model
4. Return AI response with message metadata

### **Data Flow**

```
User Records Audio → VoiceRecorder → Base64 Encoding → Backend API
                                                           ↓
Backend: Audio → Speech-to-Text → AI Processing → Response
                                                           ↓
Frontend: Response → Text-to-Speech → Audio Playback
```

## 🔧 **Implementation Details**

### **Voice Message Format**
```typescript
// Voice message format in chat
message: "[VOICE_MESSAGE:audioUri:duration]"

// Example
message: "[VOICE_MESSAGE:file:///path/to/audio.m4a:15]"
```

### **Audio Recording**

#### **Web (Browser)**
```typescript
// Uses MediaRecorder API
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream);
// Records as WebM format
```

#### **Mobile (React Native)**
```typescript
// Uses expo-av
const recording = new Audio.Recording();
await recording.prepareToRecordAsync({
  android: { extension: '.m4a' },
  ios: { extension: '.m4a' }
});
// Records as M4A format
```

### **Backend Processing**

#### **Speech-to-Text**
```python
import speech_recognition as sr

def audio_to_text(audio_data: bytes, audio_format: str = "wav") -> str:
    recognizer = sr.Recognizer()
    # Convert bytes to audio file
    # Use Google Speech Recognition
    text = recognizer.recognize_google(audio, language='en-US')
    return text
```

#### **API Integration**
```python
@router.post("/process")
async def process_voice_message(request: VoiceMessageRequest, db: Session):
    # Decode base64 audio
    audio_data = base64.b64decode(request.audio_data)
    
    # Convert to text
    transcribed_text = audio_to_text(audio_data, request.audio_format)
    
    # Get AI response
    ai_response = generate_ai_response(transcribed_text)
    
    # Save to database
    chat_message = models.ChatMessage(...)
    
    return VoiceMessageResponse(...)
```

## 📱 **User Experience**

### **Voice Mode Toggle**
1. **Enable**: Tap microphone icon in header (turns golden)
2. **Visual**: Placeholder changes to "Tap mic to record voice message..."
3. **Disable**: Tap microphone icon again

### **Recording Process**
1. **Start**: Tap microphone button in input area
2. **Record**: Hold and speak (up to 60 seconds)
3. **Visual**: Real-time waveform animation
4. **Stop**: Release button or tap stop
5. **Send**: Tap send button to process

### **Message Display**
1. **User Message**: Shows as audio player with waveform
2. **Processing**: "AI is processing voice message..." indicator
3. **AI Response**: Text message with automatic TTS playback
4. **Playback**: Tap play button to hear voice message

## 🎨 **UI Components**

### **Voice Message Player**
```typescript
<VoiceMessage
  audioUri={audioUri}
  duration={duration}
  isUser={isUser}
  timestamp={timestamp}
  isPlaying={isPlaying}
  onPlay={handlePlay}
  onPause={handlePause}
/>
```

### **Voice Recorder**
```typescript
<VoiceRecorder
  onRecordingComplete={handleComplete}
  onCancel={handleCancel}
  maxDuration={60}
/>
```

### **Waveform Visualization**
- **Recording**: Animated bars with random heights
- **Playback**: Bars highlight based on progress
- **Colors**: User messages (white), AI messages (primary color)

## 🔧 **Configuration**

### **Audio Settings**
```typescript
// Recording configuration
const recordingOptions = {
  android: {
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};
```

### **Backend Dependencies**
```txt
SpeechRecognition==3.10.0
pyaudio==0.2.11
```

## 🚀 **Deployment**

### **Frontend**
- **Web**: Requires HTTPS for MediaRecorder API
- **Mobile**: Requires standalone app build (not Expo Go)
- **Permissions**: Microphone access required

### **Backend**
- **Python**: Install speech recognition dependencies
- **Audio Processing**: Requires audio file handling
- **Storage**: Consider audio file storage solution

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Recording Not Working**
- **Check Permissions**: Ensure microphone access granted
- **Check Browser**: Use Chrome/Firefox for web
- **Check HTTPS**: Required for web recording
- **Check Build**: Use standalone app for mobile

#### **Speech Recognition Failing**
- **Check Audio Quality**: Ensure clear recording
- **Check Language**: Verify language settings
- **Check Network**: Requires internet connection
- **Check Backend**: Verify speech recognition service

#### **TTS Not Playing**
- **Check Volume**: Ensure device volume up
- **Check Permissions**: Audio playback permissions
- **Check Browser**: Web audio API support
- **Check Language**: TTS language support

### **Debug Information**
```typescript
// Check recording status
console.log('Recording:', isRecording);
console.log('Audio URI:', audioUri);
console.log('Duration:', duration);

// Check backend response
console.log('Voice API Response:', response);
console.log('Transcribed Text:', transcribedText);
console.log('AI Response:', aiResponse);
```

## 📋 **Testing Checklist**

### **Voice Recording**
- [ ] Test recording start/stop
- [ ] Test waveform visualization
- [ ] Test duration limit (60 seconds)
- [ ] Test cancel/send functionality
- [ ] Test audio quality

### **Backend Processing**
- [ ] Test speech-to-text conversion
- [ ] Test AI response generation
- [ ] Test error handling
- [ ] Test audio format support
- [ ] Test language detection

### **UI/UX**
- [ ] Test voice message display
- [ ] Test playback controls
- [ ] Test progress tracking
- [ ] Test TTS playback
- [ ] Test cross-platform compatibility

### **Integration**
- [ ] Test end-to-end flow
- [ ] Test error scenarios
- [ ] Test performance
- [ ] Test scalability
- [ ] Test user experience

## 💡 **Future Enhancements**

### **Planned Features**
1. **Voice Cloning**: Custom voice synthesis
2. **Audio Effects**: Noise reduction, echo cancellation
3. **Offline Support**: Local speech recognition
4. **Multi-language**: Support for more languages
5. **Voice Commands**: Voice-controlled interface

### **Technical Improvements**
1. **Audio Compression**: Optimize file sizes
2. **Streaming**: Real-time audio processing
3. **Caching**: Audio file caching
4. **Analytics**: Voice message analytics
5. **Security**: Audio encryption

## 📞 **Support**

For issues with Messenger-style voice chat:

1. **Check Permissions**: Microphone and audio access
2. **Check Browser**: Use supported browsers
3. **Check Network**: Internet connection required
4. **Check Backend**: Voice processing service status
5. **Check Logs**: Console and server logs
6. **Test Components**: Individual component testing

This implementation provides a complete Messenger-style voice chat experience with proper audio recording, processing, and playback functionality.
