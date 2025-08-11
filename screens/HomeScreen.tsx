import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { apiService } from '../services/api';
import { API_CONFIG } from '../constants/config';
import { LanguageSelector } from '../components/LanguageSelector';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, logout, clearCache } = useAuth();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({
    totalMessages: 0,
    firstMessageDate: null as string | null,
    lastMessageDate: null as string | null,
  });
  const [apiHealthy, setApiHealthy] = useState<null | boolean>(null);
  const [isPinging, setIsPinging] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

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
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    // Check API connectivity on mount (useful on web)
    pingApi(false);
  }, []);

  const loadStats = async () => {
    if (!user) return;

    try {
      const response = await apiService.getChatStatistics(Number((user as any).id));
      if (response.data) {
        setStats({
          totalMessages: response.data.total_messages,
          firstMessageDate: response.data.first_message_date,
          lastMessageDate: response.data.last_message_date,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
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

  const openDocs = () => {
    const url = `${API_CONFIG.BASE_URL}/docs`;
    Linking.openURL(url).catch(() => Alert.alert(
      language === 'vi' ? 'Lỗi' : 'Error', 
      language === 'vi' ? 'Không thể mở tài liệu' : 'Cannot open docs'
    ));
  };

  const listAgents = async () => {
    const res = await apiService.getAgents();
    if (res.data) {
      Alert.alert(
        language === 'vi' ? 'Agents' : 'Agents', 
        language === 'vi' 
          ? `Đã tải ${res.data.length} agents` 
          : `Loaded ${res.data.length} agents`
      );
    } else {
      Alert.alert(
        language === 'vi' ? 'Agents' : 'Agents', 
        res.error || (language === 'vi' ? 'Không thể tải agents' : 'Failed to load agents')
      );
    }
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
          <TouchableOpacity 
            onPress={() => setShowLanguageSelector(true)} 
            style={[styles.iconBtn, { backgroundColor: theme.colors.primary + '15' }]}
          >
            <Icon name="language" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: theme.colors.error + '15' }]}>
            <Icon name="logout" size={20} color={theme.colors.error} />
          </TouchableOpacity>
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
          <TouchableOpacity style={[styles.webActionBtn, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '40' }]} onPress={listAgents}>
            <Icon name="smart-toy" size={18} color={theme.colors.primary} />
            <Text style={[styles.webActionText, { color: theme.colors.primary }]}>
              {language === 'vi' ? 'Danh Sách Agents' : 'List Agents'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.webActionBtn, { backgroundColor: theme.colors.border }]} onPress={openDocs}>
            <Icon name="description" size={18} color={theme.colors.text} />
            <Text style={[styles.webActionText, { color: theme.colors.text }]}>
              {language === 'vi' ? 'Mở Tài Liệu' : 'Open Docs'}
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
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
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
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.surface }]} onPress={() => navigation.navigate('Chat')}>
              <Icon name="chat" size={32} color={theme.colors.primary} />
              <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                {language === 'vi' ? 'Bắt Đầu Chat' : 'Start Chat'}
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                {language === 'vi' ? 'Trò chuyện với trợ lý AI' : 'Talk to AI assistant'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.surface }]} onPress={() => navigation.navigate('Profile')}>
              <Icon name="person" size={32} color={theme.colors.primary} />
              <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                {language === 'vi' ? 'Hồ Sơ' : 'Profile'}
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                {language === 'vi' ? 'Quản lý tài khoản của bạn' : 'Manage your account'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Thống Kê Của Bạn' : 'Your Statistics'}
          </Text>
          <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>            
            <View style={styles.statItem}>
              <Icon name="message" size={24} color={theme.colors.primary} />
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.totalMessages}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {language === 'vi' ? 'Tổng Tin Nhắn' : 'Total Messages'}
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Icon name="schedule" size={24} color={theme.colors.primary} />
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatDate(stats.firstMessageDate)}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {language === 'vi' ? 'Tin Nhắn Đầu Tiên' : 'First Message'}
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Icon name="update" size={24} color={theme.colors.primary} />
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatDate(stats.lastMessageDate)}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {language === 'vi' ? 'Tin Nhắn Cuối' : 'Last Message'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Hoạt Động Gần Đây' : 'Recent Activity'}
          </Text>
          <View style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}>            
            <View style={styles.activityItem}>
              <Icon name="chat-bubble" size={20} color={theme.colors.primary} />
              <Text style={[styles.activityText, { color: theme.colors.text }]}>
                {stats.totalMessages > 0 
                  ? (language === 'vi' 
                      ? `Bạn đã gửi ${stats.totalMessages} tin nhắn đến AI` 
                      : `You've sent ${stats.totalMessages} messages to AI`)
                  : (language === 'vi' 
                      ? 'Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!' 
                      : 'No messages yet. Start chatting!')
                }
              </Text>
            </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 14,
    paddingBottom: 14,
    borderBottomWidth: 2,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'android' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'android' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'android' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'android' ? 4 : undefined,
  },
  headerLeftGroup: { flexDirection: 'row', alignItems: 'center' },
  headerRightGroup: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarInitials: { fontSize: 16, fontWeight: '700' },
  greeting: { fontSize: 12, opacity: 0.8 },
  userName: { fontSize: 18, fontWeight: '700' },
  iconBtn: { marginLeft: 8, padding: 8, borderRadius: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, marginLeft: 4 },

  webActionsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  webActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1 },
  webActionText: { marginLeft: 6, fontSize: 14, fontWeight: '600' },

  content: { flex: 1, paddingHorizontal: 16 },
  section: { marginVertical: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: { flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 12, textAlign: 'center' },
  actionSubtitle: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  statsCard: { padding: 20, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statContent: { marginLeft: 12, flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 14, marginTop: 2 },
  activityCard: { padding: 16, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  activityItem: { flexDirection: 'row', alignItems: 'center' },
  activityText: { fontSize: 14, marginLeft: 12, flex: 1 },
  errorText: { fontSize: 16, textAlign: 'center' },
  scrollTopBtn: {
    position: Platform.OS === 'web' ? 'fixed' as any : 'absolute',
    right: 24,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      cursor: 'pointer',
    }),
    zIndex: 1000,
  },
});

export default HomeScreen;
