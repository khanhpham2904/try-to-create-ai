import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Platform } from 'react-native';

interface ForceCloseTutorialButtonProps {
  onForceClose: () => void;
}

export const ForceCloseTutorialButton: React.FC<ForceCloseTutorialButtonProps> = ({ onForceClose }) => {
  const { theme } = useTheme();

  const handleForceClose = () => {
    Alert.alert(
      'Force Close Tutorial',
      'Are you sure you want to force close the tutorial? This will skip it completely.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Force Close',
          style: 'destructive',
          onPress: onForceClose,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.error || '#FF4444' }]}
        onPress={handleForceClose}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          🚫 Force Close
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 170 : 150,
    right: 20,
    zIndex: 9999, // Very high z-index to stay on top
    elevation: Platform.OS === 'android' ? 10 : 0, // High elevation for Android
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 100, // Ensure minimum touch target
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
