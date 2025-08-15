# Network Troubleshooting Guide

## 🚨 "Network request failed" Error

This error typically occurs when your React Native app cannot connect to your backend server. Here's how to fix it:

## 🔍 Quick Diagnosis

### 1. **Run the Network Test**
```bash
# In your ChatApp directory
node test_network_connection.js
```

This will test all possible URLs and tell you which ones work.

### 2. **Check Your Backend**
Make sure your FastAPI backend is running:
```bash
# In your backend directory (BE ChatApp)
cd "BE ChatApp"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 🔧 Common Solutions

### **Solution 1: Fix URL Configuration**

The most common issue is missing `http://` protocol. Update your `constants/config.ts`:

```typescript
// ❌ Wrong - missing protocol
return '192.168.1.10:8000';

// ✅ Correct - with protocol
return 'http://192.168.1.10:8000';
```

### **Solution 2: Check Your IP Address**

1. **Find your computer's IP address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Update the IP in `constants/config.ts`:**
   ```typescript
   // Replace with your actual IP address
   return 'http://YOUR_ACTUAL_IP:8000';
   ```

### **Solution 3: Backend Configuration**

Make sure your FastAPI server accepts external connections:

```python
# In your main.py or run.py
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Accept connections from all interfaces
        port=8000,
        reload=True
    )
```

### **Solution 4: Firewall Settings**

**Windows:**
1. Open Windows Defender Firewall
2. Allow Python/uvicorn through the firewall
3. Or temporarily disable firewall for testing

**Mac:**
1. System Preferences → Security & Privacy → Firewall
2. Allow incoming connections for Python

**Linux:**
```bash
# Allow port 8000
sudo ufw allow 8000
```

## 📱 Platform-Specific Issues

### **Android Emulator**
- Use `http://10.0.2.2:8000` to connect to your host machine
- This is the special IP that Android emulator uses for localhost

### **Physical Android Device**
- Make sure device and computer are on the same WiFi network
- Use your computer's LAN IP (e.g., `192.168.1.10:8000`)
- Check that your router allows device-to-device communication

### **iOS Simulator**
- Use `http://localhost:8000` or `http://127.0.0.1:8000`

### **Physical iOS Device**
- Use your computer's LAN IP address
- Make sure both devices are on the same network

## 🧪 Testing Steps

### **Step 1: Test Backend Locally**
```bash
# Test from your computer
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### **Step 2: Test from Network**
```bash
# Test from your computer using LAN IP
curl http://192.168.1.10:8000/health
# Should return: {"status": "healthy"}
```

### **Step 3: Test from Mobile Browser**
1. Open mobile browser
2. Go to `http://192.168.1.10:8000/health`
3. Should see the JSON response

### **Step 4: Test in React Native**
```javascript
// Add this to your app for testing
import { diagnoseNetwork } from './utils/networkTroubleshooter';

// In your component
useEffect(() => {
  const testNetwork = async () => {
    const result = await diagnoseNetwork();
    console.log('Network diagnosis:', result);
  };
  testNetwork();
}, []);
```

## 🔄 Alternative Solutions

### **Solution A: Use ngrok (Temporary)**
```bash
# Install ngrok
npm install -g ngrok

# Create tunnel to your backend
ngrok http 8000

# Use the ngrok URL in your app
# e.g., https://abc123.ngrok.io
```

### **Solution B: Use Expo Tunnel**
```bash
# If using Expo
expo start --tunnel
```

### **Solution C: Use Local Network Discovery**
```bash
# Find all devices on your network
arp -a
```

## 🐛 Debug Information

### **Enable Detailed Logging**
Add this to your app to see detailed network logs:

```typescript
// In your API service
console.log('🔧 ApiService initialized with URL:', baseUrl);
console.log('🌐 Trying URL:', fullUrl);
console.log('✅ Success for:', fullUrl);
console.log('❌ Network error for', url, endpoint, ':', error);
```

### **Check Network Info**
```typescript
import { getNetworkInfo } from './utils/networkTroubleshooter';

const networkInfo = getNetworkInfo();
console.log('Network Info:', networkInfo);
```

## 📋 Checklist

- [ ] Backend server is running (`uvicorn main:app --host 0.0.0.0 --port 8000`)
- [ ] Backend responds to `http://localhost:8000/health`
- [ ] Backend responds to `http://YOUR_IP:8000/health`
- [ ] Mobile device can access `http://YOUR_IP:8000/health` in browser
- [ ] IP address in `config.ts` matches your computer's IP
- [ ] Both devices are on the same WiFi network
- [ ] Firewall allows connections on port 8000
- [ ] URL includes `http://` protocol

## 🆘 Still Having Issues?

### **1. Check Backend Logs**
Look for errors in your backend console when the app tries to connect.

### **2. Check React Native Logs**
```bash
# Android
adb logcat | grep -i network

# iOS
xcrun simctl spawn booted log stream --predicate 'process == "YourApp"'
```

### **3. Test with Postman**
1. Open Postman
2. Try the same URLs your app is trying
3. Compare the results

### **4. Network Configuration**
```typescript
// Try these URLs in order:
const testUrls = [
  'http://192.168.1.10:8000',
  'http://192.168.1.11:8000', 
  'http://10.0.2.2:8000',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
];
```

## 🎯 Quick Fix Summary

1. **Most Common Fix:** Add `http://` to your URLs
2. **Second Most Common:** Update IP address to match your computer
3. **Third Most Common:** Ensure backend runs with `--host 0.0.0.0`
4. **Fourth Most Common:** Check firewall settings

Run the network test script to automatically diagnose the issue:
```bash
node test_network_connection.js
```
