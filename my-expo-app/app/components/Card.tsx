import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface CardProps extends TouchableOpacityProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  onPress,
  className,
  ...rest
}) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 ${className}`}
      onPress={onPress}
      {...rest}
    >
      {title && <Text className="text-lg font-bold mb-1">{title}</Text>}
      {subtitle && <Text className="text-gray-600 mb-3">{subtitle}</Text>}
      {children}
    </CardContainer>
  );
};

export default Card; 