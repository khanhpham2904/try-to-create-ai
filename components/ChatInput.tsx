import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onSpeech?: () => void;
  onVoiceRecord?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showAttach?: boolean;
  showSpeech?: boolean;
  showVoiceRecord?: boolean;
  isListening?: boolean;
  isRecording?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onAttach,
  onSpeech,
  onVoiceRecord,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 1000,
  showAttach = true,
  showSpeech = true,
  showVoiceRecord = true,
  isListening = false,
  isRecording = false,
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      Animated.sequence([
        Animated.timing(sendButtonScale, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(sendButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onSend();
    }
  };

  const getBorderColor = () => {
    if (disabled) return theme.colors.borderLight;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  const getBackgroundColor = () => {
    if (theme.type === 'dark') {
      return 'rgba(255,255,255,0.08)';
    } else {
      return 'rgba(255,255,255,0.8)';
    }
  };

  const inputContainerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 8 : 12,
    borderRadius: 24,
    borderWidth: isFocused ? 1.5 : 0.3,
    borderColor: getBorderColor(),
    backgroundColor: getBackgroundColor(),
    minHeight: 56,
    elevation: Platform.OS === 'android' ? 8 : 6,
    shadowColor: theme.type === 'dark' ? '#8B5CF6' : '#667EEA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: theme.type === 'dark' ? 0.25 : 0.15,
    shadowRadius: 12,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'android' ? 8 : 16,
    marginTop: 8,
  };

  const animatedInputStyle = {
    ...inputContainerStyle,
    backgroundColor: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [getBackgroundColor(), 'rgba(255,255,255,0.95)'],
    }),
    borderColor: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.border, theme.colors.primary],
    }),
  };

  return (
    <Animated.View style={[styles.inputContainer, animatedInputStyle]}>
      {showAttach && (
        <TouchableOpacity
          onPress={() => {
            console.log('🔘 ChatInput: Attachment button pressed!');
            console.log('🔘 ChatInput: disabled state:', disabled);
            // Prevent keyboard focus change
            inputRef.current?.blur();
            if (onAttach) {
              onAttach();
            } else {
              console.log('🔘 ChatInput: onAttach handler is null!');
            }
          }}
          style={[styles.attachButton, { backgroundColor: theme.colors.primary + '20' }]}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Icon name="add" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      )}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inputPlaceholder}
        style={[styles.textInput, { color: theme.colors.inputText }]}
        multiline={true}
        textBreakStrategy="balanced"
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={!disabled}
        maxLength={maxLength}
        numberOfLines={1}
      />

      <View style={styles.rightButtons}>
        {value.trim() && (
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              <LinearGradient
                colors={theme.type === 'dark' 
                  ? ['#8B5CF6', '#7C3AED'] as [string, string, ...string[]]
                  : ['#667EEA', '#764BA2'] as [string, string, ...string[]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <Icon name="send" size={20} color="white" />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        )}

        {(!value.trim() || isListening) && showSpeech && (
          <TouchableOpacity
            onPress={onSpeech}
            style={[
              styles.speechButton, 
              { 
                backgroundColor: isListening 
                  ? theme.colors.error + '20' 
                  : theme.colors.success + '20' 
              }
            ]}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Icon 
              name={isListening ? "mic" : "mic-none"} 
              size={20} 
              color={isListening ? theme.colors.error : theme.colors.success} 
            />
          </TouchableOpacity>
        )}

        {showVoiceRecord && (
          <TouchableOpacity
            onPress={onVoiceRecord}
            style={[
              styles.voiceRecordButton, 
              { 
                backgroundColor: isRecording 
                  ? theme.colors.error + '20' 
                  : theme.colors.primary + '20' 
              }
            ]}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Icon 
              name={isRecording ? "fiber-manual-record" : "radio-button-unchecked"} 
              size={20} 
              color={isRecording ? theme.colors.error : theme.colors.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    marginHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 4 : 8,
    maxHeight: 120,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: Platform.OS === 'android' ? 8 : 6,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  voiceRecordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
