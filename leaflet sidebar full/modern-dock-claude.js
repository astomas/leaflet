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
      /*var title = section.querySelector(".modern-family-title");
      if (!title) return;
      // État initial : ouvert si l'attribut est absent
      if (!section.hasAttribute("data-expanded")) section.dataset.expanded = "true";
      title.addEventListener("click", function () {
        section.dataset.expanded = section.dataset.expanded === "false" ? "true" : "false";
      });*/
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

    // Met à jour le badge <em> avec le nombre de fonds de carte
    var badge = section.querySelector(".modern-family-title em");
    var nb = base.querySelectorAll("input").length;
    if (badge && nb) badge.textContent = nb + (nb > 1 ? " fonds" : " fond");

    // [cd30] Place la section "Fonds de plan" apres la zone de defilement, et
    // non derriere "Donnees metier" : les trois blocs restent independants et
    // seul "Donnees metier" defile. Repli sur l'ancien comportement si la zone
    // de defilement n'existe pas.
    var zoneDefilement = document.querySelector(".modern-sidebar-scroll");
    if (zoneDefilement && zoneDefilement.parentNode) {
      zoneDefilement.after(section);
    } else {
      var business = document.querySelector(".modern-family-metier");
      if (business && business.parentNode) business.after(section);
    }

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

	// Repli auto des autres blocs selon la longueur de « Données métier ».
    // Appelé ici, une seule fois (la fonction sort plus haut si déjà déplacée).
    replierBlocsOuverture(overlays);

    return true;
  };
  
  // Repli automatique des blocs de la sidebar, À L'OUVERTURE UNIQUEMENT
  var SEUIL_REPLI_OUTILS = 10;
  var SEUIL_REPLI_FONDS  = 15;

  function replierBlocsOuverture(overlays) {
    var couches  = overlays.querySelectorAll("label");
    var nbLignes = couches.length;
    couches.forEach(function (label) {
      // Œil vert = classe posée par injecterLegende (majOeil)
      if (!label.classList.contains("modern-couche-active")) return;
      // La légende de la couche est insérée juste après son label
      var detail = label.nextElementSibling;
      if (detail && detail.classList.contains("detail-couches-sidebar")) {
        nbLignes += detail.querySelectorAll(".leaflet-legend-item").length;
      }
    });

    var outils = document.querySelector(".modern-family-tools");
    var fonds  = document.querySelector(".modern-family-fonds-plan");
    // data-expanded="false" : même état que le clic sur le titre (accordéon)
    if (nbLignes >= SEUIL_REPLI_OUTILS && outils) outils.dataset.expanded = "false";
    if (nbLignes >= SEUIL_REPLI_FONDS  && fonds)  fonds.dataset.expanded  = "false";
  }

  // Injecte les éléments de légende sous chaque label de couche dans la sidebar
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

      // Chevron de repli/dépli du détail légende, ajouté à gauche du libellé
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

      // oeil visibilité de la couche
      var caseOeil = label.querySelector('input[type="checkbox"]');
      var itemsAvecLayers = items.filter(function (it) { return it.layers; });

      // Vrai si au moins un layerGroup de cette couche est sur la carte.
      var unItemActif = function () {
        return itemsAvecLayers.some(function (it) { return map.hasLayer(it.layers); });
      };

      // Coche/décoche l'icône œil via une classe sur le label 
      var majOeil = function () {
        if (caseOeil) caseOeil.checked = false;
        label.classList.toggle("modern-couche-active", unItemActif());
      };

      // Synchronise les classes DOM d'inactivité avec l'état réel de la carte
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

      // Clic œil : tout allumer si rien d'actif, tout éteindre sinon
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

      // Clic item individuel : le plugin bascule layers + classe 
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

    // [cd30] Seul « Données métier » defile : « Fonds de plan » et « Outils carte »
    // restent epingles, pour trois blocs reellement independants.
    var fonds = sidebar.querySelector(":scope > .modern-family-fonds-plan");
    sidebar.querySelectorAll(
      ":scope > .modern-family:not(.modern-family-tools):not(.modern-family-fonds-plan)")
      .forEach(function (fam) { scroll.appendChild(fam); });

    // Insère le conteneur scrollable avant Fonds de plan, sinon avant Outils
    if (fonds) sidebar.insertBefore(scroll, fonds);
    else if (tools) sidebar.insertBefore(scroll, tools);
    else sidebar.appendChild(scroll);
  }



  // =========================================================================
  // Aide partagée entre cartes
  // =========================================================================

  // modif nouvelle UI - fonction aide externalisée depuis les HTML cartes (contenu identique sur toutes les cartes).
  // Crée le dialog d'aide, le bouton easyButton et le dock en-tête.
  // Appelé une seule fois à l'init de chaque carte via : this.aide = function(){ window.aideCarto(maCarte); }
  // Textes mis à jour : "cases à cocher" → icône œil dans la barre latérale ; export → "barre latérale". ////
  window.aideCarto = function (maCarte) {
    // Aide modernisée : grille de cartes (icône + titre + description).
    function carteAide(img, titre, texte) {
      var src = (img.charAt(0) === "/") ? img : "/Ressources/API_JS/images/Aide/" + img;
      return "<div class='aide-carte'><img src='" + src + "'>"
        + "<div class='aide-carte-txt'><b>" + titre + "</b><span>" + texte + "</span></div></div>";
    }
    var contenuAideComplet =
      "<div class='encadré-aide'>Afficher la carte depuis le Système d'Information du CD 30.<br>Une connexion internet est nécessaire pour les fonds de carte.</div>"
      + "<div class='aide-grille'>"
	+ carteAide("recentrer.png", "Recentrer la carte", "Recentrage auto sur le Gard (ou l'UT selon carte).")
		+ carteAide("rechLieu.png", "Rechercher une localisation", "Commune, adresse, lieu.")
		+ carteAide("surlignage.png", "Surlignage des lignes", "Surlignage en rouge des lignes au survol de la souris. Interrupteur actif ou non à l'ouverture selon la carte.")
		+ carteAide("recherche.gif", "Rechercher un élément de couche", "Route, PR, station, activité, site, UT, etc. selon la carte. Touche 'Espace': afficher la liste entière. Rech. par filtre (ex. PR par RD).")
		+ carteAide("legende_sidebar.png", "Légende dynamique", "Cliquer pour afficher/masquer 1 couche entière (ligne icone oeil) ou,  si disponibles, des éléments de couche en dessous.")/*<span style='color: #007e8d;' 'font-weigth:bold;'> (*)</span>")*/
		+ carteAide("streetview.png", "Accès Street View, G. Maps, Panoramax, Waze, IGN", "Après clic, positionner Pegman (personnage orange) sur la carte et choisir un service. Désactiver: touche clavier ou reclic.")
		+ carteAide("info.png", "Informations", "Affiche les infos relatives aux données représentées. Fermer en réappuyant sur l'icône <b>'i'</b> (ou via la croix).")
		+ carteAide("coordGPS.png", "Afficher coordonnées GPS", "Clic droit sur la carte au niveau de zoom ville et plus pour afficher/copier les coord. du curseur.")
		// + "<div class='aide-phrase'>(*) Selon le nombre de couches et d'éléments de couche présents à gauche à l'ouverture, les blocs 'outils carte' et 'fonds de plan' seront  repliés.</div>"
		+ "<div class='aide-sous-titre'>Outils carte</div>"
		+ carteAide("dossier.gif", "Import de couches", "Affiche des fichiers de couches Shape, GeoJSON, Csv, GPX, Kml. Possibilité de glisser/déposer et zipper. Clic droit sur 1 des éléments pour effacer la couche importée après validation.")
		+ carteAide("export.png", "Export de couches", "Après validation, exporter la ou les couches WGS84 activées (icone oeil vert) dans la barre latérale aux formats GeoJSON, Shape ou GPX.")
		+ carteAide("imprimer.gif", "Imprimer la carte", "<u>'Vue courante'</u>: portion affichée à l'écran au format paysage.<br> <u>'Auto Gard'</u>: le département du Gard avec mise à l'échelle auto.<br> <u>'Sélec. zone'</u>: imprime un rectangle tracé à la souris sur la carte.")
		+ carteAide("distance.gif", "Mesure de distance(s)", "Tracer une ligne pour mesurer en km (3 décimales, angles possibles). 'Echap' ou double-clic pour finir un segment. Reclic du bouton 'Règle' ou à nouveau 'Echap' pour tout effacer.")
		+ carteAide("isochrone.gif", "Calcul isochrone", "Entrer une adresse ou placer un point sur la carte puis lancer le calcul (voiture ou piéton) isochrone ou isodistance sens départ ou arrivée. Le réseau routier est pris en compte.")
		+ carteAide("rech-GPS.png", "Recherche par coordonnées GPS", "Copier ou saisir des coordonnées WGS84 (ex : '43.8349, 4.3596') pour localiser l'adresse la plus proche. Recliquer le bouton pour effacer la ou les adresses trouvées.")
		+ "</div>"
		+ "<p class='text-warning'>Les rendus issus des outils importer, mesure distance ou calcul d'isochrones seront perdus à la réouverture de la carte.<br>Pour en conserver une trace, faire une impression papier ou pdf via l'outil 'Imprimer' ou faire une capture d'écran.<br><br>Selon le nombre d'éléments du bloc 'Données métier', les blocs 'Outils carte' et 'Fonds de plan' peuvent être repliés à ouverture.<br>A l'ouverture, les couches dont l'ensemble des éléments sont grisés (icone oeil barré) sont repliés, clic chevron vert pour déplier.</p>"
		+ "<div style='margin-top:10px; font-size:1.25em; font-weight:bold; text-align:center'>"
		+ "<a href='http://si3p0/Ressources/tuto/Tutorial_Si3p0_new.ppsx' targeterPoint</a>"
		+ " Lien tutoriel powerpoint sur la recherche d'éléments, les objets superposés et l'export/import de couches"
	  + "</div>";
			  
    if (!L.Browser.mobile) {
      var fenêtreAide = new L.control.dialog({size: [845,685], anchor: [0,250], position:"topleft", initOpen: true, minSize: [350,250], maxSize: [900,750]});
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

  document.addEventListener("DOMContentLoaded", function () {
    setupCopyrightSidebar();
    setupSidebarScroll();
    setupSidebarResizer();
    setupTitre();
    setupAccordion();
    setupBadgeMetier();
  });

})();
