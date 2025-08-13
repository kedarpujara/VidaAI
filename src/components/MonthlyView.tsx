import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MonthData } from '../types/history';
import { historyStyles, monthlyStyles } from '../styles/historyStyles';
import { generateOpenAISummary } from '../services/openAiService';
import { clearExpiredCache, MONTHLY_CACHE_KEY } from '../services/cacheService';

interface MonthlyViewProps {
  entries: any[];
  showDummyData: boolean;
}

const MonthlyView: React.FC<MonthlyViewProps> = ({ entries, showDummyData }) => {
  const [monthlyData, setMonthlyData] = useState<MonthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateMonthlyData();
    clearExpiredCache(MONTHLY_CACHE_KEY);
  }, [entries, showDummyData]);

  const generateDummyMonthlyData = (): MonthData => {
    const currentDate = new Date();
    return {
      month: currentDate.toLocaleDateString('en-US', { month: 'long' }),
      year: currentDate.getFullYear(),
      entries: [],
      totalEntries: 45,
      totalDays: 18,
      avgMood: 7.2,
      totalWords: 12500,
      moodTrend: 'improving',
      highlights: [
        'Breakthrough in meditation practice',
        'Successfully completed major project',
        'Improved work-life balance',
        'Strengthened relationships'
      ],
      lowlights: [
        'Stress from deadline pressure',
        'Sleep quality challenges'
      ],
      topTags: ['mindfulness', 'work', 'growth', 'relationships', 'health'],
      topEmotions: ['grateful', 'focused', 'optimistic', 'reflective'],
      insights: [
        'Consistent journaling has improved self-awareness',
        'Mindfulness practice showing positive impact on daily mood',
        'Work-related stress is a recurring theme to address'
      ],
      aiSummary: 'This month demonstrated significant personal growth with consistent journaling practice. Key themes included mindfulness development, professional achievements, and relationship building, with some challenges around stress management.',
    };
  };

  const generateRealMonthlyData = async (): Promise<MonthData | null> => {
    if (!entries || entries.length === 0) return null;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthEntries = entries.filter((entry: any) => {
      const entryDate = new Date(entry.date || entry.createdAt);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });

    if (monthEntries.length === 0) return null;

    const uniqueDays = new Set(
      monthEntries.map((entry: any) => new Date(entry.date || entry.createdAt).toDateString())
    ).size;

    const totalWords = monthEntries.reduce((sum: number, entry: any) =>
      sum + (entry.text?.split(' ').length || 0), 0);

    const avgMood = monthEntries.reduce((sum: number, entry: any) =>
      sum + (entry.mood?.score || 7), 0) / monthEntries.length;

    const allTags = monthEntries.flatMap((entry: any) => entry.tags || []);
    const allEmotions = monthEntries.flatMap((entry: any) => entry.emotions || []);

    const tagFrequency = allTags.reduce((acc: any, tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    const emotionFrequency = allEmotions.reduce((acc: any, emotion: string) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {});

    const topTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([tag]) => tag);

    const topEmotions = Object.entries(emotionFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([emotion]) => emotion);

    const firstHalf = monthEntries.slice(0, Math.floor(monthEntries.length / 2));
    const secondHalf = monthEntries.slice(Math.floor(monthEntries.length / 2));

    const firstHalfMood = firstHalf.reduce((sum: number, e: any) => sum + (e.mood?.score || 7), 0) / firstHalf.length;
    const secondHalfMood = secondHalf.reduce((sum: number, e: any) => sum + (e.mood?.score || 7), 0) / secondHalf.length;

    let moodTrend = 'stable';
    if (secondHalfMood > firstHalfMood + 0.5) moodTrend = 'improving';
    else if (secondHalfMood < firstHalfMood - 0.5) moodTrend = 'declining';

    const sortedEntries = monthEntries.sort((a: any, b: any) => (b.mood?.score || 7) - (a.mood?.score || 7));
    const highlights = sortedEntries.slice(0, 4).map((e: any) => e.title || 'Positive moment');
    const lowlights = sortedEntries.slice(-2).filter((e: any) => (e.mood?.score || 7) < 6).map((e: any) => e.title || 'Challenging moment');

    const insights = [
      `Averaged ${(totalWords / uniqueDays).toFixed(0)} words per day journaled`,
      `${topTags[0] || 'Personal reflection'} was the most common theme`,
      `Mood trend: ${moodTrend} throughout the month`,
    ];

    const monthData: MonthData = {
      month: currentDate.toLocaleDateString('en-US', { month: 'long' }),
      year: currentYear,
      entries: monthEntries,
      totalEntries: monthEntries.length,
      totalDays: uniqueDays,
      avgMood,
      totalWords,
      moodTrend,
      highlights,
      lowlights,
      topTags,
      topEmotions,
      insights,
      isGeneratingSummary: true,
    };

    try {
      const cacheId = `month_${currentYear}_${currentMonth}`;
      const aiSummary = await generateOpenAISummary(
        monthEntries,
        'month',
        undefined,
        undefined,
        cacheId
      );
      monthData.aiSummary = aiSummary;
    } catch (error) {
      console.error('Failed to generate monthly summary:', error);
      monthData.aiSummary = `This month included ${monthEntries.length} journal entries across ${uniqueDays} days with an average mood of ${avgMood.toFixed(1)}/10. Key themes: ${topTags.slice(0, 3).join(', ')}.`;
    }

    monthData.isGeneratingSummary = false;
    return monthData;
  };

  const generateMonthlyData = async () => {
    setIsLoading(true);
    try {
      const data = showDummyData ? generateDummyMonthlyData() : await generateRealMonthlyData();
      setMonthlyData(data);
    } catch (error) {
      console.error('Error generating monthly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return 'trending-up';
      case 'declining': return 'trending-down';
      default: return 'remove';
    }
  };

  if (!showDummyData && entries.length === 0) {
    return (
      <View style={historyStyles.emptyState}>
        <Text style={historyStyles.emptyTitle}>No monthly data yet</Text>
        <Text style={historyStyles.emptySubtitle}>Journal throughout the month to see insights</Text>
      </View>
    );
  }

  if (isLoading || !monthlyData) {
    return (
      <View style={historyStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={historyStyles.loadingText}>Analyzing monthly patterns...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={historyStyles.viewContainer}
      contentContainerStyle={historyStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={monthlyStyles.monthHeader}>
        <Text style={monthlyStyles.monthTitle}>{monthlyData.month} {monthlyData.year}</Text>
        <Text style={monthlyStyles.monthSubtitle}>Your emotional landscape</Text>
      </View>

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={monthlyStyles.monthOverviewCard}
      >
        <View style={monthlyStyles.monthStatsGrid}>
          <View style={monthlyStyles.monthStatItem}>
            <Text style={monthlyStyles.monthStatValue}>{monthlyData.totalDays}</Text>
            <Text style={monthlyStyles.monthStatLabel}>Days Journaled</Text>
          </View>
          <View style={monthlyStyles.monthStatItem}>
            <Text style={monthlyStyles.monthStatValue}>{monthlyData.totalEntries}</Text>
            <Text style={monthlyStyles.monthStatLabel}>Total Entries</Text>
          </View>
          <View style={monthlyStyles.monthStatItem}>
            <Text style={monthlyStyles.monthStatValue}>{monthlyData.avgMood.toFixed(1)}</Text>
            <Text style={monthlyStyles.monthStatLabel}>Avg Mood</Text>
          </View>
          <View style={monthlyStyles.monthStatItem}>
            <Text style={monthlyStyles.monthStatValue}>{(monthlyData.totalWords / 1000).toFixed(1)}k</Text>
            <Text style={monthlyStyles.monthStatLabel}>Words</Text>
          </View>
        </View>

        <View style={monthlyStyles.moodTrendContainer}>
          <Ionicons
            name={getMoodTrendIcon(monthlyData.moodTrend)}
            size={20}
            color="white"
          />
          <Text style={monthlyStyles.moodTrendText}>
            Mood trend: {monthlyData.moodTrend}
          </Text>
        </View>
      </LinearGradient>

      <View style={monthlyStyles.monthCard}>
        <Text style={monthlyStyles.monthCardTitle}>Key Themes</Text>
        <View style={monthlyStyles.monthTagsContainer}>
          {monthlyData.topTags.map((tag, index) => (
            <View key={index} style={monthlyStyles.monthTag}>
              <Text style={monthlyStyles.monthTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {monthlyData.topEmotions.length > 0 && (
        <View style={monthlyStyles.monthCard}>
          <Text style={monthlyStyles.monthCardTitle}>Primary Emotions</Text>
          <View style={monthlyStyles.emotionsContainer}>
            {monthlyData.topEmotions.map((emotion, index) => (
              <View key={index} style={monthlyStyles.emotionItem}>
                <Text style={monthlyStyles.emotionText}>{emotion}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={monthlyStyles.monthCard}>
        <View style={monthlyStyles.monthCardHeader}>
          <Text style={monthlyStyles.monthCardTitle}>Highlights</Text>
          <Text style={monthlyStyles.highlightEmoji}>✨</Text>
        </View>
        {monthlyData.highlights.map((highlight, index) => (
          <View key={index} style={monthlyStyles.monthHighlightItem}>
            <View style={monthlyStyles.monthHighlightDot} />
            <Text style={monthlyStyles.monthHighlightText}>{highlight}</Text>
          </View>
        ))}
      </View>

      {monthlyData.lowlights.length > 0 && (
        <View style={monthlyStyles.monthCard}>
          <View style={monthlyStyles.monthCardHeader}>
            <Text style={monthlyStyles.monthCardTitle}>Growth Areas</Text>
            <Text style={monthlyStyles.highlightEmoji}>🎯</Text>
          </View>
          {monthlyData.lowlights.map((lowlight, index) => (
            <View key={index} style={monthlyStyles.monthHighlightItem}>
              <View style={[monthlyStyles.monthHighlightDot, { backgroundColor: '#FF9800' }]} />
              <Text style={monthlyStyles.monthHighlightText}>{lowlight}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={monthlyStyles.aiMonthSummaryCard}>
        <View style={monthlyStyles.aiMonthSummaryHeader}>
          <Ionicons name="sparkles" size={20} color="#667eea" />
          <Text style={monthlyStyles.aiMonthSummaryTitle}>AI Monthly Summary</Text>
          {monthlyData.isGeneratingSummary && (
            <ActivityIndicator size="small" color="#667eea" style={{ marginLeft: 8 }} />
          )}
        </View>
        <Text style={monthlyStyles.aiMonthSummaryText}>
          {monthlyData.isGeneratingSummary ? 'Generating deep insights...' : monthlyData.aiSummary}
        </Text>
      </View>

      <View style={monthlyStyles.monthCard}>
        <Text style={monthlyStyles.monthCardTitle}>Key Insights</Text>
        {monthlyData.insights.map((insight, index) => (
          <View key={index} style={monthlyStyles.insightItem}>
            <Ionicons name="bulb-outline" size={16} color="#667eea" />
            <Text style={monthlyStyles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default MonthlyView;