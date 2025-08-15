import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

export const clearWebStorage = async () => {
  if (isWeb) {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear any cookies if needed
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      console.log('✅ Web storage cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing web storage:', error);
    }
  }
};

export const handleWebLogout = async () => {
  if (isWeb) {
    try {
      // Clear all web storage
      await clearWebStorage();
      
      // Force page reload to ensure clean state (optional)
      // window.location.reload();
      
      console.log('✅ Web logout completed');
    } catch (error) {
      console.error('❌ Web logout error:', error);
    }
  }
};

export const getWebUserAgent = () => {
  if (isWeb && typeof window !== 'undefined') {
    return window.navigator.userAgent;
  }
  return null;
};

export const isWebMobile = () => {
  if (isWeb && typeof window !== 'undefined') {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    );
  }
  return false;
}; 