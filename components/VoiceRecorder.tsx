import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import * as FileSystem from 'expo-file-system';
import { convertWebmToWavFile, isAudioConversionAvailable } from '../utils/audioConverter';

interface VoiceRecorderProps {
  onRecordingComplete: (audioFile: File | Blob | string, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  maxDuration = 60, // 1 minute max
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const animationRef = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const startRecording = async () => {
    try {
      console.log('🎤 Starting voice recording...');
      
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
            numberOfChannels: 1,
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
      console.log('🎤 Stopping voice recording...');
      
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
      console.log('🎤 Processing voice message...');
      
      // Calculate duration (approximate)
      const duration = Math.round(recordingDuration);
      
      // For web, convert webm to wav using ffmpeg
      // For mobile, we'll pass the URI directly since the backend can handle it
      let audioFile: File | Blob | string = audioUri;
      
      if (Platform.OS === 'web' && audioUri !== null) {
        const audioUriObj = audioUri as Blob | string;
        const isBlob = typeof audioUriObj === 'object' && 'size' in audioUriObj && 'type' in audioUriObj;
        if (isBlob) {
          // Convert webm blob to wav file using ffmpeg
          try {
            console.log('🎵 Đang convert webm sang wav bằng ffmpeg...');
            const wavFile = await convertWebmToWavFile(audioUriObj as Blob);
            audioFile = wavFile;
            console.log('✅ Convert thành công! Format: wav');
          } catch (conversionError) {
            console.error('❌ Lỗi khi convert audio:', conversionError);
            // Fallback: sử dụng webm blob nếu conversion thất bại
            console.warn('⚠️ Sử dụng webm blob gốc do lỗi conversion');
            audioFile = audioUriObj;
          }
        }
      } else if (Platform.OS !== 'web' && typeof audioUri === 'string') {
        // For mobile, we'll pass the URI directly since the backend can handle it
        // The ChatScreen will handle the file reading and base64 conversion
        audioFile = audioUri;
      }
      
      // Call the completion handler
      onRecordingComplete(audioFile, duration);
      
    } catch (error) {
      console.error('❌ Failed to process voice message:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi Xử Lý' : 'Processing Error',
        language === 'vi' 
          ? 'Không thể xử lý tin nhắn giọng nói.'
          : 'Cannot process voice message.',
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderWaveform = () => {
    const bars = Array.from({ length: 15 }, (_, index) => {
      const barHeight = isRecording ? Math.random() * 25 + 10 : 10;
      return (
        <View
          key={index}
          style={[
            styles.waveformBar,
            {
              height: barHeight,
              backgroundColor: isRecording ? theme.colors.error : theme.colors.border,
            }
          ]}
        />
      );
    });

    return <View style={styles.waveform}>{bars}</View>;
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
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {language === 'vi' ? '🎤 Ghi Âm Tin Nhắn' : '🎤 Voice Message'}
          </Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Recording Area */}
        <View style={styles.recordingArea}>
          {renderWaveform()}
          
          {/* Duration Display */}
          <Text style={[styles.durationText, { color: theme.colors.text }]}>
            {formatTime(recordingDuration)}
          </Text>
          
          {/* Recording Status */}
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {isRecording 
              ? (language === 'vi' ? 'Đang ghi âm...' : 'Recording...')
              : (language === 'vi' ? 'Nhấn để bắt đầu ghi âm' : 'Tap to start recording')
            }
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          {!isRecording && !audioUri && (
            <TouchableOpacity
              style={[styles.recordButton, { backgroundColor: theme.colors.error }]}
              onPress={startRecording}
            >
              <Icon name="mic" size={32} color="white" />
            </TouchableOpacity>
          )}

          {isRecording && (
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: theme.colors.error }]}
              onPress={stopRecording}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Icon name="stop" size={32} color="white" />
              </Animated.View>
            </TouchableOpacity>
          )}

          {audioUri && !isRecording && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                onPress={handleCancel}
              >
                <Icon name="close" size={24} color="white" />
                <Text style={styles.actionButtonText}>
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: theme.colors.primary,
                    opacity: isProcessing ? 0.5 : 1
                  }
                ]}
                onPress={handleSend}
                disabled={isProcessing}
              >
                <Icon name="send" size={24} color="white" />
                <Text style={styles.actionButtonText}>
                  {isProcessing 
                    ? (language === 'vi' ? 'Đang gửi...' : 'Sending...')
                    : (language === 'vi' ? 'Gửi' : 'Send')
                  }
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            {language === 'vi' 
              ? '• Nhấn và giữ để ghi âm\n• Thả tay để dừng\n• Tối đa 60 giây'
              : '• Tap and hold to record\n• Release to stop\n• Maximum 60 seconds'
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
  cancelButton: {
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
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  recordingArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    marginBottom: 20,
  },
  waveformBar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  durationText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
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
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructions: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
