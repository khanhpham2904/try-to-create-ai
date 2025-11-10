import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { TextStyle } from 'react-native';

interface IconProps {
  name: keyof typeof MaterialIcons.glyphMap;
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
    <MaterialIcons 
      name={name} 
      size={size} 
      color={color} 
      style={style}
    />
  );
}; 