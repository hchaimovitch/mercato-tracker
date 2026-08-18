# Mercato Tracker

App de suivi du mercato de football pour les 5 grands championnats européens (Angleterre, France, Allemagne, Italie, Espagne) — dark mode, accent ambre, score de fiabilité multi-facteurs (score de Wilson). Conçue à partir du prototype Claude Design dans `project/Mercato.dc.html` (voir `chats/chat1.md`), puis reconstruite avec de vraies données et un vrai backend suite à l'audit de faisabilité ci-dessous.

## Structure

- `backend/` — API Node/Express/TypeScript. Base de données via `@libsql/client` (compatible SQLite) : un simple fichier local en développement, ou une base **Turso** (gratuite, persistante) en production. Synchronise les transferts officiels confirmés (API-Football) et, en option, les rumeurs (SportMonks Transfer Rumours). Contient tout le moteur métier : score de Wilson, score de fiabilité par transfert, pipeline de recalcul en cascade.
- `app/` — App Expo/React Native/TypeScript (iOS/Android) qui consomme cette API.
- `project/`, `chats/` — le bundle Claude Design d'origine (prototype HTML/JS), conservé pour référence.

## Ce qui est réel, et ce qui ne l'est pas — résumé de l'audit

**Réel et automatisé :**
- Transferts officiels confirmés, via API-Football (gratuit, 100 req/jour — largement suffisant pour synchroniser les 5 championnats en tâche de fond). Le plan gratuit limite aussi à 10 req/min (pas seulement le quota journalier) — un passage sans pause entre les appels a dépassé ce plafond et fait suspendre le compte une fois ; les appels sont désormais espacés (`API_FOOTBALL_MIN_INTERVAL_MS`).
- **Cumulable avec le dataset Transfermarkt** (voir "Montant du transfert" ci-dessous, qui crée aussi des transferts officiels depuis peu, pas seulement leur montant) — utile tant qu'API-Football reste suspendu, mais continue de tourner en parallèle si le compte est réactivé un jour. Les deux sources ne créent pas de doublons quand elles voient le même transfert : `trouverTransfertApprochant` (`backend/src/repo/transferts.repo.ts`) fait une correspondance par nom de famille + mêmes clubs + même fenêtre en repli de la clé exacte, pour absorber le fait qu'API-Football abrège les prénoms ("A. Cozier-Duberry") alors que Transfermarkt les écrit en entier ("Archie Cozier-Duberry").
- Fiabilité des sources : score de Wilson (borne basse à 95%) calculé sur l'historique **réellement accumulé par l'app** (confirmé/infirmé au fil des résolutions de transferts) — aucune donnée d'amorçage inventée. Une source neuve affiche "historique insuffisant", pas un pourcentage flatteur.
- Score de fiabilité par transfert : moyenne pondérée (catégorie de source × primaire/relais) + bonus de corroboration, normalisée sur 100 — voir `backend/src/domain/reliability.ts`.
- Pipeline de recalcul en cascade : la résolution d'un transfert (officiel/annulé) met à jour les compteurs des sources citées, puis recalcule le score des autres transferts en cours citant ces mêmes sources — voir `backend/src/domain/cascade.ts`.

**Rumeurs (optionnel) :**
- SportMonks propose une vraie "Transfer Rumours API" (probabilité LOW/MEDIUM/HIGH + source + lien) — le seul fournisseur trouvé avec des rumeurs structurées. C'est un add-on payant dont le prix exact n'est pas public ; l'intégration est prête (`backend/src/ingestion/sportmonks.*`) mais désactivée tant que `SPORTMONKS_KEY` n'est pas renseignée. Sans elle, l'app fonctionne normalement avec uniquement les transferts officiels.
- Alternative gratuite en complément : `backend/src/ingestion/rssRumeurs.*` lit 2 flux RSS publics (BBC Sport, Sky Sports football), filtre les articles qui citent un club Big 5 par son nom complet (limite connue : un article qui n'utilise qu'un surnom de club, "Gunners"/"Red Devils", sans jamais écrire le nom complet, ne matchera pas), puis envoie uniquement les candidats retenus à Claude Haiku 4.5 pour extraire joueur/clubs/probabilité en JSON structuré (schéma Zod, `client.messages.parse`). Désactivé tant que `ANTHROPIC_API_KEY` n'est pas renseignée. Coût estimé : quelques millièmes de dollar par article analysé (Haiku, ~500-1000 tokens en entrée par appel) — un crédit de 5$ devrait durer plusieurs mois vu le faible volume (2 flux, filtrés). **Non testé avec une vraie clé Anthropic depuis cet environnement** (comme SportMonks) ; les URLs des 2 flux RSS n'ont pas non plus pu être vérifiées en direct depuis ce bac à sable (accès réseau sortant restreint à une liste blanche qui ne les inclut pas) — à vérifier une fois déployé, en cas d'URL changée côté BBC/Sky il suffira de corriger `FLUX_RSS` dans `rssRumeurs.client.ts`.
- **Limite assumée** : aucune source ne fournit automatiquement les statuts fins `contact_confirme` / `negociation` / `accord_clubs` / `accord_joueur`. Le pipeline automatique ne peuple que `rumeur` (LOW), `contact_confirme` (MEDIUM), `negociation` (HIGH) et `officiel`. Les statuts `accord_clubs`, `accord_joueur` et `annule` restent réservés à la curation manuelle (`PATCH /curation/transferts/:id/statut`) — pas de UI dédiée dans l'app pour l'instant, seulement l'endpoint.
- La fiche transfert distingue visuellement une étape "confirmée", "sautée (non documentée)" ou "ajustée manuellement" — jamais présentée comme certaine si elle ne l'est pas.

