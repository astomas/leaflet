/* ==========================================================================
   SI3P0 — nvx_menus_test.js
   Restructure le DOM généré par PowerShell en layout bento moderne.
   Conserve toute la logique métier de l'original (tri, sous-thématiques, etc.)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function() {
    var contenu = document.getElementById('contenu');
    if (!contenu) return;

    var sections = contenu.getElementsByClassName('accordeon-section');
    var sectionsArray = Array.from(sections);
    var sectionPrincipale = [];
    var sousThematique = [];

    // -----------------------------------------------------------------------
    // 1) Séparer sections principales / sous-thématiques (logique inchangée)
    // -----------------------------------------------------------------------
    sectionsArray.forEach(function(section) {
        var input = section.querySelector('input[type="checkbox"]');
        if (input) {
            var id = input.id.toLowerCase();
			var listeSousThematique = ['waze', 'ppbe', 'lieux covoiturages', 'conventions et ddp', 'fauchage', 'chute de blocs', 'curage', 'graflex', 'fiches cantonales'];
			if (listeSousThematique.includes(id)) {
				sousThematique.push(section);
			} else if (id !== 'statistiques') {
				sectionPrincipale.push(section);
			}
        }
    });

    // -----------------------------------------------------------------------
    // 2) Vider le contenu (logique inchangée)
    // -----------------------------------------------------------------------
    while (contenu.firstChild) {
        contenu.removeChild(contenu.firstChild);
    }

    // -----------------------------------------------------------------------
    // 3) Table d'icônes Font Awesome par type de section
    //    Ajouter ici les noms de section si de nouvelles thématiques apparaissent.
    // -----------------------------------------------------------------------
    var icones = {
    'cartes dynamiques': { fa: 'fa-location-dot', 			style: 'icon-teal' },
    'cartes statiques':  { fa: 'fa-map',              		style: 'icon-coral' },
    'tableaux':          { fa: 'fa-table-columns',    		style: 'icon-gold' },
    'atlas':             { fa: 'fa-book-atlas',       		style: 'icon-purple' }
    };
    // Icônes pour les sous-thématiques (mini-cards)
    // On alterne teal / gold, mais on peut personnaliser par nom
    var iconesSousThema = {
        'ppbe':                 { fa: 'fa-volume-high',        	style: 'icon-teal' },
        'waze':                 { fa: 'fa-diamond-turn-right', 	style: 'icon-gold' },
        'lieux covoiturages':   { fa: 'fa-car-side',           	style: 'icon-teal' },
        'conventions et ddp':   { fa: 'fa-file-signature',     	style: 'icon-gold' },
        'fauchage':             { fa: 'fa-scissors',           	style: 'icon-teal' },
        'chute de blocs':       { fa: 'fa-hill-rockslide',     	style: 'icon-gold' },
        'curage':               { fa: 'fa-water',              	style: 'icon-teal' },
		'graflex': 				{ fa: 'fa-camera-retro', 		style: 'icon-purple' },
		'fiches cantonales':    { fa: 'fa-map-pin',  style: 'icon-teal' },
    };
    // Icône par défaut si le nom de sous-thématique n'est pas listé ci-dessus
    var iconeSousThemaDefaut = { fa: 'fa-folder-open', style: 'icon-teal' };

    // Descriptions affichées sous le titre dans les mini-cards
    var descriptionsSousThema = {
        'ppbe':                 'Plan de Prévention du Bruit et de l\'Environnement',
        'waze':                 'Cartes de chaleur des accidents et nids-de-poule RD',
        'lieux covoiturages':   '',
        'conventions et ddp':   'Conventions routes/Dégats sur le Domaine Public',
        'fauchage':             'Campagnes de fauchages/OLD',
        'chute de blocs':       'Risques rocheux sur RD',
        'curage':               'Curage de fossés',
		'graflex' : 			'',
		'fiches cantonales':    '',
    };

    // -----------------------------------------------------------------------
    // 4) Enrichir chaque section principale : injecter .card-head avec icône
    //    FA + compteur, et ajouter dot/flèche dans chaque lien
    // -----------------------------------------------------------------------
    function enrichirSection(section) {
        var input = section.querySelector('input[type="checkbox"]');
        var label = section.querySelector('.accordeon-label');
        var contenuAcc = section.querySelector('.accordeon-contenu');
        if (!input || !label || !contenuAcc) return;

        var id = input.id.toLowerCase();
        var icone = icones[id] || { fa: 'fa-layer-group', style: 'icon-teal' };
		// Replier par défaut les sections non référencées dans la table d'icônes
		if (!icones[id]) {
			input.checked = false;
		}

        // Compter les liens
        var liens = contenuAcc.querySelectorAll('a');
        
		// Tri spécifique pour la section "Cartes dynamiques"
        // Poids 0 : éléments prioritaires en premier
        // Poids 2 : éléments techniques (TMJ, RRIR, OLD) en dernier
        // Poids 1 : tout le reste, trié alphabétiquement
        if (id === 'cartes dynamiques') {
            var liensArray = Array.from(liens);
            liensArray.sort(function(a, b) {
                var textA = a.textContent.trim();
                var textB = b.textContent.trim();
                var getWeight = function(text) {
                    if (text === 'Surveillance du réseau' || text === 'Sites par catégorie') return 0;
                    if (text.indexOf('TMJ') !== -1 || text.indexOf('RRIR') !== -1 || text.indexOf('RD sous OLD') !== -1) return 2;
                    return 1;
                };
                var weightA = getWeight(textA);
                var weightB = getWeight(textB);
                if (weightA !== weightB) return weightA - weightB;
                return textA.localeCompare(textB);
            });
            // Réinsère les liens dans le nouvel ordre
            liensArray.forEach(function(link) {
                contenuAcc.appendChild(link);
            });
            // Remet à jour la variable liens pour que le reste du code utilise le nouvel ordre
            liens = contenuAcc.querySelectorAll('a');
        }

		// Séparation Tableaux locaux / Tableaux de bord Metabase
        // Si la section est "Tableaux" et contient des liens externes (http/https),
        // on les sépare en deux sous-groupes visuels avec des bandeaux sous-titres.
        if (id === 'tableaux') {
            var liensLocaux = [];
            var liensMetabase = [];
            liens.forEach(function(a) {
                var href = a.getAttribute('href') || '';
                if (href.indexOf('http://') === 0 || href.indexOf('https://') === 0) {
                    liensMetabase.push(a);
                } else {
                    liensLocaux.push(a);
                }
            });

            // Si on a les deux types, on restructure le contenu
            if (liensMetabase.length > 0 && liensLocaux.length > 0) {
                // Vider le contenu actuel
                while (contenuAcc.firstChild) {
                    contenuAcc.removeChild(contenuAcc.firstChild);
                }

                // Sous-groupe 1 : Tableaux locaux
                var sousTitre1 = document.createElement('div');
                sousTitre1.className = 'sous-groupe-titre';
                sousTitre1.textContent = 'Tableaux';
                contenuAcc.appendChild(sousTitre1);

                liensLocaux.forEach(function(a) {
                    contenuAcc.appendChild(a);
                });

                // Sous-groupe 2 : Tableaux de bord Metabase
                var sousTitre2 = document.createElement('div');
                sousTitre2.className = 'sous-groupe-titre';
                sousTitre2.textContent = 'Tableaux de bord Metabase';
                contenuAcc.appendChild(sousTitre2);

                liensMetabase.forEach(function(a) {
                    // Force l'ouverture dans un nouvel onglet
                    a.setAttribute('target', '_blank');
                    a.setAttribute('rel', 'noopener noreferrer');
                    // Ajoute une classe pour le style (icône externe)
                    a.classList.add('lien-externe');
					a.setAttribute('title', 'Accès Metabase');
                    contenuAcc.appendChild(a);
                });

                // Remet à jour la variable liens
                liens = contenuAcc.querySelectorAll('a');
            }
        }


        // Créer le header visuel .card-head
        var cardHead = document.createElement('div');
        cardHead.className = 'card-head';
		if (!icones[id]) {
			cardHead.classList.add('card-head-mini');
		}
        // Icône FA dans un conteneur carré
        var iconDiv = document.createElement('div');
        iconDiv.className = 'card-icon ' + icone.style;
        var iconI = document.createElement('i');
        iconI.className = 'fa-solid ' + icone.fa;
        iconDiv.appendChild(iconI);

        // Bloc label + sous-titre
        var labelDiv = document.createElement('div');
        labelDiv.className = 'card-label';

        var nameDiv = document.createElement('div');
        nameDiv.className = 'card-name';
        nameDiv.textContent = label.textContent;
        labelDiv.appendChild(nameDiv);

        // Sous-titre "N ressources"
        var nbLiens = liens.length;
        var subDiv = document.createElement('div');
        subDiv.className = 'card-sub';
        subDiv.textContent = nbLiens + ' ressource' + (nbLiens > 1 ? 's' : '');
        labelDiv.appendChild(subDiv);

        cardHead.appendChild(iconDiv);
        cardHead.appendChild(labelDiv);

        // Rendre le card-head cliquable pour déplier/replier (simule le clic sur le label)
        cardHead.style.cursor = 'pointer';
        cardHead.addEventListener('click', function() {
            input.checked = !input.checked;
        });	

        // Insérer le card-head en tout premier enfant de la section
        section.insertBefore(cardHead, section.firstChild);
		
        // Enrichir chaque lien : ajouter un dot doré + une flèche
        liens.forEach(function(a) {
            // Dot doré
            var dot = document.createElement('span');
            dot.className = 'dot';
            a.insertBefore(dot, a.firstChild);

            // Flèche →
            var arrow = document.createElement('span');
            arrow.className = 'link-arrow';
            arrow.innerHTML = '&rarr;';
            a.appendChild(arrow);
        });		
		
		// Limiter à 10 liens visibles, avec bouton toggle "Voir tout / Réduire"
		var MAX_LIENS = 10;
		if (liens.length > MAX_LIENS) {
			var nbCaches = liens.length - MAX_LIENS;

			// Cacher les liens au-delà de 10
			for (var i = MAX_LIENS; i < liens.length; i++) {
				liens[i].style.display = 'none';
				liens[i].classList.add('lien-cache');
			}

			// Créer le bouton toggle
			var btnVoirTout = document.createElement('div');
			btnVoirTout.className = 'btn-voir-tout';
			btnVoirTout.textContent = '+ ' + nbCaches + ' autres éléments…';

			// État interne : false = replié, true = déplié
			var estDeplie = false;

			btnVoirTout.addEventListener('click', function(e) {
				// stopPropagation empêche le clic de remonter au card-head
				// qui togglerait l'accordéon (checkbox) en même temps
				e.stopPropagation();

				var tousLiens = contenuAcc.querySelectorAll('a');
				if (!estDeplie) {
					// Déplier : afficher tous les liens
					for (var j = MAX_LIENS; j < tousLiens.length; j++) {
						tousLiens[j].style.display = 'flex';
					}
					btnVoirTout.textContent = '− Réduire';
					estDeplie = true;
				} else {
					// Replier : re-cacher les liens au-delà de MAX_LIENS
					for (var j = MAX_LIENS; j < tousLiens.length; j++) {
						tousLiens[j].style.display = 'none';
					}
					btnVoirTout.textContent = '+ ' + nbCaches + ' autres éléments…';
					estDeplie = false;
				}
			});

			contenuAcc.appendChild(btnVoirTout);
		}
		
    }

    // -----------------------------------------------------------------------
    // 5) Ajouter les sections principales dans l'ordre souhaité (logique inchangée)
    // -----------------------------------------------------------------------
	
	var ordrePrincipal = ['cartes dynamiques', 'cartes statiques', 'tableaux', 'atlas'];
	sectionPrincipale.sort(function(a, b) {
		var idA = a.querySelector('input').id.toLowerCase();
		var idB = b.querySelector('input').id.toLowerCase();
		var posA = ordrePrincipal.indexOf(idA);
		var posB = ordrePrincipal.indexOf(idB);
		// Les sections connues en premier (dans l'ordre), les autres après
		if (posA === -1) posA = 999;
		if (posB === -1) posB = 999;
		return posA - posB;
	});
	sectionPrincipale.forEach(function(section) {
		enrichirSection(section);
		contenu.appendChild(section);
	});


    // -----------------------------------------------------------------------
    // 6) Séparateur visuel "Sous-thématiques" (seulement s'il y en a)
    // -----------------------------------------------------------------------
    if (sousThematique.length > 0) {
        var sep = document.createElement('div');
        sep.className = 'sep-row';
        var sepLabel = document.createElement('span');
        sepLabel.className = 'sep-label';
		sepLabel.textContent = sousThematique.length > 1 ? 'Sous-thématiques' : 'Sous-thématique';
        sep.appendChild(sepLabel);
        contenu.appendChild(sep);
    }

    // -----------------------------------------------------------------------
    // 7) Transformer les sous-thématiques en mini-cards
    //    On crée un wrapper .mini-cards-row pour le layout flex horizontal,
    //    puis chaque sous-thématique devient une .section-hors-accordeon
    //    restructurée avec icône FA + titre.
    // -----------------------------------------------------------------------
    if (sousThematique.length > 0) {
        var miniRow = document.createElement('div');
        miniRow.className = 'mini-cards-row';

        sousThematique.forEach(function(section, index) {
            var labelAccordeon = section.querySelector('label');
            var contenuAccordeon = section.querySelector('.accordeon-contenu');
            if (!labelAccordeon || !contenuAccordeon) return;

            var nom = labelAccordeon.textContent.trim();
            var nomLower = nom.toLowerCase();

            // Récupérer l'icône correspondante
            var icone = iconesSousThema[nomLower] || iconeSousThemaDefaut;

            // Récupérer le premier lien (typiquement "index") pour rendre la carte cliquable
            var premierLien = contenuAccordeon.querySelector('a');
            var hrefCible = premierLien ? premierLien.getAttribute('href') : '#';

            // Créer la mini-card en <a> pour qu'elle soit entièrement cliquable
            var divSousThema = document.createElement('a');
            divSousThema.className = 'section-hors-accordeon';
            divSousThema.setAttribute('href', hrefCible);
            // Décaler l'animation d'entrée pour chaque mini-card
            divSousThema.style.animationDelay = (0.2 + index * 0.05) + 's';

            // Icône FA
            var miniIconDiv = document.createElement('div');
            miniIconDiv.className = 'mini-icon ' + icone.style;
            var miniIconI = document.createElement('i');
            miniIconI.className = 'fa-solid ' + icone.fa;
            miniIconDiv.appendChild(miniIconI);

			// Titre
            var titreSousThema = document.createElement('h4');
            titreSousThema.textContent = nom;

            // Description (depuis le dictionnaire, vide si non trouvé)
            var descTexte = descriptionsSousThema[nomLower] || '';
            var descDiv = document.createElement('div');
            descDiv.className = 'mini-desc';
            descDiv.textContent = descTexte;

            divSousThema.appendChild(miniIconDiv);
            divSousThema.appendChild(titreSousThema);
            if (descTexte) divSousThema.appendChild(descDiv);

            miniRow.appendChild(divSousThema);
        });

        contenu.appendChild(miniRow);
    }

    // -----------------------------------------------------------------------
    // 8) Restructurer le haut de page : créer .top-bar avec le bouton home
    //    et le titre, en les déplaçant depuis le body
    // -----------------------------------------------------------------------
    var titreDiv = document.getElementById('titre');
    // Le lien accueil est le <a> qui contient .fa-house
    //var lienAccueil = document.querySelector('a[href="http://si3p0"]');
	var lienAccueil = document.querySelector('a[href="http://si3p0"]');
	var lienRetour = document.querySelector('a[href="../"]');

    var topBar = document.createElement('div');
    topBar.className = 'top-bar';

	if (lienAccueil) {
		topBar.appendChild(lienAccueil);
	}
	if (lienRetour) {
		topBar.appendChild(lienRetour);
	}
	
    if (titreDiv) {
        // Enrichir le titre avec du style typographique :
        // On cherche le texte et on met le premier mot en <b>, le dernier en <em>
        var texte = titreDiv.textContent.trim();
        var mots = texte.split(' ');
        if (mots.length >= 2) {
            // Premier mot en gras, dernier mot en doré, le reste normal
            titreDiv.innerHTML = '<b>' + mots[0] + '</b> '
                + mots.slice(1, -1).join(' ')
                + (mots.length > 2 ? ' ' : '')
                + '<em>' + mots[mots.length - 1] + '</em>';
        }
		else if (mots.length === 1) {
			titreDiv.innerHTML = '<b>' + mots[0] + '</b>';
		}
        topBar.appendChild(titreDiv);

        // Mettre le titre dans le <title> de la page (logique inchangée)
        document.title = texte;
    }

    // Insérer la top-bar juste avant #contenu
    contenu.parentNode.insertBefore(topBar, contenu);
});

/* ==========================================================================
   Fonctions utilitaires (inchangées)
   ========================================================================== */

