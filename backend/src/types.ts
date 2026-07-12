export type LeagueId = 'pl' | 'l1' | 'bl' | 'sa' | 'll';
export type SourceCategorie = 'club_officiel' | 'journaliste_reconnu' | 'media_generaliste' | 'non_verifie';
export type Statut = 'rumeur' | 'contact_confirme' | 'negociation' | 'accord_clubs' | 'accord_joueur' | 'officiel' | 'annule';
export type Origine = 'automatique_api' | 'manuel';
export type Probabilite = 'LOW' | 'MEDIUM' | 'HIGH';

export interface LeagueRow {
  id: LeagueId;
  nom: string;
  code_court: string;
  couleur: string;
  api_football_id: number | null;
  sportmonks_id: number | null;
}

export interface ClubRow {
  id: number;
  nom: string;
  /** LeagueId réel, ou 'ext' pour un club hors Big 5 (simple ancre FK, jamais exposé à l'app). */
  championnat_id: string;
  couleur: string;
  abbr: string;
  api_football_id: number | null;
  sportmonks_id: number | null;
}

export interface FenetreRow {
  id: string;
  label: string;
  sub: string;
  nom_complet: string;
  date_debut: string;
  date_fin: string;
  en_cours: number;
}

export interface SourceRow {
  id: number;
  nom: string;
  categorie: SourceCategorie;
  rumeurs_confirmees: number;
  rumeurs_infirmees: number;
  created_at: string;
  updated_at: string;
}

export interface TransfertRow {
  id: number;
  joueur: string;
  club_sortant_id: number | null;
  club_entrant_id: number | null;
  championnat_id: LeagueId;
  fenetre_id: string;
  statut: Statut;
  score_fiabilite: number | null;
  montant: string | null;
  date_transfert: string | null;
  cle_correspondance: string;
  created_at: string;
  updated_at: string;
}

export interface HistoriqueStatutRow {
  id: number;
  transfert_id: number;
  statut: Statut;
  date: string;
  source_id: number;
  est_primaire: number;
  origine: Origine;
  lien_source: string | null;
}
