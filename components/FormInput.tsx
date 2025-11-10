import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  isValid?: boolean;
  showValidationIcon?: boolean;
  leftIcon?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  label, 
  error, 
  isValid,
  showValidationIcon = false,
  leftIcon,
  style, 
  ...textInputProps 
}) => {
  const { theme } = useTheme();

  const getBorderColor = () => {
    if (error) return theme.colors.error || '#ff4444';
    if (isValid && showValidationIcon) return theme.colors.success || '#4CAF50';
    return theme.colors.inputBorder;
  };

  const getInputBackgroundColor = () => {
    if (error) return (theme.colors.error || '#ff4444') + '10';
    if (isValid && showValidationIcon) return (theme.colors.success || '#4CAF50') + '10';
    return theme.colors.inputBackground;
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      <LinearGradient
        colors={theme.type === 'dark' 
          ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as [string, string, ...string[]]
          : ['rgba(255,255,255,0.8)', 'rgba(247,250,252,0.9)'] as [string, string, ...string[]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.inputContainer, { borderColor: getBorderColor(), borderWidth: 2 }]}
      >
        {leftIcon && (
          <View style={[styles.leftIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Icon name={leftIcon} size={20} color={theme.colors.primary} />
          </View>
        )}
        <TextInput
          style={[
            styles.authInput,
            {
              backgroundColor: 'transparent',
              borderColor: 'transparent', // Gradient handles the border
              color: theme.colors.inputText,
              paddingLeft: leftIcon ? 48 : 16,
            },
            style,
          ]}
          placeholderTextColor={theme.colors.inputPlaceholder}
          {...textInputProps}
        />
        {showValidationIcon && isValid && !error && (
          <View style={[styles.validationIcon, { backgroundColor: theme.colors.success || '#4CAF50' }]}>
            <Text style={styles.validationIconText}>✓</Text>
          </View>
        )}
      </LinearGradient>
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error || '#ff4444' }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  authInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    top: 15,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  validationIcon: {
    position: 'absolute',
    right: 12,
    top: 13,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validationIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
}); 