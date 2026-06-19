/* //// widget vigilance Météo-France - Gard (dept 30) - opendatasoft, sans clé //// */
function initWidgetMeteo(cfg) {
	var widget = document.getElementById('meteoWidget');
	if (!widget) return;

	var TEST_J  = cfg.TEST_J;
	var TEST_J1 = cfg.TEST_J1;

	var COULEURS = {
		2: { bg: '#f1c40f', txt: '#333', lbl: 'Alerte Jaune' },
		3: { bg: '#e67e22', txt: '#fff', lbl: 'Alerte Orange' },
		4: { bg: '#c0392b', txt: '#fff', lbl: 'Alerte Rouge' }
	};
	var PHENOMENES = {
		'Vent violent':'💨', 'Pluie-inondation':'🌧️', 'Orages':'⛈️',
		'Inondation':'🌊', 'Neige-verglas':'❄️', 'Canicule':'🌡️',
		'Grand froid':'🥶', 'Avalanches':'🏔️', 'Vagues-submersion':'🌊'
	};

	function construireBadge(echeance, alertes) {
		if (!alertes || !alertes.length) return '';
		var niveauMax = Math.max.apply(null, alertes.map(function(a) { return parseInt(a.niveau); }));
		var col = COULEURS[niveauMax] || COULEURS[2];
		var phenos = alertes.map(function(a) {
			return '<span style="font-size:27px">' + (PHENOMENES[a.phenomene_lib] || '⚠️') + '</span> ' + (a.phenomene_lib || '');
		}).join(' · ');
		return '<div class="meteo-vig-bloc">'
			+ '<span class="meteo-vig-badge" style="background:' + col.bg + ';color:' + col.txt + '">'
			+ echeance + ' : ' + col.lbl + ' ' + phenos
			+ '</span></div>';
	}

	function afficher(alertesJ, alertesJ1) {
		var contenu = construireBadge("Aujourd'hui", alertesJ) + construireBadge('Demain', alertesJ1);
		var zone = widget.parentElement;
		if (!contenu) { widget.style.display = 'none'; if (zone) zone.style.display = 'none'; return; }
		widget.innerHTML = contenu;
		widget.style.display = 'flex';
		if (zone) zone.style.display = 'flex';
	}

	function chargerVigilance() {
		if (TEST_J !== null || TEST_J1 !== null) {
			afficher(TEST_J || [], TEST_J1 || []);
			return;
		}
		var url = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/'
			+ 'vigilance-meteorologique/records?where=dep_code%3D%2230%22&limit=30';
		fetch(url)
		.then(function(r) { return r.json(); })
		.then(function(data) {
			var recs = (data && data.results) || [];
			var now = new Date();
			var demain = new Date(now); demain.setDate(demain.getDate() + 1);
			var jj = now.toISOString().slice(0, 10);
			var j1 = demain.toISOString().slice(0, 10);
			function filtrer(jourISO) {
				return recs.filter(function(r) {
					var debut = (r.debut_validite || '').slice(0, 10);
					var ech   = (r.echeance || '').toString().toUpperCase().trim();
					return ((debut === jourISO) || (jourISO === jj ? ech === 'J' : ech === 'J+1'))
						&& r.niveau && parseInt(r.niveau) >= 2;
				});
			}
			var alertesJ  = filtrer(jj);
			var alertesJ1 = filtrer(j1);
			if (!alertesJ.length && !alertesJ1.length) {
				var fb = recs.filter(function(r) { return r.niveau && parseInt(r.niveau) >= 2; });
				afficher(fb, []);
			} else {
				afficher(alertesJ, alertesJ1);
			}
		}).catch(function() { afficher([], []); });
	}

	chargerVigilance();
}
