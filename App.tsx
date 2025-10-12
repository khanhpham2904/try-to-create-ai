import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './components/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { AgentProvider } from './components/AgentContext';
import { UserProfileProvider } from './components/UserProfileContext';
import AppNavigator from './navigation/AppNavigator';
import { checkNativeModules } from './src/init';

export default function App() {
  useEffect(() => {
    // Check native modules availability on app start
    checkNativeModules();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AgentProvider>
            <UserProfileProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </UserProfileProvider>
          </AgentProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
