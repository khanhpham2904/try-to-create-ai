import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  animated?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  animated = true,
  intensity = 'medium',
}) => {
  const { theme } = useTheme();
  const animationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: intensity === 'light' ? 8000 : intensity === 'medium' ? 6000 : 4000,
            useNativeDriver: false,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: intensity === 'light' ? 8000 : intensity === 'medium' ? 6000 : 4000,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();

      return () => animation.stop();
    }
  }, [animated, intensity]);

  const getBaseColors = () => {
    if (theme.type === 'dark') {
      return [
        ['#667EEA', '#764BA2', '#1A1625', '#0F0F23'],
        ['#764BA2', '#667EEA', '#0F0F23', '#1A1625'],
        ['#1A1625', '#667EEA', '#764BA2', '#0F0F23'],
      ];
    } else {
      return [
        ['#667EEA', '#764BA2', '#FFFFFF', '#FAFAFA'],
        ['#764BA2', '#667EEA', '#FAFAFA', '#FFFFFF'],
        ['#FFFFFF', '#667EEA', '#764BA2', '#FAFAFA'],
      ];
    }
  };

  const baseColors = getBaseColors();
  const opacityLevel = intensity === 'light' ? 0.3 : intensity === 'medium' ? 0.5 : 0.7;

  const ColorSet1 = theme.type === 'dark' 
    ? [
        `rgba(102,126,234,${opacityLevel})`,
        `rgba(118,75,162,${opacityLevel})`,
        `rgba(26,22,37,${opacityLevel})`,
        `rgba(15,15,35,${opacityLevel})`
      ] as [string, string, string, string, ...string[]]
    : [
        `rgba(102,126,234,${opacityLevel})`,
        `rgba(118,75,162,${opacityLevel})`,
        'rgba(255,255,255,0.9)',
        'rgba(250,250,250,0.95)'
      ] as [string, string, string, string, ...string[]];

  const ColorSet2 = theme.type === 'dark'
    ? [
        `rgba(118,75,162,${opacityLevel})`,
        `rgba(102,126,234,${opacityLevel})`,
        `rgba(15,15,35,${opacityLevel})`,
        `rgba(26,22,37,${opacityLevel})`
      ] as [string, string, string, string, ...string[]]
    : [
        `rgba(118,75,162,${opacityLevel})`,
        `rgba(102,126,234,${opacityLevel})`,
        'rgba(250,250,250,0.9)',
        'rgba(255,255,255,0.95)'
      ] as [string, string, string, string, ...string[]];

  return (
    <View style={styles.container}>
      {/* Primary Background Gradient */}
      <LinearGradient
        colors={theme.type === 'dark' 
          ? ['#0F0F23', '#1A1625', '#2D3748'] as [string, string, ...string[]]
          : ['#667EEA', '#764BA2', '#FAFAFA'] as [string, string, ...string[]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Floating Orbs */}
      {animated && (
        <>
          {/* Orb 1 */}
          <Animated.View
            style={[
              styles.floatingOrb,
              styles.orb1,
              {
                backgroundColor: animationValue.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: ColorSet1,
                }),
              },
            ]}
          />

          {/* Orb 2 */}
          <Animated.View
            style={[
              styles.floatingOrb,
              styles.orb2,
              {
                backgroundColor: animationValue.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: ColorSet2,
                }),
              },
            ]}
          />

          {/* Orb 3 */}
          <Animated.View
            style={[
              styles.floatingOrb,
              styles.orb3,
              {
                backgroundColor: animationValue.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [...ColorSet1].reverse(),
                }),
              },
            ]}
          />
        </>
      )}

      {/* Overlay Gradient for better content readability */}
      <LinearGradient
        colors={theme.type === 'dark'
          ? ['rgba(15,15,35,0.1)', 'rgba(15,15,35,0.3)', 'rgba(234,239,246,0.05)'] as [string, string, ...string[]]
          : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 'rgba(102,126,234,0.1)'] as [string, string, ...string[]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  floatingOrb: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.6,
  },
  orb1: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    top: -height * 0.3,
    left: -width * 0.2,
  },
  orb2: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    top: height * 0.2,
    right: -width * 0.15,
  },
  orb3: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    bottom: -height * 0.1,
    left: width * 0.1,
  },
});
