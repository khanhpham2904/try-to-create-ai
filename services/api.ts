import { API_CONFIG, FALLBACK_URLS } from '../constants/config';
import { 
  getNetworkConfig, 
  getAndroidHeaders, 
  NETWORK_ERROR_MESSAGES,
  DEBUG_CONFIG,
  NetworkConfig
} from '../constants/networkConfig';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface UserData {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserData;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  chatbox_id?: number;
  agent_id?: number;
  audio_id?: number;
  audio_data?: string;
  duration?: number;
  audio_format?: string;
  audio_response_id?: number;
  audio_response_data?: string;
  audio_response_duration?: number;
  audio_response_format?: string;
  message: string;
  response: string;
  created_at: string;
  fileName?: string; // Optional field for file attachments
}

export interface ChatMessageCreate {
  user_id: number;
  message: string;
  response?: string;
  chatbox_id?: number;
  agent_id?: number;
}

export interface ChatMessageWithAgent {
  id: number;
  user_id: number;
  chatbox_id?: number;
  agent_id?: number;
  audio_id?: number;
  audio_data?: string;
  duration?: number;
  audio_format?: string;
  audio_response_id?: number;
  audio_response_data?: string;
  audio_response_duration?: number;
  audio_response_format?: string;
  message: string;
  response: string;
  context_used?: string;
  created_at: string;
  agent?: Agent;
}

// Chatbox interfaces
export interface Chatbox {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatboxCreate {
  user_id: number;
  title: string;
}

export interface ChatboxUpdate {
  title?: string;
}

export interface ChatboxWithMessages extends Chatbox {
  messages: ChatMessageWithAgent[];
}

export interface ChatboxListResponse {
  chatboxes: Chatbox[];
  total_count: number;
  skip: number;
  limit: number;
}

export interface Agent {
  id: number;
  name: string;
  personality: string;
  feedback_style: string;
  system_prompt: string;
  is_active: boolean;
  user_id?: number; // Add user_id field for ownership
  created_at: string;
  updated_at?: string;
}

export interface AgentCreate {
  name: string;
  personality: string;
  feedback_style: string;
  system_prompt: string;
  user_id?: number; // Add user_id field
}

export interface AgentUpdate {
  name?: string;
  personality?: string;
  feedback_style?: string;
  system_prompt?: string;
  is_active?: boolean;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total_count: number;
  skip: number;
  limit: number;
}

export interface ChatStatisticsResponse {
  total_messages: number;
  first_message_date: string | null;
  last_message_date: string | null;
}

export interface ConversationSummary {
  agent_id: number;
  message_count: number;
  latest_message_date: string;
  first_message_date: string;
  latest_message: string;
  latest_response: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockUserData: UserData = {
  id: 1,
  email: 'demo@example.com',
  full_name: 'Demo User',
  is_active: true,
  roles: 'user',
};

const mockLoginResponse: LoginResponse = {
  access_token: 'mock_token_123',
  token_type: 'bearer',
  user: mockUserData,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

class NetworkUtils {
  static async fetchWithTimeout(
    resource: RequestInfo, 
    options: RequestInit = {}, 
    timeout: number = getNetworkConfig().timeout
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const defaultHeaders: Record<string, string> = {
        ...getAndroidHeaders(),
      };
      
      // Only add Content-Type if not explicitly overridden
      if (!options.headers || !('Content-Type' in (options.headers as Record<string, string>))) {
        defaultHeaders['Content-Type'] = 'application/json';
      }
      
      const headers = {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      };
      
      // Remove undefined values
      Object.keys(headers).forEach(key => {
        if (headers[key] === undefined) {
          delete headers[key];
        }
      });
      
      fetch(resource, { 
        ...options, 
        signal: controller.signal,
        headers,
      })
        .then((response) => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  static isTimeoutError(error: any): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }

  static createErrorResponse(error: any, endpoint: string): ApiResponse {
    if (this.isTimeoutError(error)) {
      return {
        error: NETWORK_ERROR_MESSAGES.TIMEOUT,
        status: 0,
      };
    }
    
    // Handle specific network errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Network request failed')) {
      return {
        error: 'Network request failed - please check your internet connection and ensure the backend server is running',
        status: 0,
      };
    }
    
    if (errorMessage.includes('fetch')) {
      return {
        error: 'Unable to connect to server - please check your network settings and server status',
        status: 0,
      };
    }
    
    return {
      error: `${NETWORK_ERROR_MESSAGES.NETWORK_ERROR} ${errorMessage}`,
      status: 0,
    };
  }

  static getOfflineResponse<T>(endpoint: string): ApiResponse<T> | null {
    if (endpoint === API_CONFIG.ENDPOINTS.LOGIN) {
      return {
        data: mockLoginResponse as T,
        status: 200,
      };
    }
    
    if (endpoint === API_CONFIG.ENDPOINTS.USERS) {
      return {
        data: mockUserData as T,
        status: 200,
      };
    }
    
    return null;
  }
}

// ============================================================================
// API SERVICE
// ============================================================================

class ApiService {
  private baseUrl: string;
  private workingUrl: string | null = null;
  private networkConfig: NetworkConfig;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.networkConfig = getNetworkConfig();
    console.log('🔧 ApiService initialized with URL:', baseUrl);
  }

  // ============================================================================
  // CORE REQUEST METHODS
  // ============================================================================

  private async makeSingleRequest<T>(
    url: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const fullUrl = `${url}${endpoint}`;
      console.log(`🌐 Trying URL: ${fullUrl}`);

      const response = await NetworkUtils.fetchWithTimeout(
        fullUrl, 
        options, 
        this.networkConfig.timeout
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        this.workingUrl = url;
        console.log(`✅ Success for: ${fullUrl}`);
        return { data, status: response.status };
      } else {
        console.log(`❌ HTTP Error for: ${fullUrl} - Status: ${response.status}`);
        
        // Handle specific error cases
        if (response.status === 409) {
          return {
            error: 'Duplicate message detected - this message was already sent',
            status: response.status,
          };
        }
        
        if (response.status === 429) {
          return {
            error: 'Too many messages sent too quickly - please wait a moment',
            status: response.status,
          };
        }
        
        return {
          error: (data && data.detail) || `HTTP ${response.status}`,
          status: response.status,
        };
      }
    } catch (error) {
      console.error(`❌ Network error for ${url}${endpoint}:`, error);
      return NetworkUtils.createErrorResponse(error, endpoint);
    }
  }

