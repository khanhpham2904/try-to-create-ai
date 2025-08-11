import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

interface TestResult {
  url: string;
  label: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  time?: number;
}

export const AndroidConnectionDebug: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const urlsToTest: Array<{ url: string; label: string }> = [
    { url: 'http://10.0.2.2:8000', label: 'Android Emulator (10.0.2.2)' },
    { url: 'http://localhost:8000', label: 'Localhost' },
    { url: 'http://127.0.0.1:8000', label: '127.0.0.1' },
    { url: 'http://192.168.1.10:8000', label: 'Your Computer IP' },
  ];

  const testUrl = async (url: string, label: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      console.log(`Testing: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          url,
          label,
          status: 'success',
          message: `✅ Success! Response: ${JSON.stringify(data)}`,
          time: responseTime,
        };
      } else {
        return {
          url,
          label,
          status: 'error',
          message: `❌ HTTP ${response.status}: ${response.statusText}`,
          time: responseTime,
        };
      }
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '❌ Timeout (10 seconds)';
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }
      
      return {
        url,
        label,
        status: 'error',
        message: errorMessage,
        time: responseTime,
      };
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setResults([]);
    
    const newResults: TestResult[] = [];
    
    for (const { url, label } of urlsToTest) {
      // Add pending result
      const pendingResult: TestResult = {
        url,
        label,
        status: 'pending',
        message: 'Testing...',
      };
      newResults.push(pendingResult);
      setResults([...newResults]);
      
      // Test the URL
      const result = await testUrl(url, label);
      
      // Update the result
      const index = newResults.findIndex(r => r.url === url);
      if (index !== -1) {
        newResults[index] = result;
        setResults([...newResults]);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsTesting(false);
    
    // Show summary
    const workingUrls = newResults.filter(r => r.status === 'success');
    if (workingUrls.length > 0) {
      Alert.alert(
        'Connection Test Complete',
        `Found ${workingUrls.length} working URL(s)!\n\nUse this URL in your config:\n${workingUrls[0].url}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Connection Test Complete',
        'No working URLs found.\n\nMake sure:\n1. Backend is running\n2. You\'re using Android emulator\n3. Network security config is applied',
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '#34C759';
      case 'error': return '#FF3B30';
      case 'pending': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Android Connection Debug</Text>
      <Text style={styles.subtitle}>Testing all possible URLs for Android emulator</Text>
      
      <TouchableOpacity 
        style={[styles.button, isTesting && styles.buttonDisabled]}
        onPress={runAllTests}
        disabled={isTesting}
      >
        <Text style={styles.buttonText}>
          {isTesting ? 'Testing...' : 'Test All URLs'}
        </Text>
      </TouchableOpacity>
      
      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {results.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(result.status) }]} />
                <Text style={styles.resultLabel}>{result.label}</Text>
                {result.time && (
                  <Text style={styles.resultTime}>{result.time}ms</Text>
                )}
              </View>
              <Text style={styles.resultUrl}>{result.url}</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Troubleshooting Tips:</Text>
        <Text style={styles.infoText}>• 10.0.2.2 is the special IP for Android emulator</Text>
        <Text style={styles.infoText}>• localhost/127.0.0.1 might work on some emulators</Text>
        <Text style={styles.infoText}>• Your computer's IP works for physical devices</Text>
        <Text style={styles.infoText}>• Make sure backend is running: python start.py</Text>
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
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
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  resultItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
  },
  resultUrl: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 5,
  },
  resultMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 5,
  },
}); 