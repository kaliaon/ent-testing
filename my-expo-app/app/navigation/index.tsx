import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';

// Import screens (we'll create these next)
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TestListScreen from '../screens/TestListScreen';
import TestScreen from '../screens/TestScreen';
import TestResultScreen from '../screens/TestResultScreen';
import AIHelperScreen from '../screens/AIHelperScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ExamSimulationScreen from '../screens/ExamSimulationScreen';

// Import icons
import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

// Define the types for our navigation
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TestStackParamList = {
  TestList: undefined;
  Test: { testId: number };
  TestResult: { testId: number; score: number; answers: number[] };
  ExamSimulation: undefined;
};

export type MainTabParamList = {
  Tests: undefined;
  AIHelper: undefined;
  Profile: undefined;
};

// Create the navigators
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const TestStack = createNativeStackNavigator<TestStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Test Stack Navigator
const TestNavigator = () => {
  return (
    <TestStack.Navigator>
      <TestStack.Screen 
        name="TestList" 
        component={TestListScreen}
        options={{ title: 'Тесттер' }}
      />
      <TestStack.Screen 
        name="Test" 
        component={TestScreen}
        options={{ title: 'Тест тапсыру' }}
      />
      <TestStack.Screen 
        name="TestResult" 
        component={TestResultScreen}
        options={{ title: 'Тест нәтижелері' }}
      />
      <TestStack.Screen 
        name="ExamSimulation" 
        component={ExamSimulationScreen}
        options={{ title: 'Имитациялық емтихан' }}
      />
    </TestStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          height: 60 + (Platform.OS === 'ios' ? Math.max(0, insets.bottom) : 0),
          paddingTop: 6,
          paddingBottom: Math.max(6, insets.bottom),
          backgroundColor: 'white',
          borderTopColor: '#e2e8f0',
          position: 'absolute',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        headerShown: false
      }}
    >
      <MainTab.Screen 
        name="Tests" 
        component={TestNavigator}
        options={{
          tabBarLabel: ({ color }) => (
            <Text className="text-xs" style={{ color }}>Тесттер</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="assignment" size={size} color={color} />
          )
        }}
      />
      <MainTab.Screen 
        name="AIHelper" 
        component={AIHelperScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text className="text-xs" style={{ color }}>AI Көмекші</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="psychology" size={size} color={color} />
          )
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text className="text-xs" style={{ color }}>Профиль</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          )
        }}
      />
    </MainTab.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-700">Жүктелуде...</Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator; 