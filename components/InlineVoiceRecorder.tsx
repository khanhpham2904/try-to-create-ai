import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  Dimensions,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import * as FileSystem from 'expo-file-system';

interface InlineVoiceRecorderProps {
  onRecordingComplete: (audioFile: File | Blob | string, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
  isVisible: boolean;
}

export const InlineVoiceRecorder: React.FC<InlineVoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  maxDuration = 60, // 1 minute max
  isVisible,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const animationRef = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 0.1;
        });
      }, 100);

      return () => {
        pulseAnimation.stop();
        if (durationInterval.current) {
          clearInterval(durationInterval.current);
        }
      };
    } else {
      pulseAnim.setValue(1);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    }
  }, [isRecording, maxDuration, pulseAnim]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('🎤 Starting inline voice recording...');
      
      // Request microphone permission
      if (Platform.OS === 'web') {
        // For web, we'll use MediaRecorder API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaRecorder API not supported');
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          
          console.log('🎤 Web audio recorded as blob:', audioBlob.size, 'bytes');
          setAudioUri(audioBlob as any); // Store blob for multipart upload
          
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        recordingRef.current = mediaRecorder;
        
      } else {
        // For mobile, we'll use expo-av
        const { Audio } = require('expo-av');
        
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Microphone permission denied');
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        });
        
        await recording.startAsync();
        recordingRef.current = recording;
      }
      
      setIsRecording(true);
      setRecordingDuration(0);
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi Ghi Âm' : 'Recording Error',
        language === 'vi' 
          ? 'Không thể bắt đầu ghi âm. Vui lòng kiểm tra quyền microphone.'
          : 'Cannot start recording. Please check microphone permissions.',
        [{ text: language === 'vi' ? 'OK' : 'OK' }]
      );
    }
  };

  const stopRecording = async () => {
    try {
      console.log('🎤 Stopping inline voice recording...');
      
      if (Platform.OS === 'web') {
        if (recordingRef.current) {
          recordingRef.current.stop();
        }
      } else {
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          setAudioUri(uri);
        }
      }
      
      setIsRecording(false);
      
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
    }
  };

  const handleSend = async () => {
    if (!audioUri) return;
    
    setIsProcessing(true);
    try {
      console.log('🎤 Processing inline voice message...');
      
      // Calculate duration (approximate)
      const duration = Math.round(recordingDuration);
      
      // For web, audioUri is already a Blob
      // For mobile, we need to convert URI to File/Blob
      let audioFile: File | Blob | string = audioUri;
      
      if (Platform.OS !== 'web' && typeof audioUri === 'string') {
        // For mobile, convert URI to File-like object
        try {
          const response = await fetch(audioUri);
          const blob = await response.blob();
          audioFile = blob;
        } catch (error) {
          console.error('❌ Failed to convert mobile audio to blob:', error);
          // Fallback to original URI for backward compatibility
          audioFile = audioUri;
        }
      }
      
      // Call the completion handler
      onRecordingComplete(audioFile, duration);
      
    } catch (error) {
      console.error('❌ Failed to process voice message:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi Xử Lý' : 'Processing Error',
        language === 'vi' 
          ? 'Không thể xử lý tin nhắn giọng nói. Vui lòng thử lại.'
          : 'Cannot process voice message. Please try again.',
        [{ text: language === 'vi' ? 'OK' : 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    onCancel();
  };

  if (!isVisible) {
    return null;
  }

  // Calculate dynamic bottom position based on keyboard and input area
  // Use a more conservative approach to avoid KeyboardAvoidingView conflicts
  const bottomPosition = keyboardHeight > 0 
    ? Math.max(keyboardHeight + 80, 200) // Above keyboard + input area, minimum 200px
    : 120; // Above input area when keyboard is hidden

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.surface,
        bottom: bottomPosition
      }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {language === 'vi' ? 'Ghi Âm Tin Nhắn' : 'Record Message'}
        </Text>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Recording Visualizer */}
        <View style={styles.visualizerContainer}>
          <Animated.View 
            style={[
              styles.recordingIndicator,
              { 
                backgroundColor: theme.colors.error,
                transform: [{ scale: pulseAnim }]
              }
            ]}
          />
          <Text style={[styles.durationText, { color: theme.colors.text }]}>
            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toFixed(1).padStart(4, '0')}
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          {!isRecording ? (
            <TouchableOpacity
              onPress={startRecording}
              style={[styles.recordButton, { backgroundColor: theme.colors.success }]}
            >
              <Icon name="mic" size={32} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={stopRecording}
              style={[styles.stopButton, { backgroundColor: theme.colors.error }]}
            >
              <Icon name="stop" size={32} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        {audioUri && !isRecording && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.actionButton, { backgroundColor: theme.colors.border }]}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSend}
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              disabled={isProcessing}
            >
              <Text style={[styles.actionButtonText, { color: 'white' }]}>
                {isProcessing 
                  ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...')
                  : (language === 'vi' ? 'Gửi' : 'Send')
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    maxHeight: Dimensions.get('window').height * 0.4,
    zIndex: 10000, // Ensure it appears above KeyboardAvoidingView and other elements
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 4,
  },
  content: {
    alignItems: 'center',
  },
  visualizerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordingIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  durationText: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  controls: {
    marginBottom: 24,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
