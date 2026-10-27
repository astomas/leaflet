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

Exception : les pages publiées sur GitHub Pages (cartes à la racine de
`cd30/` et de `leaflet sidebar full/`) visent les fichiers du dépôt :
`Ressources 26/` (plugins déjà adaptés, chemins internes en `/leaflet/...`),
`Ressources 26/maptiler/` (SDK, plugin et styles JSON MapTiler),
`Ressources/API_JS/` (Font Awesome, icônes) et `cd30/ressources/`.

GitHub Pages publie tout le dépôt : les autres pages (`menus/`, `cd30/autre/`)
y sont lisibles, clés d'API comprises, mais visent le serveur interne et ne
s'y affichent pas.

## Bibliothèques : vérifier l'API dans le fichier, pas de mémoire

Les plugins vendorisés sont figés à une version donnée. Avant de corriger un
appel, lire le source dans `Ressources/API_JS/` ou `Ressources 26/`.

Pièges déjà rencontrés :

- `leaflet.browser.print.js` expose **`L.Control.BrowserPrint.Utils`**, et non
  `L.BrowserPrint.Utils`.
- Leaflet est en 1.9.x : `map.options.zoomAnimation` n'est lu qu'à la création
  de la carte ; seul `map._zoomAnimated` est relu à chaque zoom.
  Mais chaque couche recopie `map._zoomAnimated` **à son ajout** : le modifier
  en cours de route laisse les couches ajoutées entre-temps sans animation
  (décalage au zoom). Pour couper l'animation à chaud, passer
  `map.options.zoomAnimationThreshold` à 0 (relu à chaque zoom).
- Le SDK MapTiler résout une adresse de style relative depuis
  `location.origin`, pas depuis la page : sur GitHub Pages le préfixe
  `/leaflet/` serait perdu. Passer `new URL(chemin, document.baseURI).href`.

## Menus du portail si3p0 (`menus/`)

Copie partielle de la chaîne qui produit les pages d'index des thématiques
sur le serveur interne. Les chemins PS1 (`$PSScriptRoot\..\Ressources\...`,
`api_complète.ps1`, `constantes_si3p0.ps1`) visent l'arborescence du serveur ;
plusieurs fichiers appelés (`LàD_4h.ps1`, constantes, `fonctions_outils.ps1`,
fonctions SQL `vershtml_*`) ne sont pas dans le dépôt.
`menus/ex chemin a modifier/` : exemples de scripts métier dont les chemins de
sortie doivent suivre tout renommage de thématique. `menus/specs.png` : refonte
des thématiques envisagée.

Chaîne de génération :

1. Le contenu est l'arborescence sous `$si3p0ThematiquesPortailWeb`
   (`/Thématiques/` côté web) : dossier = thématique, sous-dossier = bloc
   (`Cartes dynamiques`, `Tableaux`…), fichier `.html`/`.pdf`/`.url` = lien.
2. Les scripts métier (`LàD_4h.ps1`, `manuel_*.ps1`) écrivent directement dans
   ces dossiers : cartes via `SI3P0-Generer-Carte` (la fonction PostgreSQL
   `vershtml_n`/`vershtml_heatmap` renvoie la page complète), tableaux via CSV
   puis `SI3P0-Generer-Tableaux-Portail` (`modèle_page_tableau.html` +
   `tableaux_fr.js`), PDF via QGIS.
3. `SI3P0-Generer-Thematiques-Portail` (`fonctions_si3p0.ps1`, lancé par
   `tester.ps1`) écrit un `index.html` brut par thématique depuis
   `modèle_page_accordeon.html` : une `accordeon-section` par sous-dossier (id
   de la case = nom du dossier), un lien par fichier (`.url` → adresse cible,
   ex. Metabase). Les sous-thématiques, cherchées par nom à toute profondeur,
   reçoivent leur propre index avec un bouton retour `../`.
