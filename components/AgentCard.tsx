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
import { useTheme } from '../theme/ThemeContext';

interface AgentCardProps {
  agent: {
    id: number;
    name: string;
    description: string;
    avatar_url?: string;
    personality?: string;
    skills?: string[];
    is_online?: boolean;
  };
  onPress: () => void;
  isSelected?: boolean;
  animated?: boolean;
  compact?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onPress,
  isSelected = false,
  animated = true,
  compact = false,
}) => {
  const { theme } = useTheme();
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Initial entrance animation
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 300,
        delay: agent.id * 100, // Staggered animation
        useNativeDriver: true,
      }).start();
    } else {
      cardAnim.setValue(1);
    }
  }, [animated, agent.id]);

  const getAgentIcon = (agentName: string) => {
    const name = agent.name.toLowerCase();
    if (name.includes('assistant') || name.includes('helper')) return 'support-agent';
    if (name.includes('creative') || name.includes('art')) return 'palette';
    if (name.includes('tech') || name.includes('developer')) return 'code';
    if (name.includes('doctor') || name.includes('health')) return 'medical-services';
    if (name.includes('teacher') || name.includes('tutor')) return 'school';
    if (name.includes('business') || name.includes('manage')) return 'business-center';
    if (name.includes('fun') || name.includes('game')) return 'sports-esports';
    return 'android';
  };

  const getAgentColors = () => {
    const colors = [
      ['#667EEA', '#764BA2'], ['#F77D5A', '#F56565'], ['#48BB78', '#68D391'],
      ['#4299E1', '#63B3ED'], ['#ED8936', '#F6AD55'], ['#9F7AEA', '#B794F6'],
      ['#38B2AC', '#4FD1C5'], ['#F56565', '#FC8181']
    ];
    return colors[agent.id % colors.length] as [string, string, ...string[]];
  };

  const cardStyle = {
    backgroundColor: isSelected 
      ? 'rgba(139, 92, 246, 0.12)' 
      : theme.type === 'dark' 
        ? 'rgba(255,255,255,0.08)' 
        : 'rgba(255,255,255,0.9)',
    borderWidth: isSelected ? 1.5 : 0.3,
    borderColor: isSelected 
      ? theme.colors.primary 
      : theme.type === 'dark' ? 'rgba(139, 92, 246, 0.02)' : 'rgba(102, 126, 234, 0.02)',
    borderRadius: theme.borderRadius.lg,
    elevation: isSelected ? 12 : 8,
    shadowColor: isSelected ? theme.colors.primary : (theme.type === 'dark' ? '#8B5CF6' : '#667EEA'),
    shadowOffset: { width: 0, height: isSelected ? 8 : 6 },
    shadowOpacity: isSelected ? 0.3 : (theme.type === 'dark' ? 0.2 : 0.12),
    shadowRadius: isSelected ? 20 : (theme.type === 'dark' ? 16 : 12),
    marginHorizontal: compact ? 8 : 16,
    marginVertical: compact ? 4 : 8,
  };

  const AnimatedCard = () => (
    <Animated.View
      style={[
        cardStyle,
        animated && {
          transform: [
            { 
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
            { scale: 1 },
          ],
          opacity: cardAnim,
        },
      ]}
    >
      <LinearGradient
        colors={theme.type === 'dark' 
          ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as [string, string, ...string[]]
          : ['rgba(255,255,255,0.9)', 'rgba(247,250,252,0.8)'] as [string, string, ...string[]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={compact ? styles.compactGradient : styles.gradientContainer}
      >
        <View style={compact ? styles.compactContent : styles.cardContent}>
          {/* Agent Avatar with Gradient Background */}
          <LinearGradient
            colors={getAgentColors()}
            style={[
              compact ? styles.compactAvatar : styles.agentAvatar,
              { 
                borderWidth: agent.is_online ? 3 : 1,
                borderColor: agent.is_online ? theme.colors.success : theme.colors.border,
              }
            ]}
          >
            <Icon 
              name={getAgentIcon(agent.name)} 
              size={compact ? 20 : 28} 
              color="white" 
            />
            {agent.is_online && (
              <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.success }]} />
            )}
          </LinearGradient>

          {/* Agent Info */}
          <View style={compact ? styles.compactInfo : styles.agentInfo}>
            <View style={styles.nameRow}>
              <Text 
                style={[
                  compact ? styles.compactName : styles.agentName,
                  { 
                    color: isSelected ? theme.colors.primary : theme.colors.text,
                    fontWeight: isSelected ? '700' : '600',
                  }
                ]}
                numberOfLines={compact ? 1 : 2}
              >
                {agent.name}
              </Text>
              {isSelected && (
                <Icon name="check-circle" size={compact ? 16 : 20} color={theme.colors.success} />
              )}
            </View>

            {!compact && (
              <Text 
                style={[styles.agentDescription, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {agent.description}
              </Text>
            )}

            {/* Agent Skills/Tags */}
            {!compact && agent.skills && agent.skills.length > 0 && (
              <View style={styles.skillsContainer}>
                {agent.skills.slice(0, 3).map((skill, index) => (
                  <View key={index} style={[styles.skillTag, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Text style={[styles.skillText, { color: theme.colors.primary }]}>
                      {skill}
                    </Text>
                  </View>
                ))}
                {agent.skills.length > 3 && (
                  <View style={[styles.skillTag, { backgroundColor: theme.colors.textTertiary + '20' }]}>
                    <Text style={[styles.skillText, { color: theme.colors.textTertiary }]}>
                      +{agent.skills.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Status Row */}
            <View style={styles.statusRow}>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: agent.is_online ? theme.colors.success + '20' : theme.colors.textTertiary + '20' }
              ]}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: agent.is_online ? theme.colors.success : theme.colors.textTertiary }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: agent.is_online ? theme.colors.success : theme.colors.textTertiary }
                ]}>
                  {agent.is_online ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Arrow */}
          {!compact && (
            <View style={styles.actionContainer}>
              <Icon 
                name="chevron-right" 
                size={20} 
                color={isSelected ? theme.colors.primary : theme.colors.textTertiary} 
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <AnimatedCard />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  compactGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    minHeight: 120,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 60,
  },
  agentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  agentInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  agentDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
