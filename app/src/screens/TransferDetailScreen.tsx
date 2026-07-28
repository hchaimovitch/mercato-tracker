import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Share, StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useTransferDetail } from '../api/hooks';
import type { DetailStep, SourceCitation, TransferDetail } from '../api/types';
import { BackButton } from '../components/BackButton';
import { ClubBadge } from '../components/ClubBadge';
import { GlowButton } from '../components/GlowButton';
import { HeaderGradient } from '../components/HeaderGradient';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { ProgressSegments } from '../components/ProgressSegments';
import { ErrorView, LoadingView } from '../components/ScreenState';
import { SignalBadge } from '../components/SignalBadge';
import type { DetailStackParamList } from '../navigation/types';
import { useFollows } from '../storage/FollowsProvider';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

type Props = NativeStackScreenProps<DetailStackParamList, 'TransferDetail'>;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function StepNode({ step, isLast }: { step: DetailStep; isLast: boolean }) {
  const filled = step.state === 'confirme' || step.state === 'actuel';
  const glyph = step.state === 'confirme' ? '✓' : step.state === 'actuel' ? '●' : step.state === 'non_documente' ? '—' : '';
  return (
    <View style={{ alignItems: 'center', width: 24 }}>
      <View
        style={[
          styles.stepNode,
          filled ? { backgroundColor: colors.amber, borderWidth: 0 } : { borderWidth: 1.5, borderColor: colors.borderInput },
          step.state === 'actuel' && styles.stepNodeGlow,
        ]}
      >
        {!!glyph && (
          <Text style={[styles.stepNodeGlyph, { color: filled ? colors.amberInk : colors.textDisabled }]}>{glyph}</Text>
        )}
      </View>
      {!isLast && <View style={[styles.stepLine, { backgroundColor: step.state === 'confirme' ? colors.amber : 'rgba(255,255,255,0.12)' }]} />}
    </View>
  );
}

const STEP_STATE_LABEL: Record<DetailStep['state'], string> = {
  confirme: 'Étape confirmée',
  non_documente: 'Étape non documentée — a pu être sautée',
  actuel: 'Statut actuel',
  a_venir: 'À venir',
};

