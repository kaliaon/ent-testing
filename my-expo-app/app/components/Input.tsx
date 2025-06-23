import React from 'react';
import { TextInput, Text, View, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  ...rest
}) => {
  return (
    <View className="mb-4">
      {label && (
        <Text className="mb-2 font-medium text-gray-700">{label}</Text>
      )}
      <TextInput
        className={`w-full border rounded-lg px-4 py-3 text-gray-700 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        placeholderTextColor="#9ca3af"
        {...rest}
      />
      {error && (
        <Text className="mt-1 text-red-500 text-sm">{error}</Text>
      )}
    </View>
  );
};

export default Input; 