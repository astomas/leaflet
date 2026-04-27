// 01/26 - modif TF du plugin original
// nlle syntaxe adaptée à nlle API Google Places et suppr. warning console (API plugin obsolete au 03/25)
(function () {
    L.GPlaceAutocomplete = {};
    // modif CD30 - var globale servira qd rech google en cours à désactiver le 'keydown' du service visu
    window.rechGoogleEnCours = false;

    L.Control.GPlaceAutocomplete = L.Control.extend({
        options: {
            position: "topright",
            prepend: true,
            collapsed_mode: false,
            placeholder: 'Rechercher un lieu...',
            autocomplete_options: {}
        },

        collapsedModeIsExpanded: true,
        icon: null,
        searchWrapper: null,
        placeAutocomplete: null,

        initialize: function (options) {
            if (options) {
                L.Util.setOptions(this, options);
            }
            if (!this.options.callback) {
                this.options.callback = this.onLocationComplete;
            }
            this._buildContainer();
        },

        _buildContainer: function () {
            this.container = L.DomUtil.create("div", "leaflet-gac-container leaflet-bar");
            this.searchWrapper = L.DomUtil.create("div", "leaflet-gac-wrapper");

            // Options pour le constructeur PlaceAutocompleteElement
            var opts = this.options.autocomplete_options;
            var elementOptions = {
                requestedLanguage: 'fr'
            };
            
            // Restriction par pays (nouvelle syntaxe : includedRegionCodes)
            if (opts.componentRestrictions && opts.componentRestrictions.country) {
                elementOptions.includedRegionCodes = [opts.componentRestrictions.country.toUpperCase()];
            }
            
            // Location bias pour favoriser une zone géographique
            if (opts.bounds) {
                elementOptions.locationBias = opts.bounds;
            }

            // Créer le composant via le constructeur
            this.placeAutocomplete = new google.maps.places.PlaceAutocompleteElement(elementOptions);
            this.placeAutocomplete.className = 'leaflet-gac-control';

            if (this.options.collapsed_mode) {
                this.collapsedModeIsExpanded = false;
                this.icon = L.DomUtil.create("div", "leaflet-gac-search-btn");
                L.DomEvent.on(this.icon, "click", this._showSearchBar, this);
                this.icon.appendChild(L.DomUtil.create("div", "leaflet-gac-search-icon"));
                this.searchWrapper.appendChild(this.icon);
                L.DomUtil.addClass(this.placeAutocomplete, "leaflet-gac-hidden");
            }

            this.searchWrapper.appendChild(this.placeAutocomplete);
            this.container.appendChild(this.searchWrapper);
        },

        _showSearchBar: function () {
            this._toggleSearch(true);
        },

        _hideSearchBar: function () {
            if (this.collapsedModeIsExpanded) {
                this._toggleSearch(false);
            }
        },

        _toggleSearch: function (shouldDisplaySearch) {
            if (shouldDisplaySearch) {
                L.DomUtil.removeClass(this.placeAutocomplete, "leaflet-gac-hidden");
                L.DomUtil.addClass(this.icon, "leaflet-gac-hidden");
                var input = this.placeAutocomplete.querySelector('input');
                if (input) input.focus();
            } else {
                L.DomUtil.addClass(this.placeAutocomplete, "leaflet-gac-hidden");
                L.DomUtil.removeClass(this.icon, "leaflet-gac-hidden");
            }
            this.collapsedModeIsExpanded = shouldDisplaySearch;
            window.rechGoogleEnCours = shouldDisplaySearch;
        },

        onLocationComplete: function (place, map) {
            if (!place || !place.location) {
                alert("Location not found");
                return;
            }
            map.panTo([place.location.lat(), place.location.lng()]);
        },

        onAdd: function () {
            L.DomEvent.addListener(this.container, 'click', L.DomEvent.stop);
            L.DomEvent.disableClickPropagation(this.container);
            if (this.options.collapsed_mode) {
                this._map.on('dragstart click', this._hideSearchBar, this);
            }
            return this.container;
        },

        addTo: function (map) {
            this._map = map;
            var container = this._container = this.onAdd(map),
                pos = this.options.position,
                corner = map._controlCorners[pos];

            L.DomUtil.addClass(container, 'leaflet-control');
            if (this.options.prepend) {
                corner.insertBefore(container, corner.firstChild);
            } else {
                corner.appendChild(container);
            }

            var callback = this.options.callback;
            var _this = this;

            // Événement gmp-select (nouvelle API)
            this.placeAutocomplete.addEventListener('gmp-select', async (event) => {
                const placePrediction = event.placePrediction;
                const place = await placePrediction.toPlace();
                await place.fetchFields({ fields: ['location', 'displayName'] });
                callback(place, map);
            });


            return this;
        }
    });
})();