import { io, Socket } from 'socket.io-client';
import { API_CONFIG, FALLBACK_URLS } from '../constants/config';
import { Platform } from 'react-native';
import { 
  getSocketConfig, 
  getSocketOptions, 
  NETWORK_ERROR_MESSAGES,
  URL_UTILS,
  DEBUG_CONFIG,
  NetworkConfig
} from '../constants/networkConfig';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  response: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface SocketEvents {
  'chat_message': (message: ChatMessage) => void;
  'user_typing': (userId: string) => void;
  'user_stop_typing': (userId: string) => void;
  'user_online': (userId: string) => void;
  'user_offline': (userId: string) => void;
  'connect': () => void;
  'disconnect': () => void;
  'error': (error: any) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

class SocketUtils {
  static getSocketUrl(baseUrl: string): string {
    return URL_UTILS.getSocketUrl(baseUrl);
  }

  static createSocketConnection(socketUrl: string, token: string, userId: string): Socket {
    console.log(`🔌 Creating Socket.IO connection to: ${socketUrl}`);
    return io(socketUrl, getSocketOptions(token, userId));
  }

  static handleConnectionSuccess(
    socket: Socket, 
    socketUrl: string, 
    userId: string,
    onSuccess: (baseUrl: string) => void
  ): void {
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully to:', socketUrl);
      const baseUrl = socketUrl.replace('/socket.io', '');
      onSuccess(baseUrl);
    });
  }

  static handleConnectionError(
    socket: Socket, 
    socketUrl: string,
    onError: (error: any) => void
  ): void {
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error for:', socketUrl, error);
      onError(error);
    });
  }

  static handleDisconnection(
    socket: Socket,
    onDisconnect: () => void
  ): void {
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      onDisconnect();
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        socket.connect();
      }
    });
  }

  static setupChatEvents(
    socket: Socket,
    eventListeners: Map<string, Function[]>
  ): void {
    // Chat message events
    socket.on('chat_message', (message: ChatMessage) => {
      console.log('📨 Received chat message:', message);
      SocketUtils.triggerEvent(eventListeners, 'chat_message', message);
    });

    socket.on('user_typing', (userId: string) => {
      console.log('⌨️ User typing:', userId);
      SocketUtils.triggerEvent(eventListeners, 'user_typing', userId);
    });

    socket.on('user_stop_typing', (userId: string) => {
      console.log('⏹️ User stopped typing:', userId);
      SocketUtils.triggerEvent(eventListeners, 'user_stop_typing', userId);
    });

    socket.on('user_online', (userId: string) => {
      console.log('🟢 User online:', userId);
      SocketUtils.triggerEvent(eventListeners, 'user_online', userId);
    });

    socket.on('user_offline', (userId: string) => {
      console.log('🔴 User offline:', userId);
      SocketUtils.triggerEvent(eventListeners, 'user_offline', userId);
    });
  }

  static triggerEvent(eventListeners: Map<string, Function[]>, event: string, data?: any): void {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// ============================================================================
// SOCKET SERVICE
// ============================================================================

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private eventListeners: Map<string, Function[]> = new Map();
  private messageQueue: Array<{ event: string; data?: any }> = [];
  private workingUrl: string | null = null;
  private config: NetworkConfig;

  constructor() {
    this.config = getSocketConfig();
    console.log('🔌 SocketService initialized');
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  connect(userId: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Attempting Socket.IO connection...');
        
        // Try working URL first, then fallbacks
        const urlsToTry = [API_CONFIG.SOCKET_URL, ...FALLBACK_URLS];
        
        for (const baseUrl of urlsToTry) {
          const socketUrl = SocketUtils.getSocketUrl(baseUrl);
          console.log(`🔌 Trying Socket.IO URL: ${socketUrl}`);
          
          try {
            // Create socket connection
            this.socket = SocketUtils.createSocketConnection(socketUrl, token || 'anonymous', userId);

            // Setup connection event handlers
            SocketUtils.handleConnectionSuccess(
              this.socket, 
              socketUrl, 
              userId,
              (workingBaseUrl) => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.workingUrl = workingBaseUrl;
                this.flushMessageQueue();
                this.emit('user_online', { userId });
                SocketUtils.triggerEvent(this.eventListeners, 'connect');
                resolve();
              }
            );

            SocketUtils.handleConnectionError(
              this.socket, 
              socketUrl,
              (error) => {
                this.isConnected = false;
                SocketUtils.triggerEvent(this.eventListeners, 'error', error);
                
                // Try next URL if this one fails
                if (baseUrl === urlsToTry[urlsToTry.length - 1]) {
                  // Last URL failed, reject
                  reject(new Error(`${NETWORK_ERROR_MESSAGES.SOCKET_CONNECTION_FAILED} Last error: ${error.message}`));
                }
              }
            );

            SocketUtils.handleDisconnection(
              this.socket,
              () => {
                this.isConnected = false;
                SocketUtils.triggerEvent(this.eventListeners, 'disconnect');
              }
            );

            // Setup chat events
            SocketUtils.setupChatEvents(this.socket, this.eventListeners);

            // If we get here, the connection was successful
            break;

          } catch (error) {
            console.error('❌ Failed to create Socket.IO connection for:', socketUrl, error);
            if (baseUrl === urlsToTry[urlsToTry.length - 1]) {
              reject(error);
            }
          }
        }

      } catch (error) {
        console.error('❌ Socket.IO connection failed:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    console.log('🔌 Disconnecting Socket.IO...');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.messageQueue = [];
    this.reconnectAttempts = 0;
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  emit(event: string, data?: any): void {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit(event, data);
        console.log(`📤 Emitted ${event}:`, data);
      } catch (error) {
        console.error(`❌ Failed to emit ${event}:`, error);
      }
    } else {
      // Queue message for later if not connected
      this.messageQueue.push({ event, data });
      console.log(`📦 Queued ${event}, waiting for connection`);
    }
  }

  sendMessage(message: string, userId: string): void {
    this.emit('chat_message', {
      message,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  sendTyping(userId: string): void {
    this.emit('user_typing', { userId });
  }

  sendStopTyping(userId: string): void {
    this.emit('user_stop_typing', { userId });
  }

  joinRoom(roomId: string): void {
    this.emit('join_room', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.emit('leave_room', { roomId });
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback as Function);
  }

  off<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback as Function);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift()!;
      this.emit(event, data);
    }
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

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

export const socketService = new SocketService();
export default socketService;
