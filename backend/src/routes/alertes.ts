import { Router } from 'express';
import { creerAlerte, listerAlertesParToken, supprimerAlerte } from '../repo/alertes.repo.js';
import { getClub } from '../repo/clubs.repo.js';
import type { AlerteRow } from '../types.js';
import { asyncHandler } from './util.js';

export const alertesRouter = Router();

// push_token jamais réexposé (le client connaît déjà le sien) — cohérent avec
// le reste de l'API qui n'expose que du camelCase dérivé, pas les lignes brutes.
function toDTO(a: AlerteRow) {
  return { id: a.id, type: a.type, joueurNom: a.joueur_nom, clubId: a.club_id, createdAt: a.created_at };
}

alertesRouter.get('/', asyncHandler(async (req, res) => {
  const pushToken = typeof req.query.pushToken === 'string' ? req.query.pushToken : undefined;
  if (!pushToken) {
    res.status(400).json({ error: 'pushToken requis' });
    return;
  }
  res.json((await listerAlertesParToken(pushToken)).map(toDTO));
}));

alertesRouter.post('/', asyncHandler(async (req, res) => {
  const { pushToken, type, joueurNom, clubId } = req.body ?? {};
  if (typeof pushToken !== 'string' || !pushToken || (type !== 'joueur' && type !== 'club')) {
    res.status(400).json({ error: 'pushToken et type ("joueur" ou "club") requis' });
    return;
  }
  if (type === 'joueur' && (typeof joueurNom !== 'string' || !joueurNom.trim())) {
    res.status(400).json({ error: 'joueurNom requis pour une alerte de type joueur' });
    return;
  }
  if (type === 'club') {
    const club = typeof clubId === 'number' ? await getClub(clubId) : undefined;
    if (!club) {
      res.status(400).json({ error: 'clubId invalide pour une alerte de type club' });
      return;
    }
  }

  const alerte = await creerAlerte({
    pushToken,
    type,
    joueurNom: type === 'joueur' ? joueurNom.trim() : null,
    clubId: type === 'club' ? clubId : null,
  });
  res.status(201).json(toDTO(alerte));
}));

alertesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const pushToken = typeof req.query.pushToken === 'string' ? req.query.pushToken : undefined;
  if (!pushToken) {
    res.status(400).json({ error: 'pushToken requis' });
    return;
  }
  await supprimerAlerte(id, pushToken);
  res.status(204).send();
}));
