import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DayEntry } from '../types/history';
import { historyStyles, dailyStyles } from '../styles/historyStyles';

interface DailyViewProps {
  entries: any[];
  showDummyData: boolean;
  onNavigateToDay: (day: DayEntry) => void;
}

const DailyView: React.FC<DailyViewProps> = ({ entries, showDummyData, onNavigateToDay }) => {
  const generateDummyData = (): DayEntry[] => {
    const dummyEntries: DayEntry[] = [];
    const today = new Date();
    
    const enhancedTitles = [
      'Morning mindfulness breakthrough',
      'Coffee contemplations on change',
      'Workplace collaboration wins',
      'Nature walk revelations',
      'Creative flow afternoon',
      'Evening gratitude practice',
    ];

    const enhancedContents = [
      'Today I discovered something profound about the relationship between acceptance and growth.',
      'An unexpected conversation shifted my entire perspective on what success means.',
      'I\'m noticing patterns in how I handle stress - the techniques are working.',
      'The connection between physical movement and mental clarity became apparent today.',
      'Creative work felt effortless today. There\'s something magical about flow state.',
      'Practicing gratitude is rewiring my brain for positivity.',
    ];
    
    for (let dayOffset = 0; dayOffset < 45; dayOffset++) {
      if (dayOffset === 25) continue; // Skip day 25 for streak
      
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - dayOffset);
      
      const entryCount = Math.floor(Math.random() * 3) + 2;
      const dayEntries = Array(entryCount).fill(null).map((_, entryIndex) => {
        const entryTime = new Date(currentDate);
        entryTime.setHours(6 + entryIndex * 4 + Math.floor(Math.random() * 3));
        entryTime.setMinutes(Math.floor(Math.random() * 60));
        
        const moodScore = 6 + Math.floor(Math.random() * 3);
        const mood = moodScore >= 8 ? '😊' : moodScore >= 7 ? '🙂' : '😐';
        
        return {
          id: `entry_${dayOffset}_${entryIndex}`,
          time: entryTime,
          title: enhancedTitles[Math.floor(Math.random() * enhancedTitles.length)],
          content: enhancedContents[Math.floor(Math.random() * enhancedContents.length)],
          mood,
          moodScore,
          type: Math.random() > 0.7 ? 'voice' : 'text',
          attachments: Math.random() > 0.8 ? ['photo1'] : [],
          aiAnalysis: {
            emotions: ['grateful', 'reflective', 'optimistic'].slice(0, Math.floor(Math.random() * 3) + 1),
            themes: ['personal-growth', 'mindfulness'].slice(0, Math.floor(Math.random() * 2) + 1),
            sentiment: 'positive',
            sentimentScore: 0.6 + Math.random() * 0.3,
            insights: ['Strong emotional awareness evident'],
          },
          autoTags: ['mindfulness', 'growth', 'reflection'].slice(0, Math.floor(Math.random() * 3) + 2),
        };
      });
      
      const moodAverage = dayEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / dayEntries.length;
      
      dummyEntries.push({
        id: `day_${dayOffset}`,
        date: currentDate,
        entries: dayEntries,
        moodAverage,
        highlights: dayEntries[0].title,
        stats: { 
          audioMinutes: dayEntries.filter(e => e.type === 'voice').length * 3,
          photos: dayEntries.filter(e => e.attachments?.length).length,
          words: dayEntries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0)
        },
        aiInsights: [
          `Emotional pattern: ${moodAverage >= 7 ? 'Consistently positive' : 'Balanced emotional state'}`,
          'Growth indicators: Self-reflection and mindfulness practices evident',
        ]
      });
    }
    
    return dummyEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const convertEntriesToDays = (): DayEntry[] => {
    if (!entries || entries.length === 0) return [];

    const groupedByDate = entries.reduce((acc: any, entry: any) => {
      let entryDate;
      if (entry.date) {
        entryDate = new Date(entry.date);
      } else if (entry.createdAt) {
        entryDate = new Date(entry.createdAt);
      } else {
        entryDate = new Date();
      }
      
      const dateStr = entryDate.toDateString();
      
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      
      const journalEntry = {
        id: entry.id,
        time: entryDate,
        title: entry.title || 'Journal Entry',
        content: entry.text || entry.content || '',
        mood: entry.mood?.emoji || '😊',
        moodScore: entry.mood?.score || 7,
        type: (entry.transcribed || entry.hasAudio) ? 'voice' : 'text',
        attachments: entry.photoUri ? [entry.photoUri] : [],
        aiAnalysis: entry.aiAnalysis,
        autoTags: entry.autoTags || [],
      };
      
      acc[dateStr].push(journalEntry);
      return acc;
    }, {});

    return Object.entries(groupedByDate).map(([dateStr, dayEntries]: [string, any]) => {
      const entryDate = new Date(dateStr);
      const moodAverage = dayEntries.reduce((sum: number, e: any) => sum + e.moodScore, 0) / dayEntries.length;
      
      const aiInsights: string[] = [];
      const analyzedEntries = dayEntries.filter((e: any) => e.aiAnalysis);
      
      if (analyzedEntries.length > 0) {
        const emotions = analyzedEntries.flatMap((e: any) => e.aiAnalysis.emotions || []);
        if (emotions.length > 0) {
          aiInsights.push(`Primary emotions: ${emotions.slice(0, 3).join(', ')}`);
        }
      } else {
        aiInsights.push('Entry logged successfully');
      }

      return {
        id: dateStr,
        date: entryDate,
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
  };

  const mockDays = showDummyData ? generateDummyData() : convertEntriesToDays();

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
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
    <ScrollView 
      style={historyStyles.viewContainer}
      contentContainerStyle={historyStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Streak Bar */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={dailyStyles.streakBar}
      >
        <View style={dailyStyles.streakInfo}>
          <Text style={dailyStyles.streakLabel}>Current Streak</Text>
          <Text style={dailyStyles.streakNumber}>{currentStreak} days 🔥</Text>
        </View>
        <View style={dailyStyles.badges}>
          <View style={dailyStyles.badge}>
            <Text style={dailyStyles.badgeEmoji}>🤖</Text>
          </View>
          <View style={dailyStyles.badge}>
            <Text style={dailyStyles.badgeEmoji}>🎯</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Day Summaries */}
      {mockDays.length === 0 ? (
        <View style={historyStyles.emptyState}>
          <Text style={historyStyles.emptyTitle}>No entries yet</Text>
          <Text style={historyStyles.emptySubtitle}>Start journaling to see your history here</Text>
        </View>
      ) : (
        mockDays.map((day) => (
          <TouchableOpacity
            key={day.id}
            style={dailyStyles.daySummary}
            onPress={() => onNavigateToDay(day)}
            activeOpacity={0.7}
          >
            <View style={dailyStyles.dayHeader}>
              <Text style={dailyStyles.dayDate}>
                {formatDate(day.date).toUpperCase()}
              </Text>
              <View style={dailyStyles.entryCount}>
                <Text style={dailyStyles.entryCountText}>{day.entries.length} entries</Text>
              </View>
            </View>

            <View style={dailyStyles.moodBar}>
              {day.entries.map((entry: any, idx: number) => (
                <LinearGradient
                  key={idx}
                  colors={getMoodColor(entry.moodScore)}
                  style={[dailyStyles.moodSegment, { flex: 1 }]}
                />
              ))}
            </View>

            <Text style={dailyStyles.highlightTitle}>{day.highlights}</Text>
            <Text style={dailyStyles.highlightSnippet} numberOfLines={2}>
              {day.entries[0]?.content}
            </Text>

            {day.aiInsights && day.aiInsights.length > 0 && (
              <View style={dailyStyles.aiInsightsSection}>
                <View style={dailyStyles.aiInsightHeader}>
                  <Ionicons name="bulb" size={14} color="#667eea" />
                  <Text style={dailyStyles.aiInsightLabel}>AI Insights</Text>
                </View>
                <Text style={dailyStyles.aiInsightText} numberOfLines={2}>
                  {day.aiInsights[0]}
                </Text>
              </View>
            )}

            <View style={dailyStyles.dayMeta}>
              {day.stats.audioMinutes > 0 && (
                <Text style={dailyStyles.metaStatText}>🎙 {day.stats.audioMinutes} min</Text>
              )}
              {day.stats.photos > 0 && (
                <Text style={dailyStyles.metaStatText}>📷 {day.stats.photos}</Text>
              )}
              {day.stats.words > 0 && (
                <Text style={dailyStyles.metaStatText}>✍️ {day.stats.words} words</Text>
              )}
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" style={dailyStyles.chevron} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

export default DailyView;