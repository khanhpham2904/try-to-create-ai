import React, { useEffect, useRef } from 'react';
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

interface AnimatedStatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | 'error';
  showText?: boolean;
  animated?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const AnimatedStatusIndicator: React.FC<AnimatedStatusIndicatorProps> = ({
  status,
  showText = true,
  animated = true,
  onPress,
  size = 'medium',
}) => {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          colors: ['#48BB78', '#68D391', '#FFFFFF'] as [string, string, ...string[]],
          icon: 'check-circle',
          text: 'Online',
          textColor: '#48BB78',
        };
      case 'offline':
        return {
          colors: ['#A0AEC0', '#CBD5E1', '#E2E8F0'] as [string, string, ...string[]],
          icon: 'cloud-off',
          text: 'Offline',
          textColor: '#A0AEC0',
        };
      case 'connecting':
        return {
          colors: ['#ED8936', '#FBD38D', '#FFFFFF'] as [string, string, ...string[]],
          icon: 'sync',
          text: 'Connecting',
          textColor: '#ED8936',
        };
      case 'error':
        return {
          colors: ['#F56565', '#FC8181', '#FFFFFF'] as [string, string, ...string[]],
          icon: 'error',
          text: 'Error',
          textColor: '#F56565',
        };
      default:
        return {
          colors: ['#A0AEC0', '#CBD5E1', '#E2E8F0'] as [string, string, ...string[]],
          icon: 'help',
          text: 'Unknown',
          textColor: '#A0AEC0',
        };
    }
  };

  const statusConfig = getStatusConfig();

  useEffect(() => {
    if (animated && (status === 'online' || status === 'connecting')) {
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

      const opacityAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      opacityAnimation.start();

      return () => {
        pulseAnimation.stop();
        opacityAnimation.stop();
      };
    }
  }, [status, animated, pulseAnim, pulseOpacity]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          containerSize: 32,
          iconSize: 16,
          borderRadius: 16,
          fontSize: 12,
          paddingHorizontal: 8,
          paddingVertical: 4,
        };
      case 'medium':
        return {
          containerSize: 40,
          iconSize: 20,
          borderRadius: 20,
          fontSize: 14,
          paddingHorizontal: 12,
          paddingVertical: 6,
        };
      case 'large':
        return {
          containerSize: 48,
          iconSize: 24,
          borderRadius: 24,
          fontSize: 16,
          paddingHorizontal: 16,
          paddingVertical: 8,
        };
      default:
        return {
          containerSize: 40,
          iconSize: 20,
          borderRadius: 20,
          fontSize: 14,
          paddingHorizontal: 12,
          paddingVertical: 6,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const containerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    borderRadius: sizeStyles.borderRadius,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: statusConfig.textColor + '40',
    elevation: Platform.OS === 'android' ? 4 : 0,
    shadowColor: statusConfig.textColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  };

  const Content = () => (
    <Animated.View
      style={animated && (status === 'online' || status === 'connecting') 
        ? { 
            transform: [{ scale: pulseAnim }],
            opacity: pulseOpacity,
          }
        : {}
      }
    >
      <LinearGradient
        colors={statusConfig.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          containerStyle,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
      <Icon 
        name={statusConfig.icon} 
        size={sizeStyles.iconSize} 
        color={status === 'offline' ? theme.colors.textSecondary : 'white'} 
      />
        {showText && (
          <Text 
            style={[
              styles.statusText,
              { 
                color: status === 'offline' ? statusConfig.textColor : 'rgba(255,255,255,0.9)',
                fontSize: sizeStyles.fontSize,
                marginLeft: 6,
                fontWeight: '600',
              },
            ]}
          >
            {statusConfig.text}
          </Text>
        )}
      </LinearGradient>
    </Animated.View>
    );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Content />
      </TouchableOpacity>
    );
  }

  return <Content />;
};

const styles = StyleSheet.create({
  statusText: {
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
