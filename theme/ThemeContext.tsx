import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Message colors
  userMessage: string;
  botMessage: string;
  userMessageText: string;
  botMessageText: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Input colors
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
}

export interface Theme {
  type: ThemeType;
  colors: ThemeColors;
  fonts: {
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

const lightTheme: Theme = {
  type: 'light',
  colors: {
    primary: '#667EEA',
    primaryLight: '#764BA2',
    primaryDark: '#5A67D8',
    
    background: '#FAFAFA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    
    text: '#1A202C',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    
    border: '#E2E8F0',
    borderLight: '#F7FAFC',
    
    userMessage: '#667EEA',
    botMessage: '#F7FAFC',
    userMessageText: '#FFFFFF',
    botMessageText: '#1A202C',
    
    success: '#48BB78',
    warning: '#ED8936',
    error: '#F56565',
    info: '#4299E1',
    
    inputBackground: '#FFFFFF',
    inputBorder: '#E2E8F0',
    inputText: '#1A202C',
    inputPlaceholder: '#A0AEC0',
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
  },
};

const darkTheme: Theme = {
  type: 'dark',
  colors: {
    primary: '#8B5CF6', // Modern purple
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',
    
    background: '#0A0A0F', // Deeper black
    surface: '#111827', // Dark gray
    card: '#1F2937', // Slightly lighter gray
    
    text: '#F9FAFB', // Pure white
    textSecondary: '#D1D5DB', // Light gray
    textTertiary: '#9CA3AF', // Medium gray
    
    border: '#374151', // Dark border
    borderLight: '#4B5563', // Lighter border
    
    userMessage: '#8B5CF6', // Purple for user messages
    botMessage: '#1F2937', // Dark surface for bot messages
    userMessageText: '#FFFFFF',
    botMessageText: '#F9FAFB',
    
    success: '#10B981', // Modern green
    warning: '#F59E0B', // Modern orange
    error: '#EF4444', // Modern red
    info: '#3B82F6', // Modern blue
    
    inputBackground: '#1F2937',
    inputBorder: '#374151',
    inputText: '#F9FAFB',
    inputPlaceholder: '#9CA3AF',
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
  },
};

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeType, setThemeType] = useState<ThemeType>('light');

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    saveThemePreference();
  }, [themeType]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeType');
      if (savedTheme) {
        setThemeType(savedTheme as ThemeType);
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async () => {
    try {
      await AsyncStorage.setItem('themeType', themeType);
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const isSystemDark = (): boolean => {
    // For now, default to light mode
    // In a real app, you'd use Appearance API or similar
    return false;
  };

  const toggleTheme = () => {
    setThemeType(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isDark = themeType === 'dark' || (themeType === 'auto' && isSystemDark());
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{
      theme,
      themeType,
      setThemeType,
      toggleTheme,
      isDark,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 