import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  FlatList,
  RefreshControl,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAgent } from './AgentContext';
import { Agent, apiService, ChatMessageWithAgent } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AgentCustomizer from './AgentCustomizer';
import NewbieGuideModal from './NewbieGuideModal';

interface AgentSelectorProps {
  selectedAgent: Agent | null;
  onAgentSelect: (agent: Agent | null) => void;
  visible: boolean;
  onClose: () => void;
  userId?: number; // Add userId prop
}

const { height } = Dimensions.get('window');

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 1,
    name: 'Alex - The Friendly Helper',
    personality: 'Warm, encouraging, and always positive',
    feedback_style: 'Constructive and encouraging feedback',
    system_prompt: 'You are Alex, a friendly and supportive AI assistant.',
    is_active: true,
    user_id: 0, // Default agents have user_id = 0
    created_at: new Date().toISOString(),
    updated_at: undefined,
  },
  {
    id: 2,
    name: 'Dr. Sarah - The Professional Expert',
    personality: 'Knowledgeable, precise, and professional',
    feedback_style: 'Detailed analysis with specific recommendations',
    system_prompt: 'You are Dr. Sarah, a professional expert AI assistant.',
    is_active: true,
    user_id: 0, // Default agents have user_id = 0
    created_at: new Date().toISOString(),
    updated_at: undefined,
  },
  {
    id: 3,
    name: 'Max - The Creative Thinker',
    personality: 'Inventive, playful, and out-of-the-box',
    feedback_style: 'Inspiring suggestions and new angles',
    system_prompt: 'You are Max, a creative AI that ideates and explores.',
    is_active: true,
    user_id: 0, // Default agents have user_id = 0
    created_at: new Date().toISOString(),
    updated_at: undefined,
  },
  {
    id: 4,
    name: 'Emma - The Patient Teacher',
    personality: 'Clear, patient, and supportive',
    feedback_style: 'Step-by-step guidance with examples',
    system_prompt: 'You are Emma, a teacher who explains concepts simply.',
    is_active: true,
    user_id: 0, // Default agents have user_id = 0
    created_at: new Date().toISOString(),
    updated_at: undefined,
  },
];

