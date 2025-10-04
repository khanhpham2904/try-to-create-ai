import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { FloatingActionButton } from '../components/FloatingActionButton';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = () => {
    console.log('🔘 Logout button pressed in ProfileScreen');
    if (Platform.OS === 'web') {
      // Web-specific logout without Alert
      console.log('🚪 Web logout initiated from ProfileScreen');
      logout();
    } else {
      // Mobile logout with confirmation
      Alert.alert(
        language === 'vi' ? 'Đăng Xuất' : 'Logout',
        language === 'vi' ? 'Bạn có chắc chắn muốn đăng xuất?' : 'Are you sure you want to logout?',
        [
          { text: language === 'vi' ? 'Hủy' : 'Cancel', style: 'cancel' },
          { text: language === 'vi' ? 'Đăng Xuất' : 'Logout', style: 'destructive', onPress: () => {
            console.log('🔘 Logout confirmed in ProfileScreen');
            logout();
          }},
        ]
      );
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {language === 'vi' ? 'Vui lòng đăng nhập để xem hồ sơ của bạn' : 'Please log in to view your profile'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AnimatedBackground intensity="medium">
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <StatusBar 
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={theme.type === 'dark' 
            ? ['#667EEA', '#764BA2', '#1A1625'] as [string, string, ...string[]]
            : ['#667EEA', '#764BA2', '#FFFFFF'] as [string, string, ...string[]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
        <TouchableOpacity
              style={[styles.backButtonModern, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          onPress={() => navigation.goBack()}
        >
              <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
            <Text style={styles.headerTitleModern}>
              {language === 'vi' ? '✨ Hồ Sơ Cá Nhân' : '✨ My Profile'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
        </LinearGradient>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {/* Profile Card with Glass-morphism */}
            <View style={styles.profileSection}>
              <LinearGradient
                colors={theme.type === 'dark' 
                  ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as [string, string, ...string[]]
                  : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)', 'rgba(247,250,252,0.9)'] as [string, string, ...string[]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.profileCard, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}
              >
                <LinearGradient
                  colors={['#667EEA', '#764BA2', '#FFFFFF'] as [string, string, ...string[]]}
                  style={styles.avatarGradient}
                >
                  <Icon name="person" size={60} color="white" />
                </LinearGradient>
                
                <View style={styles.profileInfo}>
                  <Text style={[styles.userNameModern, { color: theme.colors.text }]}>
            {user.name}
          </Text>
                  <Text style={[styles.userEmailModern, { color: theme.colors.textSecondary }]}>
            {user.email}
          </Text>
                  
                  <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
                    <Text style={[styles.statusText, { color: theme.colors.success }]}>
                      {language === 'vi' ? 'Hoạt động' : 'Active'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
        </View>

            {/* Settings Section */}
        <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {language === 'vi' ? '⚙️ Cài Đặt' : '⚙️ Settings'}
              </Text>
              
              <LinearGradient
                colors={theme.type === 'dark' 
                  ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as [string, string, ...string[]]
                  : ['rgba(255,255,255,0.85)', 'rgba(247,250,252,0.9)'] as [string, string, ...string[]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.menuContainer, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}
              >
          <TouchableOpacity
                  style={[styles.menuItemModern]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings" size={24} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              {language === 'vi' ? 'Cài Đặt' : 'Settings'}
            </Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
                  style={styles.menuItemModern}
            onPress={() => {/* Handle help */}}
          >
                  <Icon name="help" size={24} color={theme.colors.success} />
                  <Text style={[styles.menuTextModern, { color: theme.colors.text }]}>
                    {language === 'vi' ? '🆘 Trợ Giúp & Hỗ Trợ' : '🆘 Help & Support'}
            </Text>
                  <Icon name="chevron-right" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
                  style={styles.menuItemModern}
            onPress={() => {/* Handle about */}}
          >
                  <Icon name="info" size={24} color={theme.colors.info} />
                  <Text style={[styles.menuTextModern, { color: theme.colors.text }]}>
                    {language === 'vi' ? 'ℹ️ Thông Tin Ứng Dụng' : 'ℹ️ About App'}
            </Text>
                  <Icon name="chevron-right" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
              </LinearGradient>
        </View>

            {/* Logout Section */}
            <View style={styles.logoutSection}>
        <TouchableOpacity
                style={[styles.logoutButtonModern, { borderColor: theme.colors.error }]}
          onPress={handleLogout}
        >
                <LinearGradient
                  colors={[theme.colors.error, theme.colors.error + 'DD'] as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoutGradient}
                >
                  <Icon name="logout" size={22} color="white" />
                  <Text style={styles.logoutTextModern}>
                    {language === 'vi' ? '🚪 Đăng Xuất' : '🚪 Logout'}
          </Text>
                </LinearGradient>
        </TouchableOpacity>
      </View>
          </Animated.View>
        </ScrollView>

        {/* Floating Action Button */}
        <FloatingActionButton
          icon="edit"
          onPress={() => {/* Handle edit profile */}}
          position="bottom-right"
          secondary={true}
          size="medium"
          elevation={12}
        />
    </SafeAreaView>
    </AnimatedBackground>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'android' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'android' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'android' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'android' ? 4 : undefined,
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
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Modern styles for redesigned ProfileScreen
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
    paddingBottom: 20,
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitleModern: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  profileSection: {
    marginBottom: 32,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: Platform.OS === 'android' ? 6 : 4,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userNameModern: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmailModern: {
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(72,187,120,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  menuContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: Platform.OS === 'android' ? 6 : 4,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  menuItemModern: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuTextModern: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 16,
  },
  logoutSection: {
    paddingHorizontal: 8,
  },
  logoutButtonModern: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logoutTextModern: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 'auto',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProfileScreen;
