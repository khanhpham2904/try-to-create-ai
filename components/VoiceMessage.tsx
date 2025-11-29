import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { Audio } from 'expo-av';

interface VoiceMessageProps {
  audioUri?: string;
  duration?: number;
  isUser: boolean;
  timestamp?: string;
  isPlayingProp?: boolean; // Renamed to avoid conflict
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (position: number) => void;
  currentPositionProp?: number; // Renamed to avoid conflict
  animated?: boolean;
  transcribedText?: string; // Add transcribed text
}

const { width: screenWidth } = Dimensions.get('window');

export const VoiceMessage: React.FC<VoiceMessageProps> = ({
  audioUri,
  duration = 0,
  isUser,
  timestamp,
  isPlayingProp = false,
  onPlay,
  onPause,
  onSeek,
  currentPositionProp = 0,
  animated = true,
  transcribedText,
}) => {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [htmlAudio, setHtmlAudio] = useState<HTMLAudioElement | null>(null);
  const slideAnim = useRef(new Animated.Value(isUser ? 50 : -50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isFinishedRef = useRef(false); // Track if audio has finished to prevent loops
  const statusUpdateSubscriptionRef = useRef<Audio.Subscription | null>(null);

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [animated, slideAnim, fadeAnim, scaleAnim]);

  // Load audio when component mounts
  useEffect(() => {
    loadAudio();
    
    return () => {
      // Reset finished flag
      isFinishedRef.current = false;
      
      if (sound) {
        // Stop playback before unloading
        sound.stopAsync().catch(() => {});
        sound.unloadAsync().catch(() => {});
      }
      if (htmlAudio) {
        htmlAudio.pause();
        htmlAudio.src = '';
        // Remove all event listeners
        htmlAudio.removeEventListener('ended', () => {});
      }
    };
  }, [audioUri]);

  // Set up audio status listener
  useEffect(() => {
    if (!sound) return;

    // Clean up previous subscription if exists
    if (statusUpdateSubscriptionRef.current) {
      statusUpdateSubscriptionRef.current.remove();
      statusUpdateSubscriptionRef.current = null;
    }

    // Reset finished flag when sound changes
    isFinishedRef.current = false;

    const statusListener = sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        if (status.didJustFinish && !isFinishedRef.current) {
          // Mark as finished to prevent multiple callbacks
          isFinishedRef.current = true;
          console.log('🎵 Audio playback finished');
          
          // Stop playback and reset state
          setIsPlaying(false);
          setCurrentPosition(0);
          
          // Pause the sound explicitly to prevent auto-replay
          sound.pauseAsync().catch((error) => {
            console.error('Error pausing sound after finish:', error);
          });
          
          // Reset position after a small delay to avoid triggering replay
          setTimeout(() => {
            sound.setPositionAsync(0).catch((error) => {
              console.error('Error resetting position:', error);
            });
          }, 100);
          
          // Call onPause callback if provided
          onPause?.();
        } else if (status.positionMillis !== undefined && !status.didJustFinish) {
          // Only update position if not finished
          setCurrentPosition(status.positionMillis / 1000);
        }
      }
    });

    // Store subscription reference for cleanup
    statusUpdateSubscriptionRef.current = statusListener;

    return () => {
      // Clean up subscription
      if (statusUpdateSubscriptionRef.current) {
        statusUpdateSubscriptionRef.current.remove();
        statusUpdateSubscriptionRef.current = null;
      }
      isFinishedRef.current = false;
    };
  }, [sound, onPause]);

  const loadAudio = async () => {
    if (!audioUri) {
      console.log('🎵 No audio URI provided');
      return;
    }
    
    try {
      console.log('🎵 Loading audio:', audioUri.substring(0, 50) + '...');
      console.log('🎵 Platform:', Platform.OS);
      console.log('🎵 Audio URI type:', audioUri.startsWith('data:') ? 'base64' : 'url');
      
      if (Platform.OS === 'web') {
        // Use HTML5 Audio API for web
        console.log('🎵 Using HTML5 Audio API for web');
        console.log('🎵 Audio format from URI:', audioUri.substring(0, 30));
        
        const audio = new (window as any).Audio(audioUri);
        
        audio.addEventListener('loadeddata', () => {
          console.log('✅ HTML5 Audio loaded successfully');
          console.log('🎵 Audio duration:', audio.duration, 'seconds');
          console.log('🎵 Audio readyState:', audio.readyState);
          setIsAudioLoaded(true);
        });
        
        audio.addEventListener('canplay', () => {
          console.log('✅ HTML5 Audio can play');
        });
        
        audio.addEventListener('canplaythrough', () => {
          console.log('✅ HTML5 Audio can play through');
        });
        
        audio.addEventListener('error', (e: any) => {
          console.error('❌ HTML5 Audio error:', e);
          console.error('❌ Audio error code:', audio.error?.code);
          console.error('❌ Audio error message:', audio.error?.message);
          console.error('❌ Audio networkState:', audio.networkState);
          console.error('❌ Audio readyState:', audio.readyState);
        });
        
        audio.addEventListener('loadstart', () => {
          console.log('🎵 HTML5 Audio load started');
        });
        
        audio.addEventListener('progress', () => {
          console.log('🎵 HTML5 Audio loading progress');
        });
        
        audio.addEventListener('timeupdate', () => {
          setCurrentPosition(audio.currentTime);
        });
        
        audio.addEventListener('ended', () => {
          console.log('✅ HTML5 Audio playback ended');
          if (!isFinishedRef.current) {
            isFinishedRef.current = true;
          setIsPlaying(false);
          setCurrentPosition(0);
            audio.currentTime = 0; // Reset position
            onPause?.();
          }
        });
        
        // Try to load audio explicitly
        audio.load();
        setHtmlAudio(audio);
        
        // Check if audio is ready after a short delay
        setTimeout(() => {
          console.log('🎵 Audio check after 500ms:', {
            readyState: audio.readyState,
            networkState: audio.networkState,
            error: audio.error,
            duration: audio.duration
          });
        }, 500);
        
      } else {
        // Use expo-av for mobile
        console.log('🎵 Using expo-av for mobile');
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { 
            shouldPlay: false,
            isLooping: false,
            volume: 1.0,
          }
        );
        
        setSound(newSound);
        setIsAudioLoaded(true);
        console.log('🎵 Audio loaded successfully');
        
        // Test if we can get the status
        const status = await newSound.getStatusAsync();
        console.log('🎵 Audio status:', status);
      }
      
    } catch (error) {
      console.error('❌ Failed to load audio:', error);
      console.error('❌ Audio URI type:', audioUri.substring(0, 50) + '...');
    }
  };

  // Pulse animation for play button
  useEffect(() => {
    if (isPlaying) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying, pulseAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timeString?: string) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBubbleStyle = () => {
    const baseStyle = {
      maxWidth: screenWidth * 0.7,
      minWidth: 200,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      marginVertical: 4,
      marginHorizontal: 16,
      alignSelf: isUser ? 'flex-end' as const : 'flex-start' as const,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    };

    if (isUser) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.surface,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
    }
  };

  const getGradientColors = () => {
    if (isUser) {
      return theme.type === 'dark'
        ? ['#8B5CF6', '#7C3AED'] as [string, string, ...string[]]
        : ['#667EEA', '#764BA2'] as [string, string, ...string[]];
    } else {
      return [theme.colors.surface, theme.colors.surface] as [string, string, ...string[]];
    }
  };

  // Calculate actual duration from audio if not provided
  const actualDuration = duration > 0 ? duration : (htmlAudio?.duration || 0);
  const progress = actualDuration > 0 ? (currentPosition / actualDuration) * 100 : 0;

  const renderWaveform = () => {
    const bars = Array.from({ length: 20 }, (_, index) => {
      const barHeight = isPlaying ? Math.random() * 20 + 8 : 8;
      const isActive = (index / 20) * 100 <= progress;
      
      return (
        <View
          key={index}
          style={[
            styles.waveformBar,
            {
              height: barHeight,
              backgroundColor: isActive 
                ? (isUser ? 'white' : theme.colors.primary)
                : (isUser ? 'rgba(255,255,255,0.3)' : theme.colors.border),
            }
          ]}
        />
      );
    });

    return <View style={styles.waveform}>{bars}</View>;
  };

  const handlePress = async () => {
    if (!isAudioLoaded) {
      console.log('🎵 No audio loaded or not ready');
      return;
    }

    try {
      if (Platform.OS === 'web' && htmlAudio) {
        // Use HTML5 Audio API for web
        if (isPlaying) {
          console.log('🎵 Pausing HTML5 audio');
          htmlAudio.pause();
          setIsPlaying(false);
          onPause?.();
        } else {
          console.log('🎵 Playing HTML5 audio');
          console.log('🎵 Audio URI:', audioUri?.substring(0, 50) + '...');
          
          await htmlAudio.play();
          setIsPlaying(true);
          onPlay?.();
        }
      } else if (sound) {
        // Use expo-av for mobile
        if (isPlaying) {
          console.log('🎵 Pausing expo-av audio');
          await sound.pauseAsync();
          setIsPlaying(false);
          onPause?.();
        } else {
          console.log('🎵 Playing expo-av audio');
          console.log('🎵 Audio URI:', audioUri?.substring(0, 50) + '...');
          
          // Reset finished flag when starting playback
          isFinishedRef.current = false;
          
          // Get current status before playing
          const statusBefore = await sound.getStatusAsync();
          console.log('🎵 Status before play:', statusBefore);
          
          // If audio was finished, reset position first
          if (statusBefore.isLoaded && statusBefore.didJustFinish) {
            await sound.setPositionAsync(0);
          }
          
          await sound.playAsync();
          setIsPlaying(true);
          onPlay?.();
          
          // Get status after playing
          const statusAfter = await sound.getStatusAsync();
          console.log('🎵 Status after play:', statusAfter);
        }
      }
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      console.error('❌ Error details:', error);
    }
  };

  const handleLongPress = () => {
    setIsPressed(true);
    // Could implement seek functionality here
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        animated && {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={getBubbleStyle()}
      >
        <View style={styles.content}>
          {/* Play/Pause Button */}
          <TouchableOpacity
            style={[
              styles.playButton,
              {
                backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : theme.colors.primary + '20',
                opacity: isAudioLoaded ? 1 : 0.5,
              }
            ]}
            onPress={handlePress}
            onLongPress={handleLongPress}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
            disabled={!isAudioLoaded}
          >
            <Animated.View style={{ transform: [{ scale: isPlaying ? pulseAnim : 1 }] }}>
              <Icon
                name={
                  !isAudioLoaded 
                    ? "error" 
                    : isPlaying 
                      ? "pause" 
                      : "play-arrow"
                }
                size={24}
                color={
                  !isAudioLoaded 
                    ? theme.colors.error
                    : isUser 
                      ? 'white' 
                      : theme.colors.primary
                }
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Waveform */}
          <View style={styles.waveformContainer}>
            {renderWaveform()}
            
            {/* Progress Bar */}
            <View style={[
              styles.progressBar,
              { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : theme.colors.border }
            ]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: isUser ? 'white' : theme.colors.primary,
                  }
                ]}
              />
            </View>
          </View>

          {/* Duration */}
          <View style={styles.durationContainer}>
            <Text style={[
              styles.durationText,
              { color: isUser ? 'white' : theme.colors.text }
            ]}>
              {formatTime(currentPosition)} / {formatTime(actualDuration)}
            </Text>
          </View>
        </View>

        {/* Transcribed Text */}
        {transcribedText && (
          <View style={styles.transcribedContainer}>
            <Text style={[
              styles.transcribedText,
              { color: isUser ? 'rgba(255,255,255,0.9)' : theme.colors.textSecondary }
            ]}>
              "{transcribedText}"
            </Text>
          </View>
        )}

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={[styles.debugText, { color: theme.colors.textTertiary }]}>
              Audio: {isAudioLoaded ? '✅' : '❌'} | 
              Playing: {isPlaying ? '▶️' : '⏸️'} | 
              Duration: {actualDuration.toFixed(1)}s | 
              Platform: {Platform.OS}
            </Text>
          </View>
        )}

        {/* Timestamp */}
        {timestamp && (
          <Text style={[
            styles.timestamp,
            { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.textTertiary }
          ]}>
            {formatTimestamp(timestamp)}
          </Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waveformContainer: {
    flex: 1,
    marginRight: 12,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 30,
    marginBottom: 4,
  },
  waveformBar: {
    width: 2,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  durationContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transcribedContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  transcribedText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    opacity: 0.8,
  },
  debugContainer: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  debugText: {
    fontSize: 10,
    opacity: 0.6,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
});
