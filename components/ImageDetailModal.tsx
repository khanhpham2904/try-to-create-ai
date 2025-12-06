/**
 * Image Detail Modal Component
 * Fullscreen modal for viewing image details
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ImageDetailModalProps {
  visible: boolean;
  imageUri: string | null;
  imageIsUrl?: boolean;
  onClose: () => void;
  title?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  visible,
  imageUri,
  imageIsUrl = true,
  onClose,
  title,
}) => {
  const { theme } = useTheme();

  if (!imageUri) {
    return null;
  }

  // Construct image source
  const imageSource = imageIsUrl
    ? { uri: imageUri }
    : { uri: `data:image/jpeg;base64,${imageUri}` };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar
        backgroundColor="rgba(0,0,0,0.9)"
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          {title && (
            <Text style={[styles.title, { color: '#fff' }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Image Container */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {Platform.OS === 'web' ? (
            <img
              src={imageIsUrl ? imageUri : `data:image/jpeg;base64,${imageUri}`}
              alt="Image detail"
              style={styles.webImage}
              onClick={(e) => {
                // Prevent closing modal when clicking on image
                e.stopPropagation();
              }}
            />
          ) : (
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="contain"
              onError={(error) => {
                console.error('Image load error in detail modal:', error);
              }}
            />
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon name="close" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 12 : 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 200,
    maxWidth: '100%',
    maxHeight: '100%',
  },
  webImage: {
    maxWidth: '100%',
    maxHeight: '90vh',
    objectFit: 'contain',
    cursor: 'zoom-in',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

