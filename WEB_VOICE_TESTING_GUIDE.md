# Web Voice Testing Guide

## 🚨 **Important: Voice Features on Web**

Voice chat features have **limited support** on web browsers due to browser security restrictions and API limitations.

## ✅ **What Works on Web**

### **Text-to-Speech (TTS)**
- **Supported Browsers**: Chrome, Firefox, Safari, Edge
- **Requirements**: 
  - HTTPS connection (except localhost)
  - User interaction required (button click)
- **Implementation**: Uses Web Speech API (`speechSynthesis`)

### **Speech-to-Text (STT)**
- **Supported Browsers**: Chrome, Firefox, Safari, Edge
- **Requirements**:
  - HTTPS connection (except localhost)
  - Microphone permission
  - User interaction required
- **Implementation**: Uses Web Speech API (`SpeechRecognition`)

## ❌ **What Doesn't Work on Web**

### **Expo Go Web**
- Native modules (`expo-speech`, `@react-native-voice/voice`) don't work in web
- Only Web Speech API is available

### **Browser Limitations**
- **Chrome**: Requires HTTPS, may have voice quality issues
- **Firefox**: Limited voice support, may not work consistently
- **Safari**: Requires HTTPS, limited language support
- **Edge**: Similar to Chrome, requires HTTPS

## 🔧 **Testing Voice Features on Web**

### **Step 1: Enable HTTPS**
```bash
# For local development with HTTPS
npx expo start --web --https
```

### **Step 2: Check Browser Support**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for voice API availability messages:
   - ✅ `Web Speech Synthesis API is available`
   - ✅ `Web Speech API is available`

### **Step 3: Test Voice Features**
1. **Long press** the microphone icon in header
2. This opens the **Web Voice Diagnostic** tool
3. Test both TTS and STT functionality
4. Check for any error messages

### **Step 4: Grant Permissions**
- **Microphone**: Allow when prompted for STT
- **Audio**: Allow when prompted for TTS
- **HTTPS**: Ensure secure connection

## 🐛 **Troubleshooting Web Voice Issues**

### **Common Problems**

#### **1. "Feature Not Available" Alert**
- **Cause**: Browser doesn't support Web Speech API
- **Solution**: Use Chrome, Firefox, or Edge
- **Check**: Browser developer tools console

#### **2. TTS Not Working**
- **Cause**: Browser security restrictions
- **Solution**: 
  - Ensure HTTPS connection
  - Check browser console for errors
  - Try different browser

#### **3. STT Not Working**
- **Cause**: Microphone permission denied
- **Solution**:
  - Grant microphone permission
  - Check browser settings
  - Ensure HTTPS connection

#### **4. "Speech synthesis error"**
- **Cause**: Browser voice engine issues
- **Solution**:
  - Try different browser
  - Check browser voice settings
  - Restart browser

### **Debug Information**

#### **Check Browser Console**
```javascript
// Check TTS support
console.log('TTS Support:', 'speechSynthesis' in window);

// Check STT support
console.log('STT Support:', 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

// Check HTTPS
console.log('HTTPS:', window.location.protocol === 'https:');
```

#### **Test Web Speech API Directly**
```javascript
// Test TTS
const utterance = new SpeechSynthesisUtterance('Hello world');
speechSynthesis.speak(utterance);

// Test STT
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => console.log(event.results[0][0].transcript);
recognition.start();
```

## 📱 **Mobile vs Web Comparison**

| Feature | Mobile (APK) | Web Browser |
|---------|-------------|-------------|
| **TTS** | ✅ Full support | ⚠️ Limited support |
| **STT** | ✅ Full support | ⚠️ Limited support |
| **Audio Quality** | ✅ High quality | ⚠️ Varies by browser |
| **Language Support** | ✅ Multiple languages | ⚠️ Limited languages |
| **Offline Support** | ✅ Works offline | ❌ Requires internet |
| **Custom Voices** | ✅ System voices | ⚠️ Browser voices only |

## 🎯 **Best Practices for Web Testing**

### **1. Use Supported Browsers**
- **Chrome**: Best overall support
- **Firefox**: Good support, may have issues
- **Safari**: Limited support, requires HTTPS
- **Edge**: Similar to Chrome

### **2. Test on HTTPS**
- **Localhost**: Works without HTTPS
- **Production**: Requires HTTPS
- **Development**: Use `npx expo start --web --https`

### **3. Grant Permissions**
- **Microphone**: Required for STT
- **Audio**: Required for TTS
- **Notifications**: May be required for some browsers

### **4. Check Console Logs**
- **Errors**: Look for speech API errors
- **Warnings**: Check for permission warnings
- **Debug**: Use diagnostic tool for detailed info

## 🔄 **Fallback Behavior**

### **When Voice Features Don't Work**
1. **Visual Indicator**: Red microphone icon shows unavailable
2. **Alert Message**: Explains why feature is not available
3. **Diagnostic Tool**: Long press opens detailed diagnostics
4. **Graceful Degradation**: App continues to work with text-only

### **User Experience**
- **Clear Feedback**: Users know why voice doesn't work
- **Alternative Options**: Text input remains available
- **Helpful Guidance**: Diagnostic tool provides solutions

## 📋 **Testing Checklist**

### **Before Testing**
- [ ] Use supported browser (Chrome/Firefox/Edge)
- [ ] Enable HTTPS (except localhost)
- [ ] Check browser console for errors
- [ ] Ensure microphone permission

### **During Testing**
- [ ] Test TTS with different texts
- [ ] Test STT with different languages
- [ ] Check audio quality
- [ ] Verify error handling
- [ ] Test fallback behavior

### **After Testing**
- [ ] Document any issues found
- [ ] Note browser-specific problems
- [ ] Check console for errors
- [ ] Verify graceful degradation

## 🚀 **Production Considerations**

### **Web Deployment**
- **HTTPS Required**: Voice features need secure connection
- **Browser Support**: Test on multiple browsers
- **Fallback UI**: Ensure text-only mode works
- **Error Handling**: Provide clear user feedback

### **User Education**
- **Feature Limitations**: Explain web vs mobile differences
- **Browser Requirements**: Guide users to supported browsers
- **Permission Requests**: Explain why permissions are needed
- **Troubleshooting**: Provide self-help resources

## 💡 **Tips for Developers**

### **Code Considerations**
```typescript
// Check platform before using voice features
if (Platform.OS === 'web') {
  // Use Web Speech API
  if ('speechSynthesis' in window) {
    // TTS available
  }
} else {
  // Use native modules
  // expo-speech, @react-native-voice/voice
}
```

### **Error Handling**
```typescript
// Always provide fallbacks
try {
  await speak(text);
} catch (error) {
  console.error('TTS failed:', error);
  // Show text instead
  showTextMessage(text);
}
```

### **User Feedback**
```typescript
// Clear status indicators
const voiceStatus = isAvailable ? 'available' : 'unavailable';
const iconColor = isAvailable ? 'green' : 'red';
```

## 📞 **Support**

If you encounter issues with web voice features:

1. **Check Browser**: Use Chrome for best support
2. **Check HTTPS**: Ensure secure connection
3. **Check Permissions**: Grant microphone/audio access
4. **Check Console**: Look for error messages
5. **Use Diagnostic**: Long press microphone icon
6. **Try Mobile**: Use APK for full functionality

Remember: **Web voice features are supplementary**. For the best experience, use the mobile APK version.
