import Parser from 'rss-parser';

/**
 * Flux RSS publics, en lecture seule, aucune clé requise. Scope volontairement
 * réduit à 2 flux généralistes anglophones à forte couverture Big 5 (voir README) —
 * pas de config par variable d'environnement, cohérent avec la portée décidée.
 */
export const FLUX_RSS: { nom: string; url: string }[] = [
  { nom: 'BBC Sport', url: 'http://feeds.bbci.co.uk/sport/football/rss.xml' },
  { nom: 'Sky Sports', url: 'https://www.skysports.com/rss/12040' },
];

export interface ArticleRss {
  titre: string;
  extrait: string;
  lien: string;
  datePublication: string; // ISO
}

// timeout : voir fetchAvecTimeout.ts pour le raisonnement (un flux qui ne répond
// pas ne doit jamais geler tout le cycle de synchronisation).
const parser = new Parser({ timeout: 15_000 });

export async function telechargerFlux(url: string): Promise<ArticleRss[]> {
  const flux = await parser.parseURL(url);
  return (flux.items || [])
    .filter((item) => item.title && item.link && item.pubDate)
    .map((item) => ({
      titre: item.title!,
      extrait: item.contentSnippet || item.content || '',
      lien: item.link!,
      datePublication: new Date(item.pubDate!).toISOString(),
    }));
}