  private async makeSingleRequestWithTimeout<T>(
    url: string,
    endpoint: string,
    options: RequestInit = {},
    customTimeout: number
  ): Promise<ApiResponse<T>> {
    try {
      const fullUrl = `${url}${endpoint}`;
      console.log(`🌐 Trying URL with custom timeout (${customTimeout}ms): ${fullUrl}`);

      const response = await NetworkUtils.fetchWithTimeout(
        fullUrl, 
        options, 
        customTimeout
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        this.workingUrl = url;
        console.log(`✅ Success for: ${fullUrl}`);
        return { data, status: response.status };
      } else {
        console.log(`❌ HTTP Error for: ${fullUrl} - Status: ${response.status}`);
        
        // Handle specific error cases
        if (response.status === 409) {
          return {
            error: 'Duplicate message detected - this message was already sent',
            status: response.status,
          };
        }
        
        if (response.status === 429) {
          return {
            error: 'Too many messages sent too quickly - please wait a moment',
            status: response.status,
          };
        }
        
        return {
          error: (data && data.detail) || `HTTP ${response.status}`,
          status: response.status,
        };
      }
    } catch (error) {
      console.error(`❌ Network error for ${url}${endpoint}:`, error);
      return NetworkUtils.createErrorResponse(error, endpoint);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    console.log(`🚀 Making API request to: ${endpoint}`);
    
    // Try URLs in order: working URL, base URL, then fallbacks
    const urlsToTry = [
      ...(this.workingUrl ? [this.workingUrl] : []),
      this.baseUrl,
      ...FALLBACK_URLS.filter(url => url !== this.baseUrl)
    ];

    for (const url of urlsToTry) {
      console.log(`🔄 Trying URL: ${url}`);
      const result = await this.makeSingleRequest<T>(url, endpoint, options);
      
      if (result.status !== 0) {
        return result;
      }
    }

    // All URLs failed - try offline mode
    const offlineResponse = NetworkUtils.getOfflineResponse<T>(endpoint);
    if (offlineResponse) {
      console.log('🔄 Returning offline mode response');
      return offlineResponse;
    }

    // Complete failure
    console.log(`❌ All URLs failed for endpoint: ${endpoint}`);
    return {
      error: `${NETWORK_ERROR_MESSAGES.CONNECTION_FAILED} Endpoint: ${endpoint}`,
      status: 0,
    };
  }

  private async makeRequestWithCustomTimeout<T>(
    endpoint: string,
    options: RequestInit = {},
    customTimeout: number
  ): Promise<ApiResponse<T>> {
    console.log(`🚀 Making API request with custom timeout (${customTimeout}ms) to: ${endpoint}`);
    
    // Try URLs in order: working URL, base URL, then fallbacks
    const urlsToTry = [
      ...(this.workingUrl ? [this.workingUrl] : []),
      this.baseUrl,
      ...FALLBACK_URLS.filter(url => url !== this.baseUrl)
    ];

    for (const url of urlsToTry) {
      console.log(`🔄 Trying URL with custom timeout: ${url}`);
      const result = await this.makeSingleRequestWithTimeout<T>(url, endpoint, options, customTimeout);
      
      if (result.status !== 0) {
        return result;
      }
    }

    // All URLs failed - try offline mode
    const offlineResponse = NetworkUtils.getOfflineResponse<T>(endpoint);
    if (offlineResponse) {
      console.log('🔄 Returning offline mode response');
      return offlineResponse;
    }

    // Complete failure
    console.log(`❌ All URLs failed for endpoint: ${endpoint}`);
    return {
      error: `${NETWORK_ERROR_MESSAGES.CONNECTION_FAILED} Endpoint: ${endpoint}`,
      status: 0,
    };
  }

  // ============================================================================
  // CONNECTION TESTING
  // ============================================================================

  async testConnection(): Promise<{ workingUrl: string | null; error?: string }> {
    console.log('🔍 Testing API connection...');
    const result = await this.makeRequest('/health');
    
    if (result.status === 200) {
      console.log('✅ Connection test successful');
      return { workingUrl: this.workingUrl || this.baseUrl };
    } else {
      console.log('❌ Connection test failed:', result.error);
      return { workingUrl: null, error: result.error };
    }
  }

  // ============================================================================
  // CHAT METHODS
  // ============================================================================

  async sendMessage(
    userId: number, 
    message: string, 
    response?: string, 
    agentId?: number
  ): Promise<ApiResponse<ChatMessageWithAgent>> {
    console.log('💬 Sending message for user:', userId, 'with agent:', agentId);
    
    // Add unique request ID to prevent duplicate processing
    // Use a more robust ID generation with user ID, timestamp, and crypto random
    let randomPart: string;
    try {
      // Use crypto.getRandomValues if available (more secure)
      randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    } catch {
      // Fallback to Math.random if crypto API is not available
      randomPart = Math.random().toString(36).substring(2, 11);
    }
    const requestId = `msg_${userId}_${Date.now()}_${randomPart}`;
    
    return this.makeRequest<ChatMessageWithAgent>('/api/v1/chat/send', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        message: message,
        request_id: requestId, // Add unique request ID
        ...(response && { response }),
        ...(agentId && { agent_id: agentId })
      }),
    });
  }

  async sendVoiceMessage(
    userId: number,
    audioData: string, // Base64 encoded audio
    audioFormat: string = 'wav',
    agentId?: number,
    chatboxId?: number,
    audioUri?: string,
    duration?: number,
    useFemaleVoice: boolean = true
  ): Promise<ApiResponse<ChatMessageWithAgent & { audio_id?: number; audio_data?: string; duration?: number; audio_format?: string }>> {
    console.log('🎤 Sending voice message for user:', userId, 'useFemaleVoice:', useFemaleVoice);
    
    return this.makeRequest<ChatMessageWithAgent>('/api/v1/voice/process', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        audio_data: audioData,
        audio_format: audioFormat,
        agent_id: agentId,
        chatbox_id: chatboxId,
        audio_uri: audioUri,
        duration: duration,
        use_female_voice: useFemaleVoice
      }),
    });
  }

  async uploadVoiceMessage(
    userId: number,
    audioFile: File | Blob,
    audioFormat: string = 'wav',
    agentId?: number,
    chatboxId?: number,
    duration?: number,
    useFemaleVoice: boolean = true
  ): Promise<ApiResponse<ChatMessageWithAgent & { audio_id?: number; audio_data?: string; duration?: number; audio_format?: string }>> {
    console.log('🎤 Uploading voice message file for user:', userId, 'useFemaleVoice:', useFemaleVoice);
    
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('user_id', userId.toString());
    if (agentId) formData.append('agent_id', agentId.toString());
    if (chatboxId) formData.append('chatbox_id', chatboxId.toString());
    if (duration) formData.append('duration', duration.toString());
    formData.append('use_female_voice', useFemaleVoice.toString());
    
    // Use extended timeout for file uploads (2 minutes)
    const fileUploadTimeout = 120000; // 2 minutes
    
    return this.makeRequestWithCustomTimeout<ChatMessageWithAgent>('/api/v1/voice/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Override default Content-Type to allow FormData boundary
        'Content-Type': undefined,
      },
    }, fileUploadTimeout);
  }

  async sendMessageExternalAPI(
    userId: number, 
    message: string, 
    response?: string, 
    agentId?: number
  ): Promise<ApiResponse<ChatMessageWithAgent>> {
    console.log('🌐 Sending message via external API for user:', userId, 'with agent:', agentId);
    
    // Add unique request ID to prevent duplicate processing
    let randomPart: string;
    try {
      randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    } catch {
      randomPart = Math.random().toString(36).substring(2, 11);
    }
    const requestId = `ext_${userId}_${Date.now()}_${randomPart}`;
    
    // Use extended timeout for file uploads (2 minutes)
    const fileUploadTimeout = 120000; // 2 minutes
    
    return this.makeRequestWithCustomTimeout<ChatMessageWithAgent>('/api/v1/external-api/send', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        message: message,
        request_id: requestId,
        ...(response && { response }),
        ...(agentId && { agent_id: agentId })
      }),
    }, fileUploadTimeout);
  }

  async getUserMessages(
    userId: number, 
    skip: number = 0, 
    limit: number = 50,
    agentId?: number | null,
    withoutAgent?: boolean
  ): Promise<ApiResponse<ChatHistoryResponse>> {
    // If withoutAgent is true OR agentId is explicitly null, use without_agent=true
    if (withoutAgent || agentId === null) {
      console.log('📜 Getting messages for user:', userId, 'without agent');
      return this.makeRequest<ChatHistoryResponse>(
        `/api/v1/chat/messages?user_id=${userId}&skip=${skip}&limit=${limit}&without_agent=true`
      );
    } else if (agentId !== undefined && agentId !== null) {
      console.log('📜 Getting messages for user:', userId, `with agent: ${agentId}`);
      return this.makeRequest<ChatHistoryResponse>(
        `/api/v1/chat/messages?user_id=${userId}&skip=${skip}&limit=${limit}&agent_id=${agentId}`
      );
    } else {
      // No agentId parameter - get all messages
      console.log('📜 Getting all messages for user:', userId);
      return this.makeRequest<ChatHistoryResponse>(
        `/api/v1/chat/messages?user_id=${userId}&skip=${skip}&limit=${limit}`
      );
    }
  }

  async deleteMessage(messageId: number, userId: number): Promise<ApiResponse<void>> {
    console.log('🗑️ Deleting message:', messageId);
    return this.makeRequest<void>(`/api/v1/chat/messages/${messageId}?user_id=${userId}`, {
      method: 'DELETE'
    });
  }


  // ============================================================================
  // FILE PROCESSING METHODS (Now handled by streamlined workflow)
  // ============================================================================

  // Note: File uploads are now handled through the regular sendMessage method
  // The streamlined workflow automatically detects file content and processes it

  async getChatStatistics(userId: number): Promise<ApiResponse<ChatStatisticsResponse>> {
    console.log('📊 Getting chat statistics for user:', userId);
    return this.makeRequest<ChatStatisticsResponse>(`/api/v1/chat/statistics?user_id=${userId}`);
  }

  async getConversations(userId: number): Promise<ApiResponse<ConversationSummary[]>> {
    console.log('💬 Getting conversations for user:', userId);
    return this.makeRequest<ConversationSummary[]>(`/api/v1/chat/conversations?user_id=${userId}`);
  }

  // ============================================================================
  // AGENT METHODS
  // ============================================================================

  async getAgents(userId?: number): Promise<ApiResponse<Agent[]>> {
    console.log('🤖 Getting agents for user:', userId);
    if (userId) {
      // Get agents available for specific user (default + user's custom agents)
      return this.makeRequest<Agent[]>(`/api/v1/agents/user/${userId}/available`);
    } else {
      // Fallback to all active agents if no user ID provided
      return this.makeRequest<Agent[]>('/api/v1/agents/active/list');
    }
  }

  async getUnchattedAgents(userId: number): Promise<ApiResponse<Agent[]>> {
    console.log('🤖 Getting unchatted agents for user:', userId);
    return this.makeRequest<Agent[]>(`/api/v1/agents/user/${userId}/unchatted`);
  }

  async getAgent(agentId: number): Promise<ApiResponse<Agent>> {
    console.log('🤖 Getting agent:', agentId);
    return this.makeRequest<Agent>(`/api/v1/agents/${agentId}`);
  }

  async createAgent(agentData: AgentCreate, userId?: number): Promise<ApiResponse<Agent>> {
    console.log('🤖 Creating agent:', agentData.name, 'for user:', userId);
    
    // If userId is provided, add it to the agent data
    const dataToSend = userId ? { ...agentData, user_id: userId } : agentData;
    
    return this.makeRequest<Agent>('/api/v1/agents/', {
      method: 'POST',
      body: JSON.stringify(dataToSend),
    });
  }

  async updateAgent(agentId: number, agentData: AgentUpdate, userId: number): Promise<ApiResponse<Agent>> {
    console.log('🤖 Updating agent:', agentId, 'by user:', userId);
    return this.makeRequest<Agent>(`/api/v1/agents/${agentId}?user_id=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
    });
  }

  async deleteAgent(agentId: number, userId: number): Promise<ApiResponse<{message: string, agent_name: string, messages_deleted: number}>> {
    console.log('🤖 Deleting agent:', agentId, 'by user:', userId);
    return this.makeRequest<{message: string, agent_name: string, messages_deleted: number}>(`/api/v1/agents/${agentId}?user_id=${userId}`, {
      method: 'DELETE',
    });
  }

  async cleanupOrphanedConversations(userId: number): Promise<ApiResponse<{message: string, orphaned_count: number}>> {
    console.log('🧹 Cleaning up orphaned conversations for user:', userId);
    return this.makeRequest<{message: string, orphaned_count: number}>(`/api/v1/agents/cleanup-orphaned-conversations?user_id=${userId}`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // CHATBOX METHODS
  // ============================================================================

  async createChatbox(chatboxData: ChatboxCreate): Promise<ApiResponse<Chatbox>> {
    console.log('📦 Creating chatbox:', chatboxData.title);
    return this.makeRequest<Chatbox>('/api/v1/chatbox/chatboxes', {
      method: 'POST',
      body: JSON.stringify(chatboxData),
    });
  }

  async getUserChatboxes(
    userId: number, 
    skip: number = 0, 
    limit: number = 100
  ): Promise<ApiResponse<ChatboxListResponse>> {
    console.log('📦 Getting chatboxes for user:', userId);
    return this.makeRequest<ChatboxListResponse>(
      `/api/v1/chatbox/chatboxes?user_id=${userId}&skip=${skip}&limit=${limit}`
    );
  }

  async getChatbox(
    chatboxId: number, 
    userId: number
  ): Promise<ApiResponse<Chatbox>> {
    console.log('📦 Getting chatbox:', chatboxId);
    return this.makeRequest<Chatbox>(`/api/v1/chatbox/chatboxes/${chatboxId}?user_id=${userId}`);
  }

  async getChatboxWithMessages(
    chatboxId: number, 
    userId: number,
    skip: number = 0,
    limit: number = 100
  ): Promise<ApiResponse<ChatboxWithMessages>> {
    console.log('📦 Getting chatbox with messages:', chatboxId);
    return this.makeRequest<ChatboxWithMessages>(
      `/api/v1/chatbox/chatboxes/${chatboxId}/messages?user_id=${userId}&skip=${skip}&limit=${limit}`
    );
  }

  async updateChatbox(
    chatboxId: number, 
    userId: number, 
    chatboxData: ChatboxUpdate
  ): Promise<ApiResponse<Chatbox>> {
    console.log('📦 Updating chatbox:', chatboxId);
    return this.makeRequest<Chatbox>(`/api/v1/chatbox/chatboxes/${chatboxId}?user_id=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(chatboxData),
    });
  }

  async deleteChatbox(chatboxId: number, userId: number): Promise<ApiResponse<void>> {
    console.log('📦 Deleting chatbox:', chatboxId);
    return this.makeRequest<void>(`/api/v1/chatbox/chatboxes/${chatboxId}?user_id=${userId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================================
  // USER METHODS
  // ============================================================================

  async updateUser(userId: number, userData: { full_name?: string; email?: string }): Promise<ApiResponse<UserData>> {
    console.log('👤 Updating user:', userId);
    return this.makeRequest<UserData>(`/api/v1/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async registerUser(userData: RegisterRequest): Promise<ApiResponse<UserData>> {
    console.log('👤 Registering user:', userData.email);
    return this.makeRequest<UserData>(API_CONFIG.ENDPOINTS.USERS, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async loginUser(credentials: { email: string; password: string }): Promise<ApiResponse<LoginResponse>> {
    console.log('🔐 Logging in user:', credentials.email);
    return this.makeRequest<LoginResponse>(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getWorkingUrl(): string | null {
    return this.workingUrl;
  }

  resetWorkingUrl(): void {
    this.workingUrl = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const apiService = new ApiService(API_CONFIG.BASE_URL);
