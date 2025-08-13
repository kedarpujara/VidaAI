import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Animated, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

// Import components
import DailyView from '../components/DailyView';
import WeeklyView from '../components/WeeklyView';
import MonthlyView from '../components/MonthlyView';

// Import types and styles
import { UnifiedHistoryScreenProps } from '../types/history';
import { historyStyles } from '../styles/historyStyles';

const UnifiedHistoryScreen: React.FC<UnifiedHistoryScreenProps> = ({ 
  entries, 
  showDummyData, 
  onToggleDummyData 
}) => {
  const navigation = useNavigation();
  const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const panRef = useRef();

  const handleViewChange = (view: 'daily' | 'weekly' | 'monthly') => {
    if (view === currentView) return;
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentView(view);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSwipeGesture = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      const views = ['daily', 'weekly', 'monthly'];
      const currentIndex = views.indexOf(currentView);
      
      if (translationX > 100 && currentIndex > 0) {
        handleViewChange(views[currentIndex - 1] as any);
      } else if (translationX < -100 && currentIndex < views.length - 1) {
        handleViewChange(views[currentIndex + 1] as any);
      }
    }
  };

  const navigateToDayDetail = (day: any) => {
    navigation.navigate('DayDetail', { day } as never);
  };

  const handleToggleDummyData = () => {
    Alert.alert(
      showDummyData ? 'Hide Demo Data' : 'Show Demo Data',
      showDummyData 
        ? 'This will hide the demo data and show your real journal entries.'
        : 'This will show demo data with AI analysis examples.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: showDummyData ? 'Hide Demo' : 'Show Demo', 
          onPress: onToggleDummyData,
        },
      ]
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'daily':
        return <DailyView entries={entries} showDummyData={showDummyData} onNavigateToDay={navigateToDayDetail} />;
      case 'weekly':
        return <WeeklyView entries={entries} showDummyData={showDummyData} />;
      case 'monthly':
        return <MonthlyView entries={entries} showDummyData={showDummyData} />;
      default:
        return <DailyView entries={entries} showDummyData={showDummyData} onNavigateToDay={navigateToDayDetail} />;
    }
  };

  return (
    <SafeAreaView style={historyStyles.container}>
      <View style={historyStyles.header}>
        <View style={historyStyles.headerTop}>
          <Text style={historyStyles.headerTitle}>History</Text>
          <View style={historyStyles.headerButtons}>
            <TouchableOpacity style={historyStyles.statsButton} onPress={handleToggleDummyData}>
              <Ionicons 
                name={showDummyData ? "eye-off" : "eye"} 
                size={20} 
                color="#667eea" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={historyStyles.settingsButton} 
              onPress={() => navigation.navigate('Settings' as never)}
            >
              <Ionicons name="settings-outline" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={historyStyles.viewToggle}>
          <TouchableOpacity
            style={[historyStyles.toggleButton, currentView === 'daily' && historyStyles.toggleButtonActive]}
            onPress={() => handleViewChange('daily')}
          >
            <Text style={[historyStyles.toggleText, currentView === 'daily' && historyStyles.toggleTextActive]}>
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[historyStyles.toggleButton, currentView === 'weekly' && historyStyles.toggleButtonActive]}
            onPress={() => handleViewChange('weekly')}
          >
            <Text style={[historyStyles.toggleText, currentView === 'weekly' && historyStyles.toggleTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[historyStyles.toggleButton, currentView === 'monthly' && historyStyles.toggleButtonActive]}
            onPress={() => handleViewChange('monthly')}
          >
            <Text style={[historyStyles.toggleText, currentView === 'monthly' && historyStyles.toggleTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <PanGestureHandler
        ref={panRef}
        onGestureEvent={handleSwipeGesture}
        enabled={true}
      >
        <Animated.View style={[historyStyles.contentContainer, { opacity: fadeAnim }]}>
          {showDummyData && (
            <View style={historyStyles.dummyDataIndicator}>
              <Ionicons name="information-circle" size={16} color="#667eea" />
              <Text style={historyStyles.dummyDataText}>
                Showing AI-enhanced demo data
              </Text>
            </View>
          )}
          {renderCurrentView()}
        </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
};

export default UnifiedHistoryScreen;
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#FAFAFA',
//     },
//     header: {
//         paddingHorizontal: 24,
//         paddingBottom: 16,
//     },
//     headerTop: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 12,
//     },
//     headerTitle: {
//         fontSize: 34,
//         fontWeight: '700',
//         color: '#000',
//         letterSpacing: -0.5,
//     },
//     statsButton: {
//         width: 36,
//         height: 36,
//         borderRadius: 18,
//         backgroundColor: '#F2F2F7',
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginRight: 8,
//     },
//     settingsButton: {
//         width: 36,
//         height: 36,
//         borderRadius: 18,
//         backgroundColor: '#F2F2F7',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     headerButtons: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     viewToggle: {
//         flexDirection: 'row',
//         backgroundColor: '#F2F2F7',
//         borderRadius: 9,
//         padding: 2,
//     },
//     toggleButton: {
//         flex: 1,
//         paddingVertical: 8,
//         borderRadius: 7,
//         alignItems: 'center',
//     },
//     toggleButtonActive: {
//         backgroundColor: '#FFFFFF',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 8,
//         elevation: 2,
//     },
//     toggleText: {
//         fontSize: 13,
//         fontWeight: '600',
//         color: '#8E8E93',
//     },
//     toggleTextActive: {
//         color: '#000',
//     },
//     contentContainer: {
//         flex: 1,
//     },
//     viewContainer: {
//         flex: 1,
//     },
//     scrollContent: {
//         paddingHorizontal: 24,
//         paddingBottom: 100,
//     },
//     dummyDataIndicator: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//         paddingHorizontal: 12,
//         paddingVertical: 8,
//         borderRadius: 8,
//         marginHorizontal: 24,
//         marginBottom: 16,
//         gap: 8,
//     },
//     dummyDataText: {
//         fontSize: 12,
//         color: '#667eea',
//         fontWeight: '500',
//         flex: 1,
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         paddingVertical: 60,
//     },
//     loadingText: {
//         fontSize: 16,
//         color: '#667eea',
//         marginTop: 16,
//         fontWeight: '500',
//     },
//     emptyState: {
//         alignItems: 'center',
//         paddingVertical: 60,
//     },
//     emptyTitle: {
//         fontSize: 24,
//         fontWeight: '700',
//         color: '#1d1d1f',
//         marginBottom: 8,
//     },
//     emptySubtitle: {
//         fontSize: 16,
//         color: '#86868b',
//         textAlign: 'center',
//     },

//     // Daily View Styles
//     streakBar: {
//         height: 60,
//         borderRadius: 16,
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 16,
//         marginBottom: 24,
//     },
//     streakInfo: {
//         flexDirection: 'column',
//     },
//     streakLabel: {
//         fontSize: 12,
//         color: 'rgba(255, 255, 255, 0.8)',
//         marginBottom: 2,
//     },
//     streakNumber: {
//         fontSize: 20,
//         fontWeight: '700',
//         color: '#FFFFFF',
//     },
//     badges: {
//         flexDirection: 'row',
//         gap: 8,
//     },
//     badge: {
//         width: 32,
//         height: 32,
//         borderRadius: 16,
//         backgroundColor: 'rgba(255, 255, 255, 0.2)',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     badgeEmoji: {
//         fontSize: 16,
//     },
//     daySummary: {
//         backgroundColor: '#FFFFFF',
//         borderRadius: 16,
//         padding: 20,
//         marginBottom: 16,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.04,
//         shadowRadius: 8,
//         elevation: 2,
//     },
//     dayHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 16,
//     },
//     dayDate: {
//         fontSize: 13,
//         color: '#8E8E93',
//         fontWeight: '600',
//     },
//     entryCount: {
//         backgroundColor: '#F2F2F7',
//         paddingHorizontal: 10,
//         paddingVertical: 4,
//         borderRadius: 12,
//     },
//     entryCountText: {
//         fontSize: 12,
//         fontWeight: '600',
//         color: '#667eea',
//     },
//     moodBar: {
//         flexDirection: 'row',
//         height: 4,
//         gap: 4,
//         marginBottom: 12,
//     },
//     moodSegment: {
//         height: 4,
//         borderRadius: 2,
//     },
//     highlightTitle: {
//         fontSize: 19,
//         fontWeight: '600',
//         color: '#000',
//         marginBottom: 6,
//     },
//     highlightSnippet: {
//         fontSize: 15,
//         color: '#3C3C43',
//         opacity: 0.7,
//         lineHeight: 21,
//         marginBottom: 12,
//     },
//     aiInsightsSection: {
//         backgroundColor: 'rgba(102, 126, 234, 0.05)',
//         borderRadius: 8,
//         padding: 12,
//         marginBottom: 16,
//     },
//     aiInsightHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 6,
//         gap: 6,
//     },
//     aiInsightLabel: {
//         fontSize: 12,
//         fontWeight: '600',
//         color: '#667eea',
//     },
//     aiInsightText: {
//         fontSize: 13,
//         color: '#667eea',
//         lineHeight: 18,
//     },
//     dayMeta: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 16,
//     },
//     metaStatText: {
//         fontSize: 13,
//         color: '#8E8E93',
//     },
//     chevron: {
//         marginLeft: 'auto',
//     },

//     // Weekly View Styles
//     weekCard: {
//         backgroundColor: '#FFFFFF',
//         borderRadius: 20,
//         padding: 20,
//         marginBottom: 16,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.06,
//         shadowRadius: 12,
//         elevation: 3,
//     },
//     weekHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 16,
//     },
//     weekDates: {
//         fontSize: 15,
//         fontWeight: '600',
//         color: '#000',
//     },
//     entryCountBadge: {
//         paddingHorizontal: 10,
//         paddingVertical: 4,
//         borderRadius: 12,
//     },
//     moodChart: {
//         height: 60,
//         backgroundColor: '#F8F8FA',
//         borderRadius: 12,
//         flexDirection: 'row',
//         alignItems: 'flex-end',
//         padding: 8,
//         gap: 4,
//         marginBottom: 16,
//     },
//     moodChartBar: {
//         flex: 1,
//         borderRadius: 4,
//         minHeight: 8,
//         opacity: 0.8,
//     },
//     weekStats: {
//         flexDirection: 'row',
//         justifyContent: 'space-around',
//         marginBottom: 16,
//         paddingVertical: 12,
//         backgroundColor: '#F8F8FA',
//         borderRadius: 12,
//     },
//     statItem: {
//         alignItems: 'center',
//     },
//     statValue: {
//         fontSize: 18,
//         fontWeight: '700',
//         color: '#000',
//         marginBottom: 2,
//     },
//     statLabel: {
//         fontSize: 12,
//         color: '#8E8E93',
//         fontWeight: '500',
//     },
//     tagsSection: {
//         marginBottom: 16,
//     },
//     sectionLabel: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: '#000',
//         marginBottom: 8,
//     },
//     tagsContainer: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 8,
//     },
//     tag: {
//         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: 12,
//     },
//     tagText: {
//         fontSize: 12,
//         color: '#667eea',
//         fontWeight: '500',
//     },
//     highlightsSection: {
//         marginBottom: 12,
//     },
//     lowlightsSection: {
//         marginBottom: 16,
//     },
//     highlightItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//         marginBottom: 6,
//     },
//     highlightEmoji: {
//         fontSize: 16,
//     },
//     highlightText: {
//         fontSize: 14,
//         color: '#3C3C43',
//         flex: 1,
//         lineHeight: 18,
//     },
//     aiSummarySection: {
//         backgroundColor: 'rgba(102, 126, 234, 0.05)',
//         borderRadius: 12,
//         padding: 12,
//         borderLeftWidth: 3,
//         borderLeftColor: '#667eea',
//     },
//     aiSummaryHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 8,
//         gap: 6,
//     },
//     aiSummaryLabel: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: '#667eea',
//     },
//     aiSummaryText: {
//         fontSize: 14,
//         color: '#667eea',
//         lineHeight: 20,
//         fontStyle: 'italic',
//     },

//     // Monthly View Styles
//     monthHeader: {
//         alignItems: 'center',
//         marginBottom: 24,
//     },
//     monthTitle: {
//         fontSize: 28,
//         fontWeight: '700',
//         color: '#000',
//         marginBottom: 4,
//     },
//     monthSubtitle: {
//         fontSize: 16,
//         color: '#8E8E93',
//     },
//     monthOverviewCard: {
//         borderRadius: 20,
//         padding: 20,
//         marginBottom: 16,
//     },
//     monthStatsGrid: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         marginBottom: 16,
//     },
//     monthStatItem: {
//         width: '50%',
//         alignItems: 'center',
//         marginBottom: 12,
//     },
//     monthStatValue: {
//         fontSize: 24,
//         fontWeight: '700',
//         color: '#FFFFFF',
//         marginBottom: 4,
//     },
//     monthStatLabel: {
//         fontSize: 12,
//         color: 'rgba(255, 255, 255, 0.8)',
//         fontWeight: '500',
//     },
//     moodTrendContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 8,
//     },
//     moodTrendText: {
//         fontSize: 14,
//         color: 'white',
//         fontWeight: '600',
//         textTransform: 'capitalize',
//     },
//     monthCard: {
//         backgroundColor: '#FFFFFF',
//         borderRadius: 20,
//         padding: 20,
//         marginBottom: 16,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.04,
//         shadowRadius: 8,
//         elevation: 2,
//     },
//     monthCardTitle: {
//         fontSize: 18,
//         fontWeight: '600',
//         color: '#000',
//         marginBottom: 12,
//     },
//     monthCardHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 12,
//     },
//     monthTagsContainer: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 8,
//     },
//     monthTag: {
//         backgroundColor: 'rgba(102, 126, 234, 0.1)',
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 16,
//     },
//     monthTagText: {
//         fontSize: 13,
//         color: '#667eea',
//         fontWeight: '500',
//     },
//     emotionsContainer: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 12,
//     },
//     emotionItem: {
//         backgroundColor: '#F8F8FA',
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 16,
//     },
//     emotionText: {
//         fontSize: 13,
//         color: '#3C3C43',
//         fontWeight: '500',
//         textTransform: 'capitalize',
//     },
//     monthHighlightItem: {
//         flexDirection: 'row',
//         alignItems: 'flex-start',
//         marginBottom: 8,
//         gap: 12,
//     },
//     monthHighlightDot: {
//         width: 6,
//         height: 6,
//         borderRadius: 3,
//         backgroundColor: '#4CAF50',
//         marginTop: 6,
//     },
//     monthHighlightText: {
//         fontSize: 14,
//         color: '#3C3C43',
//         lineHeight: 20,
//         flex: 1,
//     },
//     aiMonthSummaryCard: {
//         backgroundColor: 'rgba(102, 126, 234, 0.05)',
//         borderRadius: 20,
//         padding: 20,
//         marginBottom: 16,
//         borderWidth: 1,
//         borderColor: 'rgba(102, 126, 234, 0.1)',
//     },
//     aiMonthSummaryHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 12,
//         gap: 8,
//     },
//     aiMonthSummaryTitle: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#667eea',
//     },
//     aiMonthSummaryText: {
//         fontSize: 15,
//         color: '#667eea',
//         lineHeight: 22,
//         fontStyle: 'italic',
//     },
//     insightItem: {
//         flexDirection: 'row',
//         alignItems: 'flex-start',
//         marginBottom: 10,
//         gap: 8,
//     },
//     insightText: {
//         fontSize: 14,
//         color: '#3C3C43',
//         lineHeight: 20,
//         flex: 1,
//     },
// });

// import React, { useState, useRef } from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     ScrollView,
//     TouchableOpacity,
//     SafeAreaView,
//     Animated,
//     Alert,
//     ActivityIndicator,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { PanGestureHandler, State } from 'react-native-gesture-handler';
// import Constants from 'expo-constants';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// // Cache storage keys
// const WEEKLY_CACHE_KEY = '@weekly_summaries_cache';
// const MONTHLY_CACHE_KEY = '@monthly_summaries_cache';
// const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

// interface CachedSummary {
//     id: string;
//     summary: string;
//     timestamp: number;
//     entriesHash: string; // Hash of entry IDs to detect changes
// }

// interface UnifiedHistoryScreenProps {
//     entries: any[];
//     showDummyData: boolean;
//     onToggleDummyData: () => void;
// }

// interface DayEntry {
//     id: string;
//     date: Date;
//     entries: JournalEntry[];
//     moodAverage: number;
//     highlights: string;
//     stats: {
//         audioMinutes: number;
//         photos: number;
//         words: number;
//     };
//     aiInsights?: string[];
// }

// interface JournalEntry {
//     id: string;
//     time: Date;
//     title: string;
//     content: string;
//     mood: string;
//     moodScore: number;
//     type: 'voice' | 'text' | 'photo';
//     attachments?: string[];
//     aiAnalysis?: any;
//     autoTags?: string[];
// }

// interface WeekData {
//     id: string;
//     startDate: Date;
//     endDate: Date;
//     entries: any[];
//     entryCount: number;
//     moodData: number[];
//     avgMood: number;
//     totalWords: number;
//     highlights: string[];
//     lowlights: string[];
//     topTags: string[];
//     aiSummary?: string;
//     isGeneratingSummary?: boolean;
// }

// interface MonthData {
//     month: string;
//     year: number;
//     entries: any[];
//     totalEntries: number;
//     totalDays: number;
//     avgMood: number;
//     totalWords: number;
//     moodTrend: string;
//     highlights: string[];
//     lowlights: string[];
//     topTags: string[];
//     topEmotions: string[];
//     aiSummary?: string;
//     insights: string[];
//     isGeneratingSummary?: boolean;
// }

// // Cache Management Functions
// const generateEntriesHash = (entries: any[]): string => {
//     // Create a hash from entry IDs and content to detect changes
//     const entriesString = entries
//         .map(e => `${e.id}-${e.date}-${(e.text || e.content || '').length}`)
//         .sort()
//         .join('|');

//     // Simple hash function
//     let hash = 0;
//     for (let i = 0; i < entriesString.length; i++) {
//         const char = entriesString.charCodeAt(i);
//         hash = ((hash << 5) - hash) + char;
//         hash = hash & hash; // Convert to 32-bit integer
//     }
//     return Math.abs(hash).toString(36);
// };

// const getCachedSummary = async (cacheKey: string, id: string, entriesHash: string): Promise<string | null> => {
//     try {
//         const cached = await AsyncStorage.getItem(cacheKey);
//         if (!cached) return null;

//         const cacheData: Record<string, CachedSummary> = JSON.parse(cached);
//         const cachedItem = cacheData[id];

//         if (!cachedItem) return null;

//         // Check if cache is expired
//         const now = Date.now();
//         const cacheAge = now - cachedItem.timestamp;
//         const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

//         if (cacheAge > maxAge) {
//             // Cache expired, remove it
//             delete cacheData[id];
//             await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
//             return null;
//         }

//         // Check if entries have changed
//         if (cachedItem.entriesHash !== entriesHash) {
//             // Entries changed, cache is invalid
//             delete cacheData[id];
//             await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
//             return null;
//         }

//         return cachedItem.summary;
//     } catch (error) {
//         console.error('Error reading cache:', error);
//         return null;
//     }
// };

// const setCachedSummary = async (cacheKey: string, id: string, summary: string, entriesHash: string): Promise<void> => {
//     try {
//         const cached = await AsyncStorage.getItem(cacheKey);
//         const cacheData: Record<string, CachedSummary> = cached ? JSON.parse(cached) : {};

//         cacheData[id] = {
//             id,
//             summary,
//             timestamp: Date.now(),
//             entriesHash,
//         };

//         await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
//     } catch (error) {
//         console.error('Error writing cache:', error);
//     }
// };

// const clearExpiredCache = async (cacheKey: string): Promise<void> => {
//     try {
//         const cached = await AsyncStorage.getItem(cacheKey);
//         if (!cached) return;

//         const cacheData: Record<string, CachedSummary> = JSON.parse(cached);
//         const now = Date.now();
//         const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

//         let hasChanges = false;
//         Object.keys(cacheData).forEach(id => {
//             const cacheAge = now - cacheData[id].timestamp;
//             if (cacheAge > maxAge) {
//                 delete cacheData[id];
//                 hasChanges = true;
//             }
//         });

//         if (hasChanges) {
//             await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
//         }
//     } catch (error) {
//         console.error('Error clearing expired cache:', error);
//     }
// };

// // Enhanced OpenAI Summary Generation with Caching
// const generateOpenAISummary = async (
//     entries: any[],
//     period: 'week' | 'month',
//     startDate?: Date,
//     endDate?: Date,
//     cacheId?: string
// ): Promise<string> => {
//     if (!OPENAI_API_KEY) {
//         throw new Error('OpenAI API key not configured');
//     }

//     if (entries.length === 0) {
//         return `No entries found for this ${period}.`;
//     }

//     // Generate cache key and entries hash
//     const cacheKey = period === 'week' ? WEEKLY_CACHE_KEY : MONTHLY_CACHE_KEY;
//     const entriesHash = generateEntriesHash(entries);
//     const id = cacheId || `${period}_${startDate?.toISOString().split('T')[0] || 'current'}`;

//     // Try to get cached summary first
//     const cachedSummary = await getCachedSummary(cacheKey, id, entriesHash);
//     if (cachedSummary) {
//         console.log(`Using cached ${period} summary for ${id}`);
//         return cachedSummary;
//     }

//     console.log(`Generating new ${period} summary for ${id} (cache miss)`);

//     // Prepare data for analysis
//     const entryTexts = entries.map(entry => entry.text || entry.content || '').join('\n\n');
//     const allTags = entries.flatMap(entry => entry.tags || []);
//     const emotions = entries.flatMap(entry => entry.emotions || []);
//     const moods = entries.map(entry => entry.mood?.score || 7);
//     const avgMood = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;

//     const tagFrequency = allTags.reduce((acc, tag) => {
//         acc[tag] = (acc[tag] || 0) + 1;
//         return acc;
//     }, {} as Record<string, number>);

//     const topTags = Object.entries(tagFrequency)
//         .sort(([, a], [, b]) => b - a)
//         .slice(0, 5)
//         .map(([tag]) => tag);

//     const dateRange = period === 'week'
//         ? `${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`
//         : `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

//     const prompt = `
//   You are an expert journal analyst. Analyze the following ${period}ly journal entries and provide a thoughtful, insightful summary.
  
//   ${period.charAt(0).toUpperCase() + period.slice(1)} Period: ${dateRange}
//   Number of entries: ${entries.length}
//   Average mood (1-10): ${avgMood.toFixed(1)}
//   Top themes/tags: ${topTags.join(', ')}
  
//   Journal Entries:
//   ${entryTexts}
  
//   Please provide a comprehensive ${period}ly summary in exactly this JSON format:
//   {
//     "overallTone": "brief description of emotional tone",
//     "keyHighlights": ["highlight 1", "highlight 2", "highlight 3"],
//     "challengesOrLowlights": ["challenge 1", "challenge 2"],
//     "patterns": "description of recurring patterns or themes",
//     "growth": "insights about personal growth or changes",
//     "summary": "a thoughtful 2-3 sentence summary of the ${period}"
//   }
  
//   Focus on:
//   - Emotional patterns and mood trends
//   - Recurring themes and personal growth
//   - Significant moments (both positive and challenging)
//   - Insights about behavior, relationships, or mindset
//   - Actionable observations
  
//   Return only valid JSON, no additional text.
//     `;

//     try {
//         const response = await fetch('https://api.openai.com/v1/chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${OPENAI_API_KEY}`,
//             },
//             body: JSON.stringify({
//                 model: 'gpt-4',
//                 messages: [
//                     {
//                         role: 'system',
//                         content: 'You are a professional journal analyst specializing in emotional intelligence and personal growth insights. Always respond with valid JSON only.'
//                     },
//                     {
//                         role: 'user',
//                         content: prompt
//                     }
//                 ],
//                 temperature: 0.3,
//                 max_tokens: 800,
//             }),
//         });

//         if (!response.ok) {
//             throw new Error(`OpenAI API error: ${response.status}`);
//         }

//         const data = await response.json();
//         const analysisText = data.choices[0]?.message?.content;

//         if (!analysisText) {
//             throw new Error('No analysis returned from OpenAI');
//         }

//         // Clean and parse the JSON response
//         const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
//         const analysis = JSON.parse(cleanedText);

//         const summary = analysis.summary || `Insightful ${period} of journaling with ${entries.length} entries.`;

//         // Cache the summary
//         await setCachedSummary(cacheKey, id, summary, entriesHash);

//         return summary;
//     } catch (error) {
//         console.error('OpenAI summary failed:', error);
//         const fallbackSummary = `This ${period} included ${entries.length} journal entries with an average mood of ${avgMood.toFixed(1)}/10. Key themes: ${topTags.slice(0, 3).join(', ')}.`;

//         // Cache the fallback summary too (shorter expiry)
//         await setCachedSummary(cacheKey, id, fallbackSummary, entriesHash);

//         return fallbackSummary;
//     }
// };

// // Daily View Component (keeping existing implementation)
// const DailyView = ({ entries, showDummyData, onNavigateToDay }: any) => {
//     const generateDummyData = () => {
//         const dummyEntries: DayEntry[] = [];
//         const today = new Date();

//         const enhancedTitles = [
//             'Morning mindfulness breakthrough',
//             'Coffee contemplations on change',
//             'Workplace collaboration wins',
//             'Nature walk revelations',
//             'Creative flow afternoon',
//             'Evening gratitude practice',
//             'Deep conversation insights',
//             'Exercise motivation discovery',
//             'Family connection moments',
//             'Personal boundary setting',
//             'Problem-solving clarity',
//             'Spontaneous joy moments',
//             'Learning integration time',
//             'Emotional processing session',
//             'Future visioning exercise',
//         ];

//         const enhancedContents = [
//             'Today I discovered something profound about the relationship between acceptance and growth. The meditation helped me see that resistance often blocks the very changes I seek.',
//             'An unexpected conversation shifted my entire perspective on what success means. Sometimes the most valuable insights come from the most ordinary interactions.',
//             'I\'m noticing patterns in how I handle stress - the techniques are working, but consistency is key. Small daily practices are creating bigger shifts than I expected.',
//             'The connection between physical movement and mental clarity became so apparent today. Walking outside literally changed the quality of my thoughts.',
//             'Creative work felt effortless today. There\'s something magical about being in flow state - time disappears and ideas just emerge naturally.',
//             'Practicing gratitude is rewiring my brain. I\'m automatically noticing positive details that I used to miss completely.',
//             'Setting boundaries felt scary but necessary. I\'m learning that saying no to some things means saying yes to what truly matters.',
//             'The emotional processing I did today revealed underlying patterns I hadn\'t recognized. Awareness is the first step to transformation.',
//             'Connected deeply with someone today in a way that reminded me why relationships are the foundation of a meaningful life.',
//             'Reflecting on my growth over the past month - the changes are subtle but real. I\'m becoming more of who I want to be.',
//         ];

//         for (let dayOffset = 0; dayOffset < 45; dayOffset++) {
//             if (dayOffset === 25) continue; // Skip day 25 for streak

//             const currentDate = new Date(today);
//             currentDate.setDate(today.getDate() - dayOffset);

//             const entryCount = Math.floor(Math.random() * 3) + 2;
//             const dayEntries = Array(entryCount).fill(null).map((_, entryIndex) => {
//                 const entryTime = new Date(currentDate);
//                 entryTime.setHours(6 + entryIndex * 4 + Math.floor(Math.random() * 3));
//                 entryTime.setMinutes(Math.floor(Math.random() * 60));

//                 const moodScore = 6 + Math.floor(Math.random() * 3); // 6-8 for generally positive
//                 const mood = moodScore >= 8 ? '😊' : moodScore >= 7 ? '🙂' : '😐';

//                 return {
//                     id: `entry_${dayOffset}_${entryIndex}`,
//                     time: entryTime,
//                     title: enhancedTitles[Math.floor(Math.random() * enhancedTitles.length)],
//                     content: enhancedContents[Math.floor(Math.random() * enhancedContents.length)],
//                     mood,
//                     moodScore,
//                     type: Math.random() > 0.7 ? 'voice' : 'text',
//                     attachments: Math.random() > 0.8 ? ['photo1'] : [],
//                     aiAnalysis: {
//                         emotions: ['grateful', 'reflective', 'optimistic'].slice(0, Math.floor(Math.random() * 3) + 1),
//                         themes: ['personal-growth', 'mindfulness', 'self-awareness'].slice(0, Math.floor(Math.random() * 2) + 1),
//                         sentiment: 'positive',
//                         sentimentScore: 0.6 + Math.random() * 0.3,
//                         insights: ['Strong emotional awareness evident in reflections', 'Growth mindset clearly developing'].slice(0, Math.floor(Math.random() * 2) + 1),
//                     },
//                     autoTags: ['mindfulness', 'growth', 'reflection', 'insight'].slice(0, Math.floor(Math.random() * 3) + 2),
//                 };
//             });

//             const moodAverage = dayEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / dayEntries.length;

//             dummyEntries.push({
//                 id: `day_${dayOffset}`,
//                 date: currentDate,
//                 entries: dayEntries,
//                 moodAverage,
//                 highlights: dayEntries[0].title,
//                 stats: {
//                     audioMinutes: dayEntries.filter(e => e.type === 'voice').length * 3,
//                     photos: dayEntries.filter(e => e.attachments?.length).length,
//                     words: dayEntries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0)
//                 },
//                 aiInsights: [
//                     `Emotional pattern: ${moodAverage >= 7 ? 'Consistently positive' : 'Balanced emotional state'}`,
//                     `Growth indicators: Self-reflection and mindfulness practices evident`,
//                     `Theme focus: ${dayEntries[0]?.aiAnalysis?.themes?.[0] || 'Personal development'}`
//                 ]
//             });
//         }

//         return dummyEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
//     };

//     // Convert real entries to daily format
//     const convertEntriesToDays = () => {
//         if (!entries || entries.length === 0) {
//             return [];
//         }

//         const groupedByDate = entries.reduce((acc: any, entry: any) => {
//             let entryDate;
//             if (entry.date) {
//                 entryDate = new Date(entry.date);
//             } else if (entry.createdAt) {
//                 entryDate = new Date(entry.createdAt);
//             } else {
//                 entryDate = new Date();
//             }

//             const dateStr = entryDate.toDateString();

//             if (!acc[dateStr]) {
//                 acc[dateStr] = [];
//             }

//             const journalEntry = {
//                 id: entry.id,
//                 time: entryDate,
//                 title: entry.title || 'Journal Entry',
//                 content: entry.text || entry.content || '',
//                 mood: entry.mood?.emoji || '😊',
//                 moodScore: entry.mood?.score || 7,
//                 type: (entry.transcribed || entry.hasAudio) ? 'voice' : 'text',
//                 attachments: entry.photoUri ? [entry.photoUri] : [],
//                 aiAnalysis: entry.aiAnalysis,
//                 autoTags: entry.autoTags || [],
//             };

//             acc[dateStr].push(journalEntry);
//             return acc;
//         }, {});

//         const convertedDays = Object.entries(groupedByDate).map(([dateStr, dayEntries]: [string, any]) => {
//             const entryDate = new Date(dateStr);
//             const moodAverage = dayEntries.reduce((sum: number, e: any) => sum + e.moodScore, 0) / dayEntries.length;

//             const aiInsights: string[] = [];
//             const analyzedEntries = dayEntries.filter((e: any) => e.aiAnalysis);

//             if (analyzedEntries.length > 0) {
//                 const emotions = analyzedEntries.flatMap((e: any) => e.aiAnalysis.emotions || []);
//                 const themes = analyzedEntries.flatMap((e: any) => e.aiAnalysis.themes || []);
//                 const avgSentiment = analyzedEntries.reduce((sum: number, e: any) =>
//                     sum + (e.aiAnalysis.sentimentScore || 0), 0) / analyzedEntries.length;

//                 if (emotions.length > 0) {
//                     aiInsights.push(`Primary emotions: ${emotions.slice(0, 3).join(', ')}`);
//                 }
//                 if (themes.length > 0) {
//                     aiInsights.push(`Key themes: ${[...new Set(themes)].slice(0, 2).join(', ')}`);
//                 }
//                 aiInsights.push(`Sentiment: ${avgSentiment > 0.2 ? 'Positive' : avgSentiment < -0.2 ? 'Challenging' : 'Balanced'}`);
//             } else {
//                 aiInsights.push('Entry logged successfully');
//             }

//             return {
//                 id: dateStr,
//                 date: entryDate,
//                 entries: dayEntries,
//                 moodAverage,
//                 highlights: dayEntries[0]?.title || 'Journal Entry',
//                 stats: {
//                     audioMinutes: dayEntries.filter((e: any) => e.type === 'voice').length * 3,
//                     photos: dayEntries.filter((e: any) => e.attachments?.length > 0).length,
//                     words: dayEntries.reduce((sum: number, e: any) => sum + (e.content?.split(' ').length || 0), 0),
//                 },
//                 aiInsights,
//             };
//         }).sort((a, b) => b.date.getTime() - a.date.getTime());

//         return convertedDays;
//     };

//     const mockDays = showDummyData ? generateDummyData() : convertEntriesToDays();

//     const formatDate = (date: Date) => {
//         const today = new Date();
//         const yesterday = new Date(today);
//         yesterday.setDate(yesterday.getDate() - 1);

//         const isToday = date.toDateString() === today.toDateString();
//         const isYesterday = date.toDateString() === yesterday.toDateString();

//         if (isToday) return 'Today';
//         if (isYesterday) return 'Yesterday';

//         const months = ['January', 'February', 'March', 'April', 'May', 'June',
//             'July', 'August', 'September', 'October', 'November', 'December'];
//         return `${months[date.getMonth()]} ${date.getDate()}`;
//     };

//     const getMoodColor = (score: number) => {
//         if (score >= 8) return ['#56CCF2', '#2F80ED'];
//         if (score >= 6) return ['#667eea', '#764ba2'];
//         if (score >= 4) return ['#F093FB', '#F5576C'];
//         return ['#8E8E93', '#C7C7CC'];
//     };

//     const calculateStreak = () => {
//         if (mockDays.length === 0) return 0;

//         let streak = 0;
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         for (let i = 0; i < mockDays.length; i++) {
//             const entryDate = new Date(mockDays[i].date);
//             entryDate.setHours(0, 0, 0, 0);

//             const expectedDate = new Date(today);
//             expectedDate.setDate(today.getDate() - i);

//             if (entryDate.getTime() === expectedDate.getTime()) {
//                 streak++;
//             } else {
//                 break;
//             }
//         }

//         return streak;
//     };

//     const currentStreak = calculateStreak();

//     return (
//         <ScrollView
//             style={styles.viewContainer}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//         >
//             {/* Streak Bar */}
//             <LinearGradient
//                 colors={['#667eea', '#764ba2']}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//                 style={styles.streakBar}
//             >
//                 <View style={styles.streakInfo}>
//                     <Text style={styles.streakLabel}>Current Streak</Text>
//                     <Text style={styles.streakNumber}>{currentStreak} days 🔥</Text>
//                 </View>
//                 <View style={styles.badges}>
//                     <View style={styles.badge}>
//                         <Text style={styles.badgeEmoji}>🤖</Text>
//                     </View>
//                     <View style={styles.badge}>
//                         <Text style={styles.badgeEmoji}>🎯</Text>
//                     </View>
//                 </View>
//             </LinearGradient>

//             {/* Day Summaries */}
//             {mockDays.length === 0 ? (
//                 <View style={styles.emptyState}>
//                     <Text style={styles.emptyTitle}>No entries yet</Text>
//                     <Text style={styles.emptySubtitle}>Start journaling to see your history here</Text>
//                 </View>
//             ) : (
//                 mockDays.map((day, index) => (
//                     <TouchableOpacity
//                         key={day.id}
//                         style={styles.daySummary}
//                         onPress={() => onNavigateToDay(day)}
//                         activeOpacity={0.7}
//                     >
//                         <View style={styles.dayHeader}>
//                             <Text style={styles.dayDate}>
//                                 {formatDate(day.date).toUpperCase()}
//                             </Text>
//                             <View style={styles.entryCount}>
//                                 <Text style={styles.entryCountText}>{day.entries.length} entries</Text>
//                             </View>
//                         </View>

//                         <View style={styles.moodBar}>
//                             {day.entries.map((entry: any, idx: number) => (
//                                 <LinearGradient
//                                     key={idx}
//                                     colors={getMoodColor(entry.moodScore)}
//                                     style={[styles.moodSegment, { flex: 1 }]}
//                                 />
//                             ))}
//                         </View>

//                         <Text style={styles.highlightTitle}>{day.highlights}</Text>
//                         <Text style={styles.highlightSnippet} numberOfLines={2}>
//                             {day.entries[0]?.content}
//                         </Text>

//                         {/* AI Insights */}
//                         {day.aiInsights && day.aiInsights.length > 0 && (
//                             <View style={styles.aiInsightsSection}>
//                                 <View style={styles.aiInsightHeader}>
//                                     <Ionicons name="bulb" size={14} color="#667eea" />
//                                     <Text style={styles.aiInsightLabel}>AI Insights</Text>
//                                 </View>
//                                 <Text style={styles.aiInsightText} numberOfLines={2}>
//                                     {day.aiInsights[0]}
//                                 </Text>
//                             </View>
//                         )}

//                         <View style={styles.dayMeta}>
//                             {day.stats.audioMinutes > 0 && (
//                                 <Text style={styles.metaStatText}>🎙 {day.stats.audioMinutes} min</Text>
//                             )}
//                             {day.stats.photos > 0 && (
//                                 <Text style={styles.metaStatText}>📷 {day.stats.photos}</Text>
//                             )}
//                             {day.stats.words > 0 && (
//                                 <Text style={styles.metaStatText}>✍️ {day.stats.words} words</Text>
//                             )}
//                             <Ionicons name="chevron-forward" size={20} color="#C7C7CC" style={styles.chevron} />
//                         </View>
//                     </TouchableOpacity>
//                 ))
//             )}
//         </ScrollView>
//     );
// };

// // Enhanced Weekly View Component with Caching
// const WeeklyView = ({ entries, showDummyData }: any) => {
//     const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
//     const [isLoading, setIsLoading] = useState(false);

//     React.useEffect(() => {
//         generateWeeklyData();
//         // Clear expired cache on component mount
//         clearExpiredCache(WEEKLY_CACHE_KEY);
//     }, [entries, showDummyData]);

//     const generateDummyWeeklyData = (): WeekData[] => {
//         const weeks: WeekData[] = [];
//         const today = new Date();

//         for (let weekOffset = 0; weekOffset < 8; weekOffset++) {
//             const startDate = new Date(today);
//             startDate.setDate(today.getDate() - (weekOffset * 7) - today.getDay());
//             const endDate = new Date(startDate);
//             endDate.setDate(startDate.getDate() + 6);

//             const moodData = Array(7).fill(0).map(() => 20 + Math.random() * 75);
//             const avgMood = moodData.reduce((sum, mood) => sum + mood, 0) / 7 / 10; // Convert to 1-10 scale

//             weeks.push({
//                 id: `week_${weekOffset}`,
//                 startDate,
//                 endDate,
//                 entries: [],
//                 entryCount: Math.floor(Math.random() * 15) + 5,
//                 moodData,
//                 avgMood,
//                 totalWords: Math.floor(Math.random() * 2000) + 500,
//                 highlights: [
//                     'Morning meditation breakthrough',
//                     'Completed challenging project',
//                     'Personal growth insight'
//                 ],
//                 lowlights: [
//                     'Stressful week at work',
//                     'Difficulty sleeping'
//                 ],
//                 topTags: ['mindfulness', 'work', 'growth', 'stress', 'sleep'],
//                 aiSummary: `This week showed strong emotional resilience with ${Math.floor(Math.random() * 15) + 5} journal entries. Key themes included mindfulness practice and professional growth, with some challenges around work-life balance.`,
//             });
//         }

//         return weeks;
//     };

//     const generateRealWeeklyData = async (): Promise<WeekData[]> => {
//         if (!entries || entries.length === 0) return [];

//         const weeks: { [key: string]: any[] } = {};

//         // Group entries by week
//         entries.forEach((entry: any) => {
//             const date = new Date(entry.date || entry.createdAt);
//             const startOfWeek = new Date(date);
//             startOfWeek.setDate(date.getDate() - date.getDay()); // Get Sunday
//             startOfWeek.setHours(0, 0, 0, 0);
//             const weekKey = startOfWeek.toISOString();

//             if (!weeks[weekKey]) {
//                 weeks[weekKey] = [];
//             }
//             weeks[weekKey].push(entry);
//         });

//         const weeklyData: WeekData[] = [];

//         for (const [weekKey, weekEntries] of Object.entries(weeks)) {
//             const startDate = new Date(weekKey);
//             const endDate = new Date(startDate);
//             endDate.setDate(startDate.getDate() + 6);

//             // Calculate mood data for each day of the week
//             const moodData = Array(7).fill(0).map((_, dayIndex) => {
//                 const dayEntries = weekEntries.filter(entry => {
//                     const entryDate = new Date(entry.date || entry.createdAt);
//                     const targetDate = new Date(startDate);
//                     targetDate.setDate(startDate.getDate() + dayIndex);
//                     return entryDate.toDateString() === targetDate.toDateString();
//                 });

//                 if (dayEntries.length === 0) return 20; // Default neutral mood
//                 const avgMood = dayEntries.reduce((sum, e) => sum + (e.mood?.score || 7), 0) / dayEntries.length;
//                 return Math.min(95, Math.max(20, avgMood * 10)); // Convert to percentage for display
//             });

//             const avgMood = weekEntries.reduce((sum, e) => sum + (e.mood?.score || 7), 0) / weekEntries.length;
//             const totalWords = weekEntries.reduce((sum, e) => sum + (e.text?.split(' ').length || 0), 0);

//             // Extract tags and analyze sentiment
//             const allTags = weekEntries.flatMap(e => e.tags || []);
//             const tagFrequency = allTags.reduce((acc, tag) => {
//                 acc[tag] = (acc[tag] || 0) + 1;
//                 return acc;
//             }, {} as Record<string, number>);

//             const topTags = Object.entries(tagFrequency)
//                 .sort(([, a], [, b]) => b - a)
//                 .slice(0, 5)
//                 .map(([tag]) => tag);

//             // Identify highlights and lowlights based on mood and content
//             const sortedEntries = weekEntries.sort((a, b) => (b.mood?.score || 7) - (a.mood?.score || 7));
//             const highlights = sortedEntries.slice(0, 3).map(e => e.title || 'Positive moment');
//             const lowlights = sortedEntries.slice(-2).filter(e => (e.mood?.score || 7) < 6).map(e => e.title || 'Challenging moment');

//             const weekData: WeekData = {
//                 id: weekKey,
//                 startDate,
//                 endDate,
//                 entries: weekEntries,
//                 entryCount: weekEntries.length,
//                 moodData,
//                 avgMood,
//                 totalWords,
//                 highlights,
//                 lowlights,
//                 topTags,
//                 isGeneratingSummary: true,
//             };

//             weeklyData.push(weekData);
//         }

//         // Sort by date (most recent first)
//         weeklyData.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

//         // Generate AI summaries for each week (with caching)
//         for (const week of weeklyData) {
//             if (week.entries.length > 0) {
//                 try {
//                     const cacheId = `week_${week.startDate.toISOString().split('T')[0]}`;
//                     const aiSummary = await generateOpenAISummary(
//                         week.entries,
//                         'week',
//                         week.startDate,
//                         week.endDate,
//                         cacheId
//                     );
//                     week.aiSummary = aiSummary;
//                 } catch (error) {
//                     console.error('Failed to generate weekly summary:', error);
//                     week.aiSummary = `Week of ${week.entryCount} entries with average mood ${week.avgMood.toFixed(1)}/10. Top themes: ${week.topTags.slice(0, 3).join(', ')}.`;
//                 }
//             }
//             week.isGeneratingSummary = false;
//         }

//         return weeklyData;
//     };

//     const generateWeeklyData = async () => {
//         setIsLoading(true);
//         try {
//             let data;
//             if (showDummyData) {
//                 data = generateDummyWeeklyData();
//             } else {
//                 data = await generateRealWeeklyData();
//             }
//             setWeeklyData(data);
//         } catch (error) {
//             console.error('Error generating weekly data:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     }; 
// };

// const formatWeekDates = (startDate: Date, endDate: Date) => {
//     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
//         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

//     const startMonth = months[startDate.getMonth()];
//     const endMonth = months[endDate.getMonth()];

//     if (startMonth === endMonth) {
//         return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}`;
//     }
//     return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`;
// };

// if (!showDummyData && entries.length === 0) {
//     return (
//         <View style={styles.emptyState}>
//             <Text style={styles.emptyTitle}>No weekly data yet</Text>
//             <Text style={styles.emptySubtitle}>Journal for a few days to see weekly patterns</Text>
//         </View>
//     );
// }

// return (
//     <ScrollView
//         style={styles.viewContainer}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//     >
//         {isLoading ? (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color="#667eea" />
//                 <Text style={styles.loadingText}>Analyzing weekly patterns...</Text>
//             </View>
//         ) : (
//             weeklyData.map((week) => (
//                 <View key={week.id} style={styles.weekCard}>
//                     <View style={styles.weekHeader}>
//                         <Text style={styles.weekDates}>
//                             {formatWeekDates(week.startDate, week.endDate)}
//                         </Text>
//                         <LinearGradient
//                             colors={['#667eea', '#764ba2']}
//                             style={styles.entryCountBadge}
//                         >
//                             <Text style={styles.entryCountText}>{week.entryCount} entries</Text>
//                         </LinearGradient>
//                     </View>

//                     {/* Mood Chart */}
//                     <View style={styles.moodChart}>
//                         {week.moodData.map((height, index) => (
//                             <LinearGradient
//                                 key={index}
//                                 colors={['#667eea', '#764ba2']}
//                                 style={[styles.moodChartBar, { height: `${height}%` }]}
//                             />
//                         ))}
//                     </View>

//                     {/* Week Stats */}
//                     <View style={styles.weekStats}>
//                         <View style={styles.statItem}>
//                             <Text style={styles.statValue}>{week.avgMood.toFixed(1)}</Text>
//                             <Text style={styles.statLabel}>Avg Mood</Text>
//                         </View>
//                         <View style={styles.statItem}>
//                             <Text style={styles.statValue}>{week.totalWords}</Text>
//                             <Text style={styles.statLabel}>Words</Text>
//                         </View>
//                         <View style={styles.statItem}>
//                             <Text style={styles.statValue}>{week.topTags.length}</Text>
//                             <Text style={styles.statLabel}>Themes</Text>
//                         </View>
//                     </View>

//                     {/* Top Tags */}
//                     {week.topTags.length > 0 && (
//                         <View style={styles.tagsSection}>
//                             <Text style={styles.sectionLabel}>Top Themes</Text>
//                             <View style={styles.tagsContainer}>
//                                 {week.topTags.slice(0, 5).map((tag, index) => (
//                                     <View key={index} style={styles.tag}>
//                                         <Text style={styles.tagText}>{tag}</Text>
//                                     </View>
//                                 ))}
//                             </View>
//                         </View>
//                     )}

//                     {/* Highlights */}
//                     <View style={styles.highlightsSection}>
//                         <Text style={styles.sectionLabel}>Highlights</Text>
//                         {week.highlights.slice(0, 3).map((highlight, index) => (
//                             <View key={index} style={styles.highlightItem}>
//                                 <Text style={styles.highlightEmoji}>✨</Text>
//                                 <Text style={styles.highlightText}>{highlight}</Text>
//                             </View>
//                         ))}
//                     </View>

//                     {/* Lowlights */}
//                     {week.lowlights.length > 0 && (
//                         <View style={styles.lowlightsSection}>
//                             <Text style={styles.sectionLabel}>Challenges</Text>
//                             {week.lowlights.map((lowlight, index) => (
//                                 <View key={index} style={styles.highlightItem}>
//                                     <Text style={styles.highlightEmoji}>🎯</Text>
//                                     <Text style={styles.highlightText}>{lowlight}</Text>
//                                 </View>
//                             ))}
//                         </View>
//                     )}

//                     {/* AI Summary */}
//                     <View style={styles.aiSummarySection}>
//                         <View style={styles.aiSummaryHeader}>
//                             <Ionicons name="sparkles" size={16} color="#667eea" />
//                             <Text style={styles.aiSummaryLabel}>Week Summary</Text>
//                             {week.isGeneratingSummary && (
//                                 <ActivityIndicator size="small" color="#667eea" style={{ marginLeft: 8 }} />
//                             )}
//                         </View>
//                         <Text style={styles.aiSummaryText}>
//                             {week.isGeneratingSummary ? 'Generating insights...' : week.aiSummary}
//                         </Text>
//                     </View>
//                 </View>
//             ))
//         )}
//     </ScrollView>
// );
//   };

// // Enhanced Monthly View Component with Caching
// const MonthlyView = ({ entries, showDummyData }: any) => {
//     const [monthlyData, setMonthlyData] = useState<MonthData | null>(null);
//     const [isLoading, setIsLoading] = useState(false);

//     React.useEffect(() => {
//         generateMonthlyData();
//         // Clear expired cache on component mount
//         clearExpiredCache(MONTHLY_CACHE_KEY);
//     }, [entries, showDummyData]);

//     const generateDummyMonthlyData = (): MonthData => {
//         const currentDate = new Date();
//         return {
//             month: currentDate.toLocaleDateString('en-US', { month: 'long' }),
//             year: currentDate.getFullYear(),
//             entries: [],
//             totalEntries: 45,
//             totalDays: 18,
//             avgMood: 7.2,
//             totalWords: 12500,
//             moodTrend: 'improving',
//             highlights: [
//                 'Breakthrough in meditation practice',
//                 'Successfully completed major project',
//                 'Improved work-life balance',
//                 'Strengthened relationships'
//             ],
//             lowlights: [
//                 'Stress from deadline pressure',
//                 'Sleep quality challenges'
//             ],
//             topTags: ['mindfulness', 'work', 'growth', 'relationships', 'health'],
//             topEmotions: ['grateful', 'focused', 'optimistic', 'reflective'],
//             insights: [
//                 'Consistent journaling has improved self-awareness',
//                 'Mindfulness practice showing positive impact on daily mood',
//                 'Work-related stress is a recurring theme to address'
//             ],
//             aiSummary: 'This month demonstrated significant personal growth with consistent journaling practice. Key themes included mindfulness development, professional achievements, and relationship building, with some challenges around stress management.',
//         };
//     };

//     const generateRealMonthlyData = async (): Promise<MonthData | null> => {
//         if (!entries || entries.length === 0) return null;

//         const currentDate = new Date();
//         const currentMonth = currentDate.getMonth();
//         const currentYear = currentDate.getFullYear();

//         // Filter entries for current month
//         const monthEntries = entries.filter((entry: any) => {
//             const entryDate = new Date(entry.date || entry.createdAt);
//             return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
//         });

//         if (monthEntries.length === 0) return null;

//         // Calculate basic stats
//         const uniqueDays = new Set(
//             monthEntries.map((entry: any) => new Date(entry.date || entry.createdAt).toDateString())
//         ).size;

//         const totalWords = monthEntries.reduce((sum: number, entry: any) =>
//             sum + (entry.text?.split(' ').length || 0), 0);

//         const avgMood = monthEntries.reduce((sum: number, entry: any) =>
//             sum + (entry.mood?.score || 7), 0) / monthEntries.length;

//         // Analyze tags and emotions
//         const allTags = monthEntries.flatMap((entry: any) => entry.tags || []);
//         const allEmotions = monthEntries.flatMap((entry: any) => entry.emotions || []);

//         const tagFrequency = allTags.reduce((acc: any, tag: string) => {
//             acc[tag] = (acc[tag] || 0) + 1;
//             return acc;
//         }, {});

//         const emotionFrequency = allEmotions.reduce((acc: any, emotion: string) => {
//             acc[emotion] = (acc[emotion] || 0) + 1;
//             return acc;
//         }, {});

//         const topTags = Object.entries(tagFrequency)
//             .sort(([, a], [, b]) => (b as number) - (a as number))
//             .slice(0, 8)
//             .map(([tag]) => tag);

//         const topEmotions = Object.entries(emotionFrequency)
//             .sort(([, a], [, b]) => (b as number) - (a as number))
//             .slice(0, 5)
//             .map(([emotion]) => emotion);

//         // Determine mood trend
//         const firstHalf = monthEntries.slice(0, Math.floor(monthEntries.length / 2));
//         const secondHalf = monthEntries.slice(Math.floor(monthEntries.length / 2));

//         const firstHalfMood = firstHalf.reduce((sum: number, e: any) => sum + (e.mood?.score || 7), 0) / firstHalf.length;
//         const secondHalfMood = secondHalf.reduce((sum: number, e: any) => sum + (e.mood?.score || 7), 0) / secondHalf.length;

//         let moodTrend = 'stable';
//         if (secondHalfMood > firstHalfMood + 0.5) moodTrend = 'improving';
//         else if (secondHalfMood < firstHalfMood - 0.5) moodTrend = 'declining';

//         // Identify highlights and lowlights
//         const sortedEntries = monthEntries.sort((a: any, b: any) => (b.mood?.score || 7) - (a.mood?.score || 7));
//         const highlights = sortedEntries.slice(0, 4).map((e: any) => e.title || 'Positive moment');
//         const lowlights = sortedEntries.slice(-2).filter((e: any) => (e.mood?.score || 7) < 6).map((e: any) => e.title || 'Challenging moment');

//         // Generate insights
//         const insights = [
//             `Averaged ${(totalWords / uniqueDays).toFixed(0)} words per day journaled`,
//             `${topTags[0] || 'Personal reflection'} was the most common theme`,
//             `Mood trend: ${moodTrend} throughout the month`,
//         ];

//         const monthData: MonthData = {
//             month: currentDate.toLocaleDateString('en-US', { month: 'long' }),
//             year: currentYear,
//             entries: monthEntries,
//             totalEntries: monthEntries.length,
//             totalDays: uniqueDays,
//             avgMood,
//             totalWords,
//             moodTrend,
//             highlights,
//             lowlights,
//             topTags,
//             topEmotions,
//             insights,
//             isGeneratingSummary: true,
//         };

//         // Generate AI summary with caching
//         try {
//             const cacheId = `month_${currentYear}_${currentMonth}`;
//             const aiSummary = await generateOpenAISummary(
//                 monthEntries,
//                 'month',
//                 undefined,
//                 undefined,
//                 cacheId
//             );
//             monthData.aiSummary = aiSummary;
//         } catch (error) {
//             console.error('Failed to generate monthly summary:', error);
//             monthData.aiSummary = `This month included ${monthEntries.length} journal entries across ${uniqueDays} days with an average mood of ${avgMood.toFixed(1)}/10. Key themes: ${topTags.slice(0, 3).join(', ')}.`;
//         }

//         monthData.isGeneratingSummary = false;
//         return monthData;
//     };

//     const generateMonthlyData = async () => {
//         setIsLoading(true);
//         try {
//             const data = showDummyData ? generateDummyMonthlyData() : await generateRealMonthlyData();
//             setMonthlyData(data);
//         } catch (error) {
//             console.error('Error generating monthly data:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//     setIsLoading(true);
//     try {
//         const data = showDummyData ? generateDummyMonthlyData() : await generateRealMonthlyData();
//         setMonthlyData(data);
//     } catch (error) {
//         console.error('Error generating monthly data:', error);
//     } finally {
//         setIsLoading(false);
//     }
// };

// if (!showDummyData && entries.length === 0) {
//     return (
//         <View style={styles.emptyState}>
//             <Text style={styles.emptyTitle}>No monthly data yet</Text>
//             <Text style={styles.emptySubtitle}>Journal throughout the month to see insights</Text>
//         </View>
//     );
// }

// if (isLoading || !monthlyData) {
//     return (
//         <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#667eea" />
//             <Text style={styles.loadingText}>Analyzing monthly patterns...</Text>
//         </View>
//     );
// }

// const getMoodTrendColor = (trend: string) => {
//     switch (trend) {
//         case 'improving': return '#4CAF50';
//         case 'declining': return '#F44336';
//         default: return '#FF9800';
//     }
// };

// const getMoodTrendIcon = (trend: string) => {
//     switch (trend) {
//         case 'improving': return 'trending-up';
//         case 'declining': return 'trending-down';
//         default: return 'remove';
//     }
// };

// return (
//     <ScrollView
//         style={styles.viewContainer}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//     >
//         <View style={styles.monthHeader}>
//             <Text style={styles.monthTitle}>{monthlyData.month} {monthlyData.year}</Text>
//             <Text style={styles.monthSubtitle}>Your emotional landscape</Text>
//         </View>

//         {/* Month Overview Stats */}
//         <LinearGradient
//             colors={['#667eea', '#764ba2']}
//             style={styles.monthOverviewCard}
//         >
//             <View style={styles.monthStatsGrid}>
//                 <View style={styles.monthStatItem}>
//                     <Text style={styles.monthStatValue}>{monthlyData.totalDays}</Text>
//                     <Text style={styles.monthStatLabel}>Days Journaled</Text>
//                 </View>
//                 <View style={styles.monthStatItem}>
//                     <Text style={styles.monthStatValue}>{monthlyData.totalEntries}</Text>
//                     <Text style={styles.monthStatLabel}>Total Entries</Text>
//                 </View>
//                 <View style={styles.monthStatItem}>
//                     <Text style={styles.monthStatValue}>{monthlyData.avgMood.toFixed(1)}</Text>
//                     <Text style={styles.monthStatLabel}>Avg Mood</Text>
//                 </View>
//                 <View style={styles.monthStatItem}>
//                     <Text style={styles.monthStatValue}>{(monthlyData.totalWords / 1000).toFixed(1)}k</Text>
//                     <Text style={styles.monthStatLabel}>Words</Text>
//                 </View>
//             </View>

//             {/* Mood Trend */}
//             <View style={styles.moodTrendContainer}>
//                 <Ionicons
//                     name={getMoodTrendIcon(monthlyData.moodTrend)}
//                     size={20}
//                     color="white"
//                 />
//                 <Text style={styles.moodTrendText}>
//                     Mood trend: {monthlyData.moodTrend}
//                 </Text>
//             </View>
//         </LinearGradient>

//         {/* Top Tags */}
//         <View style={styles.monthCard}>
//             <Text style={styles.monthCardTitle}>Key Themes</Text>
//             <View style={styles.monthTagsContainer}>
//                 {monthlyData.topTags.map((tag, index) => (
//                     <View key={index} style={styles.monthTag}>
//                         <Text style={styles.monthTagText}>{tag}</Text>
//                     </View>
//                 ))}
//             </View>
//         </View>

//         {/* Top Emotions */}
//         {monthlyData.topEmotions.length > 0 && (
//             <View style={styles.monthCard}>
//                 <Text style={styles.monthCardTitle}>Primary Emotions</Text>
//                 <View style={styles.emotionsContainer}>
//                     {monthlyData.topEmotions.map((emotion, index) => (
//                         <View key={index} style={styles.emotionItem}>
//                             <Text style={styles.emotionText}>{emotion}</Text>
//                         </View>
//                     ))}
//                 </View>
//             </View>
//         )}

//         {/* Highlights */}
//         <View style={styles.monthCard}>
//             <View style={styles.monthCardHeader}>
//                 <Text style={styles.monthCardTitle}>Highlights</Text>
//                 <Text style={styles.highlightEmoji}>✨</Text>
//             </View>
//             {monthlyData.highlights.map((highlight, index) => (
//                 <View key={index} style={styles.monthHighlightItem}>
//                     <View style={styles.monthHighlightDot} />
//                     <Text style={styles.monthHighlightText}>{highlight}</Text>
//                 </View>
//             ))}
//         </View>

//         {/* Lowlights/Challenges */}
//         {monthlyData.lowlights.length > 0 && (
//             <View style={styles.monthCard}>
//                 <View style={styles.monthCardHeader}>
//                     <Text style={styles.monthCardTitle}>Growth Areas</Text>
//                     <Text style={styles.highlightEmoji}>🎯</Text>
//                 </View>
//                 {monthlyData.lowlights.map((lowlight, index) => (
//                     <View key={index} style={styles.monthHighlightItem}>
//                         <View style={[styles.monthHighlightDot, { backgroundColor: '#FF9800' }]} />
//                         <Text style={styles.monthHighlightText}>{lowlight}</Text>
//                     </View>
//                 ))}
//             </View>
//         )}

//         {/* AI Summary */}
//         <View style={styles.aiMonthSummaryCard}>
//             <View style={styles.aiMonthSummaryHeader}>
//                 <Ionicons name="sparkles" size={20} color="#667eea" />
//                 <Text style={styles.aiMonthSummaryTitle}>AI Monthly Summary</Text>
//                 {monthlyData.isGeneratingSummary && (
//                     <ActivityIndicator size="small" color="#667eea" style={{ marginLeft: 8 }} />
//                 )}
//             </View>
//             <Text style={styles.aiMonthSummaryText}>
//                 {monthlyData.isGeneratingSummary ? 'Generating deep insights...' : monthlyData.aiSummary}
//             </Text>
//         </View>

//         {/* Insights */}
//         <View style={styles.monthCard}>
//             <Text style={styles.monthCardTitle}>Key Insights</Text>
//             {monthlyData.insights.map((insight, index) => (
//                 <View key={index} style={styles.insightItem}>
//                     <Ionicons name="bulb-outline" size={16} color="#667eea" />
//                     <Text style={styles.insightText}>{insight}</Text>
//                 </View>
//             ))}
//         </View>
//     </ScrollView>
// );
//   };

// // Main Unified History Screen
// const UnifiedHistoryScreen = ({ entries, showDummyData, onToggleDummyData }: UnifiedHistoryScreenProps) => {
//     const navigation = useNavigation();
//     const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
//     const fadeAnim = useRef(new Animated.Value(1)).current;
//     const panRef = useRef();

//     const handleViewChange = (view: 'daily' | 'weekly' | 'monthly') => {
//         if (view === currentView) return;

//         Animated.timing(fadeAnim, {
//             toValue: 0,
//             duration: 150,
//             useNativeDriver: true,
//         }).start(() => {
//             setCurrentView(view);
//             Animated.timing(fadeAnim, {
//                 toValue: 1,
//                 duration: 150,
//                 useNativeDriver: true,
//             }).start();
//         });
//     };

//     const handleSwipeGesture = (event: any) => {
//         const { translationX, state } = event.nativeEvent;

//         if (state === State.END) {
//             const views = ['daily', 'weekly', 'monthly'];
//             const currentIndex = views.indexOf(currentView);

//             if (translationX > 100 && currentIndex > 0) {
//                 handleViewChange(views[currentIndex - 1] as any);
//             } else if (translationX < -100 && currentIndex < views.length - 1) {
//                 handleViewChange(views[currentIndex + 1] as any);
//             }
//         }
//     };

//     const navigateToDayDetail = (day: any) => {
//         navigation.navigate('DayDetail', { day } as never);
//     };

//     const handleToggleDummyData = () => {
//         Alert.alert(
//             showDummyData ? 'Hide Demo Data' : 'Show Demo Data',
//             showDummyData
//                 ? 'This will hide the demo data and show your real journal entries.'
//                 : 'This will show demo data with AI analysis examples.',
//             [
//                 { text: 'Cancel', style: 'cancel' },
//                 {
//                     text: showDummyData ? 'Hide Demo' : 'Show Demo',
//                     onPress: onToggleDummyData,
//                 },
//             ]
//         );
//     };

//     const renderCurrentView = () => {
//         switch (currentView) {
//             case 'daily':
//                 return <DailyView entries={entries} showDummyData={showDummyData} onNavigateToDay={navigateToDayDetail} />;
//             case 'weekly':
//                 return <WeeklyView entries={entries} showDummyData={showDummyData} />;
//             case 'monthly':
//                 return <MonthlyView entries={entries} showDummyData={showDummyData} />;
//             default:
//                 return <DailyView entries={entries} showDummyData={showDummyData} onNavigateToDay={navigateToDayDetail} />;
//         }
//     };

//     return (
//         <SafeAreaView style={styles.container}>
//             <View style={styles.header}>
//                 <View style={styles.headerTop}>
//                     <Text style={styles.headerTitle}>History</Text>
//                     <View style={styles.headerButtons}>
//                         <TouchableOpacity style={styles.statsButton} onPress={handleToggleDummyData}>
//                             <Ionicons
//                                 name={showDummyData ? "eye-off" : "eye"}
//                                 size={20}
//                                 color="#667eea"
//                             />
//                         </TouchableOpacity>
//                         <TouchableOpacity
//                             style={styles.settingsButton}
//                             onPress={() => navigation.navigate('Settings' as never)}
//                         >
//                             <Ionicons name="settings-outline" size={20} color="#667eea" />
//                         </TouchableOpacity>
//                     </View>
//                 </View>

//                 <View style={styles.viewToggle}>
//                     <TouchableOpacity
//                         style={[styles.toggleButton, currentView === 'daily' && styles.toggleButtonActive]}
//                         onPress={() => handleViewChange('daily')}
//                     >
//                         <Text style={[styles.toggleText, currentView === 'daily' && styles.toggleTextActive]}>
//                             Daily
//                         </Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                         style={[styles.toggleButton, currentView === 'weekly' && styles.toggleButtonActive]}
//                         onPress={() => handleViewChange('weekly')}
//                     >
//                         <Text style={[styles.toggleText, currentView === 'weekly' && styles.toggleTextActive]}>
//                             Weekly
//                         </Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                         style={[styles.toggleButton, currentView === 'monthly' && styles.toggleButtonActive]}
//                         onPress={() => handleViewChange('monthly')}
//                     >
//                         <Text style={[styles.toggleText, currentView === 'monthly' && styles.toggleTextActive]}>
//                             Monthly
//                         </Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>

//             <PanGestureHandler
//                 ref={panRef}
//                 onGestureEvent={handleSwipeGesture}
//                 enabled={true}
//             >
//                 <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
//                     {showDummyData && (
//                         <View style={styles.dummyDataIndicator}>
//                             <Ionicons name="information-circle" size={16} color="#667eea" />
//                             <Text style={styles.dummyDataText}>
//                                 Showing AI-enhanced demo data
//                             </Text>
//                         </View>
//                     )}
//                     {renderCurrentView()}
//                 </Animated.View>
//             </PanGestureHandler>
//         </SafeAreaView>
//     );
// };

// export default UnifiedHistoryScreen;