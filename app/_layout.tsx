import React, { createContext, useContext, useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { dark, light, Theme } from '@/constants/theme';

type NourContext = { theme: Theme; darkMode: boolean; toggleTheme: () => void };
const Context = createContext<NourContext | null>(null);
export function useNour() {
  const value = useContext(Context);
  if (!value) throw new Error('useNour must be used inside Nour provider');
  return value;
}

export default function RootLayout() {
  const system = useColorScheme();
  const [darkMode, setDarkMode] = useState(system === 'dark');
  const value = useMemo(() => ({ theme: darkMode ? dark : light, darkMode, toggleTheme: () => setDarkMode(v => !v) }), [darkMode]);
  return (
    <Context.Provider value={value}>
      <Stack screenOptions={{ headerShown: false }} />
    </Context.Provider>
  );
}
