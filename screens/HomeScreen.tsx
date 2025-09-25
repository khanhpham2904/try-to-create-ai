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
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        messages: messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        latestMessage: messages[0] // Already sorted, so first is latest
      }))
      .sort((a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime());
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
        messages: messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        latestMessage: messages[0] // Already sorted, so first is latest
      }))
      .sort((a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime());
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
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
            // Handle general conversation press - navigate to chat with no agent/chatbox
            navigation.navigate('Chat', { generalChat: true });
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

      {/* Redesigned Header */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>        
        <View style={styles.headerLeftGroup}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.avatarInitials, { color: theme.colors.primary }]}>{String(displayName).slice(0,1).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              {language === 'vi' ? 'Chào mừng trở lại' : 'Welcome back'}
            </Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{displayName}</Text>
          </View>
        </View>
        <View style={styles.headerRightGroup}>
          <View style={[styles.statusBadge, { backgroundColor: apiHealthy === null ? theme.colors.border : apiHealthy ? '#27AE6044' : '#EB575744', borderColor: apiHealthy ? '#27AE60' : apiHealthy === false ? '#EB5757' : theme.colors.border }]}>            
            <Icon name={apiHealthy ? 'check-circle' : apiHealthy === false ? 'error' : 'sync'} size={16} color={apiHealthy ? '#27AE60' : apiHealthy === false ? '#EB5757' : theme.colors.textSecondary} />
            <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
              {apiHealthy === null 
                ? (language === 'vi' ? 'Đang kiểm tra' : 'Checking') 
                : apiHealthy 
                  ? (language === 'vi' ? 'Trực tuyến' : 'Online') 
                  : (language === 'vi' ? 'Ngoại tuyến' : 'Offline')
              }
            </Text>
          </View>
          {Platform.OS === 'android' ? (
            <TouchableNativeFeedback
              background={TouchableNativeFeedback.Ripple(theme.colors.primary + '20', false)}
              onPress={() => setShowLanguageSelector(true)}
            >
              <View style={[styles.iconBtn, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="language" size={20} color={theme.colors.primary} />
              </View>
            </TouchableNativeFeedback>
          ) : (
            <TouchableOpacity 
              onPress={() => setShowLanguageSelector(true)} 
              style={[styles.iconBtn, { backgroundColor: theme.colors.primary + '15' }]}
            >
              <Icon name="language" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {Platform.OS === 'android' ? (
            <TouchableNativeFeedback
              background={TouchableNativeFeedback.Ripple(theme.colors.error + '20', false)}
              onPress={handleLogout}
            >
              <View style={[styles.iconBtn, { backgroundColor: theme.colors.error + '15' }]}>
                <Icon name="logout" size={20} color={theme.colors.error} />
              </View>
            </TouchableNativeFeedback>
          ) : (
            <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: theme.colors.error + '15' }]}>
              <Icon name="logout" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Hành Động Nhanh' : 'Quick Actions'}
          </Text>
                     <View style={styles.quickActions}>
             {Platform.OS === 'android' ? (
               <TouchableNativeFeedback
                 background={TouchableNativeFeedback.Ripple(theme.colors.primary + '20', false)}
                 onPress={() => setShowAgentSelector(true)}
               >
                 <View style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}>
                   <Icon name="smart-toy" size={32} color={theme.colors.primary} />
                   <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                     {language === 'vi' ? 'Tạo Agent' : 'Create Agent'}
                   </Text>
                   <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                     {language === 'vi' ? 'Tạo hoặc chọn AI assistant' : 'Create or select AI assistant'}
                   </Text>
                 </View>
               </TouchableNativeFeedback>
             ) : (
               <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.surface }]} onPress={() => setShowAgentSelector(true)}>
                 <Icon name="smart-toy" size={32} color={theme.colors.primary} />
                 <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                   {language === 'vi' ? 'Tạo Agent' : 'Create Agent'}
                 </Text>
                 <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                   {language === 'vi' ? 'Tạo hoặc chọn AI assistant' : 'Create or select AI assistant'}
                 </Text>
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
            <FlatList
              data={[...getConversationsByAgent(), ...getConversationsByChatbox(), ...getGeneralConversations()]}
              keyExtractor={(item) => String('agentId' in item ? item.agentId : item.chatboxId)}
              renderItem={renderConversationItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
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
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Agents Có Sẵn' : 'Available Agents'}
          </Text>
          <View style={[styles.agentsCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.agentsInfo, { color: theme.colors.textSecondary }]}>
              {language === 'vi' 
                ? `Bạn có ${getUnchattedAgents().length} agents chưa thử nghiệm` 
                : `You have ${getUnchattedAgents().length} agents to try`
              }
            </Text>
                         {Platform.OS === 'android' ? (
               <TouchableNativeFeedback
                 background={TouchableNativeFeedback.Ripple('rgba(255,255,255,0.3)', false)}
                 onPress={() => setShowAgentSelector(true)}
               >
                 <View style={[styles.tryAgentsButton, { backgroundColor: theme.colors.primary }]}>
                   <Icon name="smart-toy" size={20} color="white" />
                   <Text style={[styles.tryAgentsButtonText, { color: 'white' }]}>
                     {language === 'vi' ? 'Thử Nghiệm Agents' : 'Try Agents'}
                   </Text>
                 </View>
               </TouchableNativeFeedback>
             ) : (
               <TouchableOpacity 
                 style={[styles.tryAgentsButton, { backgroundColor: theme.colors.primary }]} 
                 onPress={() => setShowAgentSelector(true)}
               >
                 <Icon name="smart-toy" size={20} color="white" />
                 <Text style={[styles.tryAgentsButtonText, { color: 'white' }]}>
                   {language === 'vi' ? 'Thử Nghiệm Agents' : 'Try Agents'}
                 </Text>
               </TouchableOpacity>
             )}
          </View>
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

      {/* FAQ Button - Bottom Right - Android Optimized */}
      {Platform.OS === 'android' && (
        <TouchableOpacity
          onPress={() => setShowFAQ(true)}
          style={[styles.faqButtonAndroid, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.7}
        >
          <Icon name="help-outline" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* FAQ Modal - Android Optimized */}
      {showFAQ && Platform.OS === 'android' && (
        <View style={styles.faqModalOverlayAndroid}>
          <View style={[styles.faqModalAndroid, { backgroundColor: theme.colors.surface }]}>
            {/* Android-style Header */}
            <View style={[styles.faqHeaderAndroid, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.faqHeaderContent}>
                <Icon name="help-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.faqTitleAndroid, { color: theme.colors.text }]}>
                  {language === 'vi' ? 'Hướng Dẫn Sử Dụng' : 'Manual Instructions'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFAQ(false)}
                style={[styles.faqCloseButtonAndroid, { backgroundColor: theme.colors.surface }]}
                activeOpacity={0.7}
              >
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Android-style Content */}
            <ScrollView 
              style={styles.faqContentAndroid} 
              showsVerticalScrollIndicator={true}
              indicatorStyle="dark"
            >
              {/* Creating Conversations Section */}
              <View style={styles.faqSectionAndroid}>
                <View style={styles.faqSectionHeader}>
                  <Icon name="add-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.faqSectionTitleAndroid, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Tạo Cuộc Trò Chuyện Mới' : 'Creating New Conversations'}
                  </Text>
                </View>
                <View style={styles.faqBulletList}>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Nhấn nút "+" ở góc trên bên phải để tạo cuộc trò chuyện mới'
                        : 'Tap the "+" button in the top right corner to create a new conversation'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Chọn agent từ danh sách có sẵn'
                        : 'Select an agent from the available list'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Bắt đầu trò chuyện với agent đã chọn'
                        : 'Start chatting with your chosen agent'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Managing Chat History Section */}
              <View style={styles.faqSectionAndroid}>
                <View style={styles.faqSectionHeader}>
                  <Icon name="history" size={20} color={theme.colors.primary} />
                  <Text style={[styles.faqSectionTitleAndroid, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Quản Lý Lịch Sử Chat' : 'Managing Chat History'}
                  </Text>
                </View>
                <View style={styles.faqBulletList}>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Lịch sử chat được cập nhật tự động khi bạn quay lại màn hình chính'
                        : 'Chat history updates automatically when you return to the home screen'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Nhấn vào cuộc trò chuyện để tiếp tục chat với agent'
                        : 'Tap on a conversation to continue chatting with that agent'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Xóa cuộc trò chuyện bằng nút thùng rác'
                        : 'Delete conversations using the trash button'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Customizing Agents Section */}
              <View style={styles.faqSectionAndroid}>
                <View style={styles.faqSectionHeader}>
                  <Icon name="smart-toy" size={20} color={theme.colors.primary} />
                  <Text style={[styles.faqSectionTitleAndroid, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Tùy Chỉnh Agent' : 'Customizing Agents'}
                  </Text>
                </View>
                <View style={styles.faqBulletList}>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Tạo agent tùy chỉnh với tính cách và phong cách riêng'
                        : 'Create custom agents with unique personalities and response styles'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Chỉnh sửa agent hiện có từ menu agent'
                        : 'Edit existing agents from the agent menu'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Mỗi agent có thể có phong cách trả lời khác nhau'
                        : 'Each agent can have different response styles'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Other Features Section */}
              <View style={styles.faqSectionAndroid}>
                <View style={styles.faqSectionHeader}>
                  <Icon name="settings" size={20} color={theme.colors.primary} />
                  <Text style={[styles.faqSectionTitleAndroid, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Tính Năng Khác' : 'Other Features'}
                  </Text>
                </View>
                <View style={styles.faqBulletList}>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Thay đổi ngôn ngữ từ menu cài đặt'
                        : 'Change language from settings menu'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Kiểm tra trạng thái kết nối API'
                        : 'Check API connection status'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Xóa cache để làm mới dữ liệu'
                        : 'Clear cache to refresh data'
                      }
                    </Text>
                  </View>
                  <View style={styles.faqBulletItem}>
                    <Text style={styles.faqBullet}>•</Text>
                    <Text style={[styles.faqTextAndroid, { color: theme.colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Import file để xử lý nội dung'
                        : 'Import files to process content'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Language Selector Modal */}
      <LanguageSelector 
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />

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
    padding: Platform.OS === 'android' ? 24 : 20, 
    borderRadius: Platform.OS === 'android' ? 16 : 12, 
    alignItems: 'center', 
    elevation: Platform.OS === 'android' ? 6 : 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: Platform.OS === 'android' ? 4 : 2 }, 
    shadowOpacity: Platform.OS === 'android' ? 0.15 : 0.1, 
    shadowRadius: Platform.OS === 'android' ? 8 : 4,
    minHeight: Platform.OS === 'android' ? 120 : 100
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
});

export default HomeScreen;
