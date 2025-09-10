import { Platform } from 'react-native';

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================

export interface NetworkConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  reconnectDelayMax: number;
  maxReconnectAttempts: number;
}

export interface AndroidHeaders {
  'User-Agent': string;
  'Accept': string;
  'Connection': string;
  'Keep-Alive': string;
  'Cache-Control': string;
  'Pragma': string;
}

// ============================================================================
// PLATFORM-SPECIFIC CONFIGURATION
// ============================================================================

export const getNetworkConfig = (): NetworkConfig => ({
  timeout: Platform.OS === 'android' ? 45000 : 10000,
  retryAttempts: Platform.OS === 'android' ? 3 : 2,
  retryDelay: Platform.OS === 'android' ? 1000 : 1000,
  reconnectDelayMax: 5000,
  maxReconnectAttempts: 5,
});

export const getAndroidHeaders = (): Partial<AndroidHeaders> => 
  Platform.OS === 'android' ? {
    'User-Agent': 'ChatApp-Android/1.0',
    'Accept': 'application/json',
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=45, max=1000',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  } : {};

// ============================================================================
// SOCKET.IO CONFIGURATION
// ============================================================================

export const getSocketConfig = (): NetworkConfig => ({
  timeout: Platform.OS === 'android' ? 15000 : 10000,
  retryAttempts: Platform.OS === 'android' ? 3 : 2,
  retryDelay: Platform.OS === 'android' ? 1000 : 1000,
  reconnectDelayMax: 5000,
  maxReconnectAttempts: 5,
});

export const getSocketOptions = (token: string, userId: string) => ({
  transports: Platform.OS === 'android' ? ['websocket'] : ['websocket', 'polling'],
  auth: {
    token: token || 'anonymous',
    userId: userId
  },
  timeout: getSocketConfig().timeout,
  reconnection: true,
  reconnectionAttempts: getSocketConfig().maxReconnectAttempts,
  reconnectionDelay: getSocketConfig().retryDelay,
  reconnectionDelayMax: getSocketConfig().reconnectDelayMax,
  forceNew: true,
  // Android-specific options
  ...(Platform.OS === 'android' ? {
    upgrade: true,
    rememberUpgrade: true,
    secure: false,
  } : {}),
});

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const NETWORK_ERROR_MESSAGES = {
  TIMEOUT: 'Request timed out - server not responding',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  CONNECTION_FAILED: 'All connection attempts failed. Please check your network connection and ensure the backend server is running.',
  SOCKET_CONNECTION_FAILED: 'All Socket.IO URLs failed. Please check your connection.',
  UNKNOWN_ERROR: 'Unknown error occurred',
} as const;

// ============================================================================
// URL UTILITIES
// ============================================================================

export const URL_UTILS = {
  getSocketUrl: (baseUrl: string): string => {
    const cleanUrl = baseUrl.replace(/\/$/, '');
    return `${cleanUrl}/socket.io`;
  },

  isLocalhost: (url: string): boolean => {
    return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('10.0.2.2');
  },

  isLanIp: (url: string): boolean => {
    const lanPattern = /^192\.168\.\d+\.\d+/;
    return lanPattern.test(url);
  },

  getUrlType: (url: string): 'localhost' | 'lan' | 'production' => {
    if (URL_UTILS.isLocalhost(url)) return 'localhost';
    if (URL_UTILS.isLanIp(url)) return 'lan';
    return 'production';
  },
} as const;

// ============================================================================
// DEBUG CONFIGURATION
// ============================================================================

export const DEBUG_CONFIG = {
  enableNetworkLogs: __DEV__,
  enableSocketLogs: __DEV__,
  enableErrorLogs: true,
  enablePerformanceLogs: __DEV__,
} as const;
// ============================================================================
// PERFORMANCE CONFIGURATION
// ============================================================================

export const PERFORMANCE_CONFIG = {
  requestTimeout: getNetworkConfig().timeout,
  maxConcurrentRequests: Platform.OS === 'android' ? 3 : 5,
  retryBackoffMultiplier: 1.5,
  maxRetryBackoff: 10000,
} as const;

