/* //// widget vigilance Météo-France - Gard (dept 30) - opendatasoft, sans clé ////
   [cd30] Version simplifiée : pas d'icônes ni d'échéance (jour), un seul badge
   "Alerte météo" sur fond blanc, cliquable vers le site vigilance Gard.
   Le badge n'apparaît que s'il existe au moins une alerte (J ou J+1). */
function initWidgetMeteo(cfg) {
	var widget = document.getElementById('meteoWidget');
	if (!widget) return;

	var TEST_J  = cfg.TEST_J;
	var TEST_J1 = cfg.TEST_J1;

	var URL_VIGILANCE_GARD = 'https://vigilance.meteofrance.fr/fr/gard';

	function afficher(alertesJ, alertesJ1) {
		var zone = widget.parentElement;
		var aAlerte = (alertesJ && alertesJ.length) || (alertesJ1 && alertesJ1.length);
		if (!aAlerte) {
			widget.style.display = 'none';
			if (zone) zone.style.display = 'none';
			return;
		}
		widget.innerHTML = '<a class="meteo-alerte-simple" href="' + URL_VIGILANCE_GARD
			+ '" target="_blank" rel="noopener" title="Voir la vigilance Météo-France du Gard">Alerte météo</a>';
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
