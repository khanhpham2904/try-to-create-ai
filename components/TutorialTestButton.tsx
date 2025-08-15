import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface TutorialTestButtonProps {
  onShowTutorial: () => void;
}

export const TutorialTestButton: React.FC<TutorialTestButtonProps> = ({ onShowTutorial }) => {
  const { theme } = useTheme();

  const resetTutorial = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenTutorial');
      console.log('✅ Tutorial reset successfully');
      onShowTutorial();
    } catch (error) {
      console.error('❌ Error resetting tutorial:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={resetTutorial}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.buttonText, { color: theme.colors.userMessageText }]}>
          🔄 Reset Tutorial
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 50,
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
