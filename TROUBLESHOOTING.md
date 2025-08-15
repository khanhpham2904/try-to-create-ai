# Network Connectivity Troubleshooting Guide

## Issue: "TypeError: Network request failed"

This error occurs when your React Native app cannot connect to the backend server.

## ✅ **Solution Applied**

I've updated your API configuration to use your computer's IP address (`192.168.1.10`) instead of localhost (`127.0.0.1`).

### **What Changed:**
- **Before**: `http://127.0.0.1:8000` (only works on same machine)
- **After**: `192.168.1.10:8000` (works from mobile devices)

## 🔧 **Testing Steps**

### 1. **Verify Backend is Running**
```bash
cd "BE ChatApp"
python start.py
```
You should see: "🚀 Starting Chat App Backend..."

### 2. **Test Backend Locally**
```bash
cd "BE ChatApp"
python test_api.py
```
Should show: "✅ Registration successful!"

### 3. **Test from React Native**
Add the `ConnectionTest` component to your app temporarily:

```tsx
import { ConnectionTest } from './components/ConnectionTest';

// Add this to your screen
<ConnectionTest />
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Network request failed"**
**Cause**: Mobile device can't reach your computer
**Solutions**:
1. Make sure both devices are on the same WiFi network
2. Check your computer's firewall settings
3. Verify the IP address is correct

### **Issue 2: "Connection refused"**
**Cause**: Backend not running or wrong port
**Solutions**:
1. Start the backend: `python start.py`
2. Check if port 8000 is available: `netstat -ano | findstr :8000`

### **Issue 3: "CORS error"**
**Cause**: Browser security policy
**Solutions**:
1. Backend already has CORS configured with `"*"`
2. This shouldn't affect React Native apps

## 📱 **Device-Specific Notes**

### **Android Emulator**
- Use `10.0.2.2:8000` instead of your IP address
- This is the special IP that Android emulator uses to reach host machine

### **iOS Simulator**
- Use `localhost:8000` or `127.0.0.1:8000`
- iOS simulator runs on the same machine as your development environment

### **Physical Device**
- Use your computer's actual IP address: `192.168.1.10:8000`
- Both devices must be on the same WiFi network

## 🔍 **Debugging Tools**

### **1. Check Your IP Address**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

### **2. Test Network Connectivity**
```bash
# From your computer
ping 192.168.1.10

# From mobile device (if possible)
ping 192.168.1.10
```

### **3. Check Backend Logs**
Look for connection attempts in the backend console when you try to register.

## 🎯 **Quick Fix Checklist**

- [ ] Backend is running (`python start.py`)
- [ ] Both devices on same WiFi network
- [ ] IP address is correct (`192.168.1.10`)
- [ ] Firewall allows connections on port 8000
- [ ] React Native app is using the updated config

## 📞 **Still Having Issues?**

1. **Check the console logs** in your React Native app
2. **Use the ConnectionTest component** to debug
3. **Verify backend logs** show incoming requests
4. **Try different IP addresses** if your IP changes

## 🔄 **Alternative Solutions**

### **Option 1: Use ngrok (Temporary)**
```bash
# Install ngrok
npm install -g ngrok

# Create tunnel
ngrok http 8000

# Use the ngrok URL in your config
```

### **Option 2: Use Expo Development Server**
If using Expo, you can configure the development server to proxy requests.

---

**Your backend is working perfectly! The issue was just the network configuration.** 🎉 