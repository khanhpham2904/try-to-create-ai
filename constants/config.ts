import { Platform } from 'react-native';

// Get the appropriate base URL based on the environment and device
const getBaseUrl = () => {
  // Use Azure production URL
  return 'https://chat-app-aqhyf8fhaefzgvha.eastasia-01.azurewebsites.net';   
};

// Improved fallback URLs with proper protocols
export const FALLBACK_URLS = [
  'https://chat-app-aqhyf8fhaefzgvha.eastasia-01.azurewebsites.net', // for production
  'http://localhost:8000', // for local development
  'http://192.168.1.13:8000',    // Localhost for development
];

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  SOCKET_URL: getBaseUrl(), // Socket.IO uses the same base URL
  ENDPOINTS: {
    USERS: '/api/v1/users/',
    LOGIN: '/api/v1/users/login',
  },
  TIMEOUT: Platform.OS === 'android' ? 45000 : 10000, // Increased to 45 seconds for Android
  RETRY_ATTEMPTS: Platform.OS === 'android' ? 3 : 2, // Reduced retries but increased timeout
  OFFLINE_MODE: true, // Enable offline mode when backend is unavailable
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

export const ERROR_MESSAGES = {
  REQUIRED_FIELDS: 'Please fill in all fields',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  INVALID_EMAIL: 'Please enter a valid email address',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please check your connection.',
  OFFLINE_MODE: 'Running in offline mode. Some features may be limited.',
} as const; 