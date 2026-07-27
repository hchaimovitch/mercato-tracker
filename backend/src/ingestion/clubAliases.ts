function normaliserAlias(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Abréviations/surnoms que la presse anglaise (nos 2 flux RSS) utilise souvent
 * à la place du nom complet stocké en base (celui renvoyé par API-Football) —
 * sans ça, un article qui ne dit jamais "Paris Saint Germain" mais toujours
 * "PSG" est invisible au filtre par nom de club, et même quand l'article passe
 * le filtre, Claude renvoie l'abréviation telle qu'écrite dans le texte, qui ne
 * correspond alors à aucun club en base. Clubs anglais non listés ici : la
 * presse anglaise les écrit presque toujours en entier, pas besoin d'alias.
 * Limite assumée : "Real" seul est mappé à Real Madrid (le seul "Real" que la
 * presse anglaise désigne ainsi sans précision), au risque théorique de rater
 * un "Real" isolé désignant en réalité un autre club "Real X" (Betis,
 * Sociedad...) — cas jugé rarissime.
 */
const ALIASES_BRUTS: Record<string, string> = {
  PSG: 'Paris Saint Germain',
  OM: 'Marseille',
  OL: 'Lyon',
  Milan: 'AC Milan',
  'Inter Milan': 'Inter',
  Juve: 'Juventus',
  Roma: 'AS Roma',
  Real: 'Real Madrid',
  Barça: 'Barcelona',
  Barca: 'Barcelona',
  Atleti: 'Atletico Madrid',
  Bayern: 'Bayern München',
  'Bayern Munich': 'Bayern München',
  Dortmund: 'Borussia Dortmund',
  BVB: 'Borussia Dortmund',
  Leipzig: 'RB Leipzig',
  Leverkusen: 'Bayer Leverkusen',
  Gladbach: 'Borussia Mönchengladbach',
};

const ALIASES_PAR_CLE_NORMALISEE = new Map(
  Object.entries(ALIASES_BRUTS).map(([alias, canonique]) => [normaliserAlias(alias), canonique])
);

/** Formes littérales à chercher dans le texte d'un article, en plus des noms de clubs en base. */
export const ALIASES_LITTERAUX: string[] = Object.keys(ALIASES_BRUTS);

/** Remplace un alias connu par le nom canonique (tel que stocké en base) avant résolution. */
export function resoudreAliasClub(nom: string): string {
  return ALIASES_PAR_CLE_NORMALISEE.get(normaliserAlias(nom)) ?? nom;
}
