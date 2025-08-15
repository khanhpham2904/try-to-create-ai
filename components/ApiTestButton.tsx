import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { apiService } from '../services/api';
import { Platform } from 'react-native';

export const ApiTestButton: React.FC = () => {
  const { theme } = useTheme();
  const [isTesting, setIsTesting] = useState(false);

  const testApiConnection = async () => {
    setIsTesting(true);
    try {
      console.log('🧪 [Android] Starting API connection test...');
      
      // Test basic connection
      const result = await apiService.testConnection();
      
      if (result.workingUrl) {
        Alert.alert(
          '✅ API Test Successful',
          `Working URL: ${result.workingUrl}\nPlatform: ${Platform.OS}`,
          [{ text: 'OK' }]
        );
        console.log('✅ [Android] API test successful:', result.workingUrl);
      } else {
        Alert.alert(
          '❌ API Test Failed',
          `Error: ${result.error}\nPlatform: ${Platform.OS}`,
          [{ text: 'OK' }]
        );
        console.log('❌ [Android] API test failed:', result.error);
      }
    } catch (error) {
      Alert.alert(
        '❌ API Test Error',
        `Unexpected error: ${error}\nPlatform: ${Platform.OS}`,
        [{ text: 'OK' }]
      );
      console.error('❌ [Android] API test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button, 
          { 
            backgroundColor: theme.colors.primary,
            opacity: isTesting ? 0.7 : 1,
          }
        ]}
        onPress={testApiConnection}
        disabled={isTesting}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.buttonText, { color: theme.colors.userMessageText }]}>
          {isTesting ? '🧪 Testing...' : '🧪 Test API'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 120 : 100, // Higher position for Android
    right: 20,
    zIndex: 9999, // Very high z-index to stay on top
    elevation: Platform.OS === 'android' ? 10 : 0, // High elevation for Android
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 80, // Ensure minimum touch target
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
