/*!
 * 
 *  leaflet.browser.print - v1.0.5 (https://github.com/Igor-Vladyka/leaflet.browser.print) 
 *  A leaflet plugin which allows users to print the map directly from the browser
 *  
 *  MIT (http://www.opensource.org/licenses/mit-license.php)
 *  (c) 2020  Igor Vladyka <igor.vladyka@gmail.com> (https://github.com/Igor-Vladyka/)
 * 
 */
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/leaflet.browser.print.js":
/*!**************************************!*\
  !*** ./src/leaflet.browser.print.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Igor Vladyka <igor.vladyka@gmail.com> (https://github.com/Igor-Vladyka/leaflet.browser.print)
**/

L.Control.BrowserPrint = L.Control.extend({
	options: {
		title: 'Print map',
		documentTitle: '',
		position: 'topleft',
        printLayer: null,
		printModes: ["Portrait", "Landscape", "Auto", "Custom"],
		closePopupsOnPrint: true,
		contentSelector: "[leaflet-browser-print-content]",
		pagesSelector: "[leaflet-browser-print-pages]",
		manualMode: false,
		customPrintStyle: { color: "gray", dashArray: '5, 10', pane: "customPrintPane" }
	},

	onAdd: function (map) {

		if (this.options.customPrintStyle.pane && !map.getPane(this.options.customPrintStyle.pane)) {
			map.createPane(this.options.customPrintStyle.pane).style.zIndex = 9999;
		}

		var container = L.DomUtil.create('div', 'leaflet-control-browser-print leaflet-bar leaflet-control');
		L.DomEvent.disableClickPropagation(container);

		this._appendControlStyles(container);

		if (this.options.printModes.length > 1) {
			L.DomEvent.addListener(container, 'mouseover', this._displayPageSizeButtons, this);
			L.DomEvent.addListener(container, 'mouseout', this._hidePageSizeButtons, this);
		} else {
			container.style.cursor = "pointer";
		}

		if (this.options.position.indexOf("left") > 0) {
			this._createIcon(container);
			this._createMenu(container);
		} else {
			this._createMenu(container);
			this._createIcon(container);
		}

		map.printControl = this; // Make control available from the map object itself;
		return container;
	},

	_createIcon: function (container) {
		this.__link__ = L.DomUtil.create('a', '', container);
		this.__link__.className = "leaflet-browser-print";
		if (this.options.title) {
			this.__link__.title = this.options.title;
		}
		return this.__link__;
	},

	_createMenu: function (container) {
		var domPrintModes = [];

		for (var i = 0; i < this.options.printModes.length; i++) {
			var mode = this.options.printModes[i];

			/*
				Mode:
					Mode: Portrait/Landscape/Auto/Custom
					Title: 'Portrait'/'Landscape'/'Auto'/'Custom'
					PageSize: 'A3'/'A4'
					Action: '_printPortrait'/...
					InvalidateBounds: true/false
			*/
			if (mode.length) {
				var key = mode[0].toUpperCase() + mode.substring(1).toLowerCase();

				mode = L.control.browserPrint.mode[mode.toLowerCase()](this._getDefaultTitle(key));

			} else if (mode instanceof L.Control.BrowserPrint.Mode) {
				// Looks like everythin is fine.
			} else {
				throw "Invalid Print Mode. Can't construct logic to print current map."
			}

			if (this.options.printModes.length == 1) {
				mode.Element = container;
			} else {
				mode.Element = L.DomUtil.create('li', 'browser-print-mode', L.DomUtil.create('ul', 'browser-print-holder', container));
				mode.Element.innerHTML = mode.Title;
			}

			L.DomEvent.addListener(mode.Element, 'click', mode.Action(this, mode), this);

			domPrintModes.push(mode);
		}

		this.options.printModes = domPrintModes;
	},

	_getDefaultTitle: function(key) {
		return this.options.printModesNames && this.options.printModesNames[key] || key;
	},

    _displayPageSizeButtons: function() {
		if (this.options.position.indexOf("left") > 0) {
	        this.__link__.style.borderTopRightRadius = "0px";
	    	this.__link__.style.borderBottomRightRadius = "0px";
		} else {
			this.__link__.style.borderTopLeftRadius = "0px";
	    	this.__link__.style.borderBottomLeftRadius = "0px";
		}

		this.options.printModes.forEach(function(mode){
			mode.Element.style.display = "inline-block";
		});
    },

    _hidePageSizeButtons: function () {
		if (this.options.position.indexOf("left") > 0) {
	    	this.__link__.style.borderTopRightRadius = "";
	    	this.__link__.style.borderBottomRightRadius = "";
		} else {
	    	this.__link__.style.borderTopLeftRadius = "";
	    	this.__link__.style.borderBottomLeftRadius = "";
		}

		this.options.printModes.forEach(function(mode){
			mode.Element.style.display = "";
		});
    },

	_getMode: function(expectedOrientation, mode) {
		return new L.control.browserPrint.mode(expectedOrientation, mode.Title, mode.PageSize, mode.Action, mode.InvalidateBounds);
	},

    _printLandscape: function (mode) {
		this._addPrintClassToContainer(this._map, "leaflet-browser-print--landscape");
        this._print(mode);
    },

    _printPortrait: function (mode) {
		this._addPrintClassToContainer(this._map, "leaflet-browser-print--portrait");
        this._print(mode);
    },

    _printAuto: function (mode) {
		this._addPrintClassToContainer(this._map, "leaflet-browser-print--auto");

		var autoBounds = this._getBoundsForAllVisualLayers();
		var orientation = this._getPageSizeFromBounds(autoBounds);

		this._print(this._getMode(orientation, mode), autoBounds);
    },

    _printCustom: function (mode) {
		this._addPrintClassToContainer(this._map, "leaflet-browser-print--custom");
		this.options.custom = { mode: mode};
		this._map.on('mousedown', this._startAutoPoligon, this);
    },

	_addPrintClassToContainer: function (map, printClassName) {
		var container = map.getContainer();

		if (container.className.indexOf(printClassName) === -1) {
			container.className += " " + printClassName;
		}
	},

	_removePrintClassFromContainer: function (map, printClassName) {
		var container = map.getContainer();

		if (container.className && container.className.indexOf(printClassName) > -1) {
			container.className = container.className.replace(" " + printClassName, "");
		}
	},

	_startAutoPoligon: function (e) {
		e.originalEvent.preventDefault();
		e.originalEvent.stopPropagation();

		this._map.dragging.disable();

		this.options.custom.start = e.latlng;

		this._map.off('mousedown', this._startAutoPoligon, this);
		this._map.on('mousemove', this._moveAutoPoligon, this);
		this._map.on('mouseup', this._endAutoPoligon, this);
	},

	_moveAutoPoligon: function (e) {
		if (this.options.custom) {
			e.originalEvent.preventDefault();
			e.originalEvent.stopPropagation();
			if (this.options.custom.rectangle) {
				this.options.custom.rectangle.setBounds(L.latLngBounds(this.options.custom.start, e.latlng));
			} else {
				this.options.custom.rectangle = L.rectangle([this.options.custom.start, e.latlng], this.options.customPrintStyle);
				this.options.custom.rectangle.addTo(this._map);
			}
		}
	},

	_endAutoPoligon: function (e) {

		e.originalEvent.preventDefault();
		e.originalEvent.stopPropagation();

		this._map.off('mousemove', this._moveAutoPoligon, this);
		this._map.off('mouseup', this._endAutoPoligon, this);

		this._map.dragging.enable();

		if (this.options.custom && this.options.custom.rectangle) {
			var autoBounds = this.options.custom.rectangle.getBounds();

			this._map.removeLayer(this.options.custom.rectangle);

			var orientation = this._getPageSizeFromBounds(autoBounds);
			this._print(this._getMode(orientation, this.options.custom.mode), autoBounds);

			delete this.options.custom;
		} else {
			this._clearPrint();
		}
	},

	_getPageSizeFromBounds: function(bounds) {
		var height = Math.abs(bounds.getNorth() - bounds.getSouth());
		var width = Math.abs(bounds.getEast() - bounds.getWest());
		if (height > width) {
			return "Portrait";
		} else {
			return "Landscape";
		}
	},

	_setupPrintPagesWidth: function(pagesContainer, size, pageOrientation) {
		pagesContainer.style.width = pageOrientation === "Landscape" ? size.Height : size.Width;
	},

	_setupPrintMapHeight: function(mapContainer, size, pageOrientation) {
		mapContainer.style.height = pageOrientation === "Landscape" ? size.Width : size.Height;
	},

	/* Intended to cancel next printing*/
	cancel: function(cancelNextPrinting){
		this.cancelNextPrinting = cancelNextPrinting;
	},

	print: function(pageMode) {
		pageMode.Action(this, pageMode)();
	},

    _print: function (printMode, autoBounds) {
		this._map.fire(L.Control.BrowserPrint.Event.PrintInit, { mode: printMode });
		L.Control.BrowserPrint.Utils.initialize();

		var self = this;
        var mapContainer = this._map.getContainer();
		var pageOrientation = printMode.Mode;

        var origins = {
            bounds: autoBounds || this._map.getBounds(),
            width: mapContainer.style.width,
            height: mapContainer.style.height,
			documentTitle: document.title,
			printLayer: L.Control.BrowserPrint.Utils.cloneLayer(this.options.printLayer),
			panes: []
        };

		var mapPanes = this._map.getPanes();
		for (var pane in mapPanes) {
			origins.panes.push({name: pane, container: undefined});
		}

		origins.printObjects = this._getPrintObjects(origins.printLayer);

		this._map.fire(L.Control.BrowserPrint.Event.PrePrint, { printLayer: origins.printLayer, printObjects: origins.printObjects, pageOrientation: pageOrientation, printMode: printMode.Mode, pageBounds: origins.bounds});

		if (this.cancelNextPrinting) {
			delete this.cancelNextPrinting;
			return;
		}

		var overlay = this._addPrintMapOverlay(printMode.PageSize, printMode.getPageMargin("mm"), printMode.getSize(), pageOrientation, origins);

		if (this.options.documentTitle) {
			document.title = this.options.documentTitle;
		}

		this._map.fire(L.Control.BrowserPrint.Event.PrintStart, { printLayer: origins.printLayer, printMap: overlay.map, printObjects: overlay.objects });

		if (printMode.InvalidateBounds) {
			overlay.map.fitBounds(origins.bounds);
			overlay.map.invalidateSize({reset: true, animate: false, pan: false});
		} else {
			overlay.map.setView(this._map.getCenter(), this._map.getZoom() - 0.3);
		}

		var interval = setInterval(function(){
			if (!self._isTilesLoading(overlay.map)) {
				clearInterval(interval);
				if (self.options.manualMode) {
					self._setupManualPrintButton(overlay.map, origins, overlay.objects);
				} else {
					self._completePrinting(overlay.map, origins, overlay.objects);
				}
			}
		}, 50);
    },

	_completePrinting: function (overlayMap, origins, printObjects) {
		var self = this;
		setTimeout(function(){
			self._map.fire(L.Control.BrowserPrint.Event.Print, { printLayer: origins.printLayer, printMap: overlayMap, printObjects: printObjects });
			var printPromise = window.print();
			if (printPromise) {
				Promise.all([printPromise]).then(function(){
					self._printEnd(origins);
					self._map.fire(L.Control.BrowserPrint.Event.PrintEnd, { printLayer: origins.printLayer, printMap: overlayMap, printObjects: printObjects });
				})
			} else {
				self._printEnd(origins);
				self._map.fire(L.Control.BrowserPrint.Event.PrintEnd, { printLayer: origins.printLayer, printMap: overlayMap, printObjects: printObjects });
			}
		}, 1000);
	},

    _getBoundsForAllVisualLayers: function () {
	    var fitBounds = null;

        // Getting all layers without URL -> not tiles.
        for (var layerId in this._map._layers){
            var layer = this._map._layers[layerId];
            if (!layer._url && !layer._mutant) {
                if (fitBounds) {
                    if (layer.getBounds) {
                        fitBounds.extend(layer.getBounds());
                    } else if(layer.getLatLng){
                        fitBounds.extend(layer.getLatLng());
                    }
                } else {
                    if (layer.getBounds) {
                        fitBounds = layer.getBounds();
                    } else if(layer.getLatLng){
                        fitBounds = L.latLngBounds(layer.getLatLng(), layer.getLatLng());
                    }
                }
            }
        }

		if (!fitBounds) {
			fitBounds = this._map.getBounds();
		}

		return fitBounds;
    },

	_clearPrint: function () {
		this._removePrintClassFromContainer(this._map, "leaflet-browser-print--landscape");
		this._removePrintClassFromContainer(this._map, "leaflet-browser-print--portrait");
		this._removePrintClassFromContainer(this._map, "leaflet-browser-print--auto");
		this._removePrintClassFromContainer(this._map, "leaflet-browser-print--custom");
	},

    _printEnd: function (origins) {
		this._clearPrint();

		document.body.removeChild(this.__overlay__);
		this.__overlay__ = null;

		document.body.className = document.body.className.replace(" leaflet--printing", "");
		if (this.options.documentTitle) {
			document.title = origins.documentTitle;
		}

		this._map.invalidateSize({reset: true, animate: false, pan: false});
    },

	_getPrintObjects: function(printLayer) {
		var printObjects = {};
		for (var id in this._map._layers){
			var layer = this._map._layers[id];
			if (!printLayer || !layer._url || layer instanceof L.TileLayer.WMS) {
				var type = L.Control.BrowserPrint.Utils.getType(layer);
				if (type) {
					if (!printObjects[type]) {
						printObjects[type] = [];
					}
					printObjects[type].push(layer);
				}
			}
		}

		return printObjects;
	},

    _addPrintCss: function (pageSize, pageMargin, pageOrientation) {

        var printStyleSheet = document.createElement('style');
		printStyleSheet.className = "leaflet-browser-print-css";
        printStyleSheet.setAttribute('type', 'text/css');
		printStyleSheet.innerHTML = ' @media print { .leaflet-popup-content-wrapper, .leaflet-popup-tip { box-shadow: none; }';
		printStyleSheet.innerHTML += ' .leaflet-browser-print--manualMode-button { display: none; }';
		printStyleSheet.innerHTML += ' * { -webkit-print-color-adjust: exact!important; printer-colors: exact!important; color-adjust: exact!important; }';
		if (pageMargin) {
			printStyleSheet.innerHTML += ' @page { margin: ' + pageMargin + '; }';
		}
		printStyleSheet.innerHTML += ' @page :first { page-break-after: always; }';

        switch (pageOrientation) {
            case "Landscape":
                printStyleSheet.innerText += " @page { size : " + pageSize + " landscape; }";
                break;
            default:
            case "Portrait":
                printStyleSheet.innerText += " @page { size : " + pageSize + " portrait; }";
                break;
        }

        return printStyleSheet;
    },

	_appendControlStyles:  function (container) {
		var printControlStyleSheet = document.createElement('style');
		printControlStyleSheet.setAttribute('type', 'text/css');

		printControlStyleSheet.innerHTML += " .leaflet-control-browser-print { display: flex; } .leaflet-control-browser-print a { background: #fff url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gcCCi8Vjp+aNAAAAGhJREFUOMvFksENgDAMA68RC7BBN+Cf/ZU33QAmYAT6BolAGxB+RrrIsg1BpfNBVXcPMLMDI/ytpKozMHWwK7BJJ7yYWQbGdBea9wTIkRDzKy0MT7r2NiJACRgotCzxykFI34QY2Ea7KmtxGJ+uX4wfAAAAAElFTkSuQmCC') no-repeat 5px; background-size: 18px 18px; display: block; border-radius: 0px;}";

		printControlStyleSheet.innerHTML += " .leaflet-control-browser-print a.leaflet-browser-print { background-position-x: center; width:26px; heigth: 26px;}";
		printControlStyleSheet.innerHTML += " .browser-print-holder { margin: 0px; padding: 0px; list-style: none; white-space: nowrap; } .browser-print-holder-left li:last-child { border-top-right-radius: 0px; border-bottom-right-radius: 0px; } .browser-print-holder-right li:first-child { border-top-left-radius: 0px; border-bottom-left-radius: 0px; }";
		printControlStyleSheet.innerHTML += " .browser-print-mode { display: none; background-color: #919187; color: #FFF; font: 11px/19px 'Helvetica Neue', Arial, Helvetica, sans-serif; text-decoration: none; padding: 4px 10px; text-align: center; } .browser-print-mode { padding: 6px 10px; } .browser-print-mode:hover { background-color: #757570; cursor: pointer; }";
		printControlStyleSheet.innerHTML += " .leaflet-browser-print--custom, .leaflet-browser-print--custom path { cursor: crosshair!important; }";
		printControlStyleSheet.innerHTML += " .leaflet-print-overlay { width: 100%; height:auto; min-height: 100%; position: absolute; top: 0; background-color: white!important; left: 0; z-index: 1001; display: block!important; } ";
		printControlStyleSheet.innerHTML += " .leaflet--printing { height:auto; min-height: 100%; margin: 0px!important; padding: 0px!important; } body.leaflet--printing > * { display: none; box-sizing: border-box; }";
		printControlStyleSheet.innerHTML += " .grid-print-container { grid-template: 1fr / 1fr; box-sizing: border-box; } .grid-map-print { grid-row: 1; grid-column: 1; } body.leaflet--printing .grid-print-container [leaflet-browser-print-content]:not(style) { display: unset!important; }";
		printControlStyleSheet.innerHTML += " .pages-print-container { box-sizing: border-box; }";

        container.appendChild(printControlStyleSheet);
	},

	_setupManualPrintButton: function(map, origins, objects) {
		var manualPrintButton = document.createElement('button');
		manualPrintButton.className = "leaflet-browser-print--manualMode-button";
		manualPrintButton.innerHTML = "Print";
		manualPrintButton.style.position = "absolute";
		manualPrintButton.style.top = "20px";
		manualPrintButton.style.right = "20px";
		this.__overlay__.appendChild(manualPrintButton);

		var self = this;
		L.DomEvent.addListener(manualPrintButton, 'click', function () {
			self._completePrinting(map, origins, objects);
		});
	},

	_addPrintMapOverlay: function (pageSize, pageMargin, printSize, pageOrientation, origins) {
		this.__overlay__ = document.createElement("div");
		this.__overlay__.className = this._map.getContainer().className + " leaflet-print-overlay";
		document.body.appendChild(this.__overlay__);

		this.__overlay__.appendChild(this._addPrintCss(pageSize, pageMargin, pageOrientation));

		var gridContainer = document.createElement("div");
		gridContainer.className = "grid-print-container";
		gridContainer.style.width = "100%";
		gridContainer.style.display = "grid";
		this._setupPrintMapHeight(gridContainer, printSize, pageOrientation);

		if (this.options.contentSelector) {
			var content = document.querySelectorAll(this.options.contentSelector);
			if (content && content.length) {
				for (var i = 0; i < content.length; i++) {
					var printContentItem = content[i].cloneNode(true);
					gridContainer.appendChild(printContentItem);
				}
			}
		}

		var isMultipage = this.options.pagesSelector && document.querySelectorAll(this.options.pagesSelector).length;
		if (isMultipage) {
			var pagesContainer = document.createElement("div");
			pagesContainer.className = "pages-print-container";
			pagesContainer.style.margin = "0!important";
			this._setupPrintPagesWidth(pagesContainer, printSize, pageOrientation);

			this.__overlay__.appendChild(pagesContainer);
			pagesContainer.appendChild(gridContainer);

			var pages = document.querySelectorAll(this.options.pagesSelector);
			if (pages && pages.length) {
				for (var i = 0; i < pages.length; i++) {
					var printPageItem = pages[i].cloneNode(true);
					pagesContainer.appendChild(printPageItem);
				}
			}
		} else {
			this._setupPrintPagesWidth(gridContainer, printSize, pageOrientation);
			this.__overlay__.appendChild(gridContainer);
		}

		var overlayMapDom = document.createElement("div");
		overlayMapDom.id = this._map.getContainer().id + "-print";
		overlayMapDom.className = "grid-map-print";
		overlayMapDom.style.width = "100%";
		overlayMapDom.style.height = "100%";
		gridContainer.appendChild(overlayMapDom);

		document.body.className += " leaflet--printing";

		var newMapOptions = L.Control.BrowserPrint.Utils.cloneBasicOptionsWithoutLayers(this._map.options);
		newMapOptions.maxZoom = this._map.getMaxZoom();
		return this._setupPrintMap(overlayMapDom.id, newMapOptions, origins.printLayer, origins.printObjects, origins.panes);
	},

	_setupPrintMap: function (id, options, printLayer, printObjects, panes) {
		options.zoomControl = false;
		options.dragging = false;
		options.zoomAnimation = false;
		options.fadeAnimation = false;
		options.markerZoomAnimation = false;
		options.keyboard = false;
		options.scrollWheelZoom = false;
		options.tap = false;
		options.touchZoom = false;
		var overlayMap = L.map(id, options);

		if (printLayer) {
			printLayer.addTo(overlayMap);
		}

		panes.forEach(function(p) { overlayMap.createPane(p.name, p.container); });
		var clones = {};
		for (var type in printObjects){
			var closePopupsOnPrint = this.options.closePopupsOnPrint;
			var popupsToOpen = [];
			printObjects[type] = printObjects[type].map(function(pLayer){
				var clone = L.Control.BrowserPrint.Utils.cloneLayer(pLayer);

				if (clone) {
					/* Workaround for apropriate handling of popups. */
					if (pLayer instanceof L.Popup){
						if(!pLayer.isOpen) {
							pLayer.isOpen = function () { return this._isOpen; };
						}
						if (pLayer.isOpen() && !closePopupsOnPrint) {
							popupsToOpen.push({source: pLayer._source, popup: clone});
						}
					} else {
						clone.addTo(overlayMap);
					}

					clones[pLayer._leaflet_id] = clone;

					if (pLayer instanceof L.Layer) {
						var tooltip = pLayer.getTooltip();
						if (tooltip) {
							clone.bindTooltip(tooltip.getContent(), tooltip.options);
							if (pLayer.isTooltipOpen()) {
								clone.openTooltip(tooltip.getLatLng());
							}
						}
					}

					return clone;
				}
			});
		}

		for (var p = 0; p < popupsToOpen.length; p++) {
			var popupModel = popupsToOpen[p];
			if (popupModel.source) {
				var element = clones[popupModel.source._leaflet_id];
				if (element && element.bindPopup && element.openPopup) {
					clones[popupModel.source._leaflet_id].bindPopup(popupModel.popup).openPopup(popupModel.popup.getLatLng());
				}
			}
		}

		return {map: overlayMap, objects: printObjects};
	},

	// Get all layers that is tile layers and is still loading;
	_isTilesLoading: function(overlayMap){
		var isLoading = false;
		var mapMajorVersion = parseFloat(L.version);
		if (mapMajorVersion > 1) {
			isLoading = this._getLoadingLayers(overlayMap);
		} else {
			isLoading = overlayMap._tilesToLoad || overlayMap._tileLayersToLoad;
		}

		return isLoading;
	},

	_getLoadingLayers: function(map) {
		for (var l in map._layers) {
			var layer = map._layers[l];
			if ((layer._url || layer._mutant) && layer._loading) {
				return true;
			}
		}

		return false;
	}
});

