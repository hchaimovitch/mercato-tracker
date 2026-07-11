import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { League, LeagueId } from '../api/types';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

interface LeagueChipRowProps {
  leagues: League[];
  value: LeagueId | undefined;
  onChange: (id: LeagueId | undefined) => void;
}

const ALL_COLOR = colors.amber;

export function LeagueChipRow({ leagues, value, onChange }: LeagueChipRowProps) {
  const chips: { id: LeagueId | undefined; name: string; color: string }[] = [
    { id: undefined, name: 'Tous', color: ALL_COLOR },
    ...leagues.map((l) => ({ id: l.id, name: l.name, color: l.color })),
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((chip) => {
        const active = chip.id === value;
        return (
          <Pressable
            key={chip.id ?? 'all'}
            onPress={() => onChange(chip.id)}
            style={styles.chip}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {active && <View style={styles.activeRing} />}
            <View style={[styles.dot, { backgroundColor: chip.color }]} />
            <Text style={styles.label} numberOfLines={1}>
              {chip.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    position: 'relative',
    height: 44,
    paddingHorizontal: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgChip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeRing: {
    position: 'absolute',
    top: -1, bottom: -1, left: -1, right: -1,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.amber,
    shadowColor: colors.amber,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: manrope(600), fontSize: 13, color: colors.textSecondary },
});
