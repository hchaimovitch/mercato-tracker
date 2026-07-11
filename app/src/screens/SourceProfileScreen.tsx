import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSourceProfile } from '../api/hooks';
import { BackButton } from '../components/BackButton';
import { HeaderGradient } from '../components/HeaderGradient';
import { ErrorView, LoadingView } from '../components/ScreenState';
import type { DetailStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

type Props = NativeStackScreenProps<DetailStackParamList, 'SourceProfile'>;

export function SourceProfileScreen({ route, navigation }: Props) {
  const { name, official } = route.params;
  const profileQuery = useSourceProfile(name, official);

  if (profileQuery.isLoading) return <LoadingView />;
  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorView message={(profileQuery.error as Error)?.message ?? 'Source introuvable'} onRetry={() => profileQuery.refetch()} />;
  }
  const s = profileQuery.data;

  return (
    <View style={styles.screen}>
      <HeaderGradient strong style={styles.header}>
        <View style={styles.topRow}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.kicker}>Profil de source</Text>
        </View>
      </HeaderGradient>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.identityRow}>
          <View style={styles.glyphWrap}>
            <Text style={{ color: s.typeColor, fontSize: 22, fontFamily: manrope(800) }}>{s.typeGlyph}</Text>
          </View>
          <View style={{ minWidth: 0, flexShrink: 1 }}>
            <Text style={styles.name}>{s.name}</Text>
            <Text style={styles.typeLabel}>{s.typeLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>FIABILITÉ HISTORIQUE</Text>
          <View style={styles.reliabilityRow}>
            <Text style={styles.reliabilityValue}>{s.reliability}</Text>
            <Text style={styles.reliabilityPct}>%</Text>
          </View>
          <Text style={styles.trackedLabel}>{s.trackedLabel}</Text>
        </View>

        <View style={styles.cardAlt}>
          <Text style={styles.sectionLabel}>CATÉGORIE</Text>
          <View style={styles.categoryRow}>
            <Text style={{ color: s.typeColor, fontSize: 14 }}>{s.typeGlyph}</Text>
            <Text style={styles.categoryLabel}>{s.typeLabel}</Text>
          </View>
          <Text style={styles.typeDesc}>{s.typeDesc}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  kicker: { fontFamily: manrope(700), fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textFaint },
  body: { padding: 16, paddingTop: 20, gap: 16 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  glyphWrap: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(245,179,1,0.1)',
    borderWidth: 1, borderColor: 'rgba(245,179,1,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  name: { fontFamily: manrope(800), fontSize: 20, letterSpacing: -0.3, color: colors.textPrimary, lineHeight: 22 },
  typeLabel: { fontFamily: manrope(600), fontSize: 12, color: colors.textFaint, marginTop: 2 },
  card: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 9 },
  cardAlt: { backgroundColor: colors.bgCardAlt, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 14, padding: 14, gap: 9 },
  sectionLabel: { fontFamily: manrope(700), fontSize: 11, letterSpacing: 1, color: colors.textFaint },
  reliabilityRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  reliabilityValue: { fontFamily: manrope(800), fontSize: 46, letterSpacing: -1.5, color: colors.textPrimary, lineHeight: 46 },
  reliabilityPct: { fontFamily: manrope(800), fontSize: 20, color: colors.textMuted },
  trackedLabel: { fontFamily: manrope(600), fontSize: 12.5, color: colors.textMuted },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryLabel: { fontFamily: manrope(700), fontSize: 13, color: colors.textPrimary },
  typeDesc: { fontFamily: manrope(500), fontSize: 11.5, color: colors.textFaint, lineHeight: 17, marginTop: 2 },
});
