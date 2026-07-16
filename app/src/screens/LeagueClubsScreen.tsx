import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLeagueView, useWindows } from '../api/hooks';
import { BackButton } from '../components/BackButton';
import { ClubBadge } from '../components/ClubBadge';
import { EmptyState } from '../components/EmptyState';
import { HeaderGradient } from '../components/HeaderGradient';
import { ErrorView, LoadingView } from '../components/ScreenState';
import type { LiguesStackParamList } from '../navigation/types';
import { useWindowState } from '../storage/WindowProvider';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

type Props = NativeStackScreenProps<LiguesStackParamList, 'LeagueClubs'>;

export function LeagueClubsScreen({ route, navigation }: Props) {
  const { leagueId } = route.params;
  const { window } = useWindowState();
  const windowsQuery = useWindows();
  const leagueQuery = useLeagueView(leagueId, window);
  const activeWindow = windowsQuery.data?.find((w) => w.id === window);

  if (leagueQuery.isLoading) return <LoadingView />;
  if (leagueQuery.isError || !leagueQuery.data) {
    return <ErrorView message={(leagueQuery.error as Error)?.message ?? 'Ligue introuvable'} onRetry={() => leagueQuery.refetch()} />;
  }
  const lg = leagueQuery.data;

  return (
    <View style={styles.screen}>
      <HeaderGradient strong style={styles.header}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={[styles.badge, { backgroundColor: lg.color }]}>
            <Text style={styles.badgeText}>{lg.short}</Text>
          </View>
          <View style={styles.titleTextWrap}>
            <Text style={styles.title}>{lg.name}</Text>
            <Text style={styles.subtitle}>{activeWindow?.full ?? ''} · {lg.clubCount} clubs actifs</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statTile, { borderColor: 'rgba(76,195,138,0.25)' }]}>
            <Text style={[styles.statLabel, { color: colors.green }]}>↓ ARRIVÉES</Text>
            <Text style={styles.statValue}>{lg.arrTotal}</Text>
          </View>
          <View style={[styles.statTile, { borderColor: 'rgba(245,179,1,0.25)' }]}>
            <Text style={[styles.statLabel, { color: colors.amberLight }]}>↑ DÉPARTS</Text>
            <Text style={styles.statValue}>{lg.depTotal}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statLabel, { color: colors.textFaint }]}>VOLUME</Text>
            <Text style={[styles.statValue, { color: colors.amber }]}>{lg.volume}</Text>
          </View>
        </View>
      </HeaderGradient>

      <FlatList
        data={lg.clubs}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.sectionLabel}>CLUBS · TRIÉS PAR ACTIVITÉ</Text>}
        ListEmptyComponent={
          <EmptyState glyph="⏳" title="Aucune activité pour l'instant" description="Ce championnat n'a pas encore de mouvement synchronisé sur cette fenêtre." />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('ClubDetail', { clubId: item.id })}
            accessibilityRole="button"
          >
            <ClubBadge abbr={item.abbr} color={item.color} logoUrl={item.logoUrl} size={42} radius={11} />
            <View style={styles.rowBody}>
              <Text style={styles.rowName}>{item.name}</Text>
              <View style={styles.rowMetaRow}>
                <Text style={styles.arrText}>↓ {item.arr} <Text style={styles.metaMuted}>arr.</Text></Text>
                <Text style={styles.depText}>↑ {item.dep} <Text style={styles.metaMuted}>dép.</Text></Text>
              </View>
            </View>
            <View style={styles.netWrap}>
              <Text style={styles.netLabel}>SOLDE</Text>
              <Text style={[styles.netValue, { color: item.netColor }]}>{item.netStr}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  badge: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: manrope(800), fontSize: 12, color: colors.bgApp },
  titleTextWrap: { minWidth: 0, flexShrink: 1 },
  title: { fontFamily: manrope(800), fontSize: 20, letterSpacing: -0.4, color: colors.textPrimary, lineHeight: 22 },
  subtitle: { fontFamily: manrope(600), fontSize: 11, color: colors.textFaint },
  statsRow: { flexDirection: 'row', gap: 8 },
  statTile: {
    flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9,
  },
  statLabel: { fontFamily: manrope(700), fontSize: 9.5, letterSpacing: 0.6 },
  statValue: { fontFamily: manrope(800), fontSize: 19, letterSpacing: -0.4, color: colors.textPrimary, marginTop: 1 },
  list: { padding: 16, gap: 9 },
  sectionLabel: { fontFamily: manrope(700), fontSize: 11, letterSpacing: 1, color: colors.textFaint, marginBottom: 2 },
  row: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 15,
    padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: manrope(800), fontSize: 15, color: colors.textPrimary },
  rowMetaRow: { flexDirection: 'row', gap: 9, marginTop: 3 },
  arrText: { fontFamily: manrope(700), fontSize: 11, color: colors.green },
  depText: { fontFamily: manrope(700), fontSize: 11, color: colors.amberLight },
  metaMuted: { color: colors.textFaint, fontFamily: manrope(600) },
  netWrap: { alignItems: 'flex-end' },
  netLabel: { fontFamily: manrope(700), fontSize: 9, letterSpacing: 0.5, color: colors.textFaint },
  netValue: { fontFamily: manrope(800), fontSize: 13, letterSpacing: -0.3 },
  chevron: { fontSize: 16, fontFamily: manrope(700), color: colors.amber },
});
