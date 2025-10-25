import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Share2, Zap, TrendingUp, Heart, Star } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateObject } from '@rork/toolkit-sdk';
import { z } from 'zod';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

const fomoSchema = z.object({
  fomo_score: z.number().min(0).max(100).describe('FOMO score from 0-100 indicating how trending/in-the-loop they are'),
  vibe_check: z.string().describe('Short Gen Z vibe description (e.g., "main character energy", "living rent free", "no cap bussin")'),
  trending_level: z.enum(['offline', 'casual scroller', 'chronically online', 'internet legend', 'ICONIC']).describe('How chronically online they are'),
  personality_type: z.string().describe('Fun personality archetype (e.g., "The Trendsetter", "The Meme Lord", "The Group Chat MVP")'),
  aesthetic: z.string().describe('Their aesthetic vibe (e.g., "Dark Academia", "Y2K", "Cottagecore", "Hypebeast")'),
  traits: z.array(z.string()).length(4).describe('4 Gen Z traits/vibes'),
  caption: z.string().describe('Instagram-worthy caption for their vibe'),
  roast: z.string().describe('Playful friendly roast about their energy'),
});

type FOMOResult = z.infer<typeof fomoSchema>;

const SCORE_GRADIENTS = [
  ['#FF0080', '#FF4D00'] as const,
  ['#7928CA', '#00F5FF'] as const,
  ['#00FF9F', '#FFFF00'] as const,
  ['#FF0080', '#7928CA', '#00F5FF'] as const,
];

