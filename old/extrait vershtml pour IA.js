!DOCTYPE html>
<html>    
  <head>
  
	<link rel="stylesheet" href="/Ressources/API_JS/librairies_cd30/leaflet.css" />
	<link rel="stylesheet" href="/Ressources/API_JS/librairies_cd30/leaflet-si3p0.css" />
	<link rel="stylesheet" href="/Ressources/API_JS/librairies_cd30/pc-portable.css" />	
	<script src="/Ressources/API_JS/librairies_cd30/leaflet.js"></script>
	
	<title id="ti">Carte Leaflet</title>
	<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	
	<!-- limite geojson du Gard -->
	<script src="/Ressources/API_JS/librairies_cd30/gard.js"></script>

	<!-- création boutons - lib. fontawesome d'icones pr boutons -->
	<script type="text/javascript" src="/Ressources/API_JS/easy-button.js"></script>
	<link rel="stylesheet" href = "/Ressources/API_JS/easy-button.css" />	 
	<link rel="stylesheet" href="/Ressources/API_JS/images/easyButton/fontawesome-free-6.6/css/all.min.css" />

	<!-- clé API google - limite appels/mois -->
	<script async src="https://maps.googleapis.com/maps/api/js?libraries=places&key=AIzaSyBbn4agQo3A4Hp3Yyyros9hD7vFw0WSNOM&callback=Function.prototype&loading=async&v=beta"></script>
	<!-- Fonds carte Google -->
	<script src="/Ressources/API_JS/Leaflet.GoogleMutant.js"></script>
	<!-- Rech. lieux Google -->
	<script src="/Ressources/API_JS/GPlaceAutocomplete.js"></script>
  	<link rel="stylesheet" href="/Ressources/API_JS/GPlaceAutocomplete.css" />	  

	<!-- Impression carte -->
	<script src="/Ressources/API_JS/leaflet.browser.print.js"></script>

	<!-- Panneau texte Aide et Info -->
	<script src="/Ressources/API_JS/Leaflet.Dialog.js"></script>
  	<link rel="stylesheet" href="/Ressources/API_JS/Leaflet.Dialog.css" /> 

	<!-- Permalink pr centrage dyn graflex -->
	<script src="/Ressources/API_JS/leaflet.permalink.js"></script>

	<!-- mesure distance -->
	<link rel="stylesheet" type="text/css" href="/Ressources/API_JS/leaflet-ruler.css">
	<script src="/Ressources/API_JS/leaflet-ruler.js"></script>

	<!-- acces streetview, panoramax... -->
	<script src="/Ressources/API_JS/streetview.js"></script>
	
	<!-- bloc legende dyn -->
	<script type="text/javascript" src="/Ressources/API_JS/leaflet.legend.js"></script>	
	<link rel="stylesheet" href="/Ressources/API_JS/leaflet.legend.css" />

	<!-- rech Json -->
	<link rel="stylesheet" href="/Ressources/API_JS/leaflet-search.css"/>
	<script src="/Ressources/API_JS/leaflet-search.js"></script>

	<!-- clic droit coord GPS -->
	<script src="/Ressources/API_JS/leaflet.contextmenu.js"></script> 

	<!-- IGN calcul isochrones -->
	<script src="/Ressources/API_JS/GpPluginLeaflet.js"></script> 
	<link rel="stylesheet" href="/Ressources/API_JS/GpPluginLeaflet.css"/>	

	<!-- Import fichiers Geo -->
	<script src="/Ressources/API_JS/betterFileLayer.js"></script> 
	<link rel="stylesheet" href="/Ressources/API_JS/betterFileLayer.css"/>	

	<!-- Rech par coord -->
	<link rel="stylesheet" href="/Ressources/API_JS/geosearch.css"/>
	<script src="/Ressources/API_JS/geosearch.js"></script>

	<!-- Effet 3D sur batis -->
	<script type="text/javascript" src="/Ressources/API_JS/OSMBuildings-leaflet.js"></script>	
	
	<!-- spiderfy points superposés -->
	<script src="/Ressources/API_JS/overlap-marker.js"></script>
	
	</head>	
	
    <body onload="main()">
        <div id="carteId" />
    </body>	

</html>
 
<script>
	valeurTitre1 = "Surveillance du r&#233;seau - source CD30 - Waze";
	nbreDeVues = 10;
	strRechJson = "false";
	clicZoomActif = true;	
	
	L.Icon.Default.imagePath = '/Ressources/API_JS/images/';

	var tabNettoyé = [];

	if (valeurTitre1.endsWith("3D")) {
			nbreDeVues = nbreDeVues - 1;
		}

	if (valeurTitre1 == "Surveillance du r&#233;seau - source CD30 - Waze"){
		setTimeout(function() {window.location.reload()}, 600000);
	}

// on stocke les couches geojson dans le tableau js "tabCoucheMetier" pour transformations ulterieures avant affichage sur la carte
tabCoucheMetier = []; 

