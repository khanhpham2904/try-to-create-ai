import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  Image,
  Keyboard,
} from 'react-native';
import { Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgent } from '../components/AgentContext';
import { useUserProfile } from '../components/UserProfileContext';
import { apiService, ChatMessage, Agent, ChatMessageWithAgent, Chatbox, ChatboxWithMessages } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AgentCustomizer from '../components/AgentCustomizer';
import AgentSelector from '../components/AgentSelector';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { SpeechToTextButton } from '../components/SpeechToTextButton';
import { SpeechDiagnostic } from '../components/SpeechDiagnostic';
import { ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedStatusIndicator } from '../components/AnimatedStatusIndicator';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { ChatInput } from '../components/ChatInput';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { VoiceChatDemo } from '../components/VoiceChatDemo';
import { WebVoiceDiagnostic } from '../components/WebVoiceDiagnostic';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { InlineVoiceRecorder } from '../components/InlineVoiceRecorder';
import { VoiceMessage } from '../components/VoiceMessage';

interface ChatScreenProps {
  navigation: any;
  route?: any;
}

const { width } = Dimensions.get('window');

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { selectedAgent, setSelectedAgent } = useAgent();
  const { recordInteraction, personalizationData } = useUserProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showAgentCustomizer, setShowAgentCustomizer] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessageWithAgent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allChatboxes, setAllChatboxes] = useState<Chatbox[]>([]);
  const [selectedChatbox, setSelectedChatbox] = useState<Chatbox | null>(null);
  const [isInChat, setIsInChat] = useState(false);
  const [isRefreshingConversations, setIsRefreshingConversations] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Add ref to track sending state to prevent race conditions
  const isSendingRef = useRef(false);
  // Add debounce ref to prevent rapid tapping
  const lastSendTimeRef = useRef(0);
  
  // File import modal state
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileModalContent, setFileModalContent] = useState('');
  const [fileModalName, setFileModalName] = useState('');
  
  // Image/Document import state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileType, setSelectedFileType] = useState<'image' | 'document'>('image');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Attachment options mini table state
  const [attachmentOptionsVisible, setAttachmentOptionsVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [messageRefreshKey, setMessageRefreshKey] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [shouldPreserveScroll, setShouldPreserveScroll] = useState(false);
  const [isRestoringScroll, setIsRestoringScroll] = useState(false);
  const [showSpeechTest, setShowSpeechTest] = useState(false);
  const [lastNewChatTimestamp, setLastNewChatTimestamp] = useState<number | null>(null);
  const [lastExistingChatTimestamp, setLastExistingChatTimestamp] = useState<number | null>(null);
  
  // Voice chat mode state (removed - now using inline voice recording)
  const [showVoiceDemo, setShowVoiceDemo] = useState(false);
  const [showWebDiagnostic, setShowWebDiagnostic] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showInlineVoiceRecorder, setShowInlineVoiceRecorder] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  
  // Note: TTS is now handled by backend gTTS - no frontend TTS needed
  
  // Speech-to-text hook
  const { 
    startListening, 
    stopListening, 
    isListening, 
    recognizedText, 
    error: sttError, 
    isAvailable: sttAvailable 
  } = useSpeechToText(language === 'vi' ? 'vi-VN' : 'en-US');

  // Handle recognized speech text
  useEffect(() => {
    if (recognizedText && recognizedText.trim()) {
      console.log('🎤 Speech recognized:', recognizedText);
      setInputMessage(recognizedText.trim());
      // Auto-send recognized text
      setTimeout(() => {
        sendMessage();
      }, 500); // Small delay to ensure message is set
    }
  }, [recognizedText]);

  // Function to force message refresh
  const forceMessageRefresh = () => {
    setMessageRefreshKey((prev: number) => prev + 1);
    // Preserve scroll position during refresh
    setShouldPreserveScroll(true);
    setTimeout(() => {
      setMessages((prev: ChatMessage[]) => [...prev]);
    }, 50);
  };

  useEffect(() => {
    if (user) {
      loadChatHistory();
      loadAllAgents();
      loadAllChatboxes();
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [user]);

  // Add focus effect to restore layout when returning from modals
  useEffect(() => {
    if (!showAgentSelector && !showAgentCustomizer && isInChat) {
      // Restore layout when modals close
      setTimeout(() => {
        setMessageRefreshKey((prev: number) => prev + 1);
      }, 150);
    }
  }, [showAgentSelector, showAgentCustomizer, isInChat]);

  // Handle navigation parameters (chatboxId from HomeScreen)
  useEffect(() => {
    if (route?.params?.chatboxId && user) {
      const chatboxId = route.params.chatboxId;
      const chatbox = allChatboxes.find((c: any) => c.id === chatboxId);
      if (chatbox) {
        console.log('🔄 Setting chatbox mode:', chatbox.title, 'ID:', chatbox.id);
        setSelectedChatbox(chatbox);
        setSelectedAgent(null);
        setIsInChat(true);
        // Clear any previous timestamps
        setLastNewChatTimestamp(null);
        setLastExistingChatTimestamp(null);
      }
    } else if (route?.params?.generalChat && route?.params?.newChatTimestamp && user) {
      // New general chat mode - explicitly requested from HomeScreen with timestamp
      const currentTimestamp = route.params.newChatTimestamp;
      if (lastNewChatTimestamp !== currentTimestamp) {
        console.log('🔄 Setting new general chat mode with timestamp:', currentTimestamp);
        setSelectedChatbox(null);
        setSelectedAgent(null);
        setMessages([]); // Clear messages to start fresh
        setIsInChat(true);
        setLastNewChatTimestamp(currentTimestamp); // Store timestamp to prevent re-processing
        setLastExistingChatTimestamp(null); // Clear existing chat timestamp
      }
    } else if (route?.params?.existingGeneralChat && route?.params?.existingChatTimestamp && user) {
      // Existing general chat mode - load existing general messages with timestamp
      const currentTimestamp = route.params.existingChatTimestamp;
      if (lastExistingChatTimestamp !== currentTimestamp) {
        console.log('🔄 Setting existing general chat mode with timestamp:', currentTimestamp);
        setSelectedChatbox(null);
        setSelectedAgent(null);
        setIsInChat(true);
        setLastExistingChatTimestamp(currentTimestamp); // Store timestamp to prevent re-processing
        setLastNewChatTimestamp(null); // Clear new chat timestamp
        // Don't clear messages here - let loadMessages() load existing messages
      }
    } else if (route?.params?.agent && user) {
      // Agent-specific chat mode
      const agent = route.params.agent;
      console.log('🔄 Setting agent mode:', agent.name, 'ID:', agent.id);
      setSelectedAgent(agent);
      setSelectedChatbox(null);
      setIsInChat(true);
      // Clear any previous timestamps
      setLastNewChatTimestamp(null);
      setLastExistingChatTimestamp(null);
    }
    // Note: Removed auto-loading general chat when route.params is empty
    // This prevents unwanted auto-loading when returning to ChatScreen
  }, [route?.params, user, allChatboxes]);

  // Reset timestamps when route params change
  useEffect(() => {
    if (!route?.params?.generalChat && !route?.params?.existingGeneralChat && !route?.params?.chatboxId && !route?.params?.agent) {
      console.log('🔄 Clearing timestamps - no relevant route params');
      setLastNewChatTimestamp(null);
      setLastExistingChatTimestamp(null);
    }
  }, [route?.params?.generalChat, route?.params?.existingGeneralChat, route?.params?.chatboxId, route?.params?.agent]);

  // Cleanup effect when component unmounts or when leaving chat mode
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      console.log('🧹 ChatScreen cleanup - clearing state');
      setMessages([]);
      setSelectedAgent(null);
      setSelectedChatbox(null);
      setIsInChat(false);
      setLastNewChatTimestamp(null);
      setLastExistingChatTimestamp(null);
    };
  }, []);

  // Reload messages when screen comes into focus (when rejoining app)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log('🔄 Screen focused, reloading data...');
        
        // If we're not in chat mode, refresh conversation list with loading indicator
        if (!isInChat) {
          console.log('🔄 Refreshing conversation list...');
          setIsRefreshingConversations(true);
          Promise.all([loadChatHistory(), loadAllAgents(), loadAllChatboxes()]).finally(() => {
            setIsRefreshingConversations(false);
          });
        } else {
          // If in chat mode, just reload data without showing loading indicator
          loadChatHistory();
          loadAllAgents();
          loadAllChatboxes();
        }
      }
    }, [user, isInChat])
  );

  // Cleanup typing messages when switching agents or component unmounts
  useEffect(() => {
    const cleanupTypingMessages = () => {
      setMessages((prev: ChatMessage[]) => {
        const typingMessagePattern = language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...';
        const hasTypingMessages = prev.some((msg: ChatMessage) => 
          msg.response && msg.response.includes(typingMessagePattern)
        );
        
        if (hasTypingMessages) {
          console.log('🧹 Cleaning up stuck typing messages');
          return prev.filter((msg: ChatMessage) => 
            !msg.response || !msg.response.includes(typingMessagePattern)
          );
        }
        return prev;
      });
    };

    // Clean up when switching agents
    if (selectedAgent) {
      cleanupTypingMessages();
    }

    // Clean up on component unmount
    return cleanupTypingMessages;
  }, [selectedAgent, language]);

  // Monitor messages state changes for debugging
  useEffect(() => {
    console.log('📱 Messages state updated:', messages.length, 'messages');
    messages.forEach((msg, index) => {
      console.log(`📱 Message ${index}:`, { id: msg.id, response: msg.response?.substring(0, 50) });
    });
  }, [messages]);

  // Handle scroll position restoration when messages change
  useEffect(() => {
    if (shouldPreserveScroll && scrollPosition > 0 && messages.length > 0 && !isRestoringScroll) {
      console.log('📱 useEffect: Restoring scroll position to:', scrollPosition);
      setIsRestoringScroll(true);
      
      // Use multiple attempts to ensure scroll restoration works
      const restoreScroll = () => {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ y: scrollPosition, animated: false });
            console.log('📱 Scroll restoration attempted');
          }
        }, 50);
        
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ y: scrollPosition, animated: false });
            console.log('📱 Scroll restoration retry');
          }
        }, 150);
        
        setTimeout(() => {
          setShouldPreserveScroll(false);
          setIsRestoringScroll(false);
          console.log('📱 Scroll restoration completed');
        }, 200);
      };
      
      restoreScroll();
    }
  }, [messages, shouldPreserveScroll, scrollPosition, isRestoringScroll]);

  // Load messages when selectedAgent or selectedChatbox changes
  useEffect(() => {
    if (user && isInChat) {
      if (selectedAgent) {
        console.log('🔄 Selected agent changed, loading messages for:', selectedAgent.name, 'ID:', selectedAgent.id);
      } else if (selectedChatbox) {
        console.log('🔄 Selected chatbox changed, loading messages for:', selectedChatbox.title, 'ID:', selectedChatbox.id);
      } else {
        console.log('🔄 General chat mode - loading general messages');
      }
      loadMessages();
    }
  }, [selectedAgent?.id, selectedChatbox?.id, user?.id, isInChat]); // Use IDs instead of objects to prevent unnecessary re-renders

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      // Load ALL messages (both agent and chatbox messages) to build conversation list
      const response = await apiService.getUserMessages(Number(user.id), 0, 100);
      if (response.data?.messages) {
        setChatHistory(response.data.messages as ChatMessageWithAgent[]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const loadAllAgents = async () => {
    if (!user) return;

    try {
      const response = await apiService.getAgents(Number(user.id));
      if (response.data) {
        setAllAgents(response.data);
      }
    } catch (error) {
      console.error('Error loading all agents:', error);
    }
  };

  const loadAllChatboxes = async () => {
    if (!user) return;

    try {
      const response = await apiService.getUserChatboxes(Number(user.id));
      if (response.data) {
        setAllChatboxes(response.data.chatboxes);
      }
    } catch (error) {
      console.error('Error loading chatboxes:', error);
    }
  };

  const loadMessages = async () => {
    if (!user) {
      console.log('❌ Cannot load messages: No user');
      return;
    }
    
    if (!isInChat) {
      console.log('❌ Cannot load messages: Not in chat mode');
      return;
    }
    
    console.log('📜 loadMessages called - Current state:', {
      selectedAgent: selectedAgent?.name || 'none',
      selectedChatbox: selectedChatbox?.title || 'none',
      isInChat,
      lastNewChatTimestamp,
      lastExistingChatTimestamp,
      routeParams: route?.params
    });
    
    setIsLoading(true);
    try {
      if (selectedAgent) {
        console.log('📜 Loading messages for user:', user.id, 'with agent:', selectedAgent.id, 'name:', selectedAgent.name);
        // Add a small delay to show loading state when switching agents
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = await apiService.getUserMessages(Number(user.id), 0, 100, selectedAgent.id);
          console.log('📜 Messages response:', response);
        
        if (response.data && response.data.messages) {
          console.log('📜 Found', response.data.messages.length, 'messages');
          
          
          // Process messages to ensure proper format
          let processedMessages = response.data.messages.map((msg: any) => ({
            id: msg.id,
            message: msg.message || '',
            response: msg.response || '',
            user_id: msg.user_id,
            agent_id: msg.agent_id,
            chatbox_id: msg.chatbox_id,
            audio_id: msg.audio_id,
            audio_data: msg.audio_data,
            duration: msg.duration,
            audio_format: msg.audio_format,
            audio_response_id: msg.audio_response_id,
            audio_response_data: msg.audio_response_data,
            audio_response_duration: msg.audio_response_duration,
            audio_response_format: msg.audio_response_format,
            created_at: msg.created_at,
          }));
          
          // Remove duplicate messages by ID
          const uniqueMessages = processedMessages.filter((msg, index, self) => 
            index === self.findIndex(m => m.id === msg.id)
          );
          
          console.log('📜 Removed duplicates:', processedMessages.length - uniqueMessages.length, 'duplicates found');
          
          // Sort messages chronologically (oldest first, newest last)
          const sortedMessages = uniqueMessages.sort((a, b) => {
            const dateA = getSafeTimestamp(a.created_at);
            const dateB = getSafeTimestamp(b.created_at);
            return dateA - dateB; // Ascending order (oldest first)
          });
          
          console.log('📜 Processed and sorted messages:', sortedMessages);
          // Replace messages to prevent duplicates when loading chat history
          setMessages(sortedMessages);
        } else {
          console.log('📜 No messages found or invalid response format');
          setMessages([]);
        }
      } else if (selectedChatbox) {
        console.log('📜 Loading messages for user:', user.id, 'with chatbox:', selectedChatbox.id, 'title:', selectedChatbox.title);
        // Add a small delay to show loading state when switching chatboxes
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const response = await apiService.getChatboxWithMessages(selectedChatbox.id, Number(user.id), 0, 100);
        console.log('📜 Chatbox messages response:', response);
        
        if (response.data && response.data.messages) {
          console.log('📜 Found', response.data.messages.length, 'messages in chatbox');
          // Process messages to ensure proper format with audio data
          let processedMessages = response.data.messages.map((msg: any) => ({
            id: msg.id,
            message: msg.message || '',
            response: msg.response || '',
            user_id: msg.user_id,
            agent_id: msg.agent_id,
            chatbox_id: msg.chatbox_id,
            audio_id: msg.audio_id,
            audio_data: msg.audio_data,
            duration: msg.duration,
            audio_format: msg.audio_format,
            created_at: msg.created_at,
          }));
          
          // Remove duplicate messages by ID
          const uniqueMessages = processedMessages.filter((msg, index, self) => 
            index === self.findIndex(m => m.id === msg.id)
          );
          
          console.log('📜 Removed chatbox duplicates:', processedMessages.length - uniqueMessages.length, 'duplicates found');
          
          // Sort messages chronologically (oldest first, newest last)
          const sortedMessages = uniqueMessages.sort((a, b) => {
            const dateA = getSafeTimestamp(a.created_at);
            const dateB = getSafeTimestamp(b.created_at);
            return dateA - dateB; // Ascending order (oldest first)
          });
          
          console.log('📜 Processed and sorted chatbox messages:', sortedMessages);
          // Replace messages to prevent duplicates when loading chat history
          setMessages(sortedMessages);
        } else {
          console.log('📜 No messages found in chatbox or invalid response format');
          setMessages([]);
        }
      } else {
        // General chat mode - no specific agent or chatbox selected
        console.log('📜 General chat mode for user:', user.id, '(no specific agent or chatbox)');
        
        // Check if this is a fresh general chat (requested via generalChat parameter with timestamp)
        if (route?.params?.generalChat && route?.params?.newChatTimestamp && lastNewChatTimestamp === route.params.newChatTimestamp) {
          console.log('📜 Fresh general chat requested - starting with empty messages');
          setMessages([]);
        } else if (route?.params?.existingGeneralChat && route?.params?.existingChatTimestamp && lastExistingChatTimestamp === route.params.existingChatTimestamp) {
          console.log('📜 Existing general chat requested - loading existing messages');
          // Load existing general messages
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const response = await apiService.getUserMessages(Number(user.id), 0, 100);
          console.log('📜 General messages response:', response);
          
          if (response.data && response.data.messages) {
            // Filter for general messages (no agent_id and no chatbox_id)
            const generalMessages = response.data.messages.filter((msg: any) => 
              !msg.agent_id && !msg.chatbox_id
            );
            
            console.log('📜 Found', generalMessages.length, 'general messages');
            
            // Process messages to ensure proper format
            let processedMessages = generalMessages.map((msg: any) => ({
              id: msg.id,
              message: msg.message || '',
              response: msg.response || '',
              user_id: msg.user_id,
              agent_id: msg.agent_id,
              chatbox_id: msg.chatbox_id,
              audio_id: msg.audio_id,
              audio_data: msg.audio_data,
              duration: msg.duration,
              audio_format: msg.audio_format,
              created_at: msg.created_at,
            }));
            
            // Remove duplicate messages by ID
            const uniqueMessages = processedMessages.filter((msg, index, self) => 
              index === self.findIndex(m => m.id === msg.id)
            );
            
            console.log('📜 Removed general duplicates:', processedMessages.length - uniqueMessages.length, 'duplicates found');
            
            // Sort messages chronologically (oldest first, newest last)
            const sortedMessages = uniqueMessages.sort((a, b) => {
              const dateA = getSafeTimestamp(a.created_at);
              const dateB = getSafeTimestamp(b.created_at);
              return dateA - dateB; // Ascending order (oldest first)
            });
            
            console.log('📜 Processed and sorted general messages:', sortedMessages);
            // Replace messages to prevent duplicates when loading chat history
            setMessages(sortedMessages);
          } else {
            console.log('📜 No general messages found or invalid response format');
            setMessages([]);
          }
        } else {
          console.log('📜 Normal general chat mode - loading existing messages');
          // Load existing general messages (for normal general chat)
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const response = await apiService.getUserMessages(Number(user.id), 0, 100);
          console.log('📜 General messages response:', response);
          
          if (response.data && response.data.messages) {
            // Filter for general messages (no agent_id and no chatbox_id)
            const generalMessages = response.data.messages.filter((msg: any) => 
              !msg.agent_id && !msg.chatbox_id
            );
            
            console.log('📜 Found', generalMessages.length, 'general messages');
            
            // Process messages to ensure proper format
            let processedMessages = generalMessages.map((msg: any) => ({
              id: msg.id,
              message: msg.message || '',
              response: msg.response || '',
              user_id: msg.user_id,
              agent_id: msg.agent_id,
              chatbox_id: msg.chatbox_id,
              audio_id: msg.audio_id,
              audio_data: msg.audio_data,
              duration: msg.duration,
              audio_format: msg.audio_format,
              created_at: msg.created_at,
            }));
            
            // Remove duplicate messages by ID
            const uniqueMessages = processedMessages.filter((msg, index, self) => 
              index === self.findIndex(m => m.id === msg.id)
            );
            
            console.log('📜 Removed general duplicates:', processedMessages.length - uniqueMessages.length, 'duplicates found');
            
            // Sort messages chronologically (oldest first, newest last)
            const sortedMessages = uniqueMessages.sort((a, b) => {
              const dateA = getSafeTimestamp(a.created_at);
              const dateB = getSafeTimestamp(b.created_at);
              return dateA - dateB; // Ascending order (oldest first)
            });
            
            console.log('📜 Processed and sorted general messages:', sortedMessages);
            // Replace messages to prevent duplicates when loading chat history
            setMessages(sortedMessages);
          } else {
            console.log('📜 No general messages found or invalid response format');
            setMessages([]);
          }
        }
      }
      
      // Only scroll to top when switching conversations, not on refresh
      if (!shouldPreserveScroll) {
        console.log('📜 Switching conversation - scrolling to top');
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }, 100);
      } else if (shouldPreserveScroll) {
        console.log('📜 Preserving scroll position during refresh');
        // Scroll position will be restored by onContentSizeChange/onLayout
      } else {
        console.log('📜 No special scroll behavior needed');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error', 
        language === 'vi' ? 'Không thể tải tin nhắn' : 'Failed to load messages'
      );
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    // Use ref-based check to prevent race conditions
    if (!user || !inputMessage.trim() || isSendingRef.current) {
      console.log('🚫 Message send blocked:', {
        noUser: !user,
        noMessage: !inputMessage.trim(),
        isSending: isSendingRef.current
      });
      return;
    }

    // Add debounce protection (minimum 1 second between sends)
    const now = Date.now();
    if (now - lastSendTimeRef.current < 1000) {
      console.log('🚫 Message send blocked by debounce:', now - lastSendTimeRef.current, 'ms since last send');
      return;
    }
    lastSendTimeRef.current = now;

    const messageText = inputMessage.trim();
    console.log('💬 Starting message send:', messageText);
    
    // Set both state and ref immediately to prevent race conditions
    setIsSending(true);
    isSendingRef.current = true;
    setInputMessage('');
    
    // Add user message immediately for real-time experience
    const userMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      message: messageText,
      response: '', // No response for user messages
      user_id: Number(user.id),
      created_at: new Date().toISOString(),
    };

    // Store the typing message ID for later removal
    const typingMessageId = Date.now() + 1;

    // Add user message immediately for real-time experience
    setMessages(prev => {
      // Check for duplicate messages by ID
      const isDuplicate = prev.some(msg => msg.id === userMessage.id);
      if (isDuplicate) {
        console.log('🔄 Duplicate user message detected, skipping:', userMessage.id);
        return prev;
      }
      return [...prev, userMessage];
    });
    
    // Add a temporary "AI is typing" message
    const typingMessage: ChatMessage = {
      id: typingMessageId, // Use stored ID
      message: '',
      response: language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...',
      user_id: Number(user.id),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => {
      // Check for duplicate typing messages
      const isDuplicate = prev.some(msg => msg.id === typingMessage.id);
      if (isDuplicate) {
        console.log('🔄 Duplicate typing message detected, skipping:', typingMessage.id);
        return prev;
      }
      return [...prev, typingMessage];
    });
    
    // Safety timeout: remove typing message after 30 seconds if it's still there
    const typingTimeout = setTimeout(() => {
      setMessages(prev => {
        const typingMessagePattern = language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...';
        const hasTypingMessage = prev.some(msg => 
          msg.response && msg.response.includes(typingMessagePattern)
        );
        
        if (hasTypingMessage) {
          console.log('⏰ Safety timeout: Removing stuck typing message');
          return prev.filter(msg => 
            !msg.response || !msg.response.includes(typingMessagePattern)
          );
        }
        return prev;
      });
    }, 15000); // Reduced to 15 seconds for faster feedback
    
    // Scroll to bottom to show the new message
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    console.log('💬 ChatScreen: Sending message with agent:', selectedAgent?.id, 'chatbox:', selectedChatbox?.id);

    try {
      // Test backend connection first
      console.log('🔍 Testing backend connection...');
      const healthCheck = await apiService.testConnection();
      console.log('🔍 Health check result:', healthCheck);
      
      const response = await apiService.sendMessage(
        Number(user.id), 
        messageText, 
        undefined, 
        selectedAgent?.id
      );
      console.log('💬 ChatScreen: Message response:', response);
      console.log('💬 Response status:', response.status);
      console.log('💬 Response error:', response.error);
      
      if (response.error) {
        console.error('❌ API returned error:', response.error);
        throw new Error(response.error);
      }
      
      if (response.data) {
        console.log('💬 Response data structure:', JSON.stringify(response.data, null, 2));
        console.log('💬 Response data type:', typeof response.data);
        console.log('💬 Response data keys:', Object.keys(response.data));
        
        // Check if response data is empty or null
        if (!response.data || Object.keys(response.data).length === 0) {
          console.error('❌ Empty response data received');
          throw new Error('Empty response data from server');
        }
        
        // Validate response structure with proper null checks
        if (!response.data || !response.data.id || !response.data.response) {
          console.error('❌ Invalid response structure:', response.data);
          // Create a fallback response for debugging
          const fallbackMessage: ChatMessage = {
            id: Date.now() + 3,
            message: '',
            response: '⚠️ Debug: Backend response was invalid. Please check server logs.',
            user_id: Number(user.id),
            created_at: new Date().toISOString(),
          };
          
          setMessages(prev => {
            const typingMessagePattern = language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...';
            const filteredMessages = prev.filter(msg => 
              !msg.response || !msg.response.includes(typingMessagePattern)
            );
            return [...filteredMessages, fallbackMessage];
          });
          return;
        }
        
        // Create separate AI message to show on the left (keep user message)
        const aiMessage: ChatMessage = {
          id: (response.data && response.data.id) || Date.now() + 2, // Fallback ID if not provided
          message: '', // Empty message field for AI
          response: (response.data && response.data.response) || 'No response received', // AI response with fallback
          user_id: Number(user.id), // Same user_id but with response
          created_at: (response.data && response.data.created_at) || new Date().toISOString(), // Fallback timestamp
          agent_id: (response.data && response.data.agent_id) || selectedAgent?.id, // Include agent ID
          audio_response_id: response.data?.audio_response_id,
          audio_response_data: response.data?.audio_response_data,
          audio_response_duration: response.data?.audio_response_duration,
          audio_response_format: response.data?.audio_response_format,
        };
        
        console.log('💬 Created AI message:', aiMessage);

        // Replace the typing message with the actual AI response
        setMessages(prev => {
          console.log('🔄 Removing typing message with ID:', typingMessageId);
          console.log('🔄 Current messages before filter:', prev.map(m => ({ id: m.id, message: m.message, response: m.response, fileName: m.fileName })));
          
          // Remove typing message by ID and content pattern
          const typingMessagePattern = language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...';
          const filteredMessages = prev.filter(msg => {
            // Remove by ID (most reliable)
            if (msg.id === typingMessageId) {
              console.log('🔄 Removing typing message by ID:', msg.id, msg.response);
              return false;
            }
            // Remove by content pattern (fallback) - only if it's actually a typing message
            if (msg.response && msg.response.includes(typingMessagePattern)) {
              console.log('🔄 Removing typing message by content pattern:', msg.id, msg.response);
              return false;
            }
            // Keep all other messages (including user messages with empty message field)
            console.log('🔄 Keeping message:', msg.id, msg.message, msg.fileName);
            return true;
          });
          
          console.log('🔄 Messages after filter:', filteredMessages.length);
          console.log('🔄 Filtered messages:', filteredMessages.map(m => ({ id: m.id, message: m.message, fileName: m.fileName })));
          console.log('🔄 Adding AI message:', aiMessage.id, aiMessage.response);
          
          // Create new array with proper structure to ensure React re-renders
          const newMessages = [...filteredMessages];
          newMessages.push(aiMessage);
          
          console.log('🔄 Final messages array:', newMessages.map(m => ({ id: m.id, message: m.message, response: m.response, fileName: m.fileName })));
          
          // Force a re-render by ensuring the array is completely new
          return newMessages;
        });
        
        // Force immediate UI refresh
        forceMessageRefresh();
        
        // No need for additional refresh since message is already in local state
        console.log('✅ Message handling completed without server refresh');
        
        // Scroll to the bottom to show the AI response with a longer delay for longer responses
        const responseLength = (response.data && response.data.response) ? response.data.response.length : 0;
        const scrollDelay = responseLength > 1000 ? 500 : 300;
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, scrollDelay);
        
        // Log response length for debugging
        console.log(`💬 AI Response length: ${responseLength} characters`);
        
        // Note: TTS is now handled by backend gTTS - no need for frontend TTS
        console.log('🔊 Text message processed - TTS handled by backend gTTS');
      }
      
      // Clear the typing timeout since we got a response
      clearTimeout(typingTimeout);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Handle specific error cases
      let errorMessage = language === 'vi' ? 'Không thể gửi tin nhắn' : 'Failed to send message';
      
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status === 409) {
          errorMessage = language === 'vi' ? 'Tin nhắn đã được gửi trước đó' : 'Message was already sent';
          console.log('🔄 Duplicate message detected, keeping user message');
          // For duplicate messages, keep the user message but remove typing message
          setMessages(prev => {
            const typingMessagePattern = language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...';
            return prev.filter(msg => 
              !msg.response || !msg.response.includes(typingMessagePattern)
            );
          });
          // Don't show alert for duplicate messages - just silently handle it
          clearTimeout(typingTimeout);
          setIsSending(false);
          isSendingRef.current = false;
          return;
        } else if (status === 429) {
          errorMessage = language === 'vi' ? 'Gửi tin nhắn quá nhanh, vui lòng đợi một chút' : 'Sending messages too quickly, please wait a moment';
        }
      }
      
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error', 
        errorMessage
      );
      // Remove the temporary messages on error
      setMessages(prev => {
        console.log('❌ Error cleanup: Removing temporary messages');
        const typingMessagePattern = language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...';
        
        const filteredMessages = prev.filter(msg => {
          // Remove user message and typing message by ID
          if (msg.id === userMessage.id || msg.id === typingMessageId) {
            console.log('❌ Removing temporary message by ID:', msg.id);
            return false;
          }
          // Remove typing messages by content pattern
          if (msg.response && msg.response.includes(typingMessagePattern)) {
            console.log('❌ Removing typing message by content:', msg.id);
            return false;
          }
          return true;
        });
        
        console.log('❌ Messages after error cleanup:', filteredMessages.length);
        return filteredMessages;
      });
      setInputMessage(messageText);
      
      // Clear the typing timeout on error
      clearTimeout(typingTimeout);
    } finally {
      setIsSending(false);
      isSendingRef.current = false; // Reset ref after sending
      
      // Record interaction for personalization
      try {
        await recordInteraction();
        console.log('✅ Interaction recorded for personalization');
      } catch (error) {
        console.warn('⚠️ Failed to record interaction:', error);
      }
    }
  };

  const handleDeleteChatbox = async () => {
    if (!selectedChatbox || !user) return;

    Alert.alert(
      language === 'vi' ? 'Xóa Cuộc Trò Chuyện' : 'Delete Conversation',
      language === 'vi' 
        ? `Bạn có chắc chắn muốn xóa cuộc trò chuyện "${selectedChatbox.title}"?\n\nĐiều này sẽ xóa vĩnh viễn tất cả tin nhắn trong cuộc trò chuyện này.`
        : `Are you sure you want to delete the conversation "${selectedChatbox.title}"?\n\nThis will permanently delete all messages in this conversation.`,
      [
        {
          text: language === 'vi' ? 'Hủy' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'vi' ? 'Xóa' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteChatbox(selectedChatbox.id, Number(user.id));
              
              Alert.alert(
                language === 'vi' ? 'Thành công' : 'Success',
                language === 'vi' ? 'Cuộc trò chuyện đã được xóa' : 'Conversation deleted successfully'
              );
              
              // Clear the current chatbox and go back to conversations
              setSelectedChatbox(null);
              setSelectedAgent(null);
              setIsInChat(false);
              setMessages([]);
              
              // Refresh data
              loadChatHistory();
              loadAllChatboxes();
              
            } catch (error) {
              console.error('Error deleting chatbox:', error);
              Alert.alert(
                language === 'vi' ? 'Lỗi' : 'Error',
                language === 'vi' ? 'Không thể xóa cuộc trò chuyện. Vui lòng thử lại' : 'Failed to delete conversation. Please try again'
              );
            }
          },
        },
      ]
    );
  };

  const deleteMessage = async (messageId: number) => {
    if (!user) return;

    Alert.alert(
      language === 'vi' ? 'Xóa Tin Nhắn' : 'Delete Message',
      language === 'vi' ? 'Bạn có chắc chắn muốn xóa tin nhắn này không?' : 'Are you sure you want to delete this message?',
      [
        { text: language === 'vi' ? 'Hủy' : 'Cancel', style: 'cancel' },
        {
          text: language === 'vi' ? 'Xóa' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteMessage(messageId, Number(user.id));
              setMessages(prev => prev.filter(msg => msg.id !== messageId));
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert(
                language === 'vi' ? 'Lỗi' : 'Error', 
                language === 'vi' ? 'Không thể xóa tin nhắn' : 'Failed to delete message'
              );
            }
          },
        },
      ]
    );
  };


  const handleImportTxt = async () => {
    console.log('📁 handleImportTxt called - Button pressed!');
    console.log('📁 Current state - isInChat:', isInChat);
    console.log('📁 Platform:', Platform.OS);
    
    // Ensure in chat mode
    if (!isInChat) {
      console.log('📁 Not in chat mode, showing error');
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Hãy chọn cuộc trò chuyện trước' : 'Select a conversation first'
      );
      return;
    }
    
    console.log('📁 In chat mode, showing attachment options');

    // Dismiss keyboard to prevent layout shifts
    Keyboard.dismiss();

    // Show mini table with attachment options
    console.log('📁 Setting attachmentOptionsVisible to true');
    setAttachmentOptionsVisible(true);
    
    // Animate slide up
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleTextFileImport = async () => {
    try {
      console.log('📁 handleTextFileImport called - Text file option selected!');
      console.log('📁 In chat mode, proceeding with file import');
      let content: string = '';
      let fileName: string = 'conversation.txt';

      if (Platform.OS === 'web') {
        console.log('📁 Web platform: Creating file input');
        // Web platform: Use HTML file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        
        input.onchange = async (event: any) => {
          console.log('📁 File input changed, processing file');
          const file = event.target.files[0];
          if (file) {
            console.log('📁 File selected:', file.name, 'Size:', file.size);
            try {
              content = await file.text();
              fileName = file.name;
              console.log('📁 File content read successfully, length:', content.length);
              console.log('📁 Calling showFileProcessingOptions with:', fileName);
              showFileProcessingOptions(content, fileName);
            } catch (error) {
              console.error('Error reading file:', error);
              Alert.alert(
                language === 'vi' ? 'Lỗi' : 'Error',
                language === 'vi' ? 'Không thể đọc tệp' : 'Could not read file'
              );
            }
          } else {
            console.log('📁 No file selected');
          }
        };
        
        console.log('📁 Clicking file input');
        input.click();
        return; // Exit early for web platform
      } else {
        // Mobile platform: Use DocumentPicker and FileSystem
      const result: any = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        multiple: false,
        copyToCacheDirectory: true,
      } as any);

      // Handle cancel across API shapes
      if ((result && 'canceled' in result && result.canceled) || (result && result.type === 'cancel')) {
        return;
      }

      let file: any = null;
      if (result && 'assets' in result && Array.isArray(result.assets) && result.assets.length > 0) {
        file = result.assets[0];
      } else if (result && result.type === 'success') {
        file = result;
      }

      if (!file || !file.uri) {
        Alert.alert(
          language === 'vi' ? 'Lỗi' : 'Error',
          language === 'vi' ? 'Không thể chọn tệp' : 'Could not pick file'
        );
        return;
      }

        content = await FileSystem.readAsStringAsync(file.uri, { 
          encoding: 'utf8' as any
        });
        fileName = file.name || 'conversation.txt';
      }

      showFileProcessingOptions(content, fileName);
    } catch (error) {
      console.error('Error importing text file:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể nhập tệp văn bản' : 'Could not import text file'
      );
    }
  };

  const handleVoiceMessageComplete = async (audioFile: File | Blob | string, duration: number) => {
    console.log('🎤 Voice message recorded:', audioFile, 'Duration:', duration);
    
    try {
      // Add typing indicator immediately
      const typingMessage: ChatMessage = {
        id: Date.now(),
        message: '',
        response: language === 'vi' ? '🤖 AI đang xử lý tin nhắn giọng nói...' : '🤖 AI is processing voice message...',
        user_id: Number(user.id),
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, typingMessage]);

      // Send audio to backend for speech-to-text processing
      try {
        let response;
        
        // Use multipart upload for File/Blob, fallback to base64 for string URIs
        if (audioFile instanceof File || audioFile instanceof Blob) {
          // Use multipart upload
          console.log('🎤 Using multipart upload for audio file');
          response = await apiService.uploadVoiceMessage(
            Number(user.id),
            audioFile,
            audioFile instanceof File ? audioFile.name.split('.').pop() || 'wav' : 'webm',
            selectedAgent?.id,
            selectedChatbox?.id,
            duration
          );
        } else {
          // Fallback to base64 for backward compatibility
          console.log('🎤 Using base64 upload for audio URI');
          let audioData: string;
          let audioFormat: string = 'wav';
          
          if (Platform.OS === 'web') {
            // For web, audioFile is a blob URL string
            const response = await fetch(audioFile);
            const arrayBuffer = await response.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            audioData = base64;
            audioFormat = 'webm';
          } else {
            // For mobile, read file and convert to base64
            const fileInfo = await FileSystem.getInfoAsync(audioFile);
            if (fileInfo.exists) {
              const base64 = await FileSystem.readAsStringAsync(audioFile, {
                encoding: 'base64' as any,
              });
              audioData = base64;
              audioFormat = 'm4a';
            } else {
              throw new Error('Audio file not found');
            }
          }
          
          response = await apiService.sendVoiceMessage(
            Number(user.id),
            audioData,
            audioFormat,
            selectedAgent?.id,
            selectedChatbox?.id,
            audioFile,
            duration
          );
        }

        if (response.data) {
          // Remove typing message
          setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));

          // Add the user's voice message with audio data from backend
          const userVoiceMessage: ChatMessage = {
            id: response.data.id || Date.now() + 1,
            message: response.data.message, // Transcribed text
            response: '',
            user_id: Number(user.id),
            created_at: response.data.created_at || new Date().toISOString(),
            audio_id: response.data.audio_id,
            audio_data: response.data.audio_data,
            duration: response.data.duration,
            audio_format: response.data.audio_format,
          };

          // Add AI response with audio data
          const aiMessage: ChatMessage = {
            id: (response.data.id || Date.now() + 1) + 1,
            message: '',
            response: response.data.response,
            user_id: Number(user.id),
            created_at: response.data.created_at || new Date().toISOString(),
            agent_id: response.data.agent_id || selectedAgent?.id,
            audio_response_id: response.data.audio_response_id,
            audio_response_data: response.data.audio_response_data,
            audio_response_duration: response.data.audio_response_duration,
            audio_response_format: response.data.audio_response_format,
          };

          setMessages(prev => [...prev, userVoiceMessage, aiMessage]);

          // Note: TTS is now handled by backend gTTS - no need for frontend TTS
          console.log('🔊 Voice message processed - TTS handled by backend gTTS');
        }
      } catch (error) {
        console.error('❌ Error processing voice message:', error);
        // Remove typing message and show error
        setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));
        
        Alert.alert(
          language === 'vi' ? 'Lỗi Xử Lý' : 'Processing Error',
          language === 'vi' 
            ? 'Không thể xử lý tin nhắn giọng nói. Vui lòng thử lại.'
            : 'Cannot process voice message. Please try again.',
          [{ text: language === 'vi' ? 'OK' : 'OK' }]
        );
      }

      // Close voice recorder
      setShowVoiceRecorder(false);

    } catch (error) {
      console.error('❌ Error handling voice message:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' 
          ? 'Không thể xử lý tin nhắn giọng nói.'
          : 'Cannot process voice message.',
        [{ text: language === 'vi' ? 'OK' : 'OK' }]
      );
    }
  };

  const handleVoiceRecorderCancel = () => {
    setShowVoiceRecorder(false);
  };

  const handleInlineVoiceRecord = () => {
    console.log('🎤 Inline voice record button pressed');
    setShowInlineVoiceRecorder(true);
    setIsRecordingVoice(true);
  };

  const handleInlineVoiceRecorderCancel = () => {
    setShowInlineVoiceRecorder(false);
    setIsRecordingVoice(false);
  };

  const handleInlineVoiceMessageComplete = async (audioFile: File | Blob | string, duration: number) => {
    console.log('🎤 Inline voice message recorded:', audioFile, 'Duration:', duration);
    
    // Close the inline recorder
    setShowInlineVoiceRecorder(false);
    setIsRecordingVoice(false);
    
    // Use the same logic as the full-screen voice recorder
    await handleVoiceMessageComplete(audioFile, duration);
  };

  const handleSpeechButtonPress = async () => {
    // Speech-to-text functionality
    console.log('🎤 Speech button pressed, isListening:', isListening);
    
    if (!sttAvailable) {
      Alert.alert(
        language === 'vi' ? 'Tính Năng Không Khả Dụng' : 'Feature Not Available',
        language === 'vi' 
          ? 'Nhận dạng giọng nói không khả dụng trên thiết bị này.'
          : 'Speech recognition is not available on this device.',
        [{ text: language === 'vi' ? 'OK' : 'OK' }]
      );
      return;
    }

    try {
      if (isListening) {
        await stopListening();
        console.log('🎤 Stopped listening');
      } else {
        await startListening();
        console.log('🎤 Started listening');
      }
    } catch (error) {
      console.error('❌ Speech recognition error:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi Nhận Dạng Giọng Nói' : 'Speech Recognition Error',
        language === 'vi' 
          ? 'Không thể bắt đầu nhận dạng giọng nói.'
          : 'Cannot start speech recognition.',
        [{ text: language === 'vi' ? 'OK' : 'OK' }]
      );
    }
  };

  const isFileContent = (message: string): boolean => {
    // Simple file detection logic
    const lines = message.split('\n');
    if (lines.length < 3) return false;
    
    // Check for conversation patterns (A: B: format)
    const conversationPatterns = lines.filter(line => 
      line.trim().match(/^[A-Z]:\s*.+/) || 
      line.trim().match(/^[A-Z][a-z]+:\s*.+/)
    );
    
    // If more than 50% of lines match conversation patterns, it's likely a file
    return conversationPatterns.length > lines.length * 0.5;
  };

  const sendMessageWithContent = async (messageText: string, fileName?: string) => {
    // Use ref-based check to prevent race conditions
    if (!user || !messageText.trim() || isSendingRef.current) {
      console.log('🚫 Message send blocked:', {
        noUser: !user,
        noMessage: !messageText.trim(),
        isSending: isSendingRef.current
      });
      return;
    }

    // Add debounce protection (minimum 1 second between sends)
    const now = Date.now();
    if (now - lastSendTimeRef.current < 1000) {
      console.log('🚫 Message send blocked by debounce:', now - lastSendTimeRef.current, 'ms since last send');
      console.log('🚫 Debounce blocking - this might be why file import doesn\'t work if you try too quickly');
      return;
    }
    lastSendTimeRef.current = now;

    console.log('💬 Starting message send with content:', messageText);
    
    // Set both state and ref immediately to prevent race conditions
    setIsSending(true);
    isSendingRef.current = true;
    
    // Add user message immediately for real-time experience
    const userMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      message: fileName ? `📁 ${fileName}` : messageText.trim(), // Show file name instead of full content
      response: '', // No response for user messages
      user_id: Number(user.id),
      created_at: new Date().toISOString(),
      fileName: fileName, // Add fileName to the message
    };
    
    // Special handling for image messages - show user's text instead of image data
    if (messageText.includes('[IMAGE:') && !fileName) {
      // Extract the user's text from the image message
      const textMatch = messageText.match(/\[IMAGE:.*?\]\s*(.*)/);
      console.log('🖼️ Image message extraction:', {
        messageText: messageText.substring(0, 100) + '...', // Log first 100 chars
        textMatch: textMatch,
        extractedText: textMatch ? textMatch[1] : null
      });
      const userText = textMatch ? textMatch[1].trim() : 'Sent an image';
      userMessage.message = userText || 'Sent an image';
      userMessage.fileName = 'image.jpg'; // Mark as image for backend processing
      console.log('🖼️ Final user message:', userMessage.message);
    }

    // Store the typing message ID for later removal
    const typingMessageId = Date.now() + 1;

    // Add user message immediately for real-time experience
    console.log('💬 Adding user message to chat:', userMessage);
    console.log('💬 User message fileName:', userMessage.fileName);
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('💬 Updated messages count:', newMessages.length);
      console.log('💬 Last message:', newMessages[newMessages.length - 1]);
      console.log('💬 Last message fileName:', newMessages[newMessages.length - 1].fileName);
      return newMessages;
    });
    
    // Add a temporary "AI is typing" message
    const typingMessage: ChatMessage = {
      id: typingMessageId, // Use stored ID
      message: '',
      response: language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...',
      user_id: Number(user.id),
      created_at: new Date().toISOString(),
    };
    
    console.log('💬 Adding typing message to chat:', typingMessage);
    setMessages(prev => {
      const newMessages = [...prev, typingMessage];
      console.log('💬 Updated messages count with typing:', newMessages.length);
      return newMessages;
    });

    try {
      console.log('💬 ChatScreen: Sending message with agent:', selectedAgent?.id);

      // Test backend connection first
      console.log('🔍 Testing backend connection...');
      const healthCheck = await apiService.testConnection();
      console.log('🔍 Health check result:', healthCheck);
      
      // Check if this is file content and use external API
      const isFile = isFileContent(messageText.trim());
      console.log('📁 Is file content:', isFile);
      
      let response;
      if (isFile) {
        console.log('🌐 Using external API for file upload...');
        response = await apiService.sendMessageExternalAPI(
          Number(user.id), 
          messageText.trim(), 
          undefined, 
          selectedAgent?.id
        );
      } else {
        console.log('💬 Using regular chat endpoint...');
        response = await apiService.sendMessage(
          Number(user.id), 
          messageText.trim(), 
          undefined, 
          selectedAgent?.id
        );
      }
      console.log('💬 ChatScreen: Message response:', response);
      console.log('💬 Response status:', response.status);
      console.log('💬 Response error:', response.error);
      
      if (response.error) {
        console.error('❌ API returned error:', response.error);
        throw new Error(response.error);
      }
      
      if (response.data) {
        console.log('💬 Response data structure:', JSON.stringify(response.data, null, 2));
        console.log('💬 Response data type:', typeof response.data);
        console.log('💬 Response data keys:', Object.keys(response.data));
        
        // Check if response data is empty or null
        if (!response.data || Object.keys(response.data).length === 0) {
          console.error('❌ Empty response data received');
          throw new Error('Empty response data from server');
        }

        // Remove the typing message
        console.log('💬 Removing typing message with ID:', typingMessageId);
        setMessages(prev => {
          const filteredMessages = prev.filter(msg => msg.id !== typingMessageId);
          console.log('💬 Messages after removing typing:', filteredMessages.length);
          return filteredMessages;
        });
        
        // Add the actual response message immediately for better UX
        const responseMessage: ChatMessage = {
          id: (response.data && response.data.id) || Date.now(),
          message: (response.data && response.data.message) || '',
          response: (response.data && response.data.response) || '',
          user_id: (response.data && response.data.user_id) || Number(user.id),
          created_at: (response.data && response.data.created_at) || new Date().toISOString(),
        };
        
        console.log('💬 Adding response message to chat:', responseMessage);
        setMessages(prev => {
          const newMessages = [...prev, responseMessage];
          console.log('💬 Final messages count:', newMessages.length);
          return newMessages;
        });
        
        console.log('✅ Message sent and response received successfully');
        
        // No need to refresh messages from server since we already have the response
        // The message is already added to local state, so no refresh needed
        console.log('✅ Message handling completed without server refresh');
      } else {
        console.error('❌ No response data received');
        throw new Error('No response data from server');
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Remove the typing message
      setMessages(prev => prev.filter(msg => msg.id !== typingMessageId));
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now(),
        message: '',
        response: language === 'vi' 
          ? 'Xin lỗi, đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại.'
          : 'Sorry, there was an error sending the message. Please try again.',
        user_id: Number(user.id),
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
    }
  };

  const processFileContent = async (content: string, fileName?: string) => {
    console.log('📁 processFileContent called with content length:', content.length);
    console.log('📁 Current inputMessage:', inputMessage);
    console.log('📁 User status:', { user: !!user, userId: user?.id });
    console.log('📁 Is sending status:', isSendingRef.current);
    
    const MAX = 1000; // Keep consistent with TextInput maxLength
    let messageText = content; // Use only file content, don't combine with inputMessage

    if (messageText.length > MAX) {
      messageText = messageText.slice(0, MAX);
      Alert.alert(
        language === 'vi' ? 'Nội dung quá dài' : 'Content too long',
        language === 'vi'
          ? `Đã cắt còn ${MAX} ký tự để phù hợp ô nhập`
          : `Truncated to ${MAX} characters to fit input`
      );
    }

    console.log('📁 Final messageText length:', messageText.length);
    console.log('📁 MessageText preview:', messageText.substring(0, 100) + '...');
    console.log('📁 MessageText trimmed:', messageText.trim().length > 0);

    // Clear the input field first
    setInputMessage('');
    console.log('📁 Input field cleared');
    
    // Check all blocking conditions before sending
    console.log('📁 Pre-send checks:', {
      hasUser: !!user,
      hasMessage: messageText.trim().length > 0,
      isNotSending: !isSendingRef.current,
      timeSinceLastSend: Date.now() - lastSendTimeRef.current
    });
    
    // Automatically send the message
    console.log('📁 Calling sendMessageWithContent...');
    await sendMessageWithContent(messageText, fileName);
    console.log('📁 sendMessageWithContent completed');
  };

  const handleUploadToBackend = async (content: string, fileName: string) => {
    try {
      console.log('📁 Processing file with streamlined workflow...');
      
      // Don't add processing message here - let sendMessageWithContent handle the AI typing message
      // This prevents duplicate messages (processing + AI typing)
      
      // Use the streamlined workflow by sending content as a regular message
      // The backend will automatically detect it as file content and process it
      await sendMessageWithContent(content, fileName);
      
      console.log('✅ File processed with streamlined workflow');
      
    } catch (error) {
      console.error('❌ File processing error:', error);
      
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể xử lý tệp' : 'Failed to process file'
      );
    }
  };

  const showFileProcessingOptions = (content: string, fileName: string) => {
    console.log('📁 showFileProcessingOptions called with:', fileName);
    console.log('📁 Content length:', content.length);
    console.log('📁 About to show custom modal dialog');
    
    // Set modal data and show modal
    setFileModalContent(content);
    setFileModalName(fileName);
    setShowFileModal(true);
    
    console.log('📁 Custom modal dialog shown');
  };

  const pickImage = async () => {
    try {
      console.log('📸 pickImage called - Image option selected!');
      console.log('📸 Opening document picker for images...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });

      console.log('📸 Document picker result:', result);

      if (result.canceled) {
        console.log('📸 Image selection cancelled');
        return;
      }

      const file = result.assets[0];
      if (!file || !file.uri) {
        Alert.alert(
          language === 'vi' ? 'Lỗi' : 'Error',
          language === 'vi' ? 'Không thể chọn ảnh' : 'Could not pick image'
        );
        return;
      }

      console.log('📸 Selected image URI:', file.uri);
      console.log('📸 File details:', {
        name: file.name,
        size: file.size,
        type: file.mimeType,
        uri: file.uri
      });
      
      // Set the selected image and show the image modal
      setSelectedImage(file.uri);
      setSelectedDocument(null);
      setSelectedFileName(file.name || 'image.jpg');
      setSelectedFileType('image');
      setImageModalVisible(true);
      setImageLoading(true);
      setImageError(null);
      
      console.log('📸 Modal should be visible now, selectedImage:', file.uri);
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể chọn ảnh' : 'Could not pick image'
      );
    }
  };

  const pickDocument = async () => {
    try {
      console.log('📄 pickDocument called - Document option selected!');
      console.log('📄 Opening document picker for documents...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        multiple: false,
        copyToCacheDirectory: true,
      });

      console.log('📄 Document picker result:', result);

      if (result.canceled) {
        console.log('📄 Document selection cancelled');
        return;
      }

      const file = result.assets[0];
      if (!file || !file.uri) {
        Alert.alert(
          language === 'vi' ? 'Lỗi' : 'Error',
          language === 'vi' ? 'Không thể chọn tài liệu' : 'Could not pick document'
        );
        return;
      }

      console.log('📄 Selected document URI:', file.uri);
      console.log('📄 File details:', {
        name: file.name,
        size: file.size,
        type: file.mimeType,
        uri: file.uri
      });
      
      // Set the selected document and show the modal
      setSelectedImage(null);
      setSelectedDocument(file.uri);
      setSelectedFileName(file.name || 'document.txt');
      setSelectedFileType('document');
      setImageModalVisible(true);
      setImageLoading(true);
      setImageError(null);
      
      console.log('📄 Modal should be visible now, selectedDocument:', file.uri);
    } catch (error) {
      console.error('❌ Error picking document:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể chọn tài liệu' : 'Could not pick document'
      );
    }
  };

  const sendImageWithMessage = async (imageUri: string, messageText: string) => {
    try {
      console.log('📸 Sending image with message:', messageText);
      
      setIsSending(true);
      
      // Convert image to base64 for sending
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });
      
      // Create a message that includes both image and text
      const imageMessage = `[IMAGE:${base64}] ${messageText}`;
      
      // Close modal immediately and return to conversation
      setSelectedImage(null);
      setSelectedDocument(null);
      setSelectedFileName('');
      setSelectedFileType('image');
      setImageModalVisible(false);
      setInputMessage('');
      setImageLoading(false);
      setImageError(null);
      
      // Scroll to bottom to show the new message
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      console.log('✅ Modal closed immediately - returning to conversation');
      
      // Send the message with image (don't await - let it run in background)
      // Don't pass fileName so it shows the actual message text instead of file name
      sendMessageWithContent(imageMessage).catch((error) => {
        console.error('❌ Error sending image in background:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể gửi ảnh' : 'Failed to send image'
        );
      });
      
    } catch (error) {
      console.error('❌ Error preparing image:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể chuẩn bị ảnh' : 'Failed to prepare image'
      );
    } finally {
      setIsSending(false);
    }
  };

  const sendDocumentWithMessage = async (documentUri: string, messageText: string, fileName: string) => {
    try {
      console.log('📄 Sending document with message:', messageText, 'File:', fileName);
      
      setIsSending(true);
      
      // Read document content as text
      const content = await FileSystem.readAsStringAsync(documentUri, {
        encoding: 'utf8' as any,
      });
      
      // Create a message that includes both document content and text
      const documentMessage = `[DOCUMENT:${fileName}] ${content} ${messageText}`;
      
      // Close modal immediately and return to conversation
      setSelectedImage(null);
      setSelectedDocument(null);
      setSelectedFileName('');
      setSelectedFileType('document');
      setImageModalVisible(false);
      setInputMessage('');
      setImageLoading(false);
      setImageError(null);
      
      // Scroll to bottom to show the new message
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      console.log('✅ Modal closed immediately - returning to conversation');
      
      // Send the message with document (don't await - let it run in background)
      sendMessageWithContent(documentMessage).catch((error) => {
        console.error('❌ Error sending document in background:', error);
        Alert.alert(
          language === 'vi' ? 'Lỗi' : 'Error',
          language === 'vi' ? 'Không thể gửi tài liệu' : 'Failed to send document'
        );
      });
      
    } catch (error) {
      console.error('❌ Error preparing document:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể chuẩn bị tài liệu' : 'Failed to prepare document'
      );
    } finally {
      setIsSending(false);
    }
  };

  // Import the centralized time utility
  const formatTime = (dateString: string) => {
    const { formatSmartTime, getUserTimezone } = require('../utils/timeUtils');
    return formatSmartTime(dateString, { 
      timeZone: getUserTimezone() 
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return language === 'vi' ? 'Chưa có' : 'Never';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return language === 'vi' ? 'Không hợp lệ' : 'Invalid';
    }
    
    return date.toLocaleDateString();
  };

  // Helper function to safely get date timestamp for sorting
  const getSafeTimestamp = (dateString: string): number => {
    const { getSafeTimestamp: getSafeTimestampUtil } = require('../utils/timeUtils');
    return getSafeTimestampUtil(dateString);
  };

  const getConversationsByAgent = () => {
    console.log('🔄 ChatScreen: getConversationsByAgent called');
    console.log('🔄 ChatScreen: chatHistory length:', chatHistory.length);
    
    const conversations: { [agentId: number]: ChatMessageWithAgent[] } = {};
    
    chatHistory.forEach(message => {
      if (message.agent_id) {
        console.log('🔄 ChatScreen: Found agent message:', { id: message.id, agent_id: message.agent_id, message: message.message?.substring(0, 30) });
        if (!conversations[message.agent_id]) {
          conversations[message.agent_id] = [];
        }
        conversations[message.agent_id].push(message);
      }
    });

    console.log('🔄 ChatScreen: Agent conversations found:', Object.keys(conversations).length);
    Object.keys(conversations).forEach(agentId => {
      console.log('🔄 ChatScreen: Agent', agentId, 'has', conversations[parseInt(agentId)].length, 'messages');
    });

    // Convert to array and sort by latest message
    const result = Object.entries(conversations)
      .map(([agentId, messages]) => ({
        agentId: parseInt(agentId),
        messages: messages.sort((a, b) => getSafeTimestamp(b.created_at) - getSafeTimestamp(a.created_at)),
        latestMessage: messages[0] // Already sorted, so first is latest
      }))
      .sort((a, b) => getSafeTimestamp(b.latestMessage.created_at) - getSafeTimestamp(a.latestMessage.created_at));
    
    console.log('🔄 ChatScreen: Returning', result.length, 'agent conversations');
    return result;
  };

  const getConversationsByChatbox = () => {
    console.log('🔄 ChatScreen: getConversationsByChatbox called');
    console.log('🔄 ChatScreen: chatHistory length:', chatHistory.length);
    console.log('🔄 ChatScreen: allChatboxes length:', allChatboxes.length);
    
    const conversations: { [chatboxId: number]: ChatMessageWithAgent[] } = {};
    
    chatHistory.forEach(message => {
      if (message.chatbox_id) {
        console.log('🔄 ChatScreen: Found chatbox message:', { id: message.id, chatbox_id: message.chatbox_id, message: message.message?.substring(0, 30) });
        if (!conversations[message.chatbox_id]) {
          conversations[message.chatbox_id] = [];
        }
        conversations[message.chatbox_id].push(message);
      }
    });

    console.log('🔄 ChatScreen: Chatbox conversations found:', Object.keys(conversations).length);
    Object.keys(conversations).forEach(chatboxId => {
      console.log('🔄 ChatScreen: Chatbox', chatboxId, 'has', conversations[parseInt(chatboxId)].length, 'messages');
    });

    // Convert to array and sort by latest message
    const result = Object.entries(conversations)
      .map(([chatboxId, messages]) => ({
        chatboxId: parseInt(chatboxId),
        messages: messages.sort((a, b) => getSafeTimestamp(b.created_at) - getSafeTimestamp(a.created_at)),
        latestMessage: messages[0] // Already sorted, so first is latest
      }))
      .sort((a, b) => getSafeTimestamp(b.latestMessage.created_at) - getSafeTimestamp(a.latestMessage.created_at));
    
    console.log('🔄 ChatScreen: Returning', result.length, 'chatbox conversations');
    return result;
  };

  const getGeneralConversations = () => {
    console.log('🔄 ChatScreen: getGeneralConversations called');
    
    // Get messages that have no agent_id and no chatbox_id (general chat)
    const generalMessages = chatHistory.filter(message => 
      !message.agent_id && !message.chatbox_id
    );
    
    console.log('🔄 ChatScreen: Found', generalMessages.length, 'general messages');
    
    if (generalMessages.length === 0) {
      return [];
    }
    
    // Group all general messages into one conversation
    const sortedMessages = generalMessages.sort((a, b) => 
      getSafeTimestamp(b.created_at) - getSafeTimestamp(a.created_at)
    );
    
    // Create a fake chatbox ID for general conversations (use negative number to avoid conflicts)
    const generalConversation = {
      chatboxId: -1, // Special ID for general conversations
      messages: sortedMessages,
      latestMessage: sortedMessages[0]
    };
    
    console.log('🔄 ChatScreen: Returning 1 general conversation with', sortedMessages.length, 'messages');
    return [generalConversation];
  };

  const getAgentName = (agentId?: number) => {
    if (!agentId) return language === 'vi' ? 'Không có Agent' : 'No Agent';
    const agent = allAgents.find(a => a.id === agentId);
    return agent ? agent.name : language === 'vi' ? 'Agent Không Xác Định' : 'Unknown Agent';
  };


  const handleConversationPress = (agentId: number) => {
    const agent = allAgents.find(a => a.id === agentId);
    if (agent) {
      console.log('🔄 Conversation pressed for agent:', agent.name, 'ID:', agent.id);
      setSelectedAgent(agent);
      setSelectedChatbox(null);
      setIsInChat(true);
      // Clear any previous timestamps to ensure proper message loading
      setLastNewChatTimestamp(null);
      setLastExistingChatTimestamp(null);
      // loadMessages() will be called by useEffect when selectedAgent changes
    }
  };

  const handleChatboxConversationPress = (chatboxId: number) => {
    const chatbox = allChatboxes.find(c => c.id === chatboxId);
    if (chatbox) {
      console.log('🔄 Conversation pressed for chatbox:', chatbox.title, 'ID:', chatbox.id);
      setSelectedChatbox(chatbox);
      setSelectedAgent(null);
      setIsInChat(true);
      // Clear any previous timestamps to ensure proper message loading
      setLastNewChatTimestamp(null);
      setLastExistingChatTimestamp(null);
      // loadMessages() will be called by useEffect when selectedChatbox changes
    }
  };

  const handleBackToConversations = async () => {
    // Reset all conversation state immediately to prevent layout shifts
    setIsInChat(false);
    setSelectedAgent(null);
    setSelectedChatbox(null);
    setMessages([]);
    
    // Clear timestamps
    setLastNewChatTimestamp(null);
    setLastExistingChatTimestamp(null);
    
    // Clear route parameters to prevent loop by navigating to ChatScreen with empty params
    navigation.navigate('Chat', {});
    
    // Always return to conversation list within ChatScreen
    setIsRefreshingConversations(true);
    try {
      await Promise.all([loadChatHistory(), loadAllAgents(), loadAllChatboxes()]);
    } finally {
      setIsRefreshingConversations(false);
    }
  };

  const handleCreateNewChat = async () => {
    // Create a new chatbox for general chat
    if (!user) return;
    
    try {
      const response = await apiService.createChatbox({
        user_id: Number(user.id),
        title: "New Chat"
      });
      
      if (response.data) {
        setSelectedChatbox(response.data);
        setSelectedAgent(null);
        setIsInChat(true);
        setMessages([]);
        // Refresh chatboxes list
        loadAllChatboxes();
      } else {
        Alert.alert(
          language === 'vi' ? 'Lỗi' : 'Error',
          language === 'vi' ? 'Không thể tạo cuộc trò chuyện mới' : 'Failed to create new conversation'
        );
      }
    } catch (error) {
      console.error('Error creating new chatbox:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể tạo cuộc trò chuyện mới' : 'Failed to create new conversation'
      );
    }
  };

  const handleCleanupOrphanedConversations = async () => {
    if (!user) return;
    
    Alert.alert(
      language === 'vi' ? 'Dọn dẹp cuộc trò chuyện' : 'Cleanup Conversations',
      language === 'vi' 
        ? 'Bạn có muốn dọn dẹp các cuộc trò chuyện không còn tồn tại? Điều này sẽ xóa các cuộc trò chuyện với các trợ lý đã bị xóa hoặc không còn truy cập được.'
        : 'Do you want to cleanup conversations that no longer exist? This will remove conversations with agents that have been deleted or are no longer accessible.',
      [
        {
          text: language === 'vi' ? 'Hủy' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'vi' ? 'Dọn dẹp' : 'Cleanup',
          onPress: async () => {
            try {
              const response = await apiService.cleanupOrphanedConversations(Number(user.id));
              if (response.status === 200 && response.data) {
                Alert.alert(
                  language === 'vi' ? 'Thành công' : 'Success',
                  response.data.message
                );
                // Refresh conversation history
                loadChatHistory();
              } else {
                Alert.alert(
                  language === 'vi' ? 'Lỗi' : 'Error',
                  response.error || (language === 'vi' ? 'Không thể dọn dẹp cuộc trò chuyện' : 'Failed to cleanup conversations')
                );
              }
            } catch (error) {
              console.error('Error cleaning up conversations:', error);
              Alert.alert(
                language === 'vi' ? 'Lỗi' : 'Error',
                language === 'vi' ? 'Không thể dọn dẹp cuộc trò chuyện' : 'Failed to cleanup conversations'
              );
            }
          }
        }
      ]
    );
  };

  const handleAgentSelect = (agent: Agent | null) => {
    setSelectedAgent(agent);
    setShowAgentSelector(false);
    if (agent) {
      console.log('🔄 Agent selected:', agent.name, 'ID:', agent.id);
      setSelectedChatbox(null);
      setIsInChat(true);
      // Clear any previous timestamps to ensure proper message loading
      setLastNewChatTimestamp(null);
      setLastExistingChatTimestamp(null);
      // Force multiple layout refreshes to prevent shift
      setTimeout(() => {
        setMessageRefreshKey(prev => prev + 1);
        // Additional refresh for layout stability
        setTimeout(() => {
          setMessageRefreshKey(prev => prev + 1);
        }, 50);
      }, 100);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    console.log('✏️ Editing agent:', agent.name, 'ID:', agent.id);
    setEditingAgent(agent);
    setShowAgentCustomizer(true);
  };

  const handleAgentUpdated = (updatedAgent: Agent) => {
    console.log('✅ Agent updated:', updatedAgent.name, 'ID:', updatedAgent.id);
    setEditingAgent(null);
    setShowAgentCustomizer(false);
    
    // Update the agent in allAgents list
    setAllAgents(prev => prev.map(agent => 
      agent.id === updatedAgent.id ? updatedAgent : agent
    ));
    
    // If this is the currently selected agent, update it too
    if (selectedAgent && selectedAgent.id === updatedAgent.id) {
      setSelectedAgent(updatedAgent);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    console.log('🎨 Rendering message:', message);
    console.log('🎨 User ID:', user?.id, 'Message user_id:', message.user_id);
    console.log('🎨 Message content:', message.message);
    console.log('🎨 Response content:', message.response);
    console.log('🎨 Message fileName:', message.fileName);
    
    // Check if this message has user content (message field)
    const hasUserContent = message.message && message.message.trim() !== '';
    // Check if this message has AI response (response field)
    const hasAIResponse = message.response && message.response.trim() !== '';
    
    console.log('🎨 Has user content:', hasUserContent);
    console.log('🎨 Has AI response:', hasAIResponse);
    console.log('🎨 Has fileName:', !!message.fileName);
    
    // If message has both user content and AI response, render them separately
    if (hasUserContent && hasAIResponse) {
      console.log('🎨 Rendering combined message (user + AI)');
    return (
        <View key={`${message.id}-combined`}>
          {/* User Message (Right Side) */}
          <View style={[styles.messageRow, styles.userMessageRow]}>
            <View style={[styles.messageBubble, styles.userMessageBubble, { backgroundColor: theme.colors.primary }]}>
              {message.fileName ? (
                // File attachment display
                <View style={styles.fileAttachment}>
                  <View style={styles.fileIconContainer}>
                    <Icon name="description" size={24} color={theme.colors.surface} />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={[styles.fileName, { color: theme.colors.surface }]}>
                      {message.fileName}
                    </Text>
                    <Text style={[styles.fileSize, { color: theme.colors.surface + '80' }]}>
                      {Math.round(message.message.length / 1024 * 100) / 100} KB
                    </Text>
                  </View>
                </View>
              ) : (
                // Regular text message
                <Text style={[styles.messageText, { color: theme.colors.surface }]}>
                  {message.message}
                </Text>
              )}
              <Text style={[styles.messageTimestamp, { color: theme.colors.surface + '80' }]}>
                {formatTime(message.created_at)}
              </Text>
            </View>
            <View style={styles.userAvatar}>
              <Icon name="person" size={20} color={theme.colors.surface} />
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteMessage(message.id)}
            >
              <Icon name="delete-outline" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>

          {/* AI Response (Left Side) */}
          <View style={[styles.messageRow, styles.aiMessageRow]}>
            <View style={styles.aiAvatar}>
              <Icon name="smart-toy" size={20} color={theme.colors.primary} />
            </View>
            <ChatMessageBubble
              message={message}
              response={message.response}
              isUser={false}
              timestamp={message.created_at}
              agentId={selectedAgent?.id}
              animated={!attachmentOptionsVisible}
              isLegacyVoiceMessage={false}
            />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteMessage(message.id)}
            >
              <Icon name="delete-outline" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    // If only user content (no AI response yet)
    if (hasUserContent && !hasAIResponse) {
      console.log('🎨 Rendering user message only (right side)');
      return (
        <View key={message.id} style={[styles.messageRow, styles.userMessageRow]}>
          <View style={[styles.messageBubble, styles.userMessageBubble, { backgroundColor: theme.colors.primary }]}>
            {message.fileName ? (
              // File attachment display
              console.log('🎨 Rendering file attachment for (user only):', message.fileName),
              <View style={styles.fileAttachment}>
                <View style={styles.fileIconContainer}>
                  <Icon name="description" size={24} color={theme.colors.surface} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.colors.surface }]}>
                    {message.fileName}
                  </Text>
                  <Text style={[styles.fileSize, { color: theme.colors.surface + '80' }]}>
                    {Math.round(message.message.length / 1024 * 100) / 100} KB
                  </Text>
                </View>
              </View>
            ) : (
              // Regular text message
              console.log('🎨 Rendering regular text message (user only)'),
              <Text style={[styles.messageText, { color: theme.colors.surface }]}>
                {message.message}
              </Text>
            )}
            <Text style={[styles.messageTimestamp, { color: theme.colors.surface + '80' }]}>
              {formatTime(message.created_at)}
            </Text>
          </View>
          <View style={styles.userAvatar}>
            <Icon name="person" size={20} color={theme.colors.surface} />
        </View>
        <TouchableOpacity
            style={styles.deleteButton}
          onPress={() => deleteMessage(message.id)}
        >
          <Icon name="delete-outline" size={16} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    );
    }
    
    // If only AI response (no user content)
    if (!hasUserContent && hasAIResponse) {
      console.log('🎨 Rendering AI response only (left side)');
      return (
        <View key={message.id} style={[styles.messageRow, styles.aiMessageRow]}>
          <View style={styles.aiAvatar}>
            <Icon name="smart-toy" size={20} color={theme.colors.primary} />
          </View>
          <ChatMessageBubble
            message={message}
            response={message.response}
            isUser={false}
            timestamp={message.created_at}
            agentId={selectedAgent?.id}
            animated={!attachmentOptionsVisible}
            isLegacyVoiceMessage={false}
          />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteMessage(message.id)}
          >
            <Icon name="delete-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      );
    }

    // Fallback for any other message types
    console.log('🎨 Message not rendered (fallback)');
    return null;
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          {isInChat && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToConversations}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          <View style={[styles.headerAvatar, { backgroundColor: theme.colors.primary }]}>
            <Icon 
              name={
                selectedAgent 
                  ? "smart-toy" 
                  : selectedChatbox 
                    ? "chat" 
                    : "help"
              } 
              size={24} 
              color={theme.colors.surface} 
            />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {isInChat 
                ? (selectedAgent 
                    ? selectedAgent.name 
                    : selectedChatbox 
                      ? selectedChatbox.title 
                      : (language === 'vi' ? 'Chat Chung' : 'General Chat'))
                : (language === 'vi' ? 'Cuộc Trò Chuyện' : 'Conversations')
              }
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {isInChat 
                ? (selectedAgent 
                    ? `${selectedAgent.personality} • ${language === 'vi' ? 'Cuộc trò chuyện riêng' : 'Private chat'}`
                    : selectedChatbox
                      ? `${language === 'vi' ? 'Cuộc trò chuyện chung' : 'General chat'} • ${language === 'vi' ? 'Không có trợ lý' : 'No agent'}`
                      : `${language === 'vi' ? 'Cuộc trò chuyện chung' : 'General conversation'} • ${language === 'vi' ? 'Không có trợ lý' : 'No agent'}`)
                : (language === 'vi' ? 'Chọn cuộc trò chuyện hoặc tạo mới' : 'Select conversation or create new')
              }
            </Text>
          </View>
        </View>
        
        <View style={styles.headerButtons}>
          {/* New Conversation Button - only show when not in chat */}
          {!isInChat && (
            <TouchableOpacity 
              style={[
                styles.newConversationButton,
                { 
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                }
              ]}
              onPress={handleCreateNewChat}
              activeOpacity={0.8}
            >
              <Icon name="add" size={20} color={theme.colors.surface} />
            </TouchableOpacity>
          )}
          
          {/* Cleanup Button - only show when not in chat */}
          {!isInChat && (
            <TouchableOpacity 
              style={[
                styles.cleanupButton,
                { backgroundColor: 'rgba(108, 117, 125, 0.08)' }
              ]}
              onPress={handleCleanupOrphanedConversations}
              activeOpacity={0.7}
            >
              <Icon name="cleaning-services" size={20} color="#6c757d" />
            </TouchableOpacity>
          )}
          
          
        </View>
      </View>
    </View>
  );

  const renderConversationItem = ({ item }: { item: { agentId?: number; chatboxId?: number; messages: ChatMessageWithAgent[]; latestMessage: ChatMessageWithAgent } }) => {
    const agent = item.agentId ? allAgents.find(a => a.id === item.agentId) : null;
    const chatbox = item.chatboxId ? allChatboxes.find(c => c.id === item.chatboxId) : null;
    const isUserOwnAgent = agent && agent.user_id && agent.user_id === Number(user?.id);
    const isDefaultAgent = agent && (!agent.user_id || agent.user_id === 0);
    
    // Debug logging
    console.log('🔍 Conversation Item Debug:', {
      agentId: item.agentId,
      chatboxId: item.chatboxId,
      agentName: agent?.name,
      chatboxTitle: chatbox?.title,
      agentUserId: agent?.user_id,
      currentUserId: user?.id,
      isUserOwnAgent,
      isDefaultAgent
    });
    
    const handleDeleteAgentFromConversation = async () => {
      if (!agent || !user) return;
      
      // Always delete conversation (messages) regardless of agent type
      Alert.alert(
        language === 'vi' ? 'Xóa Cuộc Trò Chuyện' : 'Delete Conversation',
        language === 'vi' 
          ? `Bạn có chắc chắn muốn xóa cuộc trò chuyện với "${agent.name}"?\n\nĐiều này sẽ xóa vĩnh viễn toàn bộ cuộc trò chuyện này.`
          : `Are you sure you want to delete the conversation with "${agent.name}"?\n\nThis will permanently delete the entire conversation.`,
        [
          {
            text: language === 'vi' ? 'Hủy' : 'Cancel',
            style: 'cancel',
          },
          {
            text: language === 'vi' ? 'Xóa' : 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete all messages for this agent and user
                const messagesToDelete = chatHistory.filter(msg => msg.agent_id === agent.id);
                let deletedCount = 0;
                
                for (const message of messagesToDelete) {
                  try {
                    await apiService.deleteMessage(message.id, Number(user.id));
                    deletedCount++;
                  } catch (error) {
                    console.error(`Error deleting message ${message.id}:`, error);
                  }
                }
                
                Alert.alert(
                  language === 'vi' ? 'Thành công' : 'Success',
                  language === 'vi' 
                    ? `Đã xóa ${deletedCount} tin nhắn từ cuộc trò chuyện với "${agent.name}"`
                    : `Successfully deleted ${deletedCount} messages from conversation with "${agent.name}"`
                );
                
                // Refresh conversation history
                loadChatHistory();
              } catch (error) {
                console.error('Error deleting conversation:', error);
                Alert.alert(
                  language === 'vi' ? 'Lỗi' : 'Error', 
                  language === 'vi' ? 'Không thể xóa cuộc trò chuyện. Vui lòng thử lại' : 'Failed to delete conversation. Please try again.'
                );
              }
            }
          }
        ]
      );
    };
    
    return (
      <View style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity 
          onPress={() => {
            if (item.agentId) {
              handleConversationPress(item.agentId);
            } else if (item.chatboxId && item.chatboxId > 0) {
              handleChatboxConversationPress(item.chatboxId);
            } else if (item.chatboxId === -1) {
              // Handle general conversation press - navigate to chat with no agent/chatbox
              console.log('🔄 General conversation pressed');
              setSelectedChatbox(null);
              setSelectedAgent(null);
              setIsInChat(true);
              // Clear any previous timestamps to ensure proper message loading
              setLastNewChatTimestamp(null);
              setLastExistingChatTimestamp(null);
            }
          }}
          style={styles.conversationTouchable}
          activeOpacity={0.7}
        >
          <View style={styles.conversationHeader}>
            <View style={styles.conversationAgentInfo}>
              <View style={[styles.agentAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
                <Icon 
                  name={
                    item.agentId 
                      ? "smart-toy" 
                      : item.chatboxId === -1 
                        ? "help" 
                        : "chat"
                  } 
                  size={20} 
                  color={theme.colors.primary} 
                />
              </View>
              <View style={styles.conversationTextContainer}>
                <Text style={[styles.conversationAgentName, { color: theme.colors.text }]}>
                  {item.agentId 
                    ? getAgentName(item.agentId) 
                    : item.chatboxId === -1 
                      ? (language === 'vi' ? 'Chat Chung' : 'General Chat')
                      : (chatbox?.title || 'Unknown Chatbox')
                  }
                </Text>
                <Text style={[styles.conversationMessage, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {item.latestMessage.message}
                </Text>
              </View>
            </View>
            <View style={styles.conversationMeta}>
              <Text style={[styles.conversationTime, { color: theme.colors.textSecondary }]}>
                {formatTime(item.latestMessage.created_at)}
              </Text>
              <Text style={[styles.conversationDate, { color: theme.colors.textSecondary }]}>
                {formatDate(item.latestMessage.created_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Clean Modern Delete Button */}
        {(() => {
          // Show delete button for any conversation that has an agent OR a chatboxId
          // Don't require the chatbox to exist in allChatboxes - just check if item.chatboxId exists
          const shouldShowDelete = (agent || item.chatboxId);
          console.log('🔍 Delete button debug for conversation:', {
            itemChatboxId: item.chatboxId,
            chatboxFound: !!chatbox,
            chatboxTitle: chatbox?.title,
            agentFound: !!agent,
            agentName: agent?.name,
            shouldShowDelete,
            allChatboxesLength: allChatboxes.length
          });
          return shouldShowDelete;
        })() && (
          <TouchableOpacity 
            style={[
              styles.conversationDeleteButton, 
              { 
                backgroundColor: agent 
                  ? (isDefaultAgent 
                      ? 'rgba(108, 117, 125, 0.15)' // More visible gray for default agents
                      : 'rgba(220, 53, 69, 0.15)')   // More visible red for custom agents
                  : 'rgba(220, 53, 69, 0.15)',       // More visible red for chatboxes
                borderWidth: 1,
                borderColor: agent 
                  ? (isDefaultAgent 
                      ? 'rgba(108, 117, 125, 0.3)' 
                      : 'rgba(220, 53, 69, 0.3)')   
                  : 'rgba(220, 53, 69, 0.3)',
              }
            ]}
            onPress={agent ? handleDeleteAgentFromConversation : () => {
              // Handle chatbox deletion or general conversation deletion
              if (item.chatboxId === -1 && user) {
                // Handle general conversation deletion
                Alert.alert(
                  language === 'vi' ? 'Xóa Cuộc Trò Chuyện' : 'Delete Conversation',
                  language === 'vi' 
                    ? `Bạn có chắc chắn muốn xóa cuộc trò chuyện "General Chat"?\n\nĐiều này sẽ xóa vĩnh viễn tất cả tin nhắn trong cuộc trò chuyện này.`
                    : `Are you sure you want to delete the "General Chat" conversation?\n\nThis will permanently delete all messages in this conversation.`,
                  [
                    {
                      text: language === 'vi' ? 'Hủy' : 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: language === 'vi' ? 'Xóa' : 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          // Delete all general messages (messages without agent_id and chatbox_id)
                          const generalMessages = item.messages;
                          let deletedCount = 0;
                          
                          for (const message of generalMessages) {
                            try {
                              await apiService.deleteMessage(message.id, Number(user.id));
                              deletedCount++;
                            } catch (error) {
                              console.error(`Error deleting message ${message.id}:`, error);
                            }
                          }
                          
                          Alert.alert(
                            language === 'vi' ? 'Thành công' : 'Success',
                            language === 'vi' 
                              ? `Đã xóa ${deletedCount} tin nhắn từ cuộc trò chuyện General Chat`
                              : `Successfully deleted ${deletedCount} messages from General Chat conversation`
                          );
                          
                          // Refresh data
                          loadChatHistory();
                        } catch (error) {
                          console.error('Error deleting general conversation:', error);
                          Alert.alert(
                            language === 'vi' ? 'Lỗi' : 'Error',
                            language === 'vi' ? 'Không thể xóa cuộc trò chuyện' : 'Failed to delete conversation'
                          );
                        }
                      }
                    }
                  ]
                );
              } else if (item.chatboxId && item.chatboxId > 0 && user) {
                // Handle regular chatbox deletion (even if chatbox not found in allChatboxes)
                const chatboxTitle = chatbox?.title || `Chatbox ${item.chatboxId}`;
                Alert.alert(
                  language === 'vi' ? 'Xóa Cuộc Trò Chuyện' : 'Delete Conversation',
                  language === 'vi' 
                    ? `Bạn có chắc chắn muốn xóa "${chatboxTitle}"?\n\nĐiều này sẽ xóa vĩnh viễn tất cả tin nhắn trong cuộc trò chuyện này.`
                    : `Are you sure you want to delete "${chatboxTitle}"?\n\nThis will permanently delete all messages in this conversation.`,
                  [
                    {
                      text: language === 'vi' ? 'Hủy' : 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: language === 'vi' ? 'Xóa' : 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          if (item.chatboxId && item.chatboxId > 0) {
                            await apiService.deleteChatbox(item.chatboxId, Number(user.id));
                          }
                          Alert.alert(
                            language === 'vi' ? 'Thành công' : 'Success',
                            language === 'vi' ? 'Cuộc trò chuyện đã được xóa' : 'Conversation deleted successfully'
                          );
                          // Refresh data
                          loadChatHistory();
                          loadAllChatboxes();
                        } catch (error) {
                          console.error('Error deleting chatbox:', error);
                          Alert.alert(
                            language === 'vi' ? 'Lỗi' : 'Error',
                            language === 'vi' ? 'Không thể xóa cuộc trò chuyện' : 'Failed to delete conversation'
                          );
                        }
                      }
                    }
                  ]
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Icon 
              name={agent ? (isDefaultAgent ? "clear-all" : "delete") : "delete"} 
              size={24} 
              color={agent ? (isDefaultAgent ? '#6c757d' : '#dc3545') : '#dc3545'} 
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primary + '20' }]}>
        <Icon name="chat-bubble-outline" size={48} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {language === 'vi' ? 'Chưa Có Cuộc Trò Chuyện' : 'No Conversations Yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {language === 'vi' 
          ? 'Bắt đầu cuộc trò chuyện đầu tiên với AI assistant'
          : 'Start your first conversation with an AI assistant'
        }
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={[styles.loadingIcon, { backgroundColor: theme.colors.primary + '20' }]}>
        <Icon name="hourglass-empty" size={32} color={theme.colors.primary} />
      </View>
      <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
        {language === 'vi' ? 'Đang tải tin nhắn...' : 'Loading messages...'}
      </Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Icon name="lock" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Please log in to use the chat
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.type === 'dark' ? '#0F0F23' : '#667EEA' }]}
    >
      <StatusBar 
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={theme.type === 'dark' 
            ? ['#8B5CF6', '#7C3AED', '#111827'] as [string, string, ...string[]]
            : ['#667EEA', '#764BA2', '#FFFFFF'] as [string, string, ...string[]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modernHeader}
        >
          <View style={styles.headerContent}>
            {isInChat && (
              <TouchableOpacity
                style={[styles.backButtonModern, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={handleBackToConversations}
              >
                <Icon name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            )}
            
            <View style={styles.headerMiddle}>
              {selectedAgent ? (
                <>
                  <LinearGradient
                    colors={['#FFFFFF', '#F7FAFC'] as [string, string, ...string[]]}
                    style={styles.agentAvatarModern}
                  >
                    <Icon name="smart-toy" size={24} color={theme.colors.primary} />
                  </LinearGradient>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentNameModern}>{selectedAgent.name}</Text>
                    <AnimatedStatusIndicator 
                      status="online" 
                      showText={true} 
                      size="small"
                      animated={true}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.noAgentInfo}>
                  <Text style={styles.noAgentTitle}>
                    {isInChat 
                      ? (language === 'vi' ? '💬 Chat Chung' : '💬 General Chat')
                      : (language === 'vi' ? '📚 Lịch Sử Chat' : '📚 Chat History')
                    }
                  </Text>
                  <Text style={styles.noAgentSubtitle}>
                    {isInChat 
                      ? (language === 'vi' ? 'Chat với hệ thống tổng quát' : 'Chat with general system')
                      : (language === 'vi' ? 'Xem tất cả cuộc trò chuyện' : 'View all conversations')
                    }
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
          {/* Personalization Indicator */}
          {personalizationData && personalizationData.total_interactions > 0 && (
            <View style={styles.personalizationIndicator}>
              <Icon name="tune" size={16} color="white" />
              <Text style={styles.personalizationText}>
                {personalizationData.total_interactions}
              </Text>
            </View>
          )}
              
              
              <TouchableOpacity
                style={[styles.headerActionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => setShowAgentSelector(true)}
              >
                <Icon name="smart-toy" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      
      <AgentSelector
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
        visible={showAgentSelector}
        onClose={() => setShowAgentSelector(false)}
        userId={Number((user as any).id)}
      />
      
      {/* Agent Customizer Modal */}
      <AgentCustomizer
        visible={showAgentCustomizer}
        onClose={() => {
          setShowAgentCustomizer(false);
          setEditingAgent(null);
        }}
        onAgentCreated={(agent) => {
          setSelectedAgent(agent);
          setSelectedChatbox(null);
          setShowAgentSelector(false);
          setIsInChat(true);
          // Clear any previous timestamps to ensure proper message loading
          setLastNewChatTimestamp(null);
          setLastExistingChatTimestamp(null);
          // Refresh conversation history to show migrated conversations
          loadChatHistory();
          // Refresh agents list to include the new custom agent
          loadAllAgents();
        }}
        onAgentUpdated={handleAgentUpdated}
        editingAgent={editingAgent}
        userId={Number((user as any).id)}
      />
      
      {isInChat ? (
        // Modern Chat Interface
        <>
          {/* Messages Container */}
          <ScrollView 
            ref={scrollRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              console.log('📱 FlatList content size changed, messages length:', messages.length);
              console.log('📱 Should preserve scroll:', shouldPreserveScroll, 'Scroll position:', scrollPosition);
              
              // Restore scroll position if we're preserving it and not already restoring
              if (shouldPreserveScroll && scrollPosition > 0 && !isRestoringScroll) {
                console.log('📱 Restoring scroll position to:', scrollPosition);
                setIsRestoringScroll(true);
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: scrollPosition, animated: false });
                  setShouldPreserveScroll(false);
                  setIsRestoringScroll(false);
                  console.log('📱 Scroll position restored');
                }, 100); // Increased delay for better reliability
              } else if (!shouldPreserveScroll && messages.length > 0) {
                // Auto-scroll to bottom when content changes (new messages)
                console.log('📱 Auto-scrolling to bottom');
                scrollRef.current?.scrollToEnd({ animated: false });
              }
            }}
            onLayout={() => {
              console.log('📱 FlatList layout changed, messages length:', messages.length);
              console.log('📱 Should preserve scroll:', shouldPreserveScroll, 'Scroll position:', scrollPosition);
              
              // Restore scroll position if we're preserving it and not already restoring
              if (shouldPreserveScroll && scrollPosition > 0 && !isRestoringScroll) {
                console.log('📱 Restoring scroll position to:', scrollPosition);
                setIsRestoringScroll(true);
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: scrollPosition, animated: false });
                  setShouldPreserveScroll(false);
                  setIsRestoringScroll(false);
                  console.log('📱 Scroll position restored');
                }, 100); // Increased delay for better reliability
              } else if (!shouldPreserveScroll && messages.length > 0) {
                // Auto-scroll to bottom on layout (new messages)
                console.log('📱 Auto-scrolling to bottom');
                scrollRef.current?.scrollToEnd({ animated: false });
              }
            }}
          >
            {/* Message Content */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <LinearGradient
                  colors={['rgba(102,126,234,0.1)', 'rgba(118,75,162,0.1)'] as [string, string, ...string[]]}
                  style={styles.loadingCard}
                >
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  {language === 'vi' ? 'Đang tải tin nhắn...' : 'Loading messages...'}
                </Text>
                </LinearGradient>
              </View>
            ) : messages.length === 0 ? (
              renderEmptyState()
            ) : (
              messages.map((message, index) => {
                // Skip rendering if both message and response are empty
                if (!message.message && !message.response) {
                  return null;
                }
                
                return (
                <React.Fragment key={message.id}>
                    {/* User Message - only render if message exists */}
                    {message.message && (
                  <ChatMessageBubble
                    message={message}
                    response={message.response}
                    isUser={true}
                    timestamp={message.created_at}
                    agentId={selectedAgent?.id}
                    animated={!attachmentOptionsVisible}
                    isLegacyVoiceMessage={false}
                  />
                    )}
                    {/* AI Response - only render if response exists */}
                  {message.response && (
                    <ChatMessageBubble
                      message={message}
                      response={message.response}
                      isUser={false}
                      timestamp={message.created_at}
                      agentId={selectedAgent?.id}
                      animated={!attachmentOptionsVisible}
                      isLegacyVoiceMessage={false}
                    />
                  )}
                </React.Fragment>
                );
              })
            )}
          </ScrollView>

          {/* Modern Input Section */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modernInputContainer}
            enabled={!attachmentOptionsVisible && !showInlineVoiceRecorder}
            keyboardVerticalOffset={0}
          >
            <ChatInput
                value={inputMessage}
                onChangeText={setInputMessage}
              onSend={sendMessage}
              onAttach={() => {
                console.log('🔘 Attachment button pressed!');
                console.log('🔘 Current state - isSending:', isSending, 'isInChat:', isInChat);
                handleImportTxt();
              }}
              onSpeech={handleSpeechButtonPress}
              onVoiceRecord={handleInlineVoiceRecord}
                placeholder={
                  isListening
                    ? (language === 'vi' ? 'Đang nghe...' : 'Listening...')
                    : (language === 'vi' ? 'Nhập tin nhắn của bạn...' : 'Type your message...')
                }
                disabled={isSending}
              showAttach={true}
              showSpeech={true}
              showVoiceRecord={true}
              isListening={isListening}
              isRecording={isRecordingVoice}
            />
          </KeyboardAvoidingView>
        </>
      ) : (
        // Conversations List
        <FlatList
          data={(() => {
            const agentConversations = getConversationsByAgent();
            const chatboxConversations = getConversationsByChatbox();
            const generalConversations = getGeneralConversations();
            const allConversations = [...agentConversations, ...chatboxConversations, ...generalConversations];
            
            console.log('🔄 ChatScreen: FlatList data debug:', {
              agentConversations: agentConversations.length,
              chatboxConversations: chatboxConversations.length,
              generalConversations: generalConversations.length,
              totalConversations: allConversations.length,
              chatboxDetails: chatboxConversations.map(c => ({ id: c.chatboxId, messageCount: c.messages.length }))
            });
            
            return allConversations;
          })()}
          keyExtractor={(item) => String('agentId' in item ? item.agentId : item.chatboxId)}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshing={isRefreshingConversations}
          onRefresh={async () => {
            setIsRefreshingConversations(true);
            try {
              await Promise.all([loadChatHistory(), loadAllAgents(), loadAllChatboxes()]);
            } finally {
              setIsRefreshingConversations(false);
            }
          }}
        />
      )}
      
      {/* File Import Modal */}
      <Modal
        visible={showFileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {language === 'vi' ? 'Xử lý tệp' : 'Process File'}
            </Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
              {language === 'vi' 
                ? `Tệp "${fileModalName}" đã được đọc thành công. Chọn cách xử lý:`
                : `File "${fileModalName}" has been read successfully. Choose how to process:`
              }
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.colors.border }]}
                onPress={() => {
                  console.log('📁 User chose: Cancel');
                  setShowFileModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimaryButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  console.log('📁 User chose: Upload for Processing');
                  setShowFileModal(false);
                  handleUploadToBackend(fileModalContent, fileModalName);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.surface }]}>
                  {language === 'vi' ? 'Phân tích AI' : 'AI Analysis'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Import Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setImageModalVisible(false);
          setSelectedImage(null);
          setImageLoading(false);
          setImageError(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {selectedFileType === 'image' 
                ? (language === 'vi' ? 'Chọn ảnh' : 'Select Image')
                : (language === 'vi' ? 'Chọn tài liệu' : 'Select Document')
              }
            </Text>
            
            {(selectedImage || selectedDocument) && (
              <View style={styles.imagePreviewContainer}>
                <Text style={{ color: theme.colors.text, fontSize: 12, marginBottom: 8 }}>
                  {selectedFileType === 'image' ? 'Image:' : 'Document:'} {selectedFileName}
                </Text>
                {imageLoading && (
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 8 }}>
                    Loading {selectedFileType}...
                  </Text>
                )}
                {imageError && (
                  <Text style={{ color: theme.colors.error || '#ff0000', fontSize: 14, marginBottom: 8 }}>
                    Error: {imageError}
                  </Text>
                )}
                {selectedFileType === 'image' && selectedImage && (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.imagePreview}
                    resizeMode="contain"
                    onError={(error) => {
                      console.error('❌ Image display error:', error);
                      setImageError('Failed to load image');
                      setImageLoading(false);
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', selectedImage);
                      setImageLoading(false);
                      setImageError(null);
                    }}
                  />
                )}
                {selectedFileType === 'document' && selectedDocument && (
                  <View style={[styles.documentPreview, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <Icon name="description" size={48} color={theme.colors.primary} />
                    <Text style={[styles.documentPreviewText, { color: theme.colors.text }]}>
                      {selectedFileName}
                    </Text>
                    <Text style={[styles.documentPreviewSubtext, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' ? 'Tài liệu đã sẵn sàng để gửi' : 'Document ready to send'}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
              {language === 'vi' 
                ? `Nhập tin nhắn để gửi cùng với ${selectedFileType === 'image' ? 'ảnh' : 'tài liệu'}:`
                : `Enter a message to send with the ${selectedFileType}:`
              }
            </Text>
            
            <TextInput
              style={[styles.imageMessageInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder={language === 'vi' ? 'Nhập tin nhắn...' : 'Type your message...'}
              placeholderTextColor={theme.colors.textSecondary}
              multiline={true}
              numberOfLines={3}
              onChangeText={setInputMessage}
              value={inputMessage}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setImageModalVisible(false);
                  setSelectedImage(null);
                  setInputMessage('');
                  setImageLoading(false);
                  setImageError(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimaryButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  if (selectedFileType === 'image' && selectedImage) {
                    sendImageWithMessage(selectedImage, inputMessage);
                  } else if (selectedFileType === 'document' && selectedDocument) {
                    sendDocumentWithMessage(selectedDocument, inputMessage, selectedFileName);
                  }
                }}
                disabled={isSending}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.surface }]}>
                  {isSending 
                    ? (language === 'vi' ? 'Đang gửi...' : 'Sending...')
                    : (language === 'vi' 
                        ? (selectedFileType === 'image' ? 'Gửi ảnh' : 'Gửi tài liệu')
                        : (selectedFileType === 'image' ? 'Send Image' : 'Send Document')
                      )
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Speech Test Modal */}
      <Modal
        visible={showSpeechTest}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SpeechDiagnostic onClose={() => setShowSpeechTest(false)} />
      </Modal>

      {/* Voice Chat Demo Modal */}
      <Modal
        visible={showVoiceDemo}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <VoiceChatDemo onClose={() => setShowVoiceDemo(false)} />
      </Modal>

      {/* Web Voice Diagnostic Modal */}
      <Modal
        visible={showWebDiagnostic}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <WebVoiceDiagnostic onClose={() => setShowWebDiagnostic(false)} />
      </Modal>

      {/* Voice Recorder Modal */}
      <Modal
        visible={showVoiceRecorder}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <VoiceRecorder
          onRecordingComplete={handleVoiceMessageComplete}
          onCancel={handleVoiceRecorderCancel}
          maxDuration={60}
        />
      </Modal>

      {/* Inline Voice Recorder */}
      <InlineVoiceRecorder
        isVisible={showInlineVoiceRecorder}
        onRecordingComplete={handleInlineVoiceMessageComplete}
        onCancel={handleInlineVoiceRecorderCancel}
        maxDuration={60}
      />

      {/* Floating Action Button for New Chat */}
      {!isInChat && (
        <FloatingActionButton
          icon="add"
          onPress={() => {
            console.log('🔄 New chat button pressed - creating new general chat');
            // Navigate to ChatScreen with new chat parameters (same as HomeScreen)
            navigation.navigate('Chat', { 
              generalChat: true,
              newChatTimestamp: Date.now()
            });
          }}
          position="bottom-right"
          primary={true}
          elevation={12}
        />
      )}

    </SafeAreaView>
    
    {/* Attachment Options Mini Table - Production Design */}
      {attachmentOptionsVisible && (
      <View style={styles.attachmentOverlay}>
        <TouchableOpacity
          style={styles.attachmentBackdrop}
          activeOpacity={1}
          onPress={() => {
            console.log('📁 Backdrop pressed - closing');
            // Animate slide down
            Animated.timing(slideAnim, {
              toValue: 300,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
            setAttachmentOptionsVisible(false);
            });
          }}
        >
          <Animated.View 
            style={[
              styles.attachmentOptionsContainer,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={[styles.miniTableContent, { backgroundColor: theme.colors.surface }]}>
              {/* Header */}
              <View style={styles.miniTableHeader}>
                <Text style={[styles.miniTableTitle, { color: theme.colors.text }]}>
                  {language === 'vi' ? 'Đính kèm tệp' : 'Attach File'}
              </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    // Animate slide down
                    Animated.timing(slideAnim, {
                      toValue: 300,
                      duration: 200,
                      useNativeDriver: true,
                    }).start(() => {
                      setAttachmentOptionsVisible(false);
                    });
                  }}
                >
                  <Icon name="close" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View style={styles.miniTableOptions}>
              <TouchableOpacity
                style={[styles.miniTableOption, { borderColor: theme.colors.border }]}
                onPress={() => {
                  console.log('📁 Image option pressed');
                    // Animate slide down
                    Animated.timing(slideAnim, {
                      toValue: 300,
                      duration: 200,
                      useNativeDriver: true,
                    }).start(() => {
                  setAttachmentOptionsVisible(false);
                  pickImage();
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="image" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                      {language === 'vi' ? 'Hình ảnh' : 'Image'}
                </Text>
                    <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' ? 'Chọn từ thư viện' : 'Choose from gallery'}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.miniTableOption, { borderColor: theme.colors.border }]}
                onPress={() => {
                  console.log('📁 Document option pressed');
                    // Animate slide down
                    Animated.timing(slideAnim, {
                      toValue: 300,
                      duration: 200,
                      useNativeDriver: true,
                    }).start(() => {
                  setAttachmentOptionsVisible(false);
                  pickDocument();
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: theme.colors.success + '15' }]}>
                    <Icon name="description" size={20} color={theme.colors.success} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                      {language === 'vi' ? 'Tài liệu' : 'Document'}
                </Text>
                    <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' ? 'Chọn tệp từ thiết bị' : 'Choose file from device'}
                    </Text>
            </View>
                  <Icon name="chevron-right" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.miniTableOption, { borderColor: theme.colors.border }]}
          onPress={() => {
                    console.log('📁 Camera option pressed');
                    // Animate slide down
                    Animated.timing(slideAnim, {
                      toValue: 300,
                      duration: 200,
                      useNativeDriver: true,
                    }).start(() => {
                      setAttachmentOptionsVisible(false);
                      // TODO: Implement camera functionality
                      Alert.alert(
                        language === 'vi' ? 'Tính năng sắp có' : 'Coming Soon',
                        language === 'vi' ? 'Chụp ảnh sẽ có sẵn trong phiên bản tiếp theo' : 'Camera capture will be available in the next version'
                      );
            });
          }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: theme.colors.warning + '15' }]}>
                    <Icon name="camera-alt" size={20} color={theme.colors.warning} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                      {language === 'vi' ? 'Máy ảnh' : 'Camera'}
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' ? 'Chụp ảnh mới' : 'Take new photo'}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Modern ChatScreen Styles
  modernHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
    paddingBottom: 16,
    elevation: Platform.OS === 'android' ? 12 : 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  backButtonModern: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 4,
    shadowColor: 'rgba(139, 92, 246, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerMiddle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  agentAvatarModern: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  agentInfo: {
    flex: 1,
  },
  agentNameModern: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  noAgentInfo: {
    flex: 1,
    alignItems: 'center',
  },
  noAgentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  noAgentSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 4,
    shadowColor: 'rgba(139, 92, 246, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingBottom: 20,
    paddingTop: 16,
  },
  modernInputContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 8 : 16,
  },
  loadingCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.8,
  },
  clearButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newConversationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cleanupButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    // Remove elevation for Android to avoid border-like shadow
    elevation: 0,
    // Use shadowColor/shadowOffset for iOS only
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 0,
    // Clean modern background
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  agentButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  conversationsList: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  userMessageRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  aiMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    minWidth: '20%',
    borderRadius: 20,
    padding: 16,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    flexShrink: 1,
  },
  userMessageBubble: {
    borderBottomRightRadius: 8,
    marginLeft: 8,
  },
  aiMessageBubble: {
    borderBottomLeftRadius: 8,
    marginRight: 8,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  aiResponseSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  aiResponseText: {
    fontSize: 15,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  messageTimestamp: {
    fontSize: 12,
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: -20, // Adjust position to be outside the bubble
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)',
  },
  conversationItem: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationTouchable: {
    flex: 1,
  },
  conversationDeleteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    // Remove elevation for Android to avoid border-like shadow
    elevation: 0,
    // Use shadowColor/shadowOffset for iOS only
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 0,
    // Clean modern background
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  conversationAgentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  conversationTextContainer: {
    flex: 1,
  },
  conversationAgentName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  conversationMessage: {
    fontSize: 15,
    lineHeight: 22,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  conversationTime: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  conversationDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingVertical: 8,
    lineHeight: 20,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  importButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  contextContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 14,
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalPrimaryButton: {
    // backgroundColor set dynamically
  },
  modalSecondaryButton: {
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Attachment mini table styles - Production Design
  attachmentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  attachmentBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 100,
    paddingHorizontal: 20,
    pointerEvents: 'auto',
  },
  attachmentOptionsContainer: {
    width: '100%',
    maxWidth: 320,
  },
  miniTableContent: {
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  miniTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  miniTableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  miniTableOptions: {
    paddingVertical: 8,
  },
  miniTableOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 0,
    marginVertical: 0,
    backgroundColor: 'transparent',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    opacity: 0.7,
  },
  // Image modal styles
  imagePreviewContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  documentPreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  documentPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  documentPreviewSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  imageMessageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  // File attachment styles
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileIconContainer: {
    marginRight: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    opacity: 0.8,
  },
  // Personalization indicator styles
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personalizationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  personalizationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatScreen;
