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
  const [apiHealthy, setApiHealthy] = useState<null | boolean>(null);
  const [isPinging, setIsPinging] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);

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
    }
  }, [user]);

  useEffect(() => {
    // Check API connectivity on mount (useful on web)
    pingApi(false);
  }, []);



  const loadChatHistory = async () => {
    if (!user) return;

    try {
      const response = await apiService.getUserMessages(Number((user as any).id), 0, 20);
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

  const handleConversationPress = (agentId: number) => {
    const agent = allAgents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      navigation.navigate('Chat');
    }
  };

  const renderConversationItem = ({ item }: { item: { agentId: number; messages: ChatMessageWithAgent[]; latestMessage: ChatMessageWithAgent } }) => {
    const TouchableComponent = Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;
    const touchableProps = Platform.OS === 'android' 
      ? { background: TouchableNativeFeedback.Ripple(theme.colors.primary + '20', false) }
      : { activeOpacity: 0.7 };

    return (
      <TouchableComponent 
        {...touchableProps}
        onPress={() => handleConversationPress(item.agentId)}
      >
        <View style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}>
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



        {/* Chat History with Agents */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Lịch Sử Chat với Agent' : 'Chat History with Agents'}
          </Text>
          {getConversationsByAgent().length > 0 ? (
            <FlatList
              data={getConversationsByAgent()}
              keyExtractor={(item) => String(item.agentId)}
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
});

export default HomeScreen;
