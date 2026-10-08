import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Theme } from '@/constants/theme';

export function PremiumCard({
  theme,
  children,
  style,
}: {
  theme: Theme;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.line,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.ornament,
          {
            borderColor: theme.gold,
          },
        ]}
      />

      <View
        pointerEvents="none"
        style={[
          styles.ornamentDot,
          {
            backgroundColor: theme.gold,
          },
        ]}
      />

      {children}
    </View>
  );
}

export function Eyebrow({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <Text
      style={[
        styles.eyebrow,
        {
          color: theme.gold,
        },
      ]}
    >
      {children}
    </Text>
  );
}

export function Arabic({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <Text
      style={[
        styles.arabic,
        {
          color: theme.gold,
        },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 19,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.075,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 2,
  },

  ornament: {
    position: 'absolute',
    width: 30,
    height: 30,
    right: -15,
    top: -15,
    borderWidth: 1,
    borderRadius: 15,
    opacity: 0.12,
  },

  ornamentDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    right: 9,
    top: 9,
    borderRadius: 2,
    opacity: 0.23,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },

  arabic: {
    fontSize: 24,
  },
});
