import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TestStackParamList } from '../navigation';
import { getTestById, Question, saveTestResult, TestResult } from '../services/testService';
import { updateUserTestHistory } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

type TestScreenRouteProp = RouteProp<TestStackParamList, 'Test'>;
type TestScreenNavigationProp = NativeStackNavigationProp<TestStackParamList, 'Test'>;

const TestScreen = () => {
  const route = useRoute<TestScreenRouteProp>();
  const navigation = useNavigation<TestScreenNavigationProp>();
  const { user } = useAuth();
  
  const { testId } = route.params;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTest = async () => {
      await loadTest();
    };
    
    fetchTest();
  }, []);
  
  const loadTest = async () => {
    setLoading(true);
    try {
      const test = await getTestById(testId);
      
      if (!test) {
        Alert.alert('Қате', 'Тест табылмады');
        navigation.goBack();
        return;
      }
      
      setQuestions(test.questions);
      // Initialize selected answers array with -1 (no answer selected)
      setSelectedAnswers(new Array(test.questions.length).fill(-1));
    } catch (error) {
      console.error('Error loading test:', error);
      Alert.alert('Қате', 'Тест жүктеу кезінде қате орын алды');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const handleAnswerSelect = (answerIndex: number) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleFinishTest = async () => {
    // Check if all questions are answered
    const unansweredQuestions = selectedAnswers.filter(answer => answer === -1).length;
    
    // Capture current state values to pass to finishTest
    const currentQuestions = [...questions];
    const currentSelectedAnswers = [...selectedAnswers];
    const currentTestId = testId;
    
    if (unansweredQuestions > 0) {
      Alert.alert(
        'Аяқтауға сенімдісіз бе?',
        `Сіз барлық сұрақтарға жауап бермедіңіз. ${unansweredQuestions} сұрақ қалды.`,
        [
          { text: 'Жоқ, жалғастыру', style: 'cancel' },
          { 
            text: 'Иә, аяқтау', 
            onPress: () => finishTest(currentQuestions, currentSelectedAnswers, currentTestId) 
          }
        ]
      );
    } else {
      finishTest(currentQuestions, currentSelectedAnswers, currentTestId);
    }
  };
  
  const finishTest = async (currentQuestions: Question[], currentAnswers: number[], currentTestId: number) => {
    // Calculate score using the passed parameters
    let score = 0;
    
    currentQuestions.forEach((question, index) => {
      if (currentAnswers[index] === question.correctAnswer) {
        score++;
      }
    });
    
    // Create test result object
    const testResult: TestResult = {
      testId: currentTestId,
      score: score,
      answers: currentAnswers,
      date: new Date().toISOString()
    };
    
    // Save test result to local storage (independent of user)
    try {
      await saveTestResult(testResult);
      console.log('Test result saved to local storage successfully');
    } catch (error) {
      console.error('Error saving test result to local storage:', error);
    }
    
    // Save test attempt for the user if logged in
    if (user) {
      try {
        await updateUserTestHistory({
          testId: currentTestId,
          date: new Date().toISOString(),
          score,
          totalQuestions: currentQuestions.length
        });
        console.log('Test history updated for user successfully');
      } catch (error) {
        console.error('Error saving test history:', error);
      }
    }
    
    // Navigate to results screen
    if (currentQuestions && currentQuestions.length > 0 && currentAnswers && currentTestId) {
      navigation.navigate('TestResult', {
        testId: currentTestId,
        score,
        answers: currentAnswers
      });
    } else {
      console.error('Cannot navigate to results: missing required data');
      Alert.alert('Қате', 'Тест нәтижелерін жүктеу кезінде қате орын алды');
      navigation.navigate('TestList');
    }
  };
  
  if (loading || questions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-700">Жүктелуде...</Text>
      </View>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const questionNumber = currentQuestionIndex + 1;
  
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-4 py-3 bg-blue-50">
        <Text className="text-blue-800 font-bold">
          Сұрақ {questionNumber}/{totalQuestions}
        </Text>
      </View>
      
      <View className="p-4">
        <Text className="text-lg font-medium mb-6">{currentQuestion.text}</Text>
        
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            className={`p-4 border rounded-lg mb-3 ${
              selectedAnswers[currentQuestionIndex] === index
                ? 'bg-blue-100 border-blue-500'
                : 'border-gray-300'
            }`}
            onPress={() => handleAnswerSelect(index)}
          >
            <Text>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View className="flex-row justify-between p-4 mt-2">
        <Button
          title="Артқа"
          variant="outline"
          disabled={currentQuestionIndex === 0}
          onPress={goToPreviousQuestion}
          className="flex-1 mr-2"
        />
        
        {currentQuestionIndex < totalQuestions - 1 ? (
          <Button
            title="Келесі"
            onPress={goToNextQuestion}
            className="flex-1 ml-2"
          />
        ) : (
          <Button
            title="Аяқтау"
            variant="primary"
            onPress={handleFinishTest}
            className="flex-1 ml-2"
          />
        )}
      </View>
      
      <View className="flex-row flex-wrap p-4 justify-center">
        {questions.map((_, index) => (
          <TouchableOpacity
            key={index}
            className={`w-10 h-10 rounded-full m-1 items-center justify-center ${
              index === currentQuestionIndex
                ? 'bg-blue-600'
                : selectedAnswers[index] !== -1
                ? 'bg-green-600'
                : 'bg-gray-300'
            }`}
            onPress={() => setCurrentQuestionIndex(index)}
          >
            <Text className={`font-bold ${index === currentQuestionIndex || selectedAnswers[index] !== -1 ? 'text-white' : 'text-gray-700'}`}>
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default TestScreen; 