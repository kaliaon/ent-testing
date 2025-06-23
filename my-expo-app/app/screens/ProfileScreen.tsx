import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { getTests, analyzePerformance, Test, synchronizeTestData, debugTestResultsStorage } from '../services/testService';
import Button from '../components/Button';
import Card from '../components/Card';
import ScreenContainer from '../components/ScreenContainer';

const ProfileScreen = () => {
  const { user, logout, refreshUser } = useAuth();
  const [performance, setPerformance] = useState<{
    totalTests: number;
    averageScore: number;
    weakestAreas: { testId: number; title: string; averageScore: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<Test[]>([]);
  
  useEffect(() => {
    loadData();
  }, [user]);
  
  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First check if we actually need to synchronize by comparing test results count
      // with user test history count to avoid unnecessary operations
      const testResultsData = await debugTestResultsStorage();
      const userTestHistoryCount = user.testHistory?.length || 0;
      
      // Only synchronize if we have test results that aren't in user history
      if (testResultsData.count > userTestHistoryCount) {
        await synchronizeTestData();
        
        // Refresh user data after synchronization (to get updated test history)
        await refreshUser();
      }
      
      // Load test data and performance data in parallel
      const [testsData, performanceData] = await Promise.all([
        getTests(),
        analyzePerformance()
      ]);
      
      setTests(testsData);
      setPerformance(performanceData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    // Check if we're in a browser environment
    const isWeb = typeof window !== 'undefined' && window.navigator && window.navigator.userAgent;
    
    if (isWeb) {
      // On web, directly logout without confirmation
      await logout();
    } else {
      // On mobile, show confirmation alert
      Alert.alert(
        'Шығу',
        'Сіз шынымен шыққыңыз келе ме?',
        [
          { text: 'Жоқ', style: 'cancel' },
          { 
            text: 'Иә', 
            onPress: async () => {
              await logout();
            }
          }
        ]
      );
    }
  };
  
  if (!user) {
    return (
      <ScreenContainer className="bg-white p-4">
        <View className="flex-1 justify-center items-center">
          <MaterialIcons name="person-off" size={48} color="#64748b" />
          <Text className="text-xl font-bold mt-4 text-center">
            Профильді көру үшін жүйеге кіріңіз
          </Text>
          <Text className="text-gray-500 mt-2 text-center">
            Тест тарихыңызды көру және жетістіктеріңізді қадағалау үшін жүйеге кіріңіз.
          </Text>
        </View>
      </ScreenContainer>
    );
  }
  
  const testHistory = user.testHistory.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('kk-KZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Improved helper function to format percentage display from score values
  const formatScorePercentage = (score: number): string => {
    // If the score is very large (greater than 100), it might be a raw score
    // that needs to be displayed as is
    if (score > 100) {
      return score.toFixed(1);
    }
    
    // Check if score is already a percentage (between 1 and 100)
    if (score > 1 && score <= 100) {
      return score.toFixed(1) + '%';
    } else {
      // If score is a decimal (e.g. 0.75 = 75%), multiply by 100
      return (score * 100).toFixed(1) + '%';
    }
  };
  
  return (
    <ScreenContainer scroll className="bg-gray-50">
      <View className="bg-blue-600 p-6 pt-10 rounded-b-3xl">
        <View className="items-center mb-4">
          <View className="h-24 w-24 rounded-full bg-white items-center justify-center mb-3">
            <MaterialIcons name="person" size={60} color="#3b82f6" />
          </View>
          <Text className="text-xl font-bold text-white">{user.fullName}</Text>
          <Text className="text-white opacity-80">{user.email}</Text>
        </View>
      </View>
      
      <View className="px-4 py-6">
        <Text className="text-xl font-bold mb-4">Жалпы статистика</Text>
        
        <View className="flex-row justify-between mb-4">
          <Card className="flex-1 mr-2">
            <View className="items-center">
              <Text className="text-gray-600 mb-1">Тест саны</Text>
              <Text className="text-2xl font-bold text-blue-600">{testHistory.length}</Text>
            </View>
          </Card>
          
          <Card className="flex-1 ml-2">
            <View className="items-center">
              <Text className="text-gray-600 mb-1">Орташа балл</Text>
              <Text className="text-2xl font-bold text-blue-600">
                {performance && performance.averageScore !== undefined ? formatScorePercentage(performance.averageScore) : '-'}
              </Text>
            </View>
          </Card>
        </View>
        
        {performance && performance.weakestAreas && performance.weakestAreas.length > 0 && (
          <Card className="mb-4">
            <Text className="font-bold mb-2">Жақсартуды қажет ететін пәндер</Text>
            {performance.weakestAreas.map((area, index) => (
              <View key={index} className="flex-row items-center mb-1">
                <MaterialIcons name="priority-high" size={18} color="#dc2626" />
                <Text className="text-gray-700 ml-2">
                  {area.title}: {formatScorePercentage(area.averageScore)}
                </Text>
              </View>
            ))}
          </Card>
        )}
        
        <Text className="text-xl font-bold mb-4 mt-2">Тест тарихы</Text>
        
        {testHistory.length > 0 ? (
          testHistory.map((test, index) => {
            const testInfo = tests.find(t => t.id === test.testId);
            const scorePercentage = ((test.score / test.totalQuestions) * 100).toFixed(1) + '%';
            
            return (
              <Card key={index} className="mb-3">
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold">{testInfo?.title || `Тест ${test.testId}`}</Text>
                  <View className="flex-row items-center">
                    <Text className={`font-bold ${getScoreColor(test.score, test.totalQuestions)}`}>
                      {test.score}/{test.totalQuestions}
                    </Text>
                    <Text className={`ml-2 text-sm ${getScoreColor(test.score, test.totalQuestions)}`}>
                      ({scorePercentage})
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-sm mt-1">{formatDate(test.date)}</Text>
              </Card>
            );
          })
        ) : (
          <View className="items-center py-6">
            <MaterialIcons name="history" size={48} color="#64748b" />
            <Text className="text-gray-500 mt-2">Тест тарихы бос</Text>
          </View>
        )}
        
        <View className="mt-6 mb-20">
          <Button
            title="Шығу"
            variant="danger"
            onPress={handleLogout}
            className="w-full"
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

export default ProfileScreen; 