import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, themeType, setThemeType, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { language } = useLanguage();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeType(newTheme);
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {language === 'vi' ? 'Vui lòng đăng nhập để truy cập cài đặt' : 'Please log in to access settings'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {language === 'vi' ? 'Cài Đặt' : 'Settings'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Theme Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Giao Diện' : 'Appearance'}
          </Text>
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="light-mode" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Chế Độ Sáng' : 'Light Mode'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Sử dụng giao diện sáng' : 'Use light theme'}
                  </Text>
                </View>
              </View>
              <Switch
                value={themeType === 'light'}
                onValueChange={() => handleThemeChange('light')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="dark-mode" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Chế Độ Tối' : 'Dark Mode'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Sử dụng giao diện tối' : 'Use dark theme'}
                  </Text>
                </View>
              </View>
              <Switch
                value={themeType === 'dark'}
                onValueChange={() => handleThemeChange('dark')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="brightness-auto" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Tự Động' : 'Auto'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Theo giao diện hệ thống' : 'Follow system theme'}
                  </Text>
                </View>
              </View>
              <Switch
                value={themeType === 'auto'}
                onValueChange={() => handleThemeChange('auto')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Thông Báo' : 'Notifications'}
          </Text>
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="notifications" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Thông Báo Đẩy' : 'Push Notifications'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Nhận thông báo' : 'Receive notifications'}
                  </Text>
                </View>
              </View>
              <Switch
                value={true}
                onValueChange={() => {/* Handle notification toggle */}}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {language === 'vi' ? 'Riêng Tư & Bảo Mật' : 'Privacy & Security'}
          </Text>
          <View style={[styles.settingCard, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="security" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Chính Sách Riêng Tư' : 'Privacy Policy'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {language === 'vi' ? 'Đọc chính sách riêng tư của chúng tôi' : 'Read our privacy policy'}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="description" size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'Điều Khoản Dịch Vụ' : 'Terms of Service'}
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
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingCard: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SettingsScreen;
