/*
 (c) 2014, Vladimir Agafonkin
 simpleheat, a tiny JavaScript library for drawing heatmaps with Canvas
 https://github.com/mourner/simpleheat
*/
!function() {
  "use strict";

  function t(i) {
    if (!(this instanceof t)) {
      return new t(i);
    }
    
    this._canvas = i = typeof i === "string" ? document.getElementById(i) : i;
    //this._ctx = i.getContext("2d");
	this._ctx = i.getContext('2d', { willReadFrequently: true });
    this._width = i.width;
    this._height = i.height;
    this._max = 1;
    this.clear();
  }

  t.prototype = {
    defaultRadius: 25,
    defaultGradient: {
      0.4: "blue",
      0.6: "cyan",
      0.7: "lime",
      0.8: "yellow",
      1: "red"
    },

    data: function(t, i) {
      this._data = t;
      return this;
    },

    max: function(t) {
      this._max = t;
      return this;
    },

    add: function(t) {
      this._data.push(t);
      return this;
    },

    clear: function() {
      this._data = [];
      return this;
    },

    radius: function(t, i) {
      i = i || 15;
      var a = this._circle = document.createElement("canvas"),
          s = a.getContext("2d"),
          e = this._r = t + i;

      a.width = a.height = 2 * e;
      s.shadowOffsetX = s.shadowOffsetY = 200;
      s.shadowBlur = i;
      s.shadowColor = "black";
      s.beginPath();
      s.arc(e - 200, e - 200, t, 0, 2 * Math.PI, true);
      s.closePath();
      s.fill();
      return this;
    },

    gradient: function(t) {
      var i = document.createElement("canvas"),
          a = i.getContext("2d"),
          s = a.createLinearGradient(0, 0, 0, 256);

      i.width = 1;
      i.height = 256;

      for (var e in t) {
        s.addColorStop(e, t[e]);
      }

      a.fillStyle = s;
      a.fillRect(0, 0, 1, 256);
      this._grad = a.getImageData(0, 0, 1, 256).data;
      return this;
    },

    draw: function(t) {
      this._circle || this.radius(this.defaultRadius);
      this._grad || this.gradient(this.defaultGradient);

      var i = this._ctx;
      i.clearRect(0, 0, this._width, this._height);

      for (var a, s = 0, e = this._data.length; e > s; s++) {
        a = this._data[s];
        i.globalAlpha = Math.max(a[2] / this._max, t || 0.05);
        i.drawImage(this._circle, a[0] - this._r, a[1] - this._r);
      }

      var n = i.getImageData(0, 0, this._width, this._height);
      this._colorize(n.data, this._grad);
      i.putImageData(n, 0, 0);
      return this;
    },

    _colorize: function(t, i) {
      for (var a, s = 3, e = t.length; e > s; s += 4) {
        a = 4 * t[s];
        if (a) {
          t[s - 3] = i[a];
          t[s - 2] = i[a + 1];
          t[s - 1] = i[a + 2];
        }
      }
    }
  };

  window.simpleheat = t;
}(),

/*
 (c) 2014, Vladimir Agafonkin
 Leaflet.heat, a tiny and fast heatmap plugin for Leaflet.
 https://github.com/Leaflet/Leaflet.heat
*/

