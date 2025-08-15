import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface TutorialOverlayProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  visible,
  onComplete,
  onSkip,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const slideAnim = useSharedValue(50);

  // Handle back button on Android
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        handleSkip();
        return true; // Prevent default back behavior
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible]);

  React.useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { 
        damping: Platform.OS === 'android' ? 20 : 15, 
        stiffness: Platform.OS === 'android' ? 250 : 300 
      });
      slideAnim.value = withSpring(0, { 
        damping: Platform.OS === 'android' ? 20 : 15, 
        stiffness: Platform.OS === 'android' ? 250 : 300 
      });
    } else {
      fadeAnim.value = withTiming(0, { duration: 300 });
      scaleAnim.value = withTiming(0.8, { duration: 300 });
      slideAnim.value = withTiming(50, { duration: 300 });
    }
  }, [visible]);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 1,
      title: t('tutorialStep1'),
      description: 'Tap the chat button to start a new conversation with AI',
      icon: '💬',
    },
    {
      id: 2,
      title: t('tutorialStep2'),
      description: 'Type your questions or requests in the input field at the bottom',
      icon: '⌨️',
    },
    {
      id: 3,
      title: t('tutorialStep3'),
      description: 'Browse your previous conversations in the Chats tab',
      icon: '📚',
    },
    {
      id: 4,
      title: t('tutorialStep4'),
      description: 'Customize your experience with themes and language in Settings',
      icon: '⚙️',
    },
  ];

  const handleNext = () => {
    try {
      if (currentStep < tutorialSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Error in tutorial navigation:', error);
      onComplete(); // Fallback to complete
    }
  };

  const handleSkip = () => {
    try {
      Alert.alert(
        'Skip Tutorial',
        'Are you sure you want to skip the tutorial?',
        [
          {
            text: 'Continue Tutorial',
            style: 'cancel',
          },
          {
            text: 'Skip',
            style: 'destructive',
            onPress: onSkip,
          },
        ]
      );
    } catch (error) {
      console.error('Error skipping tutorial:', error);
      onComplete(); // Fallback to complete
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [
        { scale: scaleAnim.value },
        { translateY: slideAnim.value },
      ],
    };
  });

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {tutorialSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              {
                backgroundColor: index === currentStep 
                  ? theme.colors.primary 
                  : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const currentStepData = tutorialSteps[currentStep] || tutorialSteps[0];

  // Safety check to prevent crashes
  if (!currentStepData) {
    console.error('No tutorial step data available');
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      hardwareAccelerated={Platform.OS === 'android'}
      onRequestClose={handleSkip}
    >
      <StatusBar 
        backgroundColor="rgba(0, 0, 0, 0.7)" 
        barStyle="light-content" 
      />
      
      {/* Backdrop with touch handling */}
      <TouchableOpacity
        style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}
        activeOpacity={1}
        onPress={handleSkip}
      >
        {/* Tutorial content */}
        <TouchableOpacity
          style={styles.contentContainer}
          activeOpacity={1}
          onPress={() => {}} // Prevent backdrop touch
        >
          <Animated.View style={[styles.container, animatedStyle]}>
            <View style={[
              styles.content, 
              { 
                backgroundColor: theme.colors.surface,
                // Android-specific shadow
                ...(Platform.OS === 'android' ? {
                  elevation: 8,
                  shadowColor: '#000',
                } : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                })
              }
            ]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {t('tutorialTitle')}
                </Text>
                <TouchableOpacity 
                  onPress={handleSkip} 
                  style={styles.skipButton}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
                    {t('skip')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Step Content */}
              <View style={styles.stepContent}>
                <View style={[
                  styles.iconContainer, 
                  { 
                    backgroundColor: theme.colors.primaryLight,
                    // Android-specific shadow
                    ...(Platform.OS === 'android' ? {
                      elevation: 4,
                      shadowColor: theme.colors.primary,
                    } : {
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                    })
                  }
                ]}>
                  <Text style={styles.stepIcon}>{currentStepData.icon}</Text>
                </View>
                
                <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
                  {currentStepData.title}
                </Text>
                
                <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
                  {currentStepData.description}
                </Text>
              </View>

              {/* Step Indicator */}
              {renderStepIndicator()}

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.nextButton, 
                    { 
                      backgroundColor: theme.colors.primary,
                      // Android-specific shadow
                      ...(Platform.OS === 'android' ? {
                        elevation: 4,
                        shadowColor: theme.colors.primary,
                      } : {
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      })
                    }
                  ]}
                  onPress={handleNext}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.nextButtonText, { color: theme.colors.userMessageText }]}>
                    {currentStep === tutorialSteps.length - 1 ? t('getStarted') : t('next')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    width: Math.min(width * 0.9, 400),
    maxWidth: 400,
  },
  content: {
    borderRadius: 24,
    padding: 24,
    // Remove shadow from base styles, handled per platform
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  skipButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  stepContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // Remove shadow from base styles, handled per platform
  },
  stepIcon: {
    fontSize: 40,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actions: {
    alignItems: 'center',
  },
  nextButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 120,
    alignItems: 'center',
    // Remove shadow from base styles, handled per platform
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 