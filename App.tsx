import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './components/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { AgentProvider } from './components/AgentContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AgentProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </AgentProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
