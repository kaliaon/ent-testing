import AsyncStorage from '@react-native-async-storage/async-storage';
import kazakhstanHistoryData from '../assets/data/subjects/kazakhstan_history.json';
import mathematicalLiteracyData from '../assets/data/subjects/mathematical_literacy.json';
import readingLiteracyData from '../assets/data/subjects/reading_literacy.json';
import physicsData from '../assets/data/subjects/physics.json';
import informaticsData from '../assets/data/subjects/informatics.json';
import testsIndex from '../assets/data/tests_index.json';
import { apiCall, API_ENDPOINTS, getApiConfig } from './api';

// Types
export interface Test {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  reference?: string;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface TestResult {
  testId: number;
  score: number;
  answers: number[];
  date: string;
}

// Key constants
const TEST_RESULTS_KEY = 'ent_test_results';
const QUESTIONS_PER_TEST = 10; // Set a constant for the number of questions per test

// Map of reference files to subject data
const subjectDataMap: Record<string, Test> = {
  'subjects/kazakhstan_history.json': kazakhstanHistoryData as Test,
  'subjects/mathematical_literacy.json': mathematicalLiteracyData as Test,
  'subjects/reading_literacy.json': readingLiteracyData as Test,
  'subjects/physics.json': physicsData as Test,
  'subjects/informatics.json': informaticsData as Test
};

// Combine all subject data
const allTestsData: Test[] = [
  kazakhstanHistoryData as Test,
  mathematicalLiteracyData as Test,
  readingLiteracyData as Test,
  physicsData as Test,
  informaticsData as Test
];

// Service methods
export const getTests = async (): Promise<Test[]> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      try {
        // Use real backend API
        return await apiCall<Test[]>(API_ENDPOINTS.TESTS.GET_ALL, {
          method: 'GET'
        });
      } catch (apiError) {
        console.error('API call failed in getTests, falling back to local data:', apiError);
        return allTestsData;
      }
    } else {
      // Add safety check for testsData
      if (!allTestsData || !Array.isArray(allTestsData)) {
        console.error('testsData is undefined or not an array');
        return [];
      }
      return allTestsData;
    }
  } catch (error) {
    console.error('Get tests error:', error);
    // Fallback to local data if API fails, with safety check
    if (!allTestsData || !Array.isArray(allTestsData)) {
      console.error('testsData is undefined or not an array in error fallback');
      return [];
    }
    return allTestsData;
  }
};

// Helper function to get random questions from a test
const getRandomQuestions = (test: Test, count: number): Question[] => {
  if (!test.questions || test.questions.length === 0) {
    return [];
  }
  
  // If we have fewer questions than requested, return all questions in random order
  if (test.questions.length <= count) {
    return [...test.questions].sort(() => Math.random() - 0.5);
  }
  
  // Clone the questions array to avoid modifying the original
  const allQuestions = [...test.questions];
  const selectedQuestions: Question[] = [];
  
  // Select random questions
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    selectedQuestions.push(allQuestions.splice(randomIndex, 1)[0]);
  }
  
  return selectedQuestions;
};

export const getTestById = async (id: number): Promise<Test | undefined> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      try {
        // Use real backend API
        const fullTest = await apiCall<Test>(API_ENDPOINTS.TESTS.GET_BY_ID(id), {
          method: 'GET'
        });
        
        if (fullTest) {
          // Create a new test object with random questions
          return {
            ...fullTest,
            questions: getRandomQuestions(fullTest, QUESTIONS_PER_TEST)
          };
        }
        
        return undefined;
      } catch (apiError) {
        console.error(`API call failed in getTestById(${id}), falling back to local data:`, apiError);
        // Fall back to local data
        const fullTest = allTestsData.find((test) => test.id === id);
        if (fullTest) {
          return {
            ...fullTest,
            questions: getRandomQuestions(fullTest, QUESTIONS_PER_TEST)
          };
        }
        return undefined;
      }
    } else {
      // Add safety check for testsData
      if (!allTestsData || !Array.isArray(allTestsData)) {
        console.error('testsData is undefined or not an array');
        return undefined;
      }
      
      const fullTest = allTestsData.find((test) => test.id === id);
      
      if (fullTest) {
        // Create a new test object with random questions
        return {
          ...fullTest,
          questions: getRandomQuestions(fullTest, QUESTIONS_PER_TEST)
        };
      }
      
      return undefined;
    }
  } catch (error) {
    console.error(`Get test by ID (${id}) error:`, error);
    // Fallback to local data if API fails, with safety check
    if (!allTestsData || !Array.isArray(allTestsData)) {
      console.error('testsData is undefined or not an array in error fallback');
      return undefined;
    }
    
    const fullTest = allTestsData.find((test) => test.id === id);
    
    if (fullTest) {
      // Create a new test object with random questions
      return {
        ...fullTest,
        questions: getRandomQuestions(fullTest, QUESTIONS_PER_TEST)
      };
    }
    
    return undefined;
  }
};

