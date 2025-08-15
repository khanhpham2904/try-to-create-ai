import { useEffect, useState, useCallback, useRef } from 'react';
import socketService, { ChatMessage, SocketEvents } from '../services/socketService';
import { Platform } from 'react-native';

export interface UseSocketOptions {
  userId: string;
  token?: string;
  autoConnect?: boolean;
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (userId: string) => void;
  onStopTyping?: (userId: string) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export interface UseSocketReturn {
  // Connection state
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  socketId: string | null;
  
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Message methods
  sendMessage: (message: string) => void;
  sendTyping: () => void;
  sendStopTyping: () => void;
  
  // Room methods
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  
  // Event listeners
  on: <T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]) => void;
  off: <T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]) => void;
}

export const useSocket = (options: UseSocketOptions): UseSocketReturn => {
  const {
    userId,
    token,
    autoConnect = true,
    onMessage,
    onTyping,
    onStopTyping,
    onUserOnline,
    onUserOffline,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [socketId, setSocketId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = Platform.OS === 'android' ? 3 : 2;
  
  const eventListenersRef = useRef<Map<string, Function[]>>(new Map());

  // Connect to Socket.IO with retry logic
  const connect = useCallback(async (): Promise<void> => {
    try {
      setConnectionStatus('connecting');
      console.log(`🔌 [${Platform.OS}] Attempting Socket.IO connection (attempt ${retryCount + 1}/${maxRetries})`);
      
      await socketService.connect(userId, token);
      setIsConnected(true);
      setConnectionStatus('connected');
      setSocketId(socketService.getSocketId());
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error(`❌ [${Platform.OS}] Failed to connect to Socket.IO (attempt ${retryCount + 1}/${maxRetries}):`, error);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      
      // Retry logic
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`🔄 [${Platform.OS}] Retrying Socket.IO connection in ${delay}ms...`);
        
        setTimeout(() => {
          connect();
        }, delay);
      } else {
        console.log(`❌ [${Platform.OS}] Max Socket.IO retry attempts reached. Falling back to offline mode.`);
        onError?.(new Error('Socket.IO connection failed after max retries. Running in offline mode.'));
      }
    }
  }, [userId, token, onError, retryCount, maxRetries]);

  // Disconnect from Socket.IO
  const disconnect = useCallback((): void => {
    socketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setSocketId(null);
    setRetryCount(0);
  }, []);

  // Send message with fallback
  const sendMessage = useCallback((message: string): void => {
    if (isConnected) {
      socketService.sendMessage(message, userId);
    } else {
      console.log('📤 [Offline Mode] Message queued for later:', message);
      // In offline mode, you could queue messages for later
    }
  }, [userId, isConnected]);

  // Send typing indicator
  const sendTyping = useCallback((): void => {
    if (isConnected) {
      socketService.sendTyping(userId);
    }
  }, [userId, isConnected]);

  // Send stop typing indicator
  const sendStopTyping = useCallback((): void => {
    if (isConnected) {
      socketService.sendStopTyping(userId);
    }
  }, [userId, isConnected]);

  // Join room
  const joinRoom = useCallback((roomId: string): void => {
    if (isConnected) {
      socketService.joinRoom(roomId);
    }
  }, [isConnected]);

  // Leave room
  const leaveRoom = useCallback((roomId: string): void => {
    if (isConnected) {
      socketService.leaveRoom(roomId);
    }
  }, [isConnected]);

  // Add event listener
  const on = useCallback(<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, []);
    }
    eventListenersRef.current.get(event)?.push(callback as Function);
    socketService.on(event, callback);
  }, []);

  // Remove event listener
  const off = useCallback(<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void => {
    const listeners = eventListenersRef.current.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback as Function);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    socketService.off(event, callback);
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (onMessage) {
      socketService.on('chat_message', onMessage);
    }
    
    if (onTyping) {
      socketService.on('user_typing', onTyping);
    }
    
    if (onStopTyping) {
      socketService.on('user_stop_typing', onStopTyping);
    }
    
    if (onUserOnline) {
      socketService.on('user_online', onUserOnline);
    }
    
    if (onUserOffline) {
      socketService.on('user_offline', onUserOffline);
    }
    
    if (onConnect) {
      socketService.on('connect', onConnect);
    }
    
    if (onDisconnect) {
      socketService.on('disconnect', onDisconnect);
    }
    
    if (onError) {
      socketService.on('error', onError);
    }

    // Cleanup function
    return () => {
      if (onMessage) {
        socketService.off('chat_message', onMessage);
      }
      if (onTyping) {
        socketService.off('user_typing', onTyping);
      }
      if (onStopTyping) {
        socketService.off('user_stop_typing', onStopTyping);
      }
      if (onUserOnline) {
        socketService.off('user_online', onUserOnline);
      }
      if (onUserOffline) {
        socketService.off('user_offline', onUserOffline);
      }
      if (onConnect) {
        socketService.off('connect', onConnect);
      }
      if (onDisconnect) {
        socketService.off('disconnect', onDisconnect);
      }
      if (onError) {
        socketService.off('error', onError);
      }
    };
  }, [onMessage, onTyping, onStopTyping, onUserOnline, onUserOffline, onConnect, onDisconnect, onError]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }
  }, [autoConnect, userId, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { isConnected, connectionStatus, socketId, connect, disconnect, sendMessage, sendTyping, sendStopTyping, joinRoom, leaveRoom, on, off };
};
