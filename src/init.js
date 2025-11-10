/**
 * Native module initialization for React Native 0.76+
 * This file ensures proper loading of TurboModules and PlatformConstants
 */

import { NativeModules } from 'react-native';

// Safe native module checking with proper error handling
const safeCheckNativeModule = (moduleName, callback) => {
  try {
    const module = NativeModules[moduleName];
    if (module && callback) {
      callback(module);
    }
    return !!module;
  } catch (error) {
    if (__DEV__) {
      console.warn(`Error accessing ${moduleName}:`, error);
    }
    return false;
  }
};

// Ensure PlatformConstants is available
if (__DEV__) {
  console.log('Initializing native modules...');
  
  // Check if PlatformConstants is available
  safeCheckNativeModule('PlatformConstants', (PlatformConstants) => {
    console.log('PlatformConstants loaded successfully');
  });
  
  // Try to initialize native modules using our custom module
  safeCheckNativeModule('NativeModuleInitializer', (NativeModuleInitializer) => {
    if (NativeModuleInitializer.initializeNativeModules) {
      NativeModuleInitializer.initializeNativeModules()
        .then((result) => {
          console.log('Native modules initialization result:', result);
        })
        .catch((error) => {
          console.warn('Native modules initialization failed:', error);
        });
    }
  });
}

// Export a function to check native module availability
export const checkNativeModules = () => {
  const modules = {
    PlatformConstants: safeCheckNativeModule('PlatformConstants'),
    StatusBarManager: safeCheckNativeModule('StatusBarManager'),
    DevSettings: safeCheckNativeModule('DevSettings'),
    NativeModuleInitializer: safeCheckNativeModule('NativeModuleInitializer'),
  };
  
  if (__DEV__) {
    console.log('Native modules status:', modules);
  }
  
  return modules;
};

export default {
  checkNativeModules,
};
