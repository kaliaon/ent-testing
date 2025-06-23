import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { getTests } from '../services/testService';
import { generateAIFeedback, AIFeedback } from '../services/aiHelperService';
import Card from '../components/Card';
import ScreenContainer from '../components/ScreenContainer';

// Enhanced feedback interface with detailed information
interface EnhancedAIFeedback extends AIFeedback {
  detailedOverview?: string;
  detailedStrengths?: Array<{strength: string, details: string}>;
  detailedWeaknesses?: Array<{weakness: string, details: string}>;
  detailedRecommendations?: Array<{recommendation: string, details: string}>;
}

interface PanelProps {
  title: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ title, iconName, iconColor, children, expandedContent }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-4 bg-white rounded-lg shadow">
      <Pressable 
        className="p-4"
        onPress={() => setExpanded(!expanded)}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MaterialIcons name={iconName} size={24} color={iconColor} />
            <Text className="text-lg font-bold ml-2">{title}</Text>
          </View>
          <MaterialIcons 
            name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color="#666" 
          />
        </View>
      </Pressable>
      
      <View className="px-4 pb-4">
        {expanded ? expandedContent || children : children}
      </View>
    </View>
  );
};

const AIHelperScreen = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<EnhancedAIFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadFeedback();
  }, [user]);
  
  const loadFeedback = async () => {
    setLoading(true);
    try {
      if (!user) {
        setFeedback({
          overview: 'Кеңес алу үшін жүйеге кіріңіз.',
          strengths: [],
          weaknesses: [],
          recommendations: ['Дәлірек талдау алу үшін, алдымен жүйеге кіріп, бірнеше тест тапсырыңыз.']
        });
        setLoading(false);
        return;
      }
      
      const tests = await getTests();
      const generatedFeedback = await generateAIFeedback(user, tests);

      // Add mock detailed data
      const enhancedFeedback: EnhancedAIFeedback = {
        ...generatedFeedback,
        detailedOverview: generatedFeedback.overview + '\n\nТалдау көрсеткендей, сіз әртүрлі бөлімдерде қосымша мықты және әлсіз тұстарыңыз бар. Бұл жеке оқу жоспарын әзірлеуге көмектеседі.',
        detailedStrengths: generatedFeedback.strengths.map(strength => ({
          strength,
          details: `${strength} - Бұл тақырып бойынша қосымша материалдар зерттеу арқылы осы күшті жағыңызды нығайтыңыз. Бұл тақырып бойынша тереңдетілген мәліметтерді оқу осы саладағы біліміңізді одан әрі жетілдіреді және күрделі сұрақтарды шешуге көмектеседі.`
        })),
        detailedWeaknesses: generatedFeedback.weaknesses.map(weakness => ({
          weakness,
          details: `${weakness} - Бұл тақырып бойынша оқу жоспарыңызды күшейту керек. Осы тақырып бойынша қосымша тапсырмалар орындау және арнайы оқу материалдарын қарастыру арқылы нәтижелеріңізді жақсарта аласыз.`
        })),
        detailedRecommendations: generatedFeedback.recommendations.map(recommendation => ({
          recommendation,
          details: `${recommendation}\n\nБұл кеңесті қалай қолдануға болады: күн сайын 30-60 минут арнайы осы тақырыпқа арнаңыз. Оқулықтар мен онлайн ресурстарды қолданып, тест тапсырыңыз.`
        }))
      };
      
      setFeedback(enhancedFeedback);
    } catch (error) {
      console.error('Error generating AI feedback:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <ScreenContainer className="bg-white" extraTopPadding>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600">AI талдау жасалуда...</Text>
        </View>
      </ScreenContainer>
    );
  }
  
  if (!feedback) {
    return (
      <ScreenContainer className="bg-white" extraTopPadding>
        <View className="flex-1 justify-center items-center">
          <MaterialIcons name="error-outline" size={48} color="#dc2626" />
          <Text className="mt-4 text-gray-600">Талдау жасау кезінде қате орын алды. Кейінірек қайталап көріңіз.</Text>
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer scroll className="bg-gray-50" extraTopPadding>
      <View className="bg-blue-600 p-6 rounded-b-3xl">
        <Text className="text-2xl font-bold text-white mb-2">AI Көмекші</Text>
        <Text className="text-white opacity-80">
          Жеке оқу жоспарыңызды жасаңыз және ЕНТ-ге дайындықты жақсартыңыз
        </Text>
      </View>
      
      <View className="px-4 pt-4">
        <Panel 
          title="Жалпы шолу" 
          iconName="insights" 
          iconColor="#3b82f6"
          expandedContent={
            <View>
              <Text className="text-gray-700 mb-4">{feedback.overview}</Text>
              {feedback.detailedOverview && (
                <View className="bg-blue-50 p-4 rounded-lg">
                  <Text className="text-blue-800 font-medium mb-2">Толық талдау:</Text>
                  <Text className="text-gray-700">{feedback.detailedOverview}</Text>
                </View>
              )}
            </View>
          }
        >
          <Text className="text-gray-700">{feedback.overview}</Text>
        </Panel>
        
        <Panel 
          title="Күшті жақтарыңыз" 
          iconName="trending-up" 
          iconColor="#16a34a"
          expandedContent={
            <View>
              {feedback.strengths.length > 0 ? (
                feedback.detailedStrengths?.map((item, index) => (
                  <View key={index} className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <MaterialIcons name="check-circle" size={20} color="#16a34a" />
                      <Text className="ml-2 font-medium text-gray-800">{item.strength}</Text>
                    </View>
                    <View className="bg-green-50 p-3 rounded-lg ml-6">
                      <Text className="text-gray-700">{item.details}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500 italic">Күшті жақтарыңыз әлі анықталған жоқ.</Text>
              )}
            </View>
          }
        >
          {feedback.strengths.length > 0 ? (
            feedback.strengths.map((strength, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <MaterialIcons name="check-circle" size={20} color="#16a34a" />
                <Text className="ml-2 text-gray-700">{strength}</Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500 italic">Күшті жақтарыңыз әлі анықталған жоқ.</Text>
          )}
        </Panel>
        
        <Panel 
          title="Жақсартуды қажет ететін салалар" 
          iconName="trending-down" 
          iconColor="#dc2626"
          expandedContent={
            <View>
              {feedback.weaknesses.length > 0 ? (
                feedback.detailedWeaknesses?.map((item, index) => (
                  <View key={index} className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <MaterialIcons name="error-outline" size={20} color="#dc2626" />
                      <Text className="ml-2 font-medium text-gray-800">{item.weakness}</Text>
                    </View>
                    <View className="bg-red-50 p-3 rounded-lg ml-6">
                      <Text className="text-gray-700">{item.details}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500 italic">Әлсіз жақтарыңыз анықталған жоқ немесе жеткілікті деректер жоқ.</Text>
              )}
            </View>
          }
        >
          {feedback.weaknesses.length > 0 ? (
            feedback.weaknesses.map((weakness, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <MaterialIcons name="error-outline" size={20} color="#dc2626" />
                <Text className="ml-2 text-gray-700">{weakness}</Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500 italic">Әлсіз жақтарыңыз анықталған жоқ немесе жеткілікті деректер жоқ.</Text>
          )}
        </Panel>
        
        <Panel 
          title="Кеңестер" 
          iconName="lightbulb" 
          iconColor="#eab308"
          expandedContent={
            <View>
              {feedback.detailedRecommendations?.map((item, index) => (
                <View key={index} className="mb-4">
                  <View className="flex-row items-start mb-2">
                    <MaterialIcons name="star" size={20} color="#eab308" className="mt-0.5" />
                    <Text className="ml-2 font-medium text-gray-800 flex-1">{item.recommendation}</Text>
                  </View>
                  <View className="bg-yellow-50 p-3 rounded-lg ml-6">
                    <Text className="text-gray-700">{item.details}</Text>
                  </View>
                </View>
              ))}
            </View>
          }
        >
          {feedback.recommendations.map((recommendation, index) => (
            <View key={index} className="flex-row items-start mb-2">
              <MaterialIcons name="star" size={20} color="#eab308" className="mt-0.5" />
              <Text className="ml-2 text-gray-700 flex-1">{recommendation}</Text>
            </View>
          ))}
        </Panel>
      </View>
    </ScreenContainer>
  );
};

export default AIHelperScreen; 