L.Control.BrowserPrint.Event =  {
	PrintInit: 'browser-print-init',
	PrePrint: 'browser-pre-print',
	PrintStart: 'browser-print-start',
	Print: 'browser-print',
	PrintEnd: 'browser-print-end'
},

L.control.browserPrint = function(options) {
	if (!options || !options.printModes) {
		options = options || {};
		options.printModes = [
			L.control.browserPrint.mode.portrait(),
			L.control.browserPrint.mode.landscape(),
			L.control.browserPrint.mode.auto(),
			L.control.browserPrint.mode.custom()
		]
	}

	if (options && options.printModes && (!options.printModes.filter || !options.printModes.length)) {
		throw "Please specify valid print modes for Print action. Example: printModes: [L.control.browserPrint.mode.portrait(), L.control.browserPrint.mode.auto('Automatico'), 'Custom']";
	}

	if (options.printModesNames) {
		console.warn("'printModesNames' option is obsolete. Please use 'L.control.browserPrint.mode.*(/*Title*/)' shortcut instead. Please check latest release and documentation.");
	}

	return new L.Control.BrowserPrint(options);
};



/***/ }),

/***/ "./src/leaflet.browser.print.sizes.js":
/*!********************************************!*\
  !*** ./src/leaflet.browser.print.sizes.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Igor Vladyka <igor.vladyka@gmail.com> (https://github.com/Igor-Vladyka/leaflet.browser.print)
**/

