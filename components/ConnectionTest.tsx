import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { API_CONFIG } from '../constants/config';

export const ConnectionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string>('');

  const testUrl = async (url: string, label: string) => {
    try {
      console.log(`Testing ${label}: ${url}`);
      
      // Test health check
      const healthResponse = await fetch(`${url}/health`);
      const healthData = await healthResponse.json();
      
      if (healthResponse.ok) {
        return `✅ ${label} (${url}): SUCCESS\n`;
      } else {
        return `❌ ${label} (${url}): Failed - Status ${healthResponse.status}\n`;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `❌ ${label} (${url}): ${errorMessage}\n`;
    }
  };

  const testAllConnections = async () => {
    setIsLoading(true);
    setResults('Testing all possible connections...\n\n');
    
    const urlsToTest = [
      { url: 'http://localhost:8000', label: 'Localhost' },
      { url: 'http://127.0.0.1:8000', label: '127.0.0.1' },
      { url: '192.168.1.10:8000', label: 'Your IP' },
      { url: 'http://10.0.2.2:8000', label: 'Android Emulator' },
    ];
    
    let allResults = '';
    
    for (const { url, label } of urlsToTest) {
      const result = await testUrl(url, label);
      allResults += result;
      setResults(allResults);
    }
    
    // Test registration with the working URL
    const workingUrl = urlsToTest.find(async ({ url }) => {
      try {
        const response = await fetch(`${url}/health`);
        return response.ok;
      } catch {
        return false;
      }
    });
    
    if (workingUrl) {
      allResults += `\n🎉 Found working URL: ${workingUrl.url}\n`;
      allResults += `Use this URL in your config: ${workingUrl.url}\n`;
    } else {
      allResults += `\n❌ No working URLs found!\n`;
      allResults += `Make sure your backend is running: python start.py\n`;
    }
    
    setResults(allResults);
    setIsLoading(false);
  };

  const testCurrentConfig = async () => {
    setIsLoading(true);
    setResults('Testing current configuration...\n\n');
    
    try {
      console.log('Testing current config:', API_CONFIG.BASE_URL);
      
      // Test health check
      const healthResponse = await fetch(`${API_CONFIG.BASE_URL}/health`);
      const healthData = await healthResponse.json();
      
      if (healthResponse.ok) {
        setResults(`✅ Current config works!\nURL: ${API_CONFIG.BASE_URL}\nResponse: ${JSON.stringify(healthData)}\n`);
        
        // Test registration
        const testUser = {
          email: `test${Date.now()}@example.com`,
          full_name: 'Test User',
          password: 'testpass123'
        };
        
        const registerResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testUser)
        });
        
        if (registerResponse.ok) {
          const userData = await registerResponse.json();
          setResults(prev => prev + `\n✅ Registration successful!\nUser ID: ${userData.id}\n`);
        } else {
          const errorText = await registerResponse.text();
          setResults(prev => prev + `\n❌ Registration failed!\nStatus: ${registerResponse.status}\nError: ${errorText}\n`);
        }
        
      } else {
        setResults(`❌ Current config failed!\nURL: ${API_CONFIG.BASE_URL}\nStatus: ${healthResponse.status}\n`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults(`❌ Current config failed!\nURL: ${API_CONFIG.BASE_URL}\nError: ${errorMessage}\n`);
      
      Alert.alert(
        'Connection Failed',
        `Failed to connect to ${API_CONFIG.BASE_URL}\n\nError: ${errorMessage}\n\nTry testing all connections to find a working URL.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      <Text style={styles.url}>Current URL: {API_CONFIG.BASE_URL}</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testCurrentConfig}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Current Config'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]}
        onPress={testAllConnections}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test All URLs'}
        </Text>
      </TouchableOpacity>
      
      {results ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Test Results:</Text>
          <Text style={styles.resultText}>{results}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  url: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 