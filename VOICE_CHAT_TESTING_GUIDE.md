# Voice Chat Testing Guide

## 🎤 **Voice Chat Mode Testing**

### **How to Test Voice Chat**

1. **Enable Voice Mode**: Tap the microphone icon in the header
2. **Start Recording**: Tap the microphone button in the input area
3. **Speak**: Say your message clearly
4. **Auto-Send**: Message is automatically sent in voice mode
5. **Listen**: AI response plays automatically

### **Visual Indicators**

#### **Header Microphone Icon**
- **White**: Voice mode disabled
- **Golden**: Voice mode enabled
- **Red**: Currently listening
- **Red with slash**: Not available (web)

#### **Input Area**
- **Placeholder**: Changes to "Tap mic to speak..." in voice mode
- **Microphone Button**: 
  - Green: Ready to record
  - Red: Currently listening
- **Listening State**: Shows "Listening..." placeholder

## 🔧 **Testing Steps**

### **Step 1: Enable Voice Mode**
1. Look for microphone icon in header
2. Tap to enable voice mode
3. Icon should turn golden
4. Placeholder should change to "Tap mic to speak..."

### **Step 2: Test Speech Recognition**
1. Tap the microphone button in input area
2. Button should turn red
3. Placeholder should show "Listening..."
4. Speak clearly into microphone
5. Wait for recognition to complete

### **Step 3: Verify Auto-Send**
1. In voice mode, recognized text is auto-sent
2. Message should appear in chat
3. AI should respond automatically
4. Response should play as audio

### **Step 4: Test Text-to-Speech**
1. AI response should play automatically
2. Audio should be clear and understandable
3. Language should match app setting

## 🐛 **Troubleshooting**

### **Microphone Button Not Working**

#### **Check Browser Console**
```javascript
// Look for these messages:
✅ "Web Speech API is available"
✅ "Started web speech recognition"
❌ "Speech recognition error"
❌ "Web Speech API not supported"
```

#### **Common Issues**
1. **No HTTPS**: Web Speech API requires HTTPS (except localhost)
2. **No Permission**: Grant microphone permission when prompted
3. **Browser Support**: Use Chrome, Firefox, or Edge
4. **No User Interaction**: Must click button to start recognition

### **Speech Recognition Not Working**

#### **Check Permissions**
1. Look for microphone permission prompt
2. Click "Allow" when prompted
3. Check browser settings if needed

#### **Check Browser Support**
1. Open browser developer tools
2. Go to Console tab
3. Look for speech API availability messages

#### **Test Direct API**
```javascript
// Test in browser console
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => console.log(event.results[0][0].transcript);
recognition.start();
```

### **Text-to-Speech Not Working**

#### **Check Browser Support**
```javascript
// Test in browser console
const utterance = new SpeechSynthesisUtterance('Hello world');
speechSynthesis.speak(utterance);
```

#### **Common Issues**
1. **Browser Muted**: Check browser audio settings
2. **System Volume**: Ensure system volume is up
3. **Browser Support**: Some browsers have limited TTS support

## 📱 **Platform-Specific Testing**

### **Web Browser Testing**
- **Chrome**: Best support, requires HTTPS
- **Firefox**: Good support, may have issues
- **Safari**: Limited support, requires HTTPS
- **Edge**: Similar to Chrome

### **Mobile APK Testing**
- **Android**: Full support with expo-speech
- **iOS**: Full support with expo-speech
- **Requirements**: Standalone app build (not Expo Go)

## 🔍 **Debug Information**

### **Console Messages to Look For**
```
✅ Web Speech API is available
✅ Started web speech recognition with language: en-US
✅ Speech recognized: Hello world
✅ Started web speech synthesis with language: en-US
❌ Speech recognition error: not-allowed
❌ Web Speech API not supported in this browser
```

### **Network Requirements**
- **HTTPS**: Required for production
- **Localhost**: Works without HTTPS
- **Microphone**: Required for STT
- **Audio**: Required for TTS

## 🎯 **Test Scenarios**

### **Scenario 1: Basic Voice Chat**
1. Enable voice mode
2. Tap microphone button
3. Say "Hello, how are you?"
4. Verify message is sent
5. Verify AI responds with audio

### **Scenario 2: Language Testing**
1. Change app language to Vietnamese
2. Enable voice mode
3. Speak in Vietnamese
4. Verify recognition works
5. Verify TTS uses Vietnamese

### **Scenario 3: Error Handling**
1. Try without microphone permission
2. Verify error message appears
3. Grant permission and retry
4. Verify functionality works

### **Scenario 4: Web Limitations**
1. Test on unsupported browser
2. Verify graceful degradation
3. Check diagnostic tool
4. Verify fallback to text mode

## 📋 **Testing Checklist**

### **Before Testing**
- [ ] Use supported browser (Chrome recommended)
- [ ] Enable HTTPS (except localhost)
- [ ] Check microphone permissions
- [ ] Ensure system volume is up

### **During Testing**
- [ ] Test voice mode toggle
- [ ] Test speech recognition
- [ ] Test text-to-speech
- [ ] Test auto-send functionality
- [ ] Test error handling
- [ ] Test language switching

### **After Testing**
- [ ] Document any issues found
- [ ] Check console for errors
- [ ] Verify graceful degradation
- [ ] Test on multiple browsers

## 🚀 **Production Testing**

### **Web Deployment**
- [ ] Test on HTTPS domain
- [ ] Test on multiple browsers
- [ ] Test microphone permissions
- [ ] Test audio playback
- [ ] Test error handling

### **Mobile Deployment**
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Test with different languages
- [ ] Test with poor network
- [ ] Test with background apps

## 💡 **Tips for Testing**

### **Best Practices**
1. **Use Clear Speech**: Speak clearly and at normal pace
2. **Test Different Languages**: Try English and Vietnamese
3. **Test Error Cases**: Try without permissions
4. **Test Network Issues**: Try with poor connection
5. **Test Multiple Browsers**: Verify cross-browser compatibility

### **Common Test Phrases**
- **English**: "Hello, how are you today?"
- **Vietnamese**: "Xin chào, bạn khỏe không?"
- **Numbers**: "One two three four five"
- **Punctuation**: "Hello, world! How are you?"

### **Debug Tools**
1. **Browser Console**: Check for errors
2. **Diagnostic Tool**: Long press microphone icon
3. **Network Tab**: Check for failed requests
4. **Permissions**: Check microphone access

## 📞 **Support**

If you encounter issues:

1. **Check Console**: Look for error messages
2. **Use Diagnostic**: Long press microphone icon
3. **Check Permissions**: Ensure microphone access
4. **Try Different Browser**: Use Chrome for best support
5. **Check HTTPS**: Ensure secure connection
6. **Test Mobile**: Use APK for full functionality

Remember: **Web voice features are supplementary**. For the best experience, use the mobile APK version.
