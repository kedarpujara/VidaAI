import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const DayDetailScreen = () => {
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
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.backNav}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#667eea" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.dateTitle}>
          {day.date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </Text>
        <View style={styles.dayStats}>
          <Text style={styles.statItem}>{day.entries.length} entries</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statItem}>{day.stats.words} words</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statItem}>{getMoodDescription(day.moodAverage)}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {timeBlocks.map((timeBlock) => {
          const entries = groupedEntries[timeBlock];
          if (!entries) return null;

          return (
            <View key={timeBlock} style={styles.timeBlock}>
              <Text style={styles.timeLabel}>{timeBlock.toUpperCase()}</Text>
              
              {entries.map((entry: any) => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTime}>{formatTime(entry.time)}</Text>
                    <Text style={styles.entryMood}>{entry.mood}</Text>
                  </View>

                  <View style={styles.entryContent}>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    <Text style={styles.entryText}>{entry.content}</Text>
                  </View>

                  {entry.attachments && entry.attachments.length > 0 && (
                    <View style={styles.attachments}>
                      {entry.type === 'voice' && (
                        <View style={styles.attachmentPreview}>
                          <Text style={styles.attachmentIcon}>🎙</Text>
                        </View>
                      )}
                      {entry.attachments.filter((a: string) => a.includes('photo')).map((photo: string, idx: number) => (
                        <View key={idx} style={styles.attachmentPreview}>
                          <Text style={styles.attachmentIcon}>📷</Text>
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

const styles = StyleSheet.create({
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

export default DayDetailScreen;