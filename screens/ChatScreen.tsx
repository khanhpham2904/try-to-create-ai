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
import { apiService, ChatMessage, Agent } from '../services/api';
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
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      // Clear messages immediately when agent changes to avoid showing wrong messages
      setMessages([]);
      loadMessages();
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [user, selectedAgent]);

  // Reload messages when screen comes into focus (when rejoining app)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log('🔄 Screen focused, reloading messages...');
        loadMessages();
      }
    }, [user])
  );

  const loadMessages = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('📜 Loading messages for user:', user.id, 'with agent:', selectedAgent?.id);
      
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

    // Add user message immediately for real-time experience
    setMessages(prev => [...prev, userMessage]);
    
    // Add a temporary "AI is typing" message
    const typingMessage: ChatMessage = {
      id: Date.now() + 1, // Temporary ID
      message: '',
      response: language === 'vi' ? '🤖 AI đang trả lời...' : '🤖 AI is typing...',
      user_id: Number(user.id),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, typingMessage]);
    
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
          const filteredMessages = prev.filter(msg => msg.id !== Date.now() + 1); // Remove typing message
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
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error', 
        language === 'vi' ? 'Không thể gửi tin nhắn' : 'Failed to send message'
      );
      // Remove the temporary messages on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id && msg.id !== Date.now() + 1));
      setInputMessage(messageText);
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
          <View style={[styles.headerAvatar, { backgroundColor: theme.colors.primary }]}>
            <Icon name="smart-toy" size={24} color={theme.colors.surface} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {selectedAgent ? selectedAgent.name : (language === 'vi' ? 'Trợ Lý AI' : 'AI Assistant')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {selectedAgent 
                ? `${selectedAgent.personality} • ${language === 'vi' ? 'Cuộc trò chuyện riêng' : 'Private chat'}`
                : (language === 'vi' ? 'Chọn một trợ lý để bắt đầu' : 'Choose an assistant to get started')
              }
            </Text>
          </View>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[
              styles.agentButton, 
              { 
                backgroundColor: selectedAgent ? theme.colors.primary + '20' : theme.colors.card,
                borderColor: selectedAgent ? theme.colors.primary + '40' : theme.colors.border,
                borderWidth: 1,
              }
            ]}
            onPress={() => {
              console.log('🔍 ChatScreen: Agent button pressed, opening selector...');
              setShowAgentSelector(true);
            }}
          >
            <Icon 
              name="person" 
              size={20} 
              color={selectedAgent ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {messages.length > 0 && (
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primary + '20' }]}>
        <Icon name="chat-bubble-outline" size={48} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {language === 'vi' ? 'Bắt Đầu Cuộc Trò Chuyện' : 'Start a Conversation'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {selectedAgent 
          ? (language === 'vi' 
              ? `Bắt đầu cuộc trò chuyện riêng với ${selectedAgent.name}`
              : `Start a private conversation with ${selectedAgent.name}`)
          : (language === 'vi' 
              ? 'Chọn một trợ lý AI để bắt đầu trò chuyện'
              : 'Choose an AI assistant to begin chatting')
        }
      </Text>
      {!selectedAgent && (
        <TouchableOpacity 
          style={[styles.selectAgentButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowAgentSelector(true)}
        >
          <Icon name="person" size={20} color="white" />
          <Text style={styles.selectAgentText}>
            {language === 'vi' ? 'Chọn Trợ Lý' : 'Choose Assistant'}
          </Text>
        </TouchableOpacity>
      )}
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
        onAgentSelect={setSelectedAgent}
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
