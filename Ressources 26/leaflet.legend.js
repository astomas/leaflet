(function (factory, window) {
    // define an AMD module that relies on 'leaflet'
    if (typeof define === "function" && define.amd) {
        define(["leaflet"], factory);

        // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === "object") {
        module.exports = factory(require("leaflet"));
    }

    // attach your plugin to the global 'L' variable
    if (typeof window !== "undefined" && window.L) {
        factory(L);
    }
})(function (L) {
    class LegendSymbol {
        constructor(control, container, legend) {
            this._control = control;
            this._container = container;
            this._legend = legend;
            this._width = this._control.options.symbolWidth;
            this._height = this._control.options.symbolHeight;
        }
    }

    class GeometricSymbol extends LegendSymbol {
        constructor(control, container, legend) {
            super(control, container, legend);

            this._canvas = this._buildCanvas();
            if (this._drawSymbol) {
                this._drawSymbol();
            }
            this._style();
        }

        _buildCanvas() {
            var canvas = L.DomUtil.create("canvas", null, this._container);
            canvas.height = this._control.options.symbolHeight;
            canvas.width = this._control.options.symbolWidth;
            return canvas;
        }

        _drawSymbol() {}

        _style() {
            var ctx = (this._ctx = this._canvas.getContext("2d"));
            if (this._legend.fill || this._legend.fillColor) {
                ctx.globalAlpha = this._legend.fillOpacity || 1;
                ctx.fillStyle = this._legend.fillColor || this._legend.color;
                ctx.fill(this._legend.fillRule || "evenodd");
				//ctx.fillRect(this._legend.fillRule || "nonzero");
				//ctx.fillRect(this._legend.color);
            }

            if (this._legend.stroke || this._legend.color) {
                if (this._legend.dashArray) {
                    ctx.setLineDash(this._legend.dashArray || []);
                }
                ctx.globalAlpha = this._legend.opacity || 1.0;
                ctx.lineWidth = this._legend.weight || 2;
                ctx.strokeStyle = this._legend.color || "#3388ff";
                ctx.lineCap = this._legend.lineCap || "round";
                ctx.lineJoin = this._legend.lineJoin || "round";
                ctx.stroke();
            }
        }

        rescale() {}

        center() {}
    }

    class CircleSymbol extends GeometricSymbol {
        _drawSymbol() {
            var ctx = (this._ctx = this._canvas.getContext("2d"));

            var legend = this._legend;
            var linelWeight = legend.weight || 3;

            var centerX = this._control.options.symbolWidth / 2;
            var centerY = this._control.options.symbolHeight / 2;
            var maxRadius = Math.min(centerX, centerY) - linelWeight;
            var radius = maxRadius;
            if (legend.radius) {
                radius = Math.min(legend.radius, maxRadius);
            }

            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
        }
    }

    class PolylineSymbol extends GeometricSymbol {
        _drawSymbol() {
            var ctx = (this._ctx = this._canvas.getContext("2d"));
			var x1 = 0,	x2 = 18, y1 = 0, y2 = 18;
            ctx.beginPath();
            ctx.moveTo(x1,y1);
			ctx.fillStyle = this._legend.color;
			ctx.fillRect(x1, y1, x2, y2);

        }
    }
    class PolygonSymbol extends GeometricSymbol {
        _drawSymbol() {
            var ctx = (this._ctx = this._canvas.getContext("2d"));

			var x1 = 0,	x2 = 18, y1 = 0, y2 = 18;
			ctx.beginPath();
            ctx.moveTo(x1,y1);
			ctx.fillStyle = this._legend.color;
			ctx.fillRect(x1, y1, x2, y2);

        }
    }
	
	class RectangleSymbol extends GeometricSymbol {
        _drawSymbol() {
            var ctx = (this._ctx = this._canvas.getContext("2d"));
            
			var linelWeight = this._legend.weight || 3;

            var x0 = this._control.options.symbolWidth / 2;
            var y0 = this._control.options.symbolHeight / 2;

            var rx = x0 - linelWeight;
            var ry = y0 - linelWeight;
            if (rx == ry) {
                ry = ry / 2;
            }
            ctx.rect(x0 - rx, y0 - ry, rx * 2, ry * 2);
        }
    }



    class ImageSymbol extends LegendSymbol {
        constructor(control, container, legend) {
            super(control, container, legend);
            this._img = null;
            this._loadImages();
        }

        _loadImages() {
            var imageLoaded = () => {
                this.rescale();
            };
            var img = L.DomUtil.create("img", null, this._container);
            this._img = img;
            img.onload = imageLoaded;
            img.src = this._legend.url;
        }

        rescale() {
            if (this._img) {
                var _options = this._control.options;
                if (this._img.width > _options.symbolWidth || this._img.height > _options.symbolHeight) {
                    var imgW = this._img.width;
                    var imgH = this._img.height;
                    var scaleW = _options.symbolWidth / imgW;
                    var scaleH = _options.symbolHeight / imgH;
                    var scale = Math.min(scaleW, scaleH);
                    this._img.width = imgW * scale;
                    this._img.height = imgH * scale;
                }
                this.center();
            }
        }

        center() {
            var containerCenterX = this._container.offsetWidth / 2;
            var containerCenterY = this._container.offsetHeight / 2;
            var imageCenterX = parseInt(this._img.width) / 2;
            var imageCenterY = parseInt(this._img.height) / 2;

            var shiftX = containerCenterX - imageCenterX;
            var shiftY = containerCenterY - imageCenterY;

            this._img.style.left = shiftX.toString() + "px";
            this._img.style.top = shiftY.toString() + "px";
        }
    }

    L.Control.Legend = L.Control.extend({
        options: {
            position: "topleft",
            title: "Legend",
            legends: [],
            symbolWidth: 24,
            symbolHeight: 24,
            opacity: 1.0,
            column: 1,
            collapsed: false,
        },

        initialize: function (options) {
            L.Util.setOptions(this, options);
            this._legendSymbols = [];
            this._buildContainer();
        },

        onAdd: function (map) {
            this._map = map;
            this._initLayout();
 
            // Figer la hauteur du bloc légende à l'état initial (tout déplié)
            var self = this;
            setTimeout(function() {
                if (self._contents && self._contents.offsetHeight > 0) {
                    self._contents.style.minHeight = self._contents.offsetHeight + "px";
                }
            }, 0);
 
            return this._container;
        },
		
        _buildContainer: function () {
            this._container = L.DomUtil.create("div", "leaflet-legend leaflet-bar leaflet-control");
			this._container.style.backgroundColor = "rgba(230,233,249, " + this.options.opacity + ")";
            this._contents = L.DomUtil.create("section", "leaflet-legend-contents", this._container);
            this._link = L.DomUtil.create("a", "leaflet-legend-toggle", this._container);
			this._link.title = "Légende";
            this._link.href = "#";

            var title = L.DomUtil.create("h3", "leaflet-legend-title", this._contents);
            title.innerText = this.options.title || "";

            var len = this.options.legends.length;

            // Regroupement par nomCouche (thématiques repliables) - exceptions: si carte 'surveillance du resau' ou si sur 2 col pour 1 couche
			//var auMoinsUnNomCouche = valeurTitre1.indexOf("Surveillance du r") === -1 && (this.options.column === 1 || new Set(this.options.legends.map(function(l) { return l.nomCouche; }).filter(Boolean)).size >= this.options.column);	
			var auMoinsUnNomCouche = valeurTitre1.indexOf("Surveillance du r") === -1 
			&& valeurTitre1.indexOf("Limites de gestion PER") === -1 
			&& (this.options.column === 1 || new Set(this.options.legends.map(function(l) { return l.nomCouche; }).filter(Boolean)).size >= this.options.column);			

            if (auMoinsUnNomCouche) {
                // Construire la liste ordonnée des groupes (en préservant l'ordre d'apparition)
                var groupesOrdonnes = [];
                var groupesMap = {};
                for (var i = 0; i < len; i++) {
                    var legend = this.options.legends[i];
                    // Clé de groupe : nomCouche ou "Sans thématique" pour les items orphelins
                    var cle = legend.nomCouche || "Sans thématique";
                    if (!groupesMap[cle]) {
                        groupesMap[cle] = [];
                        groupesOrdonnes.push(cle);
                    }
                    groupesMap[cle].push(legend);
                }

                // Créer un conteneur colonne unique pour le mode groupé
                /*var legendContainer = L.DomUtil.create("div", "leaflet-legend-column", this._contents);
                for (var g = 0; g < groupesOrdonnes.length; g++) {*/

				// Répartition des groupes sur N colonnes (1 ou 2)
				// Si 2 colonnes : coupe simplement le premier groupe > seuilColonne items.
				var colSize = Math.ceil(groupesOrdonnes.length / this.options.column);
				var legendContainer;
				var seuilColonne = 22;
				var nbColonnesCreees = 0;
				var splitGroupeDejaFait = false;

				for (var g = 0; g < groupesOrdonnes.length; g++) {
					if (g % colSize === 0 && nbColonnesCreees < this.options.column) {
						legendContainer = L.DomUtil.create("div", "leaflet-legend-column", this._contents);
						nbColonnesCreees++;
					}
					
                    var nomGroupe = groupesOrdonnes[g];
                    var itemsDuGroupe = groupesMap[nomGroupe];

                    // Header cliquable de la thématique
                    var headerDiv = L.DomUtil.create("div", "leaflet-legend-group-header", legendContainer);
                    // Flèche indicatrice d'état (▶ replié, ▼ déplié)
                    var fleche = L.DomUtil.create("span", "leaflet-legend-group-arrow", headerDiv);
                    fleche.innerText = "▼";
                    var titreGroupe = L.DomUtil.create("span", "leaflet-legend-group-title", headerDiv);
                    titreGroupe.innerText = nomGroupe;

                    // Conteneur des items, toujours déplié à l'ouverture (style Lizmap)
                    var groupeContenu = L.DomUtil.create("div", "leaflet-legend-group-content", legendContainer);

					// Ajouter les items ou couper le groupe si trop long en 2 colonnes
					if (this.options.column === 2 && itemsDuGroupe.length > seuilColonne && nbColonnesCreees < 2 && !splitGroupeDejaFait) {
						// Début du groupe dans la colonne actuelle
						for (var j = 0; j < seuilColonne; j++) {
							this._buildLegendItems(groupeContenu, itemsDuGroupe[j]);
						}

						// Suite du groupe dans la 2e colonne
						legendContainer = L.DomUtil.create("div", "leaflet-legend-column", this._contents);
						nbColonnesCreees++;
						splitGroupeDejaFait = true;

						var headerDivSuite = L.DomUtil.create("div", "leaflet-legend-group-header", legendContainer);
						var flecheSuite = L.DomUtil.create("span", "leaflet-legend-group-arrow", headerDivSuite);
						flecheSuite.innerText = "▼";
						var titreGroupeSuite = L.DomUtil.create("span", "leaflet-legend-group-title", headerDivSuite);
						titreGroupeSuite.innerText = nomGroupe + " - suite";
						var groupeContenuSuite = L.DomUtil.create("div", "leaflet-legend-group-content", legendContainer);

						for (var j = seuilColonne; j < itemsDuGroupe.length; j++) {
							this._buildLegendItems(groupeContenuSuite, itemsDuGroupe[j]);
						}

						(function(contenu, flecheRef) {
							L.DomEvent.on(headerDivSuite, "click", function(e) {
								L.DomEvent.stopPropagation(e);
								if (contenu.classList.contains("leaflet-legend-group-collapsed")) {
									contenu.classList.remove("leaflet-legend-group-collapsed");
									flecheRef.innerText = "▼";
								} else {
									contenu.classList.add("leaflet-legend-group-collapsed");
									flecheRef.innerText = "▶";
								}
							});
						})(groupeContenuSuite, flecheSuite);
					} else {
						// Cas normal
						for (var j = 0; j < itemsDuGroupe.length; j++) {
							this._buildLegendItems(groupeContenu, itemsDuGroupe[j]);
						}
					}

                    // Événement clic sur le header pour replier/déplier
                    // Closure nécessaire pour capturer les bonnes références dans la boucle
                    (function(contenu, flecheRef) {
                        L.DomEvent.on(headerDiv, "click", function(e) {
                            L.DomEvent.stopPropagation(e);
                            /*if (contenu.style.display === "none") {
                                contenu.style.display = "";
                                flecheRef.innerText = "▼";
                            } else {
                                contenu.style.display = "none";
                                flecheRef.innerText = "▶";
                            }*/
							if (contenu.classList.contains("leaflet-legend-group-collapsed")) {
								contenu.classList.remove("leaflet-legend-group-collapsed");
								flecheRef.innerText = "▼";
							} else {
								contenu.classList.add("leaflet-legend-group-collapsed");
								flecheRef.innerText = "▶";
							}
                        });
                    })(groupeContenu, fleche);
                }
            } else {
                // --- Comportement original sans regroupement ---
                var colSize = Math.ceil(len / this.options.column);
                var legendContainer = this._contents;
                for (var i = 0; i < len; i++) {
                    if (i % colSize == 0) {
                        legendContainer = L.DomUtil.create("div", "leaflet-legend-column", this._contents);
                    }
                    var legend = this.options.legends[i];
                    this._buildLegendItems(legendContainer, legend);
                }
            }
        },

        _buildLegendItems: function (legendContainer, legend) {
            var legendItemDiv = L.DomUtil.create("div", "leaflet-legend-item", legendContainer);
            if (legend.inactive) {
                L.DomUtil.addClass(legendItemDiv, "leaflet-legend-item-inactive");
            }
            var symbolContainer = L.DomUtil.create("i", null, legendItemDiv);

            var legendSymbol;
            if (legend.type === "image") {
                legendSymbol = new ImageSymbol(this, symbolContainer, legend);
            } else if (legend.type === "circle") {
                legendSymbol = new CircleSymbol(this, symbolContainer, legend);
            } else if (legend.type === "rectangle") {
                legendSymbol = new RectangleSymbol(this, symbolContainer, legend);
            } else if (legend.type === "polygon") {
                legendSymbol = new PolygonSymbol(this, symbolContainer, legend);
            } else if (legend.type === "polyline") {
                legendSymbol = new PolylineSymbol(this, symbolContainer, legend);
            } else {
                L.DomUtil.remove(legendItemDiv);
                return;
            }
            this._legendSymbols.push(legendSymbol);

            symbolContainer.style.width = this.options.symbolWidth + "px";
            symbolContainer.style.height = this.options.symbolHeight + "px";

            var legendLabel = L.DomUtil.create("span", null, legendItemDiv);
            legendLabel.innerText = legend.label;
            if (legend.layers) {
                L.DomUtil.addClass(legendItemDiv, "leaflet-legend-item-clickable");
                L.DomEvent.on(
                    legendItemDiv,
                    "click",
                    function () {
                        this._toggleLegend.call(this, legendItemDiv, legend.layers);
                    },
                    this
                );
            }
        },

        _initLayout: function () {
            L.DomEvent.disableClickPropagation(this._container);
            L.DomEvent.disableScrollPropagation(this._container);

            if (this.options.collapsed) {
                this._map.on("click", this.collapse, this);

                L.DomEvent.on(
                    this._container,
                    {
                        mouseenter: this.expand,
                        mouseleave: this.collapse,
                    },
                    this
                );
            } else {
                this.expand();
            }
        },

        _toggleLegend: function (legendDiv, layers) {
            if (L.DomUtil.hasClass(legendDiv, "leaflet-legend-item-inactive")) {
                L.DomUtil.removeClass(legendDiv, "leaflet-legend-item-inactive");
                if (L.Util.isArray(layers)) {
                    for (var i = 0, len = layers.length; i < len; i++) {
                        this._map.addLayer(layers[i]);
                    }
                } else {
                    this._map.addLayer(layers);
                }
            } else {
                L.DomUtil.addClass(legendDiv, "leaflet-legend-item-inactive");
                if (L.Util.isArray(layers)) {
                    for (var i = 0, len = layers.length; i < len; i++) {
                        this._map.removeLayer(layers[i]);
                    }
                } else {
                    this._map.removeLayer(layers);
                }
            }
        },

        expand: function () {
            this._link.style.display = "none";
            L.DomUtil.addClass(this._container, "leaflet-legend-expanded");
            for (var legendSymbol of this._legendSymbols) {
                legendSymbol.rescale();
            }
            return this;
        },

        collapse: function () {
            this._link.style.display = "block";
            L.DomUtil.removeClass(this._container, "leaflet-legend-expanded");
            return this;
        },

        redraw: function () {
            L.DomUtil.empty(this._contents);
            this._buildLegendItems();
        },
    });

    L.control.legend = L.control.Legend = function (options) {
        return new L.Control.Legend(options);
    };
}, window);