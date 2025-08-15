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
} from 'react-native';
import { AuthContext } from './AuthContext';
import { AnimatedButton, AnimatedLogo } from './AnimatedComponents';
import { LoadingSpinner } from './LoadingSpinner';
import { FormInput } from './FormInput';
import { useTheme } from '../theme/ThemeContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [validation, setValidation] = React.useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  
  const { login, isLoading } = React.useContext(AuthContext);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { validateLogin, validateEmail, validateRequired } = useFormValidation();
  
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
          email: email.length > 0 && validateEmail(email),
          password: password.length > 0 && validateRequired(password),
        };
        setValidation(newValidation);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [email, password, validateEmail, validateRequired]);

  const validateLoginForm = (): boolean => {
    const validation = validateLogin(email, password);
    
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {};
      validation.errors.forEach(error => {
        if (error.includes('Email')) newErrors.email = error;
        else if (error.includes('Password')) newErrors.password = error;
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleLogin = async () => {
    // Clear previous errors
    setErrors({});
    
    // Validate form
    if (!validateLoginForm()) {
      return;
    }

    // Attempt login
    const result = await login(email, password);
    
    if (!result.success) {
      // Show specific error message
      if (result.error?.includes('Invalid credentials') || result.error?.includes('Incorrect email or password')) {
        setErrors({ 
          general: t('language') === 'vi' ? 'Email hoặc mật khẩu không đúng. Vui lòng thử lại hoặc sử dụng thông tin demo bên dưới.' : 'Invalid email or password. Please try again or use demo credentials below.' 
        });
      } else if (result.error?.includes('Network error') || result.error?.includes('timeout')) {
        setErrors({ 
          general: t('language') === 'vi' ? 'Kết nối thất bại. Vui lòng kiểm tra kết nối internet và thử lại.' : 'Connection failed. Please check your internet connection and try again.' 
        });
      } else {
        setErrors({ 
          general: result.error || (t('language') === 'vi' ? 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.' : 'An unexpected error occurred. Please try again.') 
        });
      }
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@example.com');
    setPassword('password123');
    setErrors({});
    
    // Small delay to show the demo credentials being filled
    setTimeout(async () => {
      const result = await login('demo@example.com', 'password123');
      if (!result.success) {
        setErrors({ 
          general: result.error || (t('language') === 'vi' ? 'Đăng nhập demo thất bại. Vui lòng thử lại.' : 'Demo login failed. Please try again.') 
        });
      }
    }, 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <AnimatedLogo size={60} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('language') === 'vi' ? 'Chào Mừng Trở Lại' : 'Welcome Back'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t('language') === 'vi' ? 'Đăng nhập để tiếp tục cuộc trò chuyện AI của bạn' : 'Sign in to continue your AI conversations'}
            </Text>
          </View>

          {/* Form Section */}
          <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.formHeader}>
              <Icon name="login" size={24} color={theme.colors.primary} />
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                {t('signIn')}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <FormInput
                label={t('email')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  if (errors.general) setErrors(prev => ({ ...prev, general: '' }));
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
                  if (errors.general) setErrors(prev => ({ ...prev, general: '' }));
                }}
                placeholder={t('language') === 'vi' ? 'Nhập mật khẩu của bạn' : 'Enter your password'}
                secureTextEntry
                autoComplete="password"
                editable={!isLoading}
                error={errors.password}
                isValid={validation.password}
                showValidationIcon={true}
                leftIcon="lock"
              />

              {errors.general && (
                <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error + '30' }]}>
                  <Icon name="error" size={20} color={theme.colors.error} />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.general}
                  </Text>
                </View>
              )}

              <AnimatedButton
                title={isLoading ? "" : t('signIn')}
                onPress={handleLogin}
                disabled={isLoading}
                style={[
                  styles.loginButton,
                  {
                    backgroundColor: theme.colors.primary,
                    shadowColor: theme.colors.primary,
                  }
                ]}
                textStyle={[
                  styles.loginButtonText,
                  { color: theme.colors.userMessageText }
                ]}
              >
                {isLoading && <LoadingSpinner size={24} color={theme.colors.userMessageText} showText={false} />}
              </AnimatedButton>
            </View>

            {/* Demo Section */}
            <View style={[
              styles.demoSection,
              {
                backgroundColor: theme.colors.primary + '08',
                borderColor: theme.colors.primary + '20',
              }
            ]}>
              <View style={styles.demoHeader}>
                <Icon name="star" size={20} color={theme.colors.primary} />
                <Text style={[styles.demoTitle, { color: theme.colors.primary }]}>
                  {t('language') === 'vi' ? 'Thử Tài Khoản Demo' : 'Try Demo Account'}
                </Text>
              </View>
              <View style={styles.demoCredentials}>
                <View style={styles.credentialItem}>
                  <Icon name="email" size={16} color={theme.colors.primary} />
                  <Text style={[styles.credentialText, { color: theme.colors.primary }]}>
                    demo@example.com
                  </Text>
                </View>
                <View style={styles.credentialItem}>
                  <Icon name="lock" size={16} color={theme.colors.primary} />
                  <Text style={[styles.credentialText, { color: theme.colors.primary }]}>
                    password123
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.demoButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleDemoLogin}
                disabled={isLoading}
              >
                <Icon name="play-arrow" size={20} color={theme.colors.userMessageText} />
                <Text style={[styles.demoButtonText, { color: theme.colors.userMessageText }]}>
                  {t('language') === 'vi' ? 'Đăng Nhập Demo Nhanh' : 'Quick Demo Login'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                {t('dontHaveAccount')}{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
                <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                  {t('language') === 'vi' ? 'Tạo Tài Khoản' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  loginButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  demoSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  demoCredentials: {
    marginBottom: 16,
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  credentialText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
}); 