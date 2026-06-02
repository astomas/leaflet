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
    row.title           = label;

    const icon = document.createElement("span");
    icon.className = "modern-tool-icon-slot";

    const text = document.createElement("span");
    text.className   = "modern-tool-button-label";
    text.textContent = label;

    icon.appendChild(el);
    row.append(icon, text);

    // Délègue le clic sur le premier élément interactif du contrôle
    // (évite de déclencher l'action si l'utilisateur clique directement
    //  sur un bouton/lien natif à l'intérieur du contrôle)
    row.addEventListener("click", function (event) {
      if (event.target.closest("button,a,input,[role='button'],.leaflet-control")) return;
      const clickable = el.querySelector("button,a,input,[role='button']");
      if (clickable) clickable.click();
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
    var badge = document.querySelector(".modern-family-business .modern-family-title em");
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
    var business = document.querySelector(".modern-family-business");
    if (business && business.parentNode) business.after(section);

    return true;
  };

  // =========================================================================
  // Données métier : déplace les cases à cocher des couches métier (générées
  // par le contrôle Leaflet en haut à droite) dans la section "Données métier"
  // de la sidebar. Miroir de modernDockFondsDePlan pour le bloc overlays.
  // =========================================================================

  // API publique : relocalise le bloc .leaflet-control-layers-overlays dans la
  // section .modern-family-business. Idempotente (ne déplace qu'une fois) et
  // dotée d'un filet de retry si le contrôle n'est pas encore prêt.
  window.modernDockDonneesMetier = function (essaisRestants) {
    var section  = document.querySelector(".modern-family-business");
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

    return true;
  };

  // =========================================================================
  // Initialisation au chargement du DOM
  // =========================================================================

  document.addEventListener("DOMContentLoaded", function () {
    setupSidebarResizer();
    setupTitre();
    setupAccordion();
    setupBadgeMetier();
  });

})();
