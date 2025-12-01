import { useState, useCallback, useEffect } from 'react';
import { Platform, Alert } from 'react-native';

export interface SpeechToTextHook {
  isListening: boolean;
  recognizedText: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  clearText: () => void;
  isAvailable: boolean;
}

export const useSpeechToText = (languageCode: string = 'en-US'): SpeechToTextHook => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if speech recognition is available
    if (Platform.OS === 'web') {
      // Check for Web Speech API support
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // Additional check for HTTPS requirement
        if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
          setIsAvailable(true);
          console.log('✅ Web Speech API is available');
        } else {
          setIsAvailable(false);
          console.log('❌ Web Speech API requires HTTPS (except localhost)');
        }
      } else {
        setIsAvailable(false);
        console.log('❌ Web Speech API not supported in this browser');
      }
    } else {
      // For mobile, we'll try to load the Voice module
      try {
        const Voice = require('@react-native-voice/voice').default;
        if (Voice && typeof Voice.start === 'function') {
          setIsAvailable(true);
          console.log('✅ React Native Voice module is available');
        } else {
          setIsAvailable(false);
          console.log('❌ React Native Voice module not available - methods missing');
        }
      } catch (e) {
        setIsAvailable(false);
        console.log('❌ React Native Voice module not available (likely Expo Go):', (e as Error).message);
      }
    }
  }, []);

  const startListening = useCallback(async () => {
    if (Platform.OS === 'web') {
      // Use Web Speech API
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          throw new Error('Speech recognition not supported in this browser');
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = languageCode; // Use the provided language code

        recognition.onstart = () => {
          console.log(' Web speech recognition started with language:', languageCode);
          setIsListening(true);
          setError(null);
          setRecognizedText(''); // Clear any previous text
        };

        recognition.onresult = (event: any) => {
          console.log(' Web speech result:', event);
          let finalTranscript = '';

          // Only process final results to avoid continuous updates
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setRecognizedText(finalTranscript);
            setIsListening(false);
          }
        };

        recognition.onerror = (event: any) => {
          console.error(' Web speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognition.onend = () => {
          console.log(' Web speech recognition ended');
          setIsListening(false);
        };

        recognition.start();
        console.log(' Started web speech recognition with language:', languageCode);

      } catch (err) {
        console.error(' Web speech recognition error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Speech recognition not available';
        setError(errorMessage);
        setIsListening(false);
        setIsAvailable(false);
      }
    } else {
      // For mobile, try React Native Voice
      try {
        let Voice;
        try {
          Voice = require('@react-native-voice/voice').default;
        } catch (requireError) {
          throw new Error('Voice module cannot be loaded - this usually means you need to build a standalone app instead of using Expo Go');
        }
        
        if (!Voice) {
          throw new Error('Voice module not available - this usually means you need to build a standalone app instead of using Expo Go');
        }

        // Additional check: verify Voice.start is a function
        if (typeof Voice.start !== 'function') {
          throw new Error('Voice.start method is not available - Voice module may not be properly initialized');
        }

        setError(null);
        setRecognizedText('');
        
        // Set up event handlers with null checks
        if (Voice.onSpeechStart !== undefined) {
          Voice.onSpeechStart = () => {
            console.log(' Mobile speech started with language:', languageCode);
            setIsListening(true);
            setError(null);
          };
        }

        if (Voice.onSpeechResults !== undefined) {
          Voice.onSpeechResults = (e: any) => {
            console.log(' Mobile speech results:', e.value);
            if (e.value && e.value.length > 0) {
              setRecognizedText(e.value[0]);
            }
            setIsListening(false);
          };
        }

        if (Voice.onSpeechError !== undefined) {
          Voice.onSpeechError = (e: any) => {
            console.error(' Mobile speech error:', e.error);
            setError(e.error?.message || 'Speech recognition error');
            setIsListening(false);
          };
        }

        if (Voice.onSpeechEnd !== undefined) {
          Voice.onSpeechEnd = () => {
            console.log(' Mobile speech ended');
            setIsListening(false);
          };
        }

        // Call Voice.start with error handling
        try {
          await Voice.start(languageCode); // Use the provided language code
          console.log(' Started mobile speech recognition with language:', languageCode);
          setIsAvailable(true);
        } catch (startError: any) {
          // Handle specific error when Voice.start fails
          const startErrorMessage = startError instanceof Error ? startError.message : String(startError);
          if (startErrorMessage.includes('startSpeech') || startErrorMessage.includes('null')) {
            throw new Error('Voice module is not properly initialized. Please build a standalone app instead of using Expo Go.');
          }
          throw startError; // Re-throw other errors
        }
        
      } catch (err) {
        console.error(' Mobile speech recognition error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Speech recognition not available';
        setError(errorMessage);
        setIsListening(false);
        setIsAvailable(false);
        
        Alert.alert(
          'Speech Recognition Unavailable',
          `Speech recognition is not available: ${errorMessage}\n\nThis usually means you need to build a standalone app instead of using Expo Go.`,
          [{ text: 'OK' }]
        );
      }
    }
  }, [languageCode]);

  const stopListening = useCallback(async () => {
    if (Platform.OS === 'web') {
      // Web Speech API doesn't have a direct stop method
      // The recognition will stop automatically when it detects silence
      setIsListening(false);
    } else {
      // For mobile
      try {
        let Voice;
        try {
          Voice = require('@react-native-voice/voice').default;
        } catch (requireError) {
          console.error('❌ Error loading Voice module in stopListening:', requireError);
          setIsListening(false);
          return;
        }
        
        if (Voice && typeof Voice.stop === 'function') {
          await Voice.stop();
          console.log('✅ Stopped mobile speech recognition');
          setIsListening(false);
        } else {
          console.warn('⚠️ Voice.stop is not available');
          setIsListening(false);
        }
      } catch (err) {
        console.error('❌ Error stopping mobile speech recognition:', err);
        setIsListening(false);
      }
    }
  }, []);

  const clearText = useCallback(() => {
    setRecognizedText('');
    setError(null);
  }, []);

  return {
    isListening,
    recognizedText,
    error,
    startListening,
    stopListening,
    clearText,
    isAvailable,
  };
};
