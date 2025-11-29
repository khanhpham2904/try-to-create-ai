import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  CheckBox,
} from 'react-native';
import { AuthContext } from './AuthContext';
import { AnimatedButton, AnimatedLogo } from './AnimatedComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { FormInput } from './FormInput';
import { useTheme } from '../theme/ThemeContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [validation, setValidation] = React.useState<{ name: boolean; email: boolean; password: boolean; confirmPassword: boolean }>({ 
    name: false, 
    email: false, 
    password: false, 
    confirmPassword: false 
  });
  
  const { register, isLoading } = React.useContext(AuthContext);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { validateRegistration, validateEmail, validateRequired, validatePassword } = useFormValidation();

  // Use ref to track if component is mounted
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Real-time validation with debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        const newValidation = {
          name: name.length > 0 && validateRequired(name),
          email: email.length > 0 && validateEmail(email),
          password: password.length > 0 && validatePassword(password),
          confirmPassword: confirmPassword.length > 0 && password === confirmPassword,
        };
        setValidation(newValidation);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [name, email, password, confirmPassword, validateEmail, validateRequired, validatePassword]);

  const handleRegister = async () => {
    // Clear previous errors
    setErrors({});
    
    // Check if terms are accepted
    if (!acceptedTerms) {
      Alert.alert(
        t('language') === 'vi' ? 'Yêu Cầu Đồng Ý' : 'Agreement Required',
        t('language') === 'vi' 
          ? 'Vui lòng đồng ý với Điều khoản Sử dụng và Chính sách Bảo mật để tiếp tục.' 
          : 'Please agree to the Terms of Service and Privacy Policy to continue.'
      );
      return;
    }
    
    // Validate form
    const validation = validateRegistration(name, email, password, confirmPassword);
    
    if (!validation.isValid) {
      // Convert validation errors to field-specific errors
      const fieldErrors: Record<string, string> = {};
      validation.errors.forEach(error => {
        if (error.includes('Name')) fieldErrors.name = error;
        else if (error.includes('Email')) fieldErrors.email = error;
        else if (error.includes('Password') && !error.includes('Confirm')) fieldErrors.password = error;
        else if (error.includes('Confirm')) fieldErrors.confirmPassword = error;
      });
      
      setErrors(fieldErrors);
      return;
    }

    // Attempt registration
    const result = await register(email, password, name);
    
    if (!result.success) {
      Alert.alert(
        t('language') === 'vi' ? 'Đăng Ký Thất Bại' : 'Registration Failed', 
        result.error || (t('language') === 'vi' ? 'Đã xảy ra lỗi không mong muốn' : 'An unexpected error occurred')
      );
    }
  };

  return (
    <LinearGradient
      colors={theme.type === 'dark' 
        ? ['#0F0F23', '#1A1625', '#2D3748'] 
        : ['#667EEA', '#764BA2', '#FAFAFA']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} />
        <KeyboardAvoidingView 
          style={styles.keyboardContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={[styles.logoContainer, { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}>
                <AnimatedLogo size={60} />
              </View>
              <Text style={[styles.title, { color: 'white', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }]}>
                {t('language') === 'vi' ? '✨ Tham Gia AI Chat' : '✨ Join AI Chat'}
              </Text>
              <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }]}>
                {t('language') === 'vi' ? 'Tạo tài khoản và bắt đầu trò chuyện với AI' : 'Create your account and start chatting with AI'}
              </Text>
            </View>

            {/* Form Section */}
            <View style={[styles.formContainer, { 
              backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)', 
              borderWidth: 1, 
              borderColor: theme.type === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'
            }]}>
              <View style={styles.formHeader}>
                <Icon name="person-add" size={24} color={theme.colors.primary} />
                <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                  {t('language') === 'vi' ? 'Tạo Tài Khoản' : 'Create Account'}
                </Text>
              </View>

            <View style={styles.inputContainer}>
              <FormInput
                label={t('fullName')}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder={t('language') === 'vi' ? 'Nhập họ và tên của bạn' : 'Enter your full name'}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isLoading}
                error={errors.name}
                isValid={validation.name}
                showValidationIcon={true}
                leftIcon="person"
              />

              <FormInput
                label={t('email')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder={t('language') === 'vi' ? 'Nhập email của bạn' : 'Enter your email'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
                error={errors.email}
                isValid={validation.email}
                showValidationIcon={true}
                leftIcon="email"
              />

              <FormInput
                label={t('password')}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder={t('language') === 'vi' ? 'Tạo mật khẩu mạnh' : 'Create a strong password'}
                secureTextEntry
                autoComplete="password-new"
                editable={!isLoading}
                error={errors.password}
                isValid={validation.password}
                showValidationIcon={true}
                leftIcon="lock"
              />

              <FormInput
                label={t('confirmPassword')}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                placeholder={t('language') === 'vi' ? 'Xác nhận mật khẩu của bạn' : 'Confirm your password'}
                secureTextEntry
                autoComplete="password-new"
                editable={!isLoading}
                error={errors.confirmPassword}
                isValid={validation.confirmPassword}
                showValidationIcon={true}
                leftIcon="lock-outline"
              />

              {/* Terms and Conditions Checkbox */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    {
                      backgroundColor: acceptedTerms ? theme.colors.primary : 'transparent',
                      borderColor: acceptedTerms ? theme.colors.primary : theme.colors.border,
                    }
                  ]}>
                    {acceptedTerms && (
                      <Icon name="check" size={16} color="white" />
                    )}
                  </View>
                  <View style={styles.termsTextContainer}>
                    <Text style={[styles.termsText, { color: theme.colors.text }]}>
                      {t('language') === 'vi' ? 'Tôi đồng ý với ' : 'I agree to the '}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('TermsOfService')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                        {t('language') === 'vi' ? 'Điều khoản Sử dụng' : 'Terms of Service'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.termsText, { color: theme.colors.text }]}>
                      {t('language') === 'vi' ? ' và ' : ' and '}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('PrivacyPolicy')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                        {t('language') === 'vi' ? 'Chính sách Bảo mật' : 'Privacy Policy'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                {!acceptedTerms && errors.terms && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.terms}
                  </Text>
                )}
              </View>

              <AnimatedButton
                title={isLoading ? "" : (t('language') === 'vi' ? 'Tạo Tài Khoản' : 'Create Account')}
                onPress={handleRegister}
                disabled={isLoading || !acceptedTerms}
                style={[
                  styles.registerButton,
                  {
                    backgroundColor: acceptedTerms ? theme.colors.primary : theme.colors.border,
                    shadowColor: acceptedTerms ? theme.colors.primary : 'transparent',
                    opacity: acceptedTerms ? 1 : 0.6,
                  }
                ]}
                textStyle={[
                  styles.registerButtonText,
                  { color: theme.colors.userMessageText }
                ]}
              >
                {isLoading && <LoadingSpinner size={24} color={theme.colors.userMessageText} showText={false} />}
              </AnimatedButton>
            </View>

            {/* Features Section */}
            <View style={[
              styles.featuresSection,
              {
                backgroundColor: theme.colors.primary + '08',
                borderColor: theme.colors.primary + '20',
              }
            ]}>
              <View style={styles.featuresHeader}>
                <Icon name="stars" size={20} color={theme.colors.primary} />
                <Text style={[styles.featuresTitle, { color: theme.colors.primary }]}>
                  {t('language') === 'vi' ? 'Những Gì Bạn Sẽ Có' : 'What You\'ll Get'}
                </Text>
              </View>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Icon name="chat" size={16} color={theme.colors.primary} />
                  <Text style={[styles.featureText, { color: theme.colors.primary }]}>
                    {t('language') === 'vi' ? 'Cuộc trò chuyện được hỗ trợ bởi AI' : 'AI-powered conversations'}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="smart-toy" size={16} color={theme.colors.primary} />
                  <Text style={[styles.featureText, { color: theme.colors.primary }]}>
                    {t('language') === 'vi' ? 'Nhiều AI agent để lựa chọn' : 'Multiple AI agents to choose from'}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="history" size={16} color={theme.colors.primary} />
                  <Text style={[styles.featureText, { color: theme.colors.primary }]}>
                    {t('language') === 'vi' ? 'Lịch sử trò chuyện và ngữ cảnh' : 'Chat history and context'}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="security" size={16} color={theme.colors.primary} />
                  <Text style={[styles.featureText, { color: theme.colors.primary }]}>
                    {t('language') === 'vi' ? 'Bảo mật và riêng tư cao' : 'High security and privacy'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                {t('alreadyHaveAccount')}{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
                <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                  {t('signIn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 24,
  },
  registerButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 32,
  },
}); 