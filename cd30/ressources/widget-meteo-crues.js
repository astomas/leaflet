/* //// widget vigilance Météo-France - Gard (dept 30) - opendatasoft, sans clé ////
   [cd30] Un seul badge "Alerte météo" précédé du ou des pictogrammes des
   phénomènes en cours, cliquable vers le site vigilance Gard.
   Le badge n'apparaît que s'il existe au moins une alerte (J ou J+1).
   Il décrit en priorité l'échéance du jour (J), même si le lendemain est
   plus sévère ; l'échéance J+1 n'est affichée que s'il n'y a rien aujourd'hui.
   Variante « crues » : le flux Opendatasoft ne contient pas le phénomène
   crues. Son niveau est lu dans vigicrues-30.json, produit toutes les 15 min
   à partir de Vigicrues par cd30/ressources/vigicrues-30.ps1 (Vigicrues ne
   renvoie pas d'en-tête CORS, la page ne peut pas le lire directement).
   Comme sur vigilance.meteofrance.fr, « crues » apparaît dès le jaune. */
function initWidgetMeteo(cfg) {
	var widget = document.getElementById('meteoWidget');
	if (!widget) return;

	var TEST_J  = cfg.TEST_J;
	var TEST_J1 = cfg.TEST_J1;

	var URL_VIGILANCE_GARD = 'https://vigilance.meteofrance.fr/fr/gard';

	/* Par défaut, le fichier publié par GitHub Actions sur la branche
	   donnees-vigicrues : raw.githubusercontent.com autorise sa lecture depuis
	   n'importe quelle page. Une page servie par IIS pourra indiquer son propre
	   fichier via cfg.URL_CRUES. */
	var URL_CRUES = cfg.URL_CRUES
		|| 'https://raw.githubusercontent.com/astomas/leaflet/donnees-vigicrues/vigicrues-30.json';
	/* La vigilance crues vaut 24 h à partir de sa production. Au-delà, le
	   fichier n'est plus alimenté : mieux vaut ne rien afficher qu'un niveau périmé. */
	var VALIDITE_CRUES_MS = 24 * 3600 * 1000;

	/* clé = phenomenon_id Météo-France (entiers stables, cf. métadonnées dataset) */
	var PHENOMENES = {
		1: 'vent violent',
		2: 'pluie-inondation',
		3: 'orages',
		4: 'crues',
		5: 'neige-verglas',
		6: 'canicule',
		7: 'grand froid',
		8: 'avalanches',
		9: 'vagues-submersion'
	};

	/* clé = color_id Météo-France (2 jaune, 3 orange, 4 rouge) */
	var NIVEAUX = { 2: 'jaune', 3: 'orange', 4: 'rouge' };

	/* Pictogramme par phénomène : classes Font Awesome, déjà chargées par les
	   cartes pour les boutons easyButton. Aucun fichier image à déployer.
	   Toutes présentes dès la 6.1, donc valables aussi en 6.6. */
	var ICONES = {
		1: 'fa-wind',                /* vent violent       */
		2: 'fa-cloud-showers-heavy', /* pluie-inondation   */
		3: 'fa-cloud-bolt',          /* orages             */
		4: 'fa-water',               /* crues              */
		5: 'fa-snowflake',           /* neige-verglas      */
		6: 'fa-temperature-high',    /* canicule           */
		7: 'fa-icicles',             /* grand froid : silhouette distincte du
		                                thermometre, illisible a cette taille  */
		8: 'fa-hill-avalanche',      /* avalanches         */
		9: 'fa-house-tsunami'        /* vagues-submersion  */
	};
	var ICONE_DEFAUT = 'fa-triangle-exclamation';

	// Niveau de vigilance max parmi les alertes (color_id du flux, ou niveau des données TEST)
	function niveauMax(alertes) {
		var max = 0;
		(alertes || []).forEach(function (a) {
			var n = parseInt(a.color_id !== undefined ? a.color_id : a.niveau);
			if (n > max) max = n;
		});
		return max;
	}

	// Libellés des phénomènes de l'échéance affichée, dédoublonnés, en minuscules
	function libellesPhenomenes(alertes) {
		var libs = [];
		(alertes || []).forEach(function (a) {
			var lib = PHENOMENES[parseInt(a.phenomenon_id)] || a.phenomenon || a.phenomene_lib || '';
			lib = ('' + lib).toLowerCase().trim();
			if (lib && libs.indexOf(lib) === -1) libs.push(lib);
		});
		return libs;
	}

	// Pictogrammes des phénomènes en cours, dédoublonnés, dans l'ordre des libellés
	function iconesPhenomenes(alertes) {
		var classes = [];
		(alertes || []).forEach(function (a) {
			var cls = ICONES[parseInt(a.phenomenon_id)] || ICONE_DEFAUT;
			if (classes.indexOf(cls) === -1) classes.push(cls);
		});
		return classes;
	}

	function afficher(alertesJ, alertesJ1) {
		var zone = widget.parentElement;
		var aAlerteJ  = !!(alertesJ && alertesJ.length);
		var aAlerteJ1 = !!(alertesJ1 && alertesJ1.length);
		if (!aAlerteJ && !aAlerteJ1) {
			widget.style.display = 'none';
			if (zone) zone.style.display = 'none';
			return;
		}
		// [cd30] Priorité à l'échéance du jour : dès qu'une alerte est en cours
		// aujourd'hui, le badge ne décrit qu'elle (niveau, phénomènes, pictos),
		// même si demain est plus sévère. Ex. jaune J + orange J+1 donne
		// "Aujourd'hui vigilance météo jaune ..." et non plus "Alerte météo orange ...".
		var alertes  = aAlerteJ ? alertesJ : alertesJ1;
		var libs = libellesPhenomenes(alertes);
		var niveau = NIVEAUX[niveauMax(alertes)] || '';
		var texteNiveau = niveau ? ' ' + niveau : '';
		var texte = (aAlerteJ
				? 'Aujourd\'hui vigilance météo' + texteNiveau
				: 'Alerte météo J+1' + texteNiveau)
			+ (libs.length ? ' ' + libs.join(' / ') : '');
		// [cd30] classe de niveau : colore le fond du badge selon la vigilance
		var classeNiveau = niveau ? ' meteo-niveau-' + niveau : '';
		// [cd30] pictogrammes des phénomènes, à gauche du libellé. aria-hidden :
		// le texte du badge porte déjà l'information, l'icône ne fait que l'illustrer.
		var icones = iconesPhenomenes(alertes).map(function (cls) {
			return '<i class="fa-solid ' + cls + ' meteo-icone" aria-hidden="true"></i>';
		}).join('');
		widget.innerHTML = '<a class="meteo-alerte-simple' + classeNiveau + '" href="' + URL_VIGILANCE_GARD
			+ '" target="_blank" rel="noopener" title="Voir la vigilance Météo-France du Gard">'
			+ icones + '<span class="meteo-alerte-texte">' + texte + '</span></a>';
		widget.style.display = 'flex';
		if (zone) zone.style.display = 'flex';
	}

	// Alerte crues au format du flux Opendatasoft, ou null si pas de vigilance,
	// fichier absent ou périmé : le badge fonctionne alors comme sans crues.
	function chargerCrues() {
		// no-cache : le navigateur revalide le fichier au lieu de resservir sa copie
		return fetch(URL_CRUES, { cache: 'no-cache' })
		.then(function(r) { return r.ok ? r.json() : null; })
		.then(function(d) {
			if (!d) return null;
			var age = Date.now() - Date.parse(d.date);
			// écrit « !(age < ...) » et non « age >= ... » : une date illisible
			// donne NaN, et toute comparaison avec NaN est fausse
			if (!(age < VALIDITE_CRUES_MS)) return null;
			var n = parseInt(d.niveau);
			return n >= 2 ? { phenomenon_id: 4, color_id: n } : null;
		})
		.catch(function() { return null; });
	}

	function chargerVigilance() {
		if (TEST_J !== null || TEST_J1 !== null) {
			afficher(TEST_J || [], TEST_J1 || []);
			return;
		}
		var url = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/'
			+ 'weatherref-france-vigilance-meteo-departement/records'
			+ '?where=domain_id%3D%2230%22%20AND%20color_id%20%3E%201&limit=30';
		// une panne d'Opendatasoft ne doit pas masquer la vigilance crues, et inversement
		var requeteOds = fetch(url)
			.then(function(r) { return r.json(); })
			.catch(function() { return null; });
		Promise.all([requeteOds, chargerCrues()])
		.then(function(resultats) {
			var data = resultats[0];
			var crues = resultats[1];
			var recs = (data && data.results) || [];
			// L'echeance du lendemain est publiee tantot "J1" (convention de
			// l'API Meteo-France) tantot "J+1". On normalise (majuscules, on
			// retire tout ce qui n'est ni lettre ni chiffre) pour reconnaitre
			// les deux : sans cela les alertes de demain n'apparaissent jamais.
			function normEcheance(v) {
				return ('' + (v || '')).toUpperCase().replace(/[^A-Z0-9]/g, '');
			}
			function filtrer(ech) {
				return recs.filter(function(r) {
					return normEcheance(r.echeance) === ech && parseInt(r.color_id) >= 2;
				});
			}
			// Météo-France relaie les crues sur les cartes du jour et du
			// lendemain, sans chronologie. Le badge donnant la priorité à J, il
			// suffit de les ajouter à J : dès qu'elles existent, J+1 n'est plus affiché.
			var alertesJ = filtrer('J');
			if (crues) alertesJ.push(crues);
			afficher(alertesJ, filtrer('J1'));
		}).catch(function() { afficher([], []); });
	}

	chargerVigilance();
}
