import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';

import { Entry } from '../types/journal';

interface HistoryScreenProps {
  entries: Entry[];
  onRefresh: () => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  refreshing: boolean;
}

export default function HistoryScreen({ 
  entries, 
  onRefresh, 
  onDeleteEntry, 
  refreshing 
}: HistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  // Group entries by day
  const groupedEntries = useMemo(() => {
    const filtered = entries.filter(entry =>
      entry.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.themes?.some(theme => theme.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.emotions?.some(emotion => emotion.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const grouped = filtered.reduce((acc, entry) => {
      const date = new Date(entry.date);
      const dayKey = date.toDateString();
      
      if (!acc[dayKey]) {
        acc[dayKey] = {
          date: date,
          entries: []
        };
      }
      acc[dayKey].entries.push(entry);
      return acc;
    }, {} as { [key: string]: { date: Date; entries: Entry[] } });

    // Sort by date (newest first) and sort entries within each day
    return Object.values(grouped)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map(day => ({
        ...day,
        entries: day.entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }));
  }, [entries, searchQuery]);

  const toggleDay = (dayKey: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  const openEntryDetail = (entry: Entry) => {
    setSelectedEntry(entry);
  };

  const closeEntryDetail = () => {
    setSelectedEntry(null);
  };

  const confirmDeleteEntry = (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteEntry(id) },
      ]
    );
  };

  const getMoodEmoji = (mood: number) => {
    const moodEmojis = ['😔', '😕', '😐', '🙂', '😊'];
    return moodEmojis[mood - 1] || '😐';
  };

  const getStreakInfo = () => {
    if (entries.length === 0) return { streak: 0, longestStreak: 0 };
    
    // Get unique days with entries (sorted newest to oldest)
    const uniqueDays = [...new Set(entries.map(entry => 
      new Date(entry.date).toDateString()
    ))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (uniqueDays.length === 0) return { streak: 0, longestStreak: 0 };
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    // Check if we have an entry today or yesterday to start the streak
    const hasToday = uniqueDays.includes(today);
    const hasYesterday = uniqueDays.includes(yesterdayString);
    
    if (hasToday || hasYesterday) {
      currentStreak = 1;
      const startIndex = hasToday ? 0 : (hasYesterday ? 1 : -1);
      
      if (startIndex >= 0) {
        // Count consecutive days from start point
        for (let i = startIndex; i < uniqueDays.length - 1; i++) {
          const currentDate = new Date(uniqueDays[i]);
          const nextDate = new Date(uniqueDays[i + 1]);
          const diffTime = currentDate.getTime() - nextDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
    
    // Calculate longest streak ever
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const currentDate = new Date(uniqueDays[i]);
      const nextDate = new Date(uniqueDays[i + 1]);
      const diffTime = currentDate.getTime() - nextDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { streak: currentStreak, longestStreak };
  };

  const streakInfo = getStreakInfo();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Journey</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{entries.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{streakInfo.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{streakInfo.longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search entries, titles, themes..."
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Entries by Day */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {groupedEntries.length === 0 ? (
          <View style={styles.emptyState}>
            {searchQuery ? (
              <>
                <Text style={styles.emptyText}>No matching entries</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>No entries yet!</Text>
                <Text style={styles.emptySubtext}>Start journaling to see your entries here</Text>
              </>
            )}
          </View>
        ) : (
          groupedEntries.map((day) => {
            const dayKey = day.date.toDateString();
            const isExpanded = expandedDays.has(dayKey);
            const averageMood = day.entries
              .filter(e => e.manualMood)
              .reduce((sum, e, _, arr) => sum + (e.manualMood! / arr.length), 0);
            
            return (
              <View key={dayKey} style={styles.dayContainer}>
                {/* Day Header */}
                <Pressable 
                  style={styles.dayHeader} 
                  onPress={() => toggleDay(dayKey)}
                >
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayDate}>
                      {day.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: day.date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </Text>
                    <View style={styles.dayMeta}>
                      <Text style={styles.entryCount}>
                        {day.entries.length} {day.entries.length === 1 ? 'entry' : 'entries'}
                      </Text>
                      {averageMood > 0 && (
                        <Text style={styles.dayMood}>
                          {getMoodEmoji(Math.round(averageMood))} {averageMood.toFixed(1)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                  />
                </Pressable>

                {/* Day Entries (Expanded) */}
                {isExpanded && (
                  <View style={styles.dayEntries}>
                    {day.entries.map((entry) => (
                      <Pressable
                        key={entry.id}
                        style={styles.entryItem}
                        onPress={() => openEntryDetail(entry)}
                      >
                        <View style={styles.entryItemHeader}>
                          <Text style={styles.entryItemTitle} numberOfLines={1}>
                            {entry.title || 'Untitled Entry'}
                          </Text>
                          <Text style={styles.entryItemTime}>
                            {new Date(entry.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                        <Text style={styles.entryItemPreview} numberOfLines={2}>
                          {entry.text}
                        </Text>
                        <View style={styles.entryItemMeta}>
                          {entry.manualMood && (
                            <Text style={styles.entryItemMood}>
                              {getMoodEmoji(entry.manualMood)} {entry.manualMood}/5
                            </Text>
                          )}
                          <View style={styles.entryItemIndicators}>
                            {entry.transcribed && (
                              <View style={styles.microIndicator}>
                                <Ionicons name="mic" size={8} color="#fff" />
                              </View>
                            )}
                            {entry.hasPhoto && (
                              <View style={styles.photoIndicatorSmall}>
                                <Ionicons name="camera" size={8} color="#fff" />
                              </View>
                            )}
                            {entry.aiAnalyzed && (
                              <View style={styles.aiIndicatorSmall}>
                                <Ionicons name="sparkles" size={8} color="#fff" />
                              </View>
                            )}
                            {entry.tags.includes('dummy') && (
                              <View style={styles.testIndicatorSmall}>
                                <Ionicons name="code" size={8} color="#fff" />
                              </View>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
        
        {/* Bottom padding for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedEntry.title || 'Untitled Entry'}
              </Text>
              <Pressable onPress={closeEntryDetail} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDate}>
                {new Date(selectedEntry.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>

              {/* Photo Display */}
              {selectedEntry.photoUri && (
                <View style={styles.modalPhotoContainer}>
                  <Image source={{ uri: selectedEntry.photoUri }} style={styles.modalPhoto} />
                </View>
              )}

              {/* Entry Text */}
              <Text style={styles.modalText}>{selectedEntry.text}</Text>

              {/* Mood & Indicators */}
              <View style={styles.modalMeta}>
                {selectedEntry.manualMood && (
                  <View style={styles.modalMoodContainer}>
                    <Text style={styles.modalMoodText}>
                      Mood: {getMoodEmoji(selectedEntry.manualMood)} {selectedEntry.manualMood}/5
                    </Text>
                  </View>
                )}
                
                <View style={styles.modalIndicators}>
                  {selectedEntry.transcribed && (
                    <View style={styles.transcribedIndicator}>
                      <Ionicons name="mic" size={8} color="#fff" />
                      <Text style={styles.indicatorText}>Voice</Text>
                    </View>
                  )}
                  {selectedEntry.hasPhoto && (
                    <View style={styles.photoIndicator}>
                      <Ionicons name="camera" size={8} color="#fff" />
                      <Text style={styles.indicatorText}>Photo</Text>
                    </View>
                  )}
                  {selectedEntry.aiAnalyzed && (
                    <View style={styles.analyzedIndicator}>
                      <Ionicons name="sparkles" size={8} color="#fff" />
                      <Text style={styles.indicatorText}>AI</Text>
                    </View>
                  )}
                  {selectedEntry.tags.includes('dummy') && (
                    <View style={styles.dummyIndicator}>
                      <Ionicons name="code" size={8} color="#fff" />
                      <Text style={styles.indicatorText}>TEST</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* AI Analysis Results */}
              {selectedEntry.mood && (
                <View style={styles.moodContainer}>
                  <Text style={styles.aiMoodText}>
                    🎭 AI Mood: {selectedEntry.mood.primary} ({selectedEntry.mood.confidence}% confident)
                  </Text>
                </View>
              )}

              {selectedEntry.themes && selectedEntry.themes.length > 0 && (
                <View style={styles.themesContainer}>
                  {selectedEntry.themes.map((theme, index) => (
                    <View key={index} style={styles.themeTag}>
                      <Text style={styles.themeText}>{theme}</Text>
                    </View>
                  ))}
                </View>
              )}

              {selectedEntry.insights && (
                <View style={styles.insightsContainer}>
                  <Text style={styles.insightText}>🎯 Clarity: {selectedEntry.insights.clarity}/10</Text>
                  <Text style={styles.insightText}>💪 Growth: {selectedEntry.insights.growthPotential}/10</Text>
                  <Text style={styles.insightText}>⚠️ Stress: {selectedEntry.insights.stressLevel}/10</Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <Pressable
                style={styles.deleteModalButton}
                onPress={() => {
                  closeEntryDetail();
                  confirmDeleteEntry(selectedEntry.id);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#d9534f" />
                <Text style={styles.deleteModalText}>Delete Entry</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9ff',
    padding: 15,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Day-by-day view styles
  dayContainer: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayInfo: {
    flex: 1,
  },
  dayDate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  dayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryCount: {
    fontSize: 14,
    color: '#666',
  },
  dayMood: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  
  // Entry items within day
  dayEntries: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  entryItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  entryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entryItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  entryItemTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  entryItemPreview: {
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
    marginBottom: 8,
  },
  entryItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryItemMood: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  entryItemIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  
  // Small indicators for entry items
  microIndicator: {
    backgroundColor: '#5CB85C',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIndicatorSmall: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIndicatorSmall: {
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testIndicatorSmall: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  modalPhotoContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  modalPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  modalMeta: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  modalMoodContainer: {
    marginBottom: 10,
  },
  modalMoodText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  modalIndicators: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  deleteModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9534f',
    gap: 5,
  },
  deleteModalText: {
    fontSize: 14,
    color: '#d9534f',
    fontWeight: '600',
  },
  emptyState: {
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
  entryCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryTitleSection: {
    flex: 1,
    marginRight: 10,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  moodEmoji: {
    fontSize: 12,
  },
  moodText: {
    fontSize: 10,
    color: '#E65100',
    fontWeight: '500',
  },
  transcribedIndicator: {
    backgroundColor: '#5CB85C',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  photoIndicator: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  analyzedIndicator: {
    backgroundColor: '#9C27B0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dummyIndicator: {
    backgroundColor: '#FF5722',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  indicatorText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  entryPhotoContainer: {
    marginBottom: 12,
  },
  entryPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  entryTextContainer: {
    marginBottom: 8,
  },
  entryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  readMoreText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  moodContainer: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  aiMoodText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '600',
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  themeTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  themeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  insightsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  insightText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 10, // Reduced since tab bar is now taller
  },
});