import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Theme } from '@/constants/theme';

export function OrientalFrame({
  theme,
}: {
  theme: Theme;
}) {
  return (
    <View
      pointerEvents="none"
      style={styles.overlay}
    >
      <View
        style={[
          styles.outer,
          {
            borderColor: theme.gold,
          },
        ]}
      />

      <View
        style={[
          styles.inner,
          {
            borderColor: theme.gold,
          },
        ]}
      />

      <Corner position="topLeft" theme={theme} />
      <Corner position="topRight" theme={theme} />
      <Corner position="bottomLeft" theme={theme} />
      <Corner position="bottomRight" theme={theme} />

      <View
        style={[
          styles.archOuter,
          {
            borderColor: theme.gold,
          },
        ]}
      />

      <View
        style={[
          styles.archInner,
          {
            borderColor: theme.goldSoft,
          },
        ]}
      />
    </View>
  );
}

function Corner({
  position,
  theme,
}: {
  position:
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight';
  theme: Theme;
}) {
  const positionStyle =
    position === 'topLeft'
      ? styles.topLeft
      : position === 'topRight'
        ? styles.topRight
        : position === 'bottomLeft'
          ? styles.bottomLeft
          : styles.bottomRight;

  return (
    <View
      style={[
        styles.corner,
        positionStyle,
        {
          borderColor: theme.gold,
        },
      ]}
    >
      <View
        style={[
          styles.diamond,
          {
            backgroundColor: theme.gold,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },

  outer: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 8,
    bottom: 8,
    borderWidth: 1,
    borderRadius: 34,
    opacity: 0.09,
  },

  inner: {
    position: 'absolute',
    left: 13,
    right: 13,
    top: 13,
    bottom: 13,
    borderWidth: 1,
    borderRadius: 30,
    opacity: 0.035,
  },

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 1,
  },

  topLeft: {
    left: 18,
    top: 18,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 14,
  },

  topRight: {
    right: 18,
    top: 18,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 14,
  },

  bottomLeft: {
    left: 18,
    bottom: 18,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 14,
  },

  bottomRight: {
    right: 18,
    bottom: 18,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 14,
  },

  diamond: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 5,
    height: 5,
    marginLeft: -2.5,
    marginTop: -2.5,
    borderRadius: 1,
    opacity: 0.38,
    transform: [{ rotate: '45deg' }],
  },

  archOuter: {
    position: 'absolute',
    width: 190,
    height: 110,
    top: 42,
    left: '50%',
    marginLeft: -95,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 95,
    borderTopRightRadius: 95,
    opacity: 0.035,
  },

  archInner: {
    position: 'absolute',
    width: 160,
    height: 92,
    top: 51,
    left: '50%',
    marginLeft: -80,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    opacity: 0.025,
  },
});
