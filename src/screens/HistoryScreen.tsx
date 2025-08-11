import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJournal } from '../context/JournalContext';
import { Entry } from '../types/journalEntry';
import SearchBar from '../components/SearchBar';
import EntryCard from '../components/EntryCard';
import { theme } from '../constants/theme';

export default function HistoryScreen() {
  const { entries, deleteEntry, searchEntries, refreshEntries } = useJournal();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>(entries);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setFilteredEntries(entries);
    }
  }, [entries, searchQuery]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await searchEntries(searchQuery);
      setFilteredEntries(results);
    } else {
      setFilteredEntries(entries);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshEntries();
    setRefreshing(false);
  };

  const handleDeleteEntry = (entry: Entry) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) }
    ]);
  };

  const renderEntry = ({ item }: { item: Entry }) => (
    <EntryCard entry={item} onDelete={() => handleDeleteEntry(item)} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{searchQuery ? 'No matches found' : 'No entries yet'}</Text>
      <Text style={styles.emptySubtitle}>{searchQuery ? 'Try adjusting your search terms' : 'Start journaling to see your entries here'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal History</Text>
        <Text style={styles.subtitle}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</Text>
      </View>

      <View style={styles.content}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search your entries..." />
        <FlatList
          data={filteredEntries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={filteredEntries.length === 0 ? styles.emptyContainer : styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.lg },
  title: { ...theme.typography.h1, color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
  content: { flex: 1, paddingHorizontal: theme.spacing.md },
  listContent: { paddingBottom: theme.spacing.xl },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: theme.spacing.xxl },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, textAlign: 'center' },
  emptySubtitle: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' },
});
