import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface MonthlyHistoryScreenProps {
  entries: any[];
}

const MonthlyHistoryScreen = ({ entries }: MonthlyHistoryScreenProps) => {
  const navigation = useNavigation();
  const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleViewChange = (view: 'daily' | 'weekly' | 'monthly') => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedView(view);
      if (view === 'daily') {
        navigation.navigate('DailyHistory' as never);
      } else if (view === 'weekly') {
        navigation.navigate('WeeklyHistory' as never);
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  // Calculate monthly stats from entries
  const calculateMonthlyStats = () => {
    if (!entries || entries.length === 0) {
      return {
        totalEntries: 0,
        totalDays: 0,
        positiveDays: 0,
        wins: 0,
        avgMood: 0,
        streak: 0,
        mostJoyful: null,
        biggestChallenge: null,
      };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });

    const uniqueDays = new Set(
      monthEntries.map(entry => new Date(entry.date).toDateString())
    ).size;

    const positiveDays = monthEntries.filter(entry => 
      (entry.mood?.score || 7) >= 7
    ).length;

    const wins = monthEntries.filter(entry => 
      entry.tags?.some((tag: string) => 
        ['achievement', 'success', 'win', 'breakthrough'].includes(tag.toLowerCase())
      ) || (entry.mood?.score || 0) >= 8
    ).length;

    const avgMood = monthEntries.length > 0 
      ? monthEntries.reduce((sum, entry) => sum + (entry.mood?.score || 7), 0) / monthEntries.length
      : 0;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const hasEntry = monthEntries.some(entry => 
        new Date(entry.date).toDateString() === checkDate.toDateString()
      );
      if (hasEntry) {
        streak++;
      } else {
        break;
      }
    }

    // Find most joyful moment
    const mostJoyful = monthEntries.reduce((best, entry) => {
      if (!best || (entry.mood?.score || 0) > (best.mood?.score || 0)) {
        return entry;
      }
      return best;
    }, null);

    return {
      totalEntries: monthEntries.length,
      totalDays: uniqueDays,
      positiveDays: Math.round((positiveDays / monthEntries.length) * uniqueDays),
      wins,
      avgMood,
      streak,
      mostJoyful,
      biggestChallenge: monthEntries.find(entry => 
        entry.tags?.includes('challenge') || entry.title?.toLowerCase().includes('challenge')
      ),
    };
  };

  const stats = calculateMonthlyStats();
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return '😊';
    if (score >= 6) return '🙂';
    if (score >= 4) return '😐';
    return '😞';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>History</Text>
          <TouchableOpacity style={styles.statsButton}>
            <Ionicons name="stats-chart" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, selectedView === 'daily' && styles.toggleButtonActive]}
            onPress={() => handleViewChange('daily')}
          >
            <Text style={[styles.toggleText, selectedView === 'daily' && styles.toggleTextActive]}>
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, selectedView === 'weekly' && styles.toggleButtonActive]}
            onPress={() => handleViewChange('weekly')}
          >
            <Text style={[styles.toggleText, selectedView === 'weekly' && styles.toggleTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, selectedView === 'monthly' && styles.toggleButtonActive]}
            onPress={() => handleViewChange('monthly')}
          >
            <Text style={[styles.toggleText, selectedView === 'monthly' && styles.toggleTextActive]}>
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
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>{currentMonth}</Text>
          <Text style={styles.monthSubtitle}>Your emotional landscape</Text>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No monthly data yet</Text>
            <Text style={styles.emptySubtitle}>Journal throughout the month to see insights</Text>
          </View>
        ) : (
          <>
            {/* Mood Flow Visualization */}
            <View style={styles.moodFlowCard}>
              <Text style={styles.sectionTitle}>Mood Flow</Text>
              <View style={styles.moodFlowContainer}>
                <LinearGradient
                  colors={[
                    'rgba(86, 204, 242, 0.3)',
                    'rgba(86, 204, 242, 0.6)',
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.6)',
                    'rgba(240, 147, 251, 0.4)',
                    'rgba(86, 204, 242, 0.7)',
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.moodGradient}
                />
                <View style={styles.weekLabels}>
                  <Text style={styles.weekLabel}>Week 1</Text>
                  <Text style={styles.weekLabel}>Week 2</Text>
                  <Text style={styles.weekLabel}>Week 3</Text>
                  <Text style={styles.weekLabel}>Week 4</Text>
                </View>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <LinearGradient
                colors={['#56CCF2', '#2F80ED']}
                style={styles.statCard}
              >
                <Text style={styles.statEmoji}>😊</Text>
                <Text style={styles.statValue}>{stats.positiveDays} days</Text>
                <Text style={styles.statLabel}>Positive mood</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#F093FB', '#F5576C']}
                style={styles.statCard}
              >
                <Text style={styles.statEmoji}>💪</Text>
                <Text style={styles.statValue}>{stats.wins} wins</Text>
                <Text style={styles.statLabel}>Celebrated</Text>
              </LinearGradient>
            </View>

            {/* Emotional Insights */}
            <View style={styles.insightsCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🎭</Text>
                <Text style={styles.sectionTitle}>Emotional Insights</Text>
              </View>

              {stats.mostJoyful && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightTitle}>Most joyful moment</Text>
                  <Text style={styles.insightDescription}>
                    {new Date(stats.mostJoyful.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {stats.mostJoyful.title}
                  </Text>
                </View>
              )}

              {stats.biggestChallenge && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightTitle}>Biggest challenge overcome</Text>
                  <Text style={styles.insightDescription}>
                    {new Date(stats.biggestChallenge.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {stats.biggestChallenge.title}
                  </Text>
                </View>
              )}

              <View style={styles.insightItem}>
                <Text style={styles.insightTitle}>Pattern discovered</Text>
                <Text style={styles.insightDescription}>
                  {stats.avgMood >= 7 ? 'Consistently positive mindset this month' : 'Working through challenges with resilience'}
                </Text>
              </View>
            </View>

            {/* AI Insight */}
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
              style={styles.aiInsightCard}
            >
              <Text style={styles.aiInsightTitle}>AI Insight</Text>
              <Text style={styles.aiInsightText}>
                {stats.totalEntries > 10 
                  ? `Your consistency in journaling (${stats.totalDays} days this month) shows strong self-reflection habits. The patterns in your entries suggest you're developing greater emotional awareness.`
                  : "Your journaling journey is just beginning. Consider writing more regularly to unlock deeper insights about your emotional patterns and growth."
                }
              </Text>
            </LinearGradient>

            {/* Monthly Summary Stats */}
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.summaryCard}
            >
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{stats.totalDays}</Text>
                  <Text style={styles.summaryLabel}>Days Journaled</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{stats.totalEntries}</Text>
                  <Text style={styles.summaryLabel}>Total Entries</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{getMoodEmoji(stats.avgMood)}</Text>
                  <Text style={styles.summaryLabel}>Avg Mood</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{stats.streak}</Text>
                  <Text style={styles.summaryLabel}>Day Streak</Text>
                </View>
              </View>
            </LinearGradient>
          </>
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
});

export default MonthlyHistoryScreen;