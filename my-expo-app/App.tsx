import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './app/contexts/AuthContext';
import AppNavigator from './app/navigation';
import { initializeApiConfig, setApiConfig } from './app/services/api';

import './global.css';

export default function App() {
  useEffect(() => {
    const setupApi = async () => {
      try {
        // Initialize API configuration properly
        await initializeApiConfig();
        
        // Force proper API config to ensure consistent behavior
        await setApiConfig({
          auth: { useBackend: true },     // Authentication must use backend
          tests: { useBackend: false },   // Tests use local data
          aiHelper: { useBackend: false } // AI Helper uses local data
        });
        
        console.log('API configuration initialized successfully');
      } catch (error) {
        console.error('Failed to initialize API config:', error);
      }
    };
    
    setupApi();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
