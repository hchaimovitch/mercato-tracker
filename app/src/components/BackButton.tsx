import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

interface BackButtonProps {
  onPress: () => void;
  label?: string;
}

/** 44x44 minimum tappable back control; optionally shows a trailing label (used on the detail screen). */
export function BackButton({ onPress, label }: BackButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.button, label ? styles.withLabel : undefined]} accessibilityRole="button" accessibilityLabel="Retour">
      <Text style={styles.chevron}>‹</Text>
      {label && <Text style={styles.label} numberOfLines={1}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: 1, borderColor: colors.borderInput,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  withLabel: { width: undefined, paddingHorizontal: 14 },
  chevron: { fontSize: 17, color: colors.textSecondary },
  label: { fontFamily: manrope(700), fontSize: 13, color: colors.textSecondary },
});
