// ===========================================
// REACT NATIVE APP ENTRY POINT
// Native Mobile Application Root
// ===========================================

import React, { useEffect, useState } from 'react';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  StatusBar,
  Alert,
  AppState,
  AppStateStatus,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { enableScreens } from 'react-native-screens';
import 'react-native-gesture-handler';

// Services
import { MobileAuthService } from './services/MobileAuthService';
import { OfflineSyncService } from './services/OfflineSyncService';
import { PushNotificationService } from './services/PushNotificationService';
import { BiometricService } from './services/BiometricService';
import { MobileAnalyticsService } from './services/MobileAnalyticsService';

// Screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/auth/LoginScreen';
import BiometricSetupScreen from './screens/auth/BiometricSetupScreen';
import HomeScreen from './screens/HomeScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import LegalResearchScreen from './screens/LegalResearchScreen';
import ComplianceScreen from './screens/ComplianceScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import OfflineScreen from './screens/OfflineScreen';

// Components
import LoadingOverlay from './components/LoadingOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatusBanner from './components/NetworkStatusBanner';

// Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  BiometricSetup: undefined;
  Main: undefined;
  Offline: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Documents: undefined;
  Research: undefined;
  Compliance: undefined;
  Profile: undefined;
};

// Enable optimizations
enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ===========================================
// MAIN TAB NAVIGATOR
// ===========================================

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="home" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="documents" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Research"
        component={LegalResearchScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="search" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Compliance"
        component={ComplianceScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="shield" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="profile" focused={focused} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ===========================================
// TAB ICON COMPONENT
// ===========================================

interface TabIconProps {
  name: string;
  focused: boolean;
  color: string;
  size: number;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused, color, size }) => {
  // In a real app, you'd use react-native-vector-icons or similar
  const getIcon = () => {
    switch (name) {
      case 'home': return focused ? '🏠' : '🏠';
      case 'documents': return focused ? '📄' : '📄';
      case 'search': return focused ? '🔍' : '🔍';
      case 'shield': return focused ? '🛡️' : '🛡️';
      case 'profile': return focused ? '👤' : '👤';
      default: return '•';
    }
  };

  return (
    <Text style={{ color, fontSize: size }}>
      {getIcon()}
    </Text>
  );
};

// ===========================================
// MAIN APP COMPONENT
// ===========================================

interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricEnabled: boolean;
  isOnline: boolean;
  appState: AppStateStatus;
  hasInitialized: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isLoading: true,
    isAuthenticated: false,
    biometricEnabled: false,
    isOnline: true,
    appState: AppState.currentState,
    hasInitialized: false,
  });

  // ===========================================
  // INITIALIZATION
  // ===========================================

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('📱 Initializing mobile application...');

      // Initialize core services
      await Promise.all([
        MobileAuthService.initialize(),
        OfflineSyncService.initialize(),
        PushNotificationService.initialize(),
        BiometricService.initialize(),
        MobileAnalyticsService.initialize(),
      ]);

      // Check authentication status
      const isAuthenticated = await MobileAuthService.isAuthenticated();
      const biometricEnabled = await BiometricService.isBiometricEnabled();

      // Setup network monitoring
      setupNetworkMonitoring();

      // Setup app state monitoring
      setupAppStateMonitoring();

      // Setup deep linking
      setupDeepLinking();

      setState(prev => ({
        ...prev,
        isAuthenticated,
        biometricEnabled,
        hasInitialized: true,
        isLoading: false,
      }));

      console.log('✅ Mobile application initialized successfully');

      // Track app launch
      MobileAnalyticsService.trackEvent('app_launch', {
        platform: Platform.OS,
        version: Platform.Version,
        authenticated: isAuthenticated,
        biometric_enabled: biometricEnabled,
      });

    } catch (error) {
      console.error('Failed to initialize mobile app:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));

      Alert.alert(
        'Initialization Error',
        'Failed to initialize the application. Please restart the app.',
        [{ text: 'OK' }]
      );
    }
  };

  // ===========================================
  // NETWORK MONITORING
  // ===========================================

  const setupNetworkMonitoring = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected && state.isInternetReachable;
      
      setState(prev => ({
        ...prev,
        isOnline: isOnline ?? false,
      }));

      if (isOnline) {
        // Trigger sync when coming online
        OfflineSyncService.syncPendingChanges();
        MobileAnalyticsService.trackEvent('network_online');
      } else {
        MobileAnalyticsService.trackEvent('network_offline');
      }
    });

    return unsubscribe;
  };

  // ===========================================
  // APP STATE MONITORING
  // ===========================================

  const setupAppStateMonitoring = () => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (state.appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        handleAppForeground();
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        handleAppBackground();
      }

      setState(prev => ({
        ...prev,
        appState: nextAppState,
      }));
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return subscription;
  };

  const handleAppForeground = async () => {
    console.log('📱 App came to foreground');

    // Check if biometric authentication is required
    if (state.biometricEnabled && state.isAuthenticated) {
      const shouldAuthenticate = await BiometricService.shouldRequireAuthentication();
      if (shouldAuthenticate) {
        const success = await BiometricService.authenticate();
        if (!success) {
          // Logout user if biometric authentication fails
          await MobileAuthService.logout();
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
          }));
        }
      }
    }

    // Sync data when app becomes active
    if (state.isOnline) {
      OfflineSyncService.syncPendingChanges();
    }

    MobileAnalyticsService.trackEvent('app_foreground');
  };

  const handleAppBackground = () => {
    console.log('📱 App went to background');
    
    // Save current state
    OfflineSyncService.saveCurrentState();
    
    // Record background timestamp for biometric timeout
    BiometricService.recordBackgroundTime();

    MobileAnalyticsService.trackEvent('app_background');
  };

  // ===========================================
  // DEEP LINKING
  // ===========================================

  const setupDeepLinking = () => {
    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return subscription;
  };

  const handleDeepLink = (url: string) => {
    console.log('🔗 Deep link received:', url);
    
    try {
      const parsed = new URL(url);
      const path = parsed.pathname;
      const params = Object.fromEntries(parsed.searchParams);

      MobileAnalyticsService.trackEvent('deep_link_opened', {
        path,
        params,
      });

      // Handle different deep link paths
      switch (path) {
        case '/document':
          if (params.id) {
            // Navigate to specific document
            // navigation.navigate('Documents', { documentId: params.id });
          }
          break;
        case '/research':
          // Navigate to research screen
          // navigation.navigate('Research');
          break;
        default:
          console.log('Unknown deep link path:', path);
      }
    } catch (error) {
      console.error('Failed to parse deep link:', error);
    }
  };

  // ===========================================
  // AUTHENTICATION HANDLERS
  // ===========================================

  const handleLoginSuccess = async () => {
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
    }));

    // Check if biometric authentication should be enabled
    const biometricAvailable = await BiometricService.isAvailable();
    if (biometricAvailable && !state.biometricEnabled) {
      // Navigate to biometric setup
      // This would be handled by navigation
    }

    MobileAnalyticsService.trackEvent('login_success');
  };

  const handleLogout = async () => {
    await MobileAuthService.logout();
    await OfflineSyncService.clearLocalData();
    
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
    }));

    MobileAnalyticsService.trackEvent('logout');
  };

  // ===========================================
  // RENDER METHODS
  // ===========================================

  const renderNavigator = () => {
    if (state.isLoading || !state.hasInitialized) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      );
    }

    if (!state.isOnline && !OfflineSyncService.hasOfflineData()) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Offline" component={OfflineScreen} />
        </Stack.Navigator>
      );
    }

    if (!state.isAuthenticated) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="Auth" 
            component={LoginScreen}
            initialParams={{ onLoginSuccess: handleLoginSuccess }}
          />
          <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
        </Stack.Navigator>
      );
    }

    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    );
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={false}
        />
        
        <NavigationContainer>
          {renderNavigator()}
        </NavigationContainer>

        {/* Network Status Banner */}
        <NetworkStatusBanner isOnline={state.isOnline} />

        {/* Loading Overlay */}
        {state.isLoading && <LoadingOverlay />}
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;