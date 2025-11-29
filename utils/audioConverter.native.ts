/**
 * Audio Converter Utility - Native (iOS/Android)
 * Stub implementation for mobile platforms
 * FFmpeg is only available on web platform
 */

import { Platform } from 'react-native';

/**
 * Khởi tạo ffmpeg.wasm (not available on native)
 */
export const loadFFmpeg = async (): Promise<void> => {
  console.log('🎵 FFmpeg chỉ hỗ trợ trên web platform');
  return;
};

/**
 * Convert audio từ webm sang wav hoặc m4a (not available on native)
 */
export const convertWebmToAudio = async (
  webmBlob: Blob,
  outputFormat: 'wav' | 'm4a' = 'wav'
): Promise<Blob> => {
  throw new Error('Audio conversion chỉ hỗ trợ trên web platform');
};

/**
 * Convert audio từ webm sang wav (wrapper function)
 */
export const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
  throw new Error('Audio conversion chỉ hỗ trợ trên web platform');
};

/**
 * Convert audio từ webm sang m4a (wrapper function)
 */
export const convertWebmToM4a = async (webmBlob: Blob): Promise<Blob> => {
  throw new Error('Audio conversion chỉ hỗ trợ trên web platform');
};

/**
 * Kiểm tra xem audio conversion có sẵn không
 */
export const isAudioConversionAvailable = (): boolean => {
  return false; // Not available on native platforms
};

/**
 * Convert Blob thành File với tên file cụ thể
 */
export const blobToFile = (blob: Blob, fileName: string, mimeType: string): File => {
  return new File([blob], fileName, { type: mimeType });
};

/**
 * Convert webm Blob thành File wav (not available on native)
 */
export const convertWebmToWavFile = async (webmBlob: Blob): Promise<File> => {
  throw new Error('Audio conversion chỉ hỗ trợ trên web platform');
};

/**
 * Convert webm Blob thành File m4a (not available on native)
 */
export const convertWebmToM4aFile = async (webmBlob: Blob): Promise<File> => {
  throw new Error('Audio conversion chỉ hỗ trợ trên web platform');
};

