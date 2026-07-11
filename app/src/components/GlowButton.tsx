import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, gradients } from '../theme/colors';
import { manrope } from '../theme/typography';

interface GlowButtonProps {
  label: string;
  onPress: () => void;
  active?: boolean;
  activeLabel?: string;
}

/** Primary CTA — amber gradient with a soft halo glow when idle; flips to a quiet "confirmed" state once active. */
export function GlowButton({ label, onPress, active, activeLabel }: GlowButtonProps) {
  if (active) {
    return (
      <Pressable
        onPress={onPress}
        style={styles.activeButton}
        accessibilityRole="button"
        accessibilityState={{ selected: true }}
      >
        <Text style={styles.activeLabel}>✓ {activeLabel ?? label}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <LinearGradient colors={gradients.amber} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.amber,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  label: { fontFamily: manrope(800), fontSize: 15, color: colors.amberInk, letterSpacing: 0.2 },
  activeButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76,195,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(76,195,138,0.4)',
  },
  activeLabel: { fontFamily: manrope(800), fontSize: 15, color: colors.green, letterSpacing: 0.2 },
});
