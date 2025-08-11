import { io, Socket } from 'socket.io-client';
import { API_CONFIG, FALLBACK_URLS } from '../constants/config';
import { Platform } from 'react-native';

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

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventListeners: Map<string, Function[]> = new Map();
  private messageQueue: any[] = [];
  private workingUrl: string | null = null;

  constructor() {
    console.log('🔌 SocketService initialized');
  }

  // Get Socket.IO URL with proper endpoint
  private getSocketUrl(baseUrl: string): string {
    // Remove trailing slash if present
    const cleanUrl = baseUrl.replace(/\/$/, '');
    // Add Socket.IO endpoint
    return `${cleanUrl}/socket.io`;
  }

  // Connect to Socket.IO server with fallback URLs
  connect(userId: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Attempting Socket.IO connection...');
        
        // Try working URL first, then fallbacks
        const urlsToTry = [API_CONFIG.SOCKET_URL, ...FALLBACK_URLS];
        
        for (const baseUrl of urlsToTry) {
          const socketUrl = this.getSocketUrl(baseUrl);
          console.log(`🔌 Trying Socket.IO URL: ${socketUrl}`);
          
          try {
            // Create socket connection with Android-specific options
            this.socket = io(socketUrl, {
              transports: Platform.OS === 'android' ? ['websocket'] : ['websocket', 'polling'],
              auth: {
                token: token || 'anonymous',
                userId: userId
              },
              timeout: Platform.OS === 'android' ? 15000 : 10000,
              reconnection: true,
              reconnectionAttempts: this.maxReconnectAttempts,
              reconnectionDelay: this.reconnectDelay,
              reconnectionDelayMax: 5000,
              forceNew: true,
              // Android-specific options
              ...(Platform.OS === 'android' ? {
                upgrade: true,
                rememberUpgrade: true,
                secure: false,
              } : {}),
            });

            // Connection event handlers
            this.socket.on('connect', () => {
              console.log('✅ Socket.IO connected successfully to:', socketUrl);
              this.isConnected = true;
              this.reconnectAttempts = 0;
              this.workingUrl = baseUrl;
              this.flushMessageQueue();
              this.emit('user_online', { userId });
              this.triggerEvent('connect');
              resolve();
              return; // Success, exit the loop
            });

            this.socket.on('disconnect', (reason) => {
              console.log('❌ Socket.IO disconnected:', reason);
              this.isConnected = false;
              this.triggerEvent('disconnect');
              
              if (reason === 'io server disconnect') {
                // Server disconnected us, try to reconnect
                this.socket?.connect();
              }
            });

            this.socket.on('connect_error', (error) => {
              console.error('❌ Socket.IO connection error for:', socketUrl, error);
              this.isConnected = false;
              this.triggerEvent('error', error);
              
              // Try next URL if this one fails
              if (baseUrl === urlsToTry[urlsToTry.length - 1]) {
                // Last URL failed, reject
                reject(new Error(`All Socket.IO URLs failed. Last error: ${error.message}`));
              }
            });

            // Chat message events
            this.socket.on('chat_message', (message: ChatMessage) => {
              console.log('📨 Received chat message:', message);
              this.triggerEvent('chat_message', message);
            });

            this.socket.on('user_typing', (userId: string) => {
              console.log('⌨️ User typing:', userId);
              this.triggerEvent('user_typing', userId);
            });

            this.socket.on('user_stop_typing', (userId: string) => {
              console.log('⏹️ User stopped typing:', userId);
              this.triggerEvent('user_stop_typing', userId);
            });

            this.socket.on('user_online', (userId: string) => {
              console.log('🟢 User online:', userId);
              this.triggerEvent('user_online', userId);
            });

            this.socket.on('user_offline', (userId: string) => {
              console.log('🔴 User offline:', userId);
              this.triggerEvent('user_offline', userId);
            });

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

  // Disconnect from Socket.IO server
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

  // Emit event to server
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

  // Send chat message
  sendMessage(message: string, userId: string): void {
    this.emit('chat_message', {
      message,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Send typing indicator
  sendTyping(userId: string): void {
    this.emit('user_typing', { userId });
  }

  // Send stop typing indicator
  sendStopTyping(userId: string): void {
    this.emit('user_stop_typing', { userId });
  }

  // Join chat room
  joinRoom(roomId: string): void {
    this.emit('join_room', { roomId });
  }

  // Leave chat room
  leaveRoom(roomId: string): void {
    this.emit('leave_room', { roomId });
  }

  // Add event listener
  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback as Function);
  }

  // Remove event listener
  off<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback as Function);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Trigger event for local listeners
  private triggerEvent(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
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

  // Flush queued messages
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift()!;
      this.emit(event, data);
    }
  }

  // Get connection status
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }

  // Check if connected
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Get socket ID
  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

// Create singleton instance
export const socketService = new SocketService();
export default socketService;
