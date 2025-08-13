import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
// Fallback to expo-av until expo-audio API is clarified
import { Audio } from 'expo-av'; // Working solution
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';

// Import AI Analysis Service
import AIAnalysisService from '../services/aiAnalysis';
import { Entry } from '../types/journal';

// Constants
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const { width } = Dimensions.get('window');

interface CreateJournalEntryScreenProps {
  onEntryAdded: (entry: Entry) => void;
  onRemoveDummyData: () => void;
  analysisEnabled?: boolean;
  onToggleAnalysis?: () => void;
  onBatchAnalyze?: () => void;
  isAnalyzing?: boolean;
  isRecording?: boolean;
  onRecordingStateChange?: (recording: boolean) => void;
}

export default function CreateJournalEntryScreen({ 
  onEntryAdded, 
  onRemoveDummyData,
  analysisEnabled = true,
  onToggleAnalysis,
  onBatchAnalyze,
  isAnalyzing = false,
  isRecording: externalIsRecording = false,
  onRecordingStateChange,
}: CreateJournalEntryScreenProps) {
  // State
  const [entryText, setEntryText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  
  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  
  // AI Analysis State
  const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false);
  
  // Photo State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [hasPhotoPermission, setHasPhotoPermission] = useState(false);
  
  // Upload State
  const [isUploadTranscribing, setIsUploadTranscribing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  
  // Activity State
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  
  // Modal State
  const [showTextModal, setShowTextModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Animation refs
  const micScale = useRef(new Animated.Value(1)).current;
  const transcriptionOpacity = useRef(new Animated.Value(0)).current;
  const transcriptionHeight = useRef(new Animated.Value(0)).current;
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializePermissions();
    
    // Cleanup function
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Sync with external recording state
  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(isRecording);
    }
  }, [isRecording, onRecordingStateChange]);

  const initializePermissions = async () => {
    await requestAudioPermissions();
    await requestPhotoPermissions();
  };

  const selectVoiceMemo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check if it's an audio file
        const isAudioFile = asset.mimeType?.startsWith('audio/') || 
                           asset.name.match(/\.(m4a|mp3|wav|aac|flac|ogg)$/i);
        
        if (isAudioFile) {
          setUploadedFile(asset.uri);
          setShowUploadModal(false);
          await transcribeUploadedFile(asset.uri);
        } else {
          Alert.alert(
            'Invalid File Type', 
            'Please select an audio file (m4a, mp3, wav, etc.) from your Files app.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }
    } catch (error) {
      console.error('Voice memo selection failed:', error);
      Alert.alert(
        'File Access Error', 
        'Unable to access the Files app. Please make sure you have audio files saved in your Files app.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const transcribeUploadedFile = async (audioUri: string) => {
    try {
      setIsUploadTranscribing(true);
      const transcribedText = await transcribeWithOpenAI(audioUri);
      const newText = entryText ? `${entryText}\n\n${transcribedText}` : transcribedText;
      setEntryText(newText);
      
      setUploadedFile(null);
    } catch (error) {
      Alert.alert('Transcription Failed', 'Could not transcribe the uploaded audio file. Please try again.');
    } finally {
      setIsUploadTranscribing(false);
    }
  };

  // Add this function to properly initialize audio mode
  const initializeAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error('Failed to set audio mode:', error);
    }
  };

  const requestAudioPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        setHasAudioPermission(true);
        // Initialize audio mode after getting permission
        await initializeAudioMode();
      } else {
        setHasAudioPermission(false);
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasAudioPermission(false);
    }
  };

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

  const savePhotoLocally = async (photoUri: string): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileName = `photo_${timestamp}.jpg`;
      const photosDir = `${FileSystem.documentDirectory}photos/`;
      const localPath = `${photosDir}${fileName}`;
      
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      }
      
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
        setShowPhotoModal(false);
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
        setShowPhotoModal(false);
      }
    } catch (error) {
      console.error('Photo capture failed:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

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

  const startRecording = async () => {
    try {
      if (!hasAudioPermission) {
        Alert.alert('Permission Required', 'Please enable microphone access.');
        return;
      }

      // Ensure audio mode is set before recording
      await initializeAudioMode();

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Animate mic button
      Animated.loop(
        Animated.sequence([
          Animated.timing(micScale, { duration: 1000, toValue: 1.1, useNativeDriver: true }),
          Animated.timing(micScale, { duration: 1000, toValue: 1, useNativeDriver: true }),
        ])
      ).start();

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Recording failed:', error);
      Alert.alert('Recording Failed', `Could not start recording: ${error.message}`);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      console.log('Stopping recording...');
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      setRecordingUri(uri);
      setIsRecording(false);
      
      // Stop animation
      micScale.stopAnimation();
      Animated.timing(micScale, { duration: 200, toValue: 1, useNativeDriver: true }).start();
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      recordingRef.current = null;
      console.log('Recording stopped, URI:', uri);

      // Auto-transcribe if we have a URI
      if (uri) {
        await transcribeAndAddToText(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      
      // Reset state even if stopping failed
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      recordingRef.current = null;
      micScale.stopAnimation();
      Animated.timing(micScale, { duration: 200, toValue: 1, useNativeDriver: true }).start();
    }
  };

  const transcribeAndAddToText = async (audioUri: string) => {
    try {
      setIsTranscribing(true);
      const transcribedText = await transcribeWithOpenAI(audioUri);
      const newText = entryText ? `${entryText}\n\n${transcribedText}` : transcribedText;
      setEntryText(newText);
      
      setRecordingUri(null);
      setRecordingDuration(0);
    } catch (error) {
      Alert.alert('Transcription Failed', 'Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const showTranscriptionArea = () => {
    Animated.parallel([
      Animated.timing(transcriptionOpacity, { duration: 500, toValue: 1, useNativeDriver: false }),
      Animated.timing(transcriptionHeight, { duration: 500, toValue: 1, useNativeDriver: false }),
    ]).start();
  };

  const toggleActivity = (activity: string, value: string) => {
    const activityKey = `${activity}_${value}`;
    const newActivities = new Set(selectedActivities);
    
    // Remove any existing entry for this activity type
    Array.from(selectedActivities).forEach(item => {
      if (item.startsWith(`${activity}_`)) {
        newActivities.delete(item);
      }
    });
    
    // Add the new selection
    newActivities.add(activityKey);
    setSelectedActivities(newActivities);
  };

  const getActivityValue = (activity: string) => {
    const activityEntry = Array.from(selectedActivities).find(item => item.startsWith(`${activity}_`));
    return activityEntry ? activityEntry.split('_')[1] : null;
  };

  const getExtrasData = () => [
    {
      id: 'social',
      title: 'Social Time?',
      options: [
        { value: 'no', emoji: '🚫', label: 'No' },
        { value: 'yes', emoji: '👥', label: 'Yes' }
      ],
      selected: getActivityValue('social')
    },
    {
      id: 'exercise',
      title: 'Exercise?',
      options: [
        { value: 'no', emoji: '🚫', label: 'No' },
        { value: 'yes', emoji: '💪', label: 'Yes' }
      ],
      selected: getActivityValue('exercise')
    },
    {
      id: 'nature',
      title: 'Time in Nature?',
      options: [
        { value: 'no', emoji: '🚫', label: 'No' },
        { value: 'yes', emoji: '🌿', label: 'Yes' }
      ],
      selected: getActivityValue('nature')
    },
    {
      id: 'sleep',
      title: 'Sleep Quality?',
      options: [
        { value: 'bad', emoji: '🥱', label: 'Bad' },
        { value: 'medium', emoji: '😐', label: 'Medium' },
        { value: 'good', emoji: '😊', label: 'Good' }
      ],
      selected: getActivityValue('sleep')
    },
    {
      id: 'mood',
      title: 'Overall Mood?',
      options: [
        { value: 'terrible', emoji: '😢', label: 'Terrible' },
        { value: 'bad', emoji: '😞', label: 'Bad' },
        { value: 'neutral', emoji: '😐', label: 'Neutral' },
        { value: 'good', emoji: '😊', label: 'Good' },
        { value: 'amazing', emoji: '🤩', label: 'Amazing' }
      ],
      selected: getActivityValue('mood')
    }
  ];

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const extractTags = (text: string): string[] => {
    const words = text.toLowerCase().split(/\s+/);
    const commonTags = ['happy', 'sad', 'excited', 'work', 'family'];
    const activityTags = Array.from(selectedActivities);
    const foundTags = commonTags.filter(tag => words.some(word => word.includes(tag)));
    return [...new Set([...foundTags, ...activityTags])].slice(0, 5);
  };

  // Check if save should be disabled
  const isSaveDisabled = isRecording || isAnalyzing || isAnalyzingLocal || (!entryText.trim());

  const saveEntry = async () => {
    // Hard requirement: Must have actual text content (not just whitespace)
    if (!entryText.trim()) {
      Alert.alert('Text Required', 'Please add some text to your journal entry before saving.');
      return;
    }

    try {
      setIsSaving(true);
      setIsAnalyzingLocal(true);
      
      let aiAnalysis = null;
      if (entryText.trim() && analysisEnabled) {
        try {
          aiAnalysis = await AIAnalysisService.analyzeJournalEntry(entryText);
        } catch (analysisError) {
          console.error('AI analysis failed:', analysisError);
        }
      }
      
      setIsAnalyzingLocal(false);
      
      const newEntry: Entry = {
        id: Date.now().toString(),
        title: aiAnalysis?.title || (selectedPhoto ? 'Photo Memory' : `Entry ${new Date().toLocaleDateString()}`),
        text: entryText.trim(),
        date: new Date().toISOString(),
        tags: extractTags(entryText),
        transcribed: !!recordingUri,
        manualMood: selectedMood || undefined,
        photoUri: selectedPhoto || undefined,
        hasPhoto: !!selectedPhoto,
        activities: Array.from(selectedActivities), // Save selected activities
        
        ...(aiAnalysis && {
          mood: aiAnalysis.mood,
          emotions: aiAnalysis.emotions,
          themes: aiAnalysis.themes,
          insights: aiAnalysis.insights,
          aiAnalyzed: true,
        })
      };

      onEntryAdded(newEntry);
      
      // Clear form
      setEntryText('');
      setSelectedPhoto(null);
      setSelectedMood(null);
      setSelectedActivities(new Set());
      setRecordingUri(null);
      
      Alert.alert('✨ Entry Saved!', 'Your journal entry has been saved successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry.');
    } finally {
      setIsSaving(false);
      setIsAnalyzingLocal(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderActivityButton = (activity: string, iconName: string) => {
    const activityValue = getActivityValue(activity);
    const isSelected = activityValue !== null;
    
    const getIconName = () => {
      if (!activityValue) return `${iconName}-outline` as any;
      
      switch (activity) {
        case 'social':
          return activityValue === 'yes' ? 'people' : 'people-outline';
        case 'exercise':
          return activityValue === 'yes' ? 'fitness' : 'fitness-outline';
        case 'nature':
          return activityValue === 'yes' ? 'leaf' : 'leaf-outline';
        default:
          return iconName as any;
      }
    };

    return (
      <Pressable
        key={activity}
        style={[styles.activityButton, isSelected && styles.activityButtonSelected]}
        onPress={() => {
          console.log('Activity button pressed:', activity);
          setShowExtrasModal(true);
        }}
      >
        <Ionicons 
          name={getIconName()} 
          size={20} 
          color={isSelected ? "white" : "#1d1d1f"} 
        />
      </Pressable>
    );
  };

  const hasTranscription = entryText.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.date}>Today, {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
          <Text style={styles.title}>New Entry</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Microphone Button */}
          <View style={styles.microphoneContainer}>
            <Animated.View style={{ transform: [{ scale: micScale }] }}>
              <Pressable
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonRecording,
                  !hasAudioPermission && styles.micButtonDisabled
                ]}
                onPress={handleRecordPress}
                disabled={!hasAudioPermission || isTranscribing}
              >
                {isTranscribing ? (
                  <ActivityIndicator color="white" size="large" />
                ) : (
                  <Ionicons 
                    name={isRecording ? "stop" : "mic"} 
                    size={36} 
                    color="white" 
                  />
                )}
              </Pressable>
            </Animated.View>
            {isRecording && (
              <Text style={styles.recordingText}>
                Recording {formatDuration(recordingDuration)}
              </Text>
            )}
          </View>

          {/* Text Entry Button */}
          <Pressable
            style={[
              styles.textEntryButton, 
              entryText.trim() && styles.textEntryButtonWithText
            ]}
            onPress={() => setShowTextModal(true)}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            <View style={styles.textEntryContent}>
              {entryText.trim() ? (
                <>
                  <Text style={styles.textEntryPreview} numberOfLines={2}>
                    {entryText}
                  </Text>
                  <Text style={styles.textEntryEditHint}>Tap to edit</Text>
                </>
              ) : (
                <Text style={styles.textEntryLabel}>
                  Start writing your thoughts...
                </Text>
              )}
            </View>
          </Pressable>

          {/* Content Actions */}
          <View style={styles.contentActions}>
            <Pressable 
              style={[
                styles.actionButton, 
                selectedPhoto && styles.actionButtonSelected
              ]} 
              onPress={() => setShowPhotoModal(true)}
            >
              <Ionicons 
                name="camera-outline" 
                size={24} 
                color={selectedPhoto ? "white" : "#1d1d1f"} 
              />
            </Pressable>
            
            <Pressable 
              style={[
                styles.actionButton,
                selectedActivities.size > 0 && styles.actionButtonSelected
              ]} 
              onPress={() => setShowExtrasModal(true)}
            >
              <Ionicons 
                name="add-circle-outline" 
                size={24} 
                color={selectedActivities.size > 0 ? "white" : "#1d1d1f"} 
              />
            </Pressable>
            
            <Pressable style={styles.actionButton} onPress={() => setShowMusicModal(true)}>
              <Ionicons name="musical-notes-outline" size={24} color="#1d1d1f" />
            </Pressable>
          </View>

          {/* Upload Action */}
          <View style={styles.uploadActionContainer}>
            <Pressable 
              style={[
                styles.uploadButton,
                isUploadTranscribing && styles.uploadButtonSelected
              ]} 
              onPress={() => setShowUploadModal(true)}
              disabled={isUploadTranscribing}
            >
              {isUploadTranscribing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons 
                  name="cloud-upload-outline" 
                  size={20} 
                  color={isUploadTranscribing ? "white" : "#1d1d1f"} 
                />
              )}
            </Pressable>
          </View>

          {/* Save Button */}
          {entryText.trim() && (
            <Pressable 
              style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]} 
              onPress={saveEntry}
              disabled={isSaveDisabled}
            >
              {isSaving || isAnalyzingLocal ? (
                <View style={styles.savingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.saveButtonText}>
                    {isRecording ? 'Recording...' : (isAnalyzingLocal || isAnalyzing) ? 'Analyzing...' : 'Saving...'}
                  </Text>
                </View>
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Text Modal - FIXED SCROLLABLE BOTTOM SHEET */}
      <Modal
        visible={showTextModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTextModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.textModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.textModalContainer}>
            <View style={styles.bottomSheetHandle} />
            
            <View style={styles.textModalHeader}>
              <Pressable onPress={() => setShowTextModal(false)}>
                <Text style={styles.textModalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.textModalTitle}>Write your thoughts</Text>
              <Pressable onPress={() => setShowTextModal(false)}>
                <Text style={styles.textModalDone}>Done</Text>
              </Pressable>
            </View>
            
            <ScrollView 
              style={styles.textModalScrollView}
              contentContainerStyle={styles.textModalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={styles.textModalInput}
                value={entryText}
                onChangeText={setEntryText}
                placeholder="What's on your mind today?"
                placeholderTextColor="#86868b"
                multiline
                autoFocus
                textAlignVertical="top"
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <Pressable 
            style={styles.bottomSheetBackdrop} 
            onPress={() => setShowUploadModal(false)} 
          />
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHandle} />
            
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Import to Journal</Text>
            </View>
            
            <View style={styles.uploadContent}>
              <Pressable style={styles.uploadOption} onPress={selectVoiceMemo}>
                <View style={styles.uploadOptionMain}>
                  <View style={styles.bottomSheetOptionIcon}>
                    <Ionicons name="mic" size={24} color="#007AFF" />
                  </View>
                  <View style={styles.uploadOptionText}>
                    <Text style={styles.uploadOptionTitle}>Voice Memo</Text>
                    <Text style={styles.uploadOptionSubtitle}>Upload and transcribe audio</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#c6c6c8" />
              </Pressable>
              
              <View style={styles.uploadOption}>
                <View style={styles.uploadOptionMain}>
                  <View style={[styles.bottomSheetOptionIcon, styles.uploadOptionDisabled]}>
                    <Ionicons name="document-text" size={24} color="#86868b" />
                  </View>
                  <View style={styles.uploadOptionText}>
                    <Text style={[styles.uploadOptionTitle, styles.uploadOptionTitleDisabled]}>Notes</Text>
                    <Text style={styles.uploadOptionSubtitle}>Import from saved notes</Text>
                  </View>
                </View>
                <Text style={styles.comingSoonBadge}>Soon</Text>
              </View>
              
              <View style={styles.uploadOption}>
                <View style={styles.uploadOptionMain}>
                  <View style={[styles.bottomSheetOptionIcon, styles.uploadOptionDisabled]}>
                    <Ionicons name="camera" size={24} color="#86868b" />
                  </View>
                  <View style={styles.uploadOptionText}>
                    <Text style={[styles.uploadOptionTitle, styles.uploadOptionTitleDisabled]}>Journal Photos</Text>
                    <Text style={styles.uploadOptionSubtitle}>Scan handwritten entries</Text>
                  </View>
                </View>
                <Text style={styles.comingSoonBadge}>Soon</Text>
              </View>
            </View>
            
            <View style={styles.bottomSheetPadding} />
          </View>
        </View>
      </Modal>

      {/* Extras Modal */}
      <Modal
        visible={showExtrasModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExtrasModal(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <Pressable 
            style={styles.bottomSheetBackdrop} 
            onPress={() => setShowExtrasModal(false)} 
          />
          <View style={styles.extrasModalContainer}>
            <View style={styles.bottomSheetHandle} />
            
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Track Activities</Text>
            </View>
            
            <ScrollView style={styles.extrasScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.extrasContent}>
                {getExtrasData().map((item) => (
                  <View key={item.id} style={styles.extrasRow}>
                    <Text style={styles.extrasTitle}>{item.title}</Text>
                    <View style={styles.extrasOptions}>
                      {item.options.map((option) => (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.extrasOptionButton,
                            item.selected === option.value && styles.extrasOptionButtonSelected
                          ]}
                          onPress={() => toggleActivity(item.id, option.value)}
                        >
                          <Text style={styles.extrasOptionEmoji}>{option.emoji}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.bottomSheetPadding} />
          </View>
        </View>
      </Modal>

      {/* Photo Modal */}
      <Modal
        visible={showPhotoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <Pressable 
            style={styles.bottomSheetBackdrop} 
            onPress={() => setShowPhotoModal(false)} 
          />
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHandle} />
            
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Add Photo</Text>
            </View>
            
            <View style={styles.bottomSheetContent}>
              <Pressable style={styles.bottomSheetOption} onPress={takePhoto}>
                <View style={styles.bottomSheetOptionIcon}>
                  <Ionicons name="camera" size={24} color="#007AFF" />
                </View>
                <Text style={styles.bottomSheetOptionText}>Take Photo</Text>
              </Pressable>
              
              <Pressable style={styles.bottomSheetOption} onPress={selectPhotoFromLibrary}>
                <View style={styles.bottomSheetOptionIcon}>
                  <Ionicons name="images" size={24} color="#007AFF" />
                </View>
                <Text style={styles.bottomSheetOptionText}>Choose from Library</Text>
              </Pressable>
            </View>
            
            {selectedPhoto && (
              <View style={styles.selectedPhotoPreview}>
                <Text style={styles.selectedPhotoLabel}>Selected Photo</Text>
                <View style={styles.selectedPhotoWrapper}>
                  <Image source={{ uri: selectedPhoto }} style={styles.selectedPhotoCompact} />
                  <Pressable 
                    style={styles.removePhotoButtonCompact}
                    onPress={() => setSelectedPhoto(null)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                  </Pressable>
                </View>
              </View>
            )}
            
            <View style={styles.bottomSheetPadding} />
          </View>
        </View>
      </Modal>

      {/* Music Modal */}
      <Modal
        visible={showMusicModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowMusicModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Tag a Song</Text>
            <View style={styles.modalSpacer} />
          </View>
          <Text style={styles.comingSoon}>Music tagging coming soon!</Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  date: {
    fontSize: 15,
    color: '#86868b',
    fontWeight: '400',
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1d1d1f',
    letterSpacing: -0.41,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  microphoneContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  micButtonRecording: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  micButtonDisabled: {
    backgroundColor: '#86868b',
    shadowColor: '#86868b',
  },
  recordingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  textEntryButton: {
    width: '100%',
    maxWidth: 327,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 32,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  textEntryButtonWithText: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  textEntryContent: {
    flex: 1,
  },
  textEntryLabel: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  textEntryPreview: {
    fontSize: 16,
    color: '#1d1d1f',
    lineHeight: 22,
    marginBottom: 4,
  },
  textEntryEditHint: {
    fontSize: 13,
    color: '#86868b',
    fontWeight: '500',
  },
  
  // Text Modal Styles - FIXED FOR SCROLLING
  textModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  textModalContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 60,
  },
  textModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  textModalCancel: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  textModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
    letterSpacing: -0.2,
  },
  textModalDone: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  textModalScrollView: {
    flex: 1,
  },
  textModalScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  textModalInput: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1d1d1f',
    lineHeight: 24,
    minHeight: 200,
  },
  contentActions: {
    flexDirection: 'row',
    gap: 48,
    marginBottom: 20,
    justifyContent: 'center',
  },
  uploadActionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  uploadButtonSelected: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  actionButtonSelected: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  activityActions: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 32,
  },
  activityButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  activityButtonSelected: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  saveButton: {
    width: '100%',
    maxWidth: 327,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: '#86868b',
    shadowColor: '#86868b',
    opacity: 0.6,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c6c6c8',
  },
  modalCancel: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  modalSpacer: {
    width: 50,
  },
  
  // Reusable Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bottomSheetBackdrop: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: '#fafafa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: '50%',
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#c6c6c8',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetHeader: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  bottomSheetContent: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
  },
  bottomSheetOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  bottomSheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    textAlign: 'center',
  },
  bottomSheetPadding: {
    height: 32,
  },
  
  // Extras Modal Styles
  extrasModalContainer: {
    backgroundColor: '#fafafa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: '50%',
  },
  extrasScrollView: {
    maxHeight: 280,
  },
  extrasContent: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  extrasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  extrasTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    flex: 1,
  },
  extrasOptions: {
    flexDirection: 'row',
    gap: 7,
  },
  extrasOptionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  extrasOptionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  extrasOptionEmoji: {
    fontSize: 16,
    lineHeight: 18,
  },
  
  // Upload Modal Styles
  uploadContent: {
    paddingHorizontal: 24,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  uploadOptionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uploadOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  uploadOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  uploadOptionTitleDisabled: {
    color: '#86868b',
  },
  uploadOptionSubtitle: {
    fontSize: 13,
    color: '#86868b',
    lineHeight: 16,
  },
  uploadOptionDisabled: {
    backgroundColor: 'rgba(134, 134, 139, 0.1)',
  },
  comingSoonBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#86868b',
    backgroundColor: 'rgba(134, 134, 139, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectedPhotoPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  selectedPhotoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectedPhotoWrapper: {
    position: 'relative',
    alignSelf: 'center',
  },
  selectedPhotoCompact: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  removePhotoButtonCompact: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  comingSoon: {
    textAlign: 'center',
    fontSize: 18,
    color: '#86868b',
    marginTop: 100,
  },
});