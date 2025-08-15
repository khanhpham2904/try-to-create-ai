// Temporarily disabled due to missing API methods
/*
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { apiService, ChatMessage } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

interface RealTimeChatHistoryProps {
  userId: number;
  onMessagePress?: (message: ChatMessage) => void;
  onRefresh?: () => void;
  maxMessages?: number;
  showConnectionStatus?: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const RealTimeChatHistory: React.FC<RealTimeChatHistoryProps> = ({
  userId,
  onMessagePress,
  onRefresh,
  maxMessages = 100,
  showConnectionStatus = true,
}) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<number>(0);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initializeRealTimeChat();
    return () => {
      // apiService.stopRealTimeChat();
    };
  }, [userId]);

  const initializeRealTimeChat = async () => {
    try {
      await loadChatHistory();
      
      // Start real-time updates
      // apiService.startRealTimeChat(userId);
      
      // Set up WebSocket message handlers
      // apiService.onWebSocketMessage((chatMessage: ChatMessage) => {
      //   handleNewMessage(chatMessage);
      // });
      
      // Set up WebSocket connection status
      // apiService.onWebSocketConnectionChange((connected: boolean) => {
      //   setIsConnected(connected);
      // });
      
      // Set up polling for new messages
      // apiService.onNewMessages((newMessages: ChatMessage[]) => {
      //   newMessages.forEach(handleNewMessage);
      // });
      
    } catch (error) {
      console.error('❌ Failed to initialize real-time chat:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUserMessages(userId, 0, maxMessages);
      
      if (response.data && response.data.messages) {
        const formattedMessages = formatChatMessages(response.data.messages);
        setMessages(formattedMessages);
        
        // Set last message ID for real-time updates
        if (response.data.messages.length > 0) {
          const maxId = Math.max(...response.data.messages.map(msg => msg.id));
          setLastMessageId(maxId);
          // apiService.setLastMessageId(maxId);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatChatMessages = (chatMessages: ChatMessage[]): Message[] => {
    const formattedMessages: Message[] = [];
    
    chatMessages.forEach((chatMessage: ChatMessage) => {
      // Add user message
      formattedMessages.push({
        id: chatMessage.id.toString(),
        text: chatMessage.message,
        sender: 'user' as const,
        timestamp: new Date(chatMessage.created_at),
      });
      
      // Add bot response
      formattedMessages.push({
        id: `response-${chatMessage.id}`,
        text: chatMessage.response,
        sender: 'bot' as const,
        timestamp: new Date(chatMessage.created_at),
      });
    });
    
    return formattedMessages;
  };

  const handleNewMessage = (chatMessage: ChatMessage) => {
    // Check if this message is already displayed
    const existingMessage = messages.find(msg => msg.id === chatMessage.id.toString());
    if (existingMessage) return;
    
    // Add user message
    const userMessage: Message = {
      id: chatMessage.id.toString(),
      text: chatMessage.message,
      sender: 'user',
      timestamp: new Date(chatMessage.created_at),
    };
    
    // Add bot response
    const botMessage: Message = {
      id: `response-${chatMessage.id}`,
      text: chatMessage.response,
      sender: 'bot',
      timestamp: new Date(chatMessage.created_at),
    };
    
    setMessages(prev => [...prev, userMessage, botMessage]);
  };

  const handleRefresh = async () => {
    await loadChatHistory();
    onRefresh?.();
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <TouchableOpacity
      style={[
        styles.messageItem,
        { backgroundColor: theme.colors.surface },
        item.sender === 'user' ? styles.userMessage : styles.botMessage
      ]}
      onPress={() => onMessagePress?.(item as any)}
    >
      <Text style={[styles.messageText, { color: theme.colors.text }]}>
        {item.text}
      </Text>
      <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
        {item.timestamp.toLocaleTimeString()}
      </Text>
    </TouchableOpacity>
  );

  const renderConnectionStatus = () => {
    if (!showConnectionStatus) return null;
    
    return (
      <View style={[styles.connectionStatus, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.connectionDot, { backgroundColor: isConnected ? theme.colors.success : theme.colors.error }]} />
        <Text style={[styles.connectionText, { color: theme.colors.text }]}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
        No messages yet. Start a conversation!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading chat history...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderConnectionStatus()}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  messageItem: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    marginLeft: 40,
  },
  botMessage: {
    alignSelf: 'flex-start',
    marginRight: 40,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
*/

// Placeholder export to prevent import errors
export const RealTimeChatHistory = () => null; 