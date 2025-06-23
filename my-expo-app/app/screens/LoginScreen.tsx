import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, error } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Қате', 'Қолданушы аты мен құпия сөзді енгізіңіз');
      return;
    }
    
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    
    if (!success && !error) {
      Alert.alert('Қате', 'Жүйеге кіру кезінде қате орын алды');
    }
  };
  
  const navigateToRegister = () => {
    navigation.navigate('Register');
  };
  
  return (
    <ScreenContainer scroll keyboardAvoiding className="bg-white p-4">
      <View className="flex-1 justify-center py-10">
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-blue-600">ЕНТ-ға Дайындық</Text>
          <Text className="text-lg text-gray-600 mt-2">Біліміңді тексер</Text>
        </View>
        
        <View className="mb-6">
          <Input
            label="Қолданушы аты"
            placeholder="Қолданушы атыңызды енгізіңіз"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <Input
            label="Құпия сөз"
            placeholder="Құпия сөзіңізді енгізіңіз"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          {error && (
            <Text className="text-red-500 mb-4">{error}</Text>
          )}
          
          <Button
            title="Кіру"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            className="mt-2"
          />
        </View>
        
        <View className="flex-row justify-center mt-4">
          <Text className="text-gray-600">Тіркелмедіңіз бе? </Text>
          <Pressable onPress={navigateToRegister}>
            <Text className="text-blue-600 font-bold">Тіркелу</Text>
          </Pressable>
        </View>
        
        <View className="items-center mt-8 mb-4">
          <Text className="text-gray-500 text-sm text-center px-6">
            ЕНТ-ға дайындалу үшін ең жақсы қосымша. Тесттерді шешіп, жетістіктеріңізді бақылаңыз.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
};

export default LoginScreen; 