/* Portrait mode sizes in mm for 0 lvl*/
L.Control.BrowserPrint.Size =  {
	A: {
		Width: 840,
		Height: 1188
	},
	B: {
		Width: 1000,
		Height: 1414
	},
	C: {
		Width: 916,
		Height: 1296
	},
	D: {
		Width: 770,
		Height: 1090
	},
	LETTER: {
		Width: 216,
		Height: 279
	},
	HALFLETTER: {
		Width: 140,
		Height: 216
	},
	LEGAL: {
		Width: 216,
		Height: 356
	},
	JUNIORLEGAL: {
		Width: 127,
		Height: 203
	},
	TABLOID: {
		Width: 279,
		Height: 432
	},
	LEDGER: {
		Width: 432,
		Height: 279
	}
};

L.Control.BrowserPrint.Mode = function(mode, title, pageSize, action, invalidateBounds) {
	if (!mode) {
		throw 'Print mode should be specified.';
	}

	this.Mode = mode;
	this.Title = title || mode;
	this.PageSize = (pageSize || 'A4').toUpperCase();
	this.PageSeries = ["A", "B", "C", "D"].indexOf(this.PageSize[0]) != -1 ? this.PageSize[0] : "";
	this.PageSeriesSize = this.PageSize.substring(this.PageSeries.length);
	this.Action = action || function(context, element) {
		return function() {
			context['_print' + element.Mode](element);
		};
	};
	this.InvalidateBounds = invalidateBounds;
};

