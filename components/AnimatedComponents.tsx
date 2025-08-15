import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Animated Button Component
interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
  disabled?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps & { children?: React.ReactNode }> = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  children,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[styles.animatedButton, style, disabled && styles.disabledButton]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        {children || <Text style={[styles.animatedButtonText, textStyle]}>{title}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Message Bubble Component
interface AnimatedMessageProps {
  text: string;
  timestamp: string;
  isUser: boolean;
  index: number;
  theme?: any;
}

export const AnimatedMessage: React.FC<AnimatedMessageProps> = ({
  text,
  timestamp,
  isUser,
  index,
  theme,
}) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  React.useEffect(() => {
    const delay = index * 100;
    translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 300 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const messageBubbleStyle = {
    backgroundColor: isUser ? theme?.colors?.userMessage || '#6366F1' : theme?.colors?.botMessage || '#FFFFFF',
    borderColor: !isUser ? theme?.colors?.border || '#E2E8F0' : undefined,
    shadowColor: isUser ? theme?.colors?.userMessage || '#6366F1' : '#000',
  };

  const messageTextStyle = {
    color: isUser ? theme?.colors?.userMessageText || '#FFFFFF' : theme?.colors?.botMessageText || '#1E293B',
  };

  const timeTextStyle = {
    color: theme?.colors?.textTertiary || '#94A3B8',
  };

  const avatarStyle = {
    backgroundColor: theme?.colors?.primary || '#6366F1',
    shadowColor: theme?.colors?.primary || '#6366F1',
  };

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.botMessage,
        animatedStyle,
      ]}
    >
      {!isUser && (
        <View style={[styles.botAvatarSmall, avatarStyle]}>
          <Text style={styles.botAvatarText}>🤖</Text>
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          messageBubbleStyle,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            messageTextStyle,
          ]}
        >
          {text}
        </Text>
        <Text style={[styles.messageTime, timeTextStyle]}>{timestamp}</Text>
      </View>
    </Animated.View>
  );
};

// Animated Typing Indicator
export const AnimatedTypingIndicator: React.FC<{ theme?: any }> = ({ theme }) => {
  const dots = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];

  React.useEffect(() => {
    dots.forEach((dot, index) => {
      dot.value = withSequence(
        withDelay(index * 200, withTiming(1, { duration: 300 })),
        withDelay(600, withTiming(0, { duration: 300 }))
      );
    });

    const interval = setInterval(() => {
      dots.forEach((dot, index) => {
        dot.value = withSequence(
          withDelay(index * 200, withTiming(1, { duration: 300 })),
          withDelay(600, withTiming(0, { duration: 300 }))
        );
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const renderDot = (index: number) => {
    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: dots[index].value,
        transform: [{ scale: interpolate(dots[index].value, [0, 1], [0.5, 1]) }],
      };
    });

    return (
      <Animated.View 
        key={index} 
        style={[
          styles.typingDot, 
          { backgroundColor: theme?.colors?.primary || '#6366F1' },
          animatedStyle
        ]} 
      />
    );
  };

  return (
    <View style={[styles.messageContainer, styles.botMessage]}>
      <View style={[
        styles.botAvatarSmall,
        {
          backgroundColor: theme?.colors?.primary || '#6366F1',
          shadowColor: theme?.colors?.primary || '#6366F1',
        }
      ]}>
        <Text style={styles.botAvatarText}>🤖</Text>
      </View>
      <View style={[
        styles.messageBubble,
        {
          backgroundColor: theme?.colors?.botMessage || '#FFFFFF',
          borderColor: theme?.colors?.border || '#E2E8F0',
          shadowColor: theme?.isDark ? '#000' : '#000',
          shadowOpacity: theme?.isDark ? 0.2 : 0.05,
        }
      ]}>
        <View style={styles.typingIndicator}>
          <Text style={[
            styles.typingText,
            { color: theme?.colors?.textSecondary || '#64748B' }
          ]}>AI is typing</Text>
          <View style={styles.dotsContainer}>
            {dots.map((_, index) => renderDot(index))}
          </View>
        </View>
      </View>
    </View>
  );
};

// Animated Welcome Message
export const AnimatedWelcomeMessage: React.FC<{ theme?: any }> = ({ theme }) => {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  React.useEffect(() => {
    translateY.value = withDelay(500, withSpring(0, { damping: 15, stiffness: 300 }));
    opacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    scale.value = withDelay(500, withSpring(1, { damping: 15, stiffness: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.welcomeMessageContainer, animatedStyle]}>
      <View style={[
        styles.welcomeMessageBubble,
        {
          backgroundColor: theme?.colors?.primaryLight + '20' || '#EEF2FF',
          borderColor: theme?.colors?.primary || '#6366F1',
          shadowColor: theme?.colors?.primary || '#6366F1',
        }
      ]}>
        <Text style={[
          styles.welcomeMessageText,
          { color: theme?.colors?.primary || '#6366F1' }
        ]}>
          👋 Hello! I'm your AI assistant. How can I help you today?
        </Text>
        <Text style={[
          styles.welcomeMessageSubtext,
          { color: theme?.colors?.primary || '#6366F1' }
        ]}>
          Ask me anything - I can help with questions, coding, writing, research, and much more!
        </Text>
      </View>
    </Animated.View>
  );
};

// Animated Feature Item
interface AnimatedFeatureItemProps {
  icon: string;
  text: string;
  index: number;
  theme?: any;
}

export const AnimatedFeatureItem: React.FC<AnimatedFeatureItemProps> = ({
  icon,
  text,
  index,
  theme,
}) => {
  const translateX = useSharedValue(-50);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const delay = index * 150;
    translateX.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 300 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const featureItemStyle = {
    backgroundColor: theme?.colors?.card || '#FFFFFF',
    borderColor: theme?.colors?.border || '#E2E8F0',
    shadowColor: theme?.colors?.text || '#000',
  };

  const featureTextStyle = {
    color: theme?.colors?.text || '#1E293B',
  };

  return (
    <Animated.View style={[styles.featureItem, featureItemStyle, animatedStyle]}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureText, featureTextStyle]}>{text}</Text>
    </Animated.View>
  );
};



// Animated Logo
export const AnimatedLogo: React.FC<{ size?: number }> = ({ size = 60 }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.5);

  React.useEffect(() => {
    rotation.value = withDelay(300, withSpring(360, { damping: 15, stiffness: 100 }));
    scale.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.Text style={[styles.animatedLogo, { fontSize: size }, animatedStyle]}>
      🤖
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  // Animated Button Styles
  animatedButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  animatedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Message Styles
  messageContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  botAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  botAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 6,
    lineHeight: 24,
  },
  messageTime: {
    fontSize: 12,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },

  // Typing Indicator Styles
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    marginRight: 8,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },

  // Welcome Message Styles
  welcomeMessageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  welcomeMessageBubble: {
    borderRadius: 24,
    padding: 24,
    maxWidth: '90%',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeMessageText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeMessageSubtext: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },

  // Feature Item Styles
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },



  // Animated Logo Styles
  animatedLogo: {
    marginBottom: 20,
  },
}); 