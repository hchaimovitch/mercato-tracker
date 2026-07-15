import { getClub } from '../repo/clubs.repo.js';
import { historiquePourTransfert } from '../repo/historique.repo.js';
import { getLeague } from '../repo/leagues.repo.js';
import { getSourceById } from '../repo/sources.repo.js';
import type { ClubRow, HistoriqueStatutRow, LeagueId, Statut, TransfertRow } from '../types.js';
import { CATEGORIE_META } from './categorieMeta.js';
import { relatif } from './date.js';
import { parseFee } from './money.js';
import { sourceReliability } from './wilson.js';
import { STATUT_LABEL, STATUT_STEP } from './statutMapping.js';
import { tierFromScore, progressColor, type Tier } from './tier.js';

export interface ClubRefDTO {
  id: number;
  name: string;
  abbr: string;
  color: string;
}

function clubRef(row: ClubRow | undefined): ClubRefDTO {
  if (!row) return { id: 0, name: 'Inconnu', abbr: '?', color: '#555555' };
  return { id: row.id, name: row.nom, abbr: row.abbr, color: row.couleur };
}

export interface TransferCardDTO {
  id: number;
  joueur: string;
  meta: string | null;
  updated: string;
  breaking: boolean;
  league: { id: LeagueId; name: string; color: string };
  from: ClubRefDTO;
  to: ClubRefDTO;
  fee: string | null;
  scoreFiabilite: number | null;
  statut: Statut;
  statutLabel: string;
  step: number | null;
  tier: Tier;
  progressColor: string;
  segs: { on: boolean }[];
}

export async function toCard(t: TransfertRow): Promise<TransferCardDTO> {
  const league = await getLeague(t.championnat_id as LeagueId);
  const from = t.club_sortant_id ? await getClub(t.club_sortant_id) : undefined;
  const to = t.club_entrant_id ? await getClub(t.club_entrant_id) : undefined;
  const hist = await historiquePourTransfert(t.id);
  const derniere = hist[hist.length - 1];
  const step = t.statut === 'annule' ? null : STATUT_STEP[t.statut];
  const segs = Array.from({ length: 6 }, (_, i) => ({ on: step !== null && i < step }));

  return {
    id: t.id,
    joueur: t.joueur,
    // Position/âge/nationalité nécessiteraient un appel /players séparé (coût de quota
    // supplémentaire) — non inclus pour l'instant, voir README. Champ null assumé, pas simulé.
    meta: null,
    updated: derniere ? relatif(derniere.date) : relatif(t.updated_at),
    breaking: !!(t.montant && parseFee(t.montant) >= 60),
    league: { id: league!.id, name: league!.nom, color: league!.couleur },
    from: clubRef(from),
    to: clubRef(to),
    fee: t.montant,
    scoreFiabilite: t.score_fiabilite,
    statut: t.statut,
    statutLabel: STATUT_LABEL[t.statut],
    step,
    tier: tierFromScore(t.score_fiabilite),
    progressColor: progressColor(t.statut),
    segs,
  };
}

function typeOperation(montant: string | null): string {
  if (!montant) return 'Inconnu';
  const m = montant.toLowerCase();
  if (m.includes('free') || m.includes('libre')) return 'Transfert libre';
  if (m.includes('loan') || m.includes('prêt') || m.includes('pret')) return 'Prêt';
  if (m === 'n/a') return 'Inconnu';
  return 'Transfert sec';
}

export type DetailStepState = 'confirme' | 'non_documente' | 'actuel' | 'a_venir';

export interface DetailStepDTO {
  label: string;
  state: DetailStepState;
  date: string | null;
}

export interface SourceCitationDTO {
  sourceId: number;
  nom: string;
  categorie: string;
  categorieLabel: string;
  categorieGlyph: string;
  categorieColor: string;
  reliabilitePct: number | null;
  n: number;
  primaire: boolean;
  date: string;
  lienSource: string | null;
  origine: string;
}