L.Control.BrowserPrint.Mode.Landscape = "Landscape";
L.Control.BrowserPrint.Mode.Portrait = "Portrait";
L.Control.BrowserPrint.Mode.Auto = "Auto";
L.Control.BrowserPrint.Mode.Custom = "Custom";

L.Control.BrowserPrint.Mode.prototype.getPageMargin = function(type) {
	var size = this.getPaperSize();
	var marginInMm = ((size.Width + size.Height) / 39.9);
	var result;

	switch (type) {
		case "mm":
			result = marginInMm.toFixed(2) + "mm";
			break;
		case "in":
			result = (marginInMm / 25.4).toFixed(2) + "in";
			break;
		default:
			result = marginInMm;
			break;

	}
	return result;
};

L.Control.BrowserPrint.Mode.prototype.getPaperSize = function(){
	if (this.PageSeries) {
		var series = L.Control.BrowserPrint.Size[this.PageSeries];
		var w = series.Width;
		var h = series.Height;
		var switchSides = false;
		if (this.PageSeriesSize) {
			this.PageSeriesSize = +this.PageSeriesSize;
			switchSides = this.PageSeriesSize % 2 === 1;
			if (switchSides) {
				w = w / (this.PageSeriesSize - 1 || 1);
				h = h / (this.PageSeriesSize + 1);
			} else {
				w = w / this.PageSeriesSize;
				h = h / this.PageSeriesSize;
			}
		}

		return {
			Width: switchSides ? h : w,
			Height: switchSides ? w : h
		};
	} else {
		var size = L.Control.BrowserPrint.Size[this.PageSeriesSize];
		return {
			Width: size.Width,
			Height: size.Height
		};
	}
};

