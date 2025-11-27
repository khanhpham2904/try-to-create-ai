import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

interface VoiceGenderSelectorProps {
  useFemaleVoice: boolean;
  onGenderChange: (useFemale: boolean) => void;
  style?: any;
}

export const VoiceGenderSelector: React.FC<VoiceGenderSelectorProps> = ({
  useFemaleVoice,
  onGenderChange,
  style,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {language === 'vi' ? 'Giọng nói:' : 'Voice:'}
      </Text>
      
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.genderButton,
            {
              backgroundColor: useFemaleVoice 
                ? theme.colors.primary 
                : theme.colors.surface,
              borderColor: useFemaleVoice 
                ? theme.colors.primary 
                : theme.colors.border,
            }
          ]}
          onPress={() => onGenderChange(true)}
          activeOpacity={0.7}
        >
          <Icon 
            name="face" 
            size={20} 
            color={useFemaleVoice ? 'white' : theme.colors.text} 
          />
          <Text 
            style={[
              styles.buttonText,
              { color: useFemaleVoice ? 'white' : theme.colors.text }
            ]}
          >
            {language === 'vi' ? 'Nữ' : 'Female'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderButton,
            {
              backgroundColor: !useFemaleVoice 
                ? theme.colors.primary 
                : theme.colors.surface,
              borderColor: !useFemaleVoice 
                ? theme.colors.primary 
                : theme.colors.border,
            }
          ]}
          onPress={() => onGenderChange(false)}
          activeOpacity={0.7}
        >
          <Icon 
            name="face" 
            size={20} 
            color={!useFemaleVoice ? 'white' : theme.colors.text} 
          />
          <Text 
            style={[
              styles.buttonText,
              { color: !useFemaleVoice ? 'white' : theme.colors.text }
            ]}
          >
            {language === 'vi' ? 'Nam' : 'Male'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});


