import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

export type TransferType = 'officiel' | 'rumeur';

interface TypeFilterRowProps {
  value: TransferType | undefined;
  onChange: (value: TransferType | undefined) => void;
}

const OPTIONS: { id: TransferType | undefined; label: string }[] = [
  { id: undefined, label: 'Tous' },
  { id: 'officiel', label: 'Réalisés' },
  { id: 'rumeur', label: 'Rumeurs' },
];

export function TypeFilterRow({ value, onChange }: TypeFilterRowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {OPTIONS.map((opt) => {
        const active = opt.id === value;
        return (
          <Pressable
            key={opt.id ?? 'all'}
            onPress={() => onChange(opt.id)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { borderColor: colors.amber, backgroundColor: 'rgba(245,179,1,0.12)' },
  label: { fontFamily: manrope(600), fontSize: 12, color: colors.textSecondary },
  labelActive: { color: colors.amberLight },
});
