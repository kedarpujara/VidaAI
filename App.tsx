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
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

// Import AI Analysis Service
import AIAnalysisService from './src/services/aiAnalysis';
import { Entry } from './src/types/journal';

// Constants
const ENTRIES_FILE = `${FileSystem.documentDirectory}journal_entries.json`;
const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const { width } = Dimensions.get('window');

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
  
  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // NEW: Photo State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [hasPhotoPermission, setHasPhotoPermission] = useState(false);
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await createPhotosDirectory();
    await loadEntries();
    await requestAudioPermissions();
    await requestPhotoPermissions();
  };

  // NEW: Create photos directory
  const createPhotosDirectory = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
        console.log('Photos directory created');
      }
    } catch (error) {
      console.error('Failed to create photos directory:', error);
    }
  };

  // NEW: Request photo permissions
  const requestPhotoPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status === 'granted' && cameraStatus.status === 'granted') {
        setHasPhotoPermission(true);
        console.log('Photo permissions granted');
      } else {
        setHasPhotoPermission(false);
        console.log('Photo permissions denied');
      }
    } catch (error) {
      console.error('Photo permission request failed:', error);
      setHasPhotoPermission(false);
    }
  };

  // Audio permissions (existing)
  const requestAudioPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        setHasAudioPermission(true);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } else {
        setHasAudioPermission(false);
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasAudioPermission(false);
    }
  };

  // Storage functions (existing)
  const encryptData = (data: string): string => {
    try {
      return Buffer.from(data, 'utf8').toString('base64');
    } catch (error) {
      return data;
    }
  };

  const decryptData = (encryptedData: string): string => {
    try {
      return Buffer.from(encryptedData, 'base64').toString('utf8');
    } catch (error) {
      return encryptedData;
    }
  };

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
            console.error('Corrupted data, auto-clearing:', parseError);
            await FileSystem.deleteAsync(ENTRIES_FILE);
            setEntries([]);
            Alert.alert('Storage Reset', 'Corrupted data was cleared. Starting fresh!');
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

  // NEW: Photo handling functions
  const savePhotoLocally = async (photoUri: string): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileName = `photo_${timestamp}.jpg`;
      const localPath = `${PHOTOS_DIR}${fileName}`;
      
      await FileSystem.copyAsync({
        from: photoUri,
        to: localPath,
      });
      
      console.log('Photo saved locally:', localPath);
      return localPath;
    } catch (error) {
      console.error('Failed to save photo locally:', error);
      throw new Error('Failed to save photo');
    }
  };

  const selectPhotoFromLibrary = async () => {
    try {
      if (!hasPhotoPermission) {
        Alert.alert('Permission Required', 'Please enable photo library access to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localPath = await savePhotoLocally(result.assets[0].uri);
        setSelectedPhoto(localPath);
      }
    } catch (error) {
      console.error('Photo selection failed:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const takePhoto = async () => {
    try {
      if (!hasPhotoPermission) {
        Alert.alert('Permission Required', 'Please enable camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localPath = await savePhotoLocally(result.assets[0].uri);
        setSelectedPhoto(localPath);
      }
    } catch (error) {
      console.error('Photo capture failed:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo to your entry',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: selectPhotoFromLibrary },
      ]
    );
  };

  const removeSelectedPhoto = () => {
    setSelectedPhoto(null);
  };

  // Transcription (existing)
  const transcribeWithOpenAI = async (audioUri: string): Promise<string> => {
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      return result.text || 'Transcription was empty';
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  };

  // Audio recording (existing)
  const startRecording = async () => {
    try {
      if (!hasAudioPermission) {
        Alert.alert('Permission Required', 'Please enable microphone access.');
        return;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Recording failed:', error);
      Alert.alert('Recording Failed', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      recordingRef.current = null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const transcribeAndAddToText = async () => {
    if (!recordingUri) return;

    try {
      setIsTranscribing(true);
      const transcribedText = await transcribeWithOpenAI(recordingUri);
      const newText = entryText ? `${entryText}\n\n${transcribedText}` : transcribedText;
      setEntryText(newText);
      clearRecording();
      Alert.alert('Transcribed!', 'Voice note converted to text.');
    } catch (error) {
      Alert.alert('Transcription Failed', 'Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearRecording = () => {
    setRecordingUri(null);
    setRecordingDuration(0);
  };

  // UPDATED: Save entry with photo support
  const saveEntry = async () => {
    if (!entryText.trim() && !selectedPhoto) {
      Alert.alert('Empty Entry', 'Please write something or add a photo before saving.');
      return;
    }

    try {
      setIsSaving(true);
      setIsAnalyzing(true);
      
      // Perform AI analysis
      let aiAnalysis = null;
      if (entryText.trim()) {
        try {
          aiAnalysis = await AIAnalysisService.analyzeJournalEntry(entryText);
          console.log('AI Analysis with title completed:', aiAnalysis);
        } catch (analysisError) {
          console.error('AI analysis failed:', analysisError);
        }
      }
      
      setIsAnalyzing(false);
      
      const newEntry: Entry = {
        id: Date.now().toString(),
        title: aiAnalysis?.title || (selectedPhoto ? 'Photo Memory' : `Entry ${new Date().toLocaleDateString()}`),
        text: entryText.trim() || (selectedPhoto ? 'Photo entry' : ''),
        date: new Date().toISOString(),
        tags: extractTags(entryText),
        transcribed: !!recordingUri,
        
        // NEW: Photo fields
        photoUri: selectedPhoto || undefined,
        hasPhoto: !!selectedPhoto,
        
        // Add AI analysis if successful
        ...(aiAnalysis && {
          mood: aiAnalysis.mood,
          emotions: aiAnalysis.emotions,
          themes: aiAnalysis.themes,
          insights: aiAnalysis.insights,
          aiAnalyzed: true,
        })
      };

      const updatedEntries = [newEntry, ...entries];
      await saveEntries(updatedEntries);
      setEntries(updatedEntries);
      
      // Clear form
      setEntryText('');
      setSelectedPhoto(null);
      clearRecording();
      
      if (aiAnalysis) {
        Alert.alert(
          '✨ Entry Saved!', 
          `Title: "${aiAnalysis.title}"\nMood: ${aiAnalysis.mood.primary}\nThemes: ${aiAnalysis.themes.join(', ')}`
        );
      } else {
        Alert.alert('Saved!', 'Journal entry saved successfully.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry.');
    } finally {
      setIsSaving(false);
      setIsAnalyzing(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      // Find entry to get photo path
      const entryToDelete = entries.find(e => e.id === id);
      
      // Delete photo file if exists
      if (entryToDelete?.photoUri) {
        try {
          const fileExists = await FileSystem.getInfoAsync(entryToDelete.photoUri);
          if (fileExists.exists) {
            await FileSystem.deleteAsync(entryToDelete.photoUri);
            console.log('Photo deleted:', entryToDelete.photoUri);
          }
        } catch (photoError) {
          console.error('Failed to delete photo:', photoError);
        }
      }
      
      // Delete entry from list
      const updatedEntries = entries.filter(entry => entry.id !== id);
      await saveEntries(updatedEntries);
      setEntries(updatedEntries);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete entry');
    }
  };

  const extractTags = (text: string): string[] => {
    const words = text.toLowerCase().split(/\s+/);
    const commonTags = ['happy', 'sad', 'excited', 'work', 'family'];
    return commonTags.filter(tag => words.some(word => word.includes(tag))).slice(0, 3);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enhanced search with photo support
  const filteredEntries = entries.filter(entry =>
    entry.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.themes?.some(theme => theme.toLowerCase().includes(searchQuery.toLowerCase())) ||
    entry.emotions?.some(emotion => emotion.toLowerCase().includes(searchQuery.toLowerCase()))
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vida Journal</Text>
          <Text style={styles.subtitle}>AI Voice-to-Text + Photo Journaling</Text>
          
          <Pressable style={styles.statusButton}>
            <Text style={styles.statusText}>
              {hasAudioPermission && hasPhotoPermission && OPENAI_API_KEY ? '🟢 Ready to Journal' : '🔴 Setup Required'}
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.section}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search entries, titles, themes..."
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* NEW: Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Add Photo</Text>
          
          {selectedPhoto ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: selectedPhoto }} style={styles.photoPreview} />
              <View style={styles.photoActions}>
                <Pressable style={styles.changePhotoButton} onPress={showPhotoOptions}>
                  <Ionicons name="camera" size={16} color="#4A90E2" />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </Pressable>
                <Pressable style={styles.removePhotoButton} onPress={removeSelectedPhoto}>
                  <Ionicons name="trash" size={16} color="#d9534f" />
                  <Text style={styles.removePhotoText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.addPhotoButton} onPress={showPhotoOptions}>
              <Ionicons name="camera" size={24} color="#4A90E2" />
              <Text style={styles.addPhotoText}>
                {hasPhotoPermission ? 'Tap to Add Photo' : 'Enable Camera Access'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Voice Recording */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎙️ Voice to Text</Text>
          
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
                  ? 'Enable Microphone Access'
                  : isRecording 
                    ? `Recording ${formatDuration(recordingDuration)}` 
                    : 'Record Voice Note'
                }
              </Text>
            </Pressable>

            {recordingUri && !isRecording && (
              <View style={styles.audioActions}>
                <Pressable
                  style={[styles.transcribeButton, isTranscribing && styles.disabledButton]}
                  onPress={transcribeAndAddToText}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="sparkles" size={16} color="#fff" />
                  )}
                  <Text style={styles.transcribeButtonText}>
                    {isTranscribing ? 'Transcribing...' : 'Transcribe with AI'}
                  </Text>
                </Pressable>
                
                <Pressable style={styles.smallButton} onPress={clearRecording}>
                  <Ionicons name="trash" size={16} color="#d9534f" />
                  <Text style={styles.smallButtonText}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Text Entry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✍️ Your Journal Entry</Text>
          <TextInput
            style={styles.textInput}
            value={entryText}
            onChangeText={setEntryText}
            placeholder="Record voice, add photo, or type here..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          {(entryText.length > 0 || selectedPhoto) && (
            <Pressable 
              style={[styles.saveButton, (isSaving || isAnalyzing) && styles.disabledButton]} 
              onPress={saveEntry}
              disabled={isSaving || isAnalyzing}
            >
              {isSaving || isAnalyzing ? (
                <View style={styles.savingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.saveButtonText}>
                    {isAnalyzing ? 'Analyzing & Creating Title...' : 'Saving...'}
                  </Text>
                </View>
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
              <Text style={styles.emptyText}>No entries yet!</Text>
              <Text style={styles.emptySubtext}>Record voice, add photo, or start typing.</Text>
            </View>
          ) : (
            filteredEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryTitleSection}>
                    <Text style={styles.entryTitle}>
                      {entry.title || 'Untitled Entry'}
                    </Text>
                    <View style={styles.entryMeta}>
                      <Text style={styles.entryDate}>
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                      {entry.transcribed && (
                        <View style={styles.transcribedIndicator}>
                          <Ionicons name="mic" size={8} color="#fff" />
                          <Text style={styles.transcribedText}>Voice</Text>
                        </View>
                      )}
                      {entry.hasPhoto && (
                        <View style={styles.photoIndicator}>
                          <Ionicons name="camera" size={8} color="#fff" />
                          <Text style={styles.photoIndicatorText}>Photo</Text>
                        </View>
                      )}
                      {entry.aiAnalyzed && (
                        <View style={styles.analyzedIndicator}>
                          <Ionicons name="sparkles" size={8} color="#fff" />
                          <Text style={styles.analyzedText}>AI</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <Pressable
                    style={styles.smallButton}
                    onPress={() => deleteEntry(entry.id)}
                  >
                    <Ionicons name="trash" size={16} color="#d9534f" />
                  </Pressable>
                </View>

                {/* Photo Display */}
                {entry.photoUri && (
                  <View style={styles.entryPhotoContainer}>
                    <Image source={{ uri: entry.photoUri }} style={styles.entryPhoto} />
                  </View>
                )}

                {/* Entry Text */}
                <View style={styles.entryTextContainer}>
                  <Text style={styles.entryText} numberOfLines={3}>
                    {entry.text}
                  </Text>
                </View>

                {/* AI Analysis Results */}
                {entry.mood && (
                  <View style={styles.moodContainer}>
                    <Text style={styles.moodText}>
                      🎭 Mood: {entry.mood.primary} ({entry.mood.confidence}% confident)
                    </Text>
                  </View>
                )}

                {entry.themes && entry.themes.length > 0 && (
                  <View style={styles.themesContainer}>
                    {entry.themes.map((theme, index) => (
                      <View key={index} style={styles.themeTag}>
                        <Text style={styles.themeText}>{theme}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {entry.insights && (
                  <View style={styles.insightsContainer}>
                    <Text style={styles.insightText}>🎯 Clarity: {entry.insights.clarity}/10</Text>
                    <Text style={styles.insightText}>💪 Growth: {entry.insights.growthPotential}/10</Text>
                    <Text style={styles.insightText}>⚠️ Stress: {entry.insights.stressLevel}/10</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== COMPLETE STYLES WITH PHOTO SUPPORT =====
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
  
  // NEW: Photo styles
  addPhotoButton: {
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8f9ff',
  },
  addPhotoText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  photoPreviewContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: width - 40,
    height: (width - 40) * 0.75,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
    gap: 5,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9534f',
    gap: 5,
  },
  removePhotoText: {
    fontSize: 14,
    color: '#d9534f',
    fontWeight: '600',
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
  photoIndicatorText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
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
  
  // Existing voice styles
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
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 4,
  },
  moodContainer: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  moodText: {
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
});