L.Control.BrowserPrint.Mode.prototype.getSize = function(){
	var size = this.getPaperSize();
	var margin = this.getPageMargin() * 2 * (window.devicePixelRatio || 1);

	size.Width = Math.floor(size.Width - margin) + 'mm';
	size.Height = Math.floor(size.Height - margin) + 'mm';

	return size;
};

L.control.browserPrint.mode = function(mode, title, type, action, invalidateBounds){
	return new L.Control.BrowserPrint.Mode(mode, title, type, action, invalidateBounds);
}

L.control.browserPrint.mode.portrait = function(title, pageSize, action) {
	return L.control.browserPrint.mode(L.Control.BrowserPrint.Mode.Portrait, title, pageSize, action, false);
};

L.control.browserPrint.mode.landscape = function(title, pageSize, action) {
	return L.control.browserPrint.mode(L.Control.BrowserPrint.Mode.Landscape, title, pageSize, action, false);
};

L.control.browserPrint.mode.auto = function(title, pageSize, action) {
	return L.control.browserPrint.mode(L.Control.BrowserPrint.Mode.Auto, title, pageSize, action, true);
};

L.control.browserPrint.mode.custom = function(title, pageSize, action) {
	return L.control.browserPrint.mode(L.Control.BrowserPrint.Mode.Custom, title, pageSize, action, true);
};



