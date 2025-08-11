import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from 'react-native';
import { theme } from '../constants/theme';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ] as any;

  const textStyles = [
    styles.text,
    (styles as any)[`${variant}Text`],
    (styles as any)[`${size}Text`],
    (disabled || loading) && styles.disabledText,
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        ...buttonStyles,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? theme.colors.background : theme.colors.primary} 
        />
      ) : children ? (
        children
      ) : (
        <Text style={textStyles as any}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  small: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  medium: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  large: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    ...theme.typography.button,
    textAlign: 'center',
  },
  primaryText: {
    color: theme.colors.background,
  },
  secondaryText: {
    color: theme.colors.text,
  },
  dangerText: {
    color: theme.colors.background,
  },
  ghostText: {
    color: theme.colors.primary,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.6,
  },
});
