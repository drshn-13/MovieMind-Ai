import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Film, Search, Sparkles, Heart, User } from 'lucide-react-native';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MovieSearchScreen } from '../screens/MovieSearchScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { MovieDetailsScreen } from '../screens/MovieDetailsScreen';
import { AISummaryScreen } from '../screens/AISummaryScreen';
import { AIAudioSummaryScreen } from '../screens/AIAudioSummaryScreen';
import { RecommendationsScreen } from '../screens/RecommendationsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

// Types
import { Movie, AISummary } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  MovieDetails: { movieId?: number; movie?: Movie };
  AISummary: { movie: Movie; length?: string; isSpoilerFree?: boolean };
  AIAudioSummary: { movie: Movie; summary?: AISummary };
  SearchResults: { query: string; initialResults?: Movie[] };
  Recommendations: { seedMovie?: Movie };
  History: undefined;
  Login: undefined;
  Register: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  RecommendationsTab: undefined;
  WatchlistTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0c1220',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => <Film color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={MovieSearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="RecommendationsTab"
        component={RecommendationsScreen}
        options={{
          tabBarLabel: 'AI Match',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="WatchlistTab"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Watchlist',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#090d16' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="MovieDetails" component={MovieDetailsScreen} />
      <Stack.Screen name="AISummary" component={AISummaryScreen} />
      <Stack.Screen name="AIAudioSummary" component={AIAudioSummaryScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};
