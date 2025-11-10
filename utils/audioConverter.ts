/**
 * Audio Converter Utility
 * Sử dụng ffmpeg.wasm để convert audio từ webm sang các format khác (wav, m4a)
 * Chỉ hoạt động trên web platform
 */

import { Platform } from 'react-native';

// Import ffmpeg types (sẽ được cài đặt)
let ffmpeg: any = null;
let ffmpegLoaded = false;

/**
 * Khởi tạo ffmpeg.wasm
 * Chỉ load khi cần thiết và chỉ trên web platform
 */
export const loadFFmpeg = async (): Promise<void> => {
  if (Platform.OS !== 'web') {
    console.log('🎵 FFmpeg chỉ hỗ trợ trên web platform');
    return;
  }

  if (ffmpegLoaded && ffmpeg) {
    console.log('🎵 FFmpeg đã được load');
    return;
  }

  try {
    // Dynamic import để chỉ load khi cần
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util');
    
    // Tạo instance ffmpeg mới
    ffmpeg = new FFmpeg();
    
    // Set log level
    ffmpeg.on('log', ({ message }) => {
      console.log('🎵 FFmpeg:', message);
    });

    // Load ffmpeg core từ CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegLoaded = true;
    console.log('✅ FFmpeg đã được load thành công');
  } catch (error) {
    console.error('❌ Lỗi khi load FFmpeg:', error);
    throw new Error('Không thể load FFmpeg. Vui lòng kiểm tra kết nối internet.');
  }
};

/**
 * Convert audio từ webm sang wav hoặc m4a
 * @param webmBlob - Blob chứa audio webm
 * @param outputFormat - Format đầu ra: 'wav' hoặc 'm4a' (mặc định: 'wav')
 * @returns Promise<Blob> - Blob chứa audio đã convert
 */
export const convertWebmToAudio = async (
  webmBlob: Blob,
  outputFormat: 'wav' | 'm4a' = 'wav'
): Promise<Blob> => {
  // Chỉ hoạt động trên web
  if (Platform.OS !== 'web') {
    throw new Error('Audio conversion chỉ hỗ trợ trên web platform');
  }

  try {
    // Load ffmpeg nếu chưa load
    await loadFFmpeg();

    if (!ffmpeg || !ffmpegLoaded) {
      throw new Error('FFmpeg chưa được load');
    }

    console.log(`🎵 Bắt đầu convert audio từ webm sang ${outputFormat}...`);
    console.log(`📦 Kích thước input: ${webmBlob.size} bytes`);

    // Xác định extension và mime type
    const extension = outputFormat === 'm4a' ? 'm4a' : 'wav';
    const mimeType = outputFormat === 'm4a' ? 'audio/mp4' : 'audio/wav';
    const inputFileName = 'input.webm';
    const outputFileName = `output.${extension}`;

    // Write input file vào ffmpeg filesystem
    const { fetchFile } = await import('@ffmpeg/util');
    const inputData = await fetchFile(webmBlob);
    await ffmpeg.writeFile(inputFileName, inputData);

    // Chạy ffmpeg command để convert
    // -i: input file
    // -acodec: audio codec (pcm_s16le cho wav, aac cho m4a)
    // -ar: sample rate (44100 Hz)
    // -ac: audio channels (1 = mono, 2 = stereo)
    const codec = outputFormat === 'm4a' ? 'aac' : 'pcm_s16le';
    const channels = 1; // Mono để giảm kích thước file
    
    console.log(`🎵 Đang convert với codec: ${codec}, channels: ${channels}`);
    
    await ffmpeg.exec([
      '-i', inputFileName,
      '-acodec', codec,
      '-ar', '44100',
      '-ac', channels.toString(),
      outputFileName
    ]);

    // Đọc output file từ ffmpeg filesystem
    const outputData = await ffmpeg.readFile(outputFileName);
    
    // Tạo Blob từ output data
    // outputData là Uint8Array từ ffmpeg
    const outputBlob = new Blob([outputData], { type: mimeType });
    
    console.log(`✅ Convert thành công! Kích thước output: ${outputBlob.size} bytes`);
    console.log(`📊 Tỷ lệ nén: ${((1 - outputBlob.size / webmBlob.size) * 100).toFixed(2)}%`);

    // Cleanup: xóa files khỏi ffmpeg filesystem
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (cleanupError) {
      console.warn('⚠️ Lỗi khi cleanup ffmpeg filesystem:', cleanupError);
    }

    return outputBlob;
  } catch (error) {
    console.error('❌ Lỗi khi convert audio:', error);
    throw error;
  }
};

/**
 * Convert audio từ webm sang wav (wrapper function)
 * @param webmBlob - Blob chứa audio webm
 * @returns Promise<Blob> - Blob chứa audio wav
 */
export const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
  return convertWebmToAudio(webmBlob, 'wav');
};

/**
 * Convert audio từ webm sang m4a (wrapper function)
 * @param webmBlob - Blob chứa audio webm
 * @returns Promise<Blob> - Blob chứa audio m4a
 */
export const convertWebmToM4a = async (webmBlob: Blob): Promise<Blob> => {
  return convertWebmToAudio(webmBlob, 'm4a');
};

/**
 * Kiểm tra xem audio conversion có sẵn không
 * @returns boolean - true nếu có thể sử dụng conversion
 */
export const isAudioConversionAvailable = (): boolean => {
  return Platform.OS === 'web';
};

/**
 * Convert Blob thành File với tên file cụ thể
 * @param blob - Blob cần convert
 * @param fileName - Tên file mong muốn
 * @param mimeType - MIME type của file
 * @returns File object
 */
export const blobToFile = (blob: Blob, fileName: string, mimeType: string): File => {
  return new File([blob], fileName, { type: mimeType });
};

/**
 * Convert webm Blob thành File wav
 * @param webmBlob - Blob chứa audio webm
 * @returns Promise<File> - File object chứa audio wav
 */
export const convertWebmToWavFile = async (webmBlob: Blob): Promise<File> => {
  const wavBlob = await convertWebmToWav(webmBlob);
  return blobToFile(wavBlob, 'recording.wav', 'audio/wav');
};

/**
 * Convert webm Blob thành File m4a
 * @param webmBlob - Blob chứa audio webm
 * @returns Promise<File> - File object chứa audio m4a
 */
export const convertWebmToM4aFile = async (webmBlob: Blob): Promise<File> => {
  const m4aBlob = await convertWebmToM4a(webmBlob);
  return blobToFile(m4aBlob, 'recording.m4a', 'audio/mp4');
};

