# Mercato Tracker

App de suivi du mercato de football pour les 5 grands championnats européens (Angleterre, France, Allemagne, Italie, Espagne) — dark mode, accent ambre, score de fiabilité multi-facteurs (score de Wilson). Conçue à partir du prototype Claude Design dans `project/Mercato.dc.html` (voir `chats/chat1.md`), puis reconstruite avec de vraies données et un vrai backend suite à l'audit de faisabilité ci-dessous.

## Structure

- `backend/` — API Node/Express/TypeScript + base SQLite. Synchronise les transferts officiels confirmés (API-Football) et, en option, les rumeurs (SportMonks Transfer Rumours). Contient tout le moteur métier : score de Wilson, score de fiabilité par transfert, pipeline de recalcul en cascade.
- `app/` — App Expo/React Native/TypeScript (iOS/Android) qui consomme cette API.
- `project/`, `chats/` — le bundle Claude Design d'origine (prototype HTML/JS), conservé pour référence.

## Ce qui est réel, et ce qui ne l'est pas — résumé de l'audit

**Réel et automatisé :**
- Transferts officiels confirmés, via API-Football (gratuit, 100 req/jour — largement suffisant pour synchroniser les 5 championnats en tâche de fond).
- Fiabilité des sources : score de Wilson (borne basse à 95%) calculé sur l'historique **réellement accumulé par l'app** (confirmé/infirmé au fil des résolutions de transferts) — aucune donnée d'amorçage inventée. Une source neuve affiche "historique insuffisant", pas un pourcentage flatteur.
- Score de fiabilité par transfert : moyenne pondérée (catégorie de source × primaire/relais) + bonus de corroboration, normalisée sur 100 — voir `backend/src/domain/reliability.ts`.
- Pipeline de recalcul en cascade : la résolution d'un transfert (officiel/annulé) met à jour les compteurs des sources citées, puis recalcule le score des autres transferts en cours citant ces mêmes sources — voir `backend/src/domain/cascade.ts`.

**Rumeurs (optionnel) :**
- SportMonks propose une vraie "Transfer Rumours API" (probabilité LOW/MEDIUM/HIGH + source + lien) — le seul fournisseur trouvé avec des rumeurs structurées. C'est un add-on payant dont le prix exact n'est pas public ; l'intégration est prête (`backend/src/ingestion/sportmonks.*`) mais désactivée tant que `SPORTMONKS_KEY` n'est pas renseignée. Sans elle, l'app fonctionne normalement avec uniquement les transferts officiels.
- **Limite assumée** : aucune source ne fournit automatiquement les statuts fins `contact_confirme` / `negociation` / `accord_clubs` / `accord_joueur`. Le pipeline automatique ne peuple que `rumeur` (LOW), `contact_confirme` (MEDIUM), `negociation` (HIGH) et `officiel`. Les statuts `accord_clubs`, `accord_joueur` et `annule` restent réservés à la curation manuelle (`PATCH /curation/transferts/:id/statut`) — pas de UI dédiée dans l'app pour l'instant, seulement l'endpoint.
- La fiche transfert distingue visuellement une étape "confirmée", "sautée (non documentée)" ou "ajustée manuellement" — jamais présentée comme certaine si elle ne l'est pas.

**Non disponible sans coût/complexité supplémentaire, donc absent plutôt que simulé :**
- Position/âge/nationalité du joueur, valeur marchande, durée de contrat, salaire — nécessiteraient des appels API supplémentaires (quota) ou un fournisseur différent. Champs simplement omis, pas inventés.
- Classification automatique de la catégorie d'une source (`club_officiel`/`journaliste_reconnu`/`media_generaliste`/`non_verifie`) : catalogue curaté à la main (`backend/src/ingestion/sourceCategorization.ts`), toute source inconnue tombe par défaut sur `non_verifie` plutôt que de lui prêter une crédibilité non vérifiée.
- Correspondance des clubs entre fournisseurs (API-Football / SportMonks) : par nom normalisé, faute d'identifiant commun — limite documentée dans le code, peut manquer une rumeur en cas de variante de nom trop inhabituelle.

## Lancer le projet en développement

**Backend**

```
cd backend
npm install
cp .env.example .env    # renseigne API_FOOTBALL_KEY (gratuit sur api-football.com)
npm run dev              # http://localhost:4000
```

Sans `API_FOOTBALL_KEY`, le serveur démarre quand même mais aucune synchronisation ne tourne (base vide, comme sur un `git clone` frais).

**App**

```
cd app
npm install
npm start                # puis i / a / w, ou scanne le QR code
```

Voir `app/.env.example` si tu dois forcer l'URL de l'API (ex: test en navigateur web) — sinon l'app détecte automatiquement l'adresse de ton ordinateur sur le réseau local.

## Construire le .apk final

Un build de développement (Expo Go) ne suffit pas pour un fichier installable de façon autonome — il faut un vrai build via **EAS Build** (cloud Expo, compte gratuit) :

```
cd app
npm install -g eas-cli
eas login
```

Édite `app/eas.json` : remplace l'URL placeholder dans `build.preview.env.EXPO_PUBLIC_API_URL` par une adresse **réellement joignable depuis le téléphone** (pas `localhost`) — soit l'IP publique/domaine d'un backend déployé quelque part, soit l'IP locale de ton ordinateur si le téléphone reste sur le même Wi-Fi en permanence.

```
eas build -p android --profile preview
```

Le build tourne dans le cloud (~10-15 min) et fournit un lien de téléchargement direct du `.apk` à la fin — télécharge-le sur le téléphone et installe-le (autoriser "sources inconnues" au besoin).

## Notes

- Badges de club = initiales colorées, pas de vrais logos (droits d'auteur).
- "Suivis" (transferts suivis) stocké localement sur l'appareil (AsyncStorage) — pas de compte utilisateur.
- Le schéma de données complet (`Transfert`/`Source`/`historique_statut`, 7 statuts) est implémenté tel que spécifié ; seule l'**alimentation automatique** est volontairement réduite aux statuts que des sources réelles permettent d'établir (voir audit ci-dessus).
