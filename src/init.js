/**
 * Native module initialization for React Native 0.76+
 * This file ensures proper loading of TurboModules and PlatformConstants
 */

import { NativeModules } from 'react-native';

// Ensure PlatformConstants is available
if (__DEV__) {
  console.log('Initializing native modules...');
  
  // Check if PlatformConstants is available
  try {
    const PlatformConstants = NativeModules.PlatformConstants;
    if (PlatformConstants) {
      console.log('PlatformConstants loaded successfully');
    } else {
      console.warn('PlatformConstants not found, this may cause issues');
    }
  } catch (error) {
    console.warn('Error accessing PlatformConstants:', error);
  }
  
  // Try to initialize native modules using our custom module
  try {
    const NativeModuleInitializer = NativeModules.NativeModuleInitializer;
    if (NativeModuleInitializer) {
      NativeModuleInitializer.initializeNativeModules()
        .then((result) => {
          console.log('Native modules initialization result:', result);
        })
        .catch((error) => {
          console.warn('Native modules initialization failed:', error);
        });
    }
  } catch (error) {
    console.warn('Error accessing NativeModuleInitializer:', error);
  }
}

// Export a function to check native module availability
export const checkNativeModules = () => {
  const modules = {
    PlatformConstants: !!NativeModules.PlatformConstants,
    StatusBarManager: !!NativeModules.StatusBarManager,
    DevSettings: !!NativeModules.DevSettings,
    NativeModuleInitializer: !!NativeModules.NativeModuleInitializer,
  };
  
  if (__DEV__) {
    console.log('Native modules status:', modules);
  }
  
  return modules;
};

export default {
  checkNativeModules,
};
