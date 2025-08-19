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
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgent } from '../components/AgentContext';
import { apiService, ChatMessage, Agent, ChatMessageWithAgent } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AgentCustomizer from '../components/AgentCustomizer';
import AgentSelector from '../components/AgentSelector';
import { useFocusEffect } from '@react-navigation/native';

interface ChatScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { selectedAgent, setSelectedAgent } = useAgent();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessageWithAgent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [isInChat, setIsInChat] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      loadChatHistory();
      loadAllAgents();
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [user]);

  // Reload messages when screen comes into focus (when rejoining app)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log('🔄 Screen focused, reloading data...');
        loadChatHistory();
        loadAllAgents();
      }
    }, [user])
  );

  // Cleanup typing messages when switching agents or component unmounts
  useEffect(() => {
    const cleanupTypingMessages = () => {
      setMessages(prev => {
        const typingMessagePattern = language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...';
        const hasTypingMessages = prev.some(msg => 
          msg.response && msg.response.includes(typingMessagePattern)
        );
        
        if (hasTypingMessages) {
          console.log('🧹 Cleanup: Removing stuck typing messages');
          return prev.filter(msg => 
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

  // Load messages when selectedAgent changes
  useEffect(() => {
    if (user && selectedAgent && isInChat) {
      console.log('🔄 Selected agent changed, loading messages for:', selectedAgent.name, 'ID:', selectedAgent.id);
      loadMessages();
    }
  }, [selectedAgent?.id, user?.id, isInChat]); // Use selectedAgent.id instead of selectedAgent to prevent unnecessary re-renders

  const loadChatHistory = async () => {
    if (!user) return;

    try {
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

  const loadMessages = async () => {
    if (!user) {
      console.log('❌ Cannot load messages: No user');
      return;
    }
    
    if (!selectedAgent) {
      console.log('❌ Cannot load messages: No selected agent');
      return;
    }
    
    if (!isInChat) {
      console.log('❌ Cannot load messages: Not in chat mode');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('📜 Loading messages for user:', user.id, 'with agent:', selectedAgent.id, 'name:', selectedAgent.name);
      
      // Add a small delay to show loading state when switching agents
      if (selectedAgent) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const response = await apiService.getUserMessages(Number(user.id), 0, 100, selectedAgent?.id);
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
          created_at: msg.created_at,
        }));
        
        // Backend already filters by agent, so no need to filter again
        console.log('📜 Using', processedMessages.length, 'messages for agent:', selectedAgent?.name || 'all agents');
        
        // Sort messages chronologically (oldest first, newest last)
        const sortedMessages = processedMessages.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateA - dateB; // Ascending order (oldest first)
        });
        
        console.log('📜 Processed and sorted messages:', sortedMessages);
        setMessages(sortedMessages);
        
        // Scroll to top when switching agents to show the new conversation
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      } else {
        console.log('📜 No messages found or invalid response format');
        setMessages([]);
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
    if (!user || !inputMessage.trim() || isSending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    
    setIsSending(true);

    // Create a user message to show immediately on the right
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
    setMessages(prev => [...prev, userMessage]);
    
    // Add a temporary "AI is typing" message
    const typingMessage: ChatMessage = {
      id: typingMessageId, // Use stored ID
      message: '',
      response: language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...',
      user_id: Number(user.id),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, typingMessage]);
    
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
    }, 30000); // 30 seconds timeout
    
    // Scroll to bottom to show the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    console.log('💬 ChatScreen: Sending message with agent:', selectedAgent?.id);

    try {
      const response = await apiService.sendMessage(
        Number(user.id), 
        messageText, 
        undefined, 
        selectedAgent?.id
      );
      console.log('💬 ChatScreen: Message response:', response);
      
      if (response.data) {
        // Create separate AI message to show on the left (keep user message)
        const aiMessage: ChatMessage = {
          id: response.data.id,
          message: '', // Empty message field for AI
          response: response.data.response, // AI response
          user_id: Number(user.id), // Same user_id but with response
          created_at: response.data.created_at,
        };

        // Replace the typing message with the actual AI response
        setMessages(prev => {
          console.log('🔄 Removing typing message with ID:', typingMessageId);
          console.log('🔄 Current messages before filter:', prev.map(m => ({ id: m.id, response: m.response })));
          
          // First try to remove by exact ID match
          let filteredMessages = prev.filter(msg => {
            const shouldKeep = msg.id !== typingMessageId;
            if (!shouldKeep) {
              console.log('🔄 Removing typing message by ID:', msg.id, msg.response);
            }
            return shouldKeep;
          });
          
          // Fallback: if typing message still exists, remove by content pattern
          const typingMessagePattern = language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...';
          const hasTypingMessage = filteredMessages.some(msg => 
            msg.response && msg.response.includes(typingMessagePattern)
          );
          
          if (hasTypingMessage) {
            console.log('🔄 Fallback: Removing typing message by content pattern');
            filteredMessages = filteredMessages.filter(msg => 
              !msg.response || !msg.response.includes(typingMessagePattern)
            );
          }
          
          console.log('🔄 Messages after filter:', filteredMessages.length);
          console.log('🔄 Adding AI message:', aiMessage.id, aiMessage.response);
          return [...filteredMessages, aiMessage];
        });
        
        // Scroll to the bottom to show the AI response with a longer delay for longer responses
        const scrollDelay = response.data.response.length > 1000 ? 300 : 100;
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, scrollDelay);
        
        // Log response length for debugging
        console.log(`💬 AI Response length: ${response.data.response.length} characters`);
      }
      
      // Clear the typing timeout since we got a response
      clearTimeout(typingTimeout);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error', 
        language === 'vi' ? 'Không thể gửi tin nhắn' : 'Failed to send message'
      );
      // Remove the temporary messages on error
      setMessages(prev => {
        console.log('❌ Error cleanup: Removing temporary messages');
        const filteredMessages = prev.filter(msg => msg.id !== userMessage.id && msg.id !== typingMessageId);
        
        // Fallback: also remove any typing messages by content
        const typingMessagePattern = language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...';
        const finalMessages = filteredMessages.filter(msg => 
          !msg.response || !msg.response.includes(typingMessagePattern)
        );
        
        console.log('❌ Messages after error cleanup:', finalMessages.length);
        return finalMessages;
      });
      setInputMessage(messageText);
      
      // Clear the typing timeout on error
      clearTimeout(typingTimeout);
    } finally {
      setIsSending(false);
    }
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

  const clearAllMessages = async () => {
    if (!user) return;

    Alert.alert(
      language === 'vi' ? 'Xóa Tất Cả' : 'Clear All Messages',
      language === 'vi' ? 'Bạn có chắc chắn muốn xóa tất cả tin nhắn? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete all messages? This action cannot be undone.',
      [
        { text: language === 'vi' ? 'Hủy' : 'Cancel', style: 'cancel' },
        {
          text: language === 'vi' ? 'Xóa' : 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteAllMessages(Number(user.id));
              setMessages([]);
            } catch (error) {
              console.error('Error clearing messages:', error);
              Alert.alert(
                language === 'vi' ? 'Lỗi' : 'Error', 
                language === 'vi' ? 'Không thể xóa tin nhắn' : 'Failed to clear messages'
              );
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return language === 'vi' ? 'Chưa có' : 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getConversationsByAgent = () => {
    const conversations: { [agentId: number]: ChatMessageWithAgent[] } = {};
    
    chatHistory.forEach(message => {
      if (message.agent_id) {
        if (!conversations[message.agent_id]) {
          conversations[message.agent_id] = [];
        }
        conversations[message.agent_id].push(message);
      }
    });

    // Convert to array and sort by latest message
    return Object.entries(conversations)
      .map(([agentId, messages]) => ({
        agentId: parseInt(agentId),
        messages: messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        latestMessage: messages[0] // Already sorted, so first is latest
      }))
      .sort((a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime());
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
      setIsInChat(true);
      // loadMessages() will be called by useEffect when selectedAgent changes
    }
  };

  const handleBackToConversations = () => {
    setIsInChat(false);
    setSelectedAgent(null);
    setMessages([]);
  };

  const handleCreateNewChat = () => {
    setShowAgentSelector(true);
  };

  const handleAgentSelect = (agent: Agent | null) => {
    setSelectedAgent(agent);
    setShowAgentSelector(false);
    if (agent) {
      console.log('🔄 Agent selected:', agent.name, 'ID:', agent.id);
      setIsInChat(true);
      // loadMessages() will be called by useEffect when selectedAgent changes
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    console.log('🎨 Rendering message:', message);
    console.log('🎨 User ID:', user?.id, 'Message user_id:', message.user_id);
    console.log('🎨 Message content:', message.message);
    console.log('🎨 Response content:', message.response);
    
    // Check if this message has user content (message field)
    const hasUserContent = message.message && message.message.trim() !== '';
    // Check if this message has AI response (response field)
    const hasAIResponse = message.response && message.response.trim() !== '';
    
    console.log('🎨 Has user content:', hasUserContent);
    console.log('🎨 Has AI response:', hasAIResponse);
    
    // If message has both user content and AI response, render them separately
    if (hasUserContent && hasAIResponse) {
      console.log('🎨 Rendering combined message (user + AI)');
    return (
        <View key={`${message.id}-combined`}>
          {/* User Message (Right Side) */}
          <View style={[styles.messageRow, styles.userMessageRow]}>
            <View style={[styles.messageBubble, styles.userMessageBubble, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.messageText, { color: theme.colors.surface }]}>
                {message.message}
              </Text>
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
            <View style={[styles.messageBubble, styles.aiMessageBubble, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.messageText, { color: theme.colors.text }]}>
                {message.response}
              </Text>
              <Text style={[styles.messageTimestamp, { color: theme.colors.textSecondary }]}>
                {formatTime(message.created_at)}
              </Text>
            </View>
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
            <Text style={[styles.messageText, { color: theme.colors.surface }]}>
              {message.message}
            </Text>
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
          <View style={[styles.messageBubble, styles.aiMessageBubble, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.messageText, { color: theme.colors.text }]}>
              {message.response}
            </Text>
            <Text style={[styles.messageTimestamp, { color: theme.colors.textSecondary }]}>
              {formatTime(message.created_at)}
            </Text>
          </View>
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
            <Icon name="smart-toy" size={24} color={theme.colors.surface} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {isInChat 
                ? (selectedAgent ? selectedAgent.name : (language === 'vi' ? 'Trợ Lý AI' : 'AI Assistant'))
                : (language === 'vi' ? 'Cuộc Trò Chuyện' : 'Conversations')
              }
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {isInChat 
                ? (selectedAgent 
                    ? `${selectedAgent.personality} • ${language === 'vi' ? 'Cuộc trò chuyện riêng' : 'Private chat'}`
                    : (language === 'vi' ? 'Chọn một trợ lý để bắt đầu' : 'Choose an assistant to get started'))
                : (language === 'vi' ? 'Chọn cuộc trò chuyện hoặc tạo mới' : 'Select conversation or create new')
              }
            </Text>
          </View>
        </View>
        
        <View style={styles.headerButtons}>
          {!isInChat && (
            <TouchableOpacity 
              style={[
                styles.agentButton, 
                { 
                  backgroundColor: theme.colors.primary + '20',
                  borderColor: theme.colors.primary + '40',
                  borderWidth: 1,
                }
              ]}
              onPress={handleCreateNewChat}
            >
              <Icon 
                name="add" 
                size={20} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          )}
          
          {isInChat && (
            <TouchableOpacity 
              style={[
                styles.agentButton, 
                { 
                  backgroundColor: selectedAgent ? theme.colors.primary + '20' : theme.colors.card,
                  borderColor: selectedAgent ? theme.colors.primary + '40' : theme.colors.border,
                  borderWidth: 1,
                }
              ]}
              onPress={() => setShowAgentSelector(true)}
            >
              <Icon 
                name="person" 
                size={20} 
                color={selectedAgent ? theme.colors.primary : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          )}
          
          {isInChat && messages.length > 0 && (
            <TouchableOpacity 
              onPress={clearAllMessages} 
              style={[
                styles.clearButton,
                { backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error + '30' }
              ]}
            >
              <Icon name="clear-all" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderConversationItem = ({ item }: { item: { agentId: number; messages: ChatMessageWithAgent[]; latestMessage: ChatMessageWithAgent } }) => {
    return (
      <TouchableOpacity 
        onPress={() => handleConversationPress(item.agentId)}
        style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}
        activeOpacity={0.7}
      >
        <View style={styles.conversationHeader}>
          <View style={styles.conversationAgentInfo}>
            <View style={[styles.agentAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
              <Icon name="smart-toy" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.conversationTextContainer}>
              <Text style={[styles.conversationAgentName, { color: theme.colors.text }]}>
                {getAgentName(item.agentId)}
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
      <TouchableOpacity 
        style={[styles.selectAgentButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateNewChat}
      >
        <Icon name="add" size={20} color="white" />
        <Text style={styles.selectAgentText}>
          {language === 'vi' ? 'Tạo Cuộc Trò Chuyện Mới' : 'Create New Conversation'}
        </Text>
      </TouchableOpacity>
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.surface}
        translucent={Platform.OS === 'android'}
      />
      {renderHeader()}
      
      <AgentSelector
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
        visible={showAgentSelector}
        onClose={() => setShowAgentSelector(false)}
        userId={Number((user as any).id)}
      />
      
      {/* Agent Customizer Modal */}
      <AgentCustomizer
        visible={false}
        onClose={() => {}}
        onAgentCreated={(agent) => {
          setSelectedAgent(agent);
          setShowAgentSelector(false);
        }}
        onAgentUpdated={(agent) => {
          setSelectedAgent(agent);
        }}
        editingAgent={null}
        userId={Number((user as any).id)}
      />
      
      {isInChat ? (
        // Chat Interface
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item, index }) => {
              console.log('📱 FlatList rendering item:', item, 'at index:', index);
              return renderMessage(item, index);
            }}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              styles.messagesList,
              { paddingBottom: 20 }
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              console.log('📱 FlatList content size changed, messages length:', messages.length);
              // Auto-scroll to bottom when content changes
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            onLayout={() => {
              console.log('📱 FlatList layout changed, messages length:', messages.length);
              // Auto-scroll to bottom on layout
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListEmptyComponent={() => {
              console.log('📱 FlatList showing empty state, messages length:', messages.length);
              return renderEmptyState();
            }}
            ListHeaderComponent={isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  {language === 'vi' ? 'Đang tải tin nhắn...' : 'Loading messages...'}
                </Text>
              </View>
            ) : null}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
          >
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface }]}>
              <TextInput
                style={[styles.textInput, { color: theme.colors.text }]}
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder={language === 'vi' ? 'Nhập tin nhắn của bạn...' : 'Type your message...'}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                maxLength={1000}
                textAlignVertical="center"
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!inputMessage.trim() || isSending}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: inputMessage.trim() && !isSending 
                      ? theme.colors.primary 
                      : theme.colors.border,
                    transform: [{ scale: inputMessage.trim() && !isSending ? 1 : 0.9 }],
                  }
                ]}
                activeOpacity={0.8}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={theme.colors.surface} />
                ) : (
                  <Icon 
                    name="send" 
                    size={22} 
                    color={inputMessage.trim() ? theme.colors.surface : theme.colors.textSecondary} 
                  />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </>
      ) : (
        // Conversations List
        <FlatList
          data={getConversationsByAgent()}
          keyExtractor={(item) => String(item.agentId)}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 60,
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
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
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
    maxWidth: '75%',
    borderRadius: 20,
    padding: 16,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
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
  selectAgentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectAgentText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
});

export default ChatScreen;
