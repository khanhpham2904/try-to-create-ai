import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

interface SpeechDiagnosticProps {
  onClose: () => void;
}

export const SpeechDiagnostic: React.FC<SpeechDiagnosticProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  useEffect(() => {
    const runDiagnostics = () => {
      const results: string[] = [];
      
      // Check platform
      results.push(`Platform: ${Platform.OS} ${Platform.Version}`);
      
      // Check if running in Expo Go
      try {
        const { Constants } = require('expo-constants');
        if (Constants.appOwnership === 'expo') {
          results.push('⚠️ Running in Expo Go - Speech recognition may not work');
        } else {
          results.push('✅ Running in standalone app');
        }
      } catch (e) {
        results.push('❓ Cannot determine app ownership');
      }
      
      // Check if running in simulator
      if (Platform.OS === 'ios' && Platform.isPad) {
        results.push('⚠️ Running on iPad simulator - Speech recognition may not work');
      } else if (Platform.OS === 'android' && Platform.Version) {
        results.push('✅ Running on Android device/emulator');
      }
      
      // Check Voice module availability
      try {
        const Voice = require('@react-native-voice/voice').default;
        if (Voice) {
          results.push('✅ Voice module loaded successfully');
          
          // Test if methods exist
          if (typeof Voice.start === 'function') {
            results.push('✅ Voice.start method available');
          } else {
            results.push('❌ Voice.start method not available');
          }
          
          if (typeof Voice.isAvailable === 'function') {
            results.push('✅ Voice.isAvailable method available');
          } else {
            results.push('❌ Voice.isAvailable method not available');
          }
        } else {
          results.push('❌ Voice module not loaded');
        }
      } catch (e) {
        results.push(`❌ Voice module error: ${(e as Error).message}`);
      }
      
      setDiagnostics(results);
    };
    
    runDiagnostics();
  }, []);

  const testSpeechRecognition = async () => {
    Alert.alert(
      'Speech Recognition Test',
      'Speech recognition is not available in Expo Go. The Voice module returns null because native modules are not supported in the Expo Go environment.\n\nTo test speech recognition:\n1. Build a standalone app with "eas build"\n2. Install the standalone app on your device\n3. Speech recognition will work in the standalone app',
      [{ text: 'OK' }]
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const { PermissionsAndroid } = require('react-native');
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for speech recognition.',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Success', 'Microphone permission granted!');
        } else {
          Alert.alert('Permission Denied', 'Microphone permission was denied.');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to request microphone permission');
      }
    } else {
      Alert.alert('iOS', 'iOS permissions are handled automatically. Check Settings > Privacy > Microphone.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {language === 'vi' ? 'Chẩn Đoán Nhận Dạng Giọng Nói' : 'Speech Recognition Diagnostic'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {language === 'vi' ? 'Thông Tin Hệ Thống' : 'System Information'}
        </Text>
        
        {diagnostics.map((diagnostic, index) => (
          <Text key={index} style={[styles.diagnostic, { color: theme.colors.text }]}>
            {diagnostic}
          </Text>
        ))}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={testSpeechRecognition}
          >
            <Icon name="mic" size={20} color={theme.colors.surface} />
            <Text style={[styles.buttonText, { color: theme.colors.surface }]}>
              {language === 'vi' ? 'Thử Nhận Dạng Giọng Nói' : 'Test Speech Recognition'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primaryLight }]}
            onPress={requestPermissions}
          >
            <Icon name="security" size={20} color={theme.colors.surface} />
            <Text style={[styles.buttonText, { color: theme.colors.surface }]}>
              {language === 'vi' ? 'Yêu Cầu Quyền Microphone' : 'Request Microphone Permission'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoContainer, { backgroundColor: theme.colors.primary + '10' }]}>
          <Icon name="info" size={20} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            {language === 'vi' 
              ? 'Để nhận dạng giọng nói hoạt động, bạn cần sử dụng thiết bị thật (không phải simulator) và ứng dụng standalone (không phải Expo Go).'
              : 'For speech recognition to work, you need a real device (not simulator) and a standalone app (not Expo Go).'
            }
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  diagnostic: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 30,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    marginTop: 20,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
