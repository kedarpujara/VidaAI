import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Animated, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

// Import components
import DailyView from '../components/DailyView';
import WeeklyView from '../components/WeeklyView';
import MonthlyView from '../components/MonthlyView';

// Import types and styles
import { UnifiedHistoryScreenProps } from '../types/history';
import { historyStyles } from '../styles/historyStyles';

const UnifiedHistoryScreen: React.FC<UnifiedHistoryScreenProps> = ({ 
  entries, 
  showDummyData, 
  onToggleDummyData 
}) => {
  const navigation = useNavigation();
  const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const panRef = useRef();

  const handleViewChange = (view: 'daily' | 'weekly' | 'monthly') => {
    if (view === currentView) return;
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentView(view);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSwipeGesture = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      const views = ['daily', 'weekly', 'monthly'];
      const currentIndex = views.indexOf(currentView);
      
      if (translationX > 100 && currentIndex > 0) {
        handleViewChange(views[currentIndex - 1] as any);
      } else if (translationX < -100 && currentIndex < views.length - 1) {
        handleViewChange(views[currentIndex + 1] as any);
      }
    }
  };

  const navigateToDayDetail = (day: any) => {
    navigation.navigate('DayDetail', { day } as never);
  };

  const handleToggleDummyData = () => {
    Alert.alert(
      showDummyData ? 'Hide Demo Data' : 'Show Demo Data',
      showDummyData 
        ? 'This will hide the demo data and show your real journal entries.'
        : 'This will show demo data with AI analysis examples.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: showDummyData ? 'Hide Demo' : 'Show Demo', 
          onPress: onToggleDummyData,
        },
      ]
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'daily':
        return <DailyView entries={entries} showDummyData={showDummyData} onNavigateToDay={navigateToDayDetail} />;
      case 'weekly':
        return <WeeklyView entries={entries} showDummyData={showDummyData} />;
      case 'monthly':
        return <MonthlyView entries={entries} showDummyData={showDummyData} />;
      default:
        return <DailyView entries={entries} showDummyData={showDummyData} onNavigateToDay={navigateToDayDetail} />;
    }
  };

  return (
    <SafeAreaView style={historyStyles.container}>
      <View style={historyStyles.header}>
        <View style={historyStyles.headerTop}>
          <Text style={historyStyles.headerTitle}>History</Text>
          <View style={historyStyles.headerButtons}>
            <TouchableOpacity style={historyStyles.statsButton} onPress={handleToggleDummyData}>
              <Ionicons 
                name={showDummyData ? "eye-off" : "eye"} 
                size={20} 
                color="#667eea" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={historyStyles.settingsButton} 
              onPress={() => navigation.navigate('Settings' as never)}
            >
              <Ionicons name="settings-outline" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={historyStyles.viewToggle}>
          <TouchableOpacity
            style={[historyStyles.toggleButton, currentView === 'daily' && historyStyles.toggleButtonActive]}
            onPress={() => handleViewChange('daily')}
          >
            <Text style={[historyStyles.toggleText, currentView === 'daily' && historyStyles.toggleTextActive]}>
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[historyStyles.toggleButton, currentView === 'weekly' && historyStyles.toggleButtonActive]}
            onPress={() => handleViewChange('weekly')}
          >
            <Text style={[historyStyles.toggleText, currentView === 'weekly' && historyStyles.toggleTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[historyStyles.toggleButton, currentView === 'monthly' && historyStyles.toggleButtonActive]}
            onPress={() => handleViewChange('monthly')}
          >
            <Text style={[historyStyles.toggleText, currentView === 'monthly' && historyStyles.toggleTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <PanGestureHandler
        ref={panRef}
        onGestureEvent={handleSwipeGesture}
        enabled={true}
      >
        <Animated.View style={[historyStyles.contentContainer, { opacity: fadeAnim }]}>
          {showDummyData && (
            <View style={historyStyles.dummyDataIndicator}>
              <Ionicons name="information-circle" size={16} color="#667eea" />
              <Text style={historyStyles.dummyDataText}>
                Showing AI-enhanced demo data
              </Text>
            </View>
          )}
          {renderCurrentView()}
        </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
};

export default UnifiedHistoryScreen;