export const saveTestResult = async (result: TestResult): Promise<boolean> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    // Always save to local storage first for redundancy
    try {
      const resultsJSON = await AsyncStorage.getItem(TEST_RESULTS_KEY);
      let results: TestResult[] = [];
      
      if (resultsJSON) {
        try {
          results = JSON.parse(resultsJSON);
          if (!Array.isArray(results)) {
            console.warn('TEST_RESULTS_KEY contained invalid data, resetting to empty array');
            results = [];
          }
        } catch (parseError) {
          console.error('Error parsing test results from storage:', parseError);
          results = [];
        }
      }
      
      results.push(result);
      await AsyncStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(results));
    } catch (storageError) {
      console.error('Error saving to AsyncStorage:', storageError);
      // Continue to try API if enabled, but return false at the end
    }
    
    if (config.tests.useBackend) {
      try {
        // Use real backend API
        await apiCall(API_ENDPOINTS.TESTS.SAVE_RESULT, {
          method: 'POST',
          body: JSON.stringify(result)
        });
      } catch (apiError) {
        console.error('API call failed in saveTestResult:', apiError);
        // Result saved locally if that succeeded, so consider this a partial success
        return true;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Save test result error:', error);
    return false;
  }
};

export const getTestResults = async (): Promise<TestResult[]> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      try {
        // Use real backend API
        const results = await apiCall<TestResult[]>(API_ENDPOINTS.TESTS.GET_RESULTS, {
          method: 'GET'
        });
        return results;
      } catch (apiError) {
        console.error('API call failed in getTestResults, falling back to local storage:', apiError);
        // Fallback to local storage if API fails
      }
    }
    
    // Get from local storage
    try {
      const resultsJSON = await AsyncStorage.getItem(TEST_RESULTS_KEY);
      if (!resultsJSON) {
        return [];
      }
      
      try {
        const results = JSON.parse(resultsJSON);
        if (!Array.isArray(results)) {
          console.warn('TEST_RESULTS_KEY contained invalid data, returning empty array');
          return [];
        }
        return results;
      } catch (parseError) {
        console.error('Error parsing test results from storage:', parseError);
        return [];
      }
    } catch (storageError) {
      console.error('Error reading from AsyncStorage:', storageError);
      return [];
    }
  } catch (error) {
    console.error('Get test results error:', error);
    return [];
  }
};

export const getTestResultsByTestId = async (testId: number): Promise<TestResult[]> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      // Use real backend API
      return await apiCall<TestResult[]>(API_ENDPOINTS.TESTS.GET_RESULTS_BY_TEST(testId), {
        method: 'GET'
      });
    } else {
      const results = await getTestResults();
      return results.filter((result) => result.testId === testId);
    }
  } catch (error) {
    console.error('Get test results by test ID error:', error);
    // Fallback to local filter if API fails
    const results = await getTestResults();
    return results.filter((result) => result.testId === testId);
  }
};

export const analyzePerformance = async (testIds?: number[]): Promise<{
  totalTests: number;
  averageScore: number;
  weakestAreas: { testId: number; title: string; averageScore: number }[];
}> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      // Use real backend API
      const params = testIds ? `?testIds=${testIds.join(',')}` : '';
      return await apiCall(API_ENDPOINTS.TESTS.ANALYZE_PERFORMANCE + params, {
        method: 'GET'
      });
    } else {
      // Local implementation
      const results = await getTestResults();
      
      // Filter by test IDs if provided
      const filteredResults = testIds 
        ? results.filter((result) => testIds.includes(result.testId))
        : results;
      
      if (filteredResults.length === 0) {
        return {
          totalTests: 0,
          averageScore: 0,
          weakestAreas: []
        };
      }
      
      // Calculate total tests and average score
      const totalTests = filteredResults.length;
      
      // Get the total number of correct answers and questions
      let totalCorrectAnswers = 0;
      let totalQuestions = 0;
      
      filteredResults.forEach(result => {
        totalCorrectAnswers += result.score;
        
        // Try to determine the number of questions from the result
        // If answers array is available use that, otherwise use a default
        const questionCount = result.answers ? result.answers.length : 10;
        totalQuestions += questionCount;
      });
      
      // Calculate average score as a decimal (0-1 range)
      const averageScore = totalQuestions > 0 ? totalCorrectAnswers / totalQuestions : 0;
      
      // Calculate performance by test
      const tests = await getTests();
      const testPerformance = tests.map((test) => {
        const testResults = filteredResults.filter((result) => result.testId === test.id);
        
        if (testResults.length === 0) {
          return {
            testId: test.id,
            title: test.title,
            averageScore: 0,
            attempts: 0
          };
        }
        
        let testTotalScore = 0;
        let testTotalQuestions = 0;
        
        testResults.forEach(result => {
          testTotalScore += result.score;
          // Try to determine the number of questions
          const questionCount = result.answers ? result.answers.length : test.questions.length;
          testTotalQuestions += questionCount;
        });
        
        // Calculate as a decimal (0-1 range) for consistency
        const testAverageScore = testTotalQuestions > 0 ? testTotalScore / testTotalQuestions : 0;
        
        return {
          testId: test.id,
          title: test.title,
          averageScore: testAverageScore,
          attempts: testResults.length
        };
      });
      
      // Filter out tests with no attempts
      const attemptedTests = testPerformance.filter((performance) => performance.attempts > 0);
      
      // Sort by average score (ascending) to find weakest areas
      const weakestAreas = [...attemptedTests]
        .sort((a, b) => a.averageScore - b.averageScore)
        .slice(0, 3)
        .map(({ testId, title, averageScore }) => ({ testId, title, averageScore }));
      
      return {
        totalTests,
        averageScore,
        weakestAreas
      };
    }
  } catch (error) {
    console.error('Analyze performance error:', error);
    return {
      totalTests: 0,
      averageScore: 0,
      weakestAreas: []
    };
  }
};

