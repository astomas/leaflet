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
    row.addEventListener("click", function (event) {
      if (event.target.closest("button,a,input,[role='button'],.leaflet-control")) return;
      const clickable = el.querySelector("button,a,input,[role='button']") || el;
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
    document.querySelectorAll(".modern-family").forEach(function (section) {
      var title = section.querySelector(".modern-family-title");
      if (!title) return;
      // État initial : ouvert si l'attribut est absent
      if (!section.hasAttribute("data-expanded")) section.dataset.expanded = "true";
      title.addEventListener("click", function () {
        section.dataset.expanded = section.dataset.expanded === "false" ? "true" : "false";
      });
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

    // Met à jour le badge <em> avec le nombre de fonds de carte
    var badge = section.querySelector(".modern-family-title em");
    var nb = base.querySelectorAll("input").length;
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

    // Injection des items légende sous chaque label de couche
    injecterLegende(overlays);

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

      // Coche/décoche la case native (= icône œil vert/barré via CSS).
      var majOeil = function () { if (caseOeil) caseOeil.checked = unItemActif(); };

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
      // preventDefault neutralise la case native (pas de doublon System A).
      label.addEventListener("click", function (event) {
        if (event.target.closest(".detail-couches-toggle")) return;
        event.preventDefault();
        basculerTousItems(!unItemActif());
      });

      // Clic item individuel : le plugin bascule layers + classe ; on recolore
      // ensuite l'œil. layeradd/layerremove est l'événement fiable post-plugin.
      itemsAvecLayers.forEach(function (it) {
        map.on("layeradd layerremove", function (e) {
          if (e.layer === it.layers) majOeil();
        });
      });

      // Alignement initial de l'œil sur ce qui est réellement sur la carte.
      majOeil();
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
  // Initialisation au chargement du DOM
  // =========================================================================

  document.addEventListener("DOMContentLoaded", function () {
    setupSidebarScroll();
    setupSidebarResizer();
    setupTitre();
    setupAccordion();
    setupBadgeMetier();
    setupVigilanceNimes();
  });

})();
