import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from '@expo/vector-icons/MaterialIcons';

interface NewbieGuideModalProps {
  visible: boolean;
  onClose: () => void;
  onDontShowAgain?: () => void;
}

const { height, width } = Dimensions.get('window');

const NewbieGuideModal: React.FC<NewbieGuideModalProps> = ({
  visible,
  onClose,
  onDontShowAgain,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const isVietnamese = language === 'vi';

  const guideSteps = [
    {
      title: isVietnamese ? 'Tạo Agent Mới' : 'Create New Agent',
      icon: 'smart-toy',
      content: isVietnamese
        ? 'Agent là trợ lý AI của bạn. Bạn có thể tạo nhiều agent với tính cách và phong cách khác nhau.\n\n• Nhấn vào nút "+" hoặc "Create Agent" để tạo agent mới\n• Đặt tên cho agent (ví dụ: "Alex - The Friendly Helper")\n• Mô tả tính cách của agent\n• Thiết lập phong cách phản hồi (feedback style)\n• Viết system prompt để định hướng hành vi của agent'
        : 'An Agent is your AI assistant. You can create multiple agents with different personalities and styles.\n\n• Click the "+" button or "Create Agent" to create a new agent\n• Give your agent a name (e.g., "Alex - The Friendly Helper")\n• Describe the agent\'s personality\n• Set the feedback style\n• Write a system prompt to guide the agent\'s behavior',
    },
    {
      title: isVietnamese ? 'System Prompt là gì?' : 'What is System Prompt?',
      icon: 'settings',
      content: isVietnamese
        ? 'System Prompt là hướng dẫn cốt lõi cho AI, định nghĩa cách agent sẽ hoạt động và phản hồi.\n\n• System Prompt quyết định hành vi cơ bản của agent\n• Nó hướng dẫn agent cách xử lý câu hỏi và tình huống\n• Ví dụ: "You are a friendly and supportive AI assistant who always maintains a positive attitude."\n• System Prompt kết hợp với Personality và Feedback Style để tạo ra trải nghiệm độc đáo'
        : 'System Prompt is the core instruction for the AI, defining how the agent will behave and respond.\n\n• System Prompt determines the agent\'s basic behavior\n• It guides the agent on how to handle questions and situations\n• Example: "You are a friendly and supportive AI assistant who always maintains a positive attitude."\n• System Prompt combines with Personality and Feedback Style to create a unique experience',
    },
    {
      title: isVietnamese ? 'Personal (Hồ sơ cá nhân)' : 'Personal (User Profile)',
      icon: 'person',
      content: isVietnamese
        ? 'Personal là hồ sơ cá nhân của bạn, giúp AI hiểu và cá nhân hóa trải nghiệm cho bạn.\n\n• Communication Style: Cách bạn muốn AI giao tiếp (Formal, Casual, Technical, Balanced)\n• Response Length: Độ dài phản hồi bạn muốn (Short, Medium, Detailed)\n• Language Preference: Ngôn ngữ ưa thích (English, Vietnamese)\n• Interests: Sở thích của bạn để AI đề xuất nội dung phù hợp\n• Preferences: Các tùy chọn khác để tùy chỉnh trải nghiệm'
        : 'Personal is your user profile that helps the AI understand and personalize the experience for you.\n\n• Communication Style: How you want the AI to communicate (Formal, Casual, Technical, Balanced)\n• Response Length: The length of responses you prefer (Short, Medium, Detailed)\n• Language Preference: Your preferred language (English, Vietnamese)\n• Interests: Your interests so the AI can suggest relevant content\n• Preferences: Other options to customize your experience',
    },
    {
      title: isVietnamese ? 'Feedback Style hoạt động như thế nào?' : 'How does Feedback Style work?',
      icon: 'feedback',
      content: isVietnamese
        ? 'Feedback Style xác định cách agent cung cấp phản hồi và đánh giá cho bạn.\n\n• Feedback Style mô tả cách agent sẽ phản hồi (ví dụ: "Constructive and encouraging feedback with lots of positive reinforcement")\n• Nó kết hợp với Personality và System Prompt để tạo ra phong cách phản hồi nhất quán\n• Ví dụ các phong cách:\n  - Khuyến khích: Nhiều lời khen và động viên\n  - Chuyên nghiệp: Phân tích chi tiết với đề xuất cụ thể\n  - Sáng tạo: Gợi ý mới mẻ và góc nhìn khác biệt\n  - Giáo dục: Giải thích từng bước với ví dụ rõ ràng'
        : 'Feedback Style determines how the agent provides feedback and evaluations for you.\n\n• Feedback Style describes how the agent will respond (e.g., "Constructive and encouraging feedback with lots of positive reinforcement")\n• It combines with Personality and System Prompt to create a consistent feedback style\n• Example styles:\n  - Encouraging: Lots of praise and motivation\n  - Professional: Detailed analysis with specific recommendations\n  - Creative: Fresh suggestions and different perspectives\n  - Educational: Step-by-step explanations with clear examples',
    },
  ];

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      ...(Platform.OS === 'android' && StatusBar.currentHeight && {
        paddingTop: StatusBar.currentHeight,
      }),
    },
    modalContainer: {
      width: width * 0.9,
      maxWidth: 500,
      maxHeight: height * 0.85,
      minHeight: Platform.OS === 'android' ? height * 0.5 : undefined,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      overflow: 'hidden',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      ...(Platform.OS === 'android' && {
        flexDirection: 'column',
      }),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 20 : 40,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
      includeFontPadding: Platform.OS === 'android' ? false : true,
      ...(Platform.OS === 'android' && { fontFamily: 'sans-serif-medium' }),
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
      includeFontPadding: Platform.OS === 'android' ? false : true,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      minHeight: 0, // Important for ScrollView to work properly
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      flexGrow: 1,
      ...(Platform.OS === 'android' && {
        minHeight: 200, // Ensure minimum height for content
      }),
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    stepDotActive: {
      width: 24,
      height: 8,
      borderRadius: 4,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 24,
    },
    stepTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 16,
      includeFontPadding: Platform.OS === 'android' ? false : true,
      ...(Platform.OS === 'android' && { fontFamily: 'sans-serif-medium' }),
    },
    stepContent: {
      fontSize: 15,
      lineHeight: 24,
      color: theme.colors.text,
      textAlign: 'left',
      includeFontPadding: Platform.OS === 'android' ? false : true,
      flexShrink: 1,
      ...(Platform.OS === 'android' && { fontFamily: 'sans-serif' }),
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      gap: 12,
    },
    skipButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    skipButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
      includeFontPadding: Platform.OS === 'android' ? false : true,
    },
    previousButton: {
      flex: 1,
      backgroundColor: theme.colors.border,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    previousButtonText: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '600',
      includeFontPadding: Platform.OS === 'android' ? false : true,
    },
    nextButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      elevation: 2,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    nextButtonText: {
      color: theme.colors.surface,
      fontSize: 15,
      fontWeight: '600',
      includeFontPadding: Platform.OS === 'android' ? false : true,
    },
    dontShowAgainButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignSelf: 'center',
      marginTop: 8,
    },
    dontShowAgainText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: '500',
      includeFontPadding: Platform.OS === 'android' ? false : true,
    },
  });

  const currentGuide = guideSteps[currentStep];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor="rgba(0, 0, 0, 0.5)"
          barStyle="light-content"
          translucent={true}
        />
      )}
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Icon name="help-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>
                  {isVietnamese ? 'Hướng Dẫn Cho Người Mới' : 'Newbie Guide'}
                </Text>
                <Text style={styles.subtitle}>
                  {currentStep + 1} / {guideSteps.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            bounces={Platform.OS === 'ios'}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.stepIndicator}>
              {guideSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.stepDot,
                    index === currentStep && styles.stepDotActive,
                    {
                      backgroundColor:
                        index === currentStep
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.iconContainer}>
              <Icon name={currentGuide.icon} size={40} color={theme.colors.primary} />
            </View>

            <Text style={styles.stepTitle} allowFontScaling={true}>
              {currentGuide.title}
            </Text>

            <Text style={styles.stepContent} allowFontScaling={true}>
              {currentGuide.content}
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>
                {isVietnamese ? 'Bỏ qua' : 'Skip'}
              </Text>
            </TouchableOpacity>

            {currentStep > 0 && (
              <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
                <Text style={styles.previousButtonText}>
                  {isVietnamese ? 'Trước' : 'Previous'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentStep < guideSteps.length - 1
                  ? isVietnamese
                    ? 'Tiếp theo'
                    : 'Next'
                  : isVietnamese
                  ? 'Hoàn thành'
                  : 'Finish'}
              </Text>
            </TouchableOpacity>
          </View>

          {onDontShowAgain && (
            <TouchableOpacity
              style={styles.dontShowAgainButton}
              onPress={onDontShowAgain}
            >
              <Text style={styles.dontShowAgainText}>
                {isVietnamese
                  ? 'Không hiển thị lại'
                  : "Don't show again"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default NewbieGuideModal;


