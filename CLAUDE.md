# CRM Optimisation — notes pour Claude

Application web statique (GitHub Pages) installable sur téléphone, en français.

## Fichiers
- `index.html` : structure et styles. Aucun script en ligne (politique de sécurité CSP dans la balise meta : toute nouvelle source externe doit y être ajoutée).
- `config.js` : configuration Firebase (clé publique, limitée au site par restriction de référent).
- `core.js` : stockage (Firebase Auth + Firestore, ou stockage local si pas de config) et écran de connexion.
- `app.js` : espace **CRM clients** (accueil, clients, pipeline, relances, fins de contrat, sauvegarde).
- `prospection.js` : espace **Prospection**, séparé du CRM (recherche SIRENE, mes prospects, session d'appels, scripts, modèles de messages, Google Maps).
- `sw.js` : service worker (incrémenter `CACHE` et `APP_VERSION` dans `app.js` à chaque mise en ligne).

## Données (Firestore)
`users/{uid}/clients`, `users/{uid}/prospects`, `users/{uid}/reglages`. Les règles n'autorisent que ces 3 collections, pour le propriétaire du compte.
Les espaces CRM et Prospection ne se mélangent pas : un prospect devient client seulement au rendez-vous ou par conversion manuelle.

## À venir
- Bouton « Générer des leads » (SIRENE + Google Maps, seulement les leads avec numéro, entreprises actives).
- Site vitrine avec référencement et formulaire de contact : les demandes arrivent comme leads dans l'espace Prospection (écriture seule, protection anti-robots, mention RGPD).

## Règles
- Textes de l'interface en français, tutoiement.
- Tester sur mobile (Playwright, appareil iPhone) avant chaque mise en ligne.
- Ne jamais committer de données clients ni de fichiers de sauvegarde.
