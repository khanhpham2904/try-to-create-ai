import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';

interface AudioMessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  isTyping?: boolean;
  agentId?: number;
  onPress?: () => void;
  animated?: boolean;
  duration?: number; // Duration in seconds for audio visualization
}

export const AudioMessageBubble: React.FC<AudioMessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
  isTyping = false,
  agentId,
  onPress,
  animated = true,
  duration = 3, // Default duration
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(isUser ? 50 : -50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  const getBubbleStyle = (): any => {
    const baseStyle = {
      maxWidth: '85%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: isUser ? 20 : 20,
      elevation: Platform.OS === 'android' ? (isUser ? 8 : 6) : (isUser ? 6 : 4),
      shadowColor: isUser ? theme.colors.primary : (theme.type === 'dark' ? '#8B5CF6' : '#667EEA'),
      shadowOffset: { width: 0, height: isUser ? 6 : 4 },
      shadowOpacity: isUser ? 0.25 : (theme.type === 'dark' ? 0.2 : 0.12),
      shadowRadius: isUser ? 12 : 8,
      marginVertical: 4,
      marginHorizontal: 16,
      alignSelf: isUser ? 'flex-end' as const : 'flex-start' as const,
    };

    if (isUser) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.userMessage,
        borderBottomLeftRadius: 4,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.05)',
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.botMessage,
        borderBottomRightRadius: 4,
        borderWidth: 0.3,
        borderColor: theme.type === 'dark' ? 'rgba(139, 92, 246, 0.02)' : 'rgba(102, 126, 234, 0.02)',
      };
    }
  };

  const getGradientColors = () => {
    if (isUser) {
      return theme.type === 'dark'
        ? ['#8B5CF6', '#7C3AED', '#111827'] as [string, string, ...string[]]
        : ['#667EEA', '#764BA2', '#FFFFFF'] as [string, string, ...string[]];
    } else {
      return theme.type === 'dark'
        ? [theme.colors.botMessage, theme.colors.surface] as [string, string, ...string[]]
        : ['#F7FAFC', '#FFFFFF'] as [string, string, ...string[]];
    }
  };

  const getTextColor = () => {
    if (isUser) {
      return 'white';
    } else {
      return theme.colors.text;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    
    const { formatTime: formatTimeUtil, getUserTimezone } = require('../utils/timeUtils');
    return formatTimeUtil(timeString, { 
      timeZone: getUserTimezone() 
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      // Stop any ongoing animation
      progressAnim.stopAnimation();
    } else {
      setIsPlaying(true);
      // Start progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration * 1000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setIsPlaying(false);
          setCurrentTime(0);
          progressAnim.setValue(0);
        }
      });
    }
  };

  const renderAudioVisualizer = () => {
    const bars = Array.from({ length: 5 }, (_, index) => {
      const barHeight = isPlaying ? Math.random() * 20 + 8 : 8;
      return (
        <View
          key={index}
          style={[
            styles.audioBar,
            {
              height: barHeight,
              backgroundColor: isUser ? 'rgba(255,255,255,0.8)' : theme.colors.primary,
            }
          ]}
        />
      );
    });

    return (
      <View style={styles.audioVisualizer}>
        {bars}
      </View>
    );
  };

  const Bubble = () => (
    <Animated.View
      style={animated && {
        opacity: fadeAnim,
        transform: [
          { translateX: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={getBubbleStyle()}
      >
        <View style={styles.messageContainer}>
          {/* Typing indicator */}
          {isTyping ? (
            <View style={styles.typingContainer}>
              <View style={[styles.typingDot, { backgroundColor: getTextColor() }]} />
              <View style={[styles.typingDot, { backgroundColor: getTextColor() }]} />
              <View style={[styles.typingDot, { backgroundColor: getTextColor() }]} />
            </View>
          ) : (
            <>
              {!isUser && agentId && (
                <Text style={[styles.agentLabel, { color: theme.colors.primary, fontSize: 12 }]}>
                  Agent #{agentId}
                </Text>
              )}
              
              <TouchableOpacity
                style={styles.audioContainer}
                onPress={handlePlayPause}
                activeOpacity={0.8}
              >
                <View style={styles.audioControls}>
                  <View style={[styles.playButton, { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : theme.colors.primary + '20' }]}>
                    <Icon 
                      name={isPlaying ? "pause" : "play-arrow"} 
                      size={24} 
                      color={isUser ? 'white' : theme.colors.primary} 
                    />
                  </View>
                  
                  <View style={styles.audioInfo}>
                    {renderAudioVisualizer()}
                    <Text style={[styles.durationText, { color: getTextColor() }]}>
                      {formatDuration(duration)}
                    </Text>
                  </View>
                </View>
                
                {/* Progress bar */}
                <View style={[styles.progressBar, { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : theme.colors.border }]}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: isUser ? 'white' : theme.colors.primary,
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      }
                    ]}
                  />
                </View>
              </TouchableOpacity>
              
              {timestamp && (
                <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.textTertiary }]}>
                  {formatTime(timestamp)}
                </Text>
              )}
            </>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Bubble />
      </TouchableOpacity>
    );
  }

  return <Bubble />;
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 2,
  },
  agentLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end' as const,
    opacity: 0.7,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  audioContainer: {
    minWidth: 200,
    paddingVertical: 8,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioVisualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 30,
    flex: 1,
    marginRight: 12,
  },
  audioBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 1.5,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});
