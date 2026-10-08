import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';

export function TopBar({ theme, title, arabic, onTheme }: { theme: Theme; title: string; arabic: string; onTheme: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.brandWrap}>
        <View style={[styles.mark, { backgroundColor: theme.emerald }]}>
          <Text style={[styles.star, { color: theme.goldSoft }]}>✦</Text>
        </View>
        <View>
          <View style={styles.brandRow}>
            <Text style={[styles.brand, { color: theme.ink }]}>{title}</Text>
            <Text style={[styles.arabic, { color: theme.gold }]}>{arabic}</Text>
          </View>
          <Text style={[styles.date, { color: theme.muted }]}>Mardi 6 octobre · 1448</Text>
        </View>
      </View>
      <Pressable onPress={onTheme} style={[styles.theme, { borderColor: theme.line, backgroundColor: theme.card }]}>
        <Ionicons name="contrast-outline" size={17} color={theme.gold} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  star: { fontSize: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontSize: 19, fontWeight: '800', letterSpacing: 3.5 },
  arabic: { fontSize: 21 },
  date: { marginTop: 3, fontSize: 11 },
  theme: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
