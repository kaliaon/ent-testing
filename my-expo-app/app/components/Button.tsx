import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  fullWidth = false,
  disabled,
  className,
  ...rest
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 border-blue-600';
      case 'secondary':
        return 'bg-gray-600 border-gray-600';
      case 'outline':
        return 'bg-transparent border-blue-600';
      case 'danger':
        return 'bg-red-600 border-red-600';
      default:
        return 'bg-blue-600 border-blue-600';
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return 'text-blue-600';
      default:
        return 'text-white';
    }
  };

  const baseStyle = 'py-3 px-6 rounded-lg border flex-row justify-center items-center';
  const widthStyle = fullWidth ? 'w-full' : '';
  const disabledStyle = disabled || loading ? 'opacity-50' : '';
  
  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`${baseStyle} ${getVariantStyle()} ${widthStyle} ${disabledStyle} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#3b82f6' : '#fff'} />
      ) : (
        <Text className={`font-bold text-center ${getTextStyle()}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button; 