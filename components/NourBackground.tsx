import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { OrientalFrame } from '@/components/OrientalFrame';

export function NourBackground({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.bg,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.glowTop,
          {
            backgroundColor: theme.gold,
          },
        ]}
      />

      <View
        pointerEvents="none"
        style={[
          styles.glowRight,
          {
            backgroundColor: theme.emerald,
          },
        ]}
      />

      <View
        pointerEvents="none"
        style={[
          styles.glowBottom,
          {
            backgroundColor: theme.goldSoft,
          },
        ]}
      />

      <View
        pointerEvents="none"
        style={[
          styles.geometry,
          {
            borderColor: theme.gold,
          },
        ]}
      />

      <View
        pointerEvents="none"
        style={[
          styles.geometrySmall,
          {
            borderColor: theme.gold,
          },
        ]}
      />

      {/* Décor uniquement : il ne reçoit aucun geste */}
      <OrientalFrame theme={theme} />

      {/* Contenu interactif au-dessus du décor */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },

  content: {
    flex: 1,
    zIndex: 1,
  },

  glowTop: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 330,
    top: -190,
    right: -100,
    opacity: 0.12,
  },

  glowRight: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 280,
    top: 300,
    right: -215,
    opacity: 0.065,
  },

  glowBottom: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 250,
    bottom: -170,
    left: -150,
    opacity: 0.045,
  },

  geometry: {
    position: 'absolute',
    width: 235,
    height: 235,
    borderRadius: 118,
    borderWidth: 1,
    right: -118,
    top: 150,
    opacity: 0.045,
    transform: [{ rotate: '45deg' }],
  },

  geometrySmall: {
    position: 'absolute',
    width: 165,
    height: 165,
    borderRadius: 83,
    borderWidth: 1,
    right: -82,
    top: 185,
    opacity: 0.035,
    transform: [{ rotate: '45deg' }],
  },
});
