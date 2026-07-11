import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TransferCard as TransferCardData } from '../api/types';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';
import { ClubBadge } from './ClubBadge';
import { ProgressSegments } from './ProgressSegments';
import { SignalBadge } from './SignalBadge';

interface TransferCardProps {
  transfer: TransferCardData;
  onPress: () => void;
}

export function TransferCard({ transfer: t, onPress }: TransferCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="button">
      {t.breaking && <View pointerEvents="none" style={styles.breakingRing} />}

      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={[styles.leagueDot, { backgroundColor: t.league.color }]} />
          <Text style={styles.leagueName} numberOfLines={1}>
            {t.league.name}
          </Text>
          {t.breaking && (
            <View style={styles.breakingBadge}>
              <Text style={styles.breakingBadgeText}>À LA UNE</Text>
            </View>
          )}
        </View>
        <View style={styles.topRight}>
          <Text style={styles.updated}>{t.updated}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>

      <View>
        <Text style={styles.player}>{t.player}</Text>
        <Text style={styles.meta}>{t.meta}</Text>
      </View>

      <View style={styles.faceRow}>
        <View style={styles.faceSide}>
          <ClubBadge abbr={t.from.abbr} color={t.from.color} />
          <View style={styles.faceSideText}>
            <Text style={styles.faceLabel}>SORTANT</Text>
            <Text style={styles.faceName} numberOfLines={1}>{t.from.name}</Text>
          </View>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={[styles.faceSide, styles.faceSideRight]}>
          <View style={[styles.faceSideText, { alignItems: 'flex-end' }]}>
            <Text style={styles.faceLabel}>ENTRANT</Text>
            <Text style={styles.faceName} numberOfLines={1}>{t.to.name}</Text>
          </View>
          <ClubBadge abbr={t.to.abbr} color={t.to.color} />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View>
          <Text style={styles.metricLabel}>MONTANT</Text>
          <Text style={styles.fee}>{t.fee}</Text>
        </View>
        <View style={styles.reliabilityBlock}>
          <SignalBadge tier={t.tier} />
          <View style={styles.reliabilityValue}>
            <Text style={styles.reliabilityNum}>{t.reliability}</Text>
            <Text style={styles.reliabilityPct}>%</Text>
          </View>
        </View>
      </View>

      <View style={styles.stepBlock}>
        <ProgressSegments segs={t.segs} onColor={t.progressColor} />
        <View style={styles.stepRow}>
          <Text style={styles.stepLabel}>{t.stepLabel}</Text>
          <Text style={styles.stepCount}>Étape {t.step}/6</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 15,
    gap: 13,
  },
  breakingRing: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245,179,1,0.55)',
    shadowColor: colors.amber,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1, minWidth: 0 },
  leagueDot: { width: 8, height: 8, borderRadius: 4 },
  leagueName: { fontFamily: manrope(700), fontSize: 11, letterSpacing: 0.8, color: colors.textMuted, textTransform: 'uppercase' },
  breakingBadge: {
    height: 20, paddingHorizontal: 8, borderRadius: 5,
    backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center',
  },
  breakingBadgeText: { fontFamily: manrope(800), fontSize: 10, letterSpacing: 0.7, color: colors.amberInk },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updated: { fontFamily: manrope(600), fontSize: 11, color: colors.textFaint },
  chevron: { fontSize: 16, fontFamily: manrope(700), color: colors.amber },
  player: { fontFamily: manrope(800), fontSize: 20, letterSpacing: -0.4, color: colors.textPrimary, lineHeight: 23 },
  meta: { fontFamily: manrope(500), fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  faceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colors.bgInset, borderWidth: 1, borderColor: colors.borderSoft,
    borderRadius: 13, padding: 11,
  },
  faceSide: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 },
  faceSideRight: { justifyContent: 'flex-end' },
  faceSideText: { minWidth: 0, flexShrink: 1 },
  faceLabel: { fontFamily: manrope(700), fontSize: 9, letterSpacing: 0.8, color: colors.textFaint },
  faceName: { fontFamily: manrope(700), fontSize: 13, color: colors.textPrimary },
  arrow: { fontFamily: manrope(800), fontSize: 20, color: colors.amber },
  metricsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  metricLabel: { fontFamily: manrope(700), fontSize: 10, letterSpacing: 1, color: colors.textFaint },
  fee: { fontFamily: manrope(800), fontSize: 24, letterSpacing: -0.5, color: colors.amber, lineHeight: 26 },
  reliabilityBlock: { alignItems: 'flex-end', gap: 4 },
  reliabilityValue: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  reliabilityNum: { fontFamily: manrope(800), fontSize: 22, letterSpacing: -0.5, color: colors.textPrimary },
  reliabilityPct: { fontFamily: manrope(700), fontSize: 12, color: colors.textMuted },
  stepBlock: { gap: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepLabel: { fontFamily: manrope(700), fontSize: 11.5, color: colors.textSecondary },
  stepCount: { fontFamily: manrope(600), fontSize: 11, color: colors.textFaint },
});