L.HeatLayer = (L.Layer ? L.Layer : L.Class).extend({
    // Options par défaut
    options: {
        minOpacity: 0.05,
        maxZoom: 18,
        radius: 25,
        blur: 15,
        max: 1.0
    },

    initialize: function (latlngs, options) {
        this._latlngs = latlngs;
        this._processIntensities();
        L.setOptions(this, options);
    },
	   setLatLngs: function (latlngs) {
        this._latlngs = latlngs;
        return this.redraw();
    },

    addLatLng: function (latlng) {
        this._latlngs.push(latlng);
        return this.redraw();
    },

    setOptions: function (options) {
        L.setOptions(this, options);
        if (this._heat) {
            this._updateOptions();
        }
        return this.redraw();
    },
    
    getBounds: function () {
        return L.latLngBounds(this._latlngs);  
    },
    
    redraw: function () {
        if (this._heat && !this._frame && this._map && !this._map._animating) {
            this._frame = L.Util.requestAnimFrame(this._redraw, this);
        }
        return this;
    },	

    // Méthodes obligatoires de L.Layer
    onAdd: function (map) {
        this._map = map;

        if (!this._canvas) {
            this._initCanvas();
        }

        if (this.options.pane) {
            this.getPane().appendChild(this._canvas);
        } else {
            map._panes.overlayPane.appendChild(this._canvas);
        }

        map.on('moveend', this._reset, this);

        if (map.options.zoomAnimation && L.Browser.any3d) {
            map.on('zoomanim', this._animateZoom, this);
        }

        this._reset();
    },

    onRemove: function (map) {
        if (this.options.pane) {
            this.getPane().removeChild(this._canvas);
        } else {
            map.getPanes().overlayPane.removeChild(this._canvas);
        }

        map.off('moveend', this._reset, this);

        if (map.options.zoomAnimation) {
            map.off('zoomanim', this._animateZoom, this);
        }
    },

    /*_processIntensities: function() {
        let intensities = this._latlngs.map(latlng => 
            latlng.alt !== undefined ? latlng.alt : 
            latlng[2] !== undefined ? latlng[2] : 1
        );

        intensities.sort((a, b) => a - b);
        const len = intensities.length;
        this._quantiles = {
            q20: intensities[Math.floor(len * 0.2)],
            q40: intensities[Math.floor(len * 0.4)],
            q60: intensities[Math.floor(len * 0.6)],
            q80: intensities[Math.floor(len * 0.8)]
        };
    },*/
	_processIntensities: function() {
    let intensities = this._latlngs.map(latlng => 
        latlng.alt !== undefined ? latlng.alt : 
        latlng[2] !== undefined ? latlng[2] : 1
    );

    // console.log("Nombre total de points :", intensities.length);
    
    // Trier les intensités pour voir la distribution
    intensities.sort((a, b) => a - b);
    const len = intensities.length;
    
    this._quantiles = {
        q20: intensities[Math.floor(len * 0.2)],
        q40: intensities[Math.floor(len * 0.4)],
        q60: intensities[Math.floor(len * 0.6)],
        q80: intensities[Math.floor(len * 0.8)]
    };

    /*console.log("Distribution des points par zone :");
    console.log("0-20% des points :", intensities.slice(0, Math.floor(len * 0.2)));
    console.log("20-40% des points :", intensities.slice(Math.floor(len * 0.2), Math.floor(len * 0.4)));
    console.log("40-60% des points :", intensities.slice(Math.floor(len * 0.4), Math.floor(len * 0.6)));
    console.log("60-80% des points :", intensities.slice(Math.floor(len * 0.6), Math.floor(len * 0.8)));
    console.log("80-100% des points :", intensities.slice(Math.floor(len * 0.8)));
    console.log("Quantiles calculés :", this._quantiles);*/
},


    _getIntensityValue: function(rawValue) {
        if (rawValue <= this._quantiles.q20) {
            return 0.2 + (rawValue / this._quantiles.q20) * 0.2;
        } else if (rawValue <= this._quantiles.q40) {
            return 0.4 + ((rawValue - this._quantiles.q20) / (this._quantiles.q40 - this._quantiles.q20)) * 0.2;
        } else if (rawValue <= this._quantiles.q60) {
            return 0.6 + ((rawValue - this._quantiles.q40) / (this._quantiles.q60 - this._quantiles.q40)) * 0.2;
        } else if (rawValue <= this._quantiles.q80) {
            return 0.8 + ((rawValue - this._quantiles.q60) / (this._quantiles.q80 - this._quantiles.q60)) * 0.2;
        } else {
            return 1.0;
        }
    },

    _initCanvas: function () {
        var canvas = this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer leaflet-layer');

        var originProp = L.DomUtil.testProp(['transformOrigin', 'WebkitTransformOrigin', 'msTransformOrigin']);
        canvas.style[originProp] = '50% 50%';

        var size = this._map.getSize();
        canvas.width  = size.x;
        canvas.height = size.y;

        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

        this._heat = simpleheat(canvas);
        this._updateOptions();
    },

    _updateOptions: function () {
        this._heat.radius(this.options.radius || this._heat.defaultRadius, this.options.blur);

        if (this.options.gradient) {
            this._heat.gradient(this.options.gradient);
        }
        if (this.options.max) {
            this._heat.max(this.options.max);
        }
    },

    _reset: function () {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);

        var size = this._map.getSize();

        if (this._heat._width !== size.x) {
            this._canvas.width = this._heat._width  = size.x;
        }
        if (this._heat._height !== size.y) {
            this._canvas.height = this._heat._height = size.y;
        }

        this._redraw();
    },

    _redraw: function () {
        if (!this._map) {
            return;
        }
        var data = [],
            r = this._heat._r,
            size = this._map.getSize(),
            bounds = new L.Bounds(
                L.point([-r, -r]),
                size.add([r, r])),
            maxZoom = this.options.maxZoom === undefined ? this._map.getMaxZoom() : this.options.maxZoom,
            v = 1 / Math.pow(2, Math.max(0, Math.min(maxZoom - this._map.getZoom(), 12))),
            cellSize = r / 2,
            grid = [],
            panePos = this._map._getMapPanePos(),
            offsetX = panePos.x % cellSize,
            offsetY = panePos.y % cellSize,
            i, len, p, cell, x, y, j, len2;

        for (i = 0, len = this._latlngs.length; i < len; i++) {
            p = this._map.latLngToContainerPoint(this._latlngs[i]);
            if (bounds.contains(p)) {
                x = Math.floor((p.x - offsetX) / cellSize) + 2;
                y = Math.floor((p.y - offsetY) / cellSize) + 2;

                let rawIntensity = this._latlngs[i].alt !== undefined ? this._latlngs[i].alt :
                                 this._latlngs[i][2] !== undefined ? +this._latlngs[i][2] : 1;
                
                let k = this._getIntensityValue(rawIntensity) * v;

                grid[y] = grid[y] || [];
                cell = grid[y][x];

                if (!cell) {
                    grid[y][x] = [p.x, p.y, k];
                } else {
                    cell[0] = (cell[0] * cell[2] + p.x * k) / (cell[2] + k);
                    cell[1] = (cell[1] * cell[2] + p.y * k) / (cell[2] + k);
                    cell[2] += k;
                }
            }
        }

        for (i = 0, len = grid.length; i < len; i++) {
            if (grid[i]) {
                for (j = 0, len2 = grid[i].length; j < len2; j++) {
                    cell = grid[i][j];
                    if (cell) {
					//console.log("Position [" + i + "," + j + "]", "Nombre accidents:", Math.round(cell[2] * this.options.max), "Densité:", cell[2]);
                        data.push([
                            Math.round(cell[0]),
                            Math.round(cell[1]),
                            Math.min(cell[2], this.options.max || 1.0)
                        ]);
                    }
                }
            }
        }

        this._heat.data(data).draw(this.options.minOpacity || 0.05);
        this._frame = null;
    },

    _animateZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom),
            offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

        if (L.DomUtil.setTransform) {
            L.DomUtil.setTransform(this._canvas, offset, scale);
        } else {
            this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
        }
    }
});

L.heatLayer = function (latlngs, options) {
    return new L.HeatLayer(latlngs, options);
};