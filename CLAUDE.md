# Dépôt de cartes Leaflet — conventions

Collection de pages HTML autonomes (une carte = un fichier). Pas de build,
pas de gestionnaire de paquets : tout est chargé par balises `<script>`.

## Chemins des ressources — à ne pas corriger

Les pages sont déployées sur un serveur interne, pas sur GitHub Pages. Les
chemins absolus qu'elles contiennent visent l'arborescence de CE serveur, et
non celle du dépôt. Plusieurs racines coexistent selon l'ancienneté des pages :

- `/leaflet/Ressources 26/...`
- `/Ressources/API_JS/...` et `/Ressources/API_JS/modern UI/...`

**Ne pas signaler ces chemins comme cassés et ne pas les réécrire** parce
qu'ils ne correspondent à aucun fichier du dépôt. Les copies de bibliothèques
présentes ici (`Ressources/`, `Ressources 26/`) servent de référence pour
lire le code d'un plugin, pas de cible pour les liens des pages.

Seuls les chemins **relatifs** doivent suivre l'emplacement réel du fichier
dans le dépôt.

## Bibliothèques : vérifier l'API dans le fichier, pas de mémoire

Les plugins vendorisés sont figés à une version donnée. Avant de corriger un
appel, lire le source dans `Ressources/API_JS/` ou `Ressources 26/`.

Pièges déjà rencontrés :

- `leaflet.browser.print.js` expose **`L.Control.BrowserPrint.Utils`**, et non
  `L.BrowserPrint.Utils`.
- Leaflet est en 1.9.x : `map.options.zoomAnimation` n'est lu qu'à la création
  de la carte ; seul `map._zoomAnimated` est relu à chaque zoom.

## Fichiers volumineux

Plusieurs cartes pèsent 8 à 10 Mo (GeoJSON embarqué). **Ne jamais les déplacer
ni les renommer depuis l'interface web de GitHub** : elle tronque leur contenu
sans prévenir. Passer par git en local.

## Langue

Commentaires, noms de variables et messages de commit en français.
