import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WeekData } from '../types/history';
import { historyStyles, weeklyStyles } from '../styles/historyStyles';
import { generateOpenAISummary } from '../services/openAiService';
import { clearExpiredCache, WEEKLY_CACHE_KEY } from '../services/cacheService';

interface WeeklyViewProps {
  entries: any[];
  showDummyData: boolean;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({ entries, showDummyData }) => {
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateWeeklyData();
    clearExpiredCache(WEEKLY_CACHE_KEY);
  }, [entries, showDummyData]);

  const generateDummyWeeklyData = (): WeekData[] => {
    const weeks: WeekData[] = [];
    const today = new Date();

    for (let weekOffset = 0; weekOffset < 8; weekOffset++) {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - (weekOffset * 7) - today.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const moodData = Array(7).fill(0).map(() => 20 + Math.random() * 75);
      const avgMood = moodData.reduce((sum, mood) => sum + mood, 0) / 7 / 10;

      weeks.push({
        id: `week_${weekOffset}`,
        startDate,
        endDate,
        entries: [],
        entryCount: Math.floor(Math.random() * 15) + 5,
        moodData,
        avgMood,
        totalWords: Math.floor(Math.random() * 2000) + 500,
        highlights: [
          'Morning meditation breakthrough',
          'Completed challenging project',
          'Personal growth insight'
        ],
        lowlights: [
          'Stressful week at work',
          'Difficulty sleeping'
        ],
        topTags: ['mindfulness', 'work', 'growth', 'stress', 'sleep'],
        aiSummary: `This week showed strong emotional resilience with ${Math.floor(Math.random() * 15) + 5} journal entries. Key themes included mindfulness practice and professional growth, with some challenges around work-life balance.`,
      });
    }

    return weeks;
  };

  const generateRealWeeklyData = async (): Promise<WeekData[]> => {
    if (!entries || entries.length === 0) return [];

    const weeks: { [key: string]: any[] } = {};

    entries.forEach((entry: any) => {
      const date = new Date(entry.date || entry.createdAt);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weekKey = startOfWeek.toISOString();

      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(entry);
    });

    const weeklyData: WeekData[] = [];

    for (const [weekKey, weekEntries] of Object.entries(weeks)) {
      const startDate = new Date(weekKey);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const moodData = Array(7).fill(0).map((_, dayIndex) => {
        const dayEntries = weekEntries.filter(entry => {
          const entryDate = new Date(entry.date || entry.createdAt);
          const targetDate = new Date(startDate);
          targetDate.setDate(startDate.getDate() + dayIndex);
          return entryDate.toDateString() === targetDate.toDateString();
        });

        if (dayEntries.length === 0) return 20;
        const avgMood = dayEntries.reduce((sum, e) => sum + (e.mood?.score || 7), 0) / dayEntries.length;
        return Math.min(95, Math.max(20, avgMood * 10));
      });

      const avgMood = weekEntries.reduce((sum, e) => sum + (e.mood?.score || 7), 0) / weekEntries.length;
      const totalWords = weekEntries.reduce((sum, e) => sum + (e.text?.split(' ').length || 0), 0);

      const allTags = weekEntries.flatMap(e => e.tags || []);
      const tagFrequency = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topTags = Object.entries(tagFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      const sortedEntries = weekEntries.sort((a, b) => (b.mood?.score || 7) - (a.mood?.score || 7));
      const highlights = sortedEntries.slice(0, 3).map(e => e.title || 'Positive moment');
      const lowlights = sortedEntries.slice(-2).filter(e => (e.mood?.score || 7) < 6).map(e => e.title || 'Challenging moment');

      const weekData: WeekData = {
        id: weekKey,
        startDate,
        endDate,
        entries: weekEntries,
        entryCount: weekEntries.length,
        moodData,
        avgMood,
        totalWords,
        highlights,
        lowlights,
        topTags,
        isGeneratingSummary: true,
      };

      weeklyData.push(weekData);
    }

    weeklyData.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    for (const week of weeklyData) {
      if (week.entries.length > 0) {
        try {
          const cacheId = `week_${week.startDate.toISOString().split('T')[0]}`;
          const aiSummary = await generateOpenAISummary(
            week.entries,
            'week',
            week.startDate,
            week.endDate,
            cacheId
          );
          week.aiSummary = aiSummary;
        } catch (error) {
          console.error('Failed to generate weekly summary:', error);
          week.aiSummary = `Week of ${week.entryCount} entries with average mood ${week.avgMood.toFixed(1)}/10. Top themes: ${week.topTags.slice(0, 3).join(', ')}.`;
        }
      }
      week.isGeneratingSummary = false;
    }

    return weeklyData;
  };

  const generateWeeklyData = async () => {
    setIsLoading(true);
    try {
      let data;
      if (showDummyData) {
        data = generateDummyWeeklyData();
      } else {
        data = await generateRealWeeklyData();
      }
      setWeeklyData(data);
    } catch (error) {
      console.error('Error generating weekly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatWeekDates = (startDate: Date, endDate: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const startMonth = months[startDate.getMonth()];
    const endMonth = months[endDate.getMonth()];

    if (startMonth === endMonth) {
        return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}`;
    }
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`;
  };

  if (!showDummyData && entries.length === 0) {
    return (
      <View style={historyStyles.emptyState}>
        <Text style={historyStyles.emptyTitle}>No weekly data yet</Text>
        <Text style={historyStyles.emptySubtitle}>Journal for a few days to see weekly patterns</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={historyStyles.viewContainer}
      contentContainerStyle={historyStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {isLoading ? (
        <View style={historyStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={historyStyles.loadingText}>Analyzing weekly patterns...</Text>
        </View>
      ) : (
        weeklyData.map((week) => (
          <View key={week.id} style={weeklyStyles.weekCard}>
            <View style={weeklyStyles.weekHeader}>
              <Text style={weeklyStyles.weekDates}>
                {formatWeekDates(week.startDate, week.endDate)}
              </Text>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={weeklyStyles.entryCountBadge}
              >
                <Text style={weeklyStyles.entryCountText}>{week.entryCount} entries</Text>
              </LinearGradient>
            </View>

            <View style={weeklyStyles.moodChart}>
              {week.moodData.map((height, index) => (
                <LinearGradient
                  key={index}
                  colors={['#667eea', '#764ba2']}
                  style={[weeklyStyles.moodChartBar, { height: `${height}%` }]}
                />
              ))}
            </View>

            <View style={weeklyStyles.weekStats}>
              <View style={weeklyStyles.statItem}>
                <Text style={weeklyStyles.statValue}>{week.avgMood.toFixed(1)}</Text>
                <Text style={weeklyStyles.statLabel}>Avg Mood</Text>
              </View>
              <View style={weeklyStyles.statItem}>
                <Text style={weeklyStyles.statValue}>{week.totalWords}</Text>
                <Text style={weeklyStyles.statLabel}>Words</Text>
              </View>
              <View style={weeklyStyles.statItem}>
                <Text style={weeklyStyles.statValue}>{week.topTags.length}</Text>
                <Text style={weeklyStyles.statLabel}>Themes</Text>
              </View>
            </View>

            {week.topTags.length > 0 && (
              <View style={weeklyStyles.tagsSection}>
                <Text style={weeklyStyles.sectionLabel}>Top Themes</Text>
                <View style={weeklyStyles.tagsContainer}>
                  {week.topTags.slice(0, 5).map((tag, index) => (
                    <View key={index} style={weeklyStyles.tag}>
                      <Text style={weeklyStyles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={weeklyStyles.highlightsSection}>
              <Text style={weeklyStyles.sectionLabel}>Highlights</Text>
              {week.highlights.slice(0, 3).map((highlight, index) => (
                <View key={index} style={weeklyStyles.highlightItem}>
                  <Text style={weeklyStyles.highlightEmoji}>✨</Text>
                  <Text style={weeklyStyles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>

            {week.lowlights.length > 0 && (
              <View style={weeklyStyles.lowlightsSection}>
                <Text style={weeklyStyles.sectionLabel}>Challenges</Text>
                {week.lowlights.map((lowlight, index) => (
                  <View key={index} style={weeklyStyles.highlightItem}>
                    <Text style={weeklyStyles.highlightEmoji}>🎯</Text>
                    <Text style={weeklyStyles.highlightText}>{lowlight}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={weeklyStyles.aiSummarySection}>
              <View style={weeklyStyles.aiSummaryHeader}>
                <Ionicons name="sparkles" size={16} color="#667eea" />
                <Text style={weeklyStyles.aiSummaryLabel}>Week Summary</Text>
                {week.isGeneratingSummary && (
                  <ActivityIndicator size="small" color="#667eea" style={{ marginLeft: 8 }} />
                )}
              </View>
              <Text style={weeklyStyles.aiSummaryText}>
                {week.isGeneratingSummary ? 'Generating insights...' : week.aiSummary}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default WeeklyView;