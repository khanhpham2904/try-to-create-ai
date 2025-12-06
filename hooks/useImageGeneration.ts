/**
 * Custom hook for image generation using Gemini API
 * Provides easy-to-use interface for generating images in React components
 */

import { useState, useCallback } from 'react';
import { apiService, ImageGenerationResponse } from '../services/api';

interface UseImageGenerationResult {
  generateImage: (prompt: string, model?: string) => Promise<ImageGenerationResponse | null>;
  isLoading: boolean;
  error: string | null;
  lastGeneratedImage: ImageGenerationResponse | null;
  clearError: () => void;
}

/**
 * Hook for generating images using Gemini API
 * 
 * @param userId - User ID for image generation
 * @returns Object with generateImage function, loading state, error, and last generated image
 * 
 * @example
 * ```tsx
 * const { generateImage, isLoading, error, lastGeneratedImage } = useImageGeneration(user.id);
 * 
 * const handleGenerate = async () => {
 *   const result = await generateImage("A beautiful sunset over mountains");
 *   if (result) {
 *     console.log("Image generated:", result.file_url);
 *   }
 * };
 * ```
 */
export const useImageGeneration = (userId: number): UseImageGenerationResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<ImageGenerationResponse | null>(null);

  const generateImage = useCallback(async (
    prompt: string,
    model?: string
  ): Promise<ImageGenerationResponse | null> => {
    if (!prompt || prompt.trim().length === 0) {
      setError('Prompt cannot be empty');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.generateImage(userId, prompt, model);

      if (response.status === 200 && response.data) {
        if (response.data.success) {
          setLastGeneratedImage(response.data);
          return response.data;
        } else {
          const errorMsg = response.data.error || 'Failed to generate image';
          setError(errorMsg);
          return null;
        }
      } else {
        const errorMsg = response.error || 'Failed to generate image';
        setError(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generateImage,
    isLoading,
    error,
    lastGeneratedImage,
    clearError,
  };
};

