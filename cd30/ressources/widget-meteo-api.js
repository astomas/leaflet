/* //// widget vigilance Météo-France - Gard (dept 30) - API officielle ////
   [cd30] Variante de widget-meteo-crues.js : même badge, mêmes pictogrammes,
   mais les données viennent de l'API « Données Publiques Vigilance » de
   Météo-France (portail-api.meteofrance.fr) au lieu d'Opendatasoft + Vigicrues.
   - Couleur crues : celle que Météo-France affiche pour le département, sans
     recalcul par tronçon ni workflow GitHub (vigicrues-30.yml inutile ici).
   - Clé d'API obligatoire (cfg.CLE_API). Elle est lisible dans la page.
   Domaines lus : 30 (Gard) et 3010 (littoral du Gard : vagues-submersion).
   Le badge décrit en priorité l'échéance du jour (J) ; J+1 n'est affiché que
   s'il n'y a rien aujourd'hui. */
function initWidgetMeteo(cfg) {
	var widget = document.getElementById('meteoWidget');
	if (!widget) return;

	var TEST_J  = cfg.TEST_J;
	var TEST_J1 = cfg.TEST_J1;

	var URL_VIGILANCE_GARD = 'https://vigilance.meteofrance.fr/fr/gard';

	/* cfg.URL_API : fichier au format de la réponse de l'API, pour tester le
	   badge par le même chemin (requête réseau) que les données réelles */
	var URL_API = cfg.URL_API
		|| 'https://public-api.meteofrance.fr/public/DPVigilance/v1/cartevigilance/encours';
	var CLE_API = cfg.CLE_API || '';

	/* 30 = département, 3010 = son littoral : Météo-France y publie la
	   vigilance vagues-submersion (numéro du département suivi de « 10 ») */
	var DOMAINES = ['30', '3010'];

	/* clé = phenomenon_id Météo-France */
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
	   cartes pour les boutons easyButton. */
	var ICONES = {
		1: 'fa-wind',                /* vent violent       */
		2: 'fa-cloud-showers-heavy', /* pluie-inondation   */
		3: 'fa-cloud-bolt',          /* orages             */
		4: 'fa-water',               /* crues              */
		5: 'fa-snowflake',           /* neige-verglas      */
		6: 'fa-temperature-high',    /* canicule           */
		7: 'fa-icicles',             /* grand froid        */
		8: 'fa-hill-avalanche',      /* avalanches         */
		9: 'fa-house-tsunami'        /* vagues-submersion  */
	};
	var ICONE_DEFAUT = 'fa-triangle-exclamation';

	// Niveau de vigilance max parmi les alertes (color_id, ou niveau des données TEST)
	function niveauMax(alertes) {
		var max = 0;
		(alertes || []).forEach(function (a) {
			var n = parseInt(a.color_id !== undefined ? a.color_id : a.niveau);
			if (n > max) max = n;
		});
		return max;
	}

	// Libellés des phénomènes de l'échéance affichée, dédoublonnés
	function libellesPhenomenes(alertes) {
		var libs = [];
		(alertes || []).forEach(function (a) {
			var lib = PHENOMENES[parseInt(a.phenomenon_id)] || a.phenomene_lib || '';
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

	// Source et heure de production, ajoutées à l'infobulle du badge.
	// &#10; = retour à la ligne dans l'infobulle.
	function mentionSource(dateMaj) {
		var d = new Date(dateMaj);
		if (isNaN(d)) return '';
		return '&#10;Source : Météo-France, mise à jour du '
			+ d.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) + ' à '
			+ d.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
	}

	function afficher(alertesJ, alertesJ1, dateMaj) {
		var zone = widget.parentElement;
		var aAlerteJ  = !!(alertesJ && alertesJ.length);
		var aAlerteJ1 = !!(alertesJ1 && alertesJ1.length);
		if (!aAlerteJ && !aAlerteJ1) {
			widget.style.display = 'none';
			if (zone) zone.style.display = 'none';
			return;
		}
		// Priorité à l'échéance du jour, même si demain est plus sévère
		var alertes = aAlerteJ ? alertesJ : alertesJ1;
		var libs = libellesPhenomenes(alertes);
		var niveau = NIVEAUX[niveauMax(alertes)] || '';
		var texteNiveau = niveau ? ' ' + niveau : '';
		var texte = (aAlerteJ
				? 'Aujourd\'hui vigilance météo' + texteNiveau
				: 'Alerte météo J+1' + texteNiveau)
			+ (libs.length ? ' ' + libs.join(' / ') : '');
		var classeNiveau = niveau ? ' meteo-niveau-' + niveau : '';
		// aria-hidden : le texte du badge porte déjà l'information
		var icones = iconesPhenomenes(alertes).map(function (cls) {
			return '<i class="fa-solid ' + cls + ' meteo-icone" aria-hidden="true"></i>';
		}).join('');
		widget.innerHTML = '<a class="meteo-alerte-simple' + classeNiveau + '" href="' + URL_VIGILANCE_GARD
			+ '" target="_blank" rel="noopener" title="Voir la vigilance Météo-France du Gard'
			+ mentionSource(dateMaj) + '">'
			+ icones + '<span class="meteo-alerte-texte">' + texte + '</span></a>';
		widget.style.display = 'flex';
		if (zone) zone.style.display = 'flex';
	}

	// Appel de l'API, la clé dans un en-tête (la passerelle la refuse dans
	// l'adresse). L'en-tête attendu dépend du type de clé générée sur le
	// portail : on essaie « apikey », puis « Authorization: Bearer » (forme
	// vérifiée avec un jeton OAuth2) si la première est refusée (401).
	// no-store : la requête part toujours vers le serveur, jamais depuis le cache.
	function appelerApi() {
		function essai(entetes) {
			return fetch(URL_API, { headers: entetes, cache: 'no-store' });
		}
		return essai({ apikey: CLE_API })
		.then(function (r) {
			return r.status === 401 ? essai({ Authorization: 'Bearer ' + CLE_API }) : r;
		})
		.then(function (r) {
			if (!r.ok) throw new Error('API vigilance Météo-France : HTTP ' + r.status);
			return r.json();
		});
	}

	// L'échéance du lendemain est notée « J1 » par l'API ; on normalise
	// (majuscules, ni espace ni « + ») pour accepter aussi « J+1 ».
	function normEcheance(v) {
		return ('' + (v || '')).toUpperCase().replace(/[^A-Z0-9]/g, '');
	}

	// Alertes (jaune et plus) des domaines du Gard pour une échéance, au format
	// attendu par afficher(). phenomenon_max_color_id = niveau le plus élevé de
	// la journée ; pour les crues, c'est la seule information fournie (pas de
	// découpage horaire).
	function alertesEcheance(produit, ech) {
		var periode = (produit.periods || []).filter(function (p) {
			return normEcheance(p.echeance) === ech;
		})[0];
		var alertes = [];
		if (!periode) return alertes;
		((periode.timelaps || {}).domain_ids || []).forEach(function (dom) {
			if (DOMAINES.indexOf('' + dom.domain_id) === -1) return;
			(dom.phenomenon_items || []).forEach(function (ph) {
				var n = parseInt(ph.phenomenon_max_color_id);
				if (n >= 2) alertes.push({ phenomenon_id: parseInt(ph.phenomenon_id), color_id: n });
			});
		});
		return alertes;
	}

	function chargerVigilance() {
		// != null : vrai si TEST_J ou TEST_J1 est renseigné (ni null ni absent)
		if (TEST_J != null || TEST_J1 != null) {
			afficher(TEST_J || [], TEST_J1 || [], null);
			return;
		}
		if (!CLE_API && !cfg.URL_API) {
			console.warn('Widget météo : clé d\'API Météo-France absente (CLE_API)');
			afficher([], [], null);
			return;
		}
		appelerApi()
		.then(function (d) {
			var produit = (d && d.product) || {};
			afficher(alertesEcheance(produit, 'J'), alertesEcheance(produit, 'J1'), produit.update_time);
		})
		.catch(function (e) {
			// panne ou clé refusée : pas de badge plutôt qu'un badge faux
			console.warn('Widget météo :', e.message || e);
			afficher([], [], null);
		});
	}

	chargerVigilance();
}
