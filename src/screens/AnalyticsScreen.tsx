import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Entry } from '../types/journal';

interface AnalyticsScreenProps {
  entries: Entry[];
}

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ entries }: AnalyticsScreenProps) {
  
  const analytics = useMemo(() => {
    if (entries.length === 0) {
      return {
        averageMood: 0,
        moodTrend: 0,
        weekdayMoods: {},
        topThemes: [],
        totalWords: 0,
        averageWordsPerEntry: 0,
        bestDay: null,
        toughestDay: null,
        weeklyDigest: null,
      };
    }

    // Calculate mood analytics
    const moodsWithDates = entries
      .filter(entry => entry.manualMood)
      .map(entry => ({
        mood: entry.manualMood!,
        date: new Date(entry.date),
        entry: entry
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const averageMood = moodsWithDates.length > 0 
      ? moodsWithDates.reduce((sum, item) => sum + item.mood, 0) / moodsWithDates.length
      : 0;

    // Calculate 7-day trend
    const recent7Days = moodsWithDates.slice(-7);
    const earlier7Days = moodsWithDates.slice(-14, -7);
    
    const recentAvg = recent7Days.length > 0 
      ? recent7Days.reduce((sum, item) => sum + item.mood, 0) / recent7Days.length
      : 0;
    const earlierAvg = earlier7Days.length > 0 
      ? earlier7Days.reduce((sum, item) => sum + item.mood, 0) / earlier7Days.length
      : recentAvg;
    
    const moodTrend = recentAvg - earlierAvg;

    // Weekday analysis
    const weekdayMoods: { [key: string]: number[] } = {
      Sunday: [], Monday: [], Tuesday: [], Wednesday: [], 
      Thursday: [], Friday: [], Saturday: []
    };
    
    moodsWithDates.forEach(item => {
      const dayName = item.date.toLocaleDateString('en-US', { weekday: 'long' });
      weekdayMoods[dayName].push(item.mood);
    });

    const weekdayAverages = Object.entries(weekdayMoods).map(([day, moods]) => ({
      day: day.substring(0, 3),
      average: moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0,
      count: moods.length
    }));

    // Theme analysis
    const allThemes = entries.flatMap(entry => entry.themes || []);
    const themeCount = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    const topThemes = Object.entries(themeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }));

    // Word count analysis
    const totalWords = entries.reduce((sum, entry) => {
      return sum + (entry.text?.split(/\s+/).length || 0);
    }, 0);
    
    const averageWordsPerEntry = entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

    // Best and toughest days
    const bestDay = moodsWithDates.length > 0 
      ? moodsWithDates.reduce((best, current) => 
          current.mood > best.mood ? current : best
        )
      : null;
    
    const toughestDay = moodsWithDates.length > 0
      ? moodsWithDates.reduce((tough, current) => 
          current.mood < tough.mood ? current : tough
        )
      : null;

    // Weekly digest
    const lastWeekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });

    const thisWeekThemes = lastWeekEntries.flatMap(entry => entry.themes || []);
    const thisWeekThemeCount = thisWeekThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const weeklyDigest = {
      entriesCount: lastWeekEntries.length,
      topTheme: Object.entries(thisWeekThemeCount).sort(([,a], [,b]) => b - a)[0]?.[0],
      averageMood: lastWeekEntries
        .filter(e => e.manualMood)
        .reduce((sum, e, _, arr) => sum + (e.manualMood! / arr.length), 0) || 0
    };

    return {
      averageMood,
      moodTrend,
      weekdayMoods: weekdayAverages,
      topThemes,
      totalWords,
      averageWordsPerEntry,
      bestDay,
      toughestDay,
      weeklyDigest,
    };
  }, [entries]);

  const getMoodEmoji = (mood: number) => {
    const moodEmojis = ['😔', '😕', '😐', '🙂', '😊'];
    return moodEmojis[Math.round(mood) - 1] || '😐';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.2) return { icon: 'trending-up', color: '#5CB85C', text: 'Improving' };
    if (trend < -0.2) return { icon: 'trending-down', color: '#d9534f', text: 'Declining' };
    return { icon: 'remove', color: '#FFA500', text: 'Stable' };
  };

  const trendInfo = getTrendIcon(analytics.moodTrend);

  if (entries.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data yet!</Text>
          <Text style={styles.emptySubtext}>Create some journal entries to see your analytics</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Your journey insights</Text>
      </View>

      {/* Mood Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😊 Mood Overview</Text>
        
        <View style={styles.moodOverviewCard}>
          <View style={styles.moodMainStat}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(analytics.averageMood)}</Text>
            <View>
              <Text style={styles.moodNumber}>{analytics.averageMood.toFixed(1)}/5</Text>
              <Text style={styles.moodLabel}>Average Mood</Text>
            </View>
          </View>
          
          <View style={styles.moodTrend}>
            <Ionicons name={trendInfo.icon as any} size={20} color={trendInfo.color} />
            <Text style={[styles.trendText, { color: trendInfo.color }]}>{trendInfo.text}</Text>
            <Text style={styles.trendValue}>
              {analytics.moodTrend > 0 ? '+' : ''}{analytics.moodTrend.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Weekday Patterns */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Weekday Patterns</Text>
        <View style={styles.weekdayChart}>
          {analytics.weekdayMoods.map((day, index) => (
            <View key={day.day} style={styles.weekdayBar}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: day.count > 0 ? Math.max((day.average / 5) * 80, 10) : 10,
                      backgroundColor: day.count > 0 ? '#4A90E2' : '#E0E0E0'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.weekdayLabel}>{day.day}</Text>
              {day.count > 0 && (
                <Text style={styles.weekdayValue}>{day.average.toFixed(1)}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Top Themes */}
      {analytics.topThemes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Top Themes</Text>
          <View style={styles.themesContainer}>
            {analytics.topThemes.map((theme, index) => (
              <View key={theme.theme} style={styles.themeItem}>
                <View style={styles.themeRank}>
                  <Text style={styles.themeRankText}>{index + 1}</Text>
                </View>
                <View style={styles.themeInfo}>
                  <Text style={styles.themeName}>{theme.theme}</Text>
                  <Text style={styles.themeCount}>{theme.count} entries</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Journaling Habits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✍️ Journaling Habits</Text>
        <View style={styles.habitsGrid}>
          <View style={styles.habitCard}>
            <Text style={styles.habitNumber}>{entries.length}</Text>
            <Text style={styles.habitLabel}>Total Entries</Text>
          </View>
          <View style={styles.habitCard}>
            <Text style={styles.habitNumber}>{analytics.totalWords.toLocaleString()}</Text>
            <Text style={styles.habitLabel}>Words Written</Text>
          </View>
          <View style={styles.habitCard}>
            <Text style={styles.habitNumber}>{analytics.averageWordsPerEntry}</Text>
            <Text style={styles.habitLabel}>Avg Words/Entry</Text>
          </View>
        </View>
      </View>

      {/* Best & Toughest Days */}
      {(analytics.bestDay || analytics.toughestDay) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Memorable Days</Text>
          
          {analytics.bestDay && (
            <View style={[styles.dayCard, styles.bestDayCard]}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayEmoji}>😊</Text>
                <View>
                  <Text style={styles.dayTitle}>Best Day</Text>
                  <Text style={styles.dayDate}>
                    {analytics.bestDay.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <Text style={styles.dayMood}>{analytics.bestDay.mood}/5</Text>
              </View>
              <Text style={styles.dayText} numberOfLines={2}>
                {analytics.bestDay.entry.text}
              </Text>
            </View>
          )}

          {analytics.toughestDay && (
            <View style={[styles.dayCard, styles.toughDayCard]}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayEmoji}>😔</Text>
                <View>
                  <Text style={styles.dayTitle}>Toughest Day</Text>
                  <Text style={styles.dayDate}>
                    {analytics.toughestDay.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <Text style={styles.dayMood}>{analytics.toughestDay.mood}/5</Text>
              </View>
              <Text style={styles.dayText} numberOfLines={2}>
                {analytics.toughestDay.entry.text}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Weekly Digest */}
      {analytics.weeklyDigest && analytics.weeklyDigest.entriesCount > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 This Week Summary</Text>
          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyText}>
              🖊️ You wrote <Text style={styles.highlightText}>{analytics.weeklyDigest.entriesCount} entries</Text> this week
              {analytics.weeklyDigest.topTheme && (
                <Text>, with <Text style={styles.highlightText}>"{analytics.weeklyDigest.topTheme}"</Text> being your main theme</Text>
              )}.
            </Text>
            {analytics.weeklyDigest.averageMood > 0 && (
              <Text style={styles.weeklyMood}>
                📈 Average mood: <Text style={styles.highlightText}>{analytics.weeklyDigest.averageMood.toFixed(1)}/5</Text> {getMoodEmoji(analytics.weeklyDigest.averageMood)}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Data Summary */}
      {entries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Data Overview</Text>
          <View style={styles.dataOverviewCard}>
            <Text style={styles.dataText}>
              📝 <Text style={styles.highlightText}>{entries.length} total entries</Text> across {Math.ceil(entries.length / 3)} days
            </Text>
            <Text style={styles.dataText}>
              🏷️ <Text style={styles.highlightText}>{analytics.topThemes.length} active themes</Text> discovered
            </Text>
            <Text style={styles.dataText}>
              🤖 <Text style={styles.highlightText}>{entries.filter(e => e.aiAnalyzed).length} AI-analyzed</Text> entries
            </Text>
            <Text style={styles.dataText}>
              🎙️ <Text style={styles.highlightText}>{entries.filter(e => e.transcribed).length} voice-to-text</Text> entries
            </Text>
            {entries.filter(e => e.tags.includes('dummy')).length > 0 && (
              <Text style={styles.dataText}>
                🛠️ <Text style={styles.highlightText}>{entries.filter(e => e.tags.includes('dummy')).length} test entries</Text> (can be removed)
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Bottom padding for tab bar */}
      <View style={styles.bottomPadding} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Mood Overview
  moodOverviewCard: {
    backgroundColor: '#f8f9ff',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodMainStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  moodEmoji: {
    fontSize: 36,
  },
  moodNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  moodLabel: {
    fontSize: 14,
    color: '#666',
  },
  moodTrend: {
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendValue: {
    fontSize: 11,
    color: '#666',
  },
  
  // Weekday Chart
  weekdayChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  weekdayBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  weekdayLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  weekdayValue: {
    fontSize: 10,
    color: '#4A90E2',
    fontWeight: '600',
  },
  
  // Themes
  themesContainer: {
    gap: 10,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  themeRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  themeCount: {
    fontSize: 12,
    color: '#666',
  },
  
  // Habits Grid
  habitsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  habitCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  habitNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  habitLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Day Cards
  dayCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  bestDayCard: {
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: '#5CB85C',
  },
  toughDayCard: {
    backgroundColor: '#FFE8E8',
    borderLeftWidth: 4,
    borderLeftColor: '#d9534f',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  dayEmoji: {
    fontSize: 24,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dayDate: {
    fontSize: 12,
    color: '#666',
  },
  dayMood: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  dayText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  
  // Weekly Digest
  weeklyCard: {
    backgroundColor: '#f8f9ff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  weeklyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  weeklyMood: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginTop: 5,
  },
  highlightText: {
    fontWeight: '700',
    color: '#4A90E2',
  },
  
  // Data overview
  dataOverviewCard: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    gap: 8,
  },
  dataText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  
  bottomPadding: {
    height: 10, // Reduced since tab bar is now taller
  },
});