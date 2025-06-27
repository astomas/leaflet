L.StreetView = L.Control.extend({

	tabServices: [ 	
	['googleSV', 'StreetView', 'Google Street View', false, 'https://www.google.com/maps?layer=c&cbll={lat},{lon}', 'url("/Ressources/API_JS/images/icones visu/pegman.png")', '1px solid #717D7E'],		
	['mapillary', 'Mapillary', 'Mapillary', false,'	https://graph.mapillary.com/images?access_token=MLY|5296754467082213|6e589aa9d92ba27bc12ecfe3c69436a0&fields=477051220036268&bbox={lon1},{lat1},{lon2},{lat2}&limit=1&organization_id=477051220036268&start_captured_at=2021-01-01%2015:00:00.000Z', 'url("/Ressources/API_JS/images/icones visu/mapillary2.png")', '1px solid #717D7E'],	
	['panoramax', 'Panoramax', 'Panoramax', false, 'https://api.panoramax.xyz/api/search?&bbox={lon1},{lat1},{lon2},{lat2}&limit=1', 'url("/Ressources/API_JS/images/icones visu/panoramax.png")', '1px solid #717D7E'],
	['IGN', 'IGN 2D', 'Géoportail IGN 2D', false,'https://www.geoportail.gouv.fr/carte?c={lon},{lat}&z=18&l0=ORTHOIMAGERY.ORTHOPHOTOS::GEOPORTAIL:OGC:WMTS(1)&l1=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2::GEOPORTAIL:OGC:WMTS(1;h)&l2=CADASTRALPARCELS.PARCELLAIRE_EXPRESS::GEOPORTAIL:OGC:WMTS(1;h)&l3=COMMUNES.PRIORITYDISCTRICT::GEOPORTAIL:OGC:WMTS(0.6;h)&l4=TRANSPORTNETWORKS.ROADS::GEOPORTAIL:OGC:WMTS(1)&l5=UTILITYANDGOVERNMENTALSERVICES.IGN.POI.ENSEIGNEMENTSECONDAIRE::GEOPORTAIL:OGC:WMS(1)&l6=TRANSPORTNETWORK.COMMONTRANSPORTELEMENTS.MARKERPOST_VISU::GEOPORTAIL:OGC:WMTS(1)&permalink=yes', 'url("/Ressources/API_JS/images/icones visu/ign.png")', '1px solid #717D7E'],
	['IGN3D', 'IGN 3D', 'Géoportail IGN 3D', false,'https://www.geoportail.gouv.fr/carte?c={lon},{lat}&z=18&l3=ORTHOIMAGERY.ORTHOPHOTOS::GEOPORTAIL:OGC:WMTS(1)&l4=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2::GEOPORTAIL:OGC:WMTS(1;h)&l5=CADASTRALPARCELS.PARCELLAIRE_EXPRESS::GEOPORTAIL:OGC:WMTS(1;h)&l6=COMMUNES.PRIORITYDISCTRICT::GEOPORTAIL:OGC:WMTS(0.6;h)&l8=TRANSPORTNETWORKS.ROADS::GEOPORTAIL:OGC:WMTS(1)&l8=UTILITYANDGOVERNMENTALSERVICES.IGN.POI.ENSEIGNEMENTSECONDAIRE::GEOPORTAIL:OGC:WMS(1)&l9=TRANSPORTNETWORK.COMMONTRANSPORTELEMENTS.MARKERPOST_VISU::GEOPORTAIL:OGC:WMTS(1)&tilt=45&heading=0&is3Dloaded=yes&permalink=yes', 'url("/Ressources/API_JS/images/icones visu/ign3d.png")', '1px solid #717D7E'],
	['googleearth', 'Google Earth 3D', 'Google Earth 3D', false, 'https://earth.google.com/web/@{lat},{lon},32.3713819a,300d,35y,0h,60t,0r', 'url("/Ressources/API_JS/images/icones visu/google_earth.png")', '1px solid #717D7E'],	
	['googlemap', 'Google Map', 'Google Maps', false, 'https://www.google.com/maps/search/?api=1&query={lat},{lon}', 'url("/Ressources/API_JS/images/icones visu/gmap.png")', '1px solid #717D7E'],
	['Waze', 'Waze', 'Waze (livemap)', false, 'https://www.waze.com/fr/live-map/directions?to=ll.{lat}%2C{lon}', 'url("/Ressources/API_JS/images/icones visu/waze.png")', '1px solid #717D7E'],	
	// l'url ne prend pas inclinaison '3214a,35y,359.23h,55.56t'
	['googlemap3D', 'Google Map 3D', 'Google Maps 3D', false, 'https://www.google.com/maps/@{lat},{lon},3214a,35y,359.23h,55.56t/data=!3m1!1e3?entry=ttu&g_ep=EgoyMDI0MTIxMS4wIKXMDSoASAFQAw%3D%3D', 'url("/Ressources/API_JS/images/icones visu/gmap3D.png")', '1px solid #717D7E'],
	['world', 'World 3D', 'World 3D', false, 'https://maps.wrld3d.com/?lat={lat}&lon={lon}&zoom=17&orient=0.000', 'url("/Ressources/API_JS/images/icones visu/world.png")', '1px solid #717D7E']
	],
	onAdd: function(map) {
		this.containerHTML = L.DomUtil.create('div', 'leaflet-bar');
		this.tableauBoutons = [];
		for (i=0; i < this.tabServices.length; i++){		
			this.ajouterBouton(this.tabServices[i]);
		}		
		map.on('moveend', function() {	
		  if (!this._fixed)
			this._update(map.getCenter());
		}, this);
		this._update(map.getCenter());
		return this.containerHTML;
	},	
	
	fixCoord: function(latlon) {
		this._update(latlon);
		this._fixed = true;
		},
		
	releaseCoord: function() {
		this._fixed = false;
		this._update(this._map.getCenter());
		},	
		
	ajouterBouton: function(provider) {
		if (!this.options[provider[0]])
		  return;
		var button = L.DomUtil.create('a');
		button.innerHTML = '';
		button.title = provider[2];
		button._bounds = provider[3];
		button._template = provider[4];
		button.href = '#';
		button.target = '_blank';
		button.style.backgroundImage = provider[5];		
		button.style.backgroundSize = 'contain';	
		button.style.padding = '8px 8px 8px 8px';
		button.style.backgroundColor = 'white';
		button.style.border = provider[6];	
		button.style.borderRadius = '10px';
		this.containerHTML.style.border = 'none';	
		this.containerHTML.style.padding = 'none';	
		this.containerHTML.style.marginBottom = '2px';	
		this.containerHTML.style.background = 'none';
		 // Overriding some of the leaflet styles
		button.style.display = 'inline-block';	

		if (provider[0] == 'mapillary') {
		  L.DomEvent.on(button, 'click', function(e) {
			if (button.href) {
			  this._ajaxRequest(			  
				button.href,
				function(JSONRamené) {
					if (JSONRamené.data[0]) {
						photoId = JSONRamené.data[0].id,
						urlPhotoId = 'https://www.mapillary.com/map/im/{key}&mapStyle=OpenStreetMap&focus=photo&organization_id=477051220036268'.replace(/{key}/, photoId);	

						window.open(urlPhotoId, button.target);
					}
					else {
						alert("Il n'y a pas de photo Mapillary de 'si3p0' à cet emplacement.");					
					}
				}
			  );	
			}
			return L.DomEvent.preventDefault(e);
		  }, this);
		};		
		if (provider[0] == 'panoramax') {
		  L.DomEvent.on(button, 'click', function(e) {
			if (button.href) {
			 this._ajaxRequest(			  
				button.href,
				function(JSONRamené) {
					if (JSONRamené.features[0]) {
						photoPanoId = JSONRamené.features[0].id,
						urlPanoPhotoId = 'https://api.panoramax.xyz/#background=streets&focus=pic&pic={photoPanoId}'.replace(/{photoPanoId}/, photoPanoId);	
						window.open(urlPanoPhotoId, button.target);
					}
					else {
						alert("Il n'y a pas de photo Panoramax à cet emplacement.");					
					}
				}
			  );	
			}
			return L.DomEvent.preventDefault(e);
		  }, this);
		}		
		this.tableauBoutons.push(button);		
	  },  	  

	  _update: function(center) {
		if (!center)
		  return;
		var last;
		for (i=0; i < this.tableauBoutons.length; i++) {
		  var boutonUnitaire = this.tableauBoutons[i],	
			  show = !boutonUnitaire._bounds || boutonUnitaire._bounds.contains(center),
			  vis = this.containerHTML.contains(boutonUnitaire);
		  if (show && !vis) {
			ref = last ? last.nextSibling : this.containerHTML.firstChild;
			this.containerHTML.insertBefore(boutonUnitaire, ref);
		  } else if (!show && vis) {
			this.containerHTML.removeChild(boutonUnitaire);
			return;
		  }
		  last = boutonUnitaire;		  
		  var latitude = center.lat;
		  var longitude = center.lng;			
		  if (this.tableauBoutons[i].title == 'Géoportail IGN 3D') {
			latitude = latitude - 0.006;
		  }
		  var tmpl = boutonUnitaire._template;	
		  if (this.tableauBoutons[i].title == 'Mapillary' || this.tableauBoutons[i].title == 'Panoramax') {
		  	var latitude1 = center.lat - 0.00025;
			var longitude1 = center.lng - 0.00025;
			var latitude2 = center.lat + 0.00025;
			var longitude2 = center.lng + 0.00025;
			tmpl = tmpl
			.replace(/{lon1}/g, L.Util.formatNum(longitude1, 6))
			.replace(/{lat1}/g, L.Util.formatNum(latitude1, 6))
			.replace(/{lon2}/g, L.Util.formatNum(longitude2, 6))
			.replace(/{lat2}/g, L.Util.formatNum(latitude2, 6));
		  }
		  else {
		  tmpl = tmpl
			.replace(/{lon}/g, L.Util.formatNum(center.lng, 6))
			.replace(/{lat}/g, L.Util.formatNum(latitude, 6));
		  }
			boutonUnitaire.href = tmpl;
		}
	  },
	  	_ajaxRequest: function(url, callback, post_data) {
		if (window.XMLHttpRequest === undefined)
		  return;
		var req = new XMLHttpRequest();		
		//console.log("url pour GET: " + url);
		req.open(post_data ? 'POST' : "GET", url);
		if (post_data)
			req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			req.onreadystatechange = function() {
			  if (req.readyState === 4 && req.status == 200) {
				var JSONRamené = (JSON.parse(req.responseText));			
				//console.log("req.responseText: " + req.responseText);
				callback(JSONRamené);
			  }
			};
			req.send(post_data); 
	  }
	});

	
L.streetView = function(options) {
	return new L.StreetView(options);
	}