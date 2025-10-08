import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableNativeFeedback,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  FlatList,
  Dimensions,
  Modal,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useAgent } from '../components/AgentContext';
import { apiService, ChatMessageWithAgent, Agent } from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';
import AgentSelector from '../components/AgentSelector';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { AnimatedStatusIndicator } from '../components/AnimatedStatusIndicator';
import { ChatHistoryCard } from '../components/ChatHistoryCard';
import { AgentCard } from '../components/AgentCard';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, logout, clearCache } = useAuth();
  const { t, language } = useLanguage();
  const { selectedAgent, setSelectedAgent } = useAgent();
  const [chatHistory, setChatHistory] = useState<ChatMessageWithAgent[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allChatboxes, setAllChatboxes] = useState<any[]>([]);
  const [apiHealthy, setApiHealthy] = useState<null | boolean>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const displayName = (user as any)?.full_name || (user as any)?.name || (user as any)?.email || 'User';

  const handleClearCache = async () => {
    await clearCache();
    Alert.alert(
      language === 'vi' ? 'Đã Xóa Cache' : 'Cache Cleared', 
      language === 'vi' ? 'Tất cả dữ liệu cache đã được xóa.' : 'All cached data has been cleared.'
    );
  };

  useEffect(() => {
    if (user) {
      loadChatHistory();
      loadAvailableAgents();
      loadAllAgents();
      loadAllChatboxes();
    }
  }, [user]);

  useEffect(() => {
    // Check API connectivity on mount (useful on web)
    pingApi(false);
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadChatHistory();
        loadAvailableAgents();
        loadAllAgents();
        loadAllChatboxes();
        // Force refresh of conversation cards to prevent layout issues
        setRefreshKey(prev => prev + 1);
      }
    }, [user])
  );



  const loadChatHistory = async () => {
    if (!user) return;

    try {
      const userId = parseInt(user.id);
      const response = await apiService.getUserMessages(userId, 0, 100);
      if (response.data?.messages) {
        setChatHistory(response.data.messages as ChatMessageWithAgent[]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const loadAvailableAgents = async () => {
    if (!user) return;

    try {
      const response = await apiService.getUnchattedAgents(Number((user as any).id));
      if (response.data) {
        setAvailableAgents(response.data);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadAllAgents = async () => {
    if (!user) return;

    try {
      const response = await apiService.getAgents(Number((user as any).id));
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
      const userId = parseInt(user.id);
      const response = await apiService.getUserChatboxes(userId);
      if (response.data) {
        setAllChatboxes(response.data.chatboxes);
      }
    } catch (error) {
      console.error('Error loading chatboxes:', error);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Web-specific logout without Alert
      console.log('🚪 Web logout initiated');
      logout();
    } else {
      // Mobile logout with confirmation
      Alert.alert(
        language === 'vi' ? 'Đăng Xuất' : 'Logout',
        language === 'vi' ? 'Bạn có chắc chắn muốn đăng xuất?' : 'Are you sure you want to logout?',
        [
          { text: language === 'vi' ? 'Hủy' : 'Cancel', style: 'cancel' },
          { text: language === 'vi' ? 'Đăng Xuất' : 'Logout', style: 'destructive', onPress: () => logout() },
        ]
      );
    }
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

  const formatTime = (dateString: string) => {
    if (!dateString) return '--:--';
    
    try {
      // Parse the ISO string from backend (should be in UTC+8)
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return '--:--';
      }
      
      // Format the time - the backend should be sending UTC+8 timestamps
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Singapore' // Ensure we display in UTC+8
      });
    } catch (error) {
      console.error('Error formatting time:', error, 'Date string:', dateString);
      return '--:--';
    }
  };

  // Helper function to safely get date timestamp for sorting
  const getSafeTimestamp = (dateString: string): number => {
    if (!dateString) return 0;
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('getSafeTimestamp: Invalid date string for sorting:', dateString);
        return 0;
      }
      
      return date.getTime();
    } catch (error) {
      console.error('getSafeTimestamp: Error parsing date string:', error, 'Date string:', dateString);
      return 0;
    }
  };

  const pingApi = async (showToast: boolean = true) => {
    try {
      setIsPinging(true);
      const result = await apiService.testConnection();
      setApiHealthy(Boolean(result.workingUrl));
      if (showToast) {
        Alert.alert(
          result.workingUrl 
            ? (language === 'vi' ? 'API Đã Kết Nối' : 'API Connected')
            : (language === 'vi' ? 'API Không Thể Truy Cập' : 'API Unreachable'),
          result.workingUrl 
            ? `${language === 'vi' ? 'Đang sử dụng' : 'Using'}: ${result.workingUrl}` 
            : result.error || (language === 'vi' ? 'Không có phản hồi' : 'No response')
        );
      }
    } catch (e) {
      setApiHealthy(false);
      if (showToast) Alert.alert(
        language === 'vi' ? 'Lỗi API' : 'API Error', 
        language === 'vi' ? 'Không thể kết nối đến backend' : 'Failed to reach backend'
      );
    } finally {
      setIsPinging(false);
    }
  };

  const handleAgentSelect = (agent: Agent | null) => {
    setSelectedAgent(agent);
    if (agent) {
      // Navigate to chat tab with selected agent
      navigation.navigate('Chat');
    }
  };

  const getUnchattedAgents = () => {
    // Get agent IDs that user has chatted with
    const chattedAgentIds = new Set(
      chatHistory
        .filter(msg => msg.agent_id)
        .map(msg => msg.agent_id)
    );
    
    // Filter out agents that user has already chatted with
    return availableAgents.filter(agent => !chattedAgentIds.has(agent.id));
  };

  const getAgentName = (agentId?: number) => {
    if (!agentId) return language === 'vi' ? 'Không có Agent' : 'No Agent';
    const agent = allAgents.find(a => a.id === agentId);
    return agent ? agent.name : language === 'vi' ? 'Agent Không Xác Định' : 'Unknown Agent';
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
        messages: messages.sort((a, b) => getSafeTimestamp(b.created_at) - getSafeTimestamp(a.created_at)),
        latestMessage: messages[0] // Already sorted, so first is latest
      }))
      .sort((a, b) => getSafeTimestamp(b.latestMessage.created_at) - getSafeTimestamp(a.latestMessage.created_at));
  };

  const getConversationsByChatbox = () => {
    const conversations: { [chatboxId: number]: ChatMessageWithAgent[] } = {};
    
    chatHistory.forEach(message => {
      if (message.chatbox_id) {
        if (!conversations[message.chatbox_id]) {
          conversations[message.chatbox_id] = [];
        }
        conversations[message.chatbox_id].push(message);
      }
    });

    // Convert to array and sort by latest message
    return Object.entries(conversations)
      .map(([chatboxId, messages]) => ({
        chatboxId: parseInt(chatboxId),
        messages: messages.sort((a, b) => getSafeTimestamp(b.created_at) - getSafeTimestamp(a.created_at)),
        latestMessage: messages[0] // Already sorted, so first is latest
      }))
      .sort((a, b) => getSafeTimestamp(b.latestMessage.created_at) - getSafeTimestamp(a.latestMessage.created_at));
  };

  const getGeneralConversations = () => {
    // Get messages that have no agent_id and no chatbox_id (general chat)
    const generalMessages = chatHistory.filter(message => 
      !message.agent_id && !message.chatbox_id
    );
    
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
    
    return [generalConversation];
  };

  const handleConversationPress = (agentId: number) => {
    const agent = allAgents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      navigation.navigate('Chat');
    }
  };

  const handleChatboxConversationPress = (chatboxId: number) => {
    const chatbox = allChatboxes.find(c => c.id === chatboxId);
    if (chatbox) {
      // Navigate to chat screen with chatbox context
      navigation.navigate('Chat', { chatboxId: chatboxId });
    }
  };

  const handleDeleteConversation = async (item: { agentId?: number; chatboxId?: number; messages: ChatMessageWithAgent[]; latestMessage: ChatMessageWithAgent }) => {
    if (!user) return;

    const conversationName = item.agentId 
      ? getAgentName(item.agentId) 
      : item.chatboxId === -1 
        ? 'General Chat'
        : allChatboxes.find(c => c.id === item.chatboxId)?.title || 'Unknown Chatbox';

    Alert.alert(
      language === 'vi' ? 'Xóa Cuộc Trò Chuyện' : 'Delete Conversation',
      language === 'vi' 
        ? `Bạn có chắc chắn muốn xóa cuộc trò chuyện "${conversationName}"?\n\nĐiều này sẽ xóa vĩnh viễn tất cả tin nhắn trong cuộc trò chuyện này.`
        : `Are you sure you want to delete the conversation "${conversationName}"?\n\nThis will permanently delete all messages in this conversation.`,
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
              // Delete all messages in the conversation
              const deletePromises = item.messages.map(message => 
                apiService.deleteMessage(message.id, Number(user.id))
              );
              
              await Promise.all(deletePromises);
              
              // Reload chat history to update the UI
              await loadChatHistory();
              
              Alert.alert(
                language === 'vi' ? 'Thành công' : 'Success',
                language === 'vi' ? 'Cuộc trò chuyện đã được xóa' : 'Conversation deleted successfully'
              );
            } catch (error) {
              console.error('Error deleting conversation:', error);
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

  const renderConversationItem = ({ item }: { item: { agentId?: number; chatboxId?: number; messages: ChatMessageWithAgent[]; latestMessage: ChatMessageWithAgent } }) => {
    const TouchableComponent = Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;
    const touchableProps = Platform.OS === 'android' 
      ? { background: TouchableNativeFeedback.Ripple(theme.colors.primary + '20', false) }
      : { activeOpacity: 0.7 };

    const chatbox = item.chatboxId && item.chatboxId > 0 ? allChatboxes.find(c => c.id === item.chatboxId) : null;
    const isGeneralConversation = item.chatboxId === -1;

    return (
      <TouchableComponent 
        {...touchableProps}
        onPress={() => {
          if (item.agentId) {
            handleConversationPress(item.agentId);
          } else if (item.chatboxId && item.chatboxId > 0) {
            handleChatboxConversationPress(item.chatboxId);
          } else if (isGeneralConversation) {
            // Handle general conversation press - navigate to chat with existing general messages
            navigation.navigate('Chat', { 
              existingGeneralChat: true,
              existingChatTimestamp: Date.now()
            });
          }
        }}
      >
        <View style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.conversationHeader}>
            <View style={styles.conversationAgentInfo}>
              <View style={[styles.agentAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
                <Icon name={item.agentId ? "smart-toy" : (isGeneralConversation ? "help" : "chat")} size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.conversationTextContainer}>
                <Text style={[styles.conversationAgentName, { color: theme.colors.text }]}>
                  {item.agentId ? getAgentName(item.agentId) : (isGeneralConversation ? 'General Chat' : (chatbox?.title || 'Unknown Chatbox'))}
                </Text>
                <Text style={[styles.conversationMessage, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {item.latestMessage.message}
                </Text>
              </View>
            </View>
            <View style={styles.conversationActions}>
              <View style={styles.conversationMeta}>
                <Text style={[styles.conversationTime, { color: theme.colors.textSecondary }]}>
                  {formatTime(item.latestMessage.created_at)}
                </Text>
                <Text style={[styles.conversationDate, { color: theme.colors.textSecondary }]}>
                  {formatDate(item.latestMessage.created_at)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteConversation(item)}
                style={[styles.deleteButton, { backgroundColor: theme.colors.error + '20' }]}
                activeOpacity={0.7}
              >
                <Icon name="delete" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
       </View>
     </TouchableComponent>
   );
 };

  if (!(user as any)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {language === 'vi' ? 'Vui lòng đăng nhập để truy cập trang chủ' : 'Please log in to access the home screen'}
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

      {/* Modern Gradient Header */}
      <LinearGradient
        colors={theme.type === 'dark' 
          ? ['#8B5CF6', '#7C3AED', '#111827'] 
          : ['#667EEA', '#764BA2', '#FFFFFF']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <View style={styles.headerLeftGroup}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={[styles.avatarInitials, { color: 'white' }]}>{String(displayName).slice(0,1).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={[styles.greeting, { color: 'rgba(255,255,255,0.8)' }]}>
              {language === 'vi' ? 'Chào mừng trở lại' : 'Welcome back'}
            </Text>
            <Text style={[styles.userName, { color: 'white', fontWeight: '700' }]}>{displayName}</Text>
          </View>
        </View>
        <View style={styles.headerRightGroup}>
          <AnimatedStatusIndicator
            status={
              apiHealthy === null 
                ? 'connecting'
                : apiHealthy 
                  ? 'online'
                  : 'offline'
            }
            showText={true}
            animated={true}
            size="medium"
            onPress={() => pingApi(true)}
          />
          {Platform.OS === 'android' ? (
            <TouchableNativeFeedback
              background={TouchableNativeFeedback.Ripple('rgba(255,255,255,0.3)', false)}
              onPress={() => setShowLanguageSelector(true)}
            >
              <View style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}>
                <Icon name="language" size={20} color="white" />
              </View>
            </TouchableNativeFeedback>
          ) : (
            <TouchableOpacity 
              onPress={() => setShowLanguageSelector(true)} 
              style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}
            >
              <Icon name="language" size={20} color="white" />
            </TouchableOpacity>
          )}
          {Platform.OS === 'android' ? (
            <TouchableNativeFeedback
              background={TouchableNativeFeedback.Ripple('rgba(245,101,101,0.3)', false)}
              onPress={handleLogout}
            >
              <View style={[styles.iconBtn, { backgroundColor: 'rgba(245,101,101,0.15)', borderWidth: 1, borderColor: 'rgba(245,101,101,0.3)' }]}>
                <Icon name="logout" size={20} color="#F56565" />
              </View>
            </TouchableNativeFeedback>
          ) : (
            <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: 'rgba(245,101,101,0.15)', borderWidth: 1, borderColor: 'rgba(245,101,101,0.3)' }]}>
              <Icon name="logout" size={20} color="#F56565" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {Platform.OS === 'web' && (
        <View style={[styles.webActionsBar, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.card }]}>          
          <TouchableOpacity style={[styles.webActionBtn, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '40' }]} onPress={() => pingApi(true)} disabled={isPinging}>
            <Icon name="wifi" size={18} color={theme.colors.primary} />
            <Text style={[styles.webActionText, { color: theme.colors.primary }]}>
              {isPinging ? (language === 'vi' ? 'Đang ping...' : 'Pinging...') : (language === 'vi' ? 'Ping API' : 'Ping API')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.webActionBtn, { backgroundColor: theme.colors.warning + '20', borderColor: theme.colors.warning + '40' }]} onPress={handleClearCache}>
            <Icon name="cached" size={18} color={theme.colors.warning} />
            <Text style={[styles.webActionText, { color: theme.colors.warning }]}>
              {language === 'vi' ? 'Xóa Cache' : 'Clear Cache'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.webActionBtn, { backgroundColor: theme.colors.error + '15', borderColor: theme.colors.error + '40' }]} onPress={handleLogout}>
            <Icon name="logout" size={18} color={theme.colors.error} />
            <Text style={[styles.webActionText, { color: theme.colors.error }]}>
              {language === 'vi' ? 'Đăng Xuất' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        ref={scrollRef}
        onScroll={(e: any) => {
          if (Platform.OS === 'web') {
            const y = e.nativeEvent.contentOffset.y;
            if (!showScrollTop && y > 250) setShowScrollTop(true);
            if (showScrollTop && y <= 250) setShowScrollTop(false);
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Modern Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontWeight: '800', fontSize: 24 }]}>
            {language === 'vi' ? '⚡ Hành Động Nhanh' : '⚡ Quick Actions'}
          </Text>
                     <View style={styles.quickActions}>
             {Platform.OS === 'android' ? (
               <TouchableNativeFeedback
                background={TouchableNativeFeedback.Ripple('rgba(102,126,234,0.3)', false)}
                 onPress={() => {
                   // Navigate directly to ChatScreen for new general chat without agent selection
                   navigation.navigate('Chat', { 
                     generalChat: true,
                     newChatTimestamp: Date.now()
                   });
                 }}
               >
                <LinearGradient
                  colors={theme.type === 'dark' 
                    ? ['#8B5CF6', '#7C3AED', '#1F2937'] 
                    : ['#667EEA', '#764BA2', '#FFFFFF']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.actionCard, { borderWidth: 0 }]}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Icon name="chat" size={28} color="white" />
                  </View>
                  <Text style={[styles.actionTitle, { color: 'white', fontWeight: '700' }]}>
                     {language === 'vi' ? 'Chat Mới' : 'New Chat'}
                   </Text>
                  <Text style={[styles.actionSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                     {language === 'vi' ? 'Bắt đầu cuộc trò chuyện mới' : 'Start a new conversation'}
                   </Text>
                </LinearGradient>
               </TouchableNativeFeedback>
             ) : (
              <TouchableOpacity onPress={() => {
                // Navigate directly to ChatScreen for new general chat without agent selection
                navigation.navigate('Chat', { 
                  generalChat: true,
                  newChatTimestamp: Date.now()
                });
              }}>
                <LinearGradient
                  colors={theme.type === 'dark' 
                    ? ['#8B5CF6', '#7C3AED', '#1F2937'] 
                    : ['#667EEA', '#764BA2', '#FFFFFF']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.actionCard, { borderWidth: 0 }]}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Icon name="chat" size={28} color="white" />
                  </View>
                  <Text style={[styles.actionTitle, { color: 'white', fontWeight: '700' }]}>
                   {language === 'vi' ? 'Chat Mới' : 'New Chat'}
                 </Text>
                  <Text style={[styles.actionSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                   {language === 'vi' ? 'Bắt đầu cuộc trò chuyện mới' : 'Start a new conversation'}
                 </Text>
                </LinearGradient>
               </TouchableOpacity>
             )}
           </View>
        </View>



        {/* Chat History with Agents and Chatboxes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Lịch Sử Chat' : 'Chat History'}
          </Text>
          {[...getConversationsByAgent(), ...getConversationsByChatbox(), ...getGeneralConversations()].length > 0 ? (
            <View style={styles.chatHistoryContainer}>
              {[...getConversationsByAgent(), ...getConversationsByChatbox(), ...getGeneralConversations()]
                .slice(0, 5).map((conversation, index) => {
                  const chatbox = ('chatboxId' in conversation && conversation.chatboxId && conversation.chatboxId > 0) ? allChatboxes.find(c => c.id === conversation.chatboxId) : null;
                  const agent = ('agentId' in conversation && conversation.agentId) ? allAgents.find(a => a.id === conversation.agentId) : null;
                  const latestMessage = conversation.latestMessage;
                  
                  return (
                    <ChatHistoryCard
                      key={`${('agentId' in conversation ? conversation.agentId : 'chatboxId' in conversation ? conversation.chatboxId : 'general')}-${index}-${refreshKey}`}
                      chatboxId={'chatboxId' in conversation ? conversation.chatboxId : -1}
                      agentName={
                        agent ? agent.name :
                        chatbox ? chatbox.name :
                        language === 'vi' ? 'Chat Tổng Quát' : 'General Chat'
                      }
                      lastMessage={latestMessage.message}
                      timestamp={'timestamp' in latestMessage ? (latestMessage.timestamp as string) : new Date().toISOString()}
                      agentId={agent?.id || chatbox?.id || 0}
                      onPress={() => {
                        if ('agentId' in conversation && conversation.agentId) {
                          handleConversationPress(conversation.agentId);
                        } else if ('chatboxId' in conversation && conversation.chatboxId && conversation.chatboxId > 0) {
                          handleChatboxConversationPress(conversation.chatboxId);
                        } else {
                          navigation.navigate('Chat', { 
                            existingGeneralChat: true,
                            existingChatTimestamp: Date.now()
                          });
                        }
                      }}
                      isActive={false}
                      animated={true}
                    />
                  );
                })
              }
            </View>
          ) : (
            <View style={[styles.emptyStateCard, { backgroundColor: theme.colors.surface }]}>
              <Icon name="chat-bubble-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                {language === 'vi' ? 'Chưa có lịch sử chat nào' : 'No chat history yet'}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                {language === 'vi' ? 'Bắt đầu trò chuyện để xem lịch sử ở đây' : 'Start chatting to see history here'}
              </Text>
            </View>
          )}
        </View>

        {/* Available Agents */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontWeight: '800', fontSize: 24 }]}>
            {language === 'vi' ? '🤖 Agents Có Sẵn' : '🤖 Available Agents'}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary, marginBottom: 16 }]}>
              {language === 'vi' 
              ? `Bạn có ${allAgents.length} AI assistants đang chờ bạn khám phá` 
              : `Discover your ${allAgents.length} AI assistants`
              }
            </Text>
          
          {/* Agent Cards Grid */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.agentsScrollContainer}
          >
            {allAgents.slice(0, 10).map((agent, index) => (
              <AgentCard
                key={agent.id}
                agent={{
                  id: agent.id,
                  name: agent.name,
                  description: '',
                  is_online: Math.random() > 0.3, // Simulate random online status
                  skills: [],
                  personality: agent.personality || '',
                }}
                onPress={() => {
                  navigation.navigate('Chat', { agent });
                }}
                isSelected={false}
                animated={true}
                compact={true}
              />
            ))}
          </ScrollView>

          {/* View All Agents Button */}
          {allAgents.length > 10 && (
               <TouchableOpacity 
              style={[styles.viewAllButton, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}
                 onPress={() => setShowAgentSelector(true)}
               >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary + 'DD'] as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.viewAllGradient}
              >
                <Icon name="smart-toy" size={18} color="white" />
                <Text style={styles.viewAllText}>
                  {language === 'vi' ? 'Xem Tất Cả Agents' : 'View All Agents'}
                 </Text>
                <Icon name="arrow-forward" size={18} color="white" />
              </LinearGradient>
               </TouchableOpacity>
             )}
        </View>
      </ScrollView>

      {Platform.OS === 'web' && showScrollTop && (
        <TouchableOpacity
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          style={[styles.scrollTopBtn, { backgroundColor: theme.colors.primary }]}
          aria-label="Scroll to top"
        >
          <Icon name="arrow-upward" size={20} color={'white'} />
        </TouchableOpacity>
      )}

      {/* Floating Action Buttons */}
      <FloatingActionButton
        icon="add"
          onPress={() => {
            // Navigate directly to ChatScreen for new general chat without agent selection
            navigation.navigate('Chat', { 
              generalChat: true,
              newChatTimestamp: Date.now()
            });
          }}
        position="bottom-right"
        primary={true}
        elevation={12}
      />
      
      {/* FAQ Button - Bottom Left */}
      <FloatingActionButton
        icon="help-outline"
        onPress={() => setShowFAQ(true)}
        position="bottom-left"
        secondary={true}
        size="small"
        elevation={10}
      />

      {/* Language Selector Modal */}
      <LanguageSelector 
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />

      {/* FAQ Modal for Newbies */}
      <Modal
        visible={showFAQ}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFAQ(false)}
      >
        <View style={styles.faqModalOverlay}>
          <View style={[styles.faqModal, { backgroundColor: theme.colors.surface }]}>
            {/* Header */}
            <View style={[styles.faqHeader, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.faqHeaderContentNew}>
                <Icon name="school" size={24} color={theme.colors.primary} />
                <Text style={[styles.faqTitle, { color: theme.colors.text }]}>
                  {language === 'vi' ? 'Hướng Dẫn Cho Người Mới' : 'Beginner\'s Guide'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFAQ(false)}
                style={styles.faqCloseButton}
                activeOpacity={0.7}
              >
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Content */}
            <ScrollView 
              style={styles.faqContent} 
              showsVerticalScrollIndicator={true}
              indicatorStyle={theme.type === 'dark' ? 'white' : 'black'}
            >
              {/* Getting Started Section */}
              <View style={styles.faqSection}>
                <View style={styles.faqSectionHeaderNew}>
                  <Icon name="play-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.faqSectionTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Bắt Đầu Sử Dụng' : 'Getting Started'}
                  </Text>
                </View>
                <View style={styles.faqSteps}>
                  <View style={styles.faqStep}>
                    <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={[styles.faqStepText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Nhấn nút "+" ở góc dưới bên phải hoặc nút "Chat Mới" để bắt đầu cuộc trò chuyện mới'
                        : 'Tap the "+" button in the bottom right corner or "New Chat" button to start a new conversation'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqStep}>
                    <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={[styles.faqStepText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Tùy chọn: Chọn một AI Assistant từ danh sách có sẵn hoặc tiếp tục với chat tổng quát'
                        : 'Optional: Choose an AI Assistant from the available list or continue with general chat'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqStep}>
                    <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={[styles.faqStepText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Bắt đầu trò chuyện bằng cách gõ tin nhắn'
                        : 'Start chatting by typing your message'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Understanding AI Assistants */}
              <View style={styles.faqSection}>
                <View style={styles.faqSectionHeaderNew}>
                  <Icon name="smart-toy" size={20} color={theme.colors.primary} />
                  <Text style={[styles.faqSectionTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Hiểu Về AI Assistants' : 'Understanding AI Assistants'}
                  </Text>
                </View>
                <View style={styles.faqBulletListNew}>
                  <View style={styles.faqBulletItemNew}>
                    <Text style={styles.faqBulletNew}>🤖</Text>
                    <Text style={[styles.faqText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Mỗi AI Assistant có tính cách và phong cách trả lời riêng'
                        : 'Each AI Assistant has its own personality and response style'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItemNew}>
                    <Text style={styles.faqBulletNew}>💬</Text>
                    <Text style={[styles.faqText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Bạn có thể tạo AI Assistant tùy chỉnh với tính cách riêng'
                        : 'You can create custom AI Assistants with unique personalities'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItemNew}>
                    <Text style={styles.faqBulletNew}>🔄</Text>
                    <Text style={[styles.faqText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Chỉnh sửa AI Assistant sau khi đã trò chuyện với chúng'
                        : 'Edit AI Assistants after chatting with them'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Managing Conversations */}
              <View style={styles.faqSection}>
                <View style={styles.faqSectionHeaderNew}>
                  <Icon name="history" size={20} color={theme.colors.primary} />
                  <Text style={[styles.faqSectionTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Quản Lý Cuộc Trò Chuyện' : 'Managing Conversations'}
                  </Text>
                </View>
                <View style={styles.faqBulletListNew}>
                  <View style={styles.faqBulletItemNew}>
                    <Text style={styles.faqBulletNew}>📝</Text>
                    <Text style={[styles.faqText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Tất cả cuộc trò chuyện được lưu tự động'
                        : 'All conversations are saved automatically'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItemNew}>
                    <Text style={styles.faqBulletNew}>👆</Text>
                    <Text style={[styles.faqText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Nhấn vào cuộc trò chuyện để tiếp tục'
                        : 'Tap on a conversation to continue'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItemNew}>
                    <Text style={styles.faqBulletNew}>🗑️</Text>
                    <Text style={[styles.faqText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Xóa cuộc trò chuyện bằng nút thùng rác'
                        : 'Delete conversations using the trash button'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Tips for Better Experience */}
              <View style={styles.faqSection}>
                <View style={styles.faqSectionHeaderNew}>
                  <Icon name="lightbulb-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.faqSectionTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Mẹo Sử Dụng Hiệu Quả' : 'Tips for Better Experience'}
                  </Text>
                </View>
                <View style={styles.faqBulletListNew}>
                  <View style={styles.faqBulletItemNew}>
                    <Text style={styles.faqBulletNew}>💡</Text>
                    <Text style={[styles.faqText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Hãy cụ thể trong câu hỏi để nhận được câu trả lời tốt hơn'
                        : 'Be specific in your questions for better answers'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItemNew}>
                    <Text style={styles.faqBulletNew}>🌐</Text>
                    <Text style={[styles.faqText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Thay đổi ngôn ngữ bằng nút ngôn ngữ ở góc trên'
                        : 'Change language using the language button in the top corner'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItemNew}>
                    <Text style={styles.faqBulletNew}>⚡</Text>
                    <Text style={[styles.faqText, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Kiểm tra trạng thái kết nối bằng đèn xanh ở góc trên'
                        : 'Check connection status with the green light in the top corner'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Agent Selector Modal */}
      <AgentSelector
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
        visible={showAgentSelector}
        onClose={() => setShowAgentSelector(false)}
        userId={Number((user as any).id)}
      />
    </SafeAreaView>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 14,
    paddingBottom: 20,
    borderBottomWidth: Platform.OS === 'android' ? 0 : 2,
    elevation: Platform.OS === 'android' ? 4 : 0,
    shadowColor: Platform.OS === 'android' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'android' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'android' ? 0.15 : undefined,
    shadowRadius: Platform.OS === 'android' ? 8 : undefined,
  },
  headerLeftGroup: { flexDirection: 'row', alignItems: 'center' },
  headerRightGroup: { flexDirection: 'row', alignItems: 'center' },
  avatar: { 
    width: Platform.OS === 'android' ? 48 : 40, 
    height: Platform.OS === 'android' ? 48 : 40, 
    borderRadius: Platform.OS === 'android' ? 24 : 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  avatarInitials: { 
    fontSize: Platform.OS === 'android' ? 18 : 16, 
    fontWeight: '700' 
  },
  greeting: { 
    fontSize: Platform.OS === 'android' ? 14 : 12, 
    opacity: 0.8,
    marginBottom: 2
  },
  userName: { 
    fontSize: Platform.OS === 'android' ? 20 : 18, 
    fontWeight: '700' 
  },
  iconBtn: { 
    marginLeft: 12, 
    padding: Platform.OS === 'android' ? 12 : 8, 
    borderRadius: Platform.OS === 'android' ? 24 : 10,
    minWidth: Platform.OS === 'android' ? 48 : 36,
    minHeight: Platform.OS === 'android' ? 48 : 36,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: Platform.OS === 'android' ? 0 : 1, 
    paddingHorizontal: 12, 
    paddingVertical: Platform.OS === 'android' ? 8 : 4, 
    borderRadius: Platform.OS === 'android' ? 20 : 12,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'android' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'android' ? { width: 0, height: 1 } : undefined,
    shadowOpacity: Platform.OS === 'android' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'android' ? 2 : undefined,
  },
  statusText: { 
    fontSize: Platform.OS === 'android' ? 13 : 12, 
    marginLeft: 6,
    fontWeight: Platform.OS === 'android' ? '500' : '400'
  },

  webActionsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  webActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1 },
  webActionText: { marginLeft: 6, fontSize: 14, fontWeight: '600' },

  content: { 
    flex: 1, 
    paddingHorizontal: Platform.OS === 'android' ? 20 : 16 
  },
  section: { 
    marginVertical: Platform.OS === 'android' ? 24 : 20 
  },
  sectionTitle: { 
    fontSize: Platform.OS === 'android' ? 22 : 20, 
    fontWeight: 'bold', 
    marginBottom: Platform.OS === 'android' ? 20 : 16,
    letterSpacing: Platform.OS === 'android' ? 0.5 : 0
  },
  quickActions: { 
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionCard: { 
    width: '100%', 
    maxWidth: Platform.OS === 'android' ? screenWidth - 80 : 300, 
    padding: Platform.OS === 'android' ? 28 : 24, 
    borderRadius: Platform.OS === 'android' ? 20 : 16, 
    alignItems: 'center', 
    elevation: Platform.OS === 'android' ? 12 : 8, 
    shadowColor: '#8B5CF6', 
    shadowOffset: { width: 0, height: Platform.OS === 'android' ? 8 : 6 }, 
    shadowOpacity: Platform.OS === 'android' ? 0.25 : 0.2, 
    shadowRadius: Platform.OS === 'android' ? 16 : 12,
    minHeight: Platform.OS === 'android' ? 140 : 120,
    borderWidth: 0.3,
    borderColor: 'rgba(139, 92, 246, 0.03)',
  },
  actionIconContainer: {
    width: Platform.OS === 'android' ? 64 : 56,
    height: Platform.OS === 'android' ? 64 : 56,
    borderRadius: Platform.OS === 'android' ? 32 : 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? 16 : 12,
    elevation: Platform.OS === 'android' ? 4 : 2,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: Platform.OS === 'android' ? 2 : 1 },
    shadowOpacity: Platform.OS === 'android' ? 0.15 : 0.1, 

    shadowRadius: Platform.OS === 'android' ? 4 : 2,
  },
  actionTitle: { 
    fontSize: Platform.OS === 'android' ? 18 : 16, 
    fontWeight: 'bold', 
    marginTop: Platform.OS === 'android' ? 16 : 12, 
    textAlign: 'center',
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0
  },
  actionSubtitle: { 
    fontSize: Platform.OS === 'android' ? 14 : 12, 
    marginTop: Platform.OS === 'android' ? 8 : 4, 
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 20 : 16
  },
  
  conversationItem: {
    padding: Platform.OS === 'android' ? 20 : 16,
    borderRadius: Platform.OS === 'android' ? 16 : 12,
    marginBottom: Platform.OS === 'android' ? 16 : 12,
    elevation: Platform.OS === 'android' ? 4 : 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'android' ? 3 : 2 },
    shadowOpacity: Platform.OS === 'android' ? 0.12 : 0.1,
    shadowRadius: Platform.OS === 'android' ? 6 : 4,
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
    marginRight: Platform.OS === 'android' ? 16 : 12,
  },
  agentAvatar: {
    width: Platform.OS === 'android' ? 48 : 40,
    height: Platform.OS === 'android' ? 48 : 40,
    borderRadius: Platform.OS === 'android' ? 24 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Platform.OS === 'android' ? 16 : 12,
  },
  conversationTextContainer: {
    flex: 1,
  },
  conversationAgentName: {
    fontSize: Platform.OS === 'android' ? 18 : 16,
    fontWeight: '600',
    marginBottom: Platform.OS === 'android' ? 6 : 4,
    letterSpacing: Platform.OS === 'android' ? 0.2 : 0,
  },
  conversationMessage: {
    fontSize: Platform.OS === 'android' ? 15 : 14,
    lineHeight: Platform.OS === 'android' ? 22 : 18,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  conversationTime: {
    fontSize: Platform.OS === 'android' ? 13 : 12,
    marginBottom: Platform.OS === 'android' ? 4 : 2,
    fontWeight: Platform.OS === 'android' ? '500' : '400',
  },
  conversationDate: {
    fontSize: Platform.OS === 'android' ? 12 : 11,
    fontWeight: Platform.OS === 'android' ? '400' : '300',
  },
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'android' ? 12 : 8,
  },
  deleteButton: {
    width: Platform.OS === 'android' ? 32 : 28,
    height: Platform.OS === 'android' ? 32 : 28,
    borderRadius: Platform.OS === 'android' ? 16 : 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: Platform.OS === 'android' ? 2 : 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'android' ? 2 : 1 },
    shadowOpacity: Platform.OS === 'android' ? 0.1 : 0.05,
    shadowRadius: Platform.OS === 'android' ? 4 : 2,
  },
  
  emptyStateCard: {
    padding: Platform.OS === 'android' ? 48 : 40,
    borderRadius: Platform.OS === 'android' ? 16 : 12,
    alignItems: 'center',
    elevation: Platform.OS === 'android' ? 4 : 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'android' ? 3 : 2 },
    shadowOpacity: Platform.OS === 'android' ? 0.12 : 0.1,
    shadowRadius: Platform.OS === 'android' ? 6 : 4,
  },
  emptyStateText: {
    fontSize: Platform.OS === 'android' ? 20 : 18,
    fontWeight: '600',
    marginTop: Platform.OS === 'android' ? 20 : 16,
    textAlign: 'center',
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
  },
  emptyStateSubtext: {
    fontSize: Platform.OS === 'android' ? 16 : 14,
    marginTop: Platform.OS === 'android' ? 12 : 8,
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 24 : 20,
  },
  
  agentsCard: {
    padding: Platform.OS === 'android' ? 24 : 20,
    borderRadius: Platform.OS === 'android' ? 16 : 12,
    elevation: Platform.OS === 'android' ? 4 : 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'android' ? 3 : 2 },
    shadowOpacity: Platform.OS === 'android' ? 0.12 : 0.1,
    shadowRadius: Platform.OS === 'android' ? 6 : 4,
  },
  agentsInfo: {
    fontSize: Platform.OS === 'android' ? 18 : 16,
    marginBottom: Platform.OS === 'android' ? 20 : 16,
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 26 : 22,
  },
  tryAgentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? 16 : 12,
    paddingHorizontal: Platform.OS === 'android' ? 32 : 24,
    borderRadius: Platform.OS === 'android' ? 12 : 8,
    elevation: Platform.OS === 'android' ? 4 : 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'android' ? 3 : 2 },
    shadowOpacity: Platform.OS === 'android' ? 0.15 : 0.1,
    shadowRadius: Platform.OS === 'android' ? 6 : 4,
    minHeight: Platform.OS === 'android' ? 56 : 48,
  },
  tryAgentsButtonText: {
    fontSize: Platform.OS === 'android' ? 18 : 16,
    fontWeight: '600',
    marginLeft: Platform.OS === 'android' ? 12 : 8,
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
  },
  
  errorText: { 
    fontSize: Platform.OS === 'android' ? 18 : 16, 
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 26 : 22,
  },
  scrollTopBtn: {
    position: Platform.OS === 'web' ? 'fixed' as any : 'absolute',
    right: Platform.OS === 'android' ? 20 : 24,
    bottom: Platform.OS === 'android' ? 20 : 24,
    width: Platform.OS === 'android' ? 56 : 44,
    height: Platform.OS === 'android' ? 56 : 44,
    borderRadius: Platform.OS === 'android' ? 28 : 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowColor: Platform.OS === 'android' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'android' ? { width: 0, height: 4 } : undefined,
    shadowOpacity: Platform.OS === 'android' ? 0.3 : undefined,
    shadowRadius: Platform.OS === 'android' ? 8 : undefined,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      cursor: 'pointer',
    }),
    zIndex: 1000,
  },
  // Android-specific FAQ Button
  faqButtonAndroid: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    zIndex: 1000,
  },
  // Android-specific FAQ Modal
  faqModalOverlayAndroid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 1001,
  },
  faqModalAndroid: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  faqHeaderAndroid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  faqHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqTitleAndroid: {
    fontSize: 22,
    fontWeight: '600',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  faqCloseButtonAndroid: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  faqContentAndroid: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  faqSectionAndroid: {
    marginBottom: 32,
  },
  faqSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  faqSectionTitleAndroid: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  faqBulletList: {
    paddingLeft: 8,
  },
  faqBulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  faqBullet: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    marginTop: 2,
    color: '#666',
  },
  faqTextAndroid: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    letterSpacing: 0.2,
  },
  
  // FAQ Modal Styles for Newbies
  faqModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  faqModal: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  faqHeaderContentNew: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  faqCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqContent: {
    padding: 20,
  },
  faqSection: {
    marginBottom: 24,
  },
  faqSectionHeaderNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  faqSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  faqSteps: {
    paddingLeft: 8,
  },
  faqStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  faqStepText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  faqBulletListNew: {
    paddingLeft: 8,
  },
  faqBulletItemNew: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  faqBulletNew: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  faqText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  
  // Modern HomeScreen Styles
  chatHistoryContainer: {
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 16,
    opacity: 0.8,
  },
  agentsScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewAllButton: {
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: Platform.OS === 'android' ? 6 : 0,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginHorizontal: 8,
  },
});

export default HomeScreen;
