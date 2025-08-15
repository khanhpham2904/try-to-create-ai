import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageType = 'en' | 'vi';

export interface Translations {
  // Auth
  signIn: string;
  signUp: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  forgotPassword: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  
  // Chat
  newChat: string;
  conversations: string;
  aiChatHistory: string;
  askMeAnything: string;
  send: string;
  aiIsTyping: string;
  welcomeMessage: string;
  welcomeSubtitle: string;
  
  // Navigation
  home: string;
  chats: string;
  settings: string;
  
  // Settings
  theme: string;
  language: string;
  lightMode: string;
  darkMode: string;
  autoMode: string;
  english: string;
  vietnamese: string;
  conversationHistory: string;
  aiPreferences: string;
  privacySettings: string;
  knowledgeBase: string;
  helpSupport: string;
  logout: string;
  loggedInAs: string;
  
  // Features
  whatICanHelp: string;
  answerQuestions: string;
  helpProgramming: string;
  assistWriting: string;
  researchInfo: string;
  brainstormIdeas: string;
  analyzeData: string;
  
  // Tutorial
  tutorialTitle: string;
  tutorialStep1: string;
  tutorialStep2: string;
  tutorialStep3: string;
  tutorialStep4: string;
  getStarted: string;
  skip: string;
  next: string;
  
  // Common
  loading: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
  save: string;
  delete: string;
  edit: string;
  close: string;
}

const translations: Record<LanguageType, Translations> = {
  en: {
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    forgotPassword: 'Forgot Password?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    
    // Chat
    newChat: 'New Chat',
    conversations: 'Conversations',
    aiChatHistory: 'Your AI chat history',
    askMeAnything: 'Ask me anything...',
    send: 'Send',
    aiIsTyping: 'AI is typing',
    welcomeMessage: "👋 Hello! I'm your AI assistant. How can I help you today?",
    welcomeSubtitle: 'Ask me anything - I can help with questions, coding, writing, research, and much more!',
    
    // Navigation
    home: 'Home',
    chats: 'Chats',
    settings: 'Settings',
    
    // Settings
    theme: 'Theme',
    language: 'Language',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    autoMode: 'Auto Mode',
    english: 'English',
    vietnamese: 'Vietnamese',
    conversationHistory: 'Conversation History',
    aiPreferences: 'AI Preferences',
    privacySettings: 'Privacy Settings',
    knowledgeBase: 'Knowledge Base',
    helpSupport: 'Help & Support',
    logout: 'Logout',
    loggedInAs: 'Logged in as:',
    
    // Features
    whatICanHelp: 'What I can help you with:',
    answerQuestions: 'Answer questions and solve problems',
    helpProgramming: 'Help with programming and coding',
    assistWriting: 'Assist with writing and creative projects',
    researchInfo: 'Research and provide information',
    brainstormIdeas: 'Brainstorm ideas and solutions',
    analyzeData: 'Analyze data and create reports',
    
    // Tutorial
    tutorialTitle: 'Welcome to AI Chat Assistant!',
    tutorialStep1: 'Start a new conversation by tapping the chat button',
    tutorialStep2: 'Type your questions or requests in the input field',
    tutorialStep3: 'Browse your previous conversations in the Chats tab',
    tutorialStep4: 'Customize your experience in Settings',
    getStarted: 'Get Started',
    skip: 'Skip',
    next: 'Next',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
  },
  vi: {
    // Auth
    signIn: 'Đăng Nhập',
    signUp: 'Đăng Ký',
    email: 'Địa Chỉ Email',
    password: 'Mật Khẩu',
    confirmPassword: 'Xác Nhận Mật Khẩu',
    fullName: 'Họ Và Tên',
    forgotPassword: 'Quên mật khẩu?',
    dontHaveAccount: 'Chưa có tài khoản?',
    alreadyHaveAccount: 'Đã có tài khoản?',
    
    // Chat
    newChat: 'Cuộc Trò Chuyện Mới',
    conversations: 'Cuộc Trò Chuyện',
    aiChatHistory: 'Lịch sử trò chuyện AI của bạn',
    askMeAnything: 'Hỏi tôi bất cứ điều gì...',
    send: 'Gửi',
    aiIsTyping: 'AI đang nhập',
    welcomeMessage: '👋 Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp gì cho bạn hôm nay?',
    welcomeSubtitle: 'Hỏi tôi bất cứ điều gì - Tôi có thể giúp với câu hỏi, lập trình, viết, nghiên cứu và nhiều hơn nữa!',
    
    // Navigation
    home: 'Trang Chủ',
    chats: 'Trò Chuyện',
    settings: 'Cài Đặt',
    
    // Settings
    theme: 'Giao Diện',
    language: 'Ngôn Ngữ',
    lightMode: 'Chế Độ Sáng',
    darkMode: 'Chế Độ Tối',
    autoMode: 'Tự Động',
    english: 'Tiếng Anh',
    vietnamese: 'Tiếng Việt',
    conversationHistory: 'Lịch Sử Trò Chuyện',
    aiPreferences: 'Tùy Chọn AI',
    privacySettings: 'Cài Đặt Riêng Tư',
    knowledgeBase: 'Cơ Sở Kiến Thức',
    helpSupport: 'Trợ Giúp & Hỗ Trợ',
    logout: 'Đăng Xuất',
    loggedInAs: 'Đăng nhập với tư cách:',
    
    // Features
    whatICanHelp: 'Tôi có thể giúp bạn với:',
    answerQuestions: 'Trả lời câu hỏi và giải quyết vấn đề',
    helpProgramming: 'Giúp với lập trình và mã hóa',
    assistWriting: 'Hỗ trợ viết và dự án sáng tạo',
    researchInfo: 'Nghiên cứu và cung cấp thông tin',
    brainstormIdeas: 'Động não ý tưởng và giải pháp',
    analyzeData: 'Phân tích dữ liệu và tạo báo cáo',
    
    // Tutorial
    tutorialTitle: 'Chào mừng đến với Trợ Lý AI Chat!',
    tutorialStep1: 'Bắt đầu cuộc trò chuyện mới bằng cách nhấn nút chat',
    tutorialStep2: 'Nhập câu hỏi hoặc yêu cầu của bạn vào ô nhập liệu',
    tutorialStep3: 'Duyệt các cuộc trò chuyện trước đó trong tab Chats',
    tutorialStep4: 'Tùy chỉnh trải nghiệm trong Cài đặt',
    getStarted: 'Bắt Đầu',
    skip: 'Bỏ Qua',
    next: 'Tiếp Theo',
    
    // Common
    loading: 'Đang tải...',
    error: 'Lỗi',
    success: 'Thành công',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    save: 'Lưu',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    close: 'Đóng',
  },
};

interface LanguageContextType {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageType>('en');

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  useEffect(() => {
    saveLanguagePreference();
  }, [language]);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
        setLanguage(savedLanguage as LanguageType);
      }
    } catch (error) {
      console.log('Error loading language preference:', error);
    }
  };

  const saveLanguagePreference = async () => {
    try {
      await AsyncStorage.setItem('language', language);
    } catch (error) {
      console.log('Error saving language preference:', error);
    }
  };

  const t = (key: keyof Translations): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 