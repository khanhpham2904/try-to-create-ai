import React from 'react';
import {
  TouchableOpacity,
  TouchableNativeFeedback,
  View,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-bottom';
  primary?: boolean;
  secondary?: boolean;
  danger?: boolean;
  gradientColors?: [string, string, ...string[]];
  size?: 'small' | 'medium' | 'large';
  elevation?: number;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  position = 'bottom-right',
  primary = true,
  secondary = false,
  danger = false,
  gradientColors,
  size = 'medium',
  elevation = 8,
}) => {
  const { theme } = useTheme();

  const getPositionStyles = () => {
    const basePosition = { position: 'absolute' as const };
    const buttonSize = size === 'small' ? 48 : size === 'medium' ? 56 : 64;
    
    switch (position) {
      case 'bottom-right':
        return { ...basePosition, bottom: 20, right: 20 };
      case 'bottom-left':
        return { ...basePosition, bottom: 20, left: 20 };
      case 'top-right':
        return { ...basePosition, top: Platform.OS === 'android' ? 60 : 80, right: 20 };
      case 'top-left':
        return { ...basePosition, top: Platform.OS === 'android' ? 60 : 80, left: 20 };
      case 'center-bottom':
        return { ...basePosition, bottom: 20, left: width / 2 - buttonSize / 2 };
      default:
        return { ...basePosition, bottom: 20, right: 20 };
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 48, height: 48, borderRadius: 24 };
      case 'medium':
        return { width: 56, height: 56, borderRadius: 28 };
      case 'large':
        return { width: 64, height: 64, borderRadius: 32 };
      default:
        return { width: 56, height: 56, borderRadius: 28 };
    }
  };

  const getGradientColors = () => {
    if (gradientColors) return gradientColors;
    
    if (danger) {
      return theme.type === 'dark' 
        ? ['#F56565', '#E53E3E', '#C53030'] as [string, string, ...string[]]
        : ['#F56565', '#FFF5F5', '#E53E3E'] as [string, string, ...string[]];
    }
    
    if (secondary) {
      return theme.type === 'dark' 
        ? ['#A0AEC0', '#718096', '#2D3748'] as [string, string, ...string[]]
        : ['#A0AEC0', '#E2E8F0', '#CBD5E1'] as [string, string, ...string[]];
    }
    
    // Primary gradient
    return theme.type === 'dark' 
      ? ['#667EEA', '#764BA2', '#1A1625'] as [string, string, ...string[]]
      : ['#667EEA', '#764BA2', '#FFFFFF'] as [string, string, ...string[]];
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'medium':
        return 24;
      case 'large':
        return 28;
      default:
        return 24;
    }
  };

  const buttonStyles = {
    ...getPositionStyles(),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    elevation: elevation,
    shadowColor: theme.type === 'dark' ? '#000' : '#667EEA',
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity: theme.type === 'dark' ? 0.4 : 0.3,
    shadowRadius: elevation,
    zIndex: 1000,
    ...getButtonSize(),
  };

  const TouchableComponent = Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;
  const rippleColor = danger ? 'rgba(245,101,101,0.3)' : 'rgba(102,126,234,0.3)';

  const buttonContent = (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={buttonStyles}
    >
      <Icon 
        name={icon} 
        size={getIconSize()} 
        color={secondary ? theme.colors.text : 'white'} 
      />
    </LinearGradient>
  );

  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.Ripple(rippleColor, true)}
        onPress={onPress}
      >
        {buttonContent}
      </TouchableNativeFeedback>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {buttonContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