// Helper function to debug test results storage (can be called from developer menus or debug screens)
export const debugTestResultsStorage = async (): Promise<{ count: number, results: TestResult[] | null, error?: string }> => {
  try {
    const resultsJSON = await AsyncStorage.getItem(TEST_RESULTS_KEY);
    
    if (!resultsJSON) {
      return { count: 0, results: null };
    }
    
    try {
      const results = JSON.parse(resultsJSON);
      
      if (!Array.isArray(results)) {
        const error = 'TEST_RESULTS_KEY contains invalid data (not an array)';
        console.error(error);
        return { count: 0, results: null, error };
      }
      
      return { count: results.length, results };
    } catch (parseError) {
      const error = `Error parsing test results: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
      console.error(error);
      return { count: 0, results: null, error };
    }
  } catch (storageError) {
    const error = `Error accessing AsyncStorage: ${storageError instanceof Error ? storageError.message : String(storageError)}`;
    console.error(error);
    return { count: 0, results: null, error };
  }
};

// Helper function to debug the user's test history and AI performance data
export const debugUserPerformanceData = async (): Promise<{
  userHistory: any | null;
  testResults: any | null;
  performanceData: any | null;
  error?: string;
}> => {
  try {
    // Get current user history
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    let userHistory = null;
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.testHistory) {
          userHistory = {
            id: user.id,
            username: user.username,
            testHistoryCount: user.testHistory.length,
            testHistory: user.testHistory
          };
        }
      } catch (parseError) {
        return { 
          userHistory: null,
          testResults: null,
          performanceData: null,
          error: `Error parsing user data: ${parseError instanceof Error ? parseError.message : String(parseError)}` 
        };
      }
    }
    
    // Get stored test results
    const testResultsData = await debugTestResultsStorage();
    
    // Run performance analysis
    let performanceData = null;
    try {
      performanceData = await analyzePerformance();
    } catch (analyzeError) {
      console.error('Error analyzing performance:', analyzeError);
    }
    
    return {
      userHistory,
      testResults: testResultsData,
      performanceData
    };
  } catch (error) {
    const errorMessage = `Error accessing debugging data: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    return { 
      userHistory: null,
      testResults: null,
      performanceData: null,
      error: errorMessage 
    };
  }
};

// Synchronize test results with user test history
export const synchronizeTestData = async (): Promise<boolean> => {
  try {
    // Import necessary functions and constants here to avoid circular imports
    const { USER_STORAGE_KEY } = require('./storageConstants');
    const { getCurrentUser } = require('./authService');
    
    // Get current user 
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return false;
    }
    
    // Get all test results
    const testResults = await getTestResults();
    if (testResults.length === 0) {
      return true; // Nothing to do, but not an error
    }
    
    // Initialize testHistory array if it doesn't exist
    if (!currentUser.testHistory) {
      currentUser.testHistory = [];
    }
    
    // Create a map of existing test attempts by date and testId to avoid duplicates
    const existingTestMap = new Map();
    currentUser.testHistory.forEach(historyItem => {
      const key = `${historyItem.testId}:${historyItem.date}`;
      existingTestMap.set(key, true);
    });
    
    // Count of tests added
    let addedCount = 0;
    
    // Add missing test results to user's history
    for (const result of testResults) {
      const key = `${result.testId}:${result.date}`;
      
      // If this test result is not already in the user's history, add it
      if (!existingTestMap.has(key)) {
        // Create a test attempt object from the test result
        const testAttempt = {
          testId: result.testId,
          date: result.date,
          score: result.score,
          totalQuestions: result.answers ? result.answers.length : 10 // Use answer length or default
        };
        
        // Add to user history
        currentUser.testHistory.push(testAttempt);
        addedCount++;
        
        // Mark as processed
        existingTestMap.set(key, true);
      }
    }
    
    if (addedCount > 0) {
      // Save the updated user data
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      return true;
    } else {
      return true;
    }
  } catch (error) {
    console.error('Error synchronizing test data:', error);
    return false;
  }
}; 