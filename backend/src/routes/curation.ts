import { Router } from 'express';
import { getTransfert } from '../repo/transferts.repo.js';
import { enregistrerCitation } from '../ingestion/matching.js';
import { buildDetail } from '../domain/views.js';
import type { LeagueId, SourceCategorie, Statut } from '../types.js';
import { asyncHandler } from './util.js';

export const curationRouter = Router();

const STATUTS_VALIDES: Statut[] = ['rumeur', 'contact_confirme', 'negociation', 'accord_clubs', 'accord_joueur', 'officiel', 'annule'];
const CATEGORIES_VALIDES: SourceCategorie[] = ['club_officiel', 'journaliste_reconnu', 'media_generaliste', 'non_verifie'];

/**
 * Curation manuelle — pour les statuts qu'aucune source automatique ne peut
 * fournir de façon fiable (contact_confirme/négociation/accord_clubs/accord_joueur
 * précis, ou annulation). Chaque ajustement est tracé (origine='manuel', source
 * nommée explicitement par la personne qui saisit) — jamais anonyme ni silencieux.
 */
curationRouter.patch('/transferts/:id/statut', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const t = await getTransfert(id);
  if (!t) {
    res.status(404).json({ error: 'Unknown transfer' });
    return;
  }

  const { statut, date, sourceNom, sourceCategorie, lienSource } = req.body ?? {};
  if (!STATUTS_VALIDES.includes(statut)) {
    res.status(400).json({ error: `statut invalide, attendu l'un de ${STATUTS_VALIDES.join(', ')}` });
    return;
  }
  if (!sourceNom || typeof sourceNom !== 'string') {
    res.status(400).json({ error: 'sourceNom requis — la curation manuelle doit toujours citer une source nommée' });
    return;
  }
  if (!CATEGORIES_VALIDES.includes(sourceCategorie)) {
    res.status(400).json({ error: `sourceCategorie invalide, attendu l'un de ${CATEGORIES_VALIDES.join(', ')}` });
    return;
  }

  await enregistrerCitation({
    joueur: t.joueur,
    clubSortantId: t.club_sortant_id,
    clubEntrantId: t.club_entrant_id,
    championnatId: t.championnat_id as LeagueId,
    fenetreId: t.fenetre_id,
    statutPropose: statut,
    montant: t.montant,
    date: date || new Date().toISOString().slice(0, 10),
    sourceNom,
    sourceCategorie,
    origine: 'manuel',
    lienSource: lienSource ?? null,
  });

  res.json(await buildDetail((await getTransfert(id))!));
}));