**Montant du transfert, et transferts officiels via Transfermarkt :**
- `/transfers` d'API-Football (même en payant) ne stocke quasiment jamais de vrai montant — le champ contient le *type* de mouvement (`Transfer`/`Loan`/`Free agent`/`Return from loan`/…), pas une valeur financière ; un montant chiffré n'apparaît que très rarement et de façon non structurée. (Wikidata/Wikipédia n'ont pas de champ structuré pour ça non plus — vérifié, pas supposé.) **Cette limite aurait dû être testée et documentée dès l'audit initial plutôt que découverte après coup sur les premières vraies données — erreur reconnue.**
- Complété depuis par [`dcaribou/transfermarkt-datasets`](https://github.com/dcaribou/transfermarkt-datasets) (CC0-1.0), un jeu de données déjà scrappé et republié par un tiers, rafraîchi chaque semaine par son propre pipeline — `backend/src/ingestion/transfermarktDataset.ts` télécharge ce fichier déjà publié, **aucune requête n'est envoyée à transfermarkt.com par ce backend**. Deux usages, sur un seul téléchargement partagé (`synchroniserTransfermarkt`) :
  - **Créer les transferts officiels absents de la base** (nouveau — au départ ce dataset ne servait qu'à compléter des montants ; réutilisé comme source à part entière pendant la suspension d'API-Football, voir plus haut). Ne retient une ligne que si au moins un club est Big 5 *et* que l'autre club est déjà identifiable dans notre table (Big 5 ou déjà connu hors Big 5 via API-Football) — sinon la ligne est ignorée plutôt que d'inventer un club sans id fiable (pas de logo possible, risque de doublon sous un nom légèrement différent).
  - **Compléter le montant** des transferts déjà connus par ailleurs.
  - Dans les deux cas, correspondance par nom de joueur + nom de club normalisés (Transfermarkt utilise son propre espace d'identifiants, sans lien avec API-Football) — en cas d'ambiguïté (plusieurs candidats, aucun club qui corresponde), le transfert est laissé de côté plutôt que de risquer une donnée fausse.
  - Tourne une fois par semaine (`TRANSFERMARKT_DATASET_CRON`, calé sur le rythme de rafraîchissement de la source) — donc moins réactif qu'API-Football (qui, lui, synchronise en continu par lots), c'est le compromis pour une source 100% gratuite et non bloquée.
- Position/âge/nationalité du joueur, valeur marchande, durée de contrat, salaire — nécessiteraient des appels API supplémentaires (quota) ou un fournisseur différent. Champs simplement omis, pas inventés.
- Classification automatique de la catégorie d'une source (`club_officiel`/`journaliste_reconnu`/`media_generaliste`/`non_verifie`) : catalogue curaté à la main (`backend/src/ingestion/sourceCategorization.ts`), toute source inconnue tombe par défaut sur `non_verifie` plutôt que de lui prêter une crédibilité non vérifiée.
- Correspondance des clubs entre fournisseurs (API-Football / SportMonks) : par nom normalisé, faute d'identifiant commun — limite documentée dans le code, peut manquer une rumeur en cas de variante de nom trop inhabituelle.

**Photo du joueur :**
- Construite à partir de l'id joueur d'API-Football (`https://media.api-sports.io/football/players/{id}.png`, même convention CDN que les logos de club), disponible uniquement pour les transferts vus par API-Football. Un transfert créé d'abord via RSS/SportMonks (pas d'id joueur fourni par ces sources) n'a pas de photo tant qu'API-Football ne le confirme pas à son tour — repli sur des initiales dans ce cas, jamais de photo devinée.

**Alertes push (joueur/club) :**
- `backend/src/routes/alertes.ts` (CRUD) + un déclenchement dans `enregistrerCitation()` (`backend/src/ingestion/matching.ts`) qui notifie les alertes concernées via le service push gratuit d'Expo à chaque nouvelle rumeur, mise à jour de statut, ou résolution (officiel/annulé). Pas de compte utilisateur : le push token de l'appareil sert d'identifiant.
- Correspondance joueur par nom de famille normalisé (même principe que la complétion des montants Transfermarkt) — un homonyme exact ferait matcher à tort, cas jugé rare.
- **Nécessite une configuration Firebase/FCM V1 côté build** (voir section "Construire le .apk final" ci-dessous) — sans ça, l'app ne peut pas obtenir de push token et l'écran Alertes affiche un message l'expliquant plutôt que d'échouer silencieusement.

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

## Déployer le backend (pour un .apk qui marche sans dépendre de ton Mac/réseau)

Un backend qui tourne sur ton ordinateur oblige le téléphone à rester sur le même
réseau. Pour un backend accessible depuis n'importe où, gratuitement :

**1. Base de données Turso** (persistante, gratuite, pas de date d'expiration)
- Sur https://turso.tech, crée une base de données (bouton "Create Database").
- Récupère son URL de connexion (commence par `libsql://...`) et crée un jeton
  d'accès ("Create Token") — les deux sont affichés dans le tableau de bord de
  la base.

**2. Pousser le code sur GitHub**
```
cd ~/Documents/mercatotracker
git init
git add .
git commit -m "Premier commit"
```
Crée un dépôt vide sur https://github.com/new (ex: `mercato-tracker`), puis :
```
git remote add origin https://github.com/TON-PSEUDO/mercato-tracker.git
git branch -M main
git push -u origin main
```

**3. Render** (hébergement du backend, gratuit, sans carte bancaire)
- Sur https://render.com, "New +" → "Web Service" → connecte ton compte GitHub → choisis le dépôt.
- Configure :
  - **Root Directory** : `backend`
  - **Build Command** : `npm install && npm run build`
  - **Start Command** : `npm start`
  - **Plan** : Free
- Dans "Environment Variables", ajoute : `API_FOOTBALL_KEY`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (et `SPORTMONKS_KEY`/`ANTHROPIC_API_KEY` si tu les as).
- Déploie. Render te donne une URL du style `https://mercato-backend-xxxx.onrender.com`.

⚠️ Le plan gratuit de Render met le service en veille après 15 min d'inactivité (environ 1 min pour se réveiller au prochain appel) — normal, pas un bug.

## Construire le .apk final

Un build de développement (Expo Go) ne suffit pas pour un fichier installable de façon autonome — il faut un vrai build via **EAS Build** (cloud Expo, compte gratuit) :

```
cd app
npx eas-cli@latest login
```

(Utilise `npx eas-cli@latest` plutôt que `npm install -g eas-cli` si l'install globale échoue avec une erreur de permissions `EACCES` — évite complètement le problème.)

Édite `app/eas.json` : remplace l'URL placeholder dans `build.preview.env.EXPO_PUBLIC_API_URL` par une adresse **réellement joignable depuis le téléphone** (pas `localhost`) — soit l'IP publique/domaine d'un backend déployé quelque part, soit l'IP locale de ton ordinateur si le téléphone reste sur le même Wi-Fi en permanence.

**Pour que les alertes push fonctionnent (Android)**, une étape supplémentaire est nécessaire — Google a déprécié l'ancien protocole FCM et exige désormais un vrai projet Firebase, Expo n'a plus d'identifiants partagés utilisables en production :

1. Lie le projet à EAS s'il ne l'est pas déjà : `npx eas-cli@latest init` (écrit `extra.eas.projectId` dans `app.json` — commit ce changement).
2. Crée un projet sur https://console.firebase.google.com (ou réutilise un projet existant).
3. Dans Firebase, **Project settings → Service accounts** → "Generate New Private Key" → télécharge le JSON.
4. `npx eas-cli@latest credentials` → `Android` → `production` (ou le profil utilisé) → `Google Service Account` → "Set up a Google Service Account Key" → upload le JSON téléchargé (ne le commit jamais, ajoute-le à `.gitignore` si besoin).
5. Toujours dans Firebase Console, ajoute une app Android avec le même nom de package que `app.json` (`com.mercatotracker.app`), télécharge `google-services.json`, place-le à la racine de `app/`, et ajoute dans `app.json` : `"android": { "googleServicesFile": "./google-services.json" }`.

Sans cette configuration, l'app fonctionne normalement pour tout le reste — l'écran Alertes affiche juste un message expliquant que les notifications ne sont pas disponibles, plutôt que d'échouer silencieusement.

```
eas build -p android --profile preview
```

Le build tourne dans le cloud (~10-15 min) et fournit un lien de téléchargement direct du `.apk` à la fin — télécharge-le sur le téléphone et installe-le (autoriser "sources inconnues" au besoin).

## Notes

- Badges de club = logo officiel (fourni par API-Football, champ `logo` de `/teams`) quand disponible, sinon repli sur des initiales colorées (clubs hors Big 5 découverts via `/transfers`, qui ne renvoie pas de logo). **Ce choix n'est justifié que pour un usage strictement personnel, jamais publié/distribué** (usage nominatif de marques déposées, toléré en pratique pour un projet perso non commercial mais pas pour une app distribuée ou publiée sur un store) — si ce projet devait un jour être partagé publiquement, revenir aux initiales.
- "Suivis" (transferts suivis) stocké localement sur l'appareil (AsyncStorage) — pas de compte utilisateur.
- Le schéma de données complet (`Transfert`/`Source`/`historique_statut`, 7 statuts) est implémenté tel que spécifié ; seule l'**alimentation automatique** est volontairement réduite aux statuts que des sources réelles permettent d'établir (voir audit ci-dessus).
