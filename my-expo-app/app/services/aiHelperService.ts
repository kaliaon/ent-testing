import { Test } from './testService';
import { TestAttempt, User } from './authService';
import { apiCall, API_ENDPOINTS, getApiConfig } from './api';

// In a real app, this would be an API call to an AI service
// For now, we'll use mock logic to generate feedback

export interface AIFeedback {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export const generateAIFeedback = async (user: User, tests: Test[]): Promise<AIFeedback> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.aiHelper.useBackend) {
      // Use real backend API
      return await apiCall<AIFeedback>(API_ENDPOINTS.AI_HELPER.GENERATE_FEEDBACK, {
        method: 'POST',
        body: JSON.stringify({ user, tests })
      });
    } else {
      // Simulate AI feedback generation
      if (!user || !user.testHistory || user.testHistory.length === 0) {
        return {
          overview: 'Тест тапсырмалары туралы деректер жеткіліксіз. Кеңес алу үшін біраз тест тапсырыңыз.',
          strengths: [],
          weaknesses: [],
          recommendations: ['Бірнеше тест тапсырып, нәтижелерді талдаңыз.']
        };
      }
      
      // Calculate performance by subject
      const subjectPerformance = calculateSubjectPerformance(user.testHistory, tests);
      
      // Find strengths and weaknesses
      const sortedSubjects = [...subjectPerformance].sort((a, b) => b.percentageScore - a.percentageScore);
      const strengths = sortedSubjects.slice(0, 2).filter(s => s.percentageScore >= 60);
      const weaknesses = sortedSubjects.slice(-2).filter(s => s.percentageScore < 60);
      
      // Generate feedback
      const overview = generateOverview(user, subjectPerformance);
      const strengthsFeedback = generateStrengthsFeedback(strengths);
      const weaknessesFeedback = generateWeaknessesFeedback(weaknesses);
      const recommendations = generateRecommendations(weaknesses, strengths);
      
      return {
        overview,
        strengths: strengthsFeedback,
        weaknesses: weaknessesFeedback,
        recommendations
      };
    }
  } catch (error) {
    console.error('Generate AI feedback error:', error);
    // Provide a fallback response in case of error
    return {
      overview: 'AI жүйесіне қолжеткізу мүмкін болмады. Кейінірек қайталап көріңіз.',
      strengths: [],
      weaknesses: [],
      recommendations: ['Интернет байланысын тексеріңіз.']
    };
  }
};

// Helper functions
function calculateSubjectPerformance(history: TestAttempt[], tests: Test[]) {
  const subjectPerformance = tests.map(test => {
    const attempts = history.filter(h => h.testId === test.id);
    if (attempts.length === 0) {
      return {
        id: test.id,
        title: test.title,
        totalScore: 0,
        totalQuestions: 0,
        percentageScore: 0,
        attempts: 0
      };
    }
    
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.totalQuestions, 0);
    
    // Calculate percentage as a number between 0-100
    const percentageScore = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
    
    return {
      id: test.id,
      title: test.title,
      totalScore,
      totalQuestions,
      percentageScore,
      attempts: attempts.length
    };
  });
  
  // Filter out subjects with no attempts
  return subjectPerformance.filter(subject => subject.attempts > 0);
}

function generateOverview(user: User, subjectPerformance: any[]): string {
  if (subjectPerformance.length === 0) {
    return 'Сіз әлі ешқандай тест тапсырмағансыз. Дайындық деңгейіңізді бағалау үшін бірнеше тест тапсырыңыз.';
  }
  
  const totalScore = subjectPerformance.reduce((sum, subject) => sum + subject.totalScore, 0);
  const totalQuestions = subjectPerformance.reduce((sum, subject) => sum + subject.totalQuestions, 0);
  const averagePercentage = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
  
  let performanceLevel;
  if (averagePercentage >= 90) {
    performanceLevel = 'өте жоғары';
  } else if (averagePercentage >= 75) {
    performanceLevel = 'жоғары';
  } else if (averagePercentage >= 60) {
    performanceLevel = 'орташа';
  } else if (averagePercentage >= 40) {
    performanceLevel = 'төмен';
  } else {
    performanceLevel = 'өте төмен';
  }
  
  return `${user.fullName}, сіздің ЕНТ-ге дайындық деңгейіңіз ${performanceLevel}. Сіз ${subjectPerformance.length} пәндер бойынша барлығы ${totalQuestions} сұрақтар тапсырдыңыз, жалпы дұрыс жауап үлесі ${averagePercentage.toFixed(1)}%.`;
}

function generateStrengthsFeedback(strengths: any[]): string[] {
  if (strengths.length === 0) {
    return ['Күшті жақтарыңыз әлі анықталған жоқ. Көбірек тесттер тапсырыңыз.'];
  }
  
  return strengths.map(subject => {
    return `${subject.title}: ${subject.percentageScore.toFixed(1)}% (${subject.totalScore}/${subject.totalQuestions})`;
  });
}

function generateWeaknessesFeedback(weaknesses: any[]): string[] {
  if (weaknesses.length === 0) {
    return ['Әлсіз жақтарыңыз анықталған жоқ немесе жеткілікті деректер жоқ.'];
  }
  
  return weaknesses.map(subject => {
    return `${subject.title}: ${subject.percentageScore.toFixed(1)}% (${subject.totalScore}/${subject.totalQuestions})`;
  });
}

function generateRecommendations(weaknesses: any[], strengths: any[]): string[] {
  const recommendations = [];
  
  if (weaknesses.length === 0 && strengths.length === 0) {
    recommendations.push('Бірнеше тест тапсырып, нәтижелерді талдаңыз.');
    return recommendations;
  }
  
  if (weaknesses.length > 0) {
    weaknesses.forEach(weakness => {
      recommendations.push(`"${weakness.title}" пәні бойынша көбірек дайындалыңыз.`);
    });
  }
  
  if (strengths.length > 0) {
    const randomStrength = strengths[Math.floor(Math.random() * strengths.length)];
    recommendations.push(`"${randomStrength.title}" пәні бойынша жақсы нәтиже көрсетіп келесіз, осы деңгейді сақтаңыз.`);
  }
  
  recommendations.push('Күнделікті 30-60 минут уақыт бөліп, ЕНТ-ға дайындалыңыз.');
  
  return recommendations;
} 