import { API_CONFIG, FALLBACK_URLS } from '../constants/config';
import { Platform } from 'react-native';

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

// Chat Message Interfaces
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

// Mock data for offline mode
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

// Android-specific timeout and retry configuration
const getAndroidConfig = () => ({
  timeout: Platform.OS === 'android' ? 45000 : 10000, // Increased to 45 seconds for Android
  retryAttempts: Platform.OS === 'android' ? 3 : 2, // Reduced retries but increased timeout
  retryDelay: Platform.OS === 'android' ? 1000 : 1000, // Faster retry delay
});

// Enhanced fetch with Android-specific improvements
function fetchWithTimeout(
  resource: RequestInfo, 
  options: RequestInit = {}, 
  timeout: number = getAndroidConfig().timeout
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const id = setTimeout(() => {
      controller.abort();
    }, timeout);
    
    const androidHeaders: Record<string, string> = Platform.OS === 'android' ? {
      'User-Agent': 'ChatApp-Android/1.0',
      'Accept': 'application/json',
      'Connection': 'keep-alive',
      'Keep-Alive': 'timeout=45, max=1000',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    } : {};
    
    fetch(resource, { 
      ...options, 
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...androidHeaders,
        ...(options.headers as Record<string, string>),
      },
    })
      .then((response) => {
        clearTimeout(id);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

class ApiService {
  private baseUrl: string;
  private workingUrl: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    console.log('🔧 ApiService initialized with URL:', baseUrl);
  }

  // Chat Message Methods
  async sendMessage(userId: number, message: string, response?: string, agentId?: number): Promise<ApiResponse<ChatMessageWithAgent>> {
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

  async getUserMessages(userId: number, skip: number = 0, limit: number = 50): Promise<ApiResponse<ChatHistoryResponse>> {
    console.log('📜 Getting messages for user:', userId);
    return this.makeRequest<ChatHistoryResponse>(`/api/v1/chat/messages?user_id=${userId}&skip=${skip}&limit=${limit}`);
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

  // Agent-related methods
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    console.log('🤖 Getting agents');
    return this.makeRequest<Agent[]>('/api/v1/agents/active/list');
  }

  async getAgent(agentId: number): Promise<ApiResponse<Agent>> {
    console.log('🤖 Getting agent:', agentId);
    return this.makeRequest<Agent>(`/api/v1/agents/${agentId}`);
  }

  async createAgent(agentData: AgentCreate): Promise<ApiResponse<Agent>> {
    console.log('🤖 Creating agent:', agentData.name);
    return this.makeRequest<Agent>('/api/v1/agents/', {
      method: 'POST',
      body: JSON.stringify(agentData),
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

  // Method to test connection and find working URL
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

  private async makeRequestWithTimeout<T>(
    url: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const androidConfig = getAndroidConfig();
    
    try {
      const fullUrl = `${url}${endpoint}`;
      console.log(`🌐 [Android] Trying URL: ${fullUrl}`);
      console.log(`📱 Platform: ${Platform.OS}, Timeout: ${androidConfig.timeout}ms`);

      const response = await fetchWithTimeout(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      }, androidConfig.timeout);

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        this.workingUrl = url;
        console.log(`✅ [Android] Success for: ${fullUrl}`);
        return {
          data,
          status: response.status,
        };
      } else {
        console.log(`❌ [Android] HTTP Error for: ${fullUrl} - Status: ${response.status}`);
        return {
          error: data.detail || `HTTP ${response.status}`,
          status: response.status,
        };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`⏰ [Android] Timeout error for: ${url}${endpoint}`);
        return {
          error: 'Request timed out - server not responding',
          status: 0,
        };
      }
      console.error(`❌ [Android] Network error for ${url}${endpoint}:`, error);
      return {
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 0,
      };
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const androidConfig = getAndroidConfig();
    console.log(`🚀 Making API request to: ${endpoint}`);
    
    // Try the main URL first
    console.log(`🔄 Trying main URL: ${this.baseUrl}`);
    const mainResult = await this.makeRequestWithTimeout<T>(this.baseUrl, endpoint, options);
    if (mainResult.status !== 0) {
      return mainResult;
    }

    // Try fallback URLs
    for (const url of FALLBACK_URLS) {
      if (url === this.baseUrl) continue; // Skip if it's the same as base URL
      
      console.log(`🔄 Trying fallback URL: ${url}`);
      const result = await this.makeRequestWithTimeout<T>(url, endpoint, options);
      if (result.status !== 0) {
        console.log(`✅ Found working URL: ${url}`);
        return result;
      }
    }

    // All URLs failed
    console.log(`❌ All URLs failed for endpoint: ${endpoint}`);
    
    // Return offline mode responses for specific endpoints
    if (endpoint === API_CONFIG.ENDPOINTS.LOGIN) {
      console.log('🔄 Returning mock login response for offline mode');
      return {
        data: mockLoginResponse as T,
        status: 200,
      };
    }
    
    if (endpoint === API_CONFIG.ENDPOINTS.USERS) {
      console.log('🔄 Returning mock user data for offline mode');
      return {
        data: mockUserData as T,
        status: 200,
      };
    }

    return {
      error: `All connection attempts failed for endpoint: ${endpoint}. Please check your network connection and ensure the backend server is running.`,
      status: 0,
    };
  }
}

export const apiService = new ApiService(API_CONFIG.BASE_URL);
