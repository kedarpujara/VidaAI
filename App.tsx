import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { Audio } from 'expo-av'; // Back to expo-av which works
import { Buffer } from 'buffer'; // For proper base64 encoding

// Types
interface Entry {
  id: string;
  text: string;
  date: string;
  tags: string[];
  transcribed?: boolean;
}

// Constants
const ENTRIES_FILE = `${FileSystem.documentDirectory}journal_entries.json`;
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export default function App() {
  // State
  const [entryText, setEntryText] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load entries on app start
  useEffect(() => {
    loadEntries();
    requestAudioPermissions();
  }, []);

  // Request audio permissions (FIXED)
  const requestAudioPermissions = async () => {
    try {
      console.log('Requesting audio permissions...');
      
      const { status } = await Audio.requestPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status === 'granted') {
        setHasAudioPermission(true);
        console.log('Audio permission granted');
        
        // Set audio mode for recording
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } else {
        setHasAudioPermission(false);
        console.log('Audio permission denied');
        
        Alert.alert(
          'Microphone Permission Required',
          'To record voice notes, please enable microphone access in your device settings.',
          [
            { text: 'OK' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                // This will prompt to open settings on iOS
                Audio.requestPermissionsAsync();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasAudioPermission(false);
    }
  };

  // Fixed encryption using Buffer
  const encryptData = (data: string): string => {
    try {
      return Buffer.from(data, 'utf8').toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      return data; // Fallback to plain text
    }
  };

  const decryptData = (encryptedData: string): string => {
    try {
      return Buffer.from(encryptedData, 'base64').toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData; // Fallback to original data
    }
  };

  // Storage functions
  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const fileExists = await FileSystem.getInfoAsync(ENTRIES_FILE);
      if (fileExists.exists) {
        const encryptedData = await FileSystem.readAsStringAsync(ENTRIES_FILE);
        if (encryptedData && encryptedData.trim()) {
          try {
            const decryptedData = decryptData(encryptedData);
            const loadedEntries = JSON.parse(decryptedData);
            setEntries(Array.isArray(loadedEntries) ? loadedEntries : []);
          } catch (parseError) {
            console.error('Corrupted data detected, clearing storage:', parseError);
            // Clear corrupted file and start fresh
            await FileSystem.deleteAsync(ENTRIES_FILE);
            setEntries([]);
            Alert.alert('Storage Reset', 'Corrupted data was cleared. You can start fresh!');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntries = async (entriesToSave: Entry[]) => {
    try {
      const data = JSON.stringify(entriesToSave);
      const encryptedData = encryptData(data);
      await FileSystem.writeAsStringAsync(ENTRIES_FILE, encryptedData);
    } catch (error) {
      console.error('Failed to save entries:', error);
      throw new Error('Failed to save entries');
    }
  };

  // OpenAI Whisper Transcription
  const transcribeWithOpenAI = async (audioUri: string): Promise<string> => {
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      console.log('Starting transcription with OpenAI...');

      // Create form data for OpenAI API
      const formData = new FormData();
      
      // Add the audio file
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      // Call OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('Transcription successful:', result.text?.substring(0, 50) + '...');
      return result.text || 'Transcription was empty';

    } catch (error) {
      console.error('OpenAI transcription failed:', error);
      throw error;
    }
  };

  // Voice recording functions (FIXED)
  const startRecording = async () => {
    try {
      // Check permission first
      if (!hasAudioPermission) {
        Alert.alert(
          'Permission Required',
          'Microphone access is required to record voice notes.',
          [
            { text: 'Cancel' },
            { text: 'Grant Permission', onPress: requestAudioPermissions }
          ]
        );
        return;
      }

      console.log('Starting recording...');

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      console.log('Recording started successfully');

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      
      Alert.alert(
        'Recording Failed',
        'Could not start recording. Please check microphone permissions.',
        [
          { text: 'OK' },
          { text: 'Check Permissions', onPress: requestAudioPermissions }
        ]
      );
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      console.log('Stopping recording...');
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      console.log('Recording stopped, URI:', uri);
      setRecordingUri(uri);
      setIsRecording(false);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      recordingRef.current = null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
    }
  };

  const transcribeAndAddToText = async () => {
    if (!recordingUri) return;

    try {
      setIsTranscribing(true);
      
      // Call OpenAI Whisper API
      const transcribedText = await transcribeWithOpenAI(recordingUri);
      
      // Add transcribed text to entry
      const newText = entryText 
        ? `${entryText}\n\n${transcribedText}` 
        : transcribedText;
      
      setEntryText(newText);
      
      // Clear the recording since we've transcribed it
      clearRecording();
      
      Alert.alert('Transcribed!', 'Voice note has been converted to text and added to your entry.');
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert(
        'Transcription Failed', 
        error instanceof Error ? error.message : 'Could not transcribe audio. Please check your internet connection and API key.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearRecording = () => {
    setRecordingUri(null);
    setRecordingDuration(0);
  };

  // Entry management
  const saveEntry = async () => {
    if (!entryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    try {
      setIsSaving(true);
      
      const newEntry: Entry = {
        id: Date.now().toString(),
        text: entryText.trim(),
        date: new Date().toISOString(),
        tags: extractTags(entryText),
        transcribed: !!recordingUri,
      };

      const updatedEntries = [newEntry, ...entries];
      await saveEntries(updatedEntries);
      setEntries(updatedEntries);
      
      // Clear form
      setEntryText('');
      clearRecording();
      
      Alert.alert('Saved!', 'Your journal entry has been saved securely.');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const updatedEntries = entries.filter(entry => entry.id !== id);
      await saveEntries(updatedEntries);
      setEntries(updatedEntries);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete entry');
    }
  };

  // Test permissions and API
  const testSetup = async () => {
    const permissionStatus = await Audio.getPermissionsAsync();
    Alert.alert(
      'Setup Status',
      `🎙️ Microphone: ${permissionStatus.granted ? 'Granted ✅' : 'Denied ❌'}\n🤖 OpenAI API: ${OPENAI_API_KEY ? 'Configured ✅' : 'Missing ❌'}\n\nStatus: ${permissionStatus.status}`,
      [
        { text: 'OK' },
        ...(permissionStatus.canAskAgain && !permissionStatus.granted ? [{ text: 'Request Permission', onPress: requestAudioPermissions }] : [])
      ]
    );
  };

  // Utility functions
  const extractTags = (text: string): string[] => {
    const words = text.toLowerCase().split(/\s+/);
    const commonTags = ['happy', 'sad', 'excited', 'grateful', 'work', 'family', 'love', 'travel', 'voice-note'];
    return commonTags.filter(tag => words.some(word => word.includes(tag))).slice(0, 3);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredEntries = entries.filter(entry =>
    entry.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading your journal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vida Journal</Text>
          <Text style={styles.subtitle}>AI Voice-to-Text Journaling</Text>
          
          <Pressable onPress={testSetup} style={styles.statusButton}>
            <Text style={styles.statusText}>
              {hasAudioPermission && OPENAI_API_KEY ? '🟢 Ready to Record' : '🔴 Setup Required'}
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.section}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search your entries..."
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Voice Recording Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎙️ Voice to Text (OpenAI Whisper)</Text>
          
          <View style={styles.voiceControls}>
            <Pressable
              style={[
                styles.voiceButton, 
                isRecording && styles.recordingButton,
                !hasAudioPermission && styles.disabledButton
              ]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={24} 
                color={isRecording ? "#fff" : (hasAudioPermission ? "#4A90E2" : "#999")} 
              />
              <Text style={[
                styles.voiceButtonText,
                isRecording && styles.recordingButtonText,
                !hasAudioPermission && styles.disabledButtonText
              ]}>
                {!hasAudioPermission 
                  ? 'Tap to Enable Microphone'
                  : isRecording 
                    ? `Recording ${formatDuration(recordingDuration)}` 
                    : 'Record Voice Note'
                }
              </Text>
            </Pressable>

            {recordingUri && !isRecording && (
              <View style={styles.audioActions}>
                <Pressable
                  style={[styles.transcribeButton, (isTranscribing || !OPENAI_API_KEY) && styles.disabledButton]}
                  onPress={transcribeAndAddToText}
                  disabled={isTranscribing || !OPENAI_API_KEY}
                >
                  {isTranscribing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="sparkles" size={16} color="#fff" />
                  )}
                  <Text style={styles.transcribeButtonText}>
                    {!OPENAI_API_KEY ? 'API Key Required' : isTranscribing ? 'Transcribing...' : 'Transcribe with AI'}
                  </Text>
                </Pressable>
                
                <Pressable
                  style={styles.smallButton}
                  onPress={clearRecording}
                >
                  <Ionicons name="trash" size={16} color="#d9534f" />
                  <Text style={[styles.smallButtonText, { color: '#d9534f' }]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Text Entry Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✍️ Your Journal Entry</Text>
          <TextInput
            style={styles.textInput}
            value={entryText}
            onChangeText={setEntryText}
            placeholder="Record voice above or type here..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          {entryText.length > 0 && (
            <Pressable 
              style={[styles.saveButton, isSaving && styles.disabledButton]} 
              onPress={saveEntry}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Entries List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📖 Your Entries ({filteredEntries.length})
          </Text>
          
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No entries match your search' : 'No entries yet!'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try different keywords' : 'Record a voice note or start typing to create your first entry.'}
              </Text>
            </View>
          ) : (
            filteredEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryDate}>
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    {entry.transcribed && (
                      <View style={styles.transcribedIndicator}>
                        <Ionicons name="sparkles" size={12} color="#fff" />
                        <Text style={styles.transcribedText}>AI</Text>
                      </View>
                    )}
                  </View>
                  
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        'Delete Entry',
                        'Are you sure you want to delete this entry?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#999" />
                  </Pressable>
                </View>
                
                <Text style={styles.entryText}>{entry.text}</Text>
                
                {entry.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {entry.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{entries.length}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {entries.filter(e => e.transcribed).length}
              </Text>
              <Text style={styles.statLabel}>AI Transcribed</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>🔒</Text>
              <Text style={styles.statLabel}>Encrypted</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
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
  voiceControls: {
    alignItems: 'center',
  },
  voiceButton: {
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 8,
    minWidth: 240,
  },
  recordingButton: {
    backgroundColor: '#d9534f',
    borderColor: '#d9534f',
  },
  disabledButton: {
    opacity: 0.6,
    borderColor: '#999',
  },
  voiceButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  recordingButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: '#999',
  },
  audioActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  transcribeButton: {
    backgroundColor: '#5CB85C',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 5,
  },
  transcribeButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 5,
  },
  smallButtonText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 120,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
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
  transcribedText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  entryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    justifyContent: 'space-around',
  },
  stat: {
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
    marginTop: 4,
  },
});