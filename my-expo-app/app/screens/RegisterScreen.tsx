import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, error } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };
  
  const handleRegister = async () => {
    // Validation
    if (!fullName || !username || !email || !password) {
      Alert.alert('Қате', 'Барлық өрістерді толтырыңыз');
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert('Қате', 'Дұрыс email енгізіңіз');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Қате', 'Құпия сөздер сәйкес келмейді');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Қате', 'Құпия сөз кемінде 6 таңбадан тұруы керек');
      return;
    }
    
    setLoading(true);
    const success = await register({ fullName, username, email, password });
    setLoading(false);
    
    if (!success && !error) {
      Alert.alert('Қате', 'Тіркелу кезінде қате орын алды');
    }
  };
  
  const navigateToLogin = () => {
    navigation.navigate('Login');
  };
  
  return (
    <ScreenContainer scroll keyboardAvoiding className="bg-white p-4">
      <View className="flex-1 justify-center py-8">
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-blue-600">Тіркелу</Text>
          <Text className="text-lg text-gray-600 mt-2">ЕНТ-ға Дайындық</Text>
        </View>
        
        <View className="mb-4">
          <Input
            label="Толық аты-жөні"
            placeholder="Толық аты-жөніңізді енгізіңіз"
            value={fullName}
            onChangeText={setFullName}
          />
          
          <Input
            label="Қолданушы аты"
            placeholder="Қолданушы атыңызды енгізіңіз"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <Input
            label="Email"
            placeholder="Email-іңізді енгізіңіз"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Input
            label="Құпия сөз"
            placeholder="Құпия сөзіңізді енгізіңіз"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Input
            label="Құпия сөзді растау"
            placeholder="Құпия сөзіңізді қайта енгізіңіз"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          
          {error && (
            <Text className="text-red-500 mb-4">{error}</Text>
          )}
          
          <Button
            title="Тіркелу"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            className="mt-2"
          />
        </View>
        
        <View className="flex-row justify-center mt-4 mb-4">
          <Text className="text-gray-600">Тіркелгіңіз бар ма? </Text>
          <Pressable onPress={navigateToLogin}>
            <Text className="text-blue-600 font-bold">Кіру</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
};

export default RegisterScreen; 