// Fond satellite optionnel.
// Par défaut le fond est un dégradé teal CSS. Pour activer le fond photo satellite,
// décommenter la ligne "ACTIVER_FOND_SATELLITE = true" ci-dessous.
var ACTIVER_FOND_SATELLITE = false;
//var ACTIVER_FOND_SATELLITE = true;   // <-- décommenter cette ligne pour les photos du Gard

function mettreFondAleatoire(document) {
    if (!ACTIVER_FOND_SATELLITE) return;

    var images = ['Aigues-Mortes', 'Alès', 'Anduze', 'La Roque-sur-Cèze', 'Le Grau-du-Roi', 'Le Vigan', 'Mont Aigoual', 'Nîmes', 'Vers-Pont-du-Gard'];
    var random = Math.ceil(Math.random() * images.length) - 1;
    document.body.style.backgroundImage = 'url("/Ressources/Fonds/' + images[random] + '.jpg")';
    // Ajoute la classe CSS qui active l'overlay sombre sur la photo
    document.body.classList.add('fond-satellite');
}

function retarderAppel(delai, fonction) {
    if (!delai || typeof delai !== "number" || delai < 0) {
        return fonction;
    }
    var timer = 0;
    return function() {
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() {
            fonction.apply(null, args);
        }, delai);
    };
}

/* ==========================================================================
   Réserve de l'espace en bas du body pour que le #copyright (fixed) ne
   recouvre pas le dernier bloc de la grille.
   IMPORTANT : le script étant chargé dans le <head>, on attend
   DOMContentLoaded avant de chercher #copyright (sinon il n'existe pas
   encore et getElementById renvoie null).
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
    const copyright = document.getElementById('copyright');
    const contenu = document.getElementById('contenu');
    if (!copyright || !contenu) return;

    function reserverEspace() {
        // On retire d'abord le padding pour mesurer la hauteur "naturelle"
        document.body.style.paddingBottom = '0px';

        const footerH = copyright.offsetHeight;
        const contenuRect = contenu.getBoundingClientRect();
        const viewportH = window.innerHeight;

        // Le contenu descend-il dans la zone occupée par le footer ?
        // Si oui → on réserve l'espace. Sinon → on laisse tel quel.
        if (contenuRect.bottom > viewportH - footerH) {
            document.body.style.paddingBottom = footerH + 'px';
        }
    }

    reserverEspace();
    window.addEventListener('resize', reserverEspace);
    window.addEventListener('load', reserverEspace);
});