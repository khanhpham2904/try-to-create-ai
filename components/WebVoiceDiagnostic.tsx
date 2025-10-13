import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface WebVoiceDiagnosticProps {
  onClose: () => void;
}

export const WebVoiceDiagnostic: React.FC<WebVoiceDiagnosticProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { speak, stop: stopTTS, isSpeaking, isAvailable: ttsAvailable, error: ttsError } = useTextToSpeech();
  const { startListening, stopListening, isListening, recognizedText, error: sttError, isAvailable: sttAvailable } = useSpeechToText(language === 'vi' ? 'vi-VN' : 'en-US');
  
  const [testResults, setTestResults] = useState<{
    tts: boolean;
    stt: boolean;
    https: boolean;
    browser: string;
  }>({
    tts: false,
    stt: false,
    https: false,
    browser: 'Unknown'
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Detect browser
      const userAgent = navigator.userAgent;
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      // Check HTTPS
      const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

      setTestResults({
        tts: ttsAvailable,
        stt: sttAvailable,
        https: isHttps,
        browser
      });
    }
  }, [ttsAvailable, sttAvailable]);

  const handleTestTTS = async () => {
    const testText = language === 'vi' 
      ? 'Xin chào! Đây là kiểm tra chuyển văn bản thành giọng nói.'
      : 'Hello! This is a text-to-speech test.';
    
    try {
      await speak(testText, language === 'vi' ? 'vi-VN' : 'en-US');
    } catch (err) {
      Alert.alert(
        language === 'vi' ? 'Lỗi TTS' : 'TTS Error',
        language === 'vi' ? 'Không thể phát âm thanh' : 'Cannot play audio'
      );
    }
  };

  const handleTestSTT = async () => {
    try {
      await startListening();
    } catch (err) {
      Alert.alert(
        language === 'vi' ? 'Lỗi STT' : 'STT Error',
        language === 'vi' ? 'Không thể nhận dạng giọng nói' : 'Cannot recognize speech'
      );
    }
  };

  const getStatusIcon = (status: boolean) => (
    <Icon 
      name={status ? "check-circle" : "error"} 
      size={20} 
      color={status ? theme.colors.success : theme.colors.error} 
    />
  );

  const getStatusText = (status: boolean) => (
    <Text style={[styles.statusText, { color: status ? theme.colors.success : theme.colors.error }]}>
      {status ? (language === 'vi' ? 'Hoạt động' : 'Working') : (language === 'vi' ? 'Không hoạt động' : 'Not Working')}
    </Text>
  );

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
            {language === 'vi' ? '🔍 Chẩn Đoán Web Voice' : '🔍 Web Voice Diagnostic'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Platform Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Thông Tin Nền Tảng' : 'Platform Information'}
          </Text>
          <View style={styles.infoRow}>
            <Icon name="web" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {language === 'vi' ? 'Nền tảng:' : 'Platform:'} Web Browser
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="computer" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {language === 'vi' ? 'Trình duyệt:' : 'Browser:'} {testResults.browser}
            </Text>
          </View>
          <View style={styles.infoRow}>
            {getStatusIcon(testResults.https)}
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              {language === 'vi' ? 'HTTPS:' : 'HTTPS:'} {testResults.https ? 'Có' : 'Không'}
            </Text>
          </View>
        </View>

        {/* TTS Test */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Kiểm Tra Text-to-Speech' : 'Text-to-Speech Test'}
          </Text>
          <View style={styles.statusRow}>
            {getStatusIcon(testResults.tts)}
            {getStatusText(testResults.tts)}
          </View>
          
          {ttsError && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {ttsError}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.testButton,
              { 
                backgroundColor: isSpeaking ? theme.colors.error : theme.colors.primary,
                opacity: testResults.tts ? 1 : 0.5
              }
            ]}
            onPress={isSpeaking ? stopTTS : handleTestTTS}
            disabled={!testResults.tts}
          >
            <Icon 
              name={isSpeaking ? "stop" : "play-arrow"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.buttonText}>
              {isSpeaking 
                ? (language === 'vi' ? 'Dừng' : 'Stop')
                : (language === 'vi' ? 'Kiểm Tra TTS' : 'Test TTS')
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* STT Test */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Kiểm Tra Speech-to-Text' : 'Speech-to-Text Test'}
          </Text>
          <View style={styles.statusRow}>
            {getStatusIcon(testResults.stt)}
            {getStatusText(testResults.stt)}
          </View>
          
          {sttError && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {sttError}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.testButton,
              { 
                backgroundColor: isListening ? theme.colors.error : theme.colors.success,
                opacity: testResults.stt ? 1 : 0.5
              }
            ]}
            onPress={isListening ? stopListening : handleTestSTT}
            disabled={!testResults.stt}
          >
            <Icon 
              name={isListening ? "stop" : "mic"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.buttonText}>
              {isListening 
                ? (language === 'vi' ? 'Dừng' : 'Stop')
                : (language === 'vi' ? 'Kiểm Tra STT' : 'Test STT')
              }
            </Text>
          </TouchableOpacity>

          {recognizedText && (
            <View style={[styles.resultBox, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>
                {language === 'vi' ? 'Kết quả nhận dạng:' : 'Recognition result:'}
              </Text>
              <Text style={[styles.resultText, { color: theme.colors.text }]}>
                {recognizedText}
              </Text>
            </View>
          )}
        </View>

        {/* Troubleshooting */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Khắc Phục Sự Cố' : 'Troubleshooting'}
          </Text>
          
          {!testResults.https && (
            <View style={styles.troubleshootItem}>
              <Icon name="warning" size={16} color={theme.colors.warning} />
              <Text style={[styles.troubleshootText, { color: theme.colors.text }]}>
                {language === 'vi' 
                  ? '• Cần HTTPS để sử dụng Web Speech API (trừ localhost)'
                  : '• HTTPS required for Web Speech API (except localhost)'
                }
              </Text>
            </View>
          )}

          {!testResults.tts && (
            <View style={styles.troubleshootItem}>
              <Icon name="warning" size={16} color={theme.colors.warning} />
              <Text style={[styles.troubleshootText, { color: theme.colors.text }]}>
                {language === 'vi' 
                  ? '• Text-to-Speech không được hỗ trợ trên trình duyệt này'
                  : '• Text-to-Speech not supported on this browser'
                }
              </Text>
            </View>
          )}

          {!testResults.stt && (
            <View style={styles.troubleshootItem}>
              <Icon name="warning" size={16} color={theme.colors.warning} />
              <Text style={[styles.troubleshootText, { color: theme.colors.text }]}>
                {language === 'vi' 
                  ? '• Speech-to-Text không được hỗ trợ trên trình duyệt này'
                  : '• Speech-to-Text not supported on this browser'
                }
              </Text>
            </View>
          )}

          <View style={styles.troubleshootItem}>
            <Icon name="info" size={16} color={theme.colors.info} />
            <Text style={[styles.troubleshootText, { color: theme.colors.text }]}>
              {language === 'vi' 
                ? '• Thử Chrome, Firefox, hoặc Edge để có hỗ trợ tốt nhất'
                : '• Try Chrome, Firefox, or Edge for best support'
              }
            </Text>
          </View>

          <View style={styles.troubleshootItem}>
            <Icon name="info" size={16} color={theme.colors.info} />
            <Text style={[styles.troubleshootText, { color: theme.colors.text }]}>
              {language === 'vi' 
                ? '• Cho phép quyền microphone khi được yêu cầu'
                : '• Allow microphone permission when prompted'
              }
            </Text>
          </View>
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
    marginRight: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  resultBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  resultLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  troubleshootItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  troubleshootText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});
