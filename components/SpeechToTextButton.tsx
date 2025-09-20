import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface SpeechToTextButtonProps {
  onTextRecognized: (text: string) => void;
  disabled?: boolean;
  size?: number;
  style?: any;
}

export const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({
  onTextRecognized,
  disabled = false,
  size = 24,
  style,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  
  // Map language to speech recognition language codes
  const getLanguageCode = () => {
    switch (language) {
      case 'vi':
        return 'vi-VN'; // Vietnamese
      case 'en':
      default:
        return 'en-US'; // English
    }
  };
  
  const {
    isListening,
    recognizedText,
    error,
    startListening,
    stopListening,
    clearText,
    isAvailable,
  } = useSpeechToText(getLanguageCode());

  // Handle text recognition
  React.useEffect(() => {
    if (recognizedText && !isListening) {
      onTextRecognized(recognizedText);
      // Clear the recognized text after using it to prevent re-application
      clearText();
    }
  }, [recognizedText, isListening, onTextRecognized, clearText]);

  // Handle errors
  React.useEffect(() => {
    if (error) {
      Alert.alert(
        language === 'vi' ? 'Lỗi Nhận Dạng Giọng Nói' : 'Speech Recognition Error',
        error,
        [{ text: language === 'vi' ? 'OK' : 'OK' }]
      );
    }
  }, [error, language]);

  const handlePress = async () => {
    if (!isAvailable) {
      Alert.alert(
        language === 'vi' ? 'Không Khả Dụng' : 'Not Available',
        language === 'vi' 
          ? 'Nhận dạng giọng nói không khả dụng trên thiết bị này.'
          : 'Speech recognition is not available on this device.',
        [{ text: language === 'vi' ? 'OK' : 'OK' }]
      );
      return;
    }

    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  // Always show button, but handle availability in the press handler

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: !isAvailable 
            ? theme.colors.textSecondary + '20'
            : isListening 
              ? theme.colors.error + '20' 
              : theme.colors.primary + '20',
          borderColor: !isAvailable 
            ? theme.colors.textSecondary + '40'
            : isListening 
              ? theme.colors.error + '40' 
              : theme.colors.primary + '40',
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {isListening ? (
        <ActivityIndicator 
          size="small" 
          color={theme.colors.error} 
        />
      ) : (
        <Icon 
          name={!isAvailable ? "mic-off" : "mic"} 
          size={size} 
          color={!isAvailable ? theme.colors.textSecondary : theme.colors.primary} 
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginLeft: 8,
  },
});
