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
import { Agent, apiService } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AgentCustomizer from './AgentCustomizer';

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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (visible) {
      loadAgents();
    }
  }, [visible]);

  const loadAgents = async () => {
    setLoading(true);
    setIsOffline(false);
    try {
      const response = await apiService.getAgents(userId);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAgents();
    setRefreshing(false);
  }, []);

  const handleAgentSelect = (agent: Agent) => {
    onAgentSelect(agent);
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
    setEditingAgent(agent);
    setShowCustomizer(true);
  };

  const handleAgentCreated = (newAgent: Agent) => {
    setAgents(prev => [...prev, newAgent]);
    onAgentSelect(newAgent);
  };

  const handleAgentUpdated = (updatedAgent: Agent) => {
    setAgents(prev => prev.map(agent => 
      agent.id === updatedAgent.id ? updatedAgent : agent
    ));
    if (selectedAgent?.id === updatedAgent.id) {
      onAgentSelect(updatedAgent);
    }
  };

  const getAgentIcon = (agentName: string) => {
    if (agentName.includes('Alex')) return 'favorite';
    if (agentName.includes('Dr. Sarah')) return 'school';
    if (agentName.includes('Max')) return 'lightbulb';
    if (agentName.includes('Emma')) return 'psychology';
    return 'smart-toy';
  };

  const getAgentColor = (agentName: string) => {
    if (agentName.includes('Alex')) return '#FF6B6B';
    if (agentName.includes('Dr. Sarah')) return '#4ECDC4';
    if (agentName.includes('Max')) return '#45B7D1';
    if (agentName.includes('Emma')) return '#96CEB4';
    return theme.colors.primary;
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
      flex: 1,
      marginLeft: 12,
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
      width: 32,
      height: 32,
      borderRadius: 16,
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
    closeButton: {
      backgroundColor: theme.colors.error,
      borderWidth: 1,
      borderColor: theme.colors.error,
      elevation: 3,
      shadowColor: theme.colors.error + '30',
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
  });

  const renderItem = ({ item }: { item: Agent }) => {
    const isSelected = selectedAgent?.id === item.id;
    const agentColor = getAgentColor(item.name);
    const agentIcon = getAgentIcon(item.name);

    return (
      <Pressable
        style={[styles.agentCard, isSelected && styles.selectedAgentCard]}
        onPress={() => handleAgentSelect(item)}
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
              {item.name.includes('Alex') ? 'Friendly' :
               item.name.includes('Dr. Sarah') ? 'Expert' :
               item.name.includes('Max') ? 'Creative' :
               item.name.includes('Emma') ? 'Teacher' : 'AI Assistant'}
            </Text>
          </View>
          
          {/* Edit Button - moved inside header */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditAgent(item)}
          >
            <Icon name="edit" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
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
            <Text style={styles.featureText}>Reliable</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar 
        backgroundColor={theme.colors.surface}
        barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'}
        translucent={false}
        animated={true}
      />
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {Platform.OS === 'android' && <View style={styles.dragIndicator} />}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Icon name="smart-toy" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Choose Your AI Assistant</Text>
                <Text style={styles.subtitle}>Select the perfect AI for your needs</Text>
              </View>
            </View>
          </View>

          <FlatList
            data={loading ? [] : agents}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={!loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Icon name="smart-toy" size={36} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>No AI assistants available</Text>
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
            <View style={styles.footerActions}>
              <TouchableOpacity style={[styles.headerActionBtn, styles.createButton]} onPress={handleCreateCustomAgent}>
                <Icon name="add" size={20} color={theme.colors.surface} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerActionBtn, styles.reloadButton]} onPress={onRefresh}>
                <Icon name="refresh" size={20} color={theme.colors.surface} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.headerActionBtn, styles.closeButton]} onPress={onClose}>
              <Icon name="close" size={20} color={theme.colors.surface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearSelection} disabled={!selectedAgent}>
              <Text style={styles.clearButtonText}>{selectedAgent ? 'Clear Selection' : 'No Assistant Selected'}</Text>
            </TouchableOpacity>
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
    </Modal>
  );
};

export default AgentSelector;
