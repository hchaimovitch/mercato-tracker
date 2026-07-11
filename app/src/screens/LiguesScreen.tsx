import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLeaguesOverview, useWindows } from '../api/hooks';
import { HeaderGradient } from '../components/HeaderGradient';
import { ErrorView, LoadingView } from '../components/ScreenState';
import { WindowSelector } from '../components/WindowSelector';
import type { LiguesStackParamList } from '../navigation/types';
import { useWindowState } from '../storage/WindowProvider';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

type Props = NativeStackScreenProps<LiguesStackParamList, 'LiguesHome'>;

export function LiguesScreen({ navigation }: Props) {
  const { window, setWindow } = useWindowState();
  const windowsQuery = useWindows();
  const overviewQuery = useLeaguesOverview(window);
  const activeWindow = windowsQuery.data?.find((w) => w.id === window);

  return (
    <View style={styles.screen}>
      <HeaderGradient strong style={styles.header}>
        <View>
          <Text style={styles.kicker}>Big 5 · {activeWindow?.full ?? ''}</Text>
          <Text style={styles.title}>Championnats</Text>
        </View>

        {windowsQuery.data && (
          <WindowSelector windows={windowsQuery.data} selected={window} onSelect={setWindow} />
        )}

        {overviewQuery.data && (
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{overviewQuery.data.totalCount}</Text>
              <Text style={styles.statLabel}>{activeWindow?.live ? 'transferts actifs' : 'transferts officialisés'}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={[styles.statValue, { color: colors.amber }]}>{overviewQuery.data.totalMoneyStr}</Text>
              <Text style={styles.statLabel}>volume total</Text>
            </View>
          </View>
        )}
      </HeaderGradient>

      {overviewQuery.isLoading ? (
        <LoadingView />
      ) : overviewQuery.isError ? (
        <ErrorView message={(overviewQuery.error as Error).message} onRetry={() => overviewQuery.refetch()} />
      ) : (
        <FlatList
          data={overviewQuery.data?.rows}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.sectionLabel}>Championnats · triés par volume</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('LeagueClubs', { leagueId: item.id })}
              accessibilityRole="button"
            >
              <View style={[styles.badge, { backgroundColor: item.color }]}>
                <Text style={styles.badgeText}>{item.short}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {item.count} transferts · <Text style={{ color: colors.amberLight }}>{item.totalStr}</Text>
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${item.barPct}%` }]} />
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 14 },
  kicker: { fontFamily: manrope(700), fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textFaint },
  title: { fontFamily: manrope(800), fontSize: 26, letterSpacing: -0.5, color: colors.textPrimary, lineHeight: 29 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statTile: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10 },
  statValue: { fontFamily: manrope(800), fontSize: 22, letterSpacing: -0.5, color: colors.textPrimary, lineHeight: 24 },
  statLabel: { fontFamily: manrope(600), fontSize: 10.5, color: colors.textFaint, marginTop: 2 },
  list: { padding: 16, gap: 10 },
  sectionLabel: { fontFamily: manrope(700), fontSize: 11, letterSpacing: 1, color: colors.textFaint, marginBottom: 2 },
  row: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 16,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  badge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: manrope(800), fontSize: 12, color: colors.bgApp },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: manrope(800), fontSize: 15, color: colors.textPrimary },
  rowMeta: { fontFamily: manrope(600), fontSize: 11.5, color: colors.textFaint, marginTop: 1 },
  barTrack: { marginTop: 8, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.amber },
  chevron: { fontSize: 16, fontFamily: manrope(700), color: colors.amber },
});
