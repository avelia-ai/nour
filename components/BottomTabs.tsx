import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { Tabs } from 'expo-router';

export function tabOptions(theme: Theme) {
  return {
    headerShown: false,
    tabBarShowLabel: true,
    tabBarActiveTintColor: theme.gold,
    tabBarInactiveTintColor: theme.muted,
    tabBarStyle: {
      position: 'absolute' as const,
      left: 12,
      right: 12,
      bottom: 12,
      height: 70,
      borderRadius: 24,
      borderTopWidth: 1,
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.card,
      paddingBottom: 8,
      paddingTop: 6,
    },
    tabBarLabelStyle: { fontSize: 9, fontWeight: '700' as const },
    tabBarIconStyle: { marginTop: 2 },
  };
}

export function Icon({ name, color, size = 21 }: { name: keyof typeof Ionicons.glyphMap; color: string; size?: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}