/***/ }),

/***/ "./src/leaflet.browser.print.utils.js":
/*!********************************************!*\
  !*** ./src/leaflet.browser.print.utils.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Igor Vladyka <igor.vladyka@gmail.com> (https://github.com/Igor-Vladyka/leaflet.browser.print)
**/

L.Control.BrowserPrint.Utils = {

	_ignoreArray: [],

	_cloneFactoryArray: [],
	_cloneRendererArray: [],
	_knownRenderers: {},

	cloneOptions: function(options) {
		var utils = this;
	    var retOptions = {};
	    for (var name in options) {
	        var item = options[name];
			if (item && item.clone) {
				retOptions[name] = item.clone();
			} else if (item && item.onAdd) {
				retOptions[name] = utils.cloneLayer(item);
			} else {
				retOptions[name] = item;
			}
	    }
	    return retOptions;
	},

	cloneBasicOptionsWithoutLayers: function(options) {
	    var retOptions = {};
		var optionNames = Object.getOwnPropertyNames(options);
		if (optionNames.length) {
			for (var i = 0; i < optionNames.length; i++) {
				var optName = optionNames[i];
				if (optName && optName != "layers") {
			        retOptions[optName] = options[optName];
				}
			}

		    return this.cloneOptions(retOptions);
		}

		return retOptions;
	},

	cloneInnerLayers: function (layer) {
		var utils = this;
		var layers = [];

		layer.eachLayer(function (inner) {
			var l = utils.cloneLayer(inner);

			if (l) {
				layers.push(l);
			}
		});

		return layers;
	},

	initialize: function () {

		this._knownRenderers = {};

		// Renderers
		this.registerRenderer(L.SVG, 'L.SVG');
		this.registerRenderer(L.Canvas, 'L.Canvas');

		this.registerLayer(L.TileLayer.WMS, 'L.TileLayer.WMS', function(layer, utils) { 	return L.tileLayer.wms(layer._url, utils.cloneOptions(layer.options)); });
		this.registerLayer(L.TileLayer, 'L.TileLayer', function(layer, utils) { 			return L.tileLayer(layer._url, utils.cloneOptions(layer.options)); });
		this.registerLayer(L.GridLayer, 'L.GridLayer', function(layer, utils) { 			return L.gridLayer(utils.cloneOptions(layer.options)); });
		this.registerLayer(L.ImageOverlay, 'L.ImageOverlay', function(layer, utils) { 		return L.imageOverlay(layer._url, layer._bounds, utils.cloneOptions(layer.options)); });
		this.registerLayer(L.Marker, 'L.Marker', function(layer, utils) { 					return L.marker(layer.getLatLng(), utils.cloneOptions(layer.options)); });
		this.registerLayer(L.Popup, 'L.Popup', function(layer, utils) { 					return L.popup(utils.cloneOptions(layer.options)).setLatLng(layer.getLatLng()).setContent(layer.getContent()); });
		this.registerLayer(L.Circle, 'L.Circle', function(layer, utils) { 					return L.circle(layer.getLatLng(), layer.getRadius(), utils.cloneOptions(layer.options)); });
		this.registerLayer(L.CircleMarker, 'L.CircleMarker', function(layer, utils) { 		return L.circleMarker(layer.getLatLng(), utils.cloneOptions(layer.options)); });
		this.registerLayer(L.Rectangle, 'L.Rectangle', function(layer, utils) { 			return L.rectangle(layer.getBounds(), utils.cloneOptions(layer.options)); });
		this.registerLayer(L.Polygon, 'L.Polygon', function(layer, utils) { 				return L.polygon(layer.getLatLngs(), utils.cloneOptions(layer.options)); });

		// MultiPolyline is removed in leaflet 1.0.0
		this.registerLayer(L.MultiPolyline, 'L.MultiPolyline', function(layer, utils) { 	return L.polyline(layer.getLatLngs(), utils.cloneOptions(layer.options)); });
		// MultiPolygon is removed in leaflet 1.0.0
		this.registerLayer(L.MultiPolygon, 'L.MultiPolygon', function(layer, utils) { 		return L.multiPolygon(layer.getLatLngs(), utils.cloneOptions(layer.options)); });

		this.registerLayer(L.Polyline, 'L.Polyline', function(layer, utils) { 				return L.polyline(layer.getLatLngs(), utils.cloneOptions(layer.options)); });
		this.registerLayer(L.GeoJSON, 'L.GeoJSON', function(layer, utils) { 				return L.geoJson(layer.toGeoJSON(), utils.cloneOptions(layer.options)); });

		this.registerIgnoreLayer(L.FeatureGroup, 'L.FeatureGroup');
		this.registerIgnoreLayer(L.LayerGroup, 'L.LayerGroup');

		// There is no point to clone tooltips here;  L.tooltip(options);
		this.registerLayer(L.Tooltip, 'L.Tooltip', function(){	return null; });
	},

	_register: function(array, type, identifier, builderFunction) {
		if (type &&
			!array.filter(function(l){ return l.identifier === identifier; }).length) {

			array.push({
				type: type,
				identifier: identifier,
				builder: builderFunction || function (layer) { return new type(layer.options); }
			});
		}
	},

	registerLayer: function(type, identifier, builderFunction) {
		this._register(this._cloneFactoryArray, type, identifier, builderFunction);
	},

	registerRenderer: function(type, identifier, builderFunction) {
		this._register(this._cloneRendererArray, type, identifier, builderFunction);
	},

	registerIgnoreLayer: function(type, identifier) {
		this._register(this._ignoreArray, type, identifier);
	},

	cloneLayer: function(layer) {
		if (!layer) return null;

		// First we check if this layer is actual renderer
		var renderer = this.__getRenderer(layer);
		if (renderer) {
			return renderer;
		}

		var factoryObject;
		if (layer._group) { // Exceptional check for L.MarkerClusterGroup
			factoryObject = this.__getFactoryObject(layer._group, true);
		} else {
			factoryObject = this.__getFactoryObject(layer);
		}

		// We clone and recreate layer if it's simple overlay
		if (factoryObject) {
			factoryObject = factoryObject.builder(layer, this);
		}

		return factoryObject;
	},

	getType: function(layer) {
		if (!layer) return null;

		var factoryObject = this.__getFactoryObject(layer);
		if (factoryObject) {
			factoryObject = factoryObject.identifier;
		}

		return factoryObject;
	},

	__getRenderer: function(oldRenderer) {
		var renderer = this._knownRenderers[oldRenderer._leaflet_id];
		if (!renderer) {
			for (var i = 0; i < this._cloneRendererArray.length; i++) {
				var factoryObject = this._cloneRendererArray[i];
				if (oldRenderer instanceof factoryObject.type) {
					this._knownRenderers[oldRenderer._leaflet_id] = factoryObject.builder(oldRenderer.options);
					break;
				}
			}

			renderer = this._knownRenderers[oldRenderer._leaflet_id];
		}

		return renderer;
	},

	__getFactoryObject: function (layer, skipIgnore) {
		if (!skipIgnore) {
			for (var i = 0; i < this._ignoreArray.length; i++) {
				var ignoreObject = this._ignoreArray[i];
				if (ignoreObject.type && layer instanceof ignoreObject.type) {
					return null;
				}
			}
		}

		for (var i = 0; i < this._cloneFactoryArray.length; i++) {
			var factoryObject = this._cloneFactoryArray[i];
			if (factoryObject.type && layer instanceof factoryObject.type) {
				return factoryObject;
			}
		}

		for (var i = 0; i < this._cloneRendererArray.length; i++) {
			var factoryObject = this._cloneRendererArray[i];
			if (factoryObject.type && layer instanceof factoryObject.type) {
				return null;
			}
		}

		this.__unknownLayer__();

		return null;
	},

	__unknownLayer__: function(){
	   console.warn('Unknown layer, cannot clone this layer. Leaflet version: ' + L.version);
	   console.info('For additional information please refer to documentation on: https://github.com/Igor-Vladyka/leaflet.browser.print.');
	   console.info('-------------------------------------------------------------------------------------------------------------------');
   }
};



/***/ }),

/***/ 0:
/*!**********************************************************************************************************************!*\
  !*** multi ./src/leaflet.browser.print.js ./src/leaflet.browser.print.utils.js ./src/leaflet.browser.print.sizes.js ***!
  \**********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! ./src/leaflet.browser.print.js */"./src/leaflet.browser.print.js");
__webpack_require__(/*! ./src/leaflet.browser.print.utils.js */"./src/leaflet.browser.print.utils.js");
module.exports = __webpack_require__(/*! ./src/leaflet.browser.print.sizes.js */"./src/leaflet.browser.print.sizes.js");



/***/ })

/******/ });