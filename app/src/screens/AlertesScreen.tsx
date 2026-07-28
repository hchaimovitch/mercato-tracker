import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAlertes, useClubsList, useCreateAlerte, useDeleteAlerte } from '../api/hooks';
import type { AlerteType } from '../api/types';
import { ClubBadge } from '../components/ClubBadge';
import { EmptyState } from '../components/EmptyState';
import { GlowButton } from '../components/GlowButton';
import { HeaderGradient } from '../components/HeaderGradient';
import { ErrorView, LoadingView } from '../components/ScreenState';
import { usePushToken } from '../storage/PushTokenProvider';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

export function AlertesScreen() {
  const { pushToken, ready, error } = usePushToken();
  const [type, setType] = useState<AlerteType>('joueur');
  const [joueurNom, setJoueurNom] = useState('');
  const [clubId, setClubId] = useState<number | null>(null);

  const alertesQuery = useAlertes(pushToken);
  const clubsQuery = useClubsList();
  const createAlerte = useCreateAlerte(pushToken);
  const deleteAlerte = useDeleteAlerte(pushToken);

  const clubsParId = new Map((clubsQuery.data ?? []).map((c) => [c.id, c]));

  const onCreate = () => {
    if (type === 'joueur') {
      if (!joueurNom.trim()) return;
      createAlerte.mutate({ type: 'joueur', joueurNom: joueurNom.trim() }, { onSuccess: () => setJoueurNom('') });
    } else {
      if (clubId === null) return;
      createAlerte.mutate({ type: 'club', clubId }, { onSuccess: () => setClubId(null) });
    }
  };

  return (
    <View style={styles.screen}>
      <HeaderGradient strong style={styles.header}>
        <Text style={styles.kicker}>Mercato Tracker</Text>
        <Text style={styles.title}>Alertes</Text>
      </HeaderGradient>

      {!ready ? (
        <LoadingView />
      ) : !pushToken ? (
        <EmptyState
          glyph="◉"
          title="Notifications indisponibles"
          description={
            error
              ? `Erreur d'enregistrement : ${error}`
              : "Autorise les notifications pour cette app dans les réglages de ton téléphone pour créer des alertes."
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>NOUVELLE ALERTE</Text>

            <View style={styles.typeRow}>
              <Pressable onPress={() => setType('joueur')} style={[styles.typeChip, type === 'joueur' && styles.typeChipActive]}>
                <Text style={[styles.typeChipText, type === 'joueur' && styles.typeChipTextActive]}>Joueur</Text>
              </Pressable>
              <Pressable onPress={() => setType('club')} style={[styles.typeChip, type === 'club' && styles.typeChipActive]}>
                <Text style={[styles.typeChipText, type === 'club' && styles.typeChipTextActive]}>Club</Text>
              </Pressable>
            </View>

            {type === 'joueur' ? (
              <TextInput
                value={joueurNom}
                onChangeText={setJoueurNom}
                placeholder="Nom du joueur (ex: Mbappé)"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clubRow}>
                {(clubsQuery.data ?? []).map((c) => {
                  const active = c.id === clubId;
                  return (
                    <Pressable key={c.id} onPress={() => setClubId(c.id)} style={[styles.clubChip, active && styles.clubChipActive]}>
                      <ClubBadge abbr={c.abbr} color={c.couleur} logoUrl={c.logoUrl} size={26} radius={7} />
                      <Text style={styles.clubChipText} numberOfLines={1}>{c.nom}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <GlowButton label={createAlerte.isPending ? 'Création…' : "Créer l'alerte"} onPress={onCreate} />
            {createAlerte.isError && <Text style={styles.errorText}>Échec de création — réessaie.</Text>}
          </View>

          <Text style={styles.sectionLabel}>MES ALERTES</Text>
          {alertesQuery.isLoading ? (
            <LoadingView />
          ) : alertesQuery.isError ? (
            <ErrorView message={(alertesQuery.error as Error).message} onRetry={() => alertesQuery.refetch()} />
          ) : (alertesQuery.data ?? []).length === 0 ? (
            <Text style={styles.emptyText}>Aucune alerte pour l'instant.</Text>
          ) : (
            (alertesQuery.data ?? []).map((a) => {
              const club = a.clubId !== null ? clubsParId.get(a.clubId) : undefined;
              return (
                <View key={a.id} style={styles.alerteRow}>
                  {a.type === 'club' && club ? (
                    <ClubBadge abbr={club.abbr} color={club.couleur} logoUrl={club.logoUrl} size={32} radius={9} />
                  ) : (
                    <View style={styles.alerteGlyphWrap}>
                      <Text style={styles.alerteGlyph}>{a.type === 'joueur' ? '●' : '◉'}</Text>
                    </View>
                  )}
                  <Text style={styles.alerteLabel} numberOfLines={1}>
                    {a.type === 'joueur' ? a.joueurNom : club?.nom ?? 'Club inconnu'}
                  </Text>
                  <Pressable onPress={() => deleteAlerte.mutate(a.id)} style={styles.deleteButton} accessibilityRole="button">
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 14 },
  kicker: { fontFamily: manrope(700), fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textFaint },
  title: { fontFamily: manrope(800), fontSize: 26, letterSpacing: -0.5, color: colors.textPrimary, lineHeight: 29 },
  body: { padding: 16, gap: 13 },
  sectionLabel: { fontFamily: manrope(700), fontSize: 12, letterSpacing: 1, color: colors.textFaint },
  card: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 12 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flex: 1, height: 38, borderRadius: 10, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.bgChip, alignItems: 'center', justifyContent: 'center',
  },
  typeChipActive: { borderColor: colors.amber, backgroundColor: 'rgba(245,179,1,0.12)' },
  typeChipText: { fontFamily: manrope(700), fontSize: 13, color: colors.textSecondary },
  typeChipTextActive: { color: colors.amberLight },
  input: {
    height: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.borderInput,
    backgroundColor: colors.bgInset, paddingHorizontal: 13, fontFamily: manrope(600),
    fontSize: 14, color: colors.textPrimary,
  },
  clubRow: { gap: 8, paddingVertical: 2 },
  clubChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7, height: 38, paddingHorizontal: 11,
    borderRadius: 19, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.bgChip, maxWidth: 150,
  },
  clubChipActive: { borderColor: colors.amber, backgroundColor: 'rgba(245,179,1,0.12)' },
  clubChipText: { fontFamily: manrope(600), fontSize: 12, color: colors.textSecondary, flexShrink: 1 },
  errorText: { fontFamily: manrope(600), fontSize: 11.5, color: colors.negative },
  emptyText: { fontFamily: manrope(600), fontSize: 12.5, color: colors.textDisabled },
  alerteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 12,
  },
  alerteGlyphWrap: {
    width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(245,179,1,0.1)', borderWidth: 1, borderColor: 'rgba(245,179,1,0.25)',
  },
  alerteGlyph: { color: colors.amber, fontSize: 13 },
  alerteLabel: { flex: 1, minWidth: 0, fontFamily: manrope(700), fontSize: 14, color: colors.textPrimary },
  deleteButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: colors.textFaint, fontSize: 15, fontFamily: manrope(700) },
});