4. Dans le navigateur, `nvx_menus.js` reconstruit ce DOM : sections
   principales → cartes (icône, compteur, ordre `ordrePrincipal`, tri propre aux
   cartes dynamiques, 10 liens visibles, liens http(s) des Tableaux regroupés
   sous « Tableaux de bord Metabase ») ; sous-thématiques → mini-cartes pointant
   vers leur premier lien (leur `index.html`) ; section `statistiques` masquée.
5. L'accueil (`index-page-accueil.html` + `si3p0_accueil.css`) est écrit à la
   main : une tuile en dur par thématique.

Pièges :

- Un nom de dossier est codé en dur à plusieurs endroits, à modifier ensemble :
  - sous-thématiques : filtre `Where-Object` de
    `SI3P0-Generer-Thematiques-Portail` **et** `listeSousThematique`,
    `iconesSousThema`, `descriptionsSousThema` de `nvx_menus.js` (clés en
    minuscules) ;
  - blocs : `icones` et `ordrePrincipal` de `nvx_menus.js` (un bloc absent
    d'`icones` s'affiche replié, en carte réduite) ;
  - `Territoires - PER` / `fiches cantonales` : cas spécial dans
    `SI3P0-Generer-Thematiques-Portail` ;
  - tuiles de `index-page-accueil.html` ;
  - chemins de sortie de tous les scripts métier.
- `nvx_menus.js` repère les boutons accueil et retour par leur `href` exact
  (`http://si3p0`, `../`) : les garder identiques dans les modèles et le PS1.
- Nouvelle sous-thématique : l'index parent est écrit avant le sien, donc au
  premier lancement sa mini-carte pointe vers `#`. Relancer une fois.
- `SI3P0-Generer-Accueil-Portail` est obsolète (classes `cadre_thematique`
  absentes des CSS, page vidée par `nvx_menus.js`) : ne pas l'utiliser, il
  écraserait l'accueil manuel.
- `-activerBoutonAccueil` est sans effet avec les modèles accordéon et tableau
  (bouton accueil toujours présent).

`menus/nouvelle arborescence/` : copies modifiées, mêmes noms, de
`fonctions_si3p0.ps1`, `nvx_menus.js` et `index-page-accueil.html` pour la
refonte de `specs.png` (originaux inchangés), et dans son sous-dossier
`ex chemin a modifier/` les scripts 3V avec leurs chemins de sortie adaptés.
Arborescence cible :

```
Thématiques/
  Référentiels/         Route/ · Véloroutes et Voies Vertes/ · Lieux de covoiturage/ · Bâtiments/
  Exploitation/         Route/ (PPBE, Waze) · Véloroutes et Voies Vertes/
  Entretiens et Suivi/  Route/ (Chute de blocs, Curage, Fauchage) · Bâtiments/
  Actes admin. et juridiques/ · Territoires - PER/ · Education/ · Très Haut Débit/
```

`Référentiels/Bâtiments` reprend « Patrimoine foncier et bâti »,
`Entretiens et Suivi/Bâtiments` reprend « Exploitation et Suivi Bâtiments ».
Une sous-thématique présente dans plusieurs thématiques (`Route`, `Bâtiments`)
partage la même icône et la même description : les garder génériques.

Différences avec les originaux :

- sous-thématiques « réseau » (`Route`, `Véloroutes et Voies Vertes`,
  `Lieux de covoiturage`, `Bâtiments`) : 4 premiers noms de
  `$nomsSousThematiques` côté PS1, `listeSousThematiqueHaut` côté JS, affichées
  en haut de page dans cet ordre ;
- index générés du plus profond au moins profond, thématique en dernier : plus
  besoin de relancer pour une nouvelle sous-thématique ;
- titre « Thématique - Sous-thématique » pour une sous-thématique directe
  (`Route` existe dans plusieurs thématiques).

## Fichiers volumineux

Plusieurs cartes pèsent 8 à 10 Mo (GeoJSON embarqué). **Ne jamais les déplacer
ni les renommer depuis l'interface web de GitHub** : elle tronque leur contenu
sans prévenir. Passer par git en local.

## Langue

Commentaires, noms de variables et messages de commit en français.
