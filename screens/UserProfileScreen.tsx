import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useUserProfile } from '../components/UserProfileContext';
import { useAuth } from '../components/AuthContext';
import { userProfileService, UserProfile } from '../services/userProfileService';
import { Icon } from '../components/Icon';
import { FormInput } from '../components/FormInput';

const UserProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const { profile, isLoading, updateProfile, error, loadProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  
  // Debug formData changes
  useEffect(() => {
    console.log('📋 FormData updated:', formData);
  }, [formData]);
  const [userName, setUserName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    console.log('🔄 Profile useEffect triggered:', {
      profile: !!profile,
      user: !!user,
      isMounted,
      profileData: profile ? {
        id: profile.id,
        communication_style: profile.communication_style,
        response_length_preference: profile.response_length_preference,
        language_preference: profile.language_preference,
      } : 'No profile'
    });
    
    try {
      if (profile) {
        console.log('📊 Setting profile data:', {
          communication_style: profile.communication_style,
          response_length_preference: profile.response_length_preference,
          language_preference: profile.language_preference,
          interests: profile.interests,
        });
        
        setFormData({
          communication_style: profile.communication_style,
          response_length_preference: profile.response_length_preference,
          language_preference: profile.language_preference,
          interests: profile.interests,
          preferences: profile.preferences,
        });
        setSelectedInterests(profile.interests || []);
      } else {
        console.log('❌ No profile data available');
      }
      
      if (user) {
        setUserName(user.name || '');
      }
    } catch (error) {
      console.error('Error setting profile data:', error);
    }
  }, [profile, user, isMounted]);

  const handleSave = async () => {
    try {
      console.log('Saving profile with data:', {
        userName,
        communication_style: formData.communication_style,
        response_length_preference: formData.response_length_preference,
        language_preference: formData.language_preference,
        interests: selectedInterests,
        preferences: formData.preferences,
      });

      // Update user name if it has changed
      if (user && userName !== user.name) {
        try {
          const result = await updateUser({ full_name: userName });
          if (!result.success) {
            console.error('❌ Error updating user name:', result.error);
            Alert.alert('Error', result.error || 'Failed to update name. Please try again.');
            return;
          }
          console.log('✅ User name updated successfully');
        } catch (error) {
          console.error('❌ Error updating user name:', error);
          Alert.alert('Error', 'Failed to update name. Please try again.');
          return;
        }
      }

      // Update profile preferences
      await updateProfile({
        communication_style: formData.communication_style,
        response_length_preference: formData.response_length_preference,
        language_preference: formData.language_preference,
        interests: selectedInterests,
        preferences: formData.preferences,
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', `Failed to update profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    try {
      if (profile) {
        setFormData({
          communication_style: profile.communication_style,
          response_length_preference: profile.response_length_preference,
          language_preference: profile.language_preference,
          interests: profile.interests,
          preferences: profile.preferences,
        });
        setSelectedInterests(profile.interests || []);
      }
      
      if (user) {
        setUserName(user.name || '');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error canceling edit:', error);
      setIsEditing(false);
    }
  };

  const toggleInterest = (interest: string) => {
    if (!isEditing) return;
    
    try {
      setSelectedInterests((prev: string[]) => {
        if (!Array.isArray(prev)) return [interest];
        return prev.includes(interest)
          ? prev.filter(i => i !== interest)
          : [...prev, interest];
      });
    } catch (error) {
      console.error('Error toggling interest:', error);
    }
  };

  const communicationStyleOptions = userProfileService.getCommunicationStyleOptions();
  const responseLengthOptions = userProfileService.getResponseLengthOptions();
  const languageOptions = userProfileService.getLanguageOptions();
  const interestCategories = userProfileService.getInterestCategories();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading profile...
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              console.log('🔄 Manual profile reload triggered');
              loadProfile();
            }}
          >
            <Text style={styles.retryButtonText}>Reload Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="error" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              // Force reload by calling loadProfile
              console.log('🔄 Manual profile reload from UserProfileScreen...');
              loadProfile();
            }}
          >
            <Text style={styles.retryButtonText}>Retry Profile Load</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Personalization Profile
            </Text>
            {!isEditing && (
              <TouchableOpacity
                style={[styles.editHeaderButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editHeaderText}>✏️ Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Customize how AI responds to you
          </Text>
          {/* Debug Info */}
          <View style={styles.debugInfo}>
            <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
              User: {user ? `${user.id} (${user.name})` : 'Not logged in'} | 
              Profile: {profile ? `${profile.id} (${profile.communication_style})` : 'Not loaded'} | 
              FormData: {formData.communication_style || 'undefined'} | 
              Loading: {isLoading ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {/* User Name */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Display Name
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Your name as it appears in the app
            {!isEditing && (
              <Text style={[styles.editHint, { color: theme.colors.primary }]}>
                {' '}Tap "Edit" to change
              </Text>
            )}
          </Text>
          
          {isEditing ? (
            <FormInput
              placeholder="Enter your name"
              value={userName}
              onChangeText={setUserName}
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text 
              }]}
            />
          ) : (
            <View style={[styles.displayValue, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.displayText, { color: theme.colors.text }]}>
                {userName || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        {/* Communication Style */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Communication Style
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            How should the AI communicate with you?
            {!isEditing && (
              <Text style={[styles.editHint, { color: theme.colors.primary }]}>
                {' '}Tap "Edit" to customize
              </Text>
            )}
          </Text>
          
          {communicationStyleOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: formData.communication_style === option.value 
                    ? theme.colors.primary + '20' 
                    : 'transparent',
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={() => {
                if (!isEditing) return;
                try {
                  setFormData((prev: any) => ({ ...prev, communication_style: option.value as any }));
                } catch (error) {
                  console.error('Error updating communication style:', error);
                }
              }}
              disabled={!isEditing}
            >
               <View style={styles.optionContent}>
                 <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                   {option.label}
                 </Text>
                 <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                   {option.description}
                 </Text>
               </View>
               {formData.communication_style === option.value && (
                 <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                   <Text style={styles.checkmarkIcon}>✓</Text>
                 </View>
               )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Response Length */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Response Length
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            How detailed should the responses be?
          </Text>
          
          {responseLengthOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: formData.response_length_preference === option.value 
                    ? theme.colors.primary + '20' 
                    : 'transparent',
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={() => {
                if (!isEditing) return;
                try {
                  setFormData((prev: any) => ({ ...prev, response_length_preference: option.value as any }));
                } catch (error) {
                  console.error('Error updating response length:', error);
                }
              }}
              disabled={!isEditing}
            >
               <View style={styles.optionContent}>
                 <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                   {option.label}
                 </Text>
                 <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                   {option.description}
                 </Text>
               </View>
               {formData.response_length_preference === option.value && (
                 <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                   <Text style={styles.checkmarkIcon}>✓</Text>
                 </View>
               )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Language Preference */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Language Preference
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Preferred language for responses
          </Text>
          
          {languageOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: formData.language_preference === option.value 
                    ? theme.colors.primary + '20' 
                    : 'transparent',
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={() => {
                if (!isEditing) return;
                try {
                  setFormData((prev: any) => ({ ...prev, language_preference: option.value as any }));
                } catch (error) {
                  console.error('Error updating language preference:', error);
                }
              }}
              disabled={!isEditing}
            >
               <View style={styles.optionContent}>
                 <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                   {option.label}
                 </Text>
               </View>
               {formData.language_preference === option.value && (
                 <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                   <Text style={styles.checkmarkIcon}>✓</Text>
                 </View>
               )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Interests */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Interests
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Select topics you're interested in (helps AI provide more relevant responses)
          </Text>
          
          <View style={styles.interestsGrid}>
            {interestCategories.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestChip,
                  { 
                    backgroundColor: selectedInterests.includes(interest)
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => isEditing && toggleInterest(interest)}
                disabled={!isEditing}
              >
                 <Text style={[
                   styles.interestText,
                   { 
                     color: selectedInterests.includes(interest)
                       ? theme.colors.surface
                       : theme.colors.text
                   }
                 ]}>
                   {interest}
                 </Text>
                 {selectedInterests.includes(interest) && (
                   <View style={[styles.interestCheckmark, { backgroundColor: theme.colors.surface }]}>
                     <Text style={[styles.checkmarkIcon, { fontSize: 10, color: theme.colors.primary }]}>✓</Text>
                   </View>
                 )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats */}
        {profile && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Usage Statistics
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {profile.total_interactions}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Total Interactions
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {profile.preferred_topics?.length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Learned Topics
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {isEditing && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={handleCancel}
              >
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSave}
              >
                <Text style={[styles.buttonText, { color: theme.colors.surface }]}>
                  ✓ Save
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  editHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  editHeaderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
  },
  editHint: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  debugInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  debugText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    position: 'relative',
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  actionContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 8,
  },
  displayValue: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  displayText: {
    fontSize: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  checkmarkIcon: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  interestCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
});

export default UserProfileScreen;
