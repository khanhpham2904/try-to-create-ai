import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
  TextInput,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Agent, apiService } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AgentCustomizerProps {
  visible: boolean;
  onClose: () => void;
  onAgentCreated?: (agent: Agent) => void;
  onAgentUpdated?: (agent: Agent) => void;
  editingAgent?: Agent | null;
  userId?: number; // Add userId prop
}

const { height, width } = Dimensions.get('window');

const AgentCustomizer: React.FC<AgentCustomizerProps> = ({
  visible,
  onClose,
  onAgentCreated,
  onAgentUpdated,
  editingAgent,
  userId,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    feedback_style: '',
    system_prompt: '',
  });

  useEffect(() => {
    if (visible) {
      if (editingAgent) {
        setFormData({
          name: editingAgent.name,
          personality: editingAgent.personality,
          feedback_style: editingAgent.feedback_style,
          system_prompt: editingAgent.system_prompt,
        });
      } else {
        setFormData({
          name: '',
          personality: '',
          feedback_style: '',
          system_prompt: '',
        });
      }
    }
  }, [visible, editingAgent]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Agent name is required');
      return false;
    }
    if (!formData.personality.trim()) {
      Alert.alert('Error', 'Personality description is required');
      return false;
    }
    if (!formData.feedback_style.trim()) {
      Alert.alert('Error', 'Feedback style is required');
      return false;
    }
    if (!formData.system_prompt.trim()) {
      Alert.alert('Error', 'System prompt is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (editingAgent) {
        // Update existing agent
        const response = await apiService.updateAgent(editingAgent.id, formData);
        if (response.status === 200 && response.data) {
          onAgentUpdated?.(response.data);
          Alert.alert('Success', 'Agent updated successfully!');
          onClose();
        }
      } else {
        // Create new agent
        const response = await apiService.createAgent(formData, userId);
        if (response.status === 201 && response.data) {
          onAgentCreated?.(response.data);
          Alert.alert('Success', 'Agent created successfully!');
          onClose();
        }
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      Alert.alert('Error', 'Failed to save agent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputField = (
    label: string,
    field: string,
    value: string,
    placeholder: string,
    multiline: boolean = false,
    numberOfLines: number = 1,
    icon: string = 'edit'
  ) => (
    <View style={styles.inputField}>
      <View style={styles.inputHeader}>
        <View style={[styles.inputIcon, { backgroundColor: theme.colors.primary + '15' }]}>
          <Icon name={icon} size={16} color={theme.colors.primary} />
        </View>
        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
          {label}
        </Text>
      </View>
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
        <TextInput
          style={[
            styles.textInput,
            {
              color: theme.colors.text,
            },
            multiline && { height: numberOfLines * 20 + 12, textAlignVertical: 'top' }
          ]}
          value={value}
          onChangeText={(text) => handleInputChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {value.length > 0 && (
        <View style={styles.characterCount}>
          <Text style={[styles.characterCountText, { color: theme.colors.textSecondary }]}>
            {value.length}
          </Text>
        </View>
      )}
    </View>
  );

  const renderTemplateCard = (title: string, description: string, icon: string, color: string, onPress: () => void) => (
    <TouchableOpacity 
      style={[styles.templateCard, { backgroundColor: theme.colors.card }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.templateIconContainer}>
        <View style={[styles.templateIcon, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
      </View>
      <View style={styles.templateContent}>
        <Text style={[styles.templateTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.templateDescription, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 20 : 60,
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
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
      marginTop: 4,
    },
    templatesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    templateCard: {
      width: (width - 60) / 2 - 6,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    templateIconContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    templateIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    templateContent: {
      flex: 1,
    },
    templateTitle: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 4,
      textAlign: 'center',
    },
    templateDescription: {
      fontSize: 11,
      lineHeight: 14,
      textAlign: 'center',
    },
    formSection: {
      marginBottom: 20,
    },
    inputField: {
      marginBottom: 16,
    },
    inputHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    inputIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    inputContainer: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    textInput: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      lineHeight: 18,
      minHeight: 40,
    },
    characterCount: {
      alignItems: 'flex-end',
      marginTop: 4,
    },
    characterCountText: {
      fontSize: 10,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.colors.border,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    submitButton: {
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
    submitButtonText: {
      color: theme.colors.surface,
      fontSize: 15,
      fontWeight: '600',
    },
    disabledButton: {
      backgroundColor: theme.colors.textSecondary + '40',
      elevation: 0,
      shadowOpacity: 0,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor={theme.colors.surface} barStyle="dark-content" />
      <View style={styles.modalOverlay}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Icon 
                name={editingAgent ? "edit" : "add-circle"} 
                size={20} 
                color={theme.colors.primary} 
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                {editingAgent ? 'Edit Agent' : 'Create New Agent'}
              </Text>
              <Text style={styles.subtitle}>
                {editingAgent 
                  ? 'Modify your AI assistant\'s personality' 
                  : 'Design your perfect AI assistant'
                }
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.scrollContent}>
            {!editingAgent && (
              <>
                <Text style={styles.sectionTitle}>Quick Templates</Text>
                <View style={styles.templatesGrid}>
                  {renderTemplateCard(
                    'Friendly Helper',
                    'Warm, encouraging, and always positive',
                    'favorite',
                    '#FF6B6B',
                    () => {
                      setFormData({
                        name: 'Friendly Helper',
                        personality: 'Warm, encouraging, and always positive. I love helping people and making them feel good about their progress.',
                        feedback_style: 'Constructive and encouraging feedback with lots of positive reinforcement',
                        system_prompt: 'You are a friendly and supportive AI assistant who always maintains a positive attitude and encourages users in their endeavors.',
                      });
                    }
                  )}
                  {renderTemplateCard(
                    'Professional Expert',
                    'Knowledgeable, precise, and professional',
                    'school',
                    '#4ECDC4',
                    () => {
                      setFormData({
                        name: 'Professional Expert',
                        personality: 'Knowledgeable, precise, and professional. I provide detailed analysis with specific recommendations.',
                        feedback_style: 'Detailed analysis with specific recommendations and actionable insights',
                        system_prompt: 'You are a professional expert AI assistant who provides thorough, accurate, and well-researched information with specific actionable recommendations.',
                      });
                    }
                  )}
                  {renderTemplateCard(
                    'Creative Thinker',
                    'Inventive, playful, and out-of-the-box',
                    'lightbulb',
                    '#45B7D1',
                    () => {
                      setFormData({
                        name: 'Creative Thinker',
                        personality: 'Inventive, playful, and out-of-the-box. I love exploring new ideas and creative solutions.',
                        feedback_style: 'Inspiring suggestions and new angles with creative problem-solving',
                        system_prompt: 'You are a creative AI assistant who thinks outside the box and helps users explore innovative ideas and solutions.',
                      });
                    }
                  )}
                  {renderTemplateCard(
                    'Patient Teacher',
                    'Educational, thorough, and patient',
                    'psychology',
                    '#96CEB4',
                    () => {
                      setFormData({
                        name: 'Patient Teacher',
                        personality: 'Educational, thorough, and patient. I take time to explain concepts clearly and ensure understanding.',
                        feedback_style: 'Step-by-step explanations with examples and clear guidance',
                        system_prompt: 'You are a patient and educational AI assistant who takes time to explain concepts clearly and ensures users understand the material thoroughly.',
                      });
                    }
                  )}
                </View>
              </>
            )}

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>
                {editingAgent ? 'Agent Details' : 'Customize Your Agent'}
              </Text>

              {renderInputField(
                'Agent Name',
                'name',
                formData.name,
                'e.g., Alex - The Friendly Helper',
                false,
                1,
                'person'
              )}

              {renderInputField(
                'Personality',
                'personality',
                formData.personality,
                'Describe the agent\'s personality...',
                true,
                2,
                'psychology'
              )}

              {renderInputField(
                'Feedback Style',
                'feedback_style',
                formData.feedback_style,
                'How the agent provides feedback...',
                true,
                2,
                'feedback'
              )}

              {renderInputField(
                'System Prompt',
                'system_prompt',
                formData.system_prompt,
                'The core instructions...',
                true,
                3,
                'settings'
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              isLoading && styles.disabledButton
            ]} 
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.surface} />
            ) : (
              <Text style={styles.submitButtonText}>
                {editingAgent ? 'Update Agent' : 'Create Agent'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AgentCustomizer;
