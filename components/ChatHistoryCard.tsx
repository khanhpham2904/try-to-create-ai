import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../theme/ThemeContext';

interface ChatHistoryCardProps {
  chatboxId: number;
  agentName: string;
  lastMessage: string;
  timestamp: string;
  agentId: number;
  onPress: () => void;
  isActive?: boolean;
  animated?: boolean;
}

export const ChatHistoryCard: React.FC<ChatHistoryCardProps> = ({
  chatboxId,
  agentName,
  lastMessage,
  timestamp,
  agentId,
  onPress,
  isActive = false,
  animated = true,
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [animated]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else if (diffMinutes < 10080) {
      return `${Math.floor(diffMinutes / 1440)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const cardStyle = {
    backgroundColor: isActive 
      ? 'rgba(139, 92, 246, 0.12)' 
      : theme.type === 'dark' 
        ? 'rgba(255,255,255,0.08)' 
        : 'rgba(255,255,255,0.9)',
    borderWidth: isActive ? 1.5 : 0.3,
    borderColor: isActive 
      ? theme.colors.primary 
      : theme.type === 'dark' ? 'rgba(139, 92, 246, 0.02)' : 'rgba(102, 126, 234, 0.02)',
    borderRadius: theme.borderRadius.lg,
    elevation: isActive ? 12 : 8,
    shadowColor: isActive ? theme.colors.primary : (theme.type === 'dark' ? '#8B5CF6' : '#667EEA'),
    shadowOffset: { width: 0, height: isActive ? 8 : 6 },
    shadowOpacity: isActive ? 0.3 : (theme.type === 'dark' ? 0.2 : 0.12),
    shadowRadius: isActive ? 20 : (theme.type === 'dark' ? 16 : 12),
  };

  const agentIconStyles = {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: isActive 
      ? 'rgba(102,126,234,0.2)' 
      : 'rgba(102,126,234,0.1)',
  };

  const AnimatedCard = () => (
    <Animated.View
      style={[
        cardStyle,
        animated && {
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={isActive 
          ? theme.type === 'dark'
            ? ['rgba(102,126,234,0.1)', 'rgba(102,126,234,0.05)'] as [string, string, ...string[]]
            : ['rgba(102,126,234,0.15)', 'rgba(102,126,234,0.08)'] as [string, string, ...string[]]
          : theme.type === 'dark'
            ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as [string, string, ...string[]]
            : ['rgba(255,255,255,0.9)', 'rgba(247,250,252,0.8)'] as [string, string, ...string[]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.cardContent}>
          {/* Agent Icon */}
          <LinearGradient
            colors={theme.type === 'dark' 
              ? ['#8B5CF6', '#7C3AED', '#8B5CF6'] as [string, string, ...string[]]
              : ['#667EEA', '#764BA2', '#FFFFFF'] as [string, string, ...string[]]
            }
            style={agentIconStyles}
          >
            <Icon name="android" size={24} color={isActive ? 'white' : theme.colors.primary} />
          </LinearGradient>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text 
                style={[
                  styles.agentName, 
                  { 
                    color: isActive ? theme.colors.primary : theme.colors.text,
                    fontWeight: isActive ? '700' : '600',
                  }
                ]}
                numberOfLines={1}
              >
                {agentName}
              </Text>
              <View style={styles.timestampContainer}>
                <Icon name="access-time" size={12} color={theme.colors.textTertiary} />
                <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
                  {formatTimestamp(timestamp)}
                </Text>
              </View>
            </View>

            <Text 
              style={[
                styles.lastMessage,
                { 
                  color: isActive 
                    ? theme.colors.text 
                    : theme.colors.textSecondary,
                  fontWeight: isActive ? '500' : '400',
                }
              ]}
              numberOfLines={2}
            >
              {truncateMessage(lastMessage)}
            </Text>

            <View style={styles.footerRow}>
              <View style={styles.agentBadge}>
                <Icon name="person" size={14} color={theme.colors.success} />
                <Text style={[styles.agentId, { color: theme.colors.success }]}>
                  Agent #{agentId}
                </Text>
              </View>
              
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: theme.colors.success }]}>
                  <Icon name="fiber-manual-record" size={8} color="white" />
                </View>
              )}
            </View>
          </View>

          {/* Arrow Icon */}
          <View style={styles.arrowContainer}>
            <Icon 
              name="chevron-right" 
              size={20} 
              color={isActive ? theme.colors.primary : theme.colors.textTertiary} 
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.touchableContainer}>
      <AnimatedCard />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchableContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  gradientContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 80,
  },
  agentIconStyles: {},
  contentContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  agentName: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 4,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(72,187,120,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  agentId: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
