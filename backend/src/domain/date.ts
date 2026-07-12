/** Formatage relatif en français ("il y a 2h", "il y a 3j") — pas de dépendance externe pour un besoin aussi simple. */
export function relatif(dateIso: string, maintenant = new Date()): string {
  const diffMs = maintenant.getTime() - new Date(dateIso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures}h`;
  const jours = Math.floor(heures / 24);
  if (jours < 30) return `il y a ${jours}j`;
  const mois = Math.floor(jours / 30);
  if (mois < 12) return `il y a ${mois} mois`;
  return new Date(dateIso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}
