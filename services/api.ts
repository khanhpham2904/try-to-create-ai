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
  message: string;
  response: string;
  created_at: string;
}

export interface ChatMessageCreate {
  user_id: number;
  message: string;
  response?: string;
  agent_id?: number;
}

export interface ChatMessageWithAgent {
  id: number;
  user_id: number;
  agent_id?: number;
  message: string;
  response: string;
  context_used?: string;
  created_at: string;
  agent?: Agent;
}

export interface Agent {
  id: number;
  name: string;
  personality: string;
  feedback_style: string;
  system_prompt: string;
  is_active: boolean;
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
      
      const headers = {
        'Content-Type': 'application/json',
        ...getAndroidHeaders(),
        ...(options.headers as Record<string, string>),
      };
      
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
        return {
          error: data.detail || `HTTP ${response.status}`,
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
    return this.makeRequest<ChatMessageWithAgent>('/api/v1/chat/send', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        message: message,
        ...(response && { response }),
        ...(agentId && { agent_id: agentId })
      }),
    });
  }

  async getUserMessages(
    userId: number, 
    skip: number = 0, 
    limit: number = 50
  ): Promise<ApiResponse<ChatHistoryResponse>> {
    console.log('📜 Getting messages for user:', userId);
    return this.makeRequest<ChatHistoryResponse>(
      `/api/v1/chat/messages?user_id=${userId}&skip=${skip}&limit=${limit}`
    );
  }

  async deleteMessage(messageId: number, userId: number): Promise<ApiResponse<void>> {
    console.log('🗑️ Deleting message:', messageId);
    return this.makeRequest<void>(`/api/v1/chat/messages/${messageId}?user_id=${userId}`, {
      method: 'DELETE'
    });
  }

  async deleteAllMessages(userId: number): Promise<ApiResponse<void>> {
    console.log('🗑️ Deleting all messages for user:', userId);
    return this.makeRequest<void>(`/api/v1/chat/messages?user_id=${userId}`, {
      method: 'DELETE'
    });
  }

  async getChatStatistics(userId: number): Promise<ApiResponse<ChatStatisticsResponse>> {
    console.log('📊 Getting chat statistics for user:', userId);
    return this.makeRequest<ChatStatisticsResponse>(`/api/v1/chat/statistics?user_id=${userId}`);
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

  async updateAgent(agentId: number, agentData: AgentUpdate): Promise<ApiResponse<Agent>> {
    console.log('🤖 Updating agent:', agentId);
    return this.makeRequest<Agent>(`/api/v1/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
    });
  }

  async deleteAgent(agentId: number): Promise<ApiResponse<void>> {
    console.log('🤖 Deleting agent:', agentId);
    return this.makeRequest<void>(`/api/v1/agents/${agentId}`, {
      method: 'DELETE',
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
