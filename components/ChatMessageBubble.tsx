import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';

interface ChatMessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  isTyping?: boolean;
  agentId?: number;
  onPress?: () => void;
  animated?: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
  isTyping = false,
  agentId,
  onPress,
  animated = true,
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(isUser ? 50 : -50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
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
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isLink = (text: string) => {
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlRegex.test(text.trim());
  };

  const handlePress = (text: string) => {
    if (isLink(text)) {
      const url = text.startsWith('http') ? text : `https://${text}`;
      Linking.openURL(url).catch(err => console.error('An error occurred', err));
    } else if (onPress) {
      onPress();
    }
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
            
            {isLink(message) ? (
              <TouchableOpacity onPress={() => handlePress(message)}>
                <Text style={[styles.messageText, { color: isUser ? 'white' : theme.colors.info, textDecorationLine: 'underline' }]}>
                  {message}
                </Text>
                <View style={styles.linkIcon}>
                  <Icon name="open-in-new" size={12} color={isUser ? 'white' : theme.colors.info} />
                </View>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.messageText, { color: getTextColor() }]}>
                {message}
              </Text>
            )}
            
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

  if (onPress && !isLink(message)) {
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
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
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
  linkIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
});
