import { Platform } from 'react-native';
import { API_CONFIG, FALLBACK_URLS } from '../constants/config';
import { NETWORK_ERROR_MESSAGES } from '../constants/networkConfig';

export interface NetworkDiagnosticResult {
  isConnected: boolean;
  workingUrl: string | null;
  errors: string[];
  recommendations: string[];
  platform: string;
  deviceInfo: {
    platform: string;
    isEmulator: boolean;
    isPhysicalDevice: boolean;
  };
}

export class NetworkTroubleshooter {
  private static async testUrl(url: string, endpoint: string = '/health'): Promise<boolean> {
    try {
      const fullUrl = `${url}${endpoint}`;
      console.log(`🔍 Testing URL: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Add timeout for faster testing
        signal: AbortSignal.timeout(10000),
      });
      
      const isSuccess = response.ok;
      console.log(`✅ URL ${fullUrl}: ${isSuccess ? 'SUCCESS' : `FAILED (${response.status})`}`);
      return isSuccess;
    } catch (error) {
      console.log(`❌ URL ${url}${endpoint}: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  static async diagnoseNetwork(): Promise<NetworkDiagnosticResult> {
    console.log('🔍 Starting network diagnosis...');
    
    const result: NetworkDiagnosticResult = {
      isConnected: false,
      workingUrl: null,
      errors: [],
      recommendations: [],
      platform: Platform.OS,
      deviceInfo: {
        platform: Platform.OS,
        isEmulator: this.isEmulator(),
        isPhysicalDevice: !this.isEmulator(),
      },
    };

    // Test all URLs
    const urlsToTest = [API_CONFIG.BASE_URL, ...FALLBACK_URLS];
    let workingUrlFound = false;

    for (const url of urlsToTest) {
      const isWorking = await this.testUrl(url);
      if (isWorking && !workingUrlFound) {
        result.workingUrl = url;
        result.isConnected = true;
        workingUrlFound = true;
        console.log(`✅ Found working URL: ${url}`);
      }
    }

    // Generate recommendations based on results
    if (!result.isConnected) {
      result.errors.push('No working URLs found');
      result.recommendations = this.generateRecommendations(result);
    } else {
      result.recommendations.push('Network connection is working!');
    }

    return result;
  }

  private static isEmulator(): boolean {
    if (Platform.OS === 'android') {
      // Check if running on Android emulator
      return __DEV__ && (global as any).__METRO_GLOBAL_PREFIX__ !== undefined;
    }
    return false;
  }

  private static generateRecommendations(result: NetworkDiagnosticResult): string[] {
    const recommendations: string[] = [];

    // Platform-specific recommendations
    if (result.platform === 'android') {
      if (result.deviceInfo.isEmulator) {
        recommendations.push(
          '🔧 Android Emulator detected:',
          '  - Use 10.0.2.2:8000 to connect to your host machine',
          '  - Make sure your backend is running on localhost:8000',
          '  - Check that your backend accepts connections from all interfaces'
        );
      } else {
        recommendations.push(
          '📱 Physical Android Device detected:',
          '  - Make sure your device and computer are on the same WiFi network',
          '  - Use your computer\'s LAN IP address (e.g., 192.168.1.10:8000)',
          '  - Check your computer\'s firewall settings',
          '  - Ensure your backend is configured to accept external connections'
        );
      }
    } else if (result.platform === 'ios') {
      recommendations.push(
        '🍎 iOS Device detected:',
        '  - Use localhost:8000 for simulator',
        '  - Use your computer\'s LAN IP for physical device',
        '  - Check that your backend is running and accessible'
      );
    }

    // General recommendations
    recommendations.push(
      '🌐 General Network Troubleshooting:',
      '  1. Make sure your backend server is running',
      '  2. Check that the server is listening on the correct port (8000)',
      '  3. Verify the server accepts connections from all interfaces (0.0.0.0)',
      '  4. Check your firewall/antivirus settings',
      '  5. Try accessing the API from a web browser first'
    );

    // Backend configuration recommendations
    recommendations.push(
      '🔧 Backend Configuration:',
      '  - Ensure your FastAPI server is running with: uvicorn main:app --host 0.0.0.0 --port 8000',
      '  - Check that CORS is properly configured for your app',
      '  - Verify the API endpoints are working with a tool like Postman'
    );

    return recommendations;
  }

  static async testBackendHealth(): Promise<{ isHealthy: boolean; details: string }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          isHealthy: true,
          details: `Backend is healthy: ${JSON.stringify(data)}`,
        };
      } else {
        return {
          isHealthy: false,
          details: `Backend responded with status: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        isHealthy: false,
        details: `Backend health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  static getNetworkInfo(): {
    baseUrl: string;
    fallbackUrls: string[];
    platform: string;
    isDevelopment: boolean;
  } {
    return {
      baseUrl: API_CONFIG.BASE_URL,
      fallbackUrls: FALLBACK_URLS,
      platform: Platform.OS,
      isDevelopment: __DEV__,
    };
  }

  static async pingBackend(): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        return { success: true, latency };
      } else {
        return { 
          success: false, 
          latency, 
          error: `HTTP ${response.status}` 
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      return { 
        success: false, 
        latency, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export a simple diagnostic function for easy use
export const diagnoseNetwork = () => NetworkTroubleshooter.diagnoseNetwork();
export const testBackendHealth = () => NetworkTroubleshooter.testBackendHealth();
export const getNetworkInfo = () => NetworkTroubleshooter.getNetworkInfo();
export const pingBackend = () => NetworkTroubleshooter.pingBackend();
