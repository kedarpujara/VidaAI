import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJournal } from '../context/JournalContext';
import Button from '../components/Button';
import { theme } from '../constants/theme';

export default function SettingsScreen() {
  const { entries, clearAllData } = useJournal();

  const handleClearData = () => {
    Alert.alert('Clear All Data', `This will permanently delete all ${entries.length} journal entries and cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Everything', style: 'destructive', onPress: async () => { await clearAllData(); Alert.alert('Data Cleared', 'All your data has been permanently deleted.'); } }
    ]);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Vida Journal keeps all your data encrypted and stored only on your device. We never access, store, or share your personal journal entries.', [{ text: 'OK' }]);
  };

  const handleSupport = () => {
    Alert.alert('Support & Feedback', 'Thank you for using Vida Journal! For support or feedback, please email us.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send Email', onPress: () => Linking.openURL('mailto:support@vida-journal.com?subject=Vida Journal Support') }
    ]);
  };

  const SettingItem = ({ icon, title, subtitle, onPress, variant = 'default' }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    variant?: 'default' | 'danger';
  }) => (
    <Button title="" variant="ghost" onPress={onPress} style={[styles.settingItem, variant === 'danger' && styles.dangerItem]}>
      <View style={styles.settingContent}>
        <View style={styles.settingLeft}>
          <Ionicons name={icon} size={24} color={variant === 'danger' ? theme.colors.danger : theme.colors.primary} />
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, variant === 'danger' && styles.dangerText]}>{title}</Text>
            {subtitle && (<Text style={styles.settingSubtitle}>{subtitle}</Text>)}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </View>
    </Button>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your journal and privacy</Text>
        </View>

        <View className="section" style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <Text style={styles.appName}>Vida Journal</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.description}>Your private, secure journaling companion. All entries are encrypted and stored only on your device.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <View style={styles.statsCard}>
            <View style={styles.stat}><Text style={styles.statNumber}>{entries.length}</Text><Text style={styles.statLabel}>Entries</Text></View>
            <View style={styles.stat}><Text style={styles.statNumber}>100%</Text><Text style={styles.statLabel}>Encrypted</Text></View>
            <View style={styles.stat}><Text style={styles.statNumber}>0</Text><Text style={styles.statLabel}>Cloud Synced</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem icon="shield-checkmark" title="Privacy Policy" subtitle="How we protect your data" onPress={handlePrivacyPolicy} />
          <SettingItem icon="help-circle" title="Support" subtitle="Get help or send feedback" onPress={handleSupport} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <SettingItem icon="trash" title="Clear All Data" subtitle={`Delete all ${entries.length} entries permanently`} onPress={handleClearData} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1, paddingHorizontal: theme.spacing.md },
  header: { paddingTop: theme.spacing.md, paddingBottom: theme.spacing.lg },
  title: { ...theme.typography.h1, color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
  section: { marginBottom: theme.spacing.xl },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
  dangerTitle: { color: theme.colors.danger },
  infoCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border },
  appName: { ...theme.typography.h2, color: theme.colors.text, marginBottom: theme.spacing.xs },
  version: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  description: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 22 },
  statsCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNumber: { ...theme.typography.h2, color: theme.colors.primary, marginBottom: theme.spacing.xs },
  statLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  settingItem: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  dangerItem: { borderColor: theme.colors.danger + '40', backgroundColor: theme.colors.danger + '05' },
  settingContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.md, width: '100%' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: theme.spacing.md, flex: 1 },
  settingTitle: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
  settingSubtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  dangerText: { color: theme.colors.danger },
});
