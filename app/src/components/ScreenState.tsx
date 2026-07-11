import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.amber} size="large" />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Impossible de charger les données</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retry} accessibilityRole="button">
          <Text style={styles.retryLabel}>Réessayer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  title: { fontFamily: manrope(700), fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  message: { fontFamily: manrope(500), fontSize: 12.5, color: colors.textFaint, textAlign: 'center' },
  retry: {
    marginTop: 6, height: 44, paddingHorizontal: 18, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(245,179,1,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  retryLabel: { fontFamily: manrope(700), fontSize: 13, color: colors.amber },
});
