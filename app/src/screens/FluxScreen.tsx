import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFeed, useLeagues, useWindows } from '../api/hooks';
import type { LeagueId, TransferCard as TransferCardData, WindowId } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { HeaderGradient } from '../components/HeaderGradient';
import { LeagueChipRow } from '../components/LeagueChipRow';
import { ErrorView, LoadingView } from '../components/ScreenState';
import { TransferCard } from '../components/TransferCard';
import { TypeFilterRow, type TransferType } from '../components/TypeFilterRow';
import type { FluxStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

type Props = NativeStackScreenProps<FluxStackParamList, 'FluxHome'>;

function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Le Flux ne montre que le mercato en cours — pas de sélecteur de fenêtre ici
 * (contrairement à l'onglet Ligues, qui garde le sien pour consulter les
 * mercatos passés). La fenêtre "live" est déduite de /windows plutôt que
 * figée en dur, pour suivre automatiquement le changement de saison.
 */
export function FluxScreen({ navigation }: Props) {
  const [league, setLeague] = useState<LeagueId | undefined>(undefined);
  const [type, setType] = useState<TransferType | undefined>(undefined);
  const [recherche, setRecherche] = useState('');

  const windowsQuery = useWindows();
  const leaguesQuery = useLeagues();
  const liveWindow = windowsQuery.data?.find((w) => w.live);
  const windowId: WindowId = liveWindow?.id ?? 'e26';
  const feedQuery = useFeed(windowId, league, type);

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
        <View>
          <Text style={styles.kicker}>Marché des transferts</Text>
          <Text style={styles.title}>En direct</Text>
        </View>

        {leaguesQuery.data && (
          <LeagueChipRow leagues={leaguesQuery.data} value={league} onChange={setLeague} />
        )}
        <TypeFilterRow value={type} onChange={setType} />
        <TextInput
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Rechercher un joueur ou un club…"
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
        />
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
              : 'La synchronisation avec les sources réelles tourne en tâche de fond (quota limité) — reviens un peu plus tard, ou change de championnat.'
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
  kicker: { fontFamily: manrope(700), fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textFaint },
  title: { fontFamily: manrope(800), fontSize: 26, letterSpacing: -0.5, color: colors.textPrimary, lineHeight: 29 },
  searchInput: {
    height: 42, borderRadius: 11, borderWidth: 1, borderColor: colors.borderInput,
    backgroundColor: colors.bgInset, paddingHorizontal: 13, fontFamily: manrope(600),
    fontSize: 13.5, color: colors.textPrimary,
  },
  list: { padding: 16, gap: 13 },
});
