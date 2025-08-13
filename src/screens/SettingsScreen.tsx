import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsScreenProps {
  // These would be passed from parent component
  appState?: {
    analysisEnabled: boolean;
    showDummyData: boolean;
    swipeGesturesEnabled: boolean;
  };
  onToggleAnalysis?: () => void;
  onToggleDummyData?: () => void;
  onToggleSwipeGestures?: () => void;
}

const SettingsScreen = ({ 
  appState = {
    analysisEnabled: true,
    showDummyData: false,
    swipeGesturesEnabled: true,
  },
  onToggleAnalysis,
  onToggleDummyData,
  onToggleSwipeGestures,
}: SettingsScreenProps) => {
  const navigation = useNavigation();
  const [localSettings, setLocalSettings] = useState({
    notifications: true,
    backupEnabled: false,
    darkMode: false,
    analytics: true,
  });

  const handleToggle = (setting: keyof typeof localSettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
    // Save to AsyncStorage
    saveSettingToStorage(setting, !localSettings[setting]);
  };

  const saveSettingToStorage = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(`@setting_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Journal Data',
      'Export your journal entries as a JSON file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: async () => {
            try {
              const entries = await AsyncStorage.getItem('@journal_entries');
              if (entries) {
                await Share.share({
                  message: entries,
                  title: 'Journal Export',
                });
              } else {
                Alert.alert('No Data', 'No journal entries found to export.');
              }
            } catch (error) {
              Alert.alert('Export Failed', 'Unable to export data.');
            }
          }
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your journal entries and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                '@journal_entries',
                '@app_state',
                '@setting_notifications',
                '@setting_backupEnabled',
                '@setting_darkMode',
                '@setting_analytics',
              ]);
              Alert.alert('Success', 'All data has been cleared.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          }
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://yourapp.com/privacy-policy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://yourapp.com/terms-of-service');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@yourapp.com?subject=Journal App Support');
  };

  const SettingSection = ({ 
    title, 
    children 
  }: { 
    title: string; 
    children: React.ReactNode; 
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onPress, 
    showSwitch = false,
    switchValue = false,
    onSwitchChange,
    rightElement,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={onPress}
      disabled={showSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={20} color="#667eea" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {showSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#E5E5EA', true: '#667eea' }}
            thumbColor="#FFFFFF"
            style={styles.switch}
          />
        ) : rightElement ? (
          rightElement
        ) : value ? (
          <Text style={styles.settingValue}>{value}</Text>
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#667eea" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.profileSection}
        >
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={32} color="white" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Journal User</Text>
            <Text style={styles.profileSubtitle}>Personal Growth Journey</Text>
          </View>
        </LinearGradient>

        {/* AI & Analysis Settings */}
        <SettingSection title="AI & Analysis">
          <SettingRow
            icon="sparkles"
            title="AI Analysis"
            subtitle="Automatically analyze entries with AI insights"
            showSwitch
            switchValue={appState.analysisEnabled}
            onSwitchChange={onToggleAnalysis}
          />
          <SettingRow
            icon="eye"
            title="Demo Data"
            subtitle="Show example data for exploration"
            showSwitch
            switchValue={appState.showDummyData}
            onSwitchChange={onToggleDummyData}
          />
          <SettingRow
            icon="analytics"
            title="Usage Analytics"
            subtitle="Help improve the app with anonymous usage data"
            showSwitch
            switchValue={localSettings.analytics}
            onSwitchChange={() => handleToggle('analytics')}
          />
        </SettingSection>

        {/* Interface Settings */}
        <SettingSection title="Interface">
          <SettingRow
            icon="hand-left"
            title="Swipe Gestures"
            subtitle="Navigate between views with swipe gestures"
            showSwitch
            switchValue={appState.swipeGesturesEnabled}
            onSwitchChange={onToggleSwipeGestures}
          />
          <SettingRow
            icon="moon"
            title="Dark Mode"
            subtitle="Use dark theme throughout the app"
            showSwitch
            switchValue={localSettings.darkMode}
            onSwitchChange={() => handleToggle('darkMode')}
          />
          <SettingRow
            icon="notifications"
            title="Notifications"
            subtitle="Daily reminders to journal"
            showSwitch
            switchValue={localSettings.notifications}
            onSwitchChange={() => handleToggle('notifications')}
          />
        </SettingSection>

        {/* Data & Privacy */}
        <SettingSection title="Data & Privacy">
          <SettingRow
            icon="cloud-upload"
            title="Backup & Sync"
            subtitle="Securely backup your journal entries"
            showSwitch
            switchValue={localSettings.backupEnabled}
            onSwitchChange={() => handleToggle('backupEnabled')}
          />
          <SettingRow
            icon="download"
            title="Export Data"
            subtitle="Download your journal entries"
            onPress={handleExportData}
          />
          <SettingRow
            icon="trash"
            title="Clear All Data"
            subtitle="Permanently delete all entries and settings"
            onPress={handleClearData}
            rightElement={
              <Ionicons name="warning" size={20} color="#FF3B30" />
            }
          />
        </SettingSection>

        {/* About & Support */}
        <SettingSection title="About & Support">
          <SettingRow
            icon="help-circle"
            title="Help & FAQ"
            subtitle="Get answers to common questions"
            onPress={() => Alert.alert('Help', 'Help documentation coming soon!')}
          />
          <SettingRow
            icon="mail"
            title="Contact Support"
            subtitle="Get help with issues or feedback"
            onPress={handleContactSupport}
          />
          <SettingRow
            icon="star"
            title="Rate the App"
            subtitle="Share your experience on the App Store"
            onPress={() => Alert.alert('Rate App', 'App Store rating coming soon!')}
          />
          <SettingRow
            icon="share"
            title="Share with Friends"
            subtitle="Tell others about this journaling app"
            onPress={() => Share.share({
              message: 'Check out this amazing journaling app with AI insights!',
              title: 'AI Journal App',
            })}
          />
        </SettingSection>

        {/* Legal */}
        <SettingSection title="Legal">
          <SettingRow
            icon="shield-checkmark"
            title="Privacy Policy"
            subtitle="How we protect and use your data"
            onPress={openPrivacyPolicy}
          />
          <SettingRow
            icon="document-text"
            title="Terms of Service"
            subtitle="App usage terms and conditions"
            onPress={openTermsOfService}
          />
        </SettingSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>AI Journal App</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoCopyright}>© 2024 Your Company</Text>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Offset for back button
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#86868b',
    lineHeight: 18,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingValue: {
    fontSize: 15,
    color: '#86868b',
    marginRight: 8,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 20,
  },
  appInfoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#86868b',
    marginBottom: 8,
  },
  appInfoCopyright: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  bottomPadding: {
    height: 40,
  },
});

export default SettingsScreen;