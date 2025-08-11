import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

// Import screens
import JournalScreen from './src/screens/JournalScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';

// Import types
import { Entry } from './src/types/journal';

// Constants
const ENTRIES_FILE = `${FileSystem.documentDirectory}journal_entries.json`;
const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

const Tab = createBottomTabNavigator();

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await createPhotosDirectory();
    await loadEntries();
  };

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

  // Storage functions
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

  const handleEntryAdded = async (newEntry: Entry) => {
    try {
      // Update state immediately for UI responsiveness
      setEntries(prevEntries => [newEntry, ...prevEntries]);
      
      // Save to storage in background
      const updatedEntries = [newEntry, ...entries];
      await saveEntries(updatedEntries);
    } catch (error) {
      // Revert state if save failed
      setEntries(prevEntries => prevEntries.filter(e => e.id !== newEntry.id));
      Alert.alert('Error', 'Failed to save entry.');
    }
  };

  const handleDeleteEntry = async (id: string) => {
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

  const handleRefresh = React.useCallback(async () => {
    if (refreshing) return; // Prevent multiple concurrent refreshes
    
    try {
      setRefreshing(true);
      // Simple reload without complex timing
      await loadEntries();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      // Ensure we always clear the refreshing state
      setTimeout(() => setRefreshing(false), 100);
    }
  }, [refreshing]);

  const handleBulkEntriesAdded = async (newEntries: Entry[]) => {
    try {
      const updatedEntries = [...newEntries, ...entries];
      await saveEntries(updatedEntries);
      setEntries(updatedEntries);
    } catch (error) {
      Alert.alert('Error', 'Failed to save entries.');
    }
  };

  const handleRemoveDummyData = async () => {
    try {
      const filteredEntries = entries.filter(entry => !entry.tags.includes('dummy'));
      await saveEntries(filteredEntries);
      setEntries(filteredEntries);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove dummy data');
    }
  };

  // Get tab bar badge count for new entries (optional feature)
  const getUnreadCount = () => {
    const today = new Date().toDateString();
    return entries.filter(entry => 
      new Date(entry.date).toDateString() === today
    ).length;
  };

  if (isLoading) {
    return null; // You could add a loading screen here
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Journal"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'History') {
                iconName = focused ? 'library' : 'library-outline';
              } else if (route.name === 'Journal') {
                iconName = focused ? 'create' : 'create-outline';
              } else if (route.name === 'Analytics') {
                iconName = focused ? 'analytics' : 'analytics-outline';
              } else {
                iconName = 'circle';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4A90E2',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#E1E1E1',
              paddingBottom: 25, // Increased from 5 to 25
              paddingTop: 10,    // Increased from 5 to 10
              height: 90,        // Increased from 60 to 90
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
            headerShown: false,
          })}
        >
          <Tab.Screen 
            name="History" 
            options={{
              tabBarLabel: 'History',
            }}
          >
            {() => (
              <HistoryScreen 
                entries={entries}
                onRefresh={handleRefresh}
                onDeleteEntry={handleDeleteEntry}
                refreshing={refreshing}
              />
            )}
          </Tab.Screen>
          
          <Tab.Screen 
            name="Journal" 
            options={{
              tabBarLabel: 'Create',
            }}
          >
            {() => (
              <JournalScreen 
                onEntryAdded={handleEntryAdded} 
                onBulkEntriesAdded={handleBulkEntriesAdded}
                onRemoveDummyData={handleRemoveDummyData} 
              />
            )}
          </Tab.Screen>
          
          <Tab.Screen 
            name="Analytics" 
            options={{
              tabBarLabel: 'Analytics',
            }}
          >
            {() => <AnalyticsScreen entries={entries} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}