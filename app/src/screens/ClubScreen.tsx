import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useClubView, useWindows } from '../api/hooks';
import type { ClubMovement } from '../api/types';
import { BackButton } from '../components/BackButton';
import { HeaderGradient } from '../components/HeaderGradient';
import { ErrorView, LoadingView } from '../components/ScreenState';
import { SignalBadge } from '../components/SignalBadge';
import type { LiguesStackParamList } from '../navigation/types';
import { useWindowState } from '../storage/WindowProvider';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

type Props = NativeStackScreenProps<LiguesStackParamList, 'ClubDetail'>;

function MovementRow({ m, accent, preposition, onPress }: { m: ClubMovement; accent: string; preposition: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.movementRow} accessibilityRole="button">
      <View style={[styles.movementBar, { backgroundColor: accent }]} />
      <View style={[styles.movementBadge, { backgroundColor: m.otherColor }]}>
        <Text style={styles.movementBadgeText}>{m.otherAbbr}</Text>
      </View>
      <View style={styles.movementBody}>
        <Text style={styles.movementPlayer} numberOfLines={1}>{m.player}</Text>
        <Text style={styles.movementMeta} numberOfLines={1}>{m.posShort} · {preposition} {m.otherName}</Text>
      </View>
      <View style={styles.movementRight}>
        <Text style={styles.movementFee}>{m.fee}</Text>
        <SignalBadge tier={m.tier} glyphSize={10} labelSize={9.5} />
      </View>
    </Pressable>
  );
}

export function ClubScreen({ route, navigation }: Props) {
  const { abbr } = route.params;
  const { window } = useWindowState();
  const windowsQuery = useWindows();
  const clubQuery = useClubView(abbr, window);
  const activeWindow = windowsQuery.data?.find((w) => w.id === window);

  if (clubQuery.isLoading) return <LoadingView />;
  if (clubQuery.isError || !clubQuery.data) {
    return <ErrorView message={(clubQuery.error as Error)?.message ?? 'Club introuvable'} onRetry={() => clubQuery.refetch()} />;
  }
  const club = clubQuery.data;

  return (
    <View style={styles.screen}>
      <HeaderGradient strong style={styles.header}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={[styles.badge, { backgroundColor: club.color }]}>
            <Text style={styles.badgeText}>{club.abbr}</Text>
          </View>
          <View style={styles.titleTextWrap}>
            <Text style={styles.title}>{club.name}</Text>
            <Text style={styles.subtitle}>{club.leagueName} · {activeWindow?.full ?? ''}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={[styles.statLabel, { color: colors.green }]}>RECRUTEMENT</Text>
            <Text style={styles.statValue}>{club.inStr}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statLabel, { color: colors.amberLight }]}>VENTES</Text>
            <Text style={styles.statValue}>{club.outStr}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statLabel, { color: colors.textFaint }]}>SOLDE NET</Text>
            <Text style={[styles.statValue, { color: club.netColor }]}>{club.netStr}</Text>
          </View>
        </View>
      </HeaderGradient>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(76,195,138,0.14)' }]}>
              <Text style={{ color: colors.green, fontFamily: manrope(800), fontSize: 14 }}>↓</Text>
            </View>
            <Text style={styles.sectionTitle}>Arrivées</Text>
            <Text style={styles.sectionCount}>{club.arrCount}</Text>
          </View>
          {club.hasArr ? (
            club.arrivals.map((m) => (
              <MovementRow key={m.transferId} m={m} accent={colors.green} preposition="de" onPress={() => navigation.navigate('TransferDetail', { id: m.transferId, backLabel: club.name })} />
            ))
          ) : (
            <Text style={styles.emptyText}>Aucune arrivée sur cette fenêtre.</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(245,179,1,0.14)' }]}>
              <Text style={{ color: colors.amberLight, fontFamily: manrope(800), fontSize: 14 }}>↑</Text>
            </View>
            <Text style={styles.sectionTitle}>Départs</Text>
            <Text style={styles.sectionCount}>{club.depCount}</Text>
          </View>
          {club.hasDep ? (
            club.departures.map((m) => (
              <MovementRow key={m.transferId} m={m} accent={colors.amber} preposition="vers" onPress={() => navigation.navigate('TransferDetail', { id: m.transferId, backLabel: club.name })} />
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun départ sur cette fenêtre.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  badge: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: manrope(800), fontSize: 14, color: colors.textPrimary },
  titleTextWrap: { minWidth: 0, flexShrink: 1 },
  title: { fontFamily: manrope(800), fontSize: 21, letterSpacing: -0.4, color: colors.textPrimary, lineHeight: 23 },
  subtitle: { fontFamily: manrope(600), fontSize: 11, color: colors.textFaint },
  statsRow: { flexDirection: 'row', gap: 8 },
  statTile: { flex: 1, backgroundColor: colors.bgCardAlt, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8 },
  statLabel: { fontFamily: manrope(700), fontSize: 9, letterSpacing: 0.5 },
  statValue: { fontFamily: manrope(800), fontSize: 15, letterSpacing: -0.3, color: colors.textPrimary, marginTop: 2 },
  body: { padding: 16, gap: 16 },
  section: { gap: 9 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: manrope(800), fontSize: 13, letterSpacing: 0.3, color: colors.textPrimary },
  sectionCount: { fontFamily: manrope(700), fontSize: 11, color: colors.textFaint },
  emptyText: { fontFamily: manrope(600), fontSize: 11.5, color: colors.textDisabled, padding: 4 },
  movementRow: {
    position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgCardAlt, borderWidth: 1, borderColor: colors.borderSoft,
    borderRadius: 13, padding: 11, paddingLeft: 14, overflow: 'hidden',
  },
  movementBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  movementBadge: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  movementBadgeText: { fontFamily: manrope(800), fontSize: 10, color: colors.textPrimary },
  movementBody: { flex: 1, minWidth: 0 },
  movementPlayer: { fontFamily: manrope(800), fontSize: 14, color: colors.textPrimary },
  movementMeta: { fontFamily: manrope(600), fontSize: 11, color: colors.textFaint },
  movementRight: { alignItems: 'flex-end', gap: 3 },
  movementFee: { fontFamily: manrope(800), fontSize: 14, letterSpacing: -0.3, color: colors.amber },
});
