import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Entry } from '../types/journalEntry';
import { theme } from '../constants/theme';

interface EntryCardProps {
  entry: Entry;
  onEdit?: () => void;
  onDelete?: () => void;
  onPlayAudio?: () => void;
  compact?: boolean;
  isPlayingAudio?: boolean;
}

export default function EntryCard({ 
  entry, 
  onEdit, 
  onDelete, 
  onPlayAudio,
  compact = false,
  isPlayingAudio = false
}: EntryCardProps) {
  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formattedDate}</Text>
          {entry.hasAudio && (
            <View style={styles.audioIndicator}>
              <Ionicons 
                name="mic" 
                size={14} 
                color={theme.colors.primary} 
              />
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {entry.hasAudio && onPlayAudio && (
            <Pressable style={styles.actionButton} onPress={onPlayAudio}>
              <Ionicons 
                name={isPlayingAudio ? "pause" : "play"} 
                size={16} 
                color={theme.colors.primary} 
              />
            </Pressable>
          )}
          {onEdit && (
            <Pressable style={styles.actionButton} onPress={onEdit}>
              <Ionicons name="pencil" size={16} color={theme.colors.primary} />
            </Pressable>
          )}
          {onDelete && (
            <Pressable style={styles.actionButton} onPress={onDelete}>
              <Ionicons name="trash" size={16} color={theme.colors.danger} />
            </Pressable>
          )}
        </View>
      </View>

      <Text 
        style={styles.text} 
        numberOfLines={compact ? 3 : undefined}
      >
        {entry.text}
      </Text>

      {entry.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {entry.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {entry.mood && (
        <View style={styles.moodContainer}>
          <Text style={styles.moodText}>Mood: {entry.mood}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  audioIndicator: {
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  moodContainer: {
    marginTop: theme.spacing.xs,
  },
  moodText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
});