export interface TransferDetailDTO extends TransferCardDTO {
  type: string;
  fromLeagueName: string;
  toLeagueName: string;
  detailSteps: DetailStepDTO[];
  annule: boolean;
  sources: {
    primaire: SourceCitationDTO | null;
    relais: SourceCitationDTO[];
    hasRelais: boolean;
    corrobCount: number;
    corrobLabel: string;
    srcSegs: { on: boolean }[];
  };
  timeline: SourceCitationDTO[];
}

async function toCitationDTO(h: HistoriqueStatutRow): Promise<SourceCitationDTO | null> {
  const source = await getSourceById(h.source_id);
  if (!source) return null;
  const rel = sourceReliability(source.rumeurs_confirmees, source.rumeurs_infirmees);
  const meta = CATEGORIE_META[source.categorie];
  return {
    sourceId: source.id,
    nom: source.nom,
    categorie: source.categorie,
    categorieLabel: meta.label,
    categorieGlyph: meta.glyph,
    categorieColor: meta.color,
    reliabilitePct: rel.score !== null ? Math.round(rel.score * 100) : null,
    n: rel.n,
    primaire: !!h.est_primaire,
    date: h.date,
    lienSource: h.lien_source,
    origine: h.origine,
  };
}

export async function buildDetail(t: TransfertRow): Promise<TransferDetailDTO> {
  const card = await toCard(t);
  const from = t.club_sortant_id ? await getClub(t.club_sortant_id) : undefined;
  const to = t.club_entrant_id ? await getClub(t.club_entrant_id) : undefined;
  const fromLeague = from ? await getLeague(from.championnat_id as LeagueId) : undefined;
  const toLeague = to ? await getLeague(to.championnat_id as LeagueId) : undefined;

  const hist = await historiquePourTransfert(t.id);
  const citationsRaw = await Promise.all(hist.map(toCitationDTO));
  const citations = citationsRaw.filter((c): c is SourceCitationDTO => c !== null);
  const nonTerminales = citations.filter((c, i) => hist[i].statut !== 'officiel' && hist[i].statut !== 'annule');

  const primaire = nonTerminales.find((c) => c.primaire) ?? null;
  const relaisVus = new Set(primaire ? [primaire.nom] : []);
  const relais: SourceCitationDTO[] = [];
  for (const c of nonTerminales) {
    if (relaisVus.has(c.nom)) continue;
    relaisVus.add(c.nom);
    relais.push(c);
  }
  const corrobCount = relaisVus.size;
  const corrobLabel = corrobCount <= 1 ? 'Source unique — non corroborée' : `Confirmé par ${corrobCount} sources indépendantes`;
  const srcSegs = Array.from({ length: 5 }, (_, i) => ({ on: i < Math.min(corrobCount, 5) }));

  const step = t.statut === 'annule' ? null : STATUT_STEP[t.statut];
  const detailSteps: DetailStepDTO[] = (Object.keys(STATUT_STEP) as (keyof typeof STATUT_STEP)[])
    .sort((a, b) => STATUT_STEP[a] - STATUT_STEP[b])
    .map((statut) => {
      const i = STATUT_STEP[statut];
      const label = STATUT_LABEL[statut];
      const rencontre = hist.find((h) => h.statut === statut);
      if (step !== null && i === step) return { label, state: 'actuel', date: rencontre?.date ?? null } satisfies DetailStepDTO;
      // "non_documente" : cette étape a été sautée (ex: passage direct rumeur → officiel) — on ne
      // prétend pas qu'elle ait eu lieu, contrairement à un prototype qui remplirait les 6 étapes.
      if (step !== null && i < step) {
        const state: DetailStepState = rencontre ? 'confirme' : 'non_documente';
        return { label, state, date: rencontre?.date ?? null } satisfies DetailStepDTO;
      }
      return { label, state: 'a_venir', date: rencontre?.date ?? null } satisfies DetailStepDTO;
    });

  return {
    ...card,
    type: typeOperation(t.montant),
    fromLeagueName: fromLeague?.nom ?? '—',
    toLeagueName: toLeague?.nom ?? '—',
    annule: t.statut === 'annule',
    detailSteps,
    sources: { primaire, relais, hasRelais: relais.length > 0, corrobCount, corrobLabel, srcSegs },
    timeline: citations,
  };
}