function getGradientForScore(score: number): readonly [string, string] | readonly [string, string, string] {
  if (score >= 90) return SCORE_GRADIENTS[3];
  if (score >= 70) return SCORE_GRADIENTS[2];
  if (score >= 50) return SCORE_GRADIENTS[1];
  return SCORE_GRADIENTS[0];
}

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { imageUri, base64 } = params;

  const [result, setResult] = useState<FOMOResult | null>(null);
  const cardRef = useRef<View>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  useEffect(() => {
    analyzeFOMO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Share Your Score Card 📸',
          'Screenshot this page to share your FOMO score with friends! 🔥',
          [
            {
              text: 'Got it! 💯',
              style: 'default',
            },
          ]
        );
        return;
      }

      if (!cardRef.current) {
        Alert.alert('Error', 'Could not capture score card. Please try again.');
        return;
      }

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });

      console.log('Captured score card:', uri);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your FOMO Score Card 🔥',
        });
      } else {
        Alert.alert('Saved! ✨', 'Your score card has been saved!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(
        'Oops! 😅',
        'Something went wrong while sharing. Try screenshotting instead! 📸'
      );
    }
  }

  async function analyzeFOMO() {
    if (!base64) {
      setError('No image data available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Starting FOMO analysis...');

      const imageBase64 = typeof base64 === 'string' ? base64 : base64[0];
      
      if (!imageBase64) {
        throw new Error('Image data is empty');
      }

      const imageData = `data:image/jpeg;base64,${imageBase64}`;

      console.log('Sending image to AI model...');

      const analysisResult = await generateObject({
        schema: fomoSchema,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a Gen Z AI that analyzes selfies and creates FOMO Score Cards - determining how "in the loop" and trending someone is based on their vibe.

Analyze this person's face and give them:
1. A FOMO score (0-100) - how trendy/chronically online/main character energy they have
2. A vibe check using Gen Z slang (be creative: "main character energy", "living rent free", "no cap bussin", "it's giving iconic", etc.)
3. Their trending level: offline, casual scroller, chronically online, internet legend, or ICONIC
4. A personality archetype (The Trendsetter, The Meme Lord, Group Chat MVP, The Influencer, The Lurker, etc.)
5. Their aesthetic (Dark Academia, Y2K, Cottagecore, Streetwear, Clean Girl, etc.)
6. 4 personality traits using Gen Z language and emojis
7. An Instagram-worthy caption for their vibe
8. A playful, friendly roast about their energy (keep it fun, not mean)

Be creative, bold, and use lots of Gen Z slang. Make it feel authentic to internet culture and meme language. Be specific based on their facial expression, style, and energy.`,
              },
              {
                type: 'image',
                image: imageData,
              },
            ],
          },
        ],
      });

      console.log('FOMO analysis result:', analysisResult);
      setResult(analysisResult);
    } catch (err: any) {
      console.error('Error analyzing FOMO:', err);
      
      let errorMessage = 'something went wrong... try again? 🥺';
      
      if (err?.message) {
        if (err.message.includes('JSON')) {
          errorMessage = 'AI service is having a moment... try again in a sec 💫';
        } else if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = 'check ur connection bestie 📶';
        } else if (err.message.includes('rate limit')) {
          errorMessage = 'too many requests rn... chill for a sec ⏰';
        } else {
          errorMessage = `error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const gradientColors = result
    ? getGradientForScore(result.fomo_score)
    : SCORE_GRADIENTS[0];

  if (loading) {
    return (
      <LinearGradient colors={gradientColors} style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Zap color="#FFFF00" size={80} fill="#FFFF00" />
          </Animated.View>
          <Text style={styles.loadingTitle}>calculating ur FOMO score... 👀</Text>
          <Text style={styles.loadingSubtitle}>
            🔥 analyzing ur vibe check 💯
          </Text>
          <ActivityIndicator
            size="large"
            color="#ffffff"
            style={{ marginTop: 32 }}
          />
        </View>
      </LinearGradient>
    );
  }

  if (error || !result) {
    return (
      <LinearGradient colors={['#1a0033', '#2d1b4e']} style={styles.container}>
        <View style={[styles.errorContainer, { paddingTop: insets.top + 40 }]}>
          <Text style={styles.errorTitle}>oof that flopped 😭</Text>
          <Text style={styles.errorMessage}>
            {error || 'couldn\'t generate ur score card rn'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>run it back 🔁</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#1A1A1A']} style={styles.backgroundGradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Share2 color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>

          <View ref={cardRef} collapsable={false}>
            <LinearGradient
              colors={gradientColors}
              style={styles.scoreCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>FOMO SCORE CARD</Text>
                <View style={styles.iconRow}>
                  <Zap color="#FFFF00" size={20} fill="#FFFF00" />
                  <TrendingUp color="#FFFFFF" size={20} />
                </View>
              </View>

              {imageUri && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: typeof imageUri === 'string' ? imageUri : imageUri[0] }}
                    style={styles.profileImage}
                  />
                  <View style={styles.imageBorder} />
                </View>
              )}

              <View style={styles.scoreSection}>
                <Text style={styles.scoreLabel}>YOUR SCORE</Text>
                <Text style={styles.scoreNumber}>{result.fomo_score}</Text>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreBarFill, { width: `${result.fomo_score}%` }]} />
                </View>
                <Text style={styles.trendingLevel}>{result.trending_level}</Text>
              </View>

              <View style={styles.vibeSection}>
                <Text style={styles.vibeCheck}>&ldquo;{result.vibe_check}&rdquo;</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoBox}>
                  <Star color="#FFFF00" size={20} fill="#FFFF00" />
                  <Text style={styles.infoLabel}>PERSONALITY</Text>
                  <Text style={styles.infoValue}>{result.personality_type}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Heart color="#FF0080" size={20} fill="#FF0080" />
                  <Text style={styles.infoLabel}>AESTHETIC</Text>
                  <Text style={styles.infoValue}>{result.aesthetic}</Text>
                </View>
              </View>

              <View style={styles.traitsSection}>
                <Text style={styles.traitsTitle}>VIBES</Text>
                <View style={styles.traitsGrid}>
                  {result.traits.map((trait, index) => (
                    <View key={index} style={styles.traitBadge}>
                      <Text style={styles.traitText}>{trait}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.captionSection}>
                <Text style={styles.captionLabel}>CAPTION</Text>
                <Text style={styles.captionText}>{result.caption}</Text>
              </View>

              <View style={styles.roastSection}>
                <Text style={styles.roastLabel}>🔥 ROAST 🔥</Text>
                <Text style={styles.roastText}>{result.roast}</Text>
              </View>

              <View style={styles.watermark}>
                <Text style={styles.watermarkText}>FOMO SCORE CARD</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <LinearGradient
                colors={['#FF0080', '#FF4D00']}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Share2 color="#FFFFFF" size={24} />
                <Text style={styles.actionButtonText}>SHARE 🚀</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/' as any)}
            >
              <LinearGradient
                colors={['#7928CA', '#00F5FF']}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Zap color="#FFFFFF" size={24} fill="#FFFFFF" />
                <Text style={styles.actionButtonText}>MAKE ANOTHER 🔁</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginTop: 32,
    textAlign: 'center' as const,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 12,
    textAlign: 'center' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#d8b4fe',
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  backButton: {
    position: 'absolute' as const,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative' as const,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageGlow: {
    position: 'absolute' as const,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 10,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    gap: 24,
  },
  auraColorSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#8b5cf6',
    letterSpacing: 2,
    marginBottom: 8,
  },
  auraColor: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1a0033',
    textTransform: 'capitalize' as const,
  },
  summarySection: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  summary: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: '#2d1b4e',
    textAlign: 'center' as const,
    lineHeight: 28,
    fontStyle: 'italic' as const,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#8b5cf6',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  emotionalState: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: '#2d1b4e',
    textTransform: 'capitalize' as const,
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitPill: {
    backgroundColor: '#e9d5ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  traitText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b21a8',
    textTransform: 'capitalize' as const,
  },
  energyDescription: {
    fontSize: 16,
    color: '#4a2c6b',
    lineHeight: 24,
  },
  adviceSection: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#f3e8ff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  adviceText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#5b21b6',
    lineHeight: 24,
    fontStyle: 'italic' as const,
  },
  analyzeButton: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scoreCard: {
    marginBottom: 24,
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imageBorder: {
    position: 'absolute' as const,
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  scoreSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
    opacity: 0.9,
  },
  scoreNumber: {
    fontSize: 80,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
    marginBottom: 12,
  },
  scoreBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  trendingLevel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFF00',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  vibeSection: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    marginBottom: 20,
  },
  vibeCheck: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    lineHeight: 28,
    fontStyle: 'italic' as const,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
    opacity: 0.8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  traitsSection: {
    marginBottom: 20,
  },
  traitsTitle: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 12,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captionSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  captionLabel: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#FFFF00',
    letterSpacing: 1,
    marginBottom: 8,
  },
  captionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    lineHeight: 24,
    fontStyle: 'italic' as const,
  },
  roastSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF0080',
  },
  roastLabel: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  roastText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    lineHeight: 22,
    textAlign: 'center' as const,
  },
  watermark: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  watermarkText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
