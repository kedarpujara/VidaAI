import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface DayEntry {
  id: string;
  date: Date;
  entries: JournalEntry[];
  moodAverage: number;
  highlights: string;
  stats: {
    audioMinutes: number;
    photos: number;
    words: number;
  };
  aiInsights?: string[];
}

interface JournalEntry {
  id: string;
  time: Date;
  title: string;
  content: string;
  mood: string;
  moodScore: number;
  type: 'voice' | 'text' | 'photo';
  attachments?: string[];
  aiAnalysis?: any;
  autoTags?: string[];
}

interface DailyHistoryScreenProps {
  entries: any[];
  showDummyData: boolean;
  onToggleDummyData: () => void;
  currentView: 'daily' | 'weekly' | 'monthly';
  onViewChange: (view: 'daily' | 'weekly' | 'monthly') => void;
}

// Enhanced dummy data generator with AI analysis
const generateDummyData = (): DayEntry[] => {
  const dummyEntries: DayEntry[] = [];
  const today = new Date();
  
  const moods = [
    { emoji: '😢', score: 2, label: 'sad' },
    { emoji: '😞', score: 3, label: 'down' },
    { emoji: '😐', score: 5, label: 'neutral' },
    { emoji: '🙂', score: 7, label: 'good' },
    { emoji: '😊', score: 8, label: 'happy' },
    { emoji: '🤩', score: 9, label: 'amazing' },
  ];

  const aiInsightsPool = [
    'Strong emotional awareness evident in reflections',
    'Consistent growth mindset throughout entries',
    'Effective stress management strategies being developed',
    'Positive relationships contributing to well-being',
    'Creative expression emerging as a key theme',
    'Work-life balance improving over time',
    'Self-compassion practices showing progress',
  ];

  const enhancedTitles = [
    'Morning mindfulness breakthrough',
    'Coffee contemplations on change',
    'Workplace collaboration wins',
    'Nature walk revelations',
    'Creative flow afternoon',
    'Evening gratitude practice',
    'Deep conversation insights',
    'Exercise motivation discovery',
    'Family connection moments',
    'Personal boundary setting',
    'Problem-solving clarity',
    'Spontaneous joy moments',
    'Learning integration time',
    'Emotional processing session',
    'Future visioning exercise',
  ];

  const enhancedContents = [
    'Today I discovered something profound about the relationship between acceptance and growth. The meditation helped me see that resistance often blocks the very changes I seek.',
    'An unexpected conversation shifted my entire perspective on what success means. Sometimes the most valuable insights come from the most ordinary interactions.',
    'I\'m noticing patterns in how I handle stress - the techniques are working, but consistency is key. Small daily practices are creating bigger shifts than I expected.',
    'The connection between physical movement and mental clarity became so apparent today. Walking outside literally changed the quality of my thoughts.',
    'Creative work felt effortless today. There\'s something magical about being in flow state - time disappears and ideas just emerge naturally.',
    'Practicing gratitude is rewiring my brain. I\'m automatically noticing positive details that I used to miss completely.',
    'Setting boundaries felt scary but necessary. I\'m learning that saying no to some things means saying yes to what truly matters.',
    'The emotional processing I did today revealed underlying patterns I hadn\'t recognized. Awareness is the first step to transformation.',
    'Connected deeply with someone today in a way that reminded me why relationships are the foundation of a meaningful life.',
    'Reflecting on my growth over the past month - the changes are subtle but real. I\'m becoming more of who I want to be.',
  ];

      for (let dayOffset = 0; dayOffset < 45; dayOffset++) {
    // Skip day 25 to create a 20-day streak
    if (dayOffset === 25) continue;
    
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - dayOffset);
    
    const dayEntries: JournalEntry[] = [];
    
    // Generate 2-4 entries per day
    const entryCount = Math.floor(Math.random() * 3) + 2;
    for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
      const entryTime = new Date(currentDate);
      entryTime.setHours(6 + entryIndex * 4 + Math.floor(Math.random() * 3));
      entryTime.setMinutes(Math.floor(Math.random() * 60));
      
      const mood = moods[Math.floor(Math.random() * moods.length)];
      const hasAudio = Math.random() > 0.6;
      const hasPhoto = Math.random() > 0.7;
      
      // Generate AI analysis for dummy data
      const aiAnalysis = {
        emotions: ['reflective', 'optimistic', 'grateful'].slice(0, Math.floor(Math.random() * 3) + 1),
        topics: ['personal-growth', 'relationships', 'creativity'].slice(0, Math.floor(Math.random() * 2) + 1),
        sentiment: mood.score >= 6 ? 'positive' : mood.score <= 4 ? 'negative' : 'neutral',
        sentimentScore: (mood.score - 5) / 5,
        keywords: ['growth', 'insight', 'connection', 'mindfulness'].slice(0, Math.floor(Math.random() * 3) + 2),
        themes: ['self-discovery', 'emotional-intelligence'],
        activities: ['reflection', 'meditation', 'conversation'].slice(0, Math.floor(Math.random() * 2) + 1),
        people: Math.random() > 0.5 ? ['friend', 'colleague'] : [],
        locations: Math.random() > 0.5 ? ['home', 'office', 'park'][Math.floor(Math.random() * 3)] : [],
        summary: enhancedContents[Math.floor(Math.random() * enhancedContents.length)].split('.')[0] + '.',
        insights: [aiInsightsPool[Math.floor(Math.random() * aiInsightsPool.length)]],
        suggestedTags: ['mindfulness', 'growth', 'reflection', 'insight'].slice(0, Math.floor(Math.random() * 3) + 2),
        confidence: 0.8 + Math.random() * 0.2,
        analysisVersion: 'v1.0'
      };
      
      dayEntries.push({
        id: `entry_${dayOffset}_${entryIndex}`,
        time: entryTime,
        title: enhancedTitles[Math.floor(Math.random() * enhancedTitles.length)],
        content: enhancedContents[Math.floor(Math.random() * enhancedContents.length)],
        mood: mood.emoji,
        moodScore: mood.score,
        type: hasAudio ? 'voice' : 'text',
        attachments: hasPhoto ? ['photo1'] : undefined,
        aiAnalysis,
        autoTags: aiAnalysis.suggestedTags,
      });
    }
    
    // Calculate day stats
    const moodAverage = dayEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / dayEntries.length;
    const audioMinutes = dayEntries.filter(e => e.type === 'voice').length * 3;
    const photos = dayEntries.filter(e => e.attachments?.length).length;
    const words = dayEntries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0);
    
    // Generate AI insights for the day
    const dayAIInsights = [
      `Emotional pattern: ${moodAverage >= 7 ? 'Consistently positive' : moodAverage >= 5 ? 'Balanced emotional state' : 'Processing challenges'}`,
      `Growth indicators: ${dayEntries.filter(e => e.aiAnalysis?.themes.includes('self-discovery')).length > 0 ? 'Self-reflection present' : 'Focus on external experiences'}`,
      `Social connection: ${dayEntries.filter(e => e.aiAnalysis?.people.length > 0).length > 0 ? 'Meaningful interactions noted' : 'Solo processing time'}`,
    ];
    
    dummyEntries.push({
      id: `day_${dayOffset}`,
      date: currentDate,
      entries: dayEntries,
      moodAverage,
      highlights: dayEntries[0].title,
      stats: {
        audioMinutes,
        photos,
        words,
      },
      aiInsights: dayAIInsights,
    });
  }
  
  return dummyEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const DailyHistoryScreen = ({ 
  entries, 
  showDummyData, 
  onToggleDummyData, 
  currentView,
  onViewChange 
}: DailyHistoryScreenProps) => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Use dummy data if enabled, otherwise convert real entries
  const mockDays = showDummyData ? generateDummyData() : convertEntriesToDays();

  // Convert app entries to display format
  function convertEntriesToDays(): DayEntry[] {
    if (!entries || entries.length === 0) {
      return [];
    }

    const groupedByDate = entries.reduce((acc: any, entry: any) => {
      const date = new Date(entry.date).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({
        id: entry.id,
        time: new Date(entry.date),
        title: entry.title || 'Journal Entry',
        content: entry.text || entry.content || '',
        mood: entry.mood?.emoji || '😊',
        moodScore: entry.mood?.score || 7,
        type: entry.transcribed ? 'voice' : 'text',
        attachments: entry.photoUri ? ['photo1'] : [],
        aiAnalysis: entry.aiAnalysis,
        autoTags: entry.autoTags || [],
      });
      return acc;
    }, {});

    return Object.entries(groupedByDate).map(([dateStr, dayEntries]: [string, any]) => {
      const moodAverage = dayEntries.reduce((sum: number, e: any) => sum + e.moodScore, 0) / dayEntries.length;
      
      // Generate AI insights from real entries
      const aiInsights: string[] = [];
      const analyzedEntries = dayEntries.filter((e: any) => e.aiAnalysis);
      
      if (analyzedEntries.length > 0) {
        const emotions = analyzedEntries.flatMap((e: any) => e.aiAnalysis.emotions);
        const themes = analyzedEntries.flatMap((e: any) => e.aiAnalysis.themes);
        const avgSentiment = analyzedEntries.reduce((sum: number, e: any) => 
          sum + e.aiAnalysis.sentimentScore, 0) / analyzedEntries.length;
        
        if (emotions.length > 0) {
          aiInsights.push(`Primary emotions: ${emotions.slice(0, 3).join(', ')}`);
        }
        if (themes.length > 0) {
          aiInsights.push(`Key themes: ${[...new Set(themes)].slice(0, 2).join(', ')}`);
        }
        aiInsights.push(`Sentiment trend: ${avgSentiment > 0.2 ? 'Positive' : avgSentiment < -0.2 ? 'Challenging' : 'Balanced'}`);
      }

      return {
        id: dateStr,
        date: new Date(dateStr),
        entries: dayEntries,
        moodAverage,
        highlights: dayEntries[0]?.title || 'Journal Entry',
        stats: {
          audioMinutes: dayEntries.filter((e: any) => e.type === 'voice').length * 3,
          photos: dayEntries.filter((e: any) => e.attachments?.length > 0).length,
          words: dayEntries.reduce((sum: number, e: any) => sum + (e.content?.split(' ').length || 0), 0),
        },
        aiInsights,
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  const handleViewChange = (view: 'daily' | 'weekly' | 'monthly') => {
    if (view === currentView) return;
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      onViewChange(view);
      if (view === 'weekly') {
        navigation.navigate('WeeklyHistory' as never);
      } else if (view === 'monthly') {
        navigation.navigate('MonthlyHistory' as never);
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const navigateToDayDetail = (day: DayEntry) => {
    navigation.navigate('DayDetail', { day } as never);
  };

  const handleToggleDummyData = () => {
    Alert.alert(
      showDummyData ? 'Hide Demo Data' : 'Show Demo Data',
      showDummyData 
        ? 'This will hide the demo data and show your real journal entries.'
        : 'This will show demo data for the past 45 days with AI analysis examples.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: showDummyData ? 'Hide Demo' : 'Show Demo', 
          onPress: onToggleDummyData,
          style: showDummyData ? 'destructive' : 'default'
        },
      ]
    );
  };

  const formatDate = (date: Date, format: 'full' | 'short' = 'full') => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    if (format === 'full') {
      return `${months[date.getMonth()]} ${date.getDate()}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return ['#56CCF2', '#2F80ED'];
    if (score >= 6) return ['#667eea', '#764ba2'];
    if (score >= 4) return ['#F093FB', '#F5576C'];
    return ['#8E8E93', '#C7C7CC'];
  };

  const calculateStreak = () => {
    if (mockDays.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < mockDays.length; i++) {
      const entryDate = new Date(mockDays[i].date);
      entryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (entryDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>History</Text>
          <TouchableOpacity style={styles.statsButton} onPress={handleToggleDummyData}>
            <Ionicons 
              name={showDummyData ? "eye-off" : "eye"} 
              size={20} 
              color="#667eea" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, currentView === 'daily' && styles.toggleButtonActive]}
            onPress={() => handleViewChange('daily')}
          >
            <Text style={[styles.toggleText, currentView === 'daily' && styles.toggleTextActive]}>
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, currentView === 'weekly' && styles.toggleButtonActive]}
            onPress={() => handleViewChange('weekly')}
          >
            <Text style={[styles.toggleText, currentView === 'weekly' && styles.toggleTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, currentView === 'monthly' && styles.toggleButtonActive]}
            onPress={() => handleViewChange('monthly')}
          >
            <Text style={[styles.toggleText, currentView === 'monthly' && styles.toggleTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Bar */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.streakBar}
        >
          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakNumber}>{currentStreak} days 🔥</Text>
          </View>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>🤖</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>🎯</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>📊</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Data Source Indicator */}
        {showDummyData && (
          <View style={styles.dummyDataIndicator}>
            <Ionicons name="information-circle" size={16} color="#667eea" />
            <Text style={styles.dummyDataText}>
              Showing AI-enhanced demo data - 45 days with smart analysis
            </Text>
          </View>
        )}

        {/* Day Summaries */}
        {mockDays.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>Start journaling to see your history here</Text>
          </View>
        ) : (
          mockDays.map((day, index) => (
            <TouchableOpacity
              key={day.id}
              style={styles.daySummary}
              onPress={() => navigateToDayDetail(day)}
              activeOpacity={0.7}
            >
              <View style={styles.dayHeader}>
                <Text style={styles.dayDate}>
                  {formatDate(day.date).toUpperCase()} • {day.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </Text>
                <View style={styles.entryCount}>
                  <Text style={styles.entryCountText}>{day.entries.length} entries</Text>
                </View>
              </View>

              <View style={styles.moodBar}>
                {day.entries.map((entry, idx) => (
                  <LinearGradient
                    key={idx}
                    colors={getMoodColor(entry.moodScore)}
                    style={[styles.moodSegment, { flex: 1 }]}
                  />
                ))}
              </View>

              <View style={styles.dayHighlight}>
                <Text style={styles.highlightTitle}>{day.highlights}</Text>
                <Text style={styles.highlightSnippet} numberOfLines={2}>
                  {day.entries[0]?.content}
                </Text>
              </View>

              {/* AI Insights Section */}
              {day.aiInsights && day.aiInsights.length > 0 && (
                <View style={styles.aiInsightsSection}>
                  <View style={styles.aiInsightHeader}>
                    <Ionicons name="bulb" size={14} color="#667eea" />
                    <Text style={styles.aiInsightLabel}>AI Insights</Text>
                  </View>
                  <Text style={styles.aiInsightText} numberOfLines={2}>
                    {day.aiInsights[0]}
                  </Text>
                </View>
              )}

              <View style={styles.dayMeta}>
                {day.stats.audioMinutes > 0 && (
                  <View style={styles.metaStat}>
                    <Text style={styles.metaStatText}>🎙 {day.stats.audioMinutes} min audio</Text>
                  </View>
                )}
                {day.stats.photos > 0 && (
                  <View style={styles.metaStat}>
                    <Text style={styles.metaStatText}>📷 {day.stats.photos} photos</Text>
                  </View>
                )}
                {day.stats.words > 0 && (
                  <View style={styles.metaStat}>
                    <Text style={styles.metaStatText}>✍️ {day.stats.words} words</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" style={styles.chevron} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  statsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 9,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  streakBar: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  streakInfo: {
    flexDirection: 'column',
  },
  streakLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#86868b',
    textAlign: 'center',
  },
  daySummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayDate: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  entryCount: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  entryCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
  moodBar: {
    flexDirection: 'row',
    height: 4,
    gap: 4,
    marginBottom: 12,
  },
  moodSegment: {
    height: 4,
    borderRadius: 2,
  },
  dayHighlight: {
    marginBottom: 12,
  },
  highlightTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  highlightSnippet: {
    fontSize: 15,
    color: '#3C3C43',
    opacity: 0.7,
    lineHeight: 21,
  },
  aiInsightsSection: {
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  aiInsightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
  aiInsightText: {
    fontSize: 13,
    color: '#667eea',
    lineHeight: 18,
  },
  dayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaStat: {
    marginRight: 16,
  },
  metaStatText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  chevron: {
    marginLeft: 'auto',
  },
  dummyDataIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  dummyDataText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
    flex: 1,
  },
});

export default DailyHistoryScreen;