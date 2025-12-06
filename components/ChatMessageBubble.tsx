import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { AudioMessageBubble } from './AudioMessageBubble';
import { VoiceMessage } from './VoiceMessage';
import { ChatMessage } from '../services/api';
import { ImageDetailModal } from './ImageDetailModal';

interface ChatMessageBubbleProps {
  message: ChatMessage | string; // Support both ChatMessage object and string for backward compatibility
  response?: string; // Add response field for transcribed text
  isUser: boolean;
  timestamp?: string;
  isTyping?: boolean;
  agentId?: number;
  onPress?: () => void;
  animated?: boolean;
  isLegacyVoiceMessage?: boolean;
  onGenerateImageFromMessage?: (prompt: string) => void;
}

const ChatMessageBubbleComponent: React.FC<ChatMessageBubbleProps> = ({
  message,
  response,
  isUser,
  timestamp,
  isTyping = false,
  agentId,
  onPress,
  animated = true,
  isLegacyVoiceMessage = false,
  onGenerateImageFromMessage,
}) => {
  // Handle both string and ChatMessage object
  const messageText = typeof message === 'string' ? message : (isUser ? message.message : message.response);
  const messageObj = typeof message === 'string' ? null : message;
  const { theme } = useTheme();
  
  // State for image detail modal
  const [imageDetailVisible, setImageDetailVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageIsUrl, setSelectedImageIsUrl] = useState(true);
  
  // Debug: Log message object structure (removed for performance)
  if (false && messageObj && !isUser && __DEV__) {
    console.log('🔍 ChatMessageBubble - AI message object:', {
      id: messageObj.id,
      hasAudioResponseId: !!messageObj.audio_response_id,
      audioResponseId: messageObj.audio_response_id,
      hasAudioResponseData: !!messageObj.audio_response_data,
      audioResponseDataType: typeof messageObj.audio_response_data,
      audioResponseDataLength: messageObj.audio_response_data?.length,
      audioResponseFormat: messageObj.audio_response_format,
      audioResponseDuration: messageObj.audio_response_duration,
      hasResponse: !!messageObj.response,
      responseLength: messageObj.response?.length
    });
  }
  const slideAnim = useRef(new Animated.Value(isUser ? 50 : -50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Removed scaleAnim to prevent text blur
  // const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true, // Changed to true to match other animations
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Removed scale animation to prevent text blur
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
    }
  }, [animated, slideAnim, fadeAnim]);

  const getBubbleStyle = (): any => {
    const baseStyle = {
      maxWidth: '85%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: isUser ? 20 : 20,
      elevation: Platform.OS === 'android' ? (isUser ? 8 : 6) : (isUser ? 6 : 4),
      shadowColor: isUser ? theme.colors.primary : (theme.type === 'dark' ? '#8B5CF6' : '#667EEA'),
      shadowOffset: { width: 0, height: isUser ? 6 : 4 },
      shadowOpacity: isUser ? 0.25 : (theme.type === 'dark' ? 0.2 : 0.12),
      shadowRadius: isUser ? 12 : 8,
      marginVertical: 4,
      marginHorizontal: 16,
      alignSelf: isUser ? 'flex-end' as const : 'flex-start' as const,
    };

    if (isUser) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.userMessage,
        borderBottomLeftRadius: 4,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.05)',
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.botMessage,
        borderBottomRightRadius: 4,
        borderWidth: 0.3,
        borderColor: theme.type === 'dark' ? 'rgba(139, 92, 246, 0.02)' : 'rgba(102, 126, 234, 0.02)',
      };
    }
  };

  const getGradientColors = () => {
    if (isUser) {
      return theme.type === 'dark'
        ? ['#8B5CF6', '#7C3AED', '#111827'] as [string, string, ...string[]]
        : ['#667EEA', '#764BA2', '#FFFFFF'] as [string, string, ...string[]];
    } else {
      return theme.type === 'dark'
        ? [theme.colors.botMessage, theme.colors.surface] as [string, string, ...string[]]
        : ['#F7FAFC', '#FFFFFF'] as [string, string, ...string[]];
    }
  };

  const getTextColor = () => {
    if (isUser) {
      return 'white';
    } else {
      return theme.colors.text;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    
    const { formatTime: formatTimeUtil, getUserTimezone } = require('../utils/timeUtils');
    return formatTimeUtil(timeString, { 
      timeZone: getUserTimezone() 
    });
  };

  const isLink = (text: string) => {
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlRegex.test(text.trim());
  };

  const isImageMessage = (text: string) => {
    return text.startsWith('[IMAGE:') && text.includes(']');
  };

  const isDocumentMessage = (text: string) => {
    return text.startsWith('[DOCUMENT:') && text.includes(']');
  };

  const isVoiceMessage = (text: string) => {
    return text.startsWith('[VOICE_MESSAGE:') && text.includes(']');
  };

  const extractImageAndText = (text: string) => {
    if (!text) {
      return { hasImage: false, imageData: null, messageText: text, hasDocument: false, documentData: null };
    }
    
    // Check for [IMAGE:url] format
    if (isImageMessage(text)) {
      // More robust regex: match [IMAGE:...] and extract URL (stop at first ])
      // Use non-greedy match to stop at first ]
      const imageMatch = text.match(/^\[IMAGE:([^\]]+?)\]\s*(.*)$/s);
      if (imageMatch) {
        // Extract and clean the image URL/data
        let imageData = imageMatch[1].trim();
        // Remove any trailing ] that might have been included (safety check)
        imageData = imageData.replace(/\]+$/, '');
        // Remove any URL encoding artifacts (try-catch for invalid encoding)
        try {
          // Only decode if it contains encoded characters
          if (imageData.includes('%')) {
            imageData = decodeURIComponent(imageData);
          }
        } catch (e) {
          // If decode fails, use original
          console.warn('Failed to decode image URL:', e);
        }
        
        // Log for debugging
        console.log('Extracted image data:', imageData.substring(0, 100));
        
        // Check if imageData is a URL (starts with http) or base64 data
        const isUrl = imageData.startsWith('http://') || imageData.startsWith('https://') || imageData.startsWith('/');
        return {
          hasImage: true,
          imageData: imageData,
          imageIsUrl: isUrl, // Flag to indicate if it's a URL or base64
          messageText: imageMatch[2].trim(),
          hasDocument: false,
          documentData: null
        };
      }
    }
    
    // Fallback: Check if text contains image URL pattern (for backward compatibility)
    // Pattern: /uploads/generated_images/... or http://.../uploads/generated_images/...
    const imageUrlPattern = /(?:https?:\/\/[^\s]+)?\/uploads\/generated_images\/[^\s\)]+/i;
    const urlMatch = text.match(imageUrlPattern);
    if (urlMatch) {
      let imageUrl = urlMatch[0];
      // If URL doesn't start with http, prepend base URL from config
      if (imageUrl.startsWith('/')) {
        const { API_CONFIG } = require('../constants/config');
        const baseUrl = API_CONFIG.BASE_URL || 'http://localhost:8000';
        imageUrl = `${baseUrl}${imageUrl}`;
      }
      // Remove the URL from text
      const messageText = text.replace(imageUrlPattern, '').trim();
      return {
        hasImage: true,
        imageData: imageUrl,
        imageIsUrl: true,
        messageText: messageText,
        hasDocument: false,
        documentData: null
      };
    }
    
    if (isDocumentMessage(text)) {
      const documentMatch = text.match(/^\[DOCUMENT:([^\]]+)\]\s*(.*)$/);
      if (documentMatch) {
        const filename = documentMatch[1];
        const content = documentMatch[2];
        
        // Split content to separate document content from user message
        const lines = content.split('\n');
        const documentContent = lines.length > 1 ? lines.slice(0, -1).join('\n') : content;
        const userMessage = lines.length > 1 ? lines[lines.length - 1] : '';
        
        return {
          hasImage: false,
          imageData: null,
          messageText: userMessage,
          hasDocument: true,
          documentData: {
            filename,
            content: documentContent,
            preview: documentContent.substring(0, 200) + (documentContent.length > 200 ? '...' : '')
          }
        };
      }
    }
    
    return { hasImage: false, imageData: null, messageText: text, hasDocument: false, documentData: null };
  };

  const handlePress = (text: string) => {
    if (isLink(text)) {
      const url = text.startsWith('http') ? text : `https://${text}`;
      Linking.openURL(url).catch(err => console.error('An error occurred', err));
    } else if (onPress) {
      onPress();
    }
  };

  const handleImagePress = (imageData: string, imageIsUrl: boolean) => {
    setSelectedImageUri(imageData);
    setSelectedImageIsUrl(imageIsUrl);
    setImageDetailVisible(true);
  };

  const handleCloseImageDetail = () => {
    setImageDetailVisible(false);
    setSelectedImageUri(null);
  };

  // Debug logging removed for performance - only log in extreme cases

  // Check if message has audio_response_id (AI audio response) - PRIORITY
  // Check both audio_response_id and audio_response_data (must be non-empty string)
  const hasAudioResponse = messageObj && 
    messageObj.audio_response_id && 
    messageObj.audio_response_data && 
    typeof messageObj.audio_response_data === 'string' &&
    messageObj.audio_response_data.trim().length > 0 &&
    !isUser;
  
  if (hasAudioResponse) {
    console.log('🎵 AI Audio response detected (database format):', {
      audio_response_id: messageObj.audio_response_id,
      duration: messageObj.audio_response_duration,
      audio_format: messageObj.audio_response_format,
      audio_response_data_length: messageObj.audio_response_data.length,
      isUser
    });
    
    // Convert base64 audio response data to data URI
    // Backend always generates WAV format for audio_response, so use 'wav' explicitly
    const audioFormat = messageObj.audio_response_format?.toLowerCase() === 'wav' ? 'wav' : 'wav';
    const audioUri = `data:audio/${audioFormat};base64,${messageObj.audio_response_data}`;
    console.log('🎵 Created audio URI with format:', audioFormat, 'from audio_response_format:', messageObj.audio_response_format);
    
    return (
      <VoiceMessage
        audioUri={audioUri}
        duration={messageObj.audio_response_duration || 0}
        isUser={false} // AI responses are always bot messages
        timestamp={timestamp}
        animated={animated}
        transcribedText={messageObj.response} // Use response as transcribed text
      />
    );
  } else if (messageObj && messageObj.audio_response_id && !isUser) {
    // Log when audio_response_id exists but audio_response_data is missing
    console.warn('⚠️ audio_response_id exists but audio_response_data is missing or empty:', {
      audio_response_id: messageObj.audio_response_id,
      audio_response_data: messageObj.audio_response_data,
      audio_response_data_type: typeof messageObj.audio_response_data,
      audio_response_data_length: messageObj.audio_response_data?.length
    });
  }

  // Check if message has audio_id (user voice message) - SECONDARY
  if (messageObj && messageObj.audio_id && messageObj.audio_data && isUser) {
    console.log('🎵 User Audio message detected (database format):', {
      audio_id: messageObj.audio_id,
      duration: messageObj.duration,
      audio_format: messageObj.audio_format,
      isUser
    });
    
    // Convert base64 audio data to data URI
    const audioUri = `data:audio/${messageObj.audio_format || 'webm'};base64,${messageObj.audio_data}`;
    
    return (
      <VoiceMessage
        audioUri={audioUri}
        duration={messageObj.duration || 0}
        isUser={true} // User messages are always user messages
        timestamp={timestamp}
        animated={animated}
        transcribedText={messageObj.message} // Use message as transcribed text
      />
    );
  }

  // Legacy voice message format (fallback for old messages)
  if (isVoiceMessage(messageText)) {
    const voiceMatch = messageText.match(/^\[VOICE_MESSAGE:([^:]+):(\d+)\]$/);
    if (voiceMatch) {
      const audioUri = voiceMatch[1];
      const duration = parseInt(voiceMatch[2]);
      
      console.log('🎵 Legacy voice message detected:', {
        message: messageText,
        audioUri,
        duration,
        isUser
      });
      
      return (
        <VoiceMessage
          audioUri={audioUri}
          duration={duration}
          isUser={isUser} // Keep original isUser value for legacy messages
          timestamp={timestamp}
          animated={animated}
          transcribedText={response} // Pass transcribed text from response field
        />
      );
    }
  }

  // If this is a voice message (legacy), render the audio bubble instead
  if (isLegacyVoiceMessage) {
    return (
      <AudioMessageBubble
        message={messageText}
        isUser={isUser}
        timestamp={timestamp}
        isTyping={isTyping}
        agentId={agentId}
        onPress={onPress}
        animated={animated}
        duration={3} // Default duration, could be passed as prop
      />
    );
  }

  const Bubble = () => (
    <Animated.View
      style={animated && {
        opacity: fadeAnim,
        transform: [
          { translateX: slideAnim },
          // Remove scale transform to prevent text blur
          // { scale: scaleAnim },
        ],
      }}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={getBubbleStyle()}
      >
      <View style={styles.messageContainer}>
        {/* Typing indicator */}
        {isTyping ? (
          <View style={styles.typingContainer}>
            <View style={[styles.typingDot, { backgroundColor: getTextColor() }]} />
            <View style={[styles.typingDot, { backgroundColor: getTextColor() }]} />
            <View style={[styles.typingDot, { backgroundColor: getTextColor() }]} />
          </View>
        ) : (
          <>
            {!isUser && agentId && (
              <Text 
                style={[styles.agentLabel, { color: theme.colors.primary, fontSize: 12 }]}
                allowFontScaling={false}
              >
                Agent #{agentId}
              </Text>
            )}
            
            {(() => {
              const { hasImage, imageData, imageIsUrl, messageText: extractedText, hasDocument, documentData } = extractImageAndText(messageText);
              
              return (
                <>
                  {hasImage && imageData && (
                    <TouchableOpacity
                      style={styles.imageContainer}
                      onPress={() => handleImagePress(imageData, imageIsUrl)}
                      activeOpacity={0.8}
                    >
                      {Platform.OS === 'web' ? (
                        // Use HTML img tag for web platform (better compatibility)
                        <img
                          src={imageIsUrl ? imageData : `data:image/jpeg;base64,${imageData}`}
                          alt="Generated image"
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            objectFit: 'contain',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleImagePress(imageData, imageIsUrl);
                          }}
                          onError={(e) => {
                            console.error('Image load error (web):', e);
                            console.error('Image URL:', imageData);
                            // Try to open in new tab as fallback
                            if (imageIsUrl) {
                              console.log('Attempting to open image in new tab as fallback');
                              window.open(imageData, '_blank');
                            }
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully (web):', imageData);
                          }}
                        />
                      ) : (
                        // Use React Native Image for mobile platforms
                        <Image
                          source={imageIsUrl 
                            ? { uri: imageData } // URL image
                            : { uri: `data:image/jpeg;base64,${imageData}` } // Base64 image
                          }
                          style={styles.messageImage}
                          resizeMode="contain"
                          onError={(error) => {
                            console.error('Image load error:', error.nativeEvent?.error || error);
                            console.error('Image URL:', imageData);
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', imageData);
                          }}
                          onLoadStart={() => {
                            console.log('Image loading started:', imageData);
                          }}
                        />
                      )}
                      {/* Overlay icon to indicate image is clickable */}
                      <View style={styles.imageOverlay}>
                        <Icon name="zoom-in" size={24} color="#fff" />
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {hasDocument && documentData && (
                    <View style={[styles.documentContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                      <View style={styles.documentHeader}>
                        <Icon name="description" size={20} color={theme.colors.primary} />
                        <Text 
                          style={[styles.documentFilename, { color: theme.colors.text }]}
                          allowFontScaling={false}
                        >
                          {documentData.filename}
                        </Text>
                      </View>
                      <Text 
                        style={[styles.documentPreview, { color: theme.colors.textSecondary }]}
                        allowFontScaling={false}
                      >
                        {documentData.preview}
                      </Text>
                    </View>
                  )}
                  
                  {extractedText && (
                    <>
                      {isLink(extractedText) ? (
                        <TouchableOpacity onPress={() => handlePress(extractedText)}>
                          <Text 
                            style={[styles.messageText, { color: isUser ? 'white' : theme.colors.info, textDecorationLine: 'underline' }]}
                            allowFontScaling={false}
                          >
                            {extractedText}
                          </Text>
                          <View style={styles.linkIcon}>
                            <Icon name="open-in-new" size={12} color={isUser ? 'white' : theme.colors.info} />
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Text 
                          style={[styles.messageText, { color: getTextColor() }]}
                          allowFontScaling={false}
                        >
                          {extractedText}
                        </Text>
                      )}

                      {/* Image generation quick action - COMMENTED OUT */}
                      {/* {onGenerateImageFromMessage && !isTyping && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => onGenerateImageFromMessage(extractedText)}
                            activeOpacity={0.8}
                          >
                            <Icon
                              name="auto-awesome"
                              size={14}
                              color={isUser ? '#FDE68A' : theme.colors.primary}
                            />
                            <Text
                              style={[
                                styles.actionButtonText,
                                { color: isUser ? '#FDE68A' : theme.colors.primary },
                              ]}
                              allowFontScaling={false}
                            >
                              {isUser ? 'Generate Image' : 'Use as Image Prompt'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )} */}
                    </>
                  )}
                </>
              );
            })()}
            
            {timestamp && (
              <Text 
                style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.textTertiary }]}
                allowFontScaling={false}
              >
                {formatTime(timestamp)}
              </Text>
            )}
          </>
        )}
      </View>
    </LinearGradient>
    </Animated.View>
  );

  return (
    <>
      {onPress && !isLink(messageText) ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <Bubble />
        </TouchableOpacity>
      ) : (
        <Bubble />
      )}
      
      {/* Image Detail Modal */}
      <ImageDetailModal
        visible={imageDetailVisible}
        imageUri={selectedImageUri}
        imageIsUrl={selectedImageIsUrl}
        onClose={handleCloseImageDetail}
        title="Image Detail"
      />
    </>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 2,
  },
  agentLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    // Prevent text blur on Android/iOS
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end' as const,
    opacity: 0.7,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  linkIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  imageContainer: {
    marginVertical: 8,
    alignItems: 'center',
    position: 'relative',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  documentContainer: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 250,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentFilename: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  documentPreview: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});

