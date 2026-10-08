import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNour } from '../_layout';

export default function TabsLayout() {
  const { theme } = useNour();
  const opts = {
    headerShown: false,
    tabBarActiveTintColor: theme.gold,
    tabBarInactiveTintColor: theme.muted,
    tabBarStyle: {
      position: 'absolute' as const,
      left: 12,
      right: 12,
      bottom: 12,
      height: 68,
      borderRadius: 24,
      borderTopWidth: 1,
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.card,
      paddingBottom: 7,
      paddingTop: 5,
    },
    tabBarLabelStyle: { fontSize: 9, fontWeight: '700' as const },
  };
  const icon = (focused: boolean, name: keyof typeof Ionicons.glyphMap) => <Ionicons name={name} size={21} color={focused ? theme.gold : theme.muted} />;
  return (
    <Tabs screenOptions={opts}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ focused }) => icon(focused, focused ? 'home' : 'home-outline') }} />
      <Tabs.Screen name="quran" options={{ title: 'Coran', tabBarIcon: ({ focused }) => icon(focused, focused ? 'book' : 'book-outline') }} />
      <Tabs.Screen name="prayer" options={{ title: 'Prière', tabBarIcon: ({ focused }) => icon(focused, focused ? 'time' : 'time-outline') }} />
      <Tabs.Screen name="mosques" options={{ title: 'Mosquées', tabBarIcon: ({ focused }) => icon(focused, focused ? 'location' : 'location-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ focused }) => icon(focused, focused ? 'person' : 'person-outline') }} />
    </Tabs>
  );
}
