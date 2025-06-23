import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  keyboardAvoiding?: boolean;
  extraTopPadding?: boolean;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({ 
  children, 
  scroll = false,
  className = '',
  keyboardAvoiding = false,
  extraTopPadding = false
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  // Calculate paddings based on safe area
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 20;
  const topPadding = extraTopPadding ? Math.max(insets.top, 20) : 0;
  
  const containerStyle = { 
    flex: 1,
    paddingTop: topPadding,
  };
  
  const content = scroll ? (
    <ScrollView 
      style={containerStyle}
      contentContainerStyle={[
        styles.scrollContent, 
        { 
          paddingBottom: bottomPadding + 80, // Add extra padding at bottom for better scrolling
        }
      ]} 
      className={className}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
    >
      {children}
    </ScrollView>
  ) : (
    <View 
      style={[containerStyle, { paddingBottom: bottomPadding }]} 
      className={`flex-1 ${className}`}
    >
      {children}
    </View>
  );
  
  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }
  
  return content;
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  }
});

export default ScreenContainer; 