// Memoize component to prevent unnecessary re-renders
export const ChatMessageBubble = React.memo(ChatMessageBubbleComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  if (typeof prevProps.message === 'object' && typeof nextProps.message === 'object') {
    return (
      prevProps.message?.id === nextProps.message?.id &&
      prevProps.response === nextProps.response &&
      prevProps.isUser === nextProps.isUser &&
      prevProps.timestamp === nextProps.timestamp &&
      prevProps.isTyping === nextProps.isTyping &&
      prevProps.agentId === nextProps.agentId &&
      prevProps.animated === nextProps.animated &&
      prevProps.isLegacyVoiceMessage === nextProps.isLegacyVoiceMessage &&
      prevProps.onGenerateImageFromMessage === nextProps.onGenerateImageFromMessage
    );
  }
  return (
    prevProps.message === nextProps.message &&
    prevProps.response === nextProps.response &&
    prevProps.isUser === nextProps.isUser &&
    prevProps.timestamp === nextProps.timestamp &&
    prevProps.isTyping === nextProps.isTyping &&
    prevProps.agentId === nextProps.agentId &&
    prevProps.animated === nextProps.animated &&
    prevProps.isLegacyVoiceMessage === nextProps.isLegacyVoiceMessage &&
    prevProps.onGenerateImageFromMessage === nextProps.onGenerateImageFromMessage
  );
});
