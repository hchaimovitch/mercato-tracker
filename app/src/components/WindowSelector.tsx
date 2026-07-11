import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Window, WindowId } from '../api/types';
import { colors, gradients, shadowAmber } from '../theme/colors';
import { manrope } from '../theme/typography';

interface WindowSelectorProps {
  windows: Window[];
  selected: WindowId;
  onSelect: (id: WindowId) => void;
}

export function WindowSelector({ windows, selected, onSelect }: WindowSelectorProps) {
  return (
    <View style={styles.track}>
      {windows.map((w) => {
        const active = w.id === selected;
        return (
          <Pressable
            key={w.id}
            onPress={() => onSelect(w.id)}
            style={styles.buttonWrap}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {active ? (
              <LinearGradient
                colors={gradients.amber}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, shadowAmber]}
              >
                <Text style={[styles.label, { color: colors.amberInk }]}>{w.label}</Text>
                <Text style={[styles.sub, { color: colors.amberInk }]}>{w.sub}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.button}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{w.label}</Text>
                <Text style={[styles.sub, { color: colors.textMuted }]}>{w.sub}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: colors.bgInset,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    padding: 4,
  },
  buttonWrap: { flex: 1 },
  button: {
    height: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  label: { fontFamily: manrope(800), fontSize: 12 },
  sub: { fontFamily: manrope(700), fontSize: 8.5, letterSpacing: 0.3, opacity: 0.85 },
});