tabCoucheMetier.push([{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [3.54125, 44.1028]}, "properties": {"icone": "/Ressources/Images/Divers/Webcam.png", "Nature ": "Caméra", "legende": "Caméras", "Nom     ": "Serreyrède", "RD       ": "D986", "nomcouche": "Caméras", "PR+Abs    ": "19+119", "Lien StreetView ": "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=44.102799999999895,3.5412499999999993", "Image            ": "<br><a href=\"./Caméras/Serreyrède.jpg\" target=\"_blank\"><img src=\"./Caméras/Serreyrède.jpg\" width=\"320\" height=\"240\"></img></a>"}}, {"type": "Feature", "geometry": {"type": "Point", "coordinates": [3.55171, 44.0974]}, "properties": {"icone": "/Ressources/Images/Divers/Webcam.png", "Nature ": "Caméra", "legende": "Caméras", "Nom     ": "L'Espérou", "RD       ": "D986", "nomcouche": "Caméras", "PR+Abs    ": "23+869", "Lien StreetView ": "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=44.097399999999915,3.55171", "Image            ": "<br><a href=\"./Caméras/L'Espérou.jpg\" target=\"_blank\"><img src=\"./Caméras/L'Espérou.jpg\" width=\"320\" height=\"240\"></img></a>"}}, {"type": "Feature", "geometry": {"type": "Point", "coordinates": [3.90365, 44.3858]}, "properties": {"icone": "/Ressources/Images/Divers/Webcam.png", "Nature ": "Caméra", "legende": "Caméras", "Nom     ": "Mas de la barque", "RD       ": "D362", "nomcouche": "Caméras", "PR+Abs    ": "14+746", "Lien StreetView ": "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=44.385799999999904,3.9036500000000003", "Image            ": "<br><a href=\"./Caméras/Mas de la barque.jpg\" target=\"_blank\"><img src=\"./Caméras/Mas de la barque.jpg\" width=\"320\" height=\"240\"></img></a>"}}, {"type": "Feature", "geometry": {"type": "Point", "coordinates": [4.37809, 43.9414]}, "properties": {"icone": "/Ressources/Images/Divers/Webcam.png", "Nature ": "Caméra", "legende": "Caméras", "Nom     ": "Uzès", "RD       ": "D979", "nomcouche": "Caméras", "PR+Abs    ": "54+488", "Lien StreetView ": "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=43.941399999999916,4.37809", "Image            ": "<br><a href=\"./Caméras/Uzès.jpg\" target=\"_blank\"><img src=\"./Caméras/Uzès.jpg\" width=\"320\" height=\"240\"></img></a>"}}, .... )]}


// Vérifier si la couche a au moins une feature avec coordonnées
tabCoucheMetier = tabCoucheMetier.map(function(couche, index) {
    var donnees = Array.isArray(couche) ? couche[0] : couche;
    
    // Fonction locale : vérifie qu'une feature a une géométrie réellement exploitable
    function geometrieUtile(feature) {
        if (!feature.geometry) return false;
        var coords = feature.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length === 0) return false;
        
        // Extraction récursive de tous les points [lng, lat]
        function extrairePoints(arr) {
            if (!Array.isArray(arr) || arr.length === 0) return [];
            if (typeof arr[0] === 'number') return [arr];
            return arr.reduce(function(acc, sub) {
                return acc.concat(extrairePoints(sub));
            }, []);
        }
        
        var points = extrairePoints(coords);
        if (points.length === 0) return false;
        if (feature.geometry.type === 'Point') return points.length === 1;
        if (points.length < 2) return false;
        
        // Au moins un point doit différer du premier
        var premier = points[0];
        return points.some(function(p) {
            return p[0] !== premier[0] || p[1] !== premier[1];
        });
    }
    
    var estValide = donnees && 
                    donnees.features && // feature !== null
                    donnees.features.length > 0 &&
                    donnees.features.some(geometrieUtile);
    
    if (estValide) {
        // afficher couches avec une partie de coord nulles aussi
        donnees.features = donnees.features.filter(geometrieUtile);
        return couche; 
    } 	
   // Renommer en "couche x vide" et coord point bidon pour ne pas planter carte
    else {
        return [{
            "type": "FeatureCollection", 
            "features": [{
                "type": "Feature", 
                "geometry": {"type": "Point", "coordinates": [14, 43]}, 
                "properties": {
                    "Couche": "Couche vide", 
                    "nomcouche": "Couche " + (index + 1) + " vide"
                }
            }]
        }];
    }
});
nbreDeVues = tabCoucheMetier.length;

//Regrouper les éléments d'un tableau dans un objet en fonction de la valeur d'un de leurs attributs
function groupBy(tableauDonnees, cheminPropriete) {
    // reduce() parcourt le tableau et construit l'objet final regroupé
    return tableauDonnees.reduce((groupesCrees, elementCourant) => {        
        // 1. On navigue dans l'élément (ex: "properties.nature") pour trouver le nom du groupe
        const valeurDuGroupe = cheminPropriete.split('.').reduce((objetCourant, sousPropriete) => objetCourant?.[sousPropriete], elementCourant);        
        // 2. Si le groupe n'existe pas encore, on l'initialise avec un tableau vide [], puis on y ajoute l'élément
        (groupesCrees[valeurDuGroupe] = groupesCrees[valeurDuGroupe] || []).push(elementCourant);        
        // 3. On retourne l'objet enrichi pour le passage au prochain élément
        return groupesCrees;        
    }, {}); // {} = objet vide de départ
}

// Inverser les coordonnées des géométries. GeoJSON impose [Longitude, Latitude] mais Leaflet lit les coordonnées au format [Latitude, Longitude] (api turf)
function flipGeoJSON(coords) {
    if (typeof coords[0] === 'number') {
        return [coords[1], coords[0]];
    }
    return coords.map(elementTableau => flipGeoJSON(elementTableau));
}

// gestion interactions icone clé 
function ajouterHoverEtClic(bouton, params) {
    let isLocked = false;
    const {
        isVisible, 
        afficher,  
        masquer, 
        onClose
    } = params;

    if (bouton) {
        bouton.addEventListener('click', () => {
            isLocked = !isLocked;
            if (!isVisible()) {
                afficher();
            }
        });

        bouton.addEventListener('mouseenter', () => {
            if (!isLocked && !isVisible()) {
                afficher();
            }
        });

        bouton.addEventListener('mouseleave', () => {
            if (!isLocked && isVisible()) {
                masquer();
                isLocked = false;
            }
        });

        if (onClose) {
            onClose(() => {
                isLocked = false;
            });
        }
    }
}

