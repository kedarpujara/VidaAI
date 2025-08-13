import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface WeekData {
  id: string;
  startDate: Date;
  endDate: Date;
  entryCount: number;
  moodData: number[];
  highlights: { emoji: string; text: string }[];
}

interface WeeklyHistoryScreenProps {
  entries: any[];
}

const WeeklyHistoryScreen = ({ entries }: WeeklyHistoryScreenProps) => {
  const navigation = useNavigation();
  const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Convert app entries to weekly format
  const convertEntriesToWeeks = (): WeekData[] => {
    if (!entries || entries.length === 0) {
      return [];
    }

    const weeks: { [key: string]: any[] } = {};
    
    entries.forEach((entry: any) => {
      const date = new Date(entry.date);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const weekKey = startOfWeek.toDateString();
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(entry);
    });

    return Object.entries(weeks).map(([weekKey, weekEntries]) => {
      const startDate = new Date(weekKey);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      const moodData = Array(7).fill(0).map((_, i) => {
        const dayEntries = weekEntries.filter(e => {
          const entryDate = new Date(e.date);
          const targetDate = new Date(startDate);
          targetDate.setDate(startDate.getDate() + i);
          return entryDate.toDateString() === targetDate.toDateString();
        });
        
        if (dayEntries.length === 0) return 20;
        const avgMood = dayEntries.reduce((sum, e) => sum + (e.mood?.score || 7), 0) / dayEntries.length;
        return Math.min(95, Math.max(20, avgMood * 10));
      });

      const highlights = weekEntries.slice(0, 3).map(entry => ({
        emoji: entry.mood?.emoji || '✨',
        text: entry.title,
      }));

      return {
        id: weekKey,
        startDate,
        endDate,
        entryCount: weekEntries.length,
        moodData,
        highlights,
      };
    }).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  };

  const mockWeeks = convertEntriesToWeeks();

  const handleViewChange = (view: 'daily' | 'weekly' | 'monthly') => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedView(view);
      if (view === 'daily') {
        navigation.navigate('DailyHistory' as never);
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
        {mockWeeks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No weekly data yet</Text>
            <Text style={styles.emptySubtitle}>Journal for a few days to see weekly patterns</Text>
          </View>
        ) : (
          <View style={styles.weeklyGrid}>
            {mockWeeks.map((week) => (
              <View key={week.id} style={styles.weekCard}>
                <View style={styles.weekHeader}>
                  <Text style={styles.weekDates}>
                    {formatWeekDates(week.startDate, week.endDate)}
                  </Text>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.entryCountBadge}
                  >
                    <Text style={styles.entryCountText}>{week.entryCount} entries</Text>
                  </LinearGradient>
                </View>

                <View style={styles.moodChart}>
                  {week.moodData.map((height, index) => (
                    <LinearGradient
                      key={index}
                      colors={['#667eea', '#764ba2']}
                      style={[styles.moodBar, { height: `${height}%` }]}
                    />
                  ))}
                </View>

                <View style={styles.weekHighlights}>
                  {week.highlights.map((highlight, index) => (
                    <View key={index} style={styles.highlightItem}>
                      <Text style={styles.highlightEmoji}>{highlight.emoji}</Text>
                      <Text style={styles.highlightText}>{highlight.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
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
  weeklyGrid: {
    gap: 16,
  },
  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekDates: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  entryCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  entryCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moodChart: {
    height: 60,
    backgroundColor: '#F8F8FA',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    gap: 4,
    marginBottom: 16,
  },
  moodBar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 8,
    opacity: 0.8,
  },
  weekHighlights: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 16,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  highlightEmoji: {
    fontSize: 16,
  },
  highlightText: {
    fontSize: 14,
    color: '#3C3C43',
    flex: 1,
  },
});

export default WeeklyHistoryScreen;