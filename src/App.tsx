import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import JournalScreen from './screens/JournalScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import { JournalProvider } from './context/JournalContext';
import { theme } from './constants/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <JournalProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: theme.colors.textMuted,
              tabBarStyle: { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }
            })}
          >
            <Tab.Screen 
              name="Journal" 
              component={JournalScreen}
              options={{ tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" size={size} color={color} /> }}
            />
            <Tab.Screen 
              name="History" 
              component={HistoryScreen}
              options={{ tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" size={size} color={color} /> }}
            />
            <Tab.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </JournalProvider>
    </SafeAreaProvider>
  );
}