function CarteLeaflet(conteneurId) {   
    
 	var googleSat = L.gridLayer.googleMutant({
		maxZoom: 22	, 
		type:"hybrid", 
		styles:[]			
	});		
	 
	var coucheWMTSIGN = "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2";
	var fdcIGN = L.tileLayer("https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" + coucheWMTSIGN + "&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png"
		,{
			maxZoom: 21,
			maxNativeZoom: 19
	    });	
 
	var coucheWMTSIGNORTHO = "ORTHOIMAGERY.ORTHOPHOTOS";	
	var orthoIGN = 	L.tileLayer("https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" + coucheWMTSIGNORTHO + "&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg"
		,{
			maxZoom: 21,
			maxNativeZoom: 19
		});	
	
	var StadiaMap = L.tileLayer(
		"https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png?api_key=ee6964e8-3d98-4060-b991-2e3c21732548"
		,{
			maxZoom: 22,
			maxNativeZoom: 20,			
			attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>'
		}
	);

	var cartoDB = L.tileLayer(
		"https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
		,{
			subdomains: 'abcd',
			maxZoom: 22,
			maxNativeZoom: 20,			
			attribution: '&copy; <a href="https://openstreetmap.org/">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
		}
	);
	

	var tabGeomCouche = [];	
	tabComposantLeg = [];
	tabEltsMarkerLeg = [], tabEltsMLSLeg = [], tabEltsMPLeg = [];	
	var presenceLegende = false, presenceIcone = false;
	var markersOmsCouche = [];
	
	
	this.ajoutCoucheGeojson = function () {

		// stockage des lignes de memes coord 
		var indexSpatial = {};
			tabCoucheMetier.forEach(function(c) {
				// verif existence features
				if (c[0] && c[0].features) {
					c[0].features.forEach(function(f) {
						if (f.geometry.type === "MultiLineString") {							
							var cle = JSON.stringify(f.geometry.coordinates);
							if (!indexSpatial[cle]) {
								indexSpatial[cle] = [];
							}
							indexSpatial[cle].push(f.properties);
						}
					});
				}
			});
	
	function styleCoucheMétier(élément) {	 
		if (élément.properties.couleur){		
			var couleurEltCouche = élément.properties.couleur;  
			}
		else {
			var couleurEltCouche = "red";	
			}
		if (élément.geometry.type == "MultiPolygon") {
			var styleCouchePolygon = {	
				color: couleurEltCouche
				//fillOpacity: 0.1
			};
			return styleCouchePolygon;
		}
		
		if (élément.geometry.type == "MultiLineString") {
			var styleCoucheMLS = {	
				color: couleurEltCouche
			}
			if (valeurTitre1.includes("fauchage") && élément.properties["Traitement       "] == 'Ponctuel') {
				styleCoucheMLS.dashArray = '5,10';
			}	
			return styleCoucheMLS;
		}
		
	}

	function traiterEltsCouche (élément, couche) {
		
		function nettoyerValNulles() {
			for (var nomPpté in élément.properties) {	
				if (élément.properties[nomPpté] == null) {
					élément.properties[nomPpté] = "Non défini";}	
			}
		}

		function formaterLienHttp(){
			for (var nomPpté in élément.properties) {
				if (nomPpté.match(/[Ll]ien/) && élément.properties[nomPpté] !== "Non défini") {
					élément.properties[nomPpté] = "<a href=" + élément.properties[nomPpté].replace(/ /g,"%20") + " title="+ élément.properties[nomPpté].replace(/ /g,"%20") + " target=_blank> " + "Accéder au lien</a>";	
				}
				else if (nomPpté.match(/[Ee]mail|[Mm]ail/) && élément.properties[nomPpté] !== "Non défini") {
					élément.properties[nomPpté] = "<a href=mailto:" + élément.properties[nomPpté] + " target=_blank> " + élément.properties[nomPpté] + " </a>";
				}
			}	
		}
		

	function surlignerElt() { 
		flagHoverSurlignage = false; 
		
	    var couleurEltCouche = élément.properties.couleur || "red";
	    var typeGeometryG = élément.geometry.type;
	
	    if (typeGeometryG.includes("LineString")) {
	        couche._estSélectionné = false;
	
	        // On attache les événements à la couche
	        couche.on({
	            click: function(e) {
	                e.target._estSélectionné = true;
	                e.target.setStyle({
	                    color: "#ff6600",
	                    weight: 10,
	                    opacity: 0.5
	                });
	            },
	            popupclose: function(e) {
	                e.target._estSélectionné = false;
	                e.target.setStyle({							
	                    color: couleurEltCouche,
	                    weight: 3,
	                    opacity: 1
	                });
	            },
	            mouseover: function(e) {
	                if (flagHoverSurlignage && !e.target._estSélectionné) {
	                    e.target.setStyle({
	                        weight: 6,
	                        color: 'red',
	                        opacity: 0.6
	                    });
	                }
	            },
	            mouseout: function(e) {
	                if (flagHoverSurlignage && !e.target._estSélectionné) {
	                    e.target.setStyle({							
	                        color: couleurEltCouche,
	                        weight: 3,
	                        opacity: 1
	                    });
	                }
	            }
	        });
	    }
			// surlignage polygones
			function créerSurlignage () {
				couche.setStyle({
					color: "#ff6600",
					weight: 10,
					opacity: 0.5
				});
			}
			function resetSurlignage () {
				if (élément.properties.couleur){		
					var couleurEltCouche = élément.properties.couleur;  
				}
				else {
					var couleurEltCouche = "red";	
				}
				couche.setStyle({							
					color: couleurEltCouche,
					weight: 3,
					opacity: 1
				});
			}						
			typeGeometryG = élément.geometry.type;	
			if (typeGeometryG.includes("Polygon")) {
				couche.on({
					click: créerSurlignage,	
					popupclose: resetSurlignage
				});	
			}
	}
			
		function creerTabLegende() {
			if ((élément.properties.couleur == "Non défini" || typeof élément.properties.couleur === "undefined") && (élément.geometry.type !== "Point" && élément.geometry.type !== "MultiPoint")){
				élément.properties.couleur = "red";
			}	
			if (élément.properties.legende){					
				presenceLegende = true;
				tabComposantLeg.push([élément.geometry.type, élément.properties.legende, élément.properties.couleur, élément.properties.icone, 
				élément.properties.afficherlegouverture, élément.properties.nomcouche]);
			}
			tabGeomCouche.push([élément.geometry.type, élément.properties.nomcouche]);	
		}
		
	function creerPopupEtLegende() {
    // FONCTION EXPORT MULTI-LIGNES 
    window.exportTronconCSV = function(dataGroupEncoded, nomFichier) {
        var dataArray = JSON.parse(decodeURIComponent(dataGroupEncoded));        

		// Récupérer TOUTES les colonnes uniques de toutes les entités, nomcouche en col 1
		var toutesColonnes = ['nomcouche']; 
		dataArray.forEach(function(item) {
			Object.keys(item).forEach(function(k) {
				if (!toutesColonnes.includes(k) && !k.match(/^([Cc]ouleur|[Ll]egende|[Ii]cone|to_timestamp|afficherlegouverture|leafletsearch)$/)) {
					toutesColonnes.push(k);
				}
			});
		});

        // Construction du CSV (BOM UTF-8 pour Excel)
        var csv = "\uFEFF" + toutesColonnes.join(";") + "\r\n";
        
        dataArray.forEach(function(item) {
            var ligne = toutesColonnes.map(function(col) {
                var val = item[col] === null || item[col] === undefined ? "" : String(item[col]);
                // Nettoyage HTML et échappement guillemets
                return '"' + val.replace(/<[^>]*>/g, "").replace(/"/g, '""') + '"';
            });
            csv += ligne.join(";") + "\r\n";
        });
		
		// nom de fichier csv
		var col1 = dataArray[0][toutesColonnes[0]] || "export";
		var col2 = dataArray[0][toutesColonnes[1]] || "";
		var col10 = dataArray[0][toutesColonnes[9]] || "";
		//var dateExport = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
		var nomFichier = [col1, col2, col10].filter(Boolean).join("_").replace(/[\/\\:*?"<>|]/g, '_');
		var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		var link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = nomFichier + ".csv";
		link.click();
		
    };

    // AGRÉGATION POPUP DOUBLONS
    var geoRef = JSON.stringify(élément.geometry.coordinates);
    var propsGroupes = indexSpatial[geoRef] || [élément.properties];

    var estMulti = propsGroupes.length > 1;
    var contenuFinalPopup, texteTooltip;
    if (estMulti) {
        var htmlParts = [];
        propsGroupes.forEach(function(pps, idx) {
            var p = [];
            var nom = pps.nomcouche || pps.legende || ("Entité " + (idx + 1));
            
            p.push("<div style='border-bottom:1px solid #ccc; background:#f4f4f4; padding:3px; font-weight:bold; font-size:12px; color:#333;'>" + nom + "</div>");
            p.push("<div style='padding:5px;'>");
            var details = [];
            for (var nomPpté in pps) {
                if (!nomPpté.match(/^([Cc]ouleur|[Ll]egende|[Ii]cone|to_timestamp|nomcouche|afficherlegouverture|leafletsearch)$/)) {
                    var ligne = "<b>"+ nomPpté + ":</b> " + pps[nomPpté];
                    nomPpté.match(/^([Nn]uméro [Rr]oute|[Nn]umeroroute|[Rr][Dd])$/) ? details.unshift(ligne) : details.push(ligne);
                }
            }
            p.push(details.join("<br />"));
            p.push("</div>");
            htmlParts.push(p.join(""));
        });

        // AJOUT DU BOUTON UNIQUE EN FIN DE POPUP 
        var dataGroupJSON = encodeURIComponent(JSON.stringify(propsGroupes));
        var boutonExport = "<div style='text-align:center; padding:10px; border-top:1px solid #ddd;'>" +
                           "<button onclick='window.exportTronconCSV(\"" + dataGroupJSON + "\", \"Export\")' class='btn-export-csv'>" +
                           "<i class='fa fa-file-excel-o'></i> Exporter les " + propsGroupes.length + " entités (CSV)</button>" +
                           "</div>";

        contenuFinalPopup = "<div class='popup-scroll grille-active'>" + htmlParts.join("<hr class='sep-grille' />") + "</div>" + boutonExport;
        texteTooltip = "<b>" + propsGroupes.length + " lignes superposées</b><br/><i>Cliquez pour le détail</i>";

	} else {
    // CAS STANDARD (Sans doublon) 
    var tableauContenuPopup = [], tableauContenuTooltip = [];
    var pps = élément.properties;
    for (var nomPpté in pps) {
        if (nomPpté.match(/^([Nn]uméro [Rr]oute|[Nn]umeroroute|[Rr][Dd])$/)) {
            tableauContenuPopup.unshift("<b>"+ nomPpté + ":</b> " + pps[nomPpté]);
        } else {
            if (!nomPpté.match(/^([Cc]ouleur|[Ll]egende|[Ii]cone|to_timestamp|nomcouche|afficherlegouverture|leafletsearch)$/)) {
                tableauContenuPopup.push("<b>"+ nomPpté + ":</b> " + pps[nomPpté]);
            }
            if (!nomPpté.match(/^([Cc]ouleur|[Ll]egende|[Ll]ien|[Ii]cone|to_timestamp|nomcouche|afficherlegouverture|leafletsearch)/)) {
                tableauContenuTooltip.push("<b>"+ nomPpté + ":</b> " + pps[nomPpté]);
            }
        }
    }
    contenuFinalPopup = tableauContenuPopup.join("<br />");
    texteTooltip = tableauContenuTooltip.join("<br />");
	}

	// APPLICATION À TOUS LES OBJETS 
		var optionsPopup = { 
			maxWidth: estMulti ? 650 : 400, 
			minWidth: estMulti ? 250 : 125,
			closeOnClick: !estMulti,
			// decalage en haut a droite pour ne pas masquer ligne
			offset: estMulti ? [200, -40] : [0, 0]
			};
		var optionsTooltip = { sticky: true, opacity: 0.9 };

		// Application sur la couche principale (GeoJSON)
		couche.bindPopup(contenuFinalPopup, optionsPopup);
		// Tooltip allégé sur polygones 2 premières propriétés
		if (élément.geometry.type === "MultiPolygon" || élément.geometry.type === "Polygon") {
			var tooltipCourt = tableauContenuTooltip.slice(0, 2).join("<br />");
			couche.bindTooltip(tooltipCourt, { sticky: true, opacity: 0.9, className: 'tooltip-polygone' });
		} else {
			couche.bindTooltip(texteTooltip, optionsTooltip);
		}

		// Application sur les Markers (Légende)
		if (élément.properties.icone && élément.properties.legende && (élément.geometry.type == "Point" || élément.geometry.type == "MultiPoint")){
			var iconeMarker = L.icon({iconUrl: élément.properties.icone, iconSize: [38,38], iconAnchor: [19,39], popupAnchor: [-1,-39]});
			var élémentsPoint = L.marker(élément.geometry.coordinates.slice().reverse(), {icon: iconeMarker, cleUniqueLegende: élément.properties.legende + "_" + élément.properties.icone});    
			tabEltsMarkerLeg.push(élémentsPoint);
			élémentsPoint.bindPopup(contenuFinalPopup, optionsPopup).bindTooltip(texteTooltip, optionsTooltip);
		}

	// Application sur les MultiLineString (Légende)
	if (élément.properties.couleur && élément.properties.legende && élément.geometry.type == "MultiLineString"){
	// Remplacement de librairie turf par fonction native flipGeoJSON
    var coordsMLS = flipGeoJSON(élément.geometry.coordinates);
    var couleurOrigine = élément.properties.couleur;

    var styleMLS = { 
        color: couleurOrigine, 
        weight: 3, 
        opacity: 1,
    	nomCoucheMLSEtCouleur: élément.properties.nomcouche.concat(élément.properties.couleur).concat("||").concat(élément.properties.legende) 
	};
    
    if (valeurTitre1.includes("fauchage") && élément.properties["Traitement       "] == 'Ponctuel') {
        styleMLS.dashArray = '5,10';
    }

    var élémentsMLS = L.polyline(coordsMLS, styleMLS);
    élémentsMLS._estSélectionné = false;

    élémentsMLS.on({
        click: function(e) {
            e.target._estSélectionné = true;
            e.target.setStyle({ color: "#ff6600", weight: 10, opacity: 0.5 });
        },
        popupclose: function(e) {
            e.target._estSélectionné = false;
            e.target.setStyle({ color: couleurOrigine, weight: 3, opacity: 1 });
        },
        mouseover: function(e) {
            // ON REPREND LA LOGIQUE DU FLAG ICI
            if (flagHoverSurlignage && !e.target._estSélectionné) {
                e.target.setStyle({ color: 'red', weight: 6, opacity: 0.6 });
            }
        },
        mouseout: function(e) {
            // ON REPREND LA LOGIQUE DU FLAG ICI
            if (flagHoverSurlignage && !e.target._estSélectionné) {
                e.target.setStyle({ color: couleurOrigine, weight: 3, opacity: 1 });
            }
        }
    });
    
    tabEltsMLSLeg.push(élémentsMLS);
    élémentsMLS.bindPopup(contenuFinalPopup, optionsPopup).bindTooltip(texteTooltip, optionsTooltip);
}

		if (élément.properties.couleur && élément.properties.legende && élément.geometry.type == "MultiPolygon"){
			var coordsMP = flipGeoJSON(élément.geometry.coordinates);
			var coucheMP = L.polygon(coordsMP, {
				color: élément.properties.couleur, 
				//nomCoucheMPEtCouleur: élément.properties.nomcouche.concat(élément.properties.couleur), 
				nomCoucheMPEtCouleur: élément.properties.nomcouche.concat(élément.properties.couleur).concat("||").concat(élément.properties.legende),
				fill: true
			});
			tabEltsMPLeg.push(coucheMP);
			var tooltipCourt = tableauContenuTooltip.slice(0, 2).join("<br />");			
			coucheMP.bindPopup(contenuFinalPopup, optionsPopup).bindTooltip(tooltipCourt, { sticky: true, opacity: 0.9, className: 'tooltip-polygone' });
		}
	}	
	
	nettoyerValNulles();
	formaterLienHttp();	
	surlignerElt();		
	creerTabLegende();
	creerPopupEtLegende();
	}
	
	function creerIconeCusto (élément, latlng) {
		var marker;
		if (élément.properties.icone) {	
			presenceIcone = true;			
			var geojsonIcone = L.icon({iconUrl: élément.properties.icone, iconSize: [38,38], iconAnchor: [19,39], popupAnchor: [-1,-39]});
			return L.marker(élément.geometry.coordinates.slice().reverse(), {icon: geojsonIcone});
		}
		else {
			presenceIcone = false;
			var customIcone = new L.Icon({iconUrl: "/Ressources/API_JS/images/marker-icon.png", iconSize: [14,30], iconAnchor: [7,31], popupAnchor: [-1,-31]});
			return L.marker(latlng, {icon: customIcone});
		}
		// Stocker pour ajout ultérieur à OMS
		markersOmsCouche.push(marker);
		return marker;
	}

	tabCoucheMG = [];	
	for (i=0; i < tabCoucheMetier.length; i++){
	    var donneesCouche = tabCoucheMetier[i][0];
	    
	    // Convertir couche MultiPoint à 1 element[[x, x]] en Point
	    var aDesMultiPoints = donneesCouche && donneesCouche.features && 
	        donneesCouche.features.some(function(f) { 
	            return f.geometry && f.geometry.type === 'MultiPoint'; 
	        });	    
	    if (aDesMultiPoints) {
	        donneesCouche.features.forEach(function(feature) {
	            if (feature.geometry && feature.geometry.type === 'MultiPoint') {
	                feature.geometry.type = 'Point';
	                feature.geometry.coordinates = feature.geometry.coordinates[0];
	            }
	        });
	    }
	    
	    tabCoucheMG.push(L.geoJson(donneesCouche, {
	        style: styleCoucheMétier, 
	        onEachFeature: traiterEltsCouche, 
	        pointToLayer: creerIconeCusto
	    }));
	}
	
	// Alimenter markersOmsCouche avec tous les marqueurs des couches Point
		for (i=0; i < tabCoucheMG.length; i++) {
			if (tabCoucheMetier[i][0] && 
				tabCoucheMetier[i][0].features && 
				tabCoucheMetier[i][0].features.some(feature => 
					feature.geometry && feature.geometry.type === 'Point'
				)) {
				tabCoucheMG[i].eachLayer(function(layer) {
					if (layer instanceof L.Marker) {
						markersOmsCouche.push(layer);
					}
				});
			}
		}
	
	}	
	

	this.dessinerCarte = function () {	
	
		this.conteneurId = conteneurId;
		this.coordCarte = [43.96, 4.1];			
		this.zoomInitial = 9.8;
		
		maPosition = L.Permalink.getMapLocation();
		
		if (L.Browser.mobile) {this.zoomInitial = 8.7}
		if (screen.width < 1920 && !L.Browser.mobile) {this.zoomInitial = 9.4}
		if (valeurTitre1.startsWith("Graflex")) {
			this.zoomInitial = maPosition.zoom;
			this.coordCarte = maPosition.center;
		}
		if (!valeurTitre1.endsWith("3D")) {this.zoomSnap = 0.1;} else {this.zoomSnap = 1;}	

		if (valeurTitre1.endsWith("UT d&#39;Al&#232;s") || valeurTitre1.startsWith("UT Al&#232;s")) {	
			this.coordCarte = [44.02, 3.94889];
			this.zoomInitial = 10.8;
		} 
		else if (valeurTitre1.endsWith("UT de Bagnols") || valeurTitre1.startsWith("UT Bagnols-sur-C&#232;ze")) {	
			this.coordCarte = [44.05,4.4785];
			this.zoomInitial = 10.8;
		} 
		else if (valeurTitre1.endsWith("UT de Bess&#232;ges") || valeurTitre1.startsWith("UT Bess&#232;ges")) {
			this.coordCarte = [44.23331,4.26074];
			this.zoomInitial = 10.8;
		} 
		else if (valeurTitre1.endsWith("UT du Vigan") || valeurTitre1.startsWith("UT Le Vigan")) {
			this.coordCarte = [44.02327,3.69363];
			this.zoomInitial = 10.8;
		} 
		else if (valeurTitre1.endsWith("UT de Vauvert") || valeurTitre1.startsWith("UT Vauvert")) {
			this.coordCarte = [43.69,4.2698];
			this.zoomInitial = 10.8;
		}  
		
		const fondParDefaut = window.location.href.includes('Graflex') ? orthoIGN : cartoDB;
		
		maCarte = L.map(this.conteneurId, {
			center: this.coordCarte,
			zoom: this.zoomInitial,	
			zoomSnap: this.zoomSnap,
			layers: fondParDefaut,
			zoomControl: false,
			attributionControl: false,
			closePopupOnClick: false,
			preferCanvas: true
		});	

		// couches actives a ouverture
		var strCaseACocher = "0,0,0,0,0,1,0,0,0,0";
		var tabCaseACocher = [];
		tabCaseACocher = strCaseACocher.split(",");
		if (tabCaseACocher.length <= tabCoucheMetier.length) {
			for (i=0; i < tabCaseACocher.length; i++){
				if (tabCaseACocher[i] == "1"){
					tabCoucheMG[i].addTo(maCarte);
				}
			}
		}

		// mini-zoom pr affichage G Sat
		maCarte.on("baselayerchange", function() {
			if (maCarte.hasLayer(googleSat)) {
				setTimeout(() => maCarte.fire('zoomend'), 100);
			}
		});

		// Priorité affichage selon type geom couche
		// Points dessus
		var zIndexDynamiquePoints = 200000;
		var zIndexReactivation = 1000000;
		maCarte.on("layeradd", function(e) {
			var coucheAjoutee = e.layer;
			if (coucheAjoutee instanceof L.Marker) {
				coucheAjoutee.setZIndexOffset(zIndexDynamiquePoints++);
			} 
			else if (coucheAjoutee.eachLayer) {
				var contientPoints = false;
				coucheAjoutee.eachLayer(function(enfant) {
					if (enfant instanceof L.Marker) {
						enfant.setZIndexOffset(zIndexReactivation);
						contientPoints = true;
					}
				});
				if (contientPoints) {
					zIndexReactivation += 100;
				}
			}
			// Polygones dessous
			setTimeout(function() {				
				for (var i = 0; i < tabCoucheMG.length; i++) {
					if (maCarte.hasLayer(tabCoucheMG[i])) {
						var donnees = tabCoucheMetier[i][0];
						if (donnees && donnees.features && donnees.features.length > 0) {
							var isPolygon = donnees.features[0].geometry.type.includes("Polygon");						
							if (isPolygon) {
								tabCoucheMG[i].bringToBack();
							}
						}
					}
				}		
			}, 20); 
		});

		// FdC N&B plus foncé pr carto surveillance réseau
		if (valeurTitre1.includes("Surveillance")) {
			var tilePane = document.querySelector('.leaflet-tile-pane');
			if (tilePane && maCarte.hasLayer(cartoDB)) {
				tilePane.style.filter = 'brightness(0.87) contrast(1.1)';
			}
			maCarte.on('baselayerchange', function(e) {
				var tp = document.querySelector('.leaflet-tile-pane');
				if (!tp) return;
				tp.style.filter = (e.name === 'CartoDB N&B') ? 'brightness(0.87) contrast(1.1)' : '';
			});
		}
		
		// ctrl zoom
		if (!L.Browser.mobile){
			var ctrlZoom = L.control.zoom({zoomInTitle: "Zoom avant", zoomOutTitle: "Zoom arrière"});
			ctrlZoom.addTo(maCarte);
		}
		
		// copyright
		var copyright = L.control.attribution({position:"bottomleft"});
		copyright.setPrefix(false).addAttribution("<a href='https://intranet.gard.fr/fr/organigramme/organigramme-presidente-fr/organigramme-direction-generale-des-services-fr/organigramme-dgs-direction-fr/organigramme-dga-mobilites-et-logistique-fr/organigramme-dgaml-direction-d-appui-fr/organigramme-dgaml-dapp-pole-systemes-d-information-fr.html' target='_blank'>Pôle des Systèmes d'Information (DGaML - DAppui)</a>");
		copyright.addTo(maCarte);
		
		// Echelle 
		ctrlScale = L.control.scale({position: "bottomright", imperial: false});
		ctrlScale.addTo(maCarte);

		// Bloc legende
		function filtrerDoublons(tableau) {
			let tabResultat = [];
			let eltsTrouves = new Set(); 
	
			for (let i = 0; i < tableau.length; i++) {
				let eltsTrouvesTxt = JSON.stringify(tableau[i]);
				
				// Si le texte n'est pas encore dans Set, on l'ajoute
				if (!eltsTrouves.has(eltsTrouvesTxt)) {
					tabResultat.push(tableau[i]);
					eltsTrouves.add(eltsTrouvesTxt);
				}
			}
			return tabResultat; 
		}	
		
		if (presenceLegende) {	
			tabNettoyé = filtrerDoublons(tabComposantLeg);
	
				for (i=0; i<tabNettoyé.length; i++){
					if (tabNettoyé[i][0] == "MultiLineString"){
						tabNettoyé[i][0] = "polyline";
						}
					if (tabNettoyé[i][0] == "MultiPolygon" ){
						tabNettoyé[i][0] = "polygon";
					}
					if (tabNettoyé[i][0] == "Point") {
						tabNettoyé[i][0] = "image";
					}
				}	
	
				// Tri stable de tabNettoyé pour s'aligner sur l'ordre imposé par Object.assign
				tabNettoyé = tabNettoyé.map((item, index) => ({ item, index }))
					.sort((a, b) => {
						function getPrio(type) {
							if (type === "image") return 1;
							if (type === "polyline") return 2;
							if (type === "polygon") return 3;
							return 4;
						}
						var prioA = getPrio(a.item[0]);
						var prioB = getPrio(b.item[0]);
						
						// On force l'ordre : 1. Points, 2. Lignes, 3. Polygones
						if (prioA !== prioB) return prioA - prioB;
						// A type égal, on conserve l'ordre d'apparition d'origine
						return a.index - b.index;
					})
					.map(obj => obj.item);			
	
			// regroupement elements legende uniques par type geom
			ordreMarkerLeg = groupBy(tabEltsMarkerLeg, "options.cleUniqueLegende");	
			ordreMLSLeg = groupBy(tabEltsMLSLeg, "options.nomCoucheMLSEtCouleur");	
			ordreMPLeg = groupBy(tabEltsMPLeg, "options.nomCoucheMPEtCouleur");
			
			var listeCouchesLeg = Object.assign(ordreMarkerLeg,ordreMLSLeg,ordreMPLeg);
			var tabCouchesLGLeg = Object.values(listeCouchesLeg).map(listOfCouches => L.layerGroup(listOfCouches));
			
			//console.log("listeCouchesLeg : ", listeCouchesLeg);
			//console.log("tabCouchesLGLeg : ", tabCouchesLGLeg);
			
			for (i=0; i < tabCouchesLGLeg.length; i++){
				if (tabNettoyé[i][4] === true || typeof tabNettoyé[i][4] === "undefined" ){
					tabCouchesLGLeg[i].addTo(maCarte);
				}
			}
			for (i=0; i < tabNettoyé.length; i++){
				if (typeof tabNettoyé[i][4] === "undefined"){
					tabNettoyé[i][4] = true;
				}
			}	
			for (i=0; i<tabNettoyé.length; i++){
					tabNettoyé[i][4] = !tabNettoyé[i][4];
			}
		
			//console.log("tabNettoyé : " , tabNettoyé);
		
			var tabCtrlLegendeObj = [];
			for (i=0; i < tabNettoyé.length; i++) {	
				tabCtrlLegendeObj.push({
					label: tabNettoyé[i][1], 
					type: tabNettoyé[i][0], 
					color: tabNettoyé[i][2], 
					url: tabNettoyé[i][3], 
					inactive: tabNettoyé[i][4], 
					nomCouche: tabNettoyé[i][5], 
					layers: tabCouchesLGLeg[i],
					originalIndex: i
				});	
			}
		
			// Z-index décroissant pour les couches points légende au chargement initial :
			// le 1er libellé légende sera affiché par-dessus les autres sur la carte
			var zIndexLegPoints = 900000;
			for (var idx = 0; idx < tabCtrlLegendeObj.length; idx++) {
				if (tabCtrlLegendeObj[idx].type === "image") {
					tabCtrlLegendeObj[idx].layers.eachLayer(function(layer) {
						if (layer instanceof L.Marker) {
							layer.setZIndexOffset(zIndexLegPoints);
						}
					});
					zIndexLegPoints -= 1000;
				}
			}
		
			// tri des libelles legende lignes
			function estUneLigne(type) {
				var typeMin = type.toLowerCase();
				return typeMin === "polyline" || typeMin.includes("line");
			}
			
			tabCtrlLegendeObj.sort(function(a, b) {
				// Si A ET B sont des lignes, on applique le tri
				if (estUneLigne(a.type) && estUneLigne(b.type)) {			
					// 1. STATUT : Actifs en premier, Inactifs (grisés) en dessous
					if (a.inactive !== b.inactive) {
						return a.inactive ? 1 : -1; 
					}	
					// 2. ALPHABÉTIQUE : Tri A-Z, 1-10...
					return a.label.localeCompare(b.label, 'fr', { numeric: true, sensitivity: 'base' });
				}
			
				// Si ce ne sont pas des lignes, on ignore et on laisse ordre tel quel
				return 0;
			});
	
			function ajusterLargeurColonnesLegende() {
			    var container = maCarte.getContainer().querySelector('.leaflet-legend-contents.deux-colonnes');
			    if (!container) return;
			
			    // Largeur réelle du libellé le plus long
			    var spans = container.querySelectorAll('.leaflet-legend-item span');
			    var largeurMaxLib = 0;
			    spans.forEach(function(span) {
			        if (span.offsetWidth > largeurMaxLib) largeurMaxLib = span.offsetWidth;
			    });
			
			    // Largeur colonne = libellé + icône/picto + petite marge de sécurité
			    var largeurColonne = largeurMaxLib + 30;
			
			    container.querySelectorAll('.leaflet-legend-column').forEach(function(col) {
			        col.style.minWidth = largeurColonne + 'px';
			    });
			}
				
			// legende sur 2 col si nbr elts legende > 27 
			var nbrColonnes = (tabCtrlLegendeObj.length > 27) ? 2 : 1;
			blocLegende = L.control.Legend({title: null, position: "bottomright", opacity: 0.9, column: nbrColonnes, legends: tabCtrlLegendeObj});
			blocLegende.addTo(maCarte);
			if (nbrColonnes === 2) {
				var container = maCarte.getContainer().querySelector('.leaflet-legend-contents');
				if (container) container.classList.add('deux-colonnes');
				requestAnimationFrame(ajusterLargeurColonnesLegende);
			}
		
		}						
	
		tabNettoyé = filtrerDoublons(tabGeomCouche);	
			
		for (i=0; i < tabNettoyé.length; i++) {
			// On s'assure que les polygones initiaux restent bien au fond
			if (tabNettoyé[i][0] == "MultiPolygon")  {
				tabCoucheMG[i].bringToBack();
			}
			// Sécurité pour nommer les couches vides/anonymes (à conserver !)
			if (tabNettoyé[i][1] == null) {
				tabNettoyé[i][1] = "Couche " + (i+1);
			}	
		}
		
		// On repousse au fond les éléments Lignes/Polygones liés à la légende
		for (i=0; i < tabEltsMLSLeg.length; i++) {
			tabEltsMLSLeg[i].bringToBack();		
		}
		for (i=0; i < tabEltsMPLeg.length; i++) {
			tabEltsMPLeg[i].bringToBack();		
		}
		
		var fondsCarte = {		
			"CartoDB N&B": cartoDB, 		
			"Stadia Map": StadiaMap,
			"Plan IGN": fdcIGN,		
			"Google Satellite": googleSat,	
			"Ortho IGN": orthoIGN			
		};	
	
		var tabCtrlboxNom = [];
		var libelleCouche = {};
		for (i=0; i < nbreDeVues; i++) {	
			tabCtrlboxNom.push({nom: tabNettoyé[i][1], couche: tabCoucheMG[i]});	
		}	
		// alim box couches
		libelleCouche = Object.assign({}, ...tabCtrlboxNom.map(item => ({ [item.nom]: item.couche })));
		//console.log("libelleCouche : " , libelleCouche);
	
		// Repli box couches si legende trop grande en hauteur ecran	
		if (presenceLegende) {
			
			const nbrEltsLegende = tabCtrlLegendeObj.length;	
			const largeurEcran = screen.width;
			// Set filtre les doublons, size compte le nbr sous-titres uniques
			const nbrSousTitresLeg = new Set(tabCtrlLegendeObj.map(o => o.nomCouche)).size;

			// Repli ecrans HD et moins selon nbr elts legende, nbr couches (vues) et nbr col. legende
			if (largeurEcran <= 1920) {
				var trigger1Repli = (nbrColonnes === 1 && nbrEltsLegende > 25);
				var trigger2Repli = (nbrColonnes === 2 && nbrEltsLegende > 45);
				var trigger3Repli = (nbrColonnes === 1 && nbrEltsLegende + nbreDeVues > 25);
				var trigger4Repli = (nbrColonnes === 2 && nbrEltsLegende + nbreDeVues > 40);
				// trigger5 inactif (false) si carto "surveillance" (car définie sans sous-titre ds legende.js)
				var trigger5Repli = valeurTitre1.indexOf("Surveillance") === -1 && nbrColonnes === 1 && (nbreDeVues + nbrEltsLegende + nbrSousTitresLeg > 26);
				
				if (trigger1Repli || trigger2Repli || trigger3Repli || trigger4Repli || trigger5Repli || L.Browser.mobile) {
					ctrlBoxCouches = L.control.layers(fondsCarte, libelleCouche, {collapsed: true});
					ctrlBoxCouches.addTo(maCarte);
					// repli bloc legende si tablettes/mobiles				
					if ((nbrEltsLegende >= 23 && largeurEcran < 1900) || (L.Browser.mobile && nbrEltsLegende >= 8)) {
						blocLegende.remove();
						blocLegende = L.control.Legend({title: null, collapsed: true, position: "bottomright", opacity: 0.8, legends: tabCtrlLegendeObj});
						blocLegende.addTo(maCarte);
						if (nbrColonnes === 2) {
							var container = maCarte.getContainer().querySelector('.leaflet-legend-contents');
							if (container) container.classList.add('deux-colonnes');
							requestAnimationFrame(ajusterLargeurColonnesLegende);
						}
					}
				}				
				else {
					ctrlBoxCouches = L.control.layers(fondsCarte, libelleCouche, {collapsed: false});
					ctrlBoxCouches.addTo(maCarte);
				}
			}
			// ecrans au dela de HD pas de repli
			else {
				ctrlBoxCouches = L.control.layers(fondsCarte, libelleCouche, {collapsed: false});
				ctrlBoxCouches.addTo(maCarte);			
			}
		}
		// Pas de légende pas de repli
		else {
	    	ctrlBoxCouches = L.control.layers(fondsCarte, libelleCouche, {collapsed: false});
	    	ctrlBoxCouches.addTo(maCarte);
		}	
	}

	this.zoomObjet = function () {	
	
.....	


function main() {
    carteLeaflet = new CarteLeaflet(carteId);	
	carteLeaflet.ajoutCoucheGeojson();	
	carteLeaflet.dessinerCarte();
    carteLeaflet.limiteAdmin(Gard);		
	carteLeaflet.coordGPS();
	carteLeaflet.zoomObjet(); 	
	carteLeaflet.recentrer();
	carteLeaflet.rechercherLieu();
	carteLeaflet.importFichier();
	carteLeaflet.exportCouches();
	carteLeaflet.iconeClé();	
	carteLeaflet.titre();
	carteLeaflet.ajouterLogo();	
	carteLeaflet.ajouterSwitch();	
	carteLeaflet.aide();		
	carteLeaflet.rechercherJson();
	carteLeaflet.visuEtInfo(); 
	carteLeaflet.visuBatiments3D();	
	carteLeaflet.spiderfyPoints();
}
		
</script> 
<!-- export couches - dev CD30 -->
<script src="/Ressources/API_JS/librairies_cd30/export-couches.js"></script>
