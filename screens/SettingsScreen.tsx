import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, themeType, setThemeType } = useTheme();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  
  // State for various settings
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [chatHistoryEnabled, setChatHistoryEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('user_settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setNotifications(parsedSettings.notifications ?? true);
        setSoundEnabled(parsedSettings.soundEnabled ?? true);
        setVibrateEnabled(parsedSettings.vibrateEnabled ?? true);
        setDataSaver(parsedSettings.dataSaver ?? false);
        setAutoDownload(parsedSettings.autoDownload ?? false);
        setAnalyticsEnabled(parsedSettings.analyticsEnabled ?? true);
        setChatHistoryEnabled(parsedSettings.chatHistoryEnabled ?? true);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        notifications,
        soundEnabled,
        vibrateEnabled,
        dataSaver,
        autoDownload,
        analyticsEnabled,
        chatHistoryEnabled,
      };
      await AsyncStorage.setItem('user_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  useEffect(() => {
    saveSettings();
  }, [notifications, soundEnabled, vibrateEnabled, dataSaver, autoDownload, analyticsEnabled, chatHistoryEnabled]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeType(newTheme);
  };

  const handleLanguageChange = (newLanguage: 'en' | 'vi') => {
    setLanguage(newLanguage);
  };

  const handleLogout = () => {
    Alert.alert(
      language === 'vi' ? 'Đăng xuất' : 'Logout',
      language === 'vi' ? 'Bạn có chắc chắn muốn đăng xuất?' : 'Are you sure you want to logout?',
      [
        {
          text: language === 'vi' ? 'Hủy' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'vi' ? 'Đăng xuất' : 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleTermsOfService = () => {
    navigation.navigate('TermsOfService');
  };

  const handleResetSettings = () => {
    Alert.alert(
      language === 'vi' ? 'Đặt lại cài đặt' : 'Reset Settings',
      language === 'vi' ? 'Tất cả cài đặt sẽ được đặt lại về mặc định. Bạn có chắc chắn?' : 'All settings will be reset to default values. Are you sure?',
      [
        {
          text: language === 'vi' ? 'Hủy' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'vi' ? 'Đặt lại' : 'Reset',
          style: 'destructive',
          onPress: async () => {
            setNotifications(true);
            setSoundEnabled(true);
            setVibrateEnabled(true);
            setDataSaver(false);
            setAutoDownload(false);
            setAnalyticsEnabled(true);
            setChatHistoryEnabled(true);
            setThemeType('auto');
            setLanguage('en');
            await AsyncStorage.removeItem('user_settings');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Icon name="lock" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {language === 'vi' ? 'Yêu cầu đăng nhập' : 'Login Required'}
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {language === 'vi' ? 'Vui lòng đăng nhập để truy cập cài đặt' : 'Please log in to access settings'}
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.loginButtonText, { color: 'white' }]}>
              {language === 'vi' ? 'Đăng nhập' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={theme.type === 'dark' 
          ? ['#8B5CF6', '#7C3AED', '#111827'] as [string, string, ...string[]]
          : ['#667EEA', '#764BA2', '#FAFAFA'] as [string, string, ...string[]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
        <TouchableOpacity
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          onPress={() => navigation.goBack()}
        >
            <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'vi' ? '⚙️ Cài Đặt' : '⚙️ Settings'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

        {/* User info */}
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Icon name="person" size={32} color="white" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name || user.email}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🌓 {language === 'vi' ? 'Giao Diện' : 'Appearance'}
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            {/* Theme Selector */}
            <View style={styles.themeSelector}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                {language === 'vi' ? 'Chủ đề' : 'Theme'}
              </Text>
              <View style={styles.themeOptions}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeType === 'light' && styles.themeOptionActive,
                    { borderColor: theme.colors.border }
                  ]}
                  onPress={() => handleThemeChange('light')}
                >
                  <Icon name="light-mode" size={20} color={themeType === 'light' ? theme.colors.primary : theme.colors.textSecondary} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: themeType === 'light' ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    {language === 'vi' ? 'Sáng' : 'Light'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeType === 'dark' && styles.themeOptionActive,
                    { borderColor: theme.colors.border }
                  ]}
                  onPress={() => handleThemeChange('dark')}
                >
                  <Icon name="dark-mode" size={20} color={themeType === 'dark' ? theme.colors.primary : theme.colors.textSecondary} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: themeType === 'dark' ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    {language === 'vi' ? 'Tối' : 'Dark'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeType === 'auto' && styles.themeOptionActive,
                    { borderColor: theme.colors.border }
                  ]}
                  onPress={() => handleThemeChange('auto')}
                >
                  <Icon name="brightness-auto" size={20} color={themeType === 'auto' ? theme.colors.primary : theme.colors.textSecondary} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: themeType === 'auto' ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    {language === 'vi' ? 'Tự động' : 'Auto'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Language Selector */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="language" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Chọn ngôn ngữ giao diện' : 'Choose interface language'}
                  </Text>
                </View>
              </View>
              <View style={styles.languageButtons}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    language === 'en' && styles.languageButtonActive,
                    { borderColor: theme.colors.border }
                  ]}
                  onPress={() => handleLanguageChange('en')}
                >
                  <Text style={[
                    styles.languageButtonText,
                    { color: language === 'en' ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    EN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    language === 'vi' && styles.languageButtonActive,
                    { borderColor: theme.colors.border }
                  ]}
                  onPress={() => handleLanguageChange('vi')}
                >
                  <Text style={[
                    styles.languageButtonText,
                    { color: language === 'vi' ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    VI
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Chat Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            💬 {language === 'vi' ? 'Trò chuyện' : 'Chat'}
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="history" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Lưu lịch sử' : 'Save History'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Lưu trữ lịch sử trò chuyện' : 'Store conversation history'}
                  </Text>
                </View>
              </View>
              <Switch
                value={chatHistoryEnabled}
                onValueChange={setChatHistoryEnabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="data-usage" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Tiết kiệm dữ liệu' : 'Data Saver'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Giảm sử dụng dữ liệu' : 'Reduce data usage'}
                  </Text>
                </View>
              </View>
              <Switch
                value={dataSaver}
                onValueChange={setDataSaver}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="download" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Tự động tải' : 'Auto Download'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Tự động tải về' : 'Automatically download'}
                  </Text>
                </View>
              </View>
              <Switch
                value={autoDownload}
                onValueChange={setAutoDownload}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🔔 {language === 'vi' ? 'Thông báo' : 'Notifications'}
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="notifications" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Thông báo đẩy' : 'Push Notifications'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Nhận thông báo' : 'Receive notifications'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="volume-on" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Âm thanh' : 'Sound'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Phát âm thanh thông báo' : 'Play notification sounds'}
                  </Text>
                </View>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="vibration" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Rung' : 'Vibrate'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Rung khi có thông báo' : 'Vibrate on notifications'}
                  </Text>
                </View>
              </View>
              <Switch
                value={vibrateEnabled}
                onValueChange={setVibrateEnabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>
          </View>
        </View>

        {/* Privacy & Analytics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🔒 {language === 'vi' ? 'Bảo mật & Quyền riêng tư' : 'Privacy & Security'}
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="analytics" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Thông kê & Phân tích' : 'Analytics'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Cho phép thu thập dữ liệu sử dụng' : 'Allow usage data collection'}
                  </Text>
                </View>
              </View>
              <Switch
                value={analyticsEnabled}
                onValueChange={setAnalyticsEnabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>

            <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
              <View style={styles.settingInfo}>
                <Icon name="privacy-tip" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Chính sách riêng tư' : 'Privacy Policy'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Đọc chính sách riêng tư của chúng tôi' : 'Read our privacy policy'}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfService}>
              <View style={styles.settingInfo}>
                <Icon name="description" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Service'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Đọc điều khoản dịch vụ của chúng tôi' : 'Read our terms of service'}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            ⚡ {language === 'vi' ? 'Hành động' : 'Actions'}
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity style={styles.settingItem} onPress={handleResetSettings}>
              <View style={styles.settingInfo}>
                <Icon name="restore" size={24} color={theme.colors.warning} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Đặt lại cài đặt' : 'Reset Settings'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Khôi phục cài đặt mặc định' : 'Restore default settings'}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <View style={styles.settingInfo}>
                <Icon name="logout" size={24} color={theme.colors.error} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.error }]}>
                    {language === 'vi' ? 'Đăng xuất' : 'Logout'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Thoát khỏi tài khoản hiện tại' : 'Sign out from current account'}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="info" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Phiên bản ứng dụng' : 'App Version'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    v1.0.0
                  </Text>
                </View>
              </View>
          </View>
        </View>
      </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingCard: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.3,
    borderColor: 'rgba(139, 92, 246, 0.02)',
  },
  themeSelector: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  themeOptions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  themeOptionActive: {
    backgroundColor: 'rgba(102,126,234,0.1)',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 48,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: 'rgba(102,126,234,0.1)',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

export default SettingsScreen;
