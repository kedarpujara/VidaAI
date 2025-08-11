import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: String(error?.message || error) };
  }

  componentDidCatch(error: any, info: any) {
    console.warn('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.text}>{this.state.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  title: { ...theme.typography.h2, color: theme.colors.danger, marginBottom: theme.spacing.sm },
  text: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center' }
});
