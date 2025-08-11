import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevation?: number;
  borderRadius?: number;
  backgroundColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 4,
  borderRadius = 16,
  backgroundColor,
}) => {
  const { theme } = useTheme();
  
  const cardStyle = {
    backgroundColor: backgroundColor || theme.colors.surface,
    borderRadius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity: theme.type === 'dark' ? 0.3 : 0.1,
    shadowRadius: elevation,
    elevation: elevation,
  };

  return (
    <View style={[styles.card, cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
}); 