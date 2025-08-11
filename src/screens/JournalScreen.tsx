import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJournal } from '../context/JournalContext';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import TranscriptionService from '../services/transcription';
import Button from '../components/Button';
import EntryCard from '../components/EntryCard';
import { theme } from '../constants/theme';

export default function JournalScreen() {
  const { entries, addEntry } = useJournal();
  const { isRecording, audioUri, duration, startRecording, stopRecording, clearRecording, playRecording, isPlaying } = useAudioRecorder();
  const [draftText, setDraftText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const latestEntry = entries[0];

  const handleRecord = async () => { isRecording ? await stopRecording() : await startRecording(); };

  const handleTranscribe = async () => {
    if (!audioUri) return;
    try {
      setIsTranscribing(true);
      const result = await TranscriptionService.transcribeAudio(audioUri);
      const newText = draftText ? `${draftText}\n\n${result.text}` : result.text;
      setDraftText(newText);
    } catch {
      Alert.alert('Transcription Failed', 'Please try again or type your entry manually.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSave = async () => {
    const text = draftText.trim();
    if (!text && !audioUri) {
      Alert.alert('Empty Entry', 'Please write something or record audio before saving.');
      return;
    }
    try {
      setIsSaving(true);
      await addEntry(text || '🎙️ Voice note (tap to add text)', [], audioUri || undefined);
      setDraftText('');
      clearRecording();
      Alert.alert('Saved!', 'Your journal entry has been saved securely.');
    } catch {
      Alert.alert('Save Failed', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert('Discard Entry?', 'This will delete your current draft and recording. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { setDraftText(''); clearRecording(); } }
    ]);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>New Entry</Text>
            <Text style={styles.subtitle}>Share your thoughts, feelings, or experiences</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.recordingContainer}>
              <Button title={isRecording ? `Recording ${formatDuration(duration)}` : 'Record Voice'} variant={isRecording ? 'danger' : 'primary'} onPress={handleRecord} style={styles.recordButton}>
                <View style={styles.recordButtonContent}>
                  <Ionicons name={isRecording ? 'stop' : 'mic'} size={20} color={theme.colors.background} style={{ marginRight: 8 }} />
                  <Text style={styles.recordButtonText}>{isRecording ? `Recording ${formatDuration(duration)}` : 'Record Voice'}</Text>
                </View>
              </Button>

              {audioUri && !isRecording && (
                <View style={styles.audioActions}>
                  <Button title={isPlaying ? 'Playing...' : 'Play Recording'} variant="secondary" onPress={playRecording} size="small" />
                  <Button title={isTranscribing ? 'Adding...' : 'Add to Entry'} variant="secondary" onPress={handleTranscribe} loading={isTranscribing} size="small" />
                  <Button title="Delete" variant="ghost" onPress={clearRecording} size="small" />
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Write Your Entry</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.textInput} value={draftText} onChangeText={setDraftText} placeholder="What's on your mind today?" placeholderTextColor={theme.colors.placeholder} multiline textAlignVertical="top" />
            </View>
          </View>

          {(draftText.length > 0 || audioUri) && (
            <View style={styles.section}>
              <View style={styles.buttonContainer}>
                <Button title="Save Entry" onPress={handleSave} loading={isSaving} fullWidth style={styles.saveButton} />
                <Button title="Discard" variant="ghost" onPress={handleDiscard} fullWidth />
              </View>
            </View>
          )}

          {latestEntry && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Latest Entry</Text>
              <EntryCard entry={latestEntry} compact />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1, paddingHorizontal: theme.spacing.md },
  header: { paddingTop: theme.spacing.md, paddingBottom: theme.spacing.lg },
  title: { ...theme.typography.h1, color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
  recordingContainer: { alignItems: 'center' },
  recordButton: { minWidth: 200 },
  recordButtonContent: { flexDirection: 'row', alignItems: 'center' },
  recordButtonText: { ...theme.typography.button, color: theme.colors.background },
  audioActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md, flexWrap: 'wrap', justifyContent: 'center' },
  inputContainer: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, minHeight: 150 },
  textInput: { flex: 1, ...theme.typography.body, color: theme.colors.text, lineHeight: 24 },
  buttonContainer: { gap: theme.spacing.md },
  saveButton: { marginBottom: theme.spacing.sm },
});
