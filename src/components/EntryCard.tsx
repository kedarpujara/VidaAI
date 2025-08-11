import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Entry } from '../types/journal';
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
  // const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
  //   year: 'numeric',
  //   month: 'short',
  //   day: 'numeric',
  //   hour: '2-digit',
  //   minute: '2-digit',
  // });

  const renderEntry = ({ item }: { item: Entry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryMeta}>
          <Text style={styles.entryDate}>
            {new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          {item.transcribed && (
            <View style={styles.transcribedIndicator}>
              <Ionicons name="sparkles" size={12} color="#fff" />
              <Text style={styles.transcribedText}>AI</Text>
            </View>
          )}
          {item.aiAnalyzed && (
            <View style={styles.analyzedIndicator}>
              <Ionicons name="analytics" size={12} color="#fff" />
              <Text style={styles.analyzedText}>Analyzed</Text>
            </View>
          )}
        </View>
        
        <Pressable onPress={() => deleteEntry(item.id)}>
          <Ionicons name="trash-outline" size={16} color="#999" />
        </Pressable>
      </View>
      
      <Text style={styles.entryText}>{item.text}</Text>
      
      {/* AI Mood Display */}
      {item.mood && (
        <View style={styles.moodContainer}>
          <Text style={styles.moodText}>
            😊 {item.mood.primary}
            {item.mood.secondary && ` • ${item.mood.secondary}`}
            {item.mood.intensity && ` (${item.mood.intensity}/10)`}
          </Text>
        </View>
      )}
      
      {/* AI Themes */}
      {item.themes && item.themes.length > 0 && (
        <View style={styles.themesContainer}>
          {item.themes.map((theme, index) => (
            <View key={index} style={styles.themeTag}>
              <Text style={styles.themeText}>{theme}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* AI Emotions */}
      {item.emotions && item.emotions.length > 0 && (
        <View style={styles.emotionsContainer}>
          <Text style={styles.emotionsLabel}>Emotions: </Text>
          <Text style={styles.emotionsText}>{item.emotions.join(', ')}</Text>
        </View>
      )}
      
      {/* Sentiment & Energy */}
      {item.insights && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightText}>
            {item.insights.sentiment === 'positive' ? '📈' : 
             item.insights.sentiment === 'negative' ? '📉' : '➡️'} {item.insights.sentiment}
          </Text>
          <Text style={styles.insightText}>
            ⚡ {item.insights.energy} energy
          </Text>
          <Text style={styles.insightText}>
            🎯 {item.insights.clarity}/10 clarity
          </Text>
        </View>
      )}
    </View>
  );
}

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <View style={styles.dateContainer}>
//           <Text style={styles.date}>{formattedDate}</Text>
//           {entry.hasAudio && (
//             <View style={styles.audioIndicator}>
//               <Ionicons 
//                 name="mic" 
//                 size={14} 
//                 color={theme.colors.primary} 
//               />
//             </View>
//           )}
//         </View>
//         <View style={styles.actions}>
//           {entry.hasAudio && onPlayAudio && (
//             <Pressable style={styles.actionButton} onPress={onPlayAudio}>
//               <Ionicons 
//                 name={isPlayingAudio ? "pause" : "play"} 
//                 size={16} 
//                 color={theme.colors.primary} 
//               />
//             </Pressable>
//           )}
//           {onEdit && (
//             <Pressable style={styles.actionButton} onPress={onEdit}>
//               <Ionicons name="pencil" size={16} color={theme.colors.primary} />
//             </Pressable>
//           )}
//           {onDelete && (
//             <Pressable style={styles.actionButton} onPress={onDelete}>
//               <Ionicons name="trash" size={16} color={theme.colors.danger} />
//             </Pressable>
//           )}
//         </View>
//       </View>

//       <Text 
//         style={styles.text} 
//         numberOfLines={compact ? 3 : undefined}
//       >
//         {entry.text}
//       </Text>

//       {entry.tags.length > 0 && (
//         <View style={styles.tagsContainer}>
//           {entry.tags.map((tag, index) => (
//             <View key={index} style={styles.tag}>
//               <Text style={styles.tagText}>#{tag}</Text>
//             </View>
//           ))}
//         </View>
//       )}

//       {entry.mood && (
//         <View style={styles.moodContainer}>
//           <Text style={styles.moodText}>Mood: {entry.mood}</Text>
//         </View>
//       )}
//     </View>
//   );
// }

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
  analyzedIndicator: {
    backgroundColor: '#9C27B0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  analyzedText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  moodContainer: {
    // marginTop: theme.spacing.xs,
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  moodText: {
    // fontSize: 14,
    color: '#E65100',
    // fontWeight: '600',
    ...theme.typography.caption,
    // color: theme.colors.textMuted,
    fontStyle: 'italic',
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
  emotionsContainer: {
    flexDirection: 'row',
    marginTop: 6,
  },
  emotionsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  emotionsText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
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
});
