import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#6366F1',
  style,
}) => {
  return (
    <Text style={[styles.icon, { fontSize: size, color }, style]}>
      {name}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
}); 