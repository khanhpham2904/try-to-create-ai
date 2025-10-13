import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export interface TextToSpeechHook {
  speak: (text: string, language?: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isAvailable: boolean;
  error: string | null;
}

export const useTextToSpeech = (): TextToSpeechHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if text-to-speech is available
    if (Platform.OS === 'web') {
      // Check for Web Speech API support
      if ('speechSynthesis' in window) {
        // Additional check for Chrome/Edge specific issues
        try {
          const utterance = new SpeechSynthesisUtterance('test');
          if (utterance) {
            setIsAvailable(true);
            console.log('✅ Web Speech Synthesis API is available');
          } else {
            setIsAvailable(false);
            console.log('❌ Web Speech Synthesis API not working properly');
          }
        } catch (e) {
          setIsAvailable(false);
          console.log('❌ Web Speech Synthesis API error:', e);
        }
      } else {
        setIsAvailable(false);
        console.log('❌ Web Speech Synthesis API not supported in this browser');
      }
    } else {
      // For mobile, we'll use expo-speech
      try {
        const Speech = require('expo-speech').default;
        if (Speech) {
          setIsAvailable(true);
          console.log('✅ Expo Speech module is available');
        } else {
          setIsAvailable(false);
          console.log('❌ Expo Speech module not available');
        }
      } catch (e) {
        setIsAvailable(false);
        console.log('❌ Expo Speech module not available (likely Expo Go)');
      }
    }
  }, []);

  const speak = useCallback(async (text: string, language: string = 'en-US') => {
    if (!isAvailable) {
      setError('Text-to-speech is not available on this device');
      return;
    }

    try {
      setIsSpeaking(true);
      setError(null);

      if (Platform.OS === 'web') {
        // Use Web Speech API
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        utterance.onend = () => {
          console.log('🔊 Web speech synthesis ended');
          setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
          console.error('❌ Web speech synthesis error:', event.error);
          setError(`Speech synthesis error: ${event.error}`);
          setIsSpeaking(false);
        };

        utterance.onstart = () => {
          console.log('🔊 Web speech synthesis started');
        };

        // Check if speechSynthesis is available and not speaking
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
        }

        speechSynthesis.speak(utterance);
        console.log('🔊 Started web speech synthesis with language:', language);
        
        // Fallback timeout in case onend doesn't fire
        setTimeout(() => {
          if (isSpeaking) {
            console.log('🔊 Web speech synthesis timeout - forcing end');
            setIsSpeaking(false);
          }
        }, 10000); // 10 second timeout

      } else {
        // Use Expo Speech
        const Speech = require('expo-speech').default;
        
        await Speech.speak(text, {
          language: language,
          pitch: 1.0,
          rate: 0.9,
          volume: 0.8,
          onDone: () => {
            setIsSpeaking(false);
          },
          onError: (error: any) => {
            console.error('❌ Expo speech synthesis error:', error);
            setError(`Speech synthesis error: ${error.message || error}`);
            setIsSpeaking(false);
          },
        });
        
        console.log('🔊 Started expo speech synthesis with language:', language);
      }
    } catch (err) {
      console.error('❌ Speech synthesis error:', err);
      setError(`Speech synthesis error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsSpeaking(false);
    }
  }, [isAvailable]);

  const stop = useCallback(() => {
    try {
      if (Platform.OS === 'web') {
        speechSynthesis.cancel();
      } else {
        const Speech = require('expo-speech').default;
        Speech.stop();
      }
      setIsSpeaking(false);
      setError(null);
    } catch (err) {
      console.error('❌ Error stopping speech:', err);
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isAvailable,
    error,
  };
};
