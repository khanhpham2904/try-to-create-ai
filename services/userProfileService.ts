import { apiService } from './api';

export interface UserProfile {
  id: number;
  user_id: number;
  communication_style: 'formal' | 'casual' | 'technical' | 'balanced';
  response_length_preference: 'short' | 'medium' | 'detailed';
  language_preference: 'en' | 'vi';
  interests: string[];
  preferences: Record<string, any>;
  total_interactions: number;
  preferred_topics: string[];
  interaction_patterns: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserProfileCreate {
  communication_style: 'formal' | 'casual' | 'technical' | 'balanced';
  response_length_preference: 'short' | 'medium' | 'detailed';
  language_preference: 'en' | 'vi';
  interests: string[];
  preferences: Record<string, any>;
}

export interface UserProfileUpdate {
  communication_style?: 'formal' | 'casual' | 'technical' | 'balanced';
  response_length_preference?: 'short' | 'medium' | 'detailed';
  language_preference?: 'en' | 'vi';
  interests?: string[];
  preferences?: Record<string, any>;
}

export interface PersonalizationData {
  communication_style: string;
  response_length_preference: string;
  language_preference: string;
  interests: string[];
  preferences: Record<string, any>;
  preferred_topics: string[];
  total_interactions: number;
}

class UserProfileService {
  private baseUrl = '/api/v1/user-profiles';

