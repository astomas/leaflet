	// --- Fonction commune d'export ---
	function exportCouches(map, format, coucheSpecifique, nomCoucheSpecifique) { 
		// --- Export d'une couche spécifique (résultat de recherche) ---
		if (coucheSpecifique) {
			const featureCollection = { type: "FeatureCollection", features: [] };
			coucheSpecifique.eachLayer(function(layer) {
				const feature = layer.feature ? JSON.parse(JSON.stringify(layer.feature)) : 
								(layer.toGeoJSON ? layer.toGeoJSON() : null);
				if (feature) {
					cleanLienPropsOnFeature(feature);
					dropFieldsOnFeature(feature);
					featureCollection.features.push(feature);
				}
			});
			
			if (featureCollection.features.length === 0) {
				alert('Aucun résultat à exporter.');
				return;
			}
			
			let nomCouche = (nomCoucheSpecifique || 'recherche')
				.replace(/\s+/g, '_')
				.replace(/[\/\\:*?"<>|]/g, '_')
				.toLowerCase();
			
			if (format === 'GeoJSON') {
				const cleanFeatureCollection = {
					type: featureCollection.type,
					features: featureCollection.features.map(feature => ({
						type: feature.type,
						geometry: feature.geometry,
						properties: Object.fromEntries(
							Object.entries(feature.properties || {})
								.filter(([key]) => key !== 'leafletsearch')
						)
					}))
				};
				const dataStr = JSON.stringify(cleanFeatureCollection, null, 2);
				const dataBlob = new Blob(['\ufeff' + dataStr], { type: 'application/geo+json;charset=utf-8' });
				const url = URL.createObjectURL(dataBlob);
				const link = document.createElement('a');
				link.href = url;
				nomCouche = nomCouche.replace(/_-_/g, '-').replace(/_+/g, '_');
				link.download = nomCouche + '.geojson';
				link.click();
				URL.revokeObjectURL(url);
			}
			// Ajout SHAPE et GPX si besoin
			
			return;
		}
	  // export direct couches entieres via bouton
	  let nbCouchesVisibles = 0, nomsCouchesVisibles = [];

	  tabCoucheMG.forEach((couche, index) => {
		if (map.hasLayer(couche)) {
		  let nomCouche = 'couche_' + (index + 1);
		  let nomCoucheOriginal = nomCouche; 
		  if (typeof tabNettoyé !== 'undefined' && tabNettoyé[index]) {
			nomCouche = tabNettoyé[index][1] || nomCouche;
			nomCoucheOriginal = tabNettoyé[index][1] || nomCouche;
		  }
		  let hasFeatures = false;
		  couche.eachLayer(function() { hasFeatures = true; });
		  if (hasFeatures) {
			nbCouchesVisibles++;
			nomsCouchesVisibles.push(nomCouche);
		  }
		}
	  });

	  if (nbCouchesVisibles === 0) {
		alert('Aucune couche à exporter.\n\nVérifiez que des couches sont cochées en haut à droite.');
		return;
	  }

	  let messageConfirm = 'Voulez-vous exporter ' + nbCouchesVisibles + 
		(nbCouchesVisibles === 1 ? ' couche au format ' + format : ' couches au format ' + format) + ' ?\n\n';
	  messageConfirm += (nbCouchesVisibles === 1 ? 'Couche :\n' : 'Couches :\n');
	  nomsCouchesVisibles.forEach(nom => messageConfirm += '  • ' + nom + '\n');

	  if (!confirm(messageConfirm)) return;

	  let nbCouchesExportees = 0;

	  tabCoucheMG.forEach((couche, index) => {
		if (!map.hasLayer(couche)) return;

		const featureCollection = { type: "FeatureCollection", features: [] };
		couche.eachLayer(function(layer) {
		  const feature = layer.feature ? JSON.parse(JSON.stringify(layer.feature)) : 
						  (layer.toGeoJSON ? layer.toGeoJSON() : null);
		  if (feature) {
			cleanLienPropsOnFeature(feature);
			dropFieldsOnFeature(feature);
			featureCollection.features.push(feature);
		  }
		});

		if (featureCollection.features.length > 0) {
		  let nomCouche = 'couche_' + (index + 1);
		  let nomCoucheOriginal = nomCouche; 
		  if (typeof tabNettoyé !== 'undefined' && tabNettoyé[index]) {
			nomCouche = tabNettoyé[index][1] || nomCouche;
			nomCoucheOriginal = tabNettoyé[index][1] || nomCouche;
		  }
		  nomCouche = nomCouche.replace(/\s+/g, '_').replace(/[\/\\:*?"<>|]/g, '_').toLowerCase();

		  if (format === 'GeoJSON') {
		  // suppr propriété leafletsearch
		  const cleanFeatureCollection = {
				type: featureCollection.type,
				features: featureCollection.features.map(feature => ({
					type: feature.type,
					geometry: feature.geometry,
					properties: Object.fromEntries(
						Object.entries(feature.properties || {})
							.filter(([key]) => key !== 'leafletsearch')
					)
				}))
			};
			const dataStr = JSON.stringify(cleanFeatureCollection, null, 2);
			const dataBlob = new Blob(['\ufeff' + dataStr], { type: 'application/geo+json;charset=utf-8' });
			const url = URL.createObjectURL(dataBlob);
			const link = document.createElement('a');
			link.href = url;
			link.download = nomCouche + '_' + new Date().toISOString().slice(0,10) + '.geojson';
			setTimeout(() => { link.click(); URL.revokeObjectURL(url); }, nbCouchesExportees * 400);     

	} else if (format === 'SHAPE') {
	  const SHP = (typeof shpwrite !== 'undefined') ? shpwrite : (window && window.shpwrite);
	  try {
		setTimeout(() => {
		  (async () => {
			// 1) Normaliser en FeatureCollection
			let fc = featureCollection;
			if (fc && fc.type === 'Feature') {
			  fc = { type: 'FeatureCollection', features: [fc] };
			}
			if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features) || fc.features.length === 0) {
			  alert("Aucune entité à exporter dans cette couche.");
			  return;
			}

			// 2) Sanitize des propriétés (DBF = valeurs scalaires ; champs <= 10 chars)
			fc.features = fc.features
			  .filter(f => {
				// Supprimer les features sans coordonnées
				const geom = f.geometry;
				if (!geom || !geom.coordinates) return false;
				
				// Vérifier selon le type de géométrie
				if (geom.type === 'MultiLineString') {
				  // Accepter seulement si au moins un sous-tableau a des coordonnées
				  return geom.coordinates.length > 0 && 
						 geom.coordinates.some(line => line && line.length > 0);
				}
				// Pour Point, LineString, Polygon, etc.
				return geom.coordinates.length > 0;
			  })
			  .map(f => {
				const p = {};
				for (const [k, v] of Object.entries(f.properties || {})) {
				  if (k === 'leafletsearch') continue;
				  const key = (k || '').toString().slice(0, 10);
				  p[key] = (v == null || ['string','number','boolean'].includes(typeof v)) ? v : String(v);
				}
				return { ...f, properties: p };
			  });

			// Vérifier s'il reste des features valides
			if (fc.features.length === 0) {
			  alert("Aucune entité valide à exporter dans cette couche (géométries vides).");
			  return;
			}

			// 3) Options shp-write (outputType=blob, polyline!)
			const opts = {
			  folder: nomCouche || 'export',
			  filename: nomCouche || 'export',
			  outputType: 'blob',          // <-- pour obtenir directement un Blob valide
			  compression: 'DEFLATE',      // optionnel
			  types: {
				point: 'points',
				polygon: 'polygons',
				polyline: 'lines'          // <-- clé correcte pour les lignes
			  }
			};

			// 4) zip() peut être sync ou async selon versions -> on gère les 2
			let zipOut = SHP.zip(fc, opts);
			if (zipOut && typeof zipOut.then === 'function') {
			  zipOut = await zipOut; // Promise -> Blob/ArrayBuffer/Uint8Array
			}

			// 5) Ajouter le fichier .cpg pour forcer UTF-8 avec JSZip 
			if (typeof JSZip !== 'undefined' && zipOut instanceof Blob) {
			  try {
				const zip = await JSZip.loadAsync(zipOut);
				
				// Ajouter .cpg pour chaque shapefile dans le zip
				const shpFiles = Object.keys(zip.files).filter(f => f.endsWith('.shp'));
				for (const shpFile of shpFiles) {
				  const cpgName = shpFile.replace('.shp', '.cpg');
				  zip.file(cpgName, 'CP1252'); 
				}
				
				// Régénérer le blob avec UTF-8
				zipOut = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
				console.log('Encodage UTF-8 ajouté au Shapefile');
			  } catch (err) {
				console.warn('Impossible d\'ajouter .cpg (JSZip):', err);
				// On continue avec le blob original
			  }
			} else if (typeof JSZip === 'undefined') {
			  console.warn('JSZip non disponible - encodage UTF-8 non garanti');
			}
			// 5 bis Construire un Blob correct si nécessaire
			let blob;
			if (zipOut instanceof Blob) {
			  blob = zipOut; // déjà un Blob (grâce à outputType:'blob')
			} else if (zipOut instanceof ArrayBuffer) {
			  blob = new Blob([zipOut], { type: 'application/zip' });
			} else if (zipOut && zipOut.buffer instanceof ArrayBuffer) {
			  blob = new Blob([zipOut.buffer], { type: 'application/zip' }); // Uint8Array
			} else {
			  const u8 = (zipOut instanceof Uint8Array) ? zipOut : new Uint8Array(zipOut);
			  blob = new Blob([u8], { type: 'application/zip' });
			}

			// 6) Téléchargement via Object URL (pas d’URL géante -> pas de 414)
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${(nomCouche || 'export')}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(url), 2000);
		  })().catch(err => {
			console.error('Erreur export Shapefile (async):', err);
			alert('Erreur lors de l\'export Shapefile.\n\n' + (err && err.message ? err.message : err));
		  });
		}, nbCouchesExportees * 800);
	  } catch (error) {
		console.error('Erreur export Shapefile:', error);
		alert('Erreur lors de l\'export Shapefile.\n\n' + (error && error.message ? error.message : error));
		return;
	  }
			  
	} else if (format === 'GPX') {
	  console.log('Export GPX démarré');
	  console.log('featureCollection:', featureCollection);
	  
	  const simplifiedFC = {
		type: "FeatureCollection",
		features: featureCollection.features.map(f => {
		  let valeurDesc = "";
		  if (f.properties && f.properties.leafletsearch) {
			valeurDesc = f.properties.leafletsearch;
		  } else if (f.properties) {
			for (const [key, value] of Object.entries(f.properties)) {
			  if (key.toLowerCase() !== 'couleur' && key.toLowerCase() !== 'icone' && value) {
				valeurDesc = value;
				break;
			  }
			}
		  }
		  return {
			type: "Feature",
			geometry: f.geometry,
			properties: {
			  name: nomCoucheOriginal + (valeurDesc ? " - " + valeurDesc : "")
			}
		  };
		})
	  };
		
	  // GPX natif
	  let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Leaflet" xmlns="http://www.topografix.com/GPX/1/1">\n';
	  
	simplifiedFC.features.forEach(f => {
	  const g = f.geometry, n = (f.properties.name || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	  
	  if (g.type === 'Point') {
		gpx += `  <wpt lat="${g.coordinates[1]}" lon="${g.coordinates[0]}"><name>${n}</name></wpt>\n`;
	  } else if (g.type === 'MultiPoint') {
		g.coordinates.forEach(c => {
		  gpx += `  <wpt lat="${c[1]}" lon="${c[0]}"><name>${n}</name></wpt>\n`;
		});
	  } else if (g.type === 'LineString') {
		gpx += `  <trk><name>${n}</name><trkseg>\n`;
		g.coordinates.forEach(c => gpx += `    <trkpt lat="${c[1]}" lon="${c[0]}"/>\n`);
		gpx += '  </trkseg></trk>\n';
	  } else if (g.type === 'MultiLineString') {
		gpx += `  <trk><name>${n}</name>\n`;
		g.coordinates.forEach(line => {
		  gpx += '    <trkseg>\n';
		  line.forEach(c => gpx += `      <trkpt lat="${c[1]}" lon="${c[0]}"/>\n`);
		  gpx += '    </trkseg>\n';
		});
		gpx += '  </trk>\n';
	  } else if (g.type === 'Polygon') {
		gpx += `  <trk><name>${n}</name><trkseg>\n`;
		g.coordinates[0].forEach(c => gpx += `    <trkpt lat="${c[1]}" lon="${c[0]}"/>\n`);
		gpx += '  </trkseg></trk>\n';
	  } else if (g.type === 'MultiPolygon') {
		g.coordinates.forEach(poly => {
		  gpx += `  <trk><name>${n}</name><trkseg>\n`;
		  poly[0].forEach(c => gpx += `    <trkpt lat="${c[1]}" lon="${c[0]}"/>\n`);
		  gpx += '  </trkseg></trk>\n';
		});
	  }
	});
	  
	  gpx += '</gpx>';
	  
	  console.log('GPX généré:', gpx.substring(0, 500));
	  
	  const blob = new Blob([gpx], {type: 'application/gpx+xml;charset=utf-8'});
	  const url = URL.createObjectURL(blob);
	  const link = document.createElement('a');
	  link.href = url;
	  link.download = nomCouche + '_' + new Date().toISOString().slice(0,10) + '.gpx';
	  console.log('Téléchargement:', link.download);
	  setTimeout(() => { 
		link.click(); 
		URL.revokeObjectURL(url); 
	  }, nbCouchesExportees * 400);
	}
		  
		nbCouchesExportees++;
		}
	  });
	}
	
	function decodeEntities(s) {
	  if (typeof s !== 'string') return s;
	  try { s = decodeURIComponent(s); } catch (_) {}
	  const txt = document.createElement('textarea');
	  txt.innerHTML = s;
	  return txt.value;
	}

	function extractHrefIfAnchor(s) {
	  if (typeof s !== 'string') return s;
	  const iTag = s.search(/<a\b/i);
	  if (iTag === -1) return s;
	  const iHrefRel = s.slice(iTag).search(/\bhref\s*=/i);
	  if (iHrefRel === -1) return s;
	  const startEq = iTag + iHrefRel + s.slice(iTag + iHrefRel).indexOf('=') + 1;
	  let i = startEq;
	  while (i < s.length && /\s/.test(s[i])) i++;
	  if (i >= s.length) return s;
	  const q = s[i];
	  if (q === '"' || q === "'") {
		i++;
		const j = s.indexOf(q, i);
		return j !== -1 ? s.slice(i, j) : s.slice(i);
	  }
	  const reNextAttr = /\s+[A-Za-z0-9._:-]+\s*=/g, reGt = />/g;
	  reNextAttr.lastIndex = i; reGt.lastIndex = i;
	  const mAttr = reNextAttr.exec(s), mGt = reGt.exec(s);
	  let end = s.length;
	  if (mAttr) end = Math.min(end, mAttr.index);
	  if (mGt) end = Math.min(end, mGt.index);
	  return s.slice(i, end).trim();
	}

	function absolutizeUrl(url) {
	  if (typeof url !== 'string') return url;
	  const s = url.trim();
	  if (/^https?:\/\//i.test(s)) return s;
	  if (s.startsWith('//')) return 'https:' + s;
	  try { return new URL(s, window.location.origin).href; } catch (_) { return s; }
	}

	function isAlreadyNormalized(u) {
	  if (typeof u !== 'string' || !/^https?:\/\/\S+$/i.test(u)) return false;
	  return !/%(?![0-9A-Fa-f]{2})/.test(u);
	}

	function normalizeUrl(s) {
	  if (typeof s !== 'string' || !s.trim()) return s;
	  try {
		const url = new URL(s, window.location.origin);
		url.pathname = url.pathname.split('/').map(seg => {
		  if (!seg) return seg;
		  try { seg = decodeURIComponent(seg); } catch (_) {}
		  return encodeURIComponent(seg);
		}).join('/');
		if (url.search) {
		  const usp = new URLSearchParams(url.search);
		  const parts = [];
		  for (const [k, v] of usp.entries()) {
			let dk = k, dv = v;
			try { dk = decodeURIComponent(k); } catch (_) {}
			try { dv = decodeURIComponent(v); } catch (_) {}
			parts.push(encodeURIComponent(dk) + '=' + encodeURIComponent(dv));
		  }
		  url.search = parts.length ? '?' + parts.join('&') : '';
		}
		if (url.hash) {
		  let h = url.hash.slice(1);
		  try { h = decodeURIComponent(h); } catch (_) {}
		  url.hash = h ? '#' + encodeURIComponent(h) : '';
		}
		return url.href;
	  } catch (_) {
		return s.replace(/[^\w\-./:?#[\]@!$&'()*+,;=%]/g, ch => encodeURIComponent(ch));
	  }
	}

	function cleanLienValue(v) {
	  if (v == null || String(v).trim() === '') return v;
	  let s = decodeEntities(v);
	  s = extractHrefIfAnchor(s);
	  s = absolutizeUrl(s);
	  if (isAlreadyNormalized(s)) return s;
	  return normalizeUrl(s);
	}

	function cleanLienPropsOnFeature(feature) {
	  const p = feature && feature.properties;
	  if (!p || typeof p !== 'object') return feature;
	  for (const k of Object.keys(p)) {
		if (/^Lien/i.test(k) && typeof p[k] === 'string' && p[k].trim() !== '') {
		  p[k] = cleanLienValue(p[k]);
		}
	  }
	  return feature;
	}

	const FIELDS_TO_DROP = new Set(['afficherlegouverture','legende']);
	function dropFieldsOnFeature(feature) {
	  const p = feature && feature.properties;
	  if (!p || typeof p !== 'object') return feature;
	  for (const k of Object.keys(p)) {
		if (FIELDS_TO_DROP.has(k.toLowerCase())) delete p[k];
	  }
	  return feature;
	}

 

// plugin d'export de couche si3p0 - CD30
CarteLeaflet.prototype.exportCouches = function() {	

		//bouton choix avec interface HTML
		L.easyButton('<i class="fa-solid fa-arrow-up-from-bracket" style="font-size:18px; margin-top:4px;"></i>', 
		  function(btn, map) {
			// Créer la boîte de dialogue
			const dialog = document.createElement('div');
			dialog.className = 'export-dialog';
			
			dialog.innerHTML = `
			  <h4>Choisissez le format d'export</h4>
			  <div class="export-dialog-options">
				<label class="export-dialog-label">
				  <input type="radio" name="format" value="GeoJSON" checked>
				  GeoJSON
				</label>
				<label class="export-dialog-label">
				  <input type="radio" name="format" value="SHAPE">
				  Shape
				</label>
				<label class="export-dialog-label">
				  <input type="radio" name="format" value="GPX">
				  GPX
				</label>
			  </div>
			  <div class="export-dialog-buttons">
				<button id="btnAnnuler" class="export-dialog-btn export-dialog-btn-cancel">Annuler</button>
				<button id="btnExporter" class="export-dialog-btn export-dialog-btn-export">Continuer</button>
			  </div>
			`;
			
			// Overlay (fond sombre)
			const overlay = document.createElement('div');
			overlay.className = 'export-overlay';
			
			document.body.appendChild(overlay);
			document.body.appendChild(dialog);
			
			// FORCER LE FOCUS sur le bouton Exporter après ajout au DOM
			setTimeout(() => {
			  document.getElementById('btnExporter').focus();
			}, 0);
			
			// Gestion des boutons
			document.getElementById('btnExporter').onclick = function() {
			  const selectedFormat = dialog.querySelector('input[name="format"]:checked').value;
			  overlay.remove();
			  dialog.remove();
			  exportCouches(map, selectedFormat);
			};
			
			document.getElementById('btnAnnuler').onclick = function() {
			  overlay.remove();
			  dialog.remove();
			};
			
			// Fermer en cliquant sur l'overlay
			overlay.onclick = function() {
			  overlay.remove();
			  dialog.remove();
			};
			// Gestion touches clavier
			function handleKeydown(e) {
				if (e.key === 'Enter') {
					document.getElementById('btnExporter').click();
				}
				if (e.key === 'Escape') {
					overlay.remove();
					dialog.remove();
					document.removeEventListener('keydown', handleKeydown);
				}
			}
			document.addEventListener('keydown', handleKeydown);
		  }, 
		  'Export des couches cochées'
		).addTo(maCarte);
	  
	};