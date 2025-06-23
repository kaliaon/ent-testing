import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TestStackParamList } from '../navigation';
import { getTests, Test, debugTestResultsStorage } from '../services/testService';
import { USER_STORAGE_KEY, DEBUG_AUTH_TOKEN } from '../services/storageConstants';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';

// Add a constant for development mode - change to false for production builds
const IS_DEV_MODE = true;

type TestListScreenNavigationProp = NativeStackNavigationProp<TestStackParamList, 'TestList'>;

const TestListScreen = () => {
  const navigation = useNavigation<TestListScreenNavigationProp>();
  const { user, updateUserToken } = useAuth();
  
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTests();
  }, []);
  
  const loadTests = async () => {
    try {
      setLoading(true);
      const testsData = await getTests();
      setTests(testsData);
    } catch (error) {
      console.error('Error loading tests:', error);
      Alert.alert('Қате', 'Тесттер тізімін жүктеу барысында қате орын алды');
    } finally {
      setLoading(false);
    }
  };
  
  const navigateToTest = (testId: number) => {
    navigation.navigate('Test', { testId });
  };

  const navigateToExam = () => {
    navigation.navigate('ExamSimulation');
  };
  
  // Debug function to check test results storage
  const checkTestResults = async () => {
    const debug = await debugTestResultsStorage();
    
    if (debug.error) {
      Alert.alert('Debug: Error', debug.error);
    } else if (debug.count === 0) {
      Alert.alert('Debug: Empty', 'No test results found in storage');
    } else {
      // Get the first result with proper null checks
      const firstResult = debug.results?.[0];
      const dateString = firstResult?.date ? new Date(firstResult.date).toLocaleString() : 'Unknown';
      
      Alert.alert(
        'Debug: Results Found',
        `Found ${debug.count} test results in storage\n\nFirst result: ` +
        `Test ID: ${firstResult?.testId ?? 'Unknown'}\n` +
        `Score: ${firstResult?.score ?? 'Unknown'}\n` +
        `Date: ${dateString}`
      );
    }
  };
  
  // Debug function to check user data and token
  const checkUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      
      if (!userData) {
        Alert.alert('Debug: User Data', 'No user data found in storage');
        return;
      }
      
      try {
        const user = JSON.parse(userData);
        const hasToken = !!user.token;
        
        Alert.alert(
          'Debug: User Data',
          `Username: ${user.username || 'Unknown'}\n` +
          `Full name: ${user.fullName || 'Unknown'}\n` +
          `Has token: ${hasToken ? 'Yes' : 'No'}\n` +
          `Token: ${hasToken ? user.token.substring(0, 20) + '...' : 'None'}`
        );
      } catch (parseError) {
        Alert.alert('Debug: Parse Error', `Could not parse user data: ${parseError}`);
      }
    } catch (error) {
      Alert.alert('Debug: Error', `Error accessing user data: ${error}`);
    }
  };
  
  // Debug function to fix token issues
  const fixTokenIssue = async () => {
    try {
      if (user) {
        await updateUserToken(DEBUG_AUTH_TOKEN);
        Alert.alert('Debug: Token Fixed', 'Added debug token to user. Please try your action again.');
      } else {
        const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
        
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            parsedUser.token = DEBUG_AUTH_TOKEN;
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsedUser));
            Alert.alert('Debug: Token Fixed', 'Added debug token to stored user. Please restart the app.');
          } catch (parseError) {
            Alert.alert('Debug: Error', `Could not parse user data: ${parseError}`);
          }
        } else {
          Alert.alert('Debug: No User', 'No user data found. Please log in first.');
        }
      }
    } catch (error) {
      Alert.alert('Debug: Error', `Error fixing token: ${error}`);
    }
  };
  
  if (loading) {
    return (
      <ScreenContainer className="bg-white flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Жүктелуде...</Text>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer>
      <View className="p-4">
        <Card className="mb-5 bg-blue-50 border-blue-100">
          <Text className="text-lg font-bold text-blue-800 mb-2">
            ҰБТ емтихан симуляциясы
          </Text>
          <Text className="text-blue-700 mb-4">
            Толық ҰБТ симуляциясын өтіп, нәтижеңізді тексеріңіз
          </Text>
          <Button
            title="Емтиханды бастау"
            onPress={navigateToExam}
            className="bg-blue-600"
          />
        </Card>
        
        <Text className="text-xl font-bold mb-4">Барлық тесттер</Text>
        
        {tests.length === 0 ? (
          <View className="items-center py-6">
            <MaterialIcons name="menu-book" size={48} color="#64748b" />
            <Text className="text-gray-500 mt-2">Қол жетімді тесттер жоқ</Text>
          </View>
        ) : (
          <FlatList
            data={tests}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Card className="mb-3">
                <TouchableOpacity onPress={() => navigateToTest(item.id)}>
                  <Text className="font-bold text-lg">{item.title}</Text>
                  <Text className="text-gray-600 mt-1">
                    {item.description || 'No description'}
                  </Text>
                </TouchableOpacity>
              </Card>
            )}
          />
        )}
        
        {/* Debug buttons - only visible in dev mode */}
        {IS_DEV_MODE && (
          <View className="mt-4">
            <TouchableOpacity 
              onPress={checkTestResults}
              className="p-2 bg-gray-100 rounded-lg mb-2"
            >
              <Text className="text-gray-800 text-center">Debug: Check Test Results Storage</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={checkUserData}
              className="p-2 bg-gray-100 rounded-lg mb-2"
            >
              <Text className="text-gray-800 text-center">Debug: Check User Data & Token</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={fixTokenIssue}
              className="p-2 bg-red-100 rounded-lg"
            >
              <Text className="text-red-800 text-center">Debug: Fix Token Issue</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};

export default TestListScreen; 