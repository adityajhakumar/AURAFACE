import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Zap, TrendingUp } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [glowAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const handleCapture = () => {
    router.push('/(app)/camera' as any);
  };

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      const base64 = result.assets[0].base64;
      router.push({
        pathname: '/(app)/results' as any,
        params: { imageUri, base64: base64 || '' },
      });
    }
  };

  return (
    <LinearGradient
      colors={['#FF0080', '#7928CA', '#FF0080', '#FF4D00']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom }]}>
        <Animated.View style={[styles.glowCircle, { opacity: glowOpacity }]} />
        <Animated.View style={[styles.glowCircle2, { opacity: glowOpacity }]} />
        
        <View style={styles.header}>
          <View style={styles.iconRow}>
            <Zap color="#FFFF00" size={32} fill="#FFFF00" />
            <TrendingUp color="#00FF9F" size={32} />
          </View>
          <Text style={styles.title}>FOMO</Text>
          <Text style={styles.subtitle}>✨ SCORE CARD ✨</Text>
          <Text style={styles.tagline}>are you in the loop? 👀</Text>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            drop a selfie & find out how trending u really are 📸
          </Text>
          <Text style={styles.descriptionEmoji}>🔥💯🚀</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF0080', '#FF4D00']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Camera color="#FFFFFF" size={32} />
              <Text style={styles.buttonText}>SNAP IT 📸</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleUpload}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7928CA', '#00F5FF']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <ImageIcon color="#FFFFFF" size={28} />
              <Text style={styles.buttonText}>UPLOAD 🖼️</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.statsPreview}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>99+</Text>
            <Text style={styles.statLabel}>cards made</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>🔥</Text>
            <Text style={styles.statLabel}>trending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>💯</Text>
            <Text style={styles.statLabel}>vibes only</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative' as const,
  },
  glowCircle: {
    position: 'absolute' as const,
    top: '15%',
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FFFF00',
    shadowColor: '#FFFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
    elevation: 20,
  },
  glowCircle2: {
    position: 'absolute' as const,
    bottom: '15%',
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#00FF9F',
    shadowColor: '#00FF9F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 72,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: '#000000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 2,
    fontWeight: '700' as const,
    marginBottom: 8,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFF00',
    fontWeight: '600' as const,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    marginBottom: 40,
    paddingHorizontal: 16,
    zIndex: 1,
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    lineHeight: 26,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  descriptionEmoji: {
    fontSize: 32,
    textAlign: 'center' as const,
  },
  buttons: {
    width: '100%',
    gap: 14,
    zIndex: 1,
    marginBottom: 32,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF0080',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ rotate: '-1deg' }],
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7928CA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ rotate: '1deg' }],
  },
  statsPreview: {
    flexDirection: 'row',
    gap: 16,
    zIndex: 1,
  },
  statBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    opacity: 0.9,
  },
});
