import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getTests, Test, Question, saveTestResult, TestResult } from '../services/testService';
import { updateUserTestHistory } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

// Extend the Question interface to include a uniqueId 
interface ExamQuestion extends Question {
  uniqueId?: string;
  subjectId?: number;
  subjectTitle?: string;
}

// ENT exam structure - define how many questions to take from each subject
const ENT_STRUCTURE = {
  1: 20, // Kazakhstan History - 20 questions
  2: 10, // Mathematical Literacy - 10 questions
  3: 10, // Reading Literacy - 10 questions
  4: 40, // Physics - 40 questions (of 40)
  5: 40  // Informatics - 40 questions (of 40)
};

const ExamSimulationScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 minutes in seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSubject, setCurrentSubject] = useState<string>('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const tests = await getTests();
      let examQuestions: ExamQuestion[] = [];
      
      // Add required number of questions from each test according to ENT structure
      tests.forEach((test: Test) => {
        // Get number of questions needed from this subject
        const numQuestionsNeeded = ENT_STRUCTURE[test.id as keyof typeof ENT_STRUCTURE] || 0;
        
        if (numQuestionsNeeded > 0) {
          // Shuffle the test questions to randomize selection
          const shuffledQuestions = [...test.questions].sort(() => Math.random() - 0.5);
          
          // Take only the required number of questions (or all if there aren't enough)
          const selectedQuestions = shuffledQuestions.slice(0, numQuestionsNeeded);
          
          // Add subject information to each question
          const questionsWithSubject = selectedQuestions.map((question: Question): ExamQuestion => ({
            ...question,
            uniqueId: `${test.id}-${question.id}`, // Create unique ID combining test and question IDs
            subjectId: test.id,
            subjectTitle: test.title
          }));
          
          examQuestions = [...examQuestions, ...questionsWithSubject];
        }
      });

      // Shuffle questions to randomize order
      const finalQuestions = examQuestions.sort(() => Math.random() - 0.5);
      
      setQuestions(finalQuestions);
      
      // Initialize selected answers array with -1 (no answer selected)
      setSelectedAnswers(new Array(finalQuestions.length).fill(-1));
      
      // Set initial current subject
      if (finalQuestions.length > 0) {
        setCurrentSubject(finalQuestions[0]?.subjectTitle || '');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert('Қате', 'Сұрақтар жүктеу кезінде қате орын алды');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !showResults) {
      handleFinishTest();
    }
  }, [timeLeft, showResults]);

  useEffect(() => {
    // Update current subject when changing questions
    if (questions.length > 0 && currentQuestionIndex >= 0) {
      const question = questions[currentQuestionIndex];
      if (question && question.subjectTitle) {
        setCurrentSubject(question.subjectTitle);
      }
    }
  }, [currentQuestionIndex, questions]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  const calculateScore = () => {
    let score = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const handleFinishTest = () => {
    // Check if all questions are answered
    const unansweredQuestions = selectedAnswers.filter(answer => answer === -1).length;
    
    if (unansweredQuestions > 0) {
      Alert.alert(
        'Аяқтауға сенімдісіз бе?',
        `Сіз барлық сұрақтарға жауап бермедіңіз. ${unansweredQuestions} сұрақ қалды.`,
        [
          { text: 'Жоқ, жалғастыру', style: 'cancel' },
          { text: 'Иә, аяқтау', onPress: finishTest }
        ]
      );
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    
    // Save exam result to local storage
    const testResult: TestResult = {
      testId: 999, // Special ID for full exam simulation
      score: finalScore,
      answers: selectedAnswers,
      date: new Date().toISOString()
    };
    
    // Save result to local storage
    try {
      saveTestResult(testResult);
      console.log('Exam result saved to local storage successfully');
    } catch (error) {
      console.error('Error saving exam result to local storage:', error);
    }
    
    // Save to user history if logged in
    if (user) {
      try {
        updateUserTestHistory({
          testId: 999, // Special ID for full exam simulation
          date: new Date().toISOString(),
          score: finalScore,
          totalQuestions: questions.length
        });
        console.log('Exam history updated for user successfully');
      } catch (error) {
        console.error('Error saving exam history for user:', error);
      }
    }
    
    setShowResults(true);
  };

  const calculateSubjectScores = () => {
    const subjectScores: Record<number, { correct: number, total: number, title: string }> = {};
    
    questions.forEach((question, index) => {
      if (!question.subjectId) return;
      
      // Initialize subject score if not exists
      if (!subjectScores[question.subjectId]) {
        subjectScores[question.subjectId] = {
          correct: 0,
          total: 0,
          title: question.subjectTitle || ''
        };
      }
      
      // Increment total
      subjectScores[question.subjectId].total++;
      
      // Check if answer is correct
      if (selectedAnswers[index] === question.correctAnswer) {
        subjectScores[question.subjectId].correct++;
      }
    });
    
    return subjectScores;
  };

  // Helper function to format percentage consistently
  const formatScorePercentage = (score: number, total: number): string => {
    if (total === 0) return '0.0%';
    return ((score / total) * 100).toFixed(1) + '%';
  };

  if (showResults) {
    const subjectScores = calculateSubjectScores();
    
    return (
      <View className="flex-1 p-4 bg-white">
        <Text className="text-2xl font-bold mb-4">Емтихан нәтижелері</Text>
        <Text className="text-xl mb-6">
          Жалпы нәтиже: {score} / {questions.length} ({formatScorePercentage(score, questions.length)})
        </Text>
        
        <Text className="text-lg font-bold mb-2">Пәндер бойынша нәтижелер:</Text>
        {Object.values(subjectScores).map((subjectScore, index) => (
          <View key={index} className="mb-2">
            <Text className="text-base">
              {subjectScore.title}: {subjectScore.correct} / {subjectScore.total} 
              ({formatScorePercentage(subjectScore.correct, subjectScore.total)})
            </Text>
          </View>
        ))}
        
        <Button
          title="Басты бетке оралу"
          onPress={() => navigation.goBack()}
          className="mt-8"
        />
      </View>
    );
  }

  if (loading || questions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-600">Сұрақтар жүктелуде...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const questionNumber = currentQuestionIndex + 1;

  return (
    <ScrollView 
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
      showsVerticalScrollIndicator={true}
    >
      <View className="px-4 py-3 bg-blue-500">
        <Text className="text-white text-xl font-bold text-center">
          Қалған уақыт: {formatTime(timeLeft)}
        </Text>
      </View>

      <View className="px-4 py-3 bg-blue-50">
        <Text className="text-blue-800 font-bold">
          Пән: {currentSubject} | Сұрақ {questionNumber}/{totalQuestions}
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

export default ExamSimulationScreen; 