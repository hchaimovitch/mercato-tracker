import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { HeaderGradient } from '../components/HeaderGradient';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

export function AlertesScreen() {
  return (
    <View style={styles.screen}>
      <HeaderGradient strong style={styles.header}>
        <Text style={styles.kicker}>Mercato Tracker</Text>
        <Text style={styles.title}>Alertes</Text>
      </HeaderGradient>

      <EmptyState
        glyph="◉"
        title="Pas d'alerte active"
        description="Crée une alerte sur un joueur ou un club pour être notifié à chaque changement de statut."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 14 },
  kicker: { fontFamily: manrope(700), fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textFaint },
  title: { fontFamily: manrope(800), fontSize: 26, letterSpacing: -0.5, color: colors.textPrimary, lineHeight: 29 },
});
