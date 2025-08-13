import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

// Import AI Analysis Service
import AIAnalysisService from '../services/aiAnalysis';
import { Entry } from '../types/journal';

// Constants
const ENTRIES_FILE = `${FileSystem.documentDirectory}journal_entries.json`;
const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const { width } = Dimensions.get('window');

interface JournalScreenProps {
  onEntryAdded: (entry: Entry) => void;
  onBulkEntriesAdded: (entries: Entry[]) => void;
  onRemoveDummyData: () => void;
}

export default function JournalScreen({ onEntryAdded, onBulkEntriesAdded, onRemoveDummyData }: JournalScreenProps) {
  // State
  const [entryText, setEntryText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  
  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Photo State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [hasPhotoPermission, setHasPhotoPermission] = useState(false);
  
  // Mood State (NEW)
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializePermissions();
  }, []);

  const initializePermissions = async () => {
    await requestAudioPermissions();
    await requestPhotoPermissions();
  };

  // Audio permissions
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

  // Photo permissions
  const requestPhotoPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status === 'granted' && cameraStatus.status === 'granted') {
        setHasPhotoPermission(true);
      } else {
        setHasPhotoPermission(false);
      }
    } catch (error) {
      console.error('Photo permission request failed:', error);
      setHasPhotoPermission(false);
    }
  };

  // Photo handling
  const savePhotoLocally = async (photoUri: string): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileName = `photo_${timestamp}.jpg`;
      const localPath = `${PHOTOS_DIR}${fileName}`;
      
      await FileSystem.copyAsync({
        from: photoUri,
        to: localPath,
      });
      
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

  // Transcription
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

  // Audio recording
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

  const generateDummyData = () => {
    const dummyEntries: Entry[] = [];
    const now = new Date();
    
    // More colorful and descriptive titles
    const titles = [
      "🌟 Morning Breakthrough at Work",
      "🏃‍♂️ Epic Run Through Central Park", 
      "👨‍👩‍👧‍👦 Family Game Night Magic",
      "😰 Deadline Stress But I Got This",
      "📚 Life-Changing Book Discovery",
      "☕ Coffee Chat with Sarah",
      "😴 Exhausted But Grateful Day",
      "🍳 Cooking Adventure Success!",
      "🙏 Gratitude Overflow Moment",
      "💪 Pushed Through the Hard Stuff",
      "🌅 Stunning Sunset Reflection",
      "🗂️ Organized Life, Organized Mind",
      "😬 Anxiety About Changes Ahead",
      "🗺️ Urban Explorer Saturday",
      "🧘‍♀️ Peaceful Meditation Session",
      "🎨 Creative Energy Unleashed",
      "🌱 Personal Growth Victory",
      "🏠 Cozy Home Evening",
      "🚀 Productive Flow State",
      "❤️ Love and Connection Day"
    ];

    // Sample journal texts with varying themes and moods
    const journalTexts = [
      "Had a great day at work today. Feeling productive and accomplished. The team meeting went really well and I presented my ideas confidently.",
      "Went for a run this morning. The weather was perfect and I feel energized. Managed to beat my personal best time!",
      "Spent quality time with family. We had dinner together and shared stories. Mom's lasagna was incredible as always.",
      "Feeling a bit stressed about deadlines. Need to better manage my time. But I know I can handle this challenge.",
      "Read an interesting book today. It really made me think about life differently. The author's perspective was eye-opening.",
      "Had coffee with a friend. Great conversations always lift my spirits. We talked for hours about everything.",
      "Feeling tired today. Didn't sleep well last night. Need better sleep habits but grateful for what I accomplished.",
      "Tried cooking a new recipe. It turned out amazing! Proud of myself for stepping out of my comfort zone.",
      "Feeling grateful for all the good things in my life right now. Sometimes it's important to pause and appreciate.",
      "Challenging day but I pushed through. Building resilience step by step. Each obstacle makes me stronger.",
      "Beautiful sunset today. Nature always puts things in perspective. Took some time to just breathe and observe.",
      "Organized my workspace. A clean environment helps clear thinking. Ready to tackle tomorrow's projects.",
      "Feeling anxious about upcoming changes. Change is hard but necessary for growth. Taking it one day at a time.",
      "Had a fun weekend adventure. Explored a new part of the city. Found this amazing little bookstore cafe.",
      "Meditation session helped center my thoughts today. Ten minutes of mindfulness made a huge difference.",
      "Creative project is coming along nicely. Love when inspiration strikes. Colors and ideas flowing freely.",
      "Learning something new about myself every day. Growth happens in small moments of self-reflection.",
      "Perfect evening at home with tea and music. Sometimes the simple pleasures are the most meaningful.",
      "In the zone today - everything clicked. When work feels like play, that's when magic happens.",
      "Surrounded by love and support today. Reminded how blessed I am to have amazing people in my life."
    ];

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      
      // Generate 3 entries per day
      for (let entryIndex = 0; entryIndex < 3; entryIndex++) {
        const entryDate = new Date(date);
        entryDate.setHours(8 + entryIndex * 4 + Math.floor(Math.random() * 3)); // 8am, 12pm, 4pm +/- random
        entryDate.setMinutes(Math.floor(Math.random() * 60));
        entryDate.setSeconds(Math.floor(Math.random() * 60));
        
        const titleIndex = Math.floor(Math.random() * titles.length);
        const textIndex = Math.floor(Math.random() * journalTexts.length);
        const mood = Math.floor(Math.random() * 5) + 1; // 1-5
        
        // Determine themes based on title/content
        let themes = [];
        const title = titles[titleIndex];
        if (title.includes('Work') || title.includes('Productive')) themes = ['work', 'productivity', 'career'];
        else if (title.includes('Run') || title.includes('Epic')) themes = ['health', 'exercise', 'achievement'];
        else if (title.includes('Family')) themes = ['family', 'relationships', 'love'];
        else if (title.includes('Coffee') || title.includes('Chat')) themes = ['friends', 'social', 'connection'];
        else if (title.includes('Book') || title.includes('Growth')) themes = ['learning', 'growth', 'knowledge'];
        else if (title.includes('Cooking') || title.includes('Adventure')) themes = ['creativity', 'cooking', 'achievement'];
        else if (title.includes('Sunset') || title.includes('Nature')) themes = ['nature', 'beauty', 'reflection'];
        else if (title.includes('Meditation') || title.includes('Peaceful')) themes = ['mindfulness', 'wellness', 'peace'];
        else if (title.includes('Stress') || title.includes('Anxiety')) themes = ['stress', 'challenges', 'growth'];
        else themes = ['daily life', 'reflection', 'personal'];
        
        const entry: Entry = {
          id: `dummy_${dayOffset}_${entryIndex}_${Date.now()}_${Math.random()}`,
          title: title,
          text: journalTexts[textIndex],
          date: entryDate.toISOString(),
          tags: [...themes, 'dummy'], // Add dummy tag for easy identification
          manualMood: mood,
          transcribed: Math.random() > 0.7, // 30% chance of being transcribed
          aiAnalyzed: true,
          mood: {
            primary: mood >= 4 ? 'positive' : mood >= 3 ? 'neutral' : 'negative',
            confidence: Math.floor(Math.random() * 30) + 70 // 70-100% confidence
          },
          emotions: mood >= 4 ? ['happy', 'excited', 'confident'] : mood >= 3 ? ['calm', 'content', 'peaceful'] : ['sad', 'worried', 'tired'],
          themes: themes,
          insights: {
            clarity: Math.floor(Math.random() * 5) + 6, // 6-10
            growthPotential: Math.floor(Math.random() * 5) + 6, // 6-10
            stressLevel: mood <= 2 ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 4) + 1 // Higher stress for low mood
          }
        };
        
        dummyEntries.push(entry);
      }
    }
    
    console.log(`Generated ${dummyEntries.length} dummy entries`);
    return dummyEntries;
  };

  const addDummyData = async () => {
    try {
      Alert.alert(
        'Add Dummy Data',
        'This will add 90 sample entries (3 per day for 30 days). Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add Data', 
            onPress: async () => {
              const dummyEntries = generateDummyData();
              console.log('Generated entries:', dummyEntries.length);
              console.log('Sample entry:', dummyEntries[0]);
              
              // Use bulk addition method
              onBulkEntriesAdded(dummyEntries);
              
              Alert.alert('Success!', `Added ${dummyEntries.length} dummy entries for testing analytics.`);
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error adding dummy data:', error);
      Alert.alert('Error', 'Failed to add dummy data');
    }
  };

  const removeDummyData = () => {
    Alert.alert(
      'Remove Dummy Data',
      'This will remove all entries with the #dummy tag. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove All', 
          style: 'destructive',
          onPress: () => {
            onRemoveDummyData();
            Alert.alert('Success!', 'All dummy data has been removed.');
          }
        },
      ]
    );
  };

  // Save entry
  const saveEntry = async () => {
    if (!entryText.trim() && !selectedPhoto && selectedMood === null) {
      Alert.alert('Empty Entry', 'Please add some content before saving.');
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
        
        // Mood (manual)
        manualMood: selectedMood || undefined,
        
        // Photo fields
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

      // Call parent to add entry
      onEntryAdded(newEntry);
      
      // Clear form
      setEntryText('');
      setSelectedPhoto(null);
      setSelectedMood(null);
      clearRecording();
      
      if (aiAnalysis) {
        Alert.alert(
          '✨ Entry Saved!', 
          `Title: "${aiAnalysis.title}"\nMood: ${aiAnalysis.mood.primary}`
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

  // Mood selector
  const moodEmojis = ['😔', '😕', '😐', '🙂', '😊'];
  const moodLabels = ['Very Bad', 'Bad', 'Okay', 'Good', 'Great'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Entry</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>

        {/* Temporary Developer Buttons */}
        <View style={styles.devSection}>
          <Text style={styles.devTitle}>🛠️ Developer Tools (Temporary)</Text>
          <View style={styles.devButtons}>
            <Pressable style={styles.addDummyButton} onPress={addDummyData}>
              <Ionicons name="add-circle" size={16} color="#fff" />
              <Text style={styles.devButtonText}>Add Dummy Data</Text>
            </Pressable>
            <Pressable style={styles.removeDummyButton} onPress={removeDummyData}>
              <Ionicons name="trash" size={16} color="#fff" />
              <Text style={styles.devButtonText}>Remove Dummy Data</Text>
            </Pressable>
          </View>
        </View>

      {/* Mood Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😊 How's your mood?</Text>
        <View style={styles.moodSelector}>
          {moodEmojis.map((emoji, index) => (
            <Pressable
              key={index}
              style={[
                styles.moodButton,
                selectedMood === index + 1 && styles.moodButtonSelected
              ]}
              onPress={() => setSelectedMood(index + 1)}
            >
              <Text style={styles.moodEmoji}>{emoji}</Text>
              <Text style={styles.moodLabel}>{moodLabels[index]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Photo Section */}
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
        <Text style={styles.sectionTitle}>✍️ Your Thoughts</Text>
        <TextInput
          style={styles.textInput}
          value={entryText}
          onChangeText={setEntryText}
          placeholder="What's on your mind today?"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        
        {(entryText.length > 0 || selectedPhoto || selectedMood !== null) && (
          <Pressable 
            style={[styles.saveButton, (isSaving || isAnalyzing) && styles.disabledButton]} 
            onPress={saveEntry}
            disabled={isSaving || isAnalyzing}
          >
            {isSaving || isAnalyzing ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.saveButtonText}>
                  {isAnalyzing ? 'Analyzing...' : 'Saving...'}
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

      {/* Bottom padding for tab bar */}
      <View style={styles.bottomPadding} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  
  // Developer section styles
  devSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  devTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f57f17',
    marginBottom: 10,
    textAlign: 'center',
  },
  devButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addDummyButton: {
    flex: 1,
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 5,
  },
  removeDummyButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 5,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 14,
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
  
  // Mood selector styles
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f9f9f9',
    minWidth: 60,
  },
  moodButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#f0f8ff',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Photo styles
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
  
  // Voice styles
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
  bottomPadding: {
    height: 10, // Reduced since tab bar is now taller
  },
});