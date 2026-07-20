(function () {
  "use strict";

  // =========================================================================
  // Utilitaires internes
  // =========================================================================

  // Retourne l'élément DOM associé à un contrôle Leaflet.
  // Accepte un contrôle Leaflet (avec getContainer), un HTMLElement direct,
  // ou null — renvoie null si rien de valide n'est trouvé.
  function getControlElement(control) {
    if (!control) return null;
    if (typeof control.getContainer === "function") return control.getContainer();
    return control instanceof HTMLElement ? control : null;
  }

  // Met à jour le badge de comptage dans l'en-tête de la section "Outils carte".
  // Affiche "N outil(s)" ou "plugins" si le dock est vide.
  function updateToolsCount() {
    const dock  = document.getElementById("modernToolsDock");
    const count = document.getElementById("modernToolsCount");
    if (!dock || !count) return;

    const total = dock.querySelectorAll(".modern-tool-button").length;
    count.textContent = total > 0 ? `${total} outil${total > 1 ? "s" : ""}` : "plugins";
  }

  // =========================================================================
  // Intégration d'un contrôle dans le dock "Outils carte"
  // =========================================================================

  // Intègre l'élément DOM `el` dans le dock sous forme d'un bouton labelisé.
  // - Neutralise le positionnement Leaflet d'origine (float, position…)
  // - Crée une ligne .modern-tool-button avec icône + libellé
  // - Insère à `desiredIndex` si précisé, sinon en fin de liste
  // - Renvoie false si l'élément est absent ou déjà docké
  function dockElement(el, label, desiredIndex) {
    const dock = document.getElementById("modernToolsDock");
    if (!dock || !el || !label) return false;

    const key = label.toLowerCase().trim();

    // Évite les doublons : masque le contrôle original s'il est déjà docké
    if (dock.querySelector(`.modern-tool-button[data-tool-label="${CSS.escape(key)}"]`)) {
      el.style.display = "none";
      return true;
    }

    // Neutralise les styles de positionnement hérités de Leaflet
    el.dataset.modernDocked = "true";
    el.style.position = "static";
    el.style.margin   = "0";
    el.style.float    = "none";
    el.style.clear    = "none";

    // //// modif nouvelle UI - supprime les tooltips natifs, redondants avec le libellé visible ////
    el.removeAttribute("title");
    el.querySelectorAll("[title]").forEach(n => n.removeAttribute("title"));

    // //// modif nouvelle UI - input fichier (Importer) : neutralise le tooltip
    // navigateur "Aucun fichier sélectionné" en désactivant le survol de l'input ;
    // le clic est délégué au conteneur (le guard évite la boucle sur le click programmatique) ////
    const inputFichier = el.querySelector('input[type="file"]');
    if (inputFichier) {
      inputFichier.style.pointerEvents = "none";
      el.style.cursor = "pointer";
      el.addEventListener("click", function (e) {
        if (e.target === inputFichier) return;
        inputFichier.click();
      });
    }

    // Construction du bouton : slot icône + libellé texte
    const row  = document.createElement("div");
    row.className       = "modern-tool-button";
    row.dataset.toolLabel = key;

    const icon = document.createElement("span");
    icon.className = "modern-tool-icon-slot";

    const text = document.createElement("span");
    text.className   = "modern-tool-button-label";
    text.textContent = label;

    icon.appendChild(el);
    row.append(icon, text);

    // Délègue le clic sur le premier élément interactif du contrôle ; à défaut
    // (contrôle dont le conteneur est lui-même cliquable, ex. leaflet-ruler),
    // on déclenche le clic sur le contrôle lui-même. Le clic direct sur un
    // bouton/lien natif ou le contrôle est ignoré (handler natif déjà actif).
    // //// modif nouvelle UI - cible le premier élément interactif VISIBLE : GeoSearch
    // (Coord GPS) place son form caché (input + reset) avant le bouton <a> dans le DOM,
    // et cliquer un élément caché ne déclenchait rien. Si tout est caché (ex. panneau
    // Isochrone replié), on retombe sur le premier dans l'ordre du DOM comme avant ////
    row.addEventListener("click", function (event) {
      if (event.target.closest("button,a,input,[role='button'],.leaflet-control")) return;
      const candidats = el.querySelectorAll("a,button,input,[role='button']");
      let clickable = null;
      for (let i = 0; i < candidats.length; i++) {
        if (candidats[i].offsetParent !== null) { clickable = candidats[i]; break; }
      }
      if (!clickable) clickable = candidats[0] || el;
      clickable.click();
    });

    // Insertion à la position souhaitée ou en fin de liste
    const rows = Array.from(dock.querySelectorAll(":scope > .modern-tool-button"));
    if (Number.isInteger(desiredIndex) && rows[desiredIndex]) {
      dock.insertBefore(row, rows[desiredIndex]);
    } else {
      dock.appendChild(row);
    }

    updateToolsCount();
    return true;
  }

  // =========================================================================
  // API publique
  // =========================================================================

  // Recherche un contrôle Leaflet existant dans le DOM par mots-clés
  // (title, aria-label, className, textContent, innerHTML) et le docke.
  // options.terms  : tableau de termes de recherche alternatifs
  // options.position : index d'insertion dans le dock (optionnel)
  window.modernDockExistingControl = function (label, options) {
    const opts  = options || {};
    const terms = (opts.terms || [label]).map(t => String(t).toLowerCase());
    const controls = Array.from(document.querySelectorAll(".leaflet-control"));

    const control = controls.find(el => {
      // Ignore les contrôles déjà dockés ou dans les zones réservées
      if (el.dataset.modernDocked === "true") return false;
      if (el.closest("#modernToolsDock,#modernHeaderInfoDock,#modernHeaderHelpDock")) return false;

      const haystack = [
        el.getAttribute("title")      || "",
        el.getAttribute("aria-label") || "",
        el.className   || "",
        el.textContent || "",
        el.innerHTML   || ""
      ].join(" ").toLowerCase();

      return terms.some(term => haystack.includes(term));
    });

    return dockElement(control, label, opts.position);
  };

  // Docke un contrôle Leaflet dont on possède déjà la référence directe.
  window.modernDockSpecificControl = function (control, label) {
    dockElement(getControlElement(control), label);
  };

  // Docke le bouton "Exporter" (créé par export-couches.js via L.easyButton)
  // dans "Outils carte", en 2e position après "Importer".
  // Le bouton peut ne pas être encore rendu : on réessaie tant qu'il est absent
  // (dockElement est idempotent, les essais superflus sont sans effet).
  window.modernDockExporter = function (essaisRestants) {
    var ok = window.modernDockExistingControl("Exporter", {
      terms: ["export", "arrow-up-from-bracket", "fa-arrow-up-from-bracket"],
      position: 1
    });
    if (ok) return true;
    var n = (typeof essaisRestants === "number") ? essaisRestants : 10;
    if (n > 0) setTimeout(function () { window.modernDockExporter(n - 1); }, 200);
    return false;
  };

  // =========================================================================
  // Resizer : redimensionnement horizontal de la sidebar par drag
  // =========================================================================

  // Initialise la barre de séparation draggable entre la sidebar et la carte.
  // - Drag (pointerdown/move/up) : ajuste --modern-sidebar-width en live
  // - Persistance : la largeur est sauvegardée dans localStorage
  // - Double-clic : remet la largeur par défaut définie dans le CSS
  // - Fin de drag : notifie Leaflet pour recalculer la taille de la carte
  function setupSidebarResizer() {
    var resizer     = document.querySelector(".modern-sidebar-resizer");
    var mainContent = document.querySelector(".modern-main-content");
    if (!resizer || !mainContent) return;

    var MIN_WIDTH = 200;  // largeur minimale en px
    var MAX_WIDTH = 560;  // largeur maximale en px

    // Clé de persistance propre à chaque carte (basée sur l'URL de la page),
    // pour que la largeur soit mémorisée indépendamment d'une carte à l'autre.
    var CLE_LARGEUR = "modernSidebarWidth:" + location.pathname;

    // Restaure la largeur sauvegardée lors de la session précédente
    try {
      var saved = parseInt(localStorage.getItem(CLE_LARGEUR) || "", 10);
      if (isFinite(saved) && saved >= MIN_WIDTH && saved <= MAX_WIDTH) {
        mainContent.style.setProperty("--modern-sidebar-width", saved + "px");
      }
    } catch (_) { /* localStorage indisponible (navigation privée) */ }

    var dragging     = false;
    var pendingWidth = null;

    // Mise à jour de la largeur en temps réel pendant le déplacement
    function onPointerMove(e) {
      if (!dragging) return;
      var rect = mainContent.getBoundingClientRect();
      var next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX - rect.left));
      pendingWidth = next;
      mainContent.style.setProperty("--modern-sidebar-width", next + "px");
    }

    // Fin du drag : nettoyage, sauvegarde, redessinage de la carte
    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("is-resizing");
      resizer.classList.remove("is-dragging");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (pendingWidth != null) {
        try { localStorage.setItem(CLE_LARGEUR, Math.round(pendingWidth)); } catch (_) {}
      }
      // Demande à Leaflet de recalculer les dimensions de la carte
      var mapContainer = document.getElementById("carteId");
      if (mapContainer && mapContainer._leaflet_map) {
        mapContainer._leaflet_map.invalidateSize();
      }
    }

    // Démarrage du drag
    resizer.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      dragging     = true;
      pendingWidth = null;
      document.body.classList.add("is-resizing");
      resizer.classList.add("is-dragging");
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    });

    // Double-clic : retour à la largeur par défaut du CSS
    resizer.addEventListener("dblclick", function () {
      mainContent.style.removeProperty("--modern-sidebar-width");
      try { localStorage.removeItem(CLE_LARGEUR); } catch (_) {}
      var mapContainer = document.getElementById("carteId");
      if (mapContainer && mapContainer._leaflet_map) {
        mapContainer._leaflet_map.invalidateSize();
      }
    });
  }

  // =========================================================================
  // Titre : injection immédiate de valeurTitre1 dans le h1 du header
  // =========================================================================

  // Évite le flash du placeholder "valeurTitre1" visible brièvement au
  // chargement. Le CSS masque le h1 (opacity:0) et on l'affiche ici dès
  // que la variable JS est disponible, avant le premier rendu visible.
  function setupTitre() {
    var h1 = document.querySelector(".modern-header h1");
    if (!h1) return;
    if (typeof valeurTitre1 !== "undefined") {
      h1.innerHTML = valeurTitre1;
    }
    h1.style.opacity = "1";
  }

  // =========================================================================
  // Accordéon : expand / collapse des sections de la sidebar
  // =========================================================================

  // Rend chaque section .modern-family rétractable au clic sur son titre.
  // L'état ouvert/fermé est porté par l'attribut data-expanded sur la section,
  // ce qui permet au CSS de masquer/afficher le corps via un simple sélecteur
  // d'attribut sans JS supplémentaire.
  function setupAccordion() {
    // [cd30] Sections fixes : toujours ouvertes, pas de repli au clic sur le titre.
    document.querySelectorAll(".modern-family").forEach(function (section) {
      section.dataset.expanded = "true";
    });
  }

  // =========================================================================
  // Badge "Données métier" : remplace le texte statique par le nom de couche
  // =========================================================================

  // Injecte le(s) nom(s) de couche issus de nomVues dans le badge <em>
  // de la section "Données métier", évitant de le coder en dur dans le HTML.
  function setupBadgeMetier() {
    var badge = document.querySelector(".modern-family-metier .modern-family-title em");
    if (!badge) return;
    if (typeof nomVues !== "undefined" && nomVues.length) {
      badge.textContent = nomVues.length + (nomVues.length > 1 ? " couches" : " couche");
    }
  }

  // =========================================================================
  // Fonds de plan : déplace les boutons radio des fonds de carte (générés par
  // le contrôle Leaflet en haut à droite) dans la section "Fonds de plan"
  // de la sidebar. Appelée depuis main() une fois le contrôle créé.
  // =========================================================================

  // API publique : relocalise le bloc .leaflet-control-layers-base dans la
  // section .modern-family-fonds-plan. Idempotente (ne déplace qu'une fois) et
  // dotée d'un filet de retry si le contrôle n'est pas encore prêt.
  window.modernDockFondsDePlan = function (essaisRestants) {
    var section = document.querySelector(".modern-family-fonds-plan");
    var base    = document.querySelector(".leaflet-control-layers-base");

    // Contrôle pas encore créé : on retente quelques fois
    if (!section || !base) {
      var n = (typeof essaisRestants === "number") ? essaisRestants : 10;
      if (n > 0) setTimeout(function () { window.modernDockFondsDePlan(n - 1); }, 200);
      return false;
    }

    // Déjà déplacé : rien à faire
    if (base.dataset.modernMoved === "true") return true;
    base.dataset.modernMoved = "true";

    // Masque le texte descriptif statique de la section
    var intro = section.querySelector("p");
    if (intro) intro.style.display = "none";

    // Nettoie le contrôle d'origine : séparateur orphelin + contrôle vide
    var control = base.closest(".leaflet-control-layers");
    if (control) {
      var sep = control.querySelector(".leaflet-control-layers-separator");
      if (sep) sep.style.display = "none";
      var overlays = control.querySelector(".leaflet-control-layers-overlays");
      if (!overlays || !overlays.children.length) control.style.display = "none";
    }

    // Déplace le bloc des radios dans la sidebar (devient enfant de la section,
    // donc soumis à l'accordéon expand/collapse)
    base.classList.add("modern-fonds-plan");
    section.appendChild(base);

    // [cd30] Les pastilles sont remplacées par une liste déroulante.
    // Les radios natifs restent dans le DOM (masqués) : ils pilotent la carte.
    base.style.display = "none";
    var select = document.createElement("select");
    select.className = "modern-fonds-select";
    // Les radios sont RECONSTRUITS par Leaflet à chaque layeradd/layerremove
    // (_update) : toujours les requêter au moment de l'usage, jamais les cacher.
    function radiosActuels() {
      return Array.prototype.slice.call(base.querySelectorAll("input"));
    }
    var radios = radiosActuels();
    radios.forEach(function (r, i) {
      var opt = document.createElement("option");
      var lbl = r.nextElementSibling;
      opt.value = String(i);
      opt.textContent = (lbl ? lbl.textContent : "Fond " + (i + 1)).trim();
      if (r.checked) opt.selected = true;
      select.appendChild(opt);
    });
    var optBlanc = document.createElement("option");
    optBlanc.value = "__blanc__";
    optBlanc.textContent = "Fond blanc";
    select.appendChild(optBlanc);

    // Fond blanc = retire les couches tuiles de la carte + fond de conteneur blanc
    function retirerFond() {
      var map = window.maCarte;
      if (!map) return;
      Object.keys(map._layers).forEach(function (k) {
        var ly = map._layers[k];
        if (ly instanceof L.GridLayer || ly instanceof L.TileLayer) map.removeLayer(ly);
      });
      map.getContainer().classList.add("fond-blanc");
    }
    select.addEventListener("change", function () {
      if (select.value === "__blanc__") { retirerFond(); return; }
      var map = window.maCarte;
      if (map) map.getContainer().classList.remove("fond-blanc");
      var r = radiosActuels()[Number(select.value)];
      if (r) r.click();
    });
    section.appendChild(select);

    // [cd30] Impression : recopie le fond blanc sur la carte d'impression
    // (le plugin browser.print crée un conteneur neuf, sans la classe).
    if (window.maCarte && window.maCarte.on) {
      window.maCarte.on("browser-print-start", function (e) {
        if (e.printMap && window.maCarte.getContainer().classList.contains("fond-blanc")) {
          e.printMap.getContainer().classList.add("fond-blanc");
        }
      });
    }

    // Si le fond change par ailleurs (code carte), resynchronise la liste
    if (window.maCarte && window.maCarte.on) {
      window.maCarte.on("baselayerchange", function () {
        var rs = radiosActuels();
        for (var i = 0; i < rs.length; i++) {
          if (rs[i].checked) { select.value = String(i); break; }
        }
      });
    }

    // Met à jour le badge <em> avec le nombre de fonds (y compris fond blanc)
    var badge = section.querySelector(".modern-family-title em");
    var nb = select.options.length;
    if (badge && nb) badge.textContent = nb + (nb > 1 ? " fonds" : " fond");

    // Place la section "Fonds de plan" juste sous "Données métier"
    var business = document.querySelector(".modern-family-metier");
    if (business && business.parentNode) business.after(section);

    return true;
  };

  // =========================================================================
  // Données métier : déplace les cases à cocher des couches métier (générées
  // par le contrôle Leaflet en haut à droite) dans la section "Données métier"
  // de la sidebar. Miroir de modernDockFondsDePlan pour le bloc overlays.
  // =========================================================================

  // API publique : relocalise le bloc .leaflet-control-layers-overlays dans la
  // section .modern-family-metier. Idempotente (ne déplace qu'une fois) et
  // dotée d'un filet de retry si le contrôle n'est pas encore prêt.
  window.modernDockDonneesMetier = function (essaisRestants) {
    var section  = document.querySelector(".modern-family-metier");
    var overlays = document.querySelector(".leaflet-control-layers-overlays");

    // Contrôle pas encore créé : on retente quelques fois
    if (!section || !overlays) {
      var n = (typeof essaisRestants === "number") ? essaisRestants : 10;
      if (n > 0) setTimeout(function () { window.modernDockDonneesMetier(n - 1); }, 200);
      return false;
    }

    // Déjà déplacé : rien à faire
    if (overlays.dataset.modernMoved === "true") return true;
    overlays.dataset.modernMoved = "true";

    // Référence du conteneur d'origine AVANT de sortir le bloc overlays
    var control = overlays.closest(".leaflet-control-layers");

    // Masque le texte descriptif statique de la section
    var intro = section.querySelector("p");
    if (intro) intro.style.display = "none";

    // Déplace le bloc des cases à cocher dans la sidebar (devient enfant de la
    // section, donc soumis à l'accordéon expand/collapse)
    overlays.classList.add("modern-donnees-metier");
    section.appendChild(overlays);

    // Conteneur d'origine vidé (radios + cases relocalisés) : on le masque
    if (control) {
      var sep = control.querySelector(".leaflet-control-layers-separator");
      if (sep) sep.style.display = "none";
      control.style.display = "none";
    }

    // [cd30] Injection des items légende dans la sidebar DÉSACTIVÉE :
    // la légende vit dans son bloc initial en bas à droite de la carte.
    // Les cases natives de la sidebar basculent les couches entières (comportement Leaflet d'origine).
    // injecterLegende(overlays);

    return true;
  };

  // Injecte les éléments de légende sous chaque label de couche dans la sidebar.
  // Réutilise L.control.Legend (rendu canvas + toggle map.addLayer/removeLayer)
  // plutôt qu'un rendu statique. Chaque couche obtient son propre contrôle légende
  // dont le container DOM est injecté directement dans la sidebar.
  function injecterLegende(overlays) {
    var data = window.modernLegendeParCouche;
    var map  = window.maCarte;
    if (!data || !map || typeof L === "undefined" || !L.control || !L.control.Legend) return;

    overlays.querySelectorAll("label").forEach(function (label) {
      var span = label.querySelector("span");
      if (!span) return;

      // Nom de couche = libellé sidebar sans le suffixe compteur " (N)"
      var nomCouche = (span.textContent || "").replace(/\s*\(\d+\)\s*$/, "").trim();
      var items = data[nomCouche];
      if (!items || items.length === 0) return;

      // Crée un vrai contrôle légende pour cette couche
      var ctrl = L.control.Legend({
        legends:      items,
        collapsed:    false,
        title:        null,
        symbolWidth:  18,
        symbolHeight: 18,
        column:       1
      });

      // onAdd(map) initialise _map (requis par _toggleLegend) et retourne le container DOM
      var container = ctrl.onAdd(map);
      container.classList.add("detail-couches-sidebar");

      // Nettoie les éléments inutiles en sidebar (lien repli, titre vide)
      var toggle = container.querySelector(".leaflet-legend-toggle");
      if (toggle) toggle.remove();
      var titre = container.querySelector(".leaflet-legend-title");
      if (titre) titre.remove();

      label.insertAdjacentElement("afterend", container);

      // Chevron de repli/dépli du détail légende, ajouté à gauche du libellé.
      // Le clic est neutralisé (preventDefault/stopPropagation) pour ne pas
      // basculer la visibilité de la couche (action de la case/œil).
      var chevron = document.createElement("span");
      chevron.className = "detail-couches-toggle";
      chevron.setAttribute("role", "button");
      chevron.setAttribute("aria-label", "Replier ou déplier le détail");
      chevron.textContent = "▾";

      var rangee = label.querySelector(":scope > span");
      if (rangee) rangee.insertBefore(chevron, rangee.firstChild);

      chevron.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        container.removeAttribute("data-collapsed-init"); // l'utilisateur prend la main
        var replie = container.classList.toggle("collapsed");
        chevron.classList.toggle("collapsed", replie);
      });

      // === Œil = maître de visibilité de la couche, piloté sur System B ===
      // System B = layerGroups de légende (tabCouchesLGLeg) — ce qui est
      // réellement affiché. map.hasLayer() est la seule source de vérité.
      var caseOeil = label.querySelector('input[type="checkbox"]');
      var itemsAvecLayers = items.filter(function (it) { return it.layers; });

      // Vrai si au moins un layerGroup de cette couche est sur la carte.
      var unItemActif = function () {
        return itemsAvecLayers.some(function (it) { return map.hasLayer(it.layers); });
      };

      // Coche/décoche l'icône œil via une classe sur le label — PAS via la case
      // native : une case cochée serait resynchronisée par le contrôle Leaflet
      // (_onInputClick) au moindre clic dans le contrôle, qui rajouterait alors
      // la copie System A (doublon geoJson) sur la carte. La case reste donc
      // toujours décochée pour neutraliser définitivement System A.
      var majOeil = function () {
        if (caseOeil) caseOeil.checked = false;
        label.classList.toggle("modern-couche-active", unItemActif());
      };

      // Synchronise les classes DOM d'inactivité avec l'état réel de la carte.
      // Appariement par ordre : item[k] avec layers ↔ k-ième div cliquable du plugin.
      var syncClasses = function () {
        var divsClic = container.querySelectorAll(".leaflet-legend-item-clickable");
        var idx = 0;
        itemsAvecLayers.forEach(function (it) {
          var div = divsClic[idx++];
          if (!div) return;
          if (map.hasLayer(it.layers)) {
            div.classList.remove("leaflet-legend-item-inactive");
          } else {
            div.classList.add("leaflet-legend-item-inactive");
          }
        });
      };

      // Allume ou éteint tous les layerGroups de la couche d'un coup.
      var basculerTousItems = function (actif) {
        itemsAvecLayers.forEach(function (it) {
          if (actif && !map.hasLayer(it.layers)) map.addLayer(it.layers);
          else if (!actif && map.hasLayer(it.layers)) map.removeLayer(it.layers);
        });
        syncClasses();
        majOeil();
      };

      // Clic œil : tout allumer si rien d'actif, tout éteindre sinon.
      // Si la couche était repliée à l'init (data-collapsed-init), on la déplie
      // à la première activation — une seule fois, le flag est ensuite retiré.
      // preventDefault neutralise la case native (pas de doublon System A).
      label.addEventListener("click", function (event) {
        if (event.target.closest(".detail-couches-toggle")) return;
        event.preventDefault();
        var doitActiver = !unItemActif();
        basculerTousItems(doitActiver);
        if (doitActiver && container.hasAttribute("data-collapsed-init")) {
          container.removeAttribute("data-collapsed-init");
          container.classList.remove("collapsed");
          chevron.classList.remove("collapsed");
        }
      });

      // Clic item individuel : le plugin bascule layers + classe ; on recolore
      // ensuite l'œil. On écoute le clic sur le container (une fois par clic
      // utilisateur) plutôt que layeradd/layerremove qui se déclenche pour
      // chaque enfant du layerGroup (758 fois pour le réseau routier → lag).
      container.addEventListener("click", function (event) {
        if (!event.target.closest(".leaflet-legend-item-clickable")) return;
        setTimeout(majOeil, 0);
      });

      // Alignement initial de l'œil + repli si aucun item actif à l'ouverture.
      // Le flag data-collapsed-init permet au clic œil de déplier une seule fois.
      majOeil();
      if (!unItemActif()) {
        container.setAttribute("data-collapsed-init", "");
        container.classList.add("collapsed");
        chevron.classList.add("collapsed");
      }
    });
  }

  // =========================================================================
  // Scroll vertical de la sidebar
  // =========================================================================

  // Enveloppe les sections de données (Fonds de plan, Données métier) dans un
  // conteneur scrollable, afin que le débordement vertical y soit absorbé. La
  // section « Outils carte » reste épinglée hors de ce conteneur : ses fenêtres
  // plugins doivent déborder en surimpression sur la carte, ce qui est
  // incompatible avec un parent en overflow:auto. Idempotente.
  function setupSidebarScroll() {
    var sidebar = document.querySelector(".modern-sidebar");
    if (!sidebar) return;
    if (sidebar.querySelector(":scope > .modern-sidebar-scroll")) return;

    var tools = sidebar.querySelector(":scope > .modern-family-tools");

    var scroll = document.createElement("div");
    scroll.className = "modern-sidebar-scroll";

    // Déplace toutes les sections SAUF « Outils carte » dans le conteneur
    sidebar.querySelectorAll(":scope > .modern-family:not(.modern-family-tools)")
      .forEach(function (fam) { scroll.appendChild(fam); });

    // Insère le conteneur scrollable avant la section Outils (qui reste épinglée)
    if (tools) sidebar.insertBefore(scroll, tools);
    else sidebar.appendChild(scroll);
  }

  // =========================================================================
  // Vigilance météo France (Nîmes / Gard) — bandeau d'alerte conditionnel
  // =========================================================================

  // N'affiche un bandeau QUE lorsqu'une vigilance >= orange est en cours sur le
  // Gard (jour J), et UNIQUEMENT sur la carte des régimes de priorité. Donnée
  // libre via Opendatasoft (pas de clé, CORS ouvert) ; bascule possible vers
  // l'API officielle Météo France plus tard sans toucher au reste.
  var VIGILANCE_URL =
    "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/" +
    "weatherref-france-vigilance-meteo-departement/records" +
    "?where=domain_id%3D%2230%22%20AND%20echeance%3D%22J%22&limit=30";
  var VIGILANCE_SEUIL = 3;                        // 3 = orange, 4 = rouge
  var VIGILANCE_EXCLUS = ["avalanches", "vagues-submersion"];
  var VIGILANCE_REFRESH_MS = 30 * 60 * 1000;
  var VIGILANCE_NIVEAUX = {
    3: { bg: "#F07D00", fg: "#2b1700", libelle: "ORANGE" },
    4: { bg: "#E2001A", fg: "#ffffff", libelle: "ROUGE" }
  };
  var VIGILANCE_PHENOMENES = {
    "vent": "Vent violent",
    "pluie-inondation": "Pluie-inondation",
    "orages": "Orages",
    "inondation": "Inondation",
    "crues": "Crues",
    "neige": "Neige-verglas",
    "canicule": "Canicule",
    "grand-froid": "Grand froid"
  };

  function libellePhenomene(p) {
    return VIGILANCE_PHENOMENES[p] || (p ? p.charAt(0).toUpperCase() + p.slice(1) : "");
  }

  // Construit / met à jour le bandeau dans l'en-tête. niveau null => le retire.
  // Placé dans la barre d'actions, à gauche des boutons Info / Aide.
  function afficherBandeauVigilance(niveau, phenomenes) {
    var hote = document.querySelector(".modern-header-actions")
            || document.querySelector(".modern-header-titles");
    if (!hote) return;
    var bandeau = hote.querySelector(".modern-vigilance-banner");

    if (!niveau || niveau < VIGILANCE_SEUIL) {                 // RAS : pas de bandeau
      if (bandeau) bandeau.remove();
      return;
    }

    var style = VIGILANCE_NIVEAUX[niveau] || VIGILANCE_NIVEAUX[3];
    if (!bandeau) {
      bandeau = document.createElement("div");
      bandeau.className = "modern-vigilance-banner";
      bandeau.style.cssText =
        "display:inline-flex;align-items:center;gap:6px;align-self:center;margin-right:10px;" +
        "padding:3px 10px;border-radius:999px;font-size:.78rem;font-weight:700;" +
        "line-height:1.2;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.18);";
      hote.insertBefore(bandeau, hote.firstChild);          // avant Info / Aide
    }
    bandeau.style.background = style.bg;
    bandeau.style.color = style.fg;
    var liste = phenomenes.map(libellePhenomene).filter(Boolean).join(", ");
    bandeau.innerHTML =
      "<span aria-hidden=\"true\">⚠️</span>" +
      "<span>Vigilance " + style.libelle +
      (liste ? " — " + liste : "") + "</span>";
    bandeau.setAttribute("title", "Vigilance météo France en cours sur le Gard (Nîmes)");
  }

  // Agrège les enregistrements (un par phénomène) en un niveau max + la liste
  // des phénomènes atteignant le seuil.
  function traiterVigilance(resultats) {
    var max = 0;
    var phenos = [];
    (resultats || []).forEach(function (r) {
      var p = (r.phenomenon || "").toLowerCase();
      if (VIGILANCE_EXCLUS.indexOf(p) !== -1) return;
      var c = Number(r.color_id) || 0;
      if (c > max) max = c;
      if (c >= VIGILANCE_SEUIL) phenos.push(p);
    });
    afficherBandeauVigilance(max, phenos);
  }

  function chargerVigilance() {
    // Mode test : ?vigilanceTest=orange|rouge force un bandeau factice.
    var test = new URLSearchParams(window.location.search).get("vigilanceTest");
    if (test) {
      var n = test === "rouge" ? 4 : 3;
      afficherBandeauVigilance(n, ["orages", "pluie-inondation"]);
      return;
    }
    fetch(VIGILANCE_URL, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (data) { traiterVigilance(data && data.results); })
      .catch(function (e) { console.warn("Vigilance indisponible:", e); });
  }

  function setupVigilanceNimes() {
    if (typeof valeurTitre1 === "undefined" || !/priorit/i.test(valeurTitre1)) return;
    chargerVigilance();
    window.setInterval(chargerVigilance, VIGILANCE_REFRESH_MS);
  }

  // =========================================================================
  // Aide partagée entre cartes
  // =========================================================================

  // //// modif nouvelle UI - fonction aide externalisée depuis les HTML cartes (contenu identique sur toutes les cartes).
  // Crée le dialog d'aide, le bouton easyButton et le dock en-tête.
  // Appelé une seule fois à l'init de chaque carte via : this.aide = function(){ window.aideCarto(maCarte); }
  // Textes mis à jour : "cases à cocher" → icône œil dans la barre latérale ; export → "barre latérale". ////
  window.aideCarto = function (maCarte) {
    // [cd30] Aide modernisée : grille de cartes (icône + titre + description).
    function carteAide(img, titre, texte) {
      var src = (img.charAt(0) === "/") ? img : "/leaflet/Ressources/API_JS/images/Aide/" + img;
      return "<div class='aide-carte'><img src='" + src + "'>"
        + "<div class='aide-carte-txt'><b>" + titre + "</b><span>" + texte + "</span></div></div>";
    }
    var contenuAideComplet =
      "<div class='encadré-aide'>Afficher la carte depuis le Système d'Information du CD 30.<br>Une connexion internet est nécessaire pour les fonds de carte.</div>"
      + "<div class='aide-grille'>"
      + carteAide("recentrer.png", "Recentrer carte", "Recentre automatiquement la carte sur le département du Gard (ou sur l'UT selon carte).")
      + carteAide("rechGoogle.gif", "Rechercher localisation", "Commune, adresse, bâtiment, route, lieu")
      + carteAide("/leaflet/cd30/ressources/aide-surlignage.svg", "Surligner lignes", "Surlignage en rouge des lignes au survol de la souris (actif ou non à l'ouverture selon la carte). Les lignes surlignées peuvent être disjointes ('multilignes').")
      + carteAide("recherche.gif", "Rechercher élément de couche", "Saisir des caractères pour afficher les correspondances et zoomer dessus. Touche 'Espace' pour la liste entière. Bouton d'export GeoJSON de l'élément dans la fenêtre.")
      + carteAide("legende.gif", "Légende dynamique", "Afficher/masquer chaque élément de la légende en cliquant dessus. L'œil de la barre latérale bascule la couche entière ; la légende filtre les éléments d'une même couche. Bloc légende repliable.")
      + carteAide("streetview.gif", "Street View, Panoramax, Maps, Waze", "Après clic, positionner Pegman (personnage orange) sur la carte puis choisir un service. Désactiver : touche clavier ou re-clic sur le bouton.")
      + carteAide("info.png", "Informations", "Affiche les infos relatives aux données représentées. Fermer en réappuyant sur l'icône 'i' (ou via la croix).")
      + carteAide("coordGPS.gif", "Coordonnées GPS", "Clic droit sur la carte (zoom ville et +) pour afficher/copier les coordonnées 'lat, long'.")
      + "<div class='aide-sous-titre'>Outils de carte</div>"
      + carteAide("dossier.gif", "Import couches", "Affiche des fichiers de couches WGS84 (Shape, GeoJSON, csv, GPX, Kml). Glisser/déposer possible, zip (1 couche par fichier), clic droit pour effacer.")
      + carteAide("/leaflet/cd30/ressources/aide-export.svg", "Export couches", "Exporte la ou les couches WGS84 sélectionnées dans la barre latérale aux formats GeoJSON, Shape ou GPX.")
      + carteAide("imprimer.gif", "Imprimer carte", "'Vue courante' : la portion affichée, en paysage. 'Auto Gard' : tout le département (échelle auto). 'Sélec. zone' : un rectangle tracé à la souris.")
      + carteAide("distance.gif", "Mesure de distance(s)", "Tracer une ligne pour mesurer en km (3 décimales), angles possibles. 'Echap' ou double-clic pour finir un segment ; plusieurs tronçons possibles. Bouton 'Règle' ou 'Echap' pour tout effacer.")
      + carteAide("isochrone.gif", "Isochrone et isodistance", "Placer un point puis lancer le calcul (voiture ou piéton) : isochrone ou isodistance autour ou depuis le point. Le réseau routier est pris en compte.")
      + carteAide("/leaflet/Ressources/Images/Punaises/GPS-Location.png", "Recherche par coordonnées GPS", "Copier ou saisir des coordonnées WGS84 (ex : '43.83494, 4.35965') pour afficher icône et fenêtre. Re-clic sur le bouton pour effacer.")
      + "</div>"
      + "<p class='text-warning'>Les rendus des fonctions importer, mesurer et isochrone seront perdus à la réouverture de la carte.<br>Pour en conserver une trace : impression papier/pdf via l'outil 'Imprimer' ou capture écran.</p>";

    if (!L.Browser.mobile) {
      var fenêtreAide = new L.control.dialog({size: [790,740], anchor: [0,500], position:"topleft", initOpen: true, minSize: [350,250], maxSize: [900,700]});
    } else {
      var fenêtreAide = new L.control.dialog({size: [290,300], anchor: [0,50], position:"topleft", initOpen: true, minSize: [260,250], maxSize: [600,400]});
    }

    var estOuverte = false;
    function aide(map) {
      estOuverte = !estOuverte;
      if (estOuverte) {
        fenêtreAide.setContent(contenuAideComplet).addTo(map);
        fenêtreAide._container.classList.add('dialog-aide');
      } else {
        map.removeControl(fenêtreAide);
      }
    }

    var boutonAide = L.easyButton("fa-question fa-4x", function(btn, map) {
      aide(map);
    }, "", {position: "topright"});
    boutonAide.button.classList.add('bouton-aide');
    boutonAide.addTo(maCarte);

    var containerAide = boutonAide.button.parentNode;
    containerAide.style.backgroundColor = "#f9b062";
    containerAide.style.border = "2px #f9b062";
    containerAide.dataset.modernDocked = 'true';
    containerAide.classList.add('modern-header-help-control');
    var headerHelpDock = document.getElementById('modernHeaderHelpDock');
    if (headerHelpDock) {
      headerHelpDock.innerHTML = '';
      headerHelpDock.appendChild(containerAide);
      var headerHelpLabel = document.createElement('span');
      headerHelpLabel.className = 'modern-header-help-label';
      headerHelpLabel.textContent = '?'; // [cd30] "?" au lieu du texte Aide (FontAwesome absent du dépôt : rendu texte équivalent)
      headerHelpLabel.title = 'Aide';
      headerHelpDock.appendChild(headerHelpLabel);
      headerHelpDock.addEventListener('click', function(e) {
        if (e.target.closest('.leaflet-control')) return;
        boutonAide.button.click();
      });
    }
  };

  // =========================================================================
  // Initialisation au chargement du DOM
  // =========================================================================

  // [cd30] Déplace le copyright (attribution Leaflet) en bas de la sidebar.
  function setupCopyrightSidebar(essaisRestants) {
    var attribution = document.querySelector(".leaflet-control-attribution");
    var sidebar = document.querySelector(".modern-sidebar");
    if (!attribution || !sidebar) {
      var n = (typeof essaisRestants === "number") ? essaisRestants : 15;
      if (n > 0) setTimeout(function () { setupCopyrightSidebar(n - 1); }, 300);
      return;
    }
    attribution.classList.add("modern-copyright-sidebar");
    sidebar.appendChild(attribution);
  }

  // [cd30] Chevron discret en haut à droite du bloc légende : replie/déplie
  // tout le bloc au clic (mêmes flèches que les en-têtes de couche).
  function setupLegendeChevron(essaisRestants) {
    var legende = document.querySelector(".leaflet-bottom.leaflet-right .leaflet-legend");
    if (!legende) {
      var n = (typeof essaisRestants === "number") ? essaisRestants : 40;
      if (n > 0) setTimeout(function () { setupLegendeChevron(n - 1); }, 400);
      return;
    }
    if (legende.querySelector(".legende-chevron")) return;
    var libelle = document.createElement("span");
    libelle.className = "legende-libelle";
    libelle.textContent = "Légende";
    libelle.title = "Déplier la légende";
    var chev = document.createElement("span");
    chev.className = "legende-chevron";
    chev.title = "Replier / déplier la légende";
    chev.textContent = "▼";
    // [cd30] bandeau en haut du bloc : porte le libellé (état replié) et le chevron
    var bandeau = document.createElement("div");
    bandeau.className = "legende-bandeau";
    bandeau.appendChild(libelle);
    bandeau.appendChild(chev);
    legende.insertBefore(bandeau, legende.firstChild);
    chev.addEventListener("click", function (e) {
      e.stopPropagation();
      var replie = legende.classList.toggle("legende-repliee");
      chev.textContent = replie ? "▶" : "▼";
    });
    // clic sur le libellé (visible uniquement replié) : maximise aussi
    libelle.addEventListener("click", function (e) {
      e.stopPropagation();
      legende.classList.remove("legende-repliee");
      chev.textContent = "▼";
    });
    // [cd30] survol de la pastille repliée : dépliage temporaire, repli à la
    // sortie ; un clic pendant le survol maintient le bloc déplié.
    legende.addEventListener("mouseenter", function () {
      if (legende.classList.contains("legende-repliee")) {
        legende.dataset.deplieSurvol = "1";
        legende.classList.remove("legende-repliee");
        chev.textContent = "▼";
      }
    });
    legende.addEventListener("mouseleave", function () {
      if (legende.dataset.deplieSurvol === "1") {
        delete legende.dataset.deplieSurvol;
        legende.classList.add("legende-repliee");
        chev.textContent = "▶";
      }
    });
    legende.addEventListener("click", function () {
      if (legende.dataset.deplieSurvol === "1") {
        delete legende.dataset.deplieSurvol;   // maintien : le mouseleave ne repliera plus
      }
    });
    // [cd30] petit écran (< 1000px de large) : légende repliée à l'ouverture
    if (window.innerWidth < 1000) {
      legende.classList.add("legende-repliee");
      chev.textContent = "▶";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupLegendeChevron();
    setupCopyrightSidebar();
    setupSidebarScroll();
    setupSidebarResizer();
    setupTitre();
    setupAccordion();
    setupBadgeMetier();
    // setupVigilanceNimes(); // [cd30] bandeau vigilance retiré de la carte priorités
  });

})();
