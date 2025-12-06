/**
 * Image Generation Popup Component
 * Modal for generating images using Gemini API
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useImageGeneration } from '../hooks/useImageGeneration';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_CONFIG } from '../constants/config';

interface ImageGenerationPopupProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
  initialPrompt?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ImageGenerationPopup: React.FC<ImageGenerationPopupProps> = ({
  visible,
  onClose,
  userId,
  onImageGenerated,
  initialPrompt,
}) => {
  const { theme } = useTheme();
  const { generateImage, isLoading, error, lastGeneratedImage, clearError } = useImageGeneration(userId);
  
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Sync internal prompt state with initialPrompt when popup opens
  useEffect(() => {
    if (visible) {
      if (initialPrompt && initialPrompt.trim().length > 0) {
        setPrompt(initialPrompt);
      } else {
        setPrompt('');
      }
      setGeneratedImageUrl(null);
      clearError();
    }
  }, [visible, initialPrompt, clearError]);

  // Example prompts for quick selection
  const examplePrompts = [
    "A beautiful sunset over mountains",
    "A futuristic city at night",
    "A cute cat playing piano",
    "A serene Japanese garden",
    "A magical forest with glowing mushrooms",
    "A cyberpunk street scene",
    "A peaceful beach at dawn",
    "An abstract art piece with vibrant colors",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt to generate an image');
      return;
    }

    clearError();
    setGeneratedImageUrl(null);

    const result = await generateImage(prompt.trim());
    
    if (result && result.file_url) {
      // Construct full URL
      const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');
      const fullImageUrl = `${baseUrl}${result.file_url}`;
      setGeneratedImageUrl(fullImageUrl);
      
      // Callback if provided
      if (onImageGenerated) {
        onImageGenerated(fullImageUrl, prompt);
      }
    }
  };

  const handleExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  const handleClose = () => {
    setPrompt('');
    setGeneratedImageUrl(null);
    clearError();
    onClose();
  };

  const handleUseImage = () => {
    if (generatedImageUrl && onImageGenerated) {
      onImageGenerated(generatedImageUrl, prompt);
      handleClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <StatusBar 
        backgroundColor={theme.colors.surface}
        barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'}
        translucent={false}
        animated={false}
      />
      <SafeAreaView style={[styles.modalOverlay, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Icon name="image" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                🎨 Generate Image
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Create images with AI using Gemini
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Prompt Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Describe the image you want to create
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border || theme.colors.textSecondary + '30',
                }
              ]}
              placeholder="e.g., A beautiful sunset over mountains"
              placeholderTextColor={theme.colors.textSecondary}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={4}
              maxLength={500}
              editable={!isLoading}
            />
            <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
              {prompt.length}/500
            </Text>
          </View>

          {/* Example Prompts */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              💡 Example Prompts
            </Text>
            <View style={styles.examplePromptsContainer}>
              {examplePrompts.map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.examplePromptButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border || theme.colors.textSecondary + '30',
                    }
                  ]}
                  onPress={() => handleExamplePrompt(example)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.examplePromptText, { color: theme.colors.text }]}>
                    {example}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20' }]}>
              <Icon name="error-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Generated Image Display */}
          {generatedImageUrl && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                ✨ Generated Image
              </Text>
              <View style={[styles.imageContainer, { backgroundColor: theme.colors.surface }]}>
                <Image
                  source={{ uri: generatedImageUrl }}
                  style={styles.generatedImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Generating your image... This may take a moment.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border || theme.colors.textSecondary + '30' }]}>
          {generatedImageUrl ? (
            <>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                  Close
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleUseImage}
                activeOpacity={0.7}
              >
                <Icon name="check" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Use This Image</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.textSecondary }]}
                onPress={handleClose}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: isLoading || !prompt.trim() 
                      ? theme.colors.textSecondary 
                      : theme.colors.primary,
                    opacity: isLoading || !prompt.trim() ? 0.6 : 1,
                  }
                ]}
                onPress={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="auto-awesome" size={20} color="#fff" />
                )}
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Generating...' : 'Generate Image'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  examplePromptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  examplePromptButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  examplePromptText: {
    fontSize: 13,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatedImage: {
    width: SCREEN_WIDTH - 64,
    height: SCREEN_WIDTH - 64,
    borderRadius: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

