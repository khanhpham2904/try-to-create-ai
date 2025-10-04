import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevation?: number;
  borderRadius?: number;
  backgroundColor?: string;
  gradient?: boolean;
  gradientColors?: string[];
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 6,
  borderRadius = 20,
  backgroundColor,
  gradient = false,
  gradientColors,
}) => {
  const { theme } = useTheme();
  
  const cardStyle = {
    backgroundColor: backgroundColor || theme.colors.surface,
    borderRadius,
    shadowColor: theme.type === 'dark' ? '#8B5CF6' : '#667EEA',
    shadowOffset: { width: 0, height: theme.type === 'dark' ? 8 : 6 },
    shadowOpacity: theme.type === 'dark' ? 0.25 : 0.15,
    shadowRadius: theme.type === 'dark' ? 16 : 12,
    elevation: elevation,
    borderWidth: theme.type === 'dark' ? 0.5 : 0,
    borderColor: theme.type === 'dark' ? 'rgba(139, 92, 246, 0.03)' : 'transparent',
  };

  const defaultGradient = theme.type === 'dark' 
    ? [theme.colors.surface, theme.colors.card] as [string, string, ...string[]]
    : ['rgba(255,255,255,0.95)', 'rgba(247,250,252,0.8)'] as [string, string, ...string[]];

  if (gradient) {
    return (
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]] || defaultGradient}
        style={[styles.card, cardStyle, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 24,
    marginVertical: 12,
    marginHorizontal: 16,
  },
}); 