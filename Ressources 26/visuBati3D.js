// //// modif nouvelle UI - visualisation des bâtiments 3D externalisée depuis les HTML cartes.
// Code identique sur toutes les cartes. Appelé via le stub :
//   this.visuBatiments3D = function () { window.visuBati3D(maCarte, valeurTitre1, tabCoucheMetier, libelleCouche); };
// Dépendances globales : L (Leaflet) et OSMBuildings (OSMBuildings-leaflet.js).
// Dépendances passées en paramètres (variables locales au constructeur CarteLeaflet) :
//   - maCarte          : instance L.map
//   - valeurTitre1     : titre carte (active la 3D si se termine par "3D")
//   - tabCoucheMetier  : tableau des couches métier (la dernière contient le GeoJSON 3D)
//   - libelleCouche    : objet des libellés de couches (on y enregistre la couche Batiments3D)
window.visuBati3D = function (maCarte, valeurTitre1, tabCoucheMetier, libelleCouche) {
	// 3D
	if (valeurTitre1.endsWith("3D")) {
		function couleurToitSelonHauteur(hauteur){
		  if (hauteur<=5) return "#c4e1ea";
		  else if (hauteur<=10) return "#55add0";
		  else if (hauteur<=20) return "#5f85c4";
		  else  return "#a33a3c";
		}
		function couleurMurSelonHauteur(hauteur){
		  if (hauteur<=5) return "#9bc2cf";
		  else if (hauteur<=10) return "#366f86";
		  else if (hauteur<=20) return "#425d89";
		  else return "#72282a";
		}

		const dernierElement = tabCoucheMetier.at(-1);
		const geoJSON3D = dernierElement[0];
		const Geojson3DConverti = { type:'FeatureCollection', features: [] };
		geoJSON3D.features.forEach(function(objets, i) {
			const objetGeojson = JSON.parse(JSON.stringify(objets));
			const propriété = objetGeojson.properties;
			objetGeojson.id = propriété.cleabs;
			let hauteurReelle = 8;
			if ('height' in propriété && propriété.height != null && propriété.height !== '') {
			  hauteurReelle = propriété.height;
			}
			const couleurHT = couleurToitSelonHauteur(hauteurReelle);
			const couleurHM = couleurMurSelonHauteur(hauteurReelle);
			propriété.wallColor = couleurHM;
			propriété.roofColor = couleurHT;
			const echelle = 0.9;
			propriété.height = hauteurReelle * echelle;
			propriété.hauteurReelleInfo = hauteurReelle;
			// push wallColor et roofColor ds geojson
			Geojson3DConverti.features.push(objetGeojson);
		});

		const couche3D = new OSMBuildings();
		couche3D.addTo(maCarte);
		couche3D.date(new Date(2024,4,15,10));
		couche3D.set(Geojson3DConverti);

		const infoBulle = L.tooltip({
			permanent: true,
			direction: 'top',
			className: 'mon-tooltip-style',
			offset: [0, -10]
		});
		let estSurUnBatiment = false;
		let dernierIdSurvole = null;
		couche3D.click(function(e) {
			estSurUnBatiment = true;
			if (e.feature === dernierIdSurvole) {
				infoBulle.setLatLng([e.lat, e.lon]);
				return;
			}
			dernierIdSurvole = e.feature;
			const batimentTrouve = Geojson3DConverti.features.find(f => f.id === e.feature);

			if (batimentTrouve) {
				const hauteur = batimentTrouve.properties.hauteurReelleInfo || batimentTrouve.properties.height;

				infoBulle.setContent(`<b>Hauteur :</b> ${hauteur}m`);
				infoBulle.setLatLng([e.lat, e.lon]);

				if (!maCarte.hasLayer(infoBulle)) {
					infoBulle.addTo(maCarte);
				}
			}
		});

		maCarte.on('mousemove', function(e) {
			estSurUnBatiment = false;

			couche3D.onClick(e);

			if (!estSurUnBatiment) {
				if (maCarte.hasLayer(infoBulle)) {
					maCarte.removeLayer(infoBulle);
				}
				dernierIdSurvole = null;
			}
		});

		libelleCouche.Batiments3D = couche3D;
		const legendeDiv = document.createElement('div');
		legendeDiv.className = 'legende3D';
		legendeDiv.innerHTML = `
			<div class="item"><div class="color" style="background:#c4e1ea"></div> ≤ 5 m</div>
			<div class="item"><div class="color" style="background:#55add0"></div> 5-10 m</div>
			<div class="item"><div class="color" style="background:#5f85c4"></div> 10–20 m</div>
			<div class="item"><div class="color" style="background:#a33a3c"></div> > 20 m</div>
		`;
		document.body.appendChild(legendeDiv);
	}
};