function SourceRow({ source, onPress, primaryTag }: { source: SourceCitation; onPress: () => void; primaryTag?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.sourceRow, primaryTag ? styles.sourceRowPrimary : styles.sourceRowRelay]} accessibilityRole="button">
      <View style={[styles.sourceGlyphWrap, primaryTag ? styles.sourceGlyphWrapPrimary : undefined]}>
        <Text style={{ color: source.categorieColor, fontSize: primaryTag ? 15 : 12, fontFamily: manrope(800) }}>{source.categorieGlyph}</Text>
      </View>
      <View style={styles.sourceBody}>
        <View style={styles.sourceNameRow}>
          <Text style={styles.sourceName} numberOfLines={1}>{source.nom}</Text>
          {primaryTag && (
            <View style={styles.primaryPill}>
              <Text style={styles.primaryPillText}>PRIMAIRE</Text>
            </View>
          )}
        </View>
        <Text style={styles.sourceMeta} numberOfLines={1}>
          {source.categorieLabel}
          {source.reliabilitePct !== null ? ` · ${source.reliabilitePct}% fiable` : ' · historique insuffisant'}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function DetailBody({ t, navigation, backLabel }: { t: TransferDetail; navigation: Props['navigation']; backLabel?: string }) {
  const { isFollowed, toggleFollow } = useFollows();
  const following = isFollowed(t.id);

  const openSource = (source: SourceCitation) => navigation.navigate('SourceProfile', { sourceId: source.sourceId });

  const onShare = () => {
    const scoreTxt = t.scoreFiabilite !== null ? `${t.scoreFiabilite}% de fiabilité` : 'fiabilité indéterminée';
    Share.share({
      message: `${t.joueur} : ${t.from.name} → ${t.to.name} pour ${t.fee ?? 'montant inconnu'} (${t.statutLabel}, ${scoreTxt}) — Mercato Tracker`,
    }).catch(() => {});
  };

  return (
    <View style={styles.screen}>
      <HeaderGradient strong style={styles.header}>
        <View style={styles.topRow}>
          <BackButton onPress={() => navigation.goBack()} label={backLabel} />
          <Text style={styles.headerKicker}>Fiche transfert</Text>
          <Pressable onPress={onShare} style={styles.shareButton} accessibilityRole="button" accessibilityLabel="Partager">
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>⇪</Text>
          </Pressable>
        </View>

        {t.breaking && !t.annule && (
          <View style={styles.breakingBadge}>
            <Text style={styles.breakingBadgeText}>À LA UNE · MISE À JOUR {t.updated}</Text>
          </View>
        )}
        {t.annule && (
          <View style={styles.annuleBadge}>
            <Text style={styles.annuleBadgeText}>TRANSFERT ANNULÉ</Text>
          </View>
        )}

        <View style={styles.playerRow}>
          <PlayerAvatar nom={t.joueur} photoUrl={t.joueurPhotoUrl} size={64} radius={16} />
          <View style={{ minWidth: 0, flexShrink: 1 }}>
            <Text style={styles.playerName}>{t.joueur}</Text>
            {t.meta && <Text style={styles.playerMeta}>{t.meta}</Text>}
          </View>
        </View>
      </HeaderGradient>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Reliability gauge */}
        <View style={styles.card}>
          <View style={styles.reliabilityTop}>
            <View>
              <Text style={styles.sectionLabel}>INDICE DE FIABILITÉ</Text>
              {t.annule ? (
                <Text style={styles.annuleText}>Sans objet — le transfert n'a pas eu lieu</Text>
              ) : t.scoreFiabilite !== null ? (
                <View style={styles.reliabilityValueRow}>
                  <Text style={styles.reliabilityValue}>{t.scoreFiabilite}</Text>
                  <Text style={styles.reliabilityPct}>%</Text>
                </View>
              ) : (
                <Text style={styles.annuleText}>Indéterminé</Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <SignalBadge tier={t.tier} variant="pill" label={`Signal ${t.tier.label}`} />
              <Text style={styles.stepLabelSmall}>{t.statutLabel}</Text>
            </View>
          </View>
          {!t.annule && <ProgressSegments segs={t.segs} onColor={t.progressColor} height={6} />}
        </View>

        {/* Face-a-face */}
        <View>
          <Text style={styles.sectionLabel}>FACE-À-FACE</Text>
          <View style={styles.faceRow}>
            <View style={[styles.faceCard, { marginTop: 9 }]}>
              <Text style={styles.faceCardLabel}>CLUB SORTANT</Text>
              <View style={styles.faceCardHeader}>
                <ClubBadge abbr={t.from.abbr} color={t.from.color} logoUrl={t.from.logoUrl} size={38} radius={10} />
                <View style={{ minWidth: 0, flexShrink: 1 }}>
                  <Text style={styles.faceCardName} numberOfLines={1}>{t.from.name}</Text>
                  <Text style={styles.faceCardSub} numberOfLines={1}>{t.fromLeagueName}</Text>
                </View>
              </View>
            </View>

            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={[styles.faceCard, styles.faceCardEntrant, { marginTop: 9 }]}>
              <Text style={[styles.faceCardLabel, { color: colors.amberLight }]}>CLUB ENTRANT</Text>
              <View style={styles.faceCardHeader}>
                <ClubBadge abbr={t.to.abbr} color={t.to.color} logoUrl={t.to.logoUrl} size={38} radius={10} />
                <View style={{ minWidth: 0, flexShrink: 1 }}>
                  <Text style={styles.faceCardName} numberOfLines={1}>{t.to.name}</Text>
                  <Text style={styles.faceCardSub} numberOfLines={1}>{t.toLeagueName}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoTile}>
            <Text style={styles.infoLabel}>MONTANT</Text>
            <Text style={[styles.infoValue, { color: colors.amber, fontSize: 19 }]}>{t.fee ?? 'Inconnu'}</Text>
          </View>
          <View style={styles.infoTile}>
            <Text style={styles.infoLabel}>TYPE D'OPÉRATION</Text>
            <Text style={styles.infoValue}>{t.type}</Text>
          </View>
        </View>

        {/* Progression */}
        <View>
          <Text style={[styles.sectionLabel, { marginBottom: 11 }]}>PROGRESSION{t.step !== null ? ` · ${t.step}/6` : ''}</Text>
          <View>
            {t.detailSteps.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                <StepNode step={s} isLast={i === t.detailSteps.length - 1} />
                <View style={{ paddingBottom: 16, flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: s.state === 'a_venir' ? colors.textFaint : colors.textPrimary }]}>{s.label}</Text>
                  <Text style={styles.stepState}>{STEP_STATE_LABEL[s.state]}{s.date ? ` · ${formatDate(s.date)}` : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Sources */}
        <View style={[styles.card, { gap: 13 }]}>
          <View style={styles.sourcesHeader}>
            <Text style={styles.sectionLabel}>FIABILITÉ DES SOURCES</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {t.sources.srcSegs.map((seg, i) => (
                  <View key={i} style={{ width: 6, height: 14, borderRadius: 2, backgroundColor: seg.on ? colors.green : 'rgba(255,255,255,0.12)' }} />
                ))}
              </View>
              <Text style={styles.corrobCount}>{t.sources.corrobCount}/5</Text>
            </View>
          </View>
          <Text style={styles.corrobLabel}>{t.sources.corrobLabel}</Text>

          {t.sources.primaire ? (
            <SourceRow source={t.sources.primaire} onPress={() => openSource(t.sources.primaire!)} primaryTag />
          ) : (
            <Text style={styles.emptySources}>Aucune source citée pour l'instant.</Text>
          )}

          {t.sources.hasRelais && (
            <View style={{ gap: 6 }}>
              <Text style={styles.relaysLabel}>REPRISES PAR</Text>
              {t.sources.relais.map((r, i) => (
                <SourceRow key={i} source={r} onPress={() => openSource(r)} />
              ))}
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={[styles.card, { gap: 12 }]}>
          <Text style={styles.sectionLabel}>CHRONOLOGIE</Text>
          {t.timeline.length === 0 && <Text style={styles.emptySources}>Aucun événement enregistré.</Text>}
          {t.timeline.map((u, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: u.categorieColor, marginTop: 5 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.timelineName}>{u.nom}</Text>
                  <Text style={[styles.timelineType, { color: u.categorieColor }]}>{u.categorieGlyph} {u.categorieLabel}</Text>
                  {u.primaire && (
                    <View style={styles.primaryPillSmall}>
                      <Text style={styles.primaryPillTextSmall}>SOURCE PRIMAIRE</Text>
                    </View>
                  )}
                  {u.origine === 'manuel' && (
                    <View style={styles.manuelPillSmall}>
                      <Text style={styles.manuelPillTextSmall}>AJUSTÉ MANUELLEMENT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.timelineTime}>{formatDate(u.date)}</Text>
              </View>
            </View>
          ))}
        </View>

        <GlowButton
          label="Suivre ce transfert"
          activeLabel="Transfert suivi"
          active={following}
          onPress={() => toggleFollow(t.id)}
        />
      </ScrollView>
    </View>
  );
}

export function TransferDetailScreen({ route, navigation }: Props) {
  const { id, backLabel } = route.params;
  const detailQuery = useTransferDetail(id);

  if (detailQuery.isLoading) return <LoadingView />;
  if (detailQuery.isError || !detailQuery.data) {
    return <ErrorView message={(detailQuery.error as Error)?.message ?? 'Transfert introuvable'} onRetry={() => detailQuery.refetch()} />;
  }

  return <DetailBody t={detailQuery.data} navigation={navigation} backLabel={backLabel} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerKicker: { fontFamily: manrope(700), fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textFaint },
  shareButton: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.borderInput,
    backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center',
  },
  breakingBadge: { alignSelf: 'flex-start', height: 22, paddingHorizontal: 9, borderRadius: 5, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  breakingBadgeText: { fontFamily: manrope(800), fontSize: 10, letterSpacing: 0.7, color: colors.amberInk },
  annuleBadge: { alignSelf: 'flex-start', height: 22, paddingHorizontal: 9, borderRadius: 5, backgroundColor: 'rgba(152,162,179,0.18)', borderWidth: 1, borderColor: 'rgba(152,162,179,0.4)', alignItems: 'center', justifyContent: 'center' },
  annuleBadgeText: { fontFamily: manrope(800), fontSize: 10, letterSpacing: 0.7, color: colors.greyNeutral },
  annuleText: { fontFamily: manrope(700), fontSize: 15, color: colors.textMuted, marginTop: 4 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  playerName: { fontFamily: manrope(800), fontSize: 24, letterSpacing: -0.5, color: colors.textPrimary, lineHeight: 27 },
  playerMeta: { fontFamily: manrope(600), fontSize: 12.5, color: colors.textMuted, marginTop: 3 },
  body: { padding: 16, gap: 15 },
  sectionLabel: { fontFamily: manrope(700), fontSize: 12, letterSpacing: 1, color: colors.textFaint },
  card: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 14 },
  reliabilityTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reliabilityValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 },
  reliabilityValue: { fontFamily: manrope(800), fontSize: 44, letterSpacing: -1.5, color: colors.textPrimary, lineHeight: 44 },
  reliabilityPct: { fontFamily: manrope(800), fontSize: 20, color: colors.textMuted },
  stepLabelSmall: { fontFamily: manrope(600), fontSize: 11, color: colors.textMuted },
  faceRow: { flexDirection: 'row', gap: 9, position: 'relative' },
  faceCard: { flex: 1, backgroundColor: colors.bgCardAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13, gap: 9 },
  faceCardEntrant: { borderColor: 'rgba(245,179,1,0.25)' },
  faceCardLabel: { fontFamily: manrope(800), fontSize: 9, letterSpacing: 1, color: colors.textFaint },
  faceCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  faceCardName: { fontFamily: manrope(800), fontSize: 14, color: colors.textPrimary, lineHeight: 16 },
  faceCardSub: { fontFamily: manrope(600), fontSize: 10, color: colors.textFaint },
  vsBadge: {
    position: 'absolute', left: '50%', top: '50%', marginLeft: -18, marginTop: -18,
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgApp,
    borderWidth: 1.5, borderColor: 'rgba(245,179,1,0.5)', alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  vsText: { fontFamily: manrope(800), fontSize: 11, color: colors.amber },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  infoTile: { flex: 1, minWidth: '45%', backgroundColor: colors.bgCardAlt, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 12, padding: 12 },
  infoLabel: { fontFamily: manrope(700), fontSize: 9.5, letterSpacing: 0.8, color: colors.textFaint },
  infoValue: { fontFamily: manrope(800), fontSize: 15, color: colors.textPrimary, marginTop: 4 },
  stepNode: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNodeGlow: { shadowColor: colors.amber, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  stepNodeGlyph: { fontFamily: manrope(800), fontSize: 12 },
  stepLine: { width: 2, flex: 1, minHeight: 22 },
  stepTitle: { fontFamily: manrope(700), fontSize: 13.5, lineHeight: 16 },
  stepState: { fontFamily: manrope(600), fontSize: 11, color: colors.textFaint, marginTop: 2 },
  sourcesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  corrobCount: { fontFamily: manrope(800), fontSize: 11, color: colors.green },
  corrobLabel: { fontFamily: manrope(700), fontSize: 12.5, color: colors.textSecondary },
  emptySources: { fontFamily: manrope(600), fontSize: 11.5, color: colors.textDisabled },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1 },
  sourceRowPrimary: { backgroundColor: colors.bgHeaderTopStrong, borderColor: 'rgba(245,179,1,0.3)' },
  sourceRowRelay: { backgroundColor: colors.bgInsetAlt, borderColor: colors.borderSoft },
  sourceGlyphWrap: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  sourceGlyphWrapPrimary: { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(245,179,1,0.12)', borderWidth: 1, borderColor: 'rgba(245,179,1,0.3)' },
  sourceBody: { flex: 1, minWidth: 0 },
  sourceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sourceName: { fontFamily: manrope(800), fontSize: 13.5, color: colors.textPrimary, flexShrink: 1 },
  sourceMeta: { fontFamily: manrope(600), fontSize: 10.5, color: colors.textFaint, marginTop: 2 },
  primaryPill: { backgroundColor: colors.amber, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  primaryPillText: { fontFamily: manrope(800), fontSize: 9, letterSpacing: 0.5, color: colors.amberInk },
  chevron: { fontSize: 15, fontFamily: manrope(700), color: colors.amber },
  relaysLabel: { fontFamily: manrope(700), fontSize: 10, letterSpacing: 0.6, color: colors.textFaint },
  timelineName: { fontFamily: manrope(700), fontSize: 12.5, color: colors.textSecondary },
  timelineType: { fontFamily: manrope(700), fontSize: 10 },
  timelineTime: { fontFamily: manrope(600), fontSize: 10.5, color: colors.textFaint, marginTop: 1 },
  primaryPillSmall: { backgroundColor: colors.amber, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  primaryPillTextSmall: { fontFamily: manrope(800), fontSize: 8.5, letterSpacing: 0.4, color: colors.amberInk },
  manuelPillSmall: { backgroundColor: 'rgba(152,162,179,0.18)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: 'rgba(152,162,179,0.4)' },
  manuelPillTextSmall: { fontFamily: manrope(700), fontSize: 8.5, letterSpacing: 0.4, color: colors.greyNeutral },
});
