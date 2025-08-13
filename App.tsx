import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { 
  View, 
  Text, 
  Alert, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';

// Import screens
import CreateJournalEntryScreen from './src/screens/CreateJournalEntryScreen';
import UnifiedHistoryScreen from './src/screens/UnifiedHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Enhanced Day Detail Screen Component
const EnhancedDayDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { day } = route.params as any;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTimeBlock = (date: Date) => {
    const hours = date.getHours();
    if (hours < 12) return 'Morning';
    if (hours < 17) return 'Afternoon';
    return 'Evening';
  };

  const getMoodDescription = (average: number) => {
    if (average >= 8) return '😊 Great day';
    if (average >= 6) return '🙂 Good day';
    if (average >= 4) return '😐 Okay day';
    return '😞 Tough day';
  };

  // Group entries by time block
  const groupedEntries = day.entries.reduce((acc: any, entry: any) => {
    const timeBlock = getTimeBlock(entry.time);
    if (!acc[timeBlock]) {
      acc[timeBlock] = [];
    }
    acc[timeBlock].push(entry);
    return acc;
  }, {});

  const timeBlocks = ['Morning', 'Afternoon', 'Evening'];

  return (
    <SafeAreaView style={detailStyles.container}>
      <TouchableOpacity 
        style={detailStyles.backNav}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#667eea" />
        <Text style={detailStyles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={detailStyles.header}>
        <Text style={detailStyles.dateTitle}>
          {day.date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </Text>
        <View style={detailStyles.dayStats}>
          <Text style={detailStyles.statItem}>{day.entries.length} entries</Text>
          <Text style={detailStyles.statDivider}>•</Text>
          <Text style={detailStyles.statItem}>{day.stats.words} words</Text>
          <Text style={detailStyles.statDivider}>•</Text>
          <Text style={detailStyles.statItem}>{getMoodDescription(day.moodAverage)}</Text>
        </View>
      </View>

      <ScrollView 
        style={detailStyles.scrollView}
        contentContainerStyle={detailStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {timeBlocks.map((timeBlock) => {
          const entries = groupedEntries[timeBlock];
          if (!entries) return null;

          return (
            <View key={timeBlock} style={detailStyles.timeBlock}>
              <Text style={detailStyles.timeLabel}>{timeBlock.toUpperCase()}</Text>
              
              {entries.map((entry: any) => (
                <View key={entry.id} style={detailStyles.entryCard}>
                  <View style={detailStyles.entryHeader}>
                    <Text style={detailStyles.entryTime}>{formatTime(entry.time)}</Text>
                    <Text style={detailStyles.entryMood}>{entry.mood}</Text>
                  </View>

                  <View style={detailStyles.entryContent}>
                    <Text style={detailStyles.entryTitle}>{entry.title}</Text>
                    <Text style={detailStyles.entryText}>{entry.content}</Text>
                  </View>

                  {/* AI Tags Section */}
                  {entry.autoTags && entry.autoTags.length > 0 && (
                    <View style={detailStyles.tagsSection}>
                      <View style={detailStyles.tagsHeader}>
                        <Ionicons name="pricetags" size={14} color="#667eea" />
                        <Text style={detailStyles.tagsLabel}>AI Tags</Text>
                      </View>
                      <View style={detailStyles.tagsContainer}>
                        {entry.autoTags.map((tag: string, index: number) => (
                          <View key={index} style={detailStyles.tag}>
                            <Text style={detailStyles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* AI Analysis Section */}
                  {entry.aiAnalysis && (
                    <View style={detailStyles.aiAnalysisSection}>
                      <View style={detailStyles.aiAnalysisHeader}>
                        <Ionicons name="bulb" size={14} color="#667eea" />
                        <Text style={detailStyles.aiAnalysisLabel}>AI Analysis</Text>
                      </View>
                      
                      {entry.aiAnalysis.emotions && entry.aiAnalysis.emotions.length > 0 && (
                        <View style={detailStyles.analysisRow}>
                          <Text style={detailStyles.analysisRowLabel}>Emotions:</Text>
                          <Text style={detailStyles.analysisRowText}>
                            {entry.aiAnalysis.emotions.join(', ')}
                          </Text>
                        </View>
                      )}
                      
                      {entry.aiAnalysis.themes && entry.aiAnalysis.themes.length > 0 && (
                        <View style={detailStyles.analysisRow}>
                          <Text style={detailStyles.analysisRowLabel}>Themes:</Text>
                          <Text style={detailStyles.analysisRowText}>
                            {entry.aiAnalysis.themes.join(', ')}
                          </Text>
                        </View>
                      )}
                      
                      <View style={detailStyles.analysisRow}>
                        <Text style={detailStyles.analysisRowLabel}>Sentiment:</Text>
                        <Text style={[
                          detailStyles.analysisRowText,
                          { color: entry.aiAnalysis.sentimentScore > 0.2 ? '#4CAF50' : 
                                   entry.aiAnalysis.sentimentScore < -0.2 ? '#F44336' : '#FF9800' }
                        ]}>
                          {entry.aiAnalysis.sentiment} ({entry.aiAnalysis.sentimentScore.toFixed(2)})
                        </Text>
                      </View>

                      {entry.aiAnalysis.insights && entry.aiAnalysis.insights.length > 0 && (
                        <View style={detailStyles.insightsContainer}>
                          <Text style={detailStyles.analysisRowLabel}>Insights:</Text>
                          {entry.aiAnalysis.insights.map((insight: string, index: number) => (
                            <Text key={index} style={detailStyles.insightText}>• {insight}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {entry.attachments && entry.attachments.length > 0 && (
                    <View style={detailStyles.attachments}>
                      {entry.type === 'voice' && (
                        <View style={detailStyles.attachmentPreview}>
                          <Text style={detailStyles.attachmentIcon}>🎙</Text>
                        </View>
                      )}
                      {entry.attachments.filter((a: string) => a.includes('photo')).map((photo: string, idx: number) => (
                        <View key={idx} style={detailStyles.attachmentPreview}>
                          <Text style={detailStyles.attachmentIcon}>📷</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

// Import types
import { Entry } from './src/types/journal';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const STORAGE_KEY = '@journal_entries';
const APP_STATE_KEY = '@app_state';

// Enhanced types for AI analysis
export interface AIAnalysis {
  emotions: string[];
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // -1 to 1
  keywords: string[];
  themes: string[];
  activities: string[];
  people: string[];
  locations: string[];
  summary: string;
  insights: string[];
  suggestedTags: string[];
  confidence: number; // 0 to 1
  analysisVersion: string;
}

export interface EnhancedEntry extends Entry {
  aiAnalysis?: AIAnalysis;
  autoTags: string[];
  analysisStatus: 'pending' | 'completed' | 'failed';
  updatedAt: number;
}

interface AppState {
  showDummyData: boolean; // Default changed to false
  lastAnalysisSync: number;
  openaiApiKey?: string;
  analysisEnabled: boolean;
  swipeGesturesEnabled: boolean;
}

// OpenAI Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// History Stack Navigator with unified screen
function HistoryStack({ 
  entries, 
  appState, 
  onToggleDummyData, 
  onAnalyzeEntry 
}: { 
  entries: EnhancedEntry[];
  appState: AppState;
  onToggleDummyData: () => void;
  onAnalyzeEntry: (entryId: string) => Promise<void>;
}) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UnifiedHistory">
        {(props) => (
          <UnifiedHistoryScreen 
            {...props} 
            entries={entries}
            showDummyData={appState.showDummyData}
            onToggleDummyData={onToggleDummyData}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="DayDetail" component={EnhancedDayDetailScreen} />
      <Stack.Screen name="Settings">
        {(props) => (
          <SettingsScreen 
            {...props}
            appState={appState}
            onToggleAnalysis={() => {}}
            onToggleDummyData={onToggleDummyData}
            onToggleSwipeGestures={() => {}}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Analytics screen with AI insights
function AnalyticsScreen({ entries }: { entries: EnhancedEntry[] }) {
  const analyzedEntries = entries.filter(entry => entry.aiAnalysis);
  
  const getOverallSentiment = () => {
    if (analyzedEntries.length === 0) return 0;
    const total = analyzedEntries.reduce((sum, entry) => 
      sum + (entry.aiAnalysis?.sentimentScore || 0), 0);
    return total / analyzedEntries.length;
  };

  const getMostCommonEmotions = () => {
    const emotions = analyzedEntries.flatMap(entry => entry.aiAnalysis?.emotions || []);
    const frequency = emotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const overallSentiment = getOverallSentiment();
  const topEmotions = getMostCommonEmotions();

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fafafa',
      padding: 24
    }}>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: '700', 
        color: '#1d1d1f', 
        marginBottom: 8 
      }}>
        AI Analytics
      </Text>
      
      {analyzedEntries.length > 0 ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#86868b', marginBottom: 20 }}>
            Based on {analyzedEntries.length} analyzed entries
          </Text>
          
          <View style={{ marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              Overall Sentiment: {overallSentiment > 0.2 ? '😊' : overallSentiment < -0.2 ? '😞' : '😐'}
            </Text>
            <Text style={{ color: '#86868b' }}>
              Score: {overallSentiment.toFixed(2)} (-1 to 1)
            </Text>
          </View>

          {topEmotions.length > 0 && (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
                Top Emotions
              </Text>
              {topEmotions.map(([emotion, count]) => (
                <Text key={emotion} style={{ color: '#86868b', marginBottom: 4 }}>
                  {emotion}: {count} times
                </Text>
              ))}
            </View>
          )}
        </View>
      ) : (
        <Text style={{ 
          fontSize: 16, 
          color: '#86868b',
          textAlign: 'center'
        }}>
          No AI analysis data yet.{'\n'}Create entries to see insights.
        </Text>
      )}
    </View>
  );
}

export default function App() {
  const [entries, setEntries] = useState<EnhancedEntry[]>([]);
  const [appState, setAppState] = useState<AppState>({
    showDummyData: false, // Changed default to false (production data)
    lastAnalysisSync: 0,
    analysisEnabled: true,
    swipeGesturesEnabled: true,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    loadPersistedData();
  }, []);

  // Persist data whenever state changes
  useEffect(() => {
    persistAppState();
  }, [appState]);

  useEffect(() => {
    persistEntries();
  }, [entries]);

  const loadPersistedData = async () => {
    try {
      // Load entries
      const storedEntries = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        // Ensure entries have enhanced fields
        const enhancedEntries = parsedEntries.map((entry: any) => ({
          ...entry,
          autoTags: entry.autoTags || [],
          analysisStatus: entry.analysisStatus || 'pending',
          updatedAt: entry.updatedAt || Date.now(),
        }));
        setEntries(enhancedEntries);
      }

      // Load app state
      const storedAppState = await AsyncStorage.getItem(APP_STATE_KEY);
      if (storedAppState) {
        const parsedAppState = JSON.parse(storedAppState);
        setAppState(prevState => ({ ...prevState, ...parsedAppState }));
      }
    } catch (error) {
      console.error('Failed to load persisted data:', error);
    }
  };

  const persistEntries = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to persist entries:', error);
    }
  };

  const persistAppState = async () => {
    try {
      await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
    } catch (error) {
      console.error('Failed to persist app state:', error);
    }
  };

  // OpenAI Analysis Functions
  const analyzeEntryWithOpenAI = async (content: string, title?: string): Promise<AIAnalysis> => {
    const apiKey = appState.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
    You are an expert journal analyst specializing in emotional intelligence and psychological insights. Analyze the following journal entry and provide a comprehensive analysis in JSON format.

    Journal Entry:
    Title: "${title || 'Untitled'}"
    Content: "${content}"

    Please analyze this journal entry and return ONLY a valid JSON object with the following structure (no additional text or markdown):

    {
      "emotions": ["array", "of", "detected", "emotions"],
      "topics": ["array", "of", "main", "topics"],
      "sentiment": "positive|negative|neutral",
      "sentimentScore": number_between_-1_and_1,
      "keywords": ["array", "of", "key", "words"],
      "themes": ["array", "of", "deeper", "themes"],
      "activities": ["array", "of", "activities", "mentioned"],
      "people": ["array", "of", "people", "mentioned"],
      "locations": ["array", "of", "places", "mentioned"],
      "summary": "brief_one_sentence_summary",
      "insights": ["array", "of", "psychological", "insights"],
      "suggestedTags": ["array", "of", "relevant", "tags", "for", "categorization"],
      "confidence": number_between_0_and_1,
      "analysisVersion": "v1.0"
    }

    Instructions:
    - Emotions: Detect nuanced emotional states beyond basic emotions (e.g., "contemplative", "nostalgic", "empowered")
    - Topics: Identify main subjects (work, relationships, health, personal-growth, etc.)
    - Sentiment: Overall emotional tone with precise score (-1 very negative to 1 very positive)
    - Keywords: 5-10 most important words that capture the essence
    - Themes: Deeper psychological or life themes (resilience, self-discovery, etc.)
    - Activities: Any actions, events, or activities mentioned
    - People: Any people referenced (use generic terms like "friend", "colleague", not names)
    - Locations: Any places mentioned (use generic terms when appropriate)
    - Summary: One clear, insightful sentence summarizing the entry
    - Insights: 2-4 thoughtful psychological observations about the person's state
    - SuggestedTags: 5-8 relevant tags for categorization and pattern analysis
    - Confidence: How confident you are in this analysis (0.0 to 1.0)

    Focus on psychological depth, emotional intelligence, and meaningful categorization for long-term pattern analysis.
    `;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional journal analyst specializing in psychological insights and emotional intelligence. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0]?.message?.content;

      if (!analysisText) {
        throw new Error('No analysis returned from OpenAI');
      }

      // Clean and parse the JSON response
      const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleanedText);
      
      // Validate and sanitize the response
      return {
        emotions: Array.isArray(analysis.emotions) ? analysis.emotions : [],
        topics: Array.isArray(analysis.topics) ? analysis.topics : [],
        sentiment: ['positive', 'negative', 'neutral'].includes(analysis.sentiment) ? analysis.sentiment : 'neutral',
        sentimentScore: typeof analysis.sentimentScore === 'number' ? 
          Math.max(-1, Math.min(1, analysis.sentimentScore)) : 0,
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
        themes: Array.isArray(analysis.themes) ? analysis.themes : [],
        activities: Array.isArray(analysis.activities) ? analysis.activities : [],
        people: Array.isArray(analysis.people) ? analysis.people : [],
        locations: Array.isArray(analysis.locations) ? analysis.locations : [],
        summary: typeof analysis.summary === 'string' ? analysis.summary : 'No summary available',
        insights: Array.isArray(analysis.insights) ? analysis.insights : [],
        suggestedTags: Array.isArray(analysis.suggestedTags) ? analysis.suggestedTags : [],
        confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
        analysisVersion: analysis.analysisVersion || 'v1.0',
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid JSON response from OpenAI');
    }
  };

  const performFallbackAnalysis = (content: string, title?: string): AIAnalysis => {
    const text = (content + ' ' + (title || '')).toLowerCase();
    
    // Basic sentiment analysis
    const positiveWords = ['good', 'great', 'amazing', 'wonderful', 'excellent', 'love', 'like', 'enjoy', 'happy', 'glad', 'excited', 'grateful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed', 'stressed', 'worried'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let sentimentScore = 0;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      sentimentScore = Math.min(0.8, positiveCount * 0.15);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      sentimentScore = -Math.min(0.8, negativeCount * 0.15);
    }

    // Extract basic information
    const words = content.split(/\s+/).filter(word => word.length > 3);
    const keywords = words.slice(0, 8);
    
    const summary = content.split(/[.!?]+/)[0]?.trim() + '...' || 'No summary available';
    
    return {
      emotions: sentiment === 'positive' ? ['positive'] : sentiment === 'negative' ? ['negative'] : ['neutral'],
      topics: ['general'],
      sentiment,
      sentimentScore,
      keywords,
      themes: ['daily-life'],
      activities: [],
      people: [],
      locations: [],
      summary,
      insights: ['Basic analysis - OpenAI unavailable'],
      suggestedTags: [sentiment, 'journal-entry'],
      confidence: 0.3,
      analysisVersion: 'fallback-v1.0',
    };
  };

  const analyzeEntry = async (entryId: string): Promise<void> => {
    const entryIndex = entries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return;

    const entry = entries[entryIndex];
    if (entry.analysisStatus === 'completed') return;

    // Update status to pending
    const updatedEntries = [...entries];
    updatedEntries[entryIndex] = { 
      ...entry, 
      analysisStatus: 'pending' as const 
    };
    setEntries(updatedEntries);

    try {
      let analysis: AIAnalysis;
      
      if (appState.analysisEnabled) {
        try {
          analysis = await analyzeEntryWithOpenAI(
            entry.text || entry.content || '', 
            entry.title
          );
        } catch (openaiError) {
          console.warn('OpenAI analysis failed, using fallback:', openaiError);
          analysis = performFallbackAnalysis(
            entry.text || entry.content || '', 
            entry.title
          );
        }
      } else {
        analysis = performFallbackAnalysis(
          entry.text || entry.content || '', 
          entry.title
        );
      }

      // Update entry with analysis
      const finalEntries = [...entries];
      finalEntries[entryIndex] = {
        ...finalEntries[entryIndex],
        aiAnalysis: analysis,
        autoTags: analysis.suggestedTags,
        analysisStatus: 'completed' as const,
        updatedAt: Date.now(),
      };
      setEntries(finalEntries);

    } catch (error) {
      console.error('Analysis failed:', error);
      
      // Update status to failed
      const failedEntries = [...entries];
      failedEntries[entryIndex] = { 
        ...failedEntries[entryIndex], 
        analysisStatus: 'failed' as const 
      };
      setEntries(failedEntries);
    }
  };

  const batchAnalyzeEntries = async () => {
    const unanalyzedEntries = entries.filter(entry => entry.analysisStatus !== 'completed');
    
    if (unanalyzedEntries.length === 0) {
      Alert.alert('Info', 'All entries are already analyzed!');
      return;
    }

    Alert.alert(
      'Batch Analysis',
      `Analyze ${unanalyzedEntries.length} entries with AI? This may take a few minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Analyze', 
          onPress: async () => {
            setIsAnalyzing(true);
            
            for (const entry of unanalyzedEntries) {
              await analyzeEntry(entry.id);
              // Add delay to respect API rate limits
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            setIsAnalyzing(false);
            Alert.alert('Success', 'Batch analysis completed!');
          }
        },
      ]
    );
  };

  const handleEntryAdded = async (entry: Entry) => {
    const enhancedEntry: EnhancedEntry = {
      ...entry,
      autoTags: [],
      analysisStatus: 'pending',
      updatedAt: Date.now(),
    };

    const newEntries = [enhancedEntry, ...entries];
    setEntries(newEntries);

    // Auto-analyze the new entry
    if (appState.analysisEnabled) {
      setTimeout(() => analyzeEntry(enhancedEntry.id), 1000);
    }
  };

  const handleRemoveDummyData = () => {
    setEntries([]);
  };

  const handleToggleDummyData = () => {
    setAppState(prev => ({ 
      ...prev, 
      showDummyData: !prev.showDummyData 
    }));
  };

  const toggleAnalysis = () => {
    setAppState(prev => ({ 
      ...prev, 
      analysisEnabled: !prev.analysisEnabled 
    }));
  };

  const toggleSwipeGestures = () => {
    setAppState(prev => ({ 
      ...prev, 
      swipeGesturesEnabled: !prev.swipeGesturesEnabled 
    }));
  };

  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording);
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Create"
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap;

                if (route.name === 'History') {
                  iconName = focused ? 'library' : 'library-outline';
                } else if (route.name === 'Create') {
                  iconName = focused ? 'create' : 'create-outline';
                } else if (route.name === 'Analytics') {
                  iconName = focused ? 'analytics' : 'analytics-outline';
                } else {
                  iconName = 'help-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#007AFF',
              tabBarInactiveTintColor: '#86868b',
              tabBarStyle: {
                backgroundColor: '#fafafa',
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
                paddingTop: 8,
                paddingBottom: 8,
                height: 88,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
                marginTop: 4,
              },
              headerShown: false,
            })}
          >
            <Tab.Screen name="History">
              {(props) => (
                <HistoryStack 
                  {...props} 
                  entries={entries}
                  appState={appState}
                  onToggleDummyData={handleToggleDummyData}
                  onAnalyzeEntry={analyzeEntry}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="Create">
              {(props) => (
                <CreateJournalEntryScreen
                  {...props}
                  onEntryAdded={handleEntryAdded}
                  onRemoveDummyData={handleRemoveDummyData}
                  analysisEnabled={appState.analysisEnabled}
                  onToggleAnalysis={toggleAnalysis}
                  onBatchAnalyze={batchAnalyzeEntries}
                  isAnalyzing={isAnalyzing}
                  isRecording={isRecording}
                  onRecordingStateChange={handleRecordingStateChange}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="Analytics">
              {(props) => <AnalyticsScreen {...props} entries={entries} />}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

// Enhanced Day Detail Screen Styles
const detailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  backNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 17,
    color: '#667eea',
    marginLeft: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  dateTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  dayStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statDivider: {
    fontSize: 14,
    color: '#8E8E93',
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  timeBlock: {
    marginBottom: 24,
  },
  timeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 8,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryTime: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  entryMood: {
    fontSize: 20,
  },
  entryContent: {
    marginBottom: 16,
  },
  entryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  entryText: {
    fontSize: 15,
    color: '#3C3C43',
    lineHeight: 22,
  },
  tagsSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  aiAnalysisSection: {
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  aiAnalysisLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
  analysisRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  analysisRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    width: 80,
    flexShrink: 0,
  },
  analysisRowText: {
    fontSize: 12,
    color: '#667eea',
    flex: 1,
    lineHeight: 16,
  },
  insightsContainer: {
    marginTop: 8,
  },
  insightText: {
    fontSize: 12,
    color: '#667eea',
    lineHeight: 16,
    marginBottom: 4,
    marginLeft: 8,
  },
  attachments: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentPreview: {
    width: 60,
    height: 60,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentIcon: {
    fontSize: 24,
  },
});