  /**
   * Create a new user profile
   */
  async createProfile(userId: number, profileData: UserProfileCreate): Promise<UserProfile> {
    try {
      console.log('🔄 API: Creating profile for user:', userId, 'with data:', profileData);
      const response = await apiService.makeRequest<UserProfile>(
        `${this.baseUrl}/?user_id=${userId}`,
        {
          method: 'POST',
          body: JSON.stringify(profileData),
        }
      );
      
      console.log('📊 API: Profile creation response:', response);
      
      if (response.error) {
        console.log('❌ API: Profile creation failed with error:', response.error);
        console.log('❌ API: Error status:', response.status);
        
        // Create an error object that matches the expected format
        const error = new Error(response.error);
        (error as any).status = response.status;
        throw error;
      }
      
      console.log('✅ API: Profile creation response:', response.data);
      return response.data!;
    } catch (error) {
      console.log('❌ API: Profile creation error:', error);
      console.log('❌ API: Error status:', error.status);
      console.log('❌ API: Error message:', error.message);
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile by user ID
   */
  async getProfile(userId: number): Promise<UserProfile | null> {
    try {
      console.log('🔍 API: Getting profile for user ID:', userId);
      const response = await apiService.makeRequest<UserProfile>(
        `${this.baseUrl}/${userId}`,
        {
          method: 'GET',
        }
      );
      
      console.log('📊 API: Profile fetch response:', response);
      
      if (response.error) {
        console.log('❌ API: Profile fetch failed with error:', response.error);
        console.log('❌ API: Error status:', response.status);
        
        if (response.status === 404) {
          console.log('📭 API: Profile not found (404)');
          return null; // Profile doesn't exist
        }
        
        // Create an error object that matches the expected format
        const error = new Error(response.error);
        (error as any).status = response.status;
        throw error;
      }
      
      console.log('✅ API: Profile response:', response.data ? 'Found' : 'Not found');
      console.log('📊 API: Profile data:', response.data);
      return response.data!;
    } catch (error) {
      console.log('❌ API: Profile fetch error:', error);
      console.log('❌ API: Error status:', error.status);
      console.log('❌ API: Error message:', error.message);
      
      if (error.status === 404) {
        console.log('📭 API: Profile not found (404)');
        return null; // Profile doesn't exist
      }
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Get or create user profile (convenience method)
   */
  async getOrCreateProfile(userId: number, defaultProfile?: Partial<UserProfileCreate>): Promise<UserProfile> {
    try {
      let profile = await this.getProfile(userId);
      
      if (!profile) {
        const createData: UserProfileCreate = {
          communication_style: defaultProfile?.communication_style || 'balanced',
          response_length_preference: defaultProfile?.response_length_preference || 'medium',
          language_preference: defaultProfile?.language_preference || 'en',
          interests: defaultProfile?.interests || [],
          preferences: defaultProfile?.preferences || {},
        };
        
        try {
          console.log('🔄 Attempting to create profile...');
          profile = await this.createProfile(userId, createData);
          console.log('✅ Profile created successfully:', profile);
        } catch (createError) {
          console.log('⚠️ Profile creation failed:', createError);
          console.log('⚠️ Error status:', createError.status);
          console.log('⚠️ Error message:', createError.message);
          
          // If creation fails with 409 (conflict), try to get the existing profile
          if (createError.status === 409) {
            console.log('🔄 Profile already exists, fetching it...');
            profile = await this.getProfile(userId);
            console.log('🔄 Profile fetched after 409:', profile);
            
            if (!profile) {
              console.error('❌ Failed to get existing profile after 409 error');
              throw createError;
            }
          } else {
            console.log('❌ Non-409 error, throwing:', createError);
            throw createError;
          }
        }
      }
      
      return profile;
    } catch (error) {
      console.error('Error getting or creating user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: number, updateData: UserProfileUpdate): Promise<UserProfile> {
    try {
      console.log('API: Updating profile for user', userId, 'with data:', updateData);
      const response = await apiService.makeRequest<UserProfile>(
        `${this.baseUrl}/${userId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );
      console.log('API: Profile update response:', response);
      return response.data!;
    } catch (error) {
      console.error('API: Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get personalization data for AI responses
   */
  async getPersonalizationData(userId: number): Promise<PersonalizationData> {
    try {
      const response = await apiService.makeRequest<PersonalizationData>(
        `${this.baseUrl}/${userId}/personalization`,
        {
          method: 'GET',
        }
      );
      return response.data!;
    } catch (error) {
      console.error('Error getting personalization data:', error);
      throw error;
    }
  }

  /**
   * Record user interaction (increment interaction count)
   */
  async recordInteraction(userId: number): Promise<void> {
    try {
      await apiService.makeRequest(
        `${this.baseUrl}/${userId}/interaction`,
        {
          method: 'POST',
        }
      );
    } catch (error) {
      console.error('Error recording interaction:', error);
      // Don't throw error for interaction recording failures
    }
  }

  /**
   * Update user's preferred topics
   */
  async updateTopics(userId: number, topics: string[]): Promise<void> {
    try {
      await apiService.makeRequest(
        `${this.baseUrl}/${userId}/topics`,
        {
          method: 'POST',
          body: JSON.stringify(topics),
        }
      );
    } catch (error) {
      console.error('Error updating topics:', error);
      throw error;
    }
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: number): Promise<void> {
    try {
      await apiService.makeRequest(
        `${this.baseUrl}/${userId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  }

  /**
   * Get communication style options
   */
  getCommunicationStyleOptions() {
    return [
      { value: 'balanced', label: 'Balanced', description: 'Natural, friendly tone' },
      { value: 'formal', label: 'Formal', description: 'Professional, business-like' },
      { value: 'casual', label: 'Casual', description: 'Friendly, conversational' },
      { value: 'technical', label: 'Technical', description: 'Precise, detailed' },
    ];
  }

  /**
   * Get response length options
   */
  getResponseLengthOptions() {
    return [
      { value: 'short', label: 'Short', description: 'Concise, key points only' },
      { value: 'medium', label: 'Medium', description: 'Standard length responses' },
      { value: 'detailed', label: 'Detailed', description: 'Comprehensive with examples' },
    ];
  }

  /**
   * Get language options
   */
  getLanguageOptions() {
    return [
      { value: 'en', label: 'English' },
      { value: 'vi', label: 'Tiếng Việt' },
    ];
  }

  /**
   * Get common interest categories
   */
  getInterestCategories() {
    return [
      'Technology',
      'Science',
      'Business',
      'Health',
      'Education',
      'Art',
      'Sports',
      'Travel',
      'Food',
      'Music',
      'Movies',
      'Books',
      'Gaming',
      'Fashion',
      'Finance',
      'Politics',
      'Environment',
      'Psychology',
      'History',
      'Philosophy',
    ];
  }
}

export const userProfileService = new UserProfileService();
