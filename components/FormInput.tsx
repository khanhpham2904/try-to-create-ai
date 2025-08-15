import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={[styles.leftIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Icon name={leftIcon} size={20} color={theme.colors.primary} />
          </View>
        )}
        <TextInput
          style={[
            styles.authInput,
            {
              backgroundColor: getInputBackgroundColor(),
              borderColor: getBorderColor(),
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
      </View>
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