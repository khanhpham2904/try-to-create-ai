import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useAuth } from './AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { AnimatedButton, AnimatedLogo, AnimatedFeatureItem } from './AnimatedComponents';
import { Card } from './Card';

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const startNewChat = () => {
    if (user) {
      navigation.navigate('Main');
    } else {
      navigation.navigate('Login');
    }
  };

  const viewChatHistory = () => {
    if (user) {
      navigation.navigate('Main');
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <ScrollView style={[styles.welcomeContainer, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeHeader}>
        <AnimatedLogo size={100} />
        <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
          Welcome to AI Chat!
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.colors.textSecondary }]}>
          Your intelligent conversation partner
        </Text>
      </View>

      <Card style={styles.actionsCard}>
        <Text style={[styles.actionsTitle, { color: theme.colors.text }]}>Get Started</Text>
        <AnimatedButton
          title="💬 Start New Chat"
          onPress={startNewChat}
          style={[
            styles.newChatButton,
            {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOpacity: 0.3,
            }
          ]}
          textStyle={[
            styles.newChatButtonText,
            { color: theme.colors.surface }
          ]}
        />

        <AnimatedButton
          title="📚 View Chat History"
          onPress={viewChatHistory}
          style={[
            styles.browseChatsButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: '#000',
              shadowOpacity: 0.05,
            }
          ]}
          textStyle={[
            styles.browseChatsButtonText,
            { color: theme.colors.primary }
          ]}
        />
      </Card>

      <Card style={styles.featuresCard}>
        <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>What I Can Help With</Text>
        <AnimatedFeatureItem icon="💡" text="Answer your questions" index={0} theme={theme} />
        <AnimatedFeatureItem icon="💻" text="Help with programming" index={1} theme={theme} />
        <AnimatedFeatureItem icon="✍️" text="Assist with writing" index={2} theme={theme} />
        <AnimatedFeatureItem icon="🔍" text="Research information" index={3} theme={theme} />
        <AnimatedFeatureItem icon="🎯" text="Brainstorm ideas" index={4} theme={theme} />
        <AnimatedFeatureItem icon="📊" text="Analyze data" index={5} theme={theme} />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  actionsCard: {
    marginBottom: 24,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  newChatButton: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  newChatButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  browseChatsButton: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  browseChatsButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  featuresCard: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
}); 