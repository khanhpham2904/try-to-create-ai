import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, UserData } from '../services/api';
import { ERROR_MESSAGES } from '../constants/config';
import { handleWebLogout } from '../utils/webUtils';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearCache: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  clearCache: async () => {},
  isLoading: false,
});

// Mock users for demo (keeping for fallback)
const mockUsers = [
  { id: '1', email: 'demo@example.com', name: 'Demo User' },
  { id: '2', email: 'test@example.com', name: 'Test User' },
];

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Debug user state changes
  React.useEffect(() => {
    console.log('👤 User state changed:', user);
  }, [user]);

  const transformUserData = (userData: UserData): User => ({
    id: userData.id.toString(),
    email: userData.email,
    name: userData.full_name,
  });

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      console.log('🔐 Attempting login for:', email);
      
      // For demo purposes, allow mock login
      if (email === 'demo@example.com' && password === 'password123') {
        const mockUser = { id: '1', email: 'demo@example.com', name: 'Demo User' };
        setUser(mockUser);
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        console.log('✅ Mock login successful for:', email);
        return { success: true };
      }
      
      const response = await apiService.loginUser({ email, password });
      
      if (response.data && response.data.user) {
        const user = transformUserData(response.data.user);
        setUser(user);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        console.log('✅ Login successful for:', email);
        return { success: true };
      } else {
        console.log('❌ Login failed:', response.error);
        return { success: false, error: response.error || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: ERROR_MESSAGES.NETWORK_ERROR };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await apiService.registerUser({
        email,
        full_name: name,
        password,
      });

      if (response.data) {
        const newUser = transformUserData(response.data);
        setUser(newUser);
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
        return { success: true };
      } else {
        return { success: false, error: response.error || ERROR_MESSAGES.REGISTRATION_FAILED };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: ERROR_MESSAGES.NETWORK_ERROR };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out user...');
      console.log('Current user before logout:', user);
      console.log('Platform:', Platform.OS);
      
      // Clear user state first
      setUser(null);
      console.log('✅ User state cleared');
      
      // Clear ALL stored user data and cache
      await AsyncStorage.clear(); // This clears everything
      console.log('✅ AsyncStorage cleared');
      
      // Also clear specific items to be thorough
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_preferences');
      await AsyncStorage.removeItem('chat_history');
      await AsyncStorage.removeItem('user_settings');
      await AsyncStorage.removeItem('last_login');
      console.log('✅ Specific items removed');
      
      // Handle web-specific logout
      await handleWebLogout();
      console.log('✅ Web logout handled');
      
      console.log('✅ Logout successful - all cache cleared');
      console.log('User state after logout:', null);
      
      // Force a small delay to ensure state updates
      setTimeout(() => {
        console.log('🔄 Final user state check:', user);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Even if there's an error clearing storage, we should still clear the user state
      setUser(null);
    }
  };

  // Function to validate if user still exists in database
  const validateUserSession = async () => {
    if (!user) return false;
    
    try {
      console.log('🔍 Validating user session...');
      // Try to get chat statistics to see if user still exists
      const response = await apiService.getChatStatistics(Number(user.id));
      
      if (!response.data) {
        console.log('❌ User no longer exists in database, logging out...');
        await logout();
        return false;
      }
      
      console.log('✅ User session is valid');
      return true;
    } catch (error) {
      console.log('❌ Error validating user session, logging out...');
      await logout();
      return false;
    }
  };

  // Function to manually clear all cache
  const clearCache = async () => {
    try {
      console.log('🧹 Clearing all cache...');
      await AsyncStorage.clear();
      console.log('✅ Cache cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  };

  React.useEffect(() => {
    // Check for stored user on app start
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('📱 Found stored user:', parsedUser);
          
          // Validate the stored user against the database
          const isValid = await validateUserSession();
          if (isValid) {
            setUser(parsedUser);
          } else {
            console.log('🚫 Stored user is invalid, not setting user state');
          }
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        // If there's an error parsing stored user, clear it
        await AsyncStorage.removeItem('user');
      }
    };
    
    loadStoredUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, clearCache, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}; 