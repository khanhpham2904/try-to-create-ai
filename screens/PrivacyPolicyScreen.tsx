import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-web';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

interface PrivacyPolicyScreenProps {
  navigation: any;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const privacyContent = {
    vi: {
      title: 'Chính Sách Bảo Vệ Dữ Liệu Cá Nhân',
      lastUpdated: 'Cập nhật lần cuối: 2024',
      sections: [
        {
          title: '1. Giới Thiệu',
          content: 'Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của người dùng. Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi sử dụng ứng dụng AI Chat.',
        },
        {
          title: '2. Thông Tin Chúng Tôi Thu Thập',
          content: 'Chúng tôi thu thập các thông tin sau:\n\n• Thông tin tài khoản: Tên, email, mật khẩu (được mã hóa)\n• Dữ liệu trò chuyện: Nội dung cuộc trò chuyện với AI để cải thiện dịch vụ\n• Dữ liệu sử dụng: Thời gian sử dụng, tính năng được sử dụng\n• Thông tin thiết bị: Loại thiết bị, hệ điều hành, phiên bản ứng dụng',
        },
        {
          title: '3. Cách Chúng Tôi Sử Dụng Thông Tin',
          content: 'Chúng tôi sử dụng thông tin của bạn để:\n\n• Cung cấp và cải thiện dịch vụ AI Chat\n• Xử lý và lưu trữ lịch sử trò chuyện\n• Cá nhân hóa trải nghiệm người dùng\n• Phân tích và cải thiện hiệu suất ứng dụng\n• Gửi thông báo quan trọng về dịch vụ',
        },
        {
          title: '4. Bảo Mật Dữ Liệu',
          content: 'Chúng tôi áp dụng các biện pháp bảo mật tiên tiến:\n\n• Mã hóa dữ liệu trong quá trình truyền tải (HTTPS/TLS)\n• Mã hóa dữ liệu khi lưu trữ\n• Kiểm soát truy cập nghiêm ngặt\n• Sao lưu dữ liệu định kỳ\n• Giám sát bảo mật liên tục',
        },
        {
          title: '5. Chia Sẻ Thông Tin',
          content: 'Chúng tôi KHÔNG bán hoặc cho thuê thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ thông tin trong các trường hợp:\n\n• Với sự đồng ý của bạn\n• Để tuân thủ pháp luật\n• Để bảo vệ quyền và an toàn của người dùng\n• Với nhà cung cấp dịch vụ đáng tin cậy (với cam kết bảo mật)',
        },
        {
          title: '6. Quyền Của Người Dùng',
          content: 'Bạn có quyền:\n\n• Truy cập và xem dữ liệu cá nhân của mình\n• Yêu cầu chỉnh sửa hoặc xóa dữ liệu\n• Yêu cầu xuất dữ liệu (GDPR)\n• Từ chối thu thập dữ liệu phân tích\n• Xóa tài khoản và tất cả dữ liệu liên quan',
        },
        {
          title: '7. Lưu Trữ Dữ Liệu',
          content: 'Chúng tôi lưu trữ dữ liệu của bạn:\n\n• Trong thời gian cần thiết để cung cấp dịch vụ\n• Tuân thủ các yêu cầu pháp lý\n• Bạn có thể yêu cầu xóa dữ liệu bất cứ lúc nào\n• Dữ liệu sẽ được xóa vĩnh viễn trong vòng 30 ngày sau khi yêu cầu',
        },
        {
          title: '8. Cookie và Công Nghệ Theo Dõi',
          content: 'Chúng tôi sử dụng:\n\n• Cookie cần thiết cho hoạt động ứng dụng\n• Local Storage để lưu trữ cài đặt\n• Analytics để cải thiện dịch vụ (có thể tắt trong cài đặt)',
        },
        {
          title: '9. Trẻ Em',
          content: 'Ứng dụng của chúng tôi không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập thông tin từ trẻ em. Nếu phát hiện, chúng tôi sẽ xóa thông tin đó ngay lập tức.',
        },
        {
          title: '10. Thay Đổi Chính Sách',
          content: 'Chúng tôi có thể cập nhật chính sách này. Thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo trong ứng dụng. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi có hiệu lực được coi là chấp nhận chính sách mới.',
        },
        {
          title: '11. Liên Hệ',
          content: 'Nếu bạn có câu hỏi về chính sách này, vui lòng liên hệ:\n\nEmail: privacy@aichat.app\nĐịa chỉ: [Địa chỉ công ty]\nThời gian phản hồi: Trong vòng 48 giờ',
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: 2024',
      sections: [
        {
          title: '1. Introduction',
          content: 'We are committed to protecting your privacy and personal data. This policy describes how we collect, use, store, and protect your information when you use the AI Chat application.',
        },
        {
          title: '2. Information We Collect',
          content: 'We collect the following information:\n\n• Account Information: Name, email, password (encrypted)\n• Chat Data: Conversation content with AI to improve service\n• Usage Data: Usage time, features used\n• Device Information: Device type, operating system, app version',
        },
        {
          title: '3. How We Use Your Information',
          content: 'We use your information to:\n\n• Provide and improve AI Chat service\n• Process and store chat history\n• Personalize user experience\n• Analyze and improve app performance\n• Send important service notifications',
        },
        {
          title: '4. Data Security',
          content: 'We implement advanced security measures:\n\n• Data encryption during transmission (HTTPS/TLS)\n• Data encryption at rest\n• Strict access controls\n• Regular data backups\n• Continuous security monitoring',
        },
        {
          title: '5. Information Sharing',
          content: 'We do NOT sell or rent your personal information. We only share information in the following cases:\n\n• With your consent\n• To comply with legal requirements\n• To protect user rights and safety\n• With trusted service providers (with security commitments)',
        },
        {
          title: '6. User Rights',
          content: 'You have the right to:\n\n• Access and view your personal data\n• Request data correction or deletion\n• Request data export (GDPR)\n• Opt-out of analytics data collection\n• Delete account and all related data',
        },
        {
          title: '7. Data Retention',
          content: 'We store your data:\n\n• For as long as necessary to provide the service\n• In compliance with legal requirements\n• You can request data deletion at any time\n• Data will be permanently deleted within 30 days of request',
        },
        {
          title: '8. Cookies and Tracking Technologies',
          content: 'We use:\n\n• Essential cookies for app functionality\n• Local Storage for settings\n• Analytics to improve service (can be disabled in settings)',
        },
        {
          title: '9. Children',
          content: 'Our application is not intended for children under 13 years of age. We do not knowingly collect information from children. If discovered, we will delete such information immediately.',
        },
        {
          title: '10. Policy Changes',
          content: 'We may update this policy. Significant changes will be notified via email or in-app notification. Continued use of the service after changes take effect is considered acceptance of the new policy.',
        },
        {
          title: '11. Contact',
          content: 'If you have questions about this policy, please contact:\n\nEmail: privacy@aichat.app\nAddress: [Company Address]\nResponse Time: Within 48 hours',
        },
      ],
    },
  };

  const content = privacyContent[language];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            🔒 {content.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={styles.lastUpdated}>{content.lastUpdated}</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        bounces={Platform.OS !== 'web'}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {content.sections.map((section, index) => (
          <View key={index} style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: theme.colors.text }]}>
              {section.content}
            </Text>
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    ...(Platform.OS !== 'web' && {
      flexGrow: 1,
    }),
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  bottomPadding: {
    height: 40,
  },
});

export default PrivacyPolicyScreen;

