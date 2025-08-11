import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface SocketStatusIndicatorProps {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  socketId?: string | null;
}

export const SocketStatusIndicator: React.FC<SocketStatusIndicatorProps> = ({
  connectionStatus,
  socketId
}) => {
  const { theme } = useTheme();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return theme.colors.success;
      case 'connecting':
        return theme.colors.warning;
      case 'disconnected':
        return theme.colors.error;
      default:
        return theme.colors.error;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢 Connected';
      case 'connecting':
        return '🟡 Connecting...';
      case 'disconnected':
        return '🔴 Disconnected';
      default:
        return '🔴 Unknown';
    }
  };

  if (connectionStatus === 'connected') {
    return null; // Don't show when connected
  }

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() }]}>
      <Text style={[styles.statusText, { color: theme.colors.userMessageText }]}>
        {getStatusText()}
      </Text>
      {socketId && (
        <Text style={[styles.socketId, { color: theme.colors.userMessageText }]}>
          ID: {socketId.slice(0, 8)}...
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  socketId: {
    fontSize: 10,
    marginLeft: 8,
    opacity: 0.8,
  },
});
