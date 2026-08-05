/* //// widget vigilance Météo-France - Gard (dept 30) - opendatasoft, sans clé ////
   [cd30] Un seul badge "Alerte météo" précédé du ou des pictogrammes des
   phénomènes en cours, cliquable vers le site vigilance Gard.
   Le badge n'apparaît que s'il existe au moins une alerte (J ou J+1). */
function initWidgetMeteo(cfg) {
	var widget = document.getElementById('meteoWidget');
	if (!widget) return;

	var TEST_J  = cfg.TEST_J;
	var TEST_J1 = cfg.TEST_J1;

	var URL_VIGILANCE_GARD = 'https://vigilance.meteofrance.fr/fr/gard';

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

	// Libellés des phénomènes en cours (J + J+1), dédoublonnés, en minuscules
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
		var aAlerte = (alertesJ && alertesJ.length) || (alertesJ1 && alertesJ1.length);
		if (!aAlerte) {
			widget.style.display = 'none';
			if (zone) zone.style.display = 'none';
			return;
		}
		var toutes = [].concat(alertesJ || [], alertesJ1 || []);
		var libs = libellesPhenomenes(toutes);
		var niveau = NIVEAUX[niveauMax(toutes)] || '';
		// alerte uniquement sur l'échéance J+1 (rien aujourd'hui) : on le précise
		var seulementDemain = !(alertesJ && alertesJ.length) && (alertesJ1 && alertesJ1.length);
		var texte = 'Alerte météo' + (seulementDemain ? ' J+1' : '')
			+ (niveau ? ' ' + niveau : '') + (libs.length ? ' ' + libs.join(' / ') : '');
		// [cd30] classe de niveau : colore le fond du badge selon la vigilance
		var classeNiveau = niveau ? ' meteo-niveau-' + niveau : '';
		// [cd30] pictogrammes des phénomènes, à gauche du libellé. aria-hidden :
		// le texte du badge porte déjà l'information, l'icône ne fait que l'illustrer.
		var icones = iconesPhenomenes(toutes).map(function (cls) {
			return '<i class="fa-solid ' + cls + ' meteo-icone" aria-hidden="true"></i>';
		}).join('');
		widget.innerHTML = '<a class="meteo-alerte-simple' + classeNiveau + '" href="' + URL_VIGILANCE_GARD
			+ '" target="_blank" rel="noopener" title="Voir la vigilance Météo-France du Gard">'
			+ icones + '<span class="meteo-alerte-texte">' + texte + '</span></a>';
		widget.style.display = 'flex';
		if (zone) zone.style.display = 'flex';
	}

	function chargerVigilance() {
		if (TEST_J !== null || TEST_J1 !== null) {
			afficher(TEST_J || [], TEST_J1 || []);
			return;
		}
		var url = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/'
			+ 'weatherref-france-vigilance-meteo-departement/records'
			+ '?where=domain_id%3D%2230%22%20AND%20color_id%20%3E%201&limit=30';
		fetch(url)
		.then(function(r) { return r.json(); })
		.then(function(data) {
			var recs = (data && data.results) || [];
			function filtrer(ech) {
				return recs.filter(function(r) {
					return (r.echeance || '').trim() === ech && parseInt(r.color_id) >= 2;
				});
			}
			afficher(filtrer('J'), filtrer('J+1'));
		}).catch(function() { afficher([], []); });
	}

	chargerVigilance();
}
