/* //// widget vigilance Météo-France - Gard (dept 30) - API officielle ////
cela servira quand meteo france diffusera alertes infra departementales via leur API
   [cd30] Variante de widget-meteo-crues.js : les données viennent de l'API « Données Publiques Vigilance » de
   Météo-France (portail-api.meteofrance.fr) au lieu d'Opendatasoft + Vigicrues.
   Clé d'API obligatoire : CLE_PAR_DEFAUT ci-dessous (ou cfg.CLE_API). lisible par tout visiteur de la page.
   Domaines lus : 30 (Gard) et 3010 (littoral du Gard : vagues-submersion).
   Le badge décrit en priorité l'échéance du jour (J) ; J+1 n'est affiché que s'il n'y a rien aujourd'hui. */
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
	/* Clé « API Key » du portail portail-api.meteofrance.fr (API Données
	   Publiques Vigilance) : remplacer VOTRE_CLE par la clé, entre les
	   apostrophes. Une page peut en imposer une autre via cfg.CLE_API. */
	var CLE_PAR_DEFAUT = 'eyJ4NXQiOiJZV0kxTTJZNE1qWTNOemsyTkRZeU5XTTRPV014TXpjek1UVmhNbU14T1RSa09ETXlOVEE0Tnc9PSIsImtpZCI6ImdhdGV3YXlfY2VydGlmaWNhdGVfYWxpYXMiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0aG9tYXMuZm9udGFpbmUyMUBjYXJib24uc3VwZXIiLCJhcHBsaWNhdGlvbiI6eyJvd25lciI6InRob21hcy5mb250YWluZTIxIiwidGllclF1b3RhVHlwZSI6bnVsbCwidGllciI6IlVubGltaXRlZCIsIm5hbWUiOiJEZWZhdWx0QXBwbGljYXRpb24iLCJpZCI6NDIzODMsInV1aWQiOiIyMWFlMGU4MS0yZTQ5LTQ3ZWMtYjY5NC02MGM2ODhkMTgxODQifSwiaXNzIjoiaHR0cHM6XC9cL3BvcnRhaWwtYXBpLm1ldGVvZnJhbmNlLmZyOjQ0M1wvb2F1dGgyXC90b2tlbiIsInRpZXJJbmZvIjp7IjYwUmVxUGFyTWluIjp7InRpZXJRdW90YVR5cGUiOiJyZXF1ZXN0Q291bnQiLCJncmFwaFFMTWF4Q29tcGxleGl0eSI6MCwiZ3JhcGhRTE1heERlcHRoIjowLCJzdG9wT25RdW90YVJlYWNoIjp0cnVlLCJzcGlrZUFycmVzdExpbWl0IjowLCJzcGlrZUFycmVzdFVuaXQiOiJzZWMifX0sImtleXR5cGUiOiJQUk9EVUNUSU9OIiwic3Vic2NyaWJlZEFQSXMiOlt7InN1YnNjcmliZXJUZW5hbnREb21haW4iOiJjYXJib24uc3VwZXIiLCJuYW1lIjoiRG9ubmVlc1B1YmxpcXVlc1ZpZ2lsYW5jZSIsImNvbnRleHQiOiJcL3B1YmxpY1wvRFBWaWdpbGFuY2VcL3YxIiwicHVibGlzaGVyIjoiYWRtaW4iLCJ2ZXJzaW9uIjoidjEiLCJzdWJzY3JpcHRpb25UaWVyIjoiNjBSZXFQYXJNaW4ifV0sImV4cCI6MTg4OTA4NDI1NCwidG9rZW5fdHlwZSI6ImFwaUtleSIsImlhdCI6MTc5NDQ3NjI1NCwianRpIjoiODMyMDM2N2ItZDk3MS00YmU4LTg4ODUtNDU1OTJlZTIzYzJhIn0=.Cg-as68YDd9ilMM2YPIrD0v0QDte3c5gk7ebSSZRLKNt8EZZ7NIHrP5w3CRu7M0bcMEEZbQmUJP3DVfwXgcBvCOIieqxJ96laqCZLoVCqQ_Mhv5QCvEr_e1KALtuI5rXeDYodUoQKOZaFfHlHuPzEjTJJiIJ6-CeaG50QPckL2cbA2qRkkVNEZdfEBKDGHwEYTD0KwQYEjP5Grs_8cc5Z4cq_n--n00YRLht582xEiWIJL03gnCMeDMnIhP8yb57voRAPq_wloprGFcT4OU7SrkeKQg0Z4eBjULfuoybfw8D4oOpi6GSEB7S5Tz6n9P8thErTUwhmMfy0f8vi2VMzw==';
	var CLE_API = cfg.CLE_API || CLE_PAR_DEFAUT;

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
		// clé non renseignée : inutile d'appeler l'API, elle répondrait 401
		if ((!CLE_API || CLE_API === 'VOTRE_CLE') && !cfg.URL_API) {
			console.warn('Widget météo : clé d\'API Météo-France non renseignée (CLE_PAR_DEFAUT dans widget-meteo-api.js)');
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