const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onAgentSelect,
  visible,
  onClose,
  userId,
}) => {
  const { theme } = useTheme();
  const { selectedAgent: contextSelectedAgent, setSelectedAgent: setContextSelectedAgent } = useAgent();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessageWithAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showNewbieGuide, setShowNewbieGuide] = useState(false);

  useEffect(() => {
    if (visible) {
      loadAgents();
      loadChatHistory();
    }
  }, [visible]);

  const loadAgents = async () => {
    setLoading(true);
    setIsOffline(false);
    try {
      const response = await apiService.getUnchattedAgents(userId!);
      if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
        setAgents(response.data);
      } else {
        setIsOffline(true);
        setAgents(DEFAULT_AGENTS);
      }
    } catch (error) {
      setIsOffline(true);
      setAgents(DEFAULT_AGENTS);
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    if (!userId) return;

    try {
      const response = await apiService.getUserMessages(userId, 0, 100);
      if (response.data?.messages) {
        setChatHistory(response.data.messages as ChatMessageWithAgent[]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAgents(), loadChatHistory()]);
    setRefreshing(false);
  }, []);

  const handleAgentSelect = (agent: Agent) => {
    onAgentSelect(agent);
    setContextSelectedAgent(agent);
    onClose();
  };

  const handleClearSelection = () => {
    onAgentSelect(null);
    onClose();
  };

  const handleCreateCustomAgent = () => {
    setEditingAgent(null);
    setShowCustomizer(true);
  };

  const handleEditAgent = (agent: Agent) => {
    // Check if this is a default agent (user_id = 0 or null) or user's own agent
    const isDefaultAgent = !agent.user_id || agent.user_id === 0;
    const isUserOwnAgent = agent.user_id === userId;
    const hasUserChattedWithAgent = chatHistory.some(msg => msg.agent_id === agent.id);
    
    console.log('Edit Agent Debug:', {
      agentId: agent.id,
      agentName: agent.name,
      agentUserId: agent.user_id,
      currentUserId: userId,
      isDefaultAgent,
      isUserOwnAgent,
      hasUserChattedWithAgent,
      chatHistoryLength: chatHistory.length
    });
    
    // Allow editing if:
    // 1. It's a custom agent owned by the user OR
    // 2. It's a default agent that the user has chatted with
    if (isDefaultAgent && !hasUserChattedWithAgent) {
      Alert.alert(
        'Cannot Edit Default Agent',
        'You can only edit default agents after chatting with them. Try having a conversation first!',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!isUserOwnAgent && !hasUserChattedWithAgent) {
      Alert.alert(
        'Cannot Edit Agent',
        'You can only edit agents you own or have chatted with.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setEditingAgent(agent);
    setShowCustomizer(true);
  };

  const handleDeleteAgent = (agent: Agent) => {
    // Check if this is a default agent (user_id = 0 or null) or user's own agent
    const isDefaultAgent = !agent.user_id || agent.user_id === 0;
    const isUserOwnAgent = agent.user_id === userId;
    const hasUserChattedWithAgent = chatHistory.some(msg => msg.agent_id === agent.id);
    
    // Only allow deletion of custom agents owned by the user
    // Default agents cannot be deleted even if chatted with
    if (isDefaultAgent) {
      Alert.alert(
        'Cannot Delete Default Agent',
        'Default agents cannot be deleted, even if you have chatted with them.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!isUserOwnAgent) {
      Alert.alert(
        'Cannot Delete Agent',
        'You can only delete your own custom agents.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Delete Agent',
      `Are you sure you want to delete "${agent.name}"?\n\nThis will permanently delete the agent and all related messages. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteAgent(agent.id, userId!);
              if (response.status === 200 && response.data) {
                // Remove agent from list
                setAgents(prev => prev.filter(a => a.id !== agent.id));
                // If this was the selected agent, clear selection
                if (selectedAgent?.id === agent.id) {
                  onAgentSelect(null);
                  setContextSelectedAgent(null);
                }
                Alert.alert(
                  'Success',
                  `${response.data.message}\n\nAgent "${response.data.agent_name}" and ${response.data.messages_deleted} messages have been deleted.`
                );
                // Reload agents to get updated list
                loadAgents();
              } else if (response.status === 403) {
                Alert.alert('Error', response.error || 'You do not have permission to delete this agent.');
              } else if (response.status === 404) {
                Alert.alert('Error', 'Agent not found.');
              } else {
                Alert.alert('Error', response.error || 'Failed to delete agent. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting agent:', error);
              Alert.alert('Error', 'Failed to delete agent. Please check your connection and try again.');
            }
          }
        }
      ]
    );
  };



  const handleAgentUpdated = (updatedAgent: Agent) => {
    setAgents(prev => prev.map(agent => 
      agent.id === updatedAgent.id ? updatedAgent : agent
    ));
    if (selectedAgent?.id === updatedAgent.id) {
      onAgentSelect(updatedAgent);
      setContextSelectedAgent(updatedAgent);
    }
  };

  const handleAgentCreated = (newAgent: Agent) => {
    // Add the new agent to the list
    setAgents(prev => [...prev, newAgent]);
    
    // If this was created from editing a default agent, select the new agent
    if (editingAgent && (!editingAgent.user_id || editingAgent.user_id === 0)) {
      onAgentSelect(newAgent);
      setContextSelectedAgent(newAgent);
    }
  };

  const getUnchattedAgents = () => {
    // Get agent IDs that user has chatted with
    const chattedAgentIds = new Set(
      chatHistory
        .filter(msg => msg.agent_id)
        .map(msg => msg.agent_id)
    );
    
    // Filter out agents that user has already chatted with
    return agents.filter(agent => !chattedAgentIds.has(agent.id));
  };

  const getAgentIcon = (agentName: string) => {
    if (agentName.includes('Alex')) return 'favorite';
    if (agentName.includes('Dr. Sarah')) return 'school';
    if (agentName.includes('Max')) return 'lightbulb';
    if (agentName.includes('Emma')) return 'psychology';
    return 'smart-toy';
  };

  const getAgentColor = (agentName: string) => {
    if (agentName.includes('Alex')) return theme.colors.error; // Red for friendly
    if (agentName.includes('Dr. Sarah')) return theme.colors.info; // Blue for professional
    if (agentName.includes('Max')) return theme.colors.warning; // Orange for creative
    if (agentName.includes('Emma')) return theme.colors.success; // Green for teacher
    return theme.colors.primary;
  };

  const isAgentEditable = (agent: Agent) => {
    // Agent is editable if:
    // 1. It's a custom agent (user_id = actual user ID) OR
    // 2. It's a default agent that the user has chatted with
    const isDefaultAgent = !agent.user_id || agent.user_id === 0;
    const isUserOwnAgent = agent.user_id === userId;
    const hasUserChattedWithAgent = chatHistory.some(msg => msg.agent_id === agent.id);
    
    const isEditable = isUserOwnAgent || (isDefaultAgent && hasUserChattedWithAgent);
    
    console.log('isAgentEditable Debug:', {
      agentId: agent.id,
      agentName: agent.name,
      agentUserId: agent.user_id,
      currentUserId: userId,
      isDefaultAgent,
      isUserOwnAgent,
      hasUserChattedWithAgent,
      isEditable
    });
    
    return isEditable;
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingBottom: 0,
      margin: 0,
      flex: 1,
      width: '100%',
      elevation: 0,
    },
    dragIndicator: {
      width: 32,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '40',
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
    },
    headerLeft: { 
      flexDirection: 'row', 
      alignItems: 'center',
      flex: 1,
      marginRight: 16,
    },
    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    headerTextContainer: {
      flex: 1,
      minWidth: 0, // Allows text to shrink if needed
    },
    title: { 
      fontSize: 22, 
      fontWeight: '600', 
      color: theme.colors.text,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    subtitle: { 
      fontSize: 14, 
      color: theme.colors.textSecondary, 
      marginTop: 4,
      lineHeight: 20,
      fontWeight: '400',
    },
    headerActions: { 
      flexDirection: 'row', 
      alignItems: 'center',
      gap: 12,
      flexShrink: 0, // Prevents buttons from shrinking
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0,
    },
    headerActionBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border + '60',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    listContainer: { 
      paddingHorizontal: 20, 
      paddingVertical: 20,
      flexGrow: 1,
    },
    agentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border + '40',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
    },
    selectedAgentCard: {
      borderColor: theme.colors.primary,
      borderWidth: 1.5,
      backgroundColor: theme.colors.primary + '08',
      elevation: 0,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      transform: [{ scale: 1.02 }],
    },
    agentHeader: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 16,
      position: 'relative',
    },
    agentIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    agentInfo: {
      flex: 1,
      marginRight: 40, // Space for edit button
    },
    agentName: { 
      fontSize: 18, 
      fontWeight: '600', 
      color: theme.colors.text,
      lineHeight: 22,
      letterSpacing: -0.1,
    },
    selectedAgentName: {
      color: theme.colors.primary,
    },
    agentType: { 
      fontSize: 13, 
      color: theme.colors.textSecondary, 
      textTransform: 'uppercase',
      fontWeight: '500',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    agentDescription: { 
      fontSize: 15, 
      color: theme.colors.textSecondary, 
      lineHeight: 22,
      marginBottom: 16,
      fontWeight: '400',
    },
    featureRow: { 
      flexDirection: 'row', 
      gap: 8,
      flexWrap: 'wrap',
    },
    featureTag: {
      backgroundColor: theme.colors.border + '40',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border + '60',
    },
    featureText: { 
      fontSize: 12, 
      color: theme.colors.textSecondary, 
      fontWeight: '500',
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '40',
      backgroundColor: theme.colors.surface,
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 12,
    },
    footerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      justifyContent: 'center',
    },
    clearButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border + '60',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    clearButtonText: { 
      color: theme.colors.textSecondary, 
      fontSize: 16, 
      fontWeight: '600',
    },
    offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.warning + '15',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '40',
    },
    offlineText: { 
      color: theme.colors.textSecondary, 
      marginLeft: 12,
      fontSize: 14,
      fontWeight: '500',
    },
    editButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
      elevation: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      borderWidth: 0,
      backgroundColor: theme.colors.surface,
    },
    deleteButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
      elevation: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      borderWidth: 0,
      backgroundColor: theme.colors.surface,
    },
    deleteIndicator: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.error + '40',
    },
    createAgentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      elevation: 3,
      shadowColor: theme.colors.primary + '30',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    createAgentButtonText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: '600',
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      elevation: 3,
      shadowColor: theme.colors.primary + '30',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    reloadButton: {
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      elevation: 3,
      shadowColor: theme.colors.primary + '30',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    selectionIndicator: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      elevation: 3,
      shadowColor: theme.colors.primary + '30',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  const renderItem = ({ item }: { item: Agent }) => {
    const isSelected = selectedAgent?.id === item.id;
    const agentColor = getAgentColor(item.name);
    const agentIcon = getAgentIcon(item.name);
    const isEditable = isAgentEditable(item);
    const isDefaultAgent = !item.user_id || item.user_id === 0;
    const isUserOwnAgent = item.user_id === userId;
    const hasUserChattedWithAgent = chatHistory.some(msg => msg.agent_id === item.id);

    return (
      <Pressable
        style={[styles.agentCard, isSelected && styles.selectedAgentCard]}
        onPress={() => handleAgentSelect(item)}
        onLongPress={() => handleDeleteAgent(item)}
        android_ripple={{ color: theme.colors.primary + '12' }}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Icon name="check-circle" size={20} color={theme.colors.primary} />
          </View>
        )}

        <View style={styles.agentHeader}>
          <View style={[styles.agentIcon, { backgroundColor: agentColor + '20' }]}>
            <Icon name={agentIcon} size={24} color={agentColor} />
          </View>
          <View style={styles.agentInfo}>
            <Text style={[styles.agentName, isSelected && styles.selectedAgentName]} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.agentType} numberOfLines={1}>
              {isDefaultAgent ? (hasUserChattedWithAgent ? 'Customizable Default' : 'Default Agent') :
               item.name.includes('Alex') ? 'Friendly' :
               item.name.includes('Dr. Sarah') ? 'Expert' :
               item.name.includes('Max') ? 'Creative' :
               item.name.includes('Emma') ? 'Teacher' : 'Custom Agent'}
            </Text>
          </View>
          
          {/* Edit Button - only show for editable agents */}
          {isEditable ? (
            <TouchableOpacity
              style={[
                styles.editButton,
                { backgroundColor: theme.colors.info + '15' }
              ]}
              onPress={() => handleEditAgent(item)}
            >
              <Icon name="edit" size={20} color={theme.colors.info} />
            </TouchableOpacity>
          ) : (
            <View style={[
              styles.editButton,
              { backgroundColor: theme.colors.textTertiary + '15' }
            ]}>
              <Icon name="lock" size={20} color={theme.colors.textTertiary} />
            </View>
          )}
          
          {/* Delete Button - only show for user's own custom agents */}
          {!isDefaultAgent && isUserOwnAgent && (
            <TouchableOpacity
              style={[
                styles.deleteButton,
                { backgroundColor: theme.colors.error + '15' }
              ]}
              onPress={() => handleDeleteAgent(item)}
            >
              <Icon name="delete" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.agentDescription} numberOfLines={3}>
          {item.personality}
        </Text>

        <View style={styles.featureRow}>
          <View style={styles.featureTag}>
            <Text style={styles.featureText}>
              {item.feedback_style.split(' ')[0]}
            </Text>
          </View>
          <View style={styles.featureTag}>
            <Text style={styles.featureText}>
              {isDefaultAgent ? (hasUserChattedWithAgent ? 'Customizable' : 'Default') : 'Custom'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const unchattedAgents = getUnchattedAgents();

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <StatusBar 
        backgroundColor={theme.colors.surface}
        barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'}
        translucent={false}
        animated={false}
      />
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {Platform.OS === 'android' && <View style={styles.dragIndicator} />}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Icon name="smart-toy" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>🤖 Choose Your AI Assistant</Text>
                <Text style={styles.subtitle}>
                  {unchattedAgents.length > 0 
                    ? `${unchattedAgents.length} agents available to try` 
                    : 'All agents have been tried'
                  }
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionBtn} 
                onPress={() => setShowNewbieGuide(true)}
                activeOpacity={0.7}
              >
                <Icon name="help-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                activeOpacity={0.6}
              >
                <Icon name="close" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={loading ? [] : unchattedAgents}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={!loading ? (
              <View style={styles.emptyStateContainer}>
                <Icon 
                  name="check-circle" 
                  size={64} 
                  color={theme.colors.primary} 
                  style={styles.emptyStateIcon}
                />
                <Text style={styles.emptyStateTitle}>All Agents Tried!</Text>
                <Text style={styles.emptyStateText}>
                  You've already chatted with all available AI assistants. 
                  Create a new custom agent or wait for new ones to be added.
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Icon name="hourglass-empty" size={36} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Loading AI assistants...</Text>
              </View>
            )}
          />

          {isOffline && (
            <View style={styles.offlineBanner}>
              <Icon name="wifi-off" size={18} color={theme.colors.warning} />
              <Text style={styles.offlineText}>Offline mode: showing default assistants</Text>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.createAgentButton} onPress={handleCreateCustomAgent}>
              <Icon name="add" size={20} color="white" />
              <Text style={styles.createAgentButtonText}>Create Custom Agent</Text>
            </TouchableOpacity>
            {selectedAgent && (
              <TouchableOpacity style={styles.clearButton} onPress={handleClearSelection}>
                <Text style={styles.clearButtonText}>Clear Selection</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Agent Customizer Modal */}
      <AgentCustomizer
        visible={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        onAgentCreated={handleAgentCreated}
        onAgentUpdated={handleAgentUpdated}
        editingAgent={editingAgent}
        userId={userId}
      />

      {/* Newbie Guide Modal */}
      <NewbieGuideModal
        visible={showNewbieGuide}
        onClose={() => setShowNewbieGuide(false)}
      />
    </Modal>
  );
};

export default AgentSelector;
