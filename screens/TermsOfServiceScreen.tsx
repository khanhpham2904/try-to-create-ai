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
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

interface TermsOfServiceScreenProps {
  navigation: any;
}

const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const termsContent = {
    vi: {
      title: 'Điều Khoản Sử Dụng Dịch Vụ',
      lastUpdated: 'Cập nhật lần cuối: 2024',
      sections: [
        {
          title: '1. Chấp Nhận Điều Khoản',
          content: 'Bằng việc sử dụng ứng dụng AI Chat, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn không được sử dụng dịch vụ.',
        },
        {
          title: '2. Mô Tả Dịch Vụ',
          content: 'AI Chat là một ứng dụng trò chuyện với trí tuệ nhân tạo, cung cấp:\n\n• Trò chuyện với AI agents\n• Lưu trữ lịch sử trò chuyện\n• Tính năng voice chat\n• Tùy chỉnh AI agents\n• Các tính năng khác được cập nhật định kỳ',
        },
        {
          title: '3. Đăng Ký Tài Khoản',
          content: 'Để sử dụng dịch vụ, bạn cần:\n\n• Cung cấp thông tin chính xác và đầy đủ\n• Duy trì bảo mật tài khoản và mật khẩu\n• Chịu trách nhiệm cho mọi hoạt động dưới tài khoản của bạn\n• Thông báo ngay lập tức về bất kỳ vi phạm bảo mật nào',
        },
        {
          title: '4. Quy Tắc Sử Dụng',
          content: 'Bạn đồng ý KHÔNG:\n\n• Sử dụng dịch vụ cho mục đích bất hợp pháp\n• Gửi nội dung vi phạm, xúc phạm, hoặc có hại\n• Cố gắng truy cập trái phép vào hệ thống\n• Sao chép, phân phối, hoặc bán dịch vụ\n• Sử dụng bot hoặc script tự động\n• Can thiệp vào hoạt động bình thường của dịch vụ',
        },
        {
          title: '5. Quyền Sở Hữu Trí Tuệ',
          content: 'Tất cả nội dung trong ứng dụng, bao gồm:\n\n• Mã nguồn, thiết kế, logo\n• Văn bản, hình ảnh, âm thanh\n• Các tính năng và chức năng\n\nĐều thuộc quyền sở hữu của chúng tôi hoặc được cấp phép sử dụng. Bạn không được sao chép hoặc sử dụng mà không có sự cho phép.',
        },
        {
          title: '6. Nội Dung Người Dùng',
          content: 'Bạn giữ quyền sở hữu nội dung bạn tạo. Tuy nhiên, bằng cách sử dụng dịch vụ, bạn cấp cho chúng tôi quyền:\n\n• Lưu trữ và xử lý nội dung của bạn\n• Sử dụng để cải thiện dịch vụ AI\n• Hiển thị nội dung trong tài khoản của bạn\n• Xóa nội dung vi phạm điều khoản',
        },
        {
          title: '7. Giới Hạn Trách Nhiệm',
          content: 'Chúng tôi không đảm bảo:\n\n• Dịch vụ sẽ luôn hoạt động không gián đoạn\n• Kết quả AI sẽ luôn chính xác 100%\n• Dịch vụ sẽ đáp ứng mọi nhu cầu của bạn\n\nChúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng dịch vụ.',
        },
        {
          title: '8. Chấm Dứt Dịch Vụ',
          content: 'Chúng tôi có quyền:\n\n• Tạm ngưng hoặc chấm dứt tài khoản vi phạm điều khoản\n• Xóa nội dung vi phạm\n• Từ chối dịch vụ cho bất kỳ ai\n\nBạn có thể xóa tài khoản bất cứ lúc nào thông qua cài đặt.',
        },
        {
          title: '9. Thay Đổi Dịch Vụ',
          content: 'Chúng tôi có quyền:\n\n• Thay đổi, tạm ngưng, hoặc chấm dứt bất kỳ phần nào của dịch vụ\n• Cập nhật tính năng và giao diện\n• Thay đổi giá cả (nếu có)\n• Thông báo trước về các thay đổi quan trọng',
        },
        {
          title: '10. Bồi Thường',
          content: 'Bạn đồng ý bồi thường và bảo vệ chúng tôi khỏi mọi khiếu nại, thiệt hại, tổn thất, trách nhiệm pháp lý phát sinh từ:\n\n• Việc sử dụng dịch vụ của bạn\n• Vi phạm các điều khoản này\n• Vi phạm quyền của bên thứ ba',
        },
        {
          title: '11. Luật Áp Dụng',
          content: 'Các điều khoản này được điều chỉnh bởi luật pháp Việt Nam. Mọi tranh chấp sẽ được giải quyết tại tòa án có thẩm quyền tại Việt Nam.',
        },
        {
          title: '12. Liên Hệ',
          content: 'Nếu bạn có câu hỏi về các điều khoản này, vui lòng liên hệ:\n\nEmail: support@aichat.app\nĐịa chỉ: [Địa chỉ công ty]\nThời gian phản hồi: Trong vòng 48 giờ',
        },
      ],
    },
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated: 2024',
      sections: [
        {
          title: '1. Acceptance of Terms',
          content: 'By using the AI Chat application, you agree to be bound by these terms and conditions. If you do not agree with any part of these terms, you may not use the service.',
        },
        {
          title: '2. Service Description',
          content: 'AI Chat is an artificial intelligence chat application that provides:\n\n• Chat with AI agents\n• Chat history storage\n• Voice chat features\n• AI agent customization\n• Other features updated periodically',
        },
        {
          title: '3. Account Registration',
          content: 'To use the service, you must:\n\n• Provide accurate and complete information\n• Maintain account and password security\n• Be responsible for all activities under your account\n• Immediately notify us of any security breaches',
        },
        {
          title: '4. Usage Rules',
          content: 'You agree NOT to:\n\n• Use the service for illegal purposes\n• Send violating, offensive, or harmful content\n• Attempt unauthorized access to the system\n• Copy, distribute, or sell the service\n• Use bots or automated scripts\n• Interfere with normal service operations',
        },
        {
          title: '5. Intellectual Property',
          content: 'All content in the application, including:\n\n• Source code, design, logos\n• Text, images, sounds\n• Features and functions\n\nAre owned by us or licensed for use. You may not copy or use without permission.',
        },
        {
          title: '6. User Content',
          content: 'You retain ownership of content you create. However, by using the service, you grant us the right to:\n\n• Store and process your content\n• Use to improve AI service\n• Display content in your account\n• Delete content violating terms',
        },
        {
          title: '7. Limitation of Liability',
          content: 'We do not guarantee:\n\n• Service will always operate without interruption\n• AI results will always be 100% accurate\n• Service will meet all your needs\n\nWe are not liable for any damages arising from use of the service.',
        },
        {
          title: '8. Service Termination',
          content: 'We have the right to:\n\n• Suspend or terminate accounts violating terms\n• Delete violating content\n• Refuse service to anyone\n\nYou may delete your account at any time through settings.',
        },
        {
          title: '9. Service Changes',
          content: 'We have the right to:\n\n• Change, suspend, or terminate any part of the service\n• Update features and interface\n• Change pricing (if applicable)\n• Notify in advance of significant changes',
        },
        {
          title: '10. Indemnification',
          content: 'You agree to indemnify and hold us harmless from any claims, damages, losses, legal liability arising from:\n\n• Your use of the service\n• Violation of these terms\n• Violation of third-party rights',
        },
        {
          title: '11. Governing Law',
          content: 'These terms are governed by Vietnamese law. Any disputes will be resolved in competent courts in Vietnam.',
        },
        {
          title: '12. Contact',
          content: 'If you have questions about these terms, please contact:\n\nEmail: support@aichat.app\nAddress: [Company Address]\nResponse Time: Within 48 hours',
        },
      ],
    },
  };

  const content = termsContent[language];

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
            📄 {content.title}
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
    flexGrow: 0,
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

export default TermsOfServiceScreen;

