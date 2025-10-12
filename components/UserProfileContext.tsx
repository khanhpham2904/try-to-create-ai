import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userProfileService, UserProfile, PersonalizationData } from '../services/userProfileService';
import { useAuth } from './AuthContext';

interface UserProfileContextType {
  profile: UserProfile | null;
  personalizationData: PersonalizationData | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  recordInteraction: () => Promise<void>;
  refreshPersonalization: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [personalizationData, setPersonalizationData] = useState<PersonalizationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debug profile state changes
  useEffect(() => {
    console.log('🔄 Profile state changed:', profile ? `ID ${profile.id}` : 'null');
  }, [profile]);

  const loadProfile = async () => {
    console.log('🚀 loadProfile called with user:', user ? `${user.id} (${user.name})` : 'null');
    
    if (!user) {
      console.log('❌ No user found, cannot load profile');
      return;
    }

    console.log('🔄 Loading profile for user:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      // Try to get existing profile
      console.log('📡 Fetching existing profile...');
      let userProfile = await userProfileService.getProfile(Number(user.id));
      console.log('📡 Profile fetch result:', userProfile ? 'Found' : 'Not found');
      console.log('📡 Profile data:', userProfile);
      
      // If no profile exists, create a default one
      if (!userProfile) {
        console.log('🆕 No profile found, creating default profile...');
        userProfile = await userProfileService.getOrCreateProfile(Number(user.id), {
          communication_style: 'balanced',
          response_length_preference: 'medium',
          language_preference: 'en',
          interests: [],
          preferences: {},
        });
        console.log('✅ Default profile created:', userProfile);
      }
      
      console.log('🎯 Final userProfile before setProfile:', userProfile);

      try {
        console.log('💾 Setting profile state...');
        setProfile(userProfile);
        console.log('✅ Profile state set successfully');
      } catch (error) {
        console.error('❌ Error setting profile state:', error);
      }

      // Load personalization data
      try {
        console.log('📊 Loading personalization data...');
        const personalization = await userProfileService.getPersonalizationData(Number(user.id));
        setPersonalizationData(personalization);
        console.log('✅ Personalization data loaded:', personalization);
        
        // If we don't have a profile but have personalization data, create profile from it
        if (!userProfile && personalization) {
          console.log('🔄 Creating profile from personalization data...');
          try {
            userProfile = await userProfileService.getOrCreateProfile(Number(user.id), {
              communication_style: personalization.communication_style as any,
              response_length_preference: personalization.response_length_preference as any,
              language_preference: personalization.language_preference as any,
              interests: personalization.interests,
              preferences: personalization.preferences,
            });
            console.log('✅ Profile created from personalization:', userProfile);
            
            // Only set profile if we got a valid response
            if (userProfile) {
              setProfile(userProfile);
            } else {
              console.error('❌ Profile creation returned undefined');
            }
          } catch (profileError) {
            console.error('❌ Error creating profile from personalization:', profileError);
          }
        }
      } catch (error) {
        console.error('❌ Error loading personalization data:', error);
      }

    } catch (err) {
      console.error('❌ Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
      console.log('🏁 Profile loading completed');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      console.error('Cannot update profile: missing user', { user: !!user });
      return;
    }

    try {
      console.log('Updating profile for user:', user.id, 'with updates:', updates);
      
      // If no profile exists, create one first
      if (!profile) {
        console.log('No profile found, creating one first...');
        await loadProfile();
      }
      
      const updatedProfile = await userProfileService.updateProfile(Number(user.id), updates);
      console.log('Profile updated successfully:', updatedProfile);
      
      try {
        setProfile(updatedProfile);
      } catch (error) {
        console.error('Error setting updated profile state:', error);
      }

      // Refresh personalization data
      try {
        await refreshPersonalization();
      } catch (error) {
        console.error('Error refreshing personalization data:', error);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  const recordInteraction = async () => {
    if (!user) return;

    try {
      await userProfileService.recordInteraction(Number(user.id));
      
      // Update local profile if we have it
      if (profile) {
        setProfile(prev => prev ? {
          ...prev,
          total_interactions: prev.total_interactions + 1
        } : null);
      }
    } catch (err) {
      console.error('Error recording interaction:', err);
      // Don't throw error for interaction recording failures
    }
  };

  const refreshPersonalization = async () => {
    if (!user) return;

    try {
      const personalization = await userProfileService.getPersonalizationData(Number(user.id));
      setPersonalizationData(personalization);
    } catch (err) {
      console.error('Error refreshing personalization data:', err);
    }
  };

  // Load profile when user changes
  useEffect(() => {
    console.log('🔄 UserProfileContext useEffect triggered:', {
      user: !!user,
      userId: user?.id,
      userName: user?.name
    });
    
    if (user) {
      console.log('👤 User found, calling loadProfile...');
      loadProfile();
    } else {
      console.log('❌ No user, clearing profile data');
      setProfile(null);
      setPersonalizationData(null);
      setError(null);
    }
  }, [user]);

  const value: UserProfileContextType = {
    profile,
    personalizationData,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    recordInteraction,
    refreshPersonalization,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = (): UserProfileContextType => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

