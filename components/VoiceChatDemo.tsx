import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface VoiceChatDemoProps {
  onClose: () => void;
}

export const VoiceChatDemo: React.FC<VoiceChatDemoProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { speak, stop, isSpeaking, isAvailable, error } = useTextToSpeech();
  const [demoText, setDemoText] = useState('');

  const handleDemoSpeak = async () => {
    const text = language === 'vi' 
      ? 'Xin chào! Đây là tính năng chat bằng giọng nói. Tôi có thể nói chuyện với bạn bằng tiếng Việt.'
      : 'Hello! This is the voice chat feature. I can speak with you in English.';
    
    try {
      await speak(text, language === 'vi' ? 'vi-VN' : 'en-US');
    } catch (err) {
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể phát âm thanh' : 'Cannot play audio'
      );
    }
  };

  const handleStop = () => {
    stop();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.type === 'dark' 
          ? ['#8B5CF6', '#7C3AED', '#111827'] as [string, string, ...string[]]
          : ['#667EEA', '#764BA2', '#FFFFFF'] as [string, string, ...string[]]
        }
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {language === 'vi' ? '🎤 Demo Chat Giọng Nói' : '🎤 Voice Chat Demo'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.demoSection}>
          <Icon 
            name="mic" 
            size={64} 
            color={isSpeaking ? theme.colors.success : theme.colors.primary} 
          />
          <Text style={[styles.demoTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Tính Năng Chat Giọng Nói' : 'Voice Chat Feature'}
          </Text>
          <Text style={[styles.demoDescription, { color: theme.colors.textSecondary }]}>
            {language === 'vi' 
              ? 'Khi bật chế độ giọng nói, tin nhắn sẽ hiển thị dưới dạng âm thanh trong UI, nhưng vẫn được gửi dưới dạng văn bản đến AI.'
              : 'When voice mode is enabled, messages will display as audio in the UI, but are still sent as text to the AI.'
            }
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Tính Năng:' : 'Features:'}
          </Text>
          
          <View style={styles.featureItem}>
            <Icon name="mic" size={20} color={theme.colors.primary} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              {language === 'vi' ? 'Nhận dạng giọng nói (Speech-to-Text)' : 'Speech-to-Text Recognition'}
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Icon name="volume-up" size={20} color={theme.colors.success} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              {language === 'vi' ? 'Chuyển văn bản thành giọng nói (Text-to-Speech)' : 'Text-to-Speech Conversion'}
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Icon name="audiotrack" size={20} color={theme.colors.warning} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              {language === 'vi' ? 'Hiển thị tin nhắn dưới dạng âm thanh' : 'Audio Message Display'}
            </Text>
          </View>
        </View>

        <View style={styles.demoControls}>
          <Text style={[styles.controlsTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Thử Nghiệm:' : 'Try It:'}
          </Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.demoButton,
                { 
                  backgroundColor: isSpeaking ? theme.colors.error : theme.colors.primary,
                  opacity: isAvailable ? 1 : 0.5
                }
              ]}
              onPress={isSpeaking ? handleStop : handleDemoSpeak}
              disabled={!isAvailable}
            >
              <Icon 
                name={isSpeaking ? "stop" : "play-arrow"} 
                size={24} 
                color="white" 
              />
              <Text style={styles.buttonText}>
                {isSpeaking 
                  ? (language === 'vi' ? 'Dừng' : 'Stop')
                  : (language === 'vi' ? 'Phát Demo' : 'Play Demo')
                }
              </Text>
            </TouchableOpacity>
          </View>

          {!isAvailable && (
            <Text style={[styles.warningText, { color: theme.colors.error }]}>
              {language === 'vi' 
                ? '⚠️ Text-to-Speech không khả dụng trên thiết bị này'
                : '⚠️ Text-to-Speech is not available on this device'
              }
            </Text>
          )}

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}
        </View>

        <View style={styles.instructionsSection}>
          <Text style={[styles.instructionsTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Cách Sử Dụng:' : 'How to Use:'}
          </Text>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            {language === 'vi' 
              ? '1. Nhấn biểu tượng mic ở header để bật/tắt chế độ giọng nói\n2. Trong chế độ giọng nói, nhấn mic để ghi âm\n3. AI sẽ trả lời bằng giọng nói tự động\n4. Tin nhắn hiển thị dưới dạng âm thanh trong UI'
              : '1. Tap the mic icon in header to enable/disable voice mode\n2. In voice mode, tap mic to record\n3. AI will respond with automatic speech\n4. Messages display as audio in the UI'
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Offset for close button
  },
  content: {
    flex: 1,
    padding: 20,
  },
  demoSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  demoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  demoDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresSection: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  demoControls: {
    marginBottom: 30,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonRow: {
    alignItems: 'center',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  instructionsSection: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
