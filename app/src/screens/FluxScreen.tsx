import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFeed, useLeagues, useWindows } from '../api/hooks';
import type { LeagueId, TransferCard as TransferCardData } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { HeaderGradient } from '../components/HeaderGradient';
import { LeagueChipRow } from '../components/LeagueChipRow';
import { ErrorView, LoadingView } from '../components/ScreenState';
import { TransferCard } from '../components/TransferCard';
import { WindowSelector } from '../components/WindowSelector';
import type { FluxStackParamList } from '../navigation/types';
import { useWindowState } from '../storage/WindowProvider';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

type Props = NativeStackScreenProps<FluxStackParamList, 'FluxHome'>;

function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function FluxScreen({ navigation }: Props) {
  const { window, setWindow } = useWindowState();
  const [league, setLeague] = useState<LeagueId | undefined>(undefined);
  const [recherche, setRecherche] = useState('');

  const windowsQuery = useWindows();
  const leaguesQuery = useLeagues();
  const feedQuery = useFeed(window, league);

  const activeWindow = windowsQuery.data?.find((w) => w.id === window);
  const live = activeWindow?.live ?? true;

  const resultats = useMemo(() => {
    if (!feedQuery.data) return feedQuery.data;
    const q = normaliser(recherche.trim());
    if (!q) return feedQuery.data;
    return feedQuery.data.filter(
      (t: TransferCardData) =>
        normaliser(t.joueur).includes(q) || normaliser(t.from.name).includes(q) || normaliser(t.to.name).includes(q)
    );
  }, [feedQuery.data, recherche]);

  return (
    <View style={styles.screen}>
      <HeaderGradient strong={false} style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleTextWrap}>
            <Text style={styles.kicker}>{live ? 'Marché des transferts' : `Archives · ${activeWindow?.full ?? ''}`}</Text>
            <Text style={styles.title}>{live ? 'En direct' : activeWindow?.full ?? ''}</Text>
          </View>
          <View style={styles.windowBadge}>
            <View style={[styles.windowDot, { backgroundColor: live ? colors.amber : colors.textFaint }]} />
            <Text style={styles.windowBadgeText}>{activeWindow?.label ?? ''}</Text>
          </View>
        </View>

        {windowsQuery.data && (
          <WindowSelector windows={windowsQuery.data} selected={window} onSelect={setWindow} />
        )}

        {!live && (
          <View style={styles.closedBanner}>
            <Text style={styles.closedCheck}>✓</Text>
            <Text style={styles.closedText}>Mercato clôturé — transferts officialisés, aucune rumeur.</Text>
          </View>
        )}

        {leaguesQuery.data && (
          <LeagueChipRow leagues={leaguesQuery.data} value={league} onChange={setLeague} />
        )}
        {live && (
          <TextInput
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Rechercher un joueur ou un club…"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
          />
        )}
      </HeaderGradient>

      {feedQuery.isLoading ? (
        <LoadingView />
      ) : feedQuery.isError ? (
        <ErrorView message={(feedQuery.error as Error).message} onRetry={() => feedQuery.refetch()} />
      ) : resultats && resultats.length === 0 ? (
        <EmptyState
          glyph="⏳"
          title={recherche.trim() ? 'Aucun résultat' : "Aucun transfert pour l'instant"}
          description={
            recherche.trim()
              ? 'Aucun joueur ou club ne correspond à ta recherche.'
              : 'La synchronisation avec les sources réelles tourne en tâche de fond (quota limité) — reviens un peu plus tard, ou change de fenêtre/championnat.'
          }
        />
      ) : (
        <FlatList
          data={resultats}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TransferCard transfer={item} onPress={() => navigation.navigate('TransferDetail', { id: item.id, backLabel: 'Flux' })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  titleTextWrap: { minWidth: 0, flexShrink: 1 },
  kicker: { fontFamily: manrope(700), fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textFaint },
  title: { fontFamily: manrope(800), fontSize: 26, letterSpacing: -0.5, color: colors.textPrimary, lineHeight: 29 },
  windowBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 11,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245,179,1,0.35)', backgroundColor: 'rgba(245,179,1,0.08)',
  },
  windowDot: { width: 6, height: 6, borderRadius: 3 },
  windowBadgeText: { fontFamily: manrope(700), fontSize: 12, color: colors.amberLight },
  closedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: colors.border,
    borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7,
  },
  closedCheck: { color: colors.green, fontSize: 12 },
  closedText: { fontFamily: manrope(600), fontSize: 11, color: colors.textMuted, flexShrink: 1 },
  searchInput: {
    height: 42, borderRadius: 11, borderWidth: 1, borderColor: colors.borderInput,
    backgroundColor: colors.bgInset, paddingHorizontal: 13, fontFamily: manrope(600),
    fontSize: 13.5, color: colors.textPrimary,
  },
  list: { padding: 16, gap: 13 },
});
