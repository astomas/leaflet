// =================== FONCTIONS DE TRI ===================
function trierTableau(n) {
    let tableau = document.getElementById("myTable"),
        corpsTableau = tableau.getElementsByTagName("tbody")[0],
        lignes = Array.from(corpsTableau.rows),
        direction = "asc";
    
    // Détection si c'est une colonne date
    let estColonneDate = tableau.getElementsByTagName("TH")[n]?.textContent.trim().toLowerCase().includes('date');
    
    // Détermine la direction du tri
    direction = (corpsTableau.getAttribute('data-last-sort') === n + '_asc') ? 'desc' : 'asc';
    
    // Fonction pour convertir une date en format comparable (aaaammjj)
    function parseDate(chaineDate) {
        if (!chaineDate) return '';
        // Gère les formats jj/mm/aaaa ou jj-mm-aaaa ou jj mm aaaa
        const correspondance = chaineDate.match(/^(\d{2})(?:\s|-|\/)(\d{2})(?:\s|-|\/)(\d{4})$/);
        if (correspondance) {
            const [, jour, mois, annee] = correspondance;
            return `${annee}${mois}${jour}`;
        }
        return chaineDate;
    }

    // Fonction pour extraire le contenu triable d'une cellule
    function obtenirContenuCellule(ligne) {
        const contenu = (n === 0 ? ligne.getElementsByTagName("TH")[0] : ligne.getElementsByTagName("TD")[n - 1])?.textContent.trim() || "";
        
        if (estColonneDate) {
            return parseDate(contenu);
        }

        // Extraction des valeurs numériques (avec gestion des unités)
        const correspondanceNumerique = contenu.match(/(-?\d+(?:[.,]\d+)?)\s*(?:%|km|m|€)?/i);
        if (correspondanceNumerique) {
            return parseFloat(correspondanceNumerique[1].replace(',', '.'));
        }
        
        return contenu.toLowerCase();
    }

    // Tri des lignes
    lignes.sort((a, b) => {
        let val1 = obtenirContenuCellule(a),
            val2 = obtenirContenuCellule(b);
            
        // Traitement spécial pour les cellules vides
        if (val1 === "") return direction === "asc" ? -1 : 1;
        if (val2 === "") return direction === "asc" ? 1 : -1;
        
        // Comparaison spécifique pour les dates
        if (estColonneDate) {
            return direction === "asc" ? val1.localeCompare(val2) : val2.localeCompare(val1);
        }
        
        // Comparaison numérique si applicable
        if (typeof val1 === 'number' && typeof val2 === 'number') {
            return direction === "asc" ? val1 - val2 : val2 - val1;
        }
        
        // Comparaison textuelle par défaut
        return direction === "asc" 
            ? String(val1).localeCompare(String(val2), undefined, {numeric: true}) 
            : String(val2).localeCompare(String(val1), undefined, {numeric: true});
    });

    // Réorganisation du tableau avec les lignes triées
    let fragment = document.createDocumentFragment();
    lignes.forEach(ligne => fragment.appendChild(ligne));
    corpsTableau.innerHTML = '';
    corpsTableau.appendChild(fragment);
    corpsTableau.setAttribute('data-last-sort', n + '_' + direction);

    // Mise à jour des indicateurs visuels de tri
    [...tableau.getElementsByTagName("TH")].forEach((entete, i) => {
        let fleche = entete.querySelector(".sort-arrow");
        if (fleche) fleche.textContent = i === n ? (direction === "asc" ? "▲" : "▼") : "⯅⯆";
    });
}

// =================== FONCTIONS DE RECHERCHE ===================

const cacheNormalisation = new Map();

// Fonction de normalisation avec cache
function normaliserTexte(texte) {
    if (typeof texte !== 'string') return '';
    
    // Si le texte est dans le cache, on retourne la valeur cachée
    if (cacheNormalisation.has(texte)) {
        return cacheNormalisation.get(texte);
    }
    
    // Sinon on normalise et on met en cache
    const normalise = texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    cacheNormalisation.set(texte, normalise);
    return normalise;
}

// Réinitialisation de la barre de recherche et de l'affichage
function effacerRecherche() {
    const champRecherche = document.getElementById('tableSearch');
    const tableau = document.getElementById('myTable');
    const lignes = tableau.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    champRecherche.value = '';
    
    for (let ligne of lignes) {
        ligne.style.display = '';
        supprimerSurbrillance(ligne);
    }
    
    champRecherche.focus();
}

// Fonction principale de filtrage du tableau
function rechercherDansTableau() {
    const champRecherche = document.getElementById('tableSearch');
    let filtre = normaliserTexte(champRecherche.value);
    const tableau = document.getElementById('myTable');
    const lignes = tableau.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    let nbCorrespondances = 0;
    
    // Vérifier si c'est une recherche stricte (se termine par !)
    const rechercheStricte = filtre.endsWith('!');
    if (rechercheStricte) {
        filtre = filtre.slice(0, -1); // Retirer le ! de la recherche
    }
    
    for (let ligne of lignes) {
        const cellules = ligne.querySelectorAll('th, td');
        let trouve = false;
        
        // Vérifie chaque cellule de la ligne
        for (let cellule of cellules) {
            let texte = normaliserTexte(cellule.textContent || cellule.innerText);
            
            if (rechercheStricte) {
                // Pour la recherche stricte, le texte doit correspondre exactement
                if (texte === filtre) {
                    trouve = true;
                    break;
                }
            } else {
                // Pour la recherche normale, on cherche si le texte contient le filtre
                if (texte.includes(filtre)) {
                    trouve = true;
                    break;
                }
            }
        }
        
        // Gestion de la surbrillance (minimum 3 caractères)
        if (filtre && filtre.length >= 3 && trouve) {
            surlignerCorrespondances(ligne, filtre);
        } else {
            supprimerSurbrillance(ligne);
        }
        
        // Affichage conditionnel des lignes
        ligne.style.display = trouve ? '' : 'none';
        if (trouve) nbCorrespondances++;
    }
    champRecherche.placeholder = 'Rechercher...';
}

// Application de la surbrillance sur les correspondances
function surlignerCorrespondances(ligne, filtre) {
    const cellules = ligne.querySelectorAll('th, td');
    cellules.forEach(cellule => {
        if (!cellule) return;
        const contenu = cellule.textContent;
        const contenuNormalise = normaliserTexte(contenu);
        
        if (contenuNormalise.includes(filtre)) {
            const partieOriginale = contenu.slice(
                contenuNormalise.indexOf(filtre),
                contenuNormalise.indexOf(filtre) + filtre.length
            );
            const regex = new RegExp(partieOriginale, 'gi');
            cellule.innerHTML = contenu.replace(regex, '<mark>$&</mark>');
        }
    });
}

// Suppression des effets de surbrillance
function supprimerSurbrillance(ligne) {
    const cellules = ligne.querySelectorAll('th, td');
    cellules.forEach(cellule => {
        if (!cellule) return;
        
        // Traitement spécial pour les cellules contenant des liens
        const lien = cellule.querySelector('a');
        if (lien) {
            const url = lien.href;
            cellule.innerHTML = `<a href="${url}" target="_blank">Accéder au lien</a>`;
        } else {
            cellule.innerHTML = cellule.textContent;
        }
    });
}

// Fonction pour limiter la fréquence d'exécution
function differerExecution(fonc, delai) {
    let minuteur;
    return function() {
        clearTimeout(minuteur);
        minuteur = setTimeout(() => {
            fonc();
        }, delai);
    };
}

// =================== FONCTIONS EXPORT ===================

// Export des résultats filtrés au format CSV
function exporterResultatsRecherche() {
    const tableau = document.getElementById('myTable');
    const lignesVisibles = [...tableau.querySelectorAll('tbody tr:not([style*="none"])')];
    
    // Récupération du nom de fichier depuis le titre
    const elementTitre = document.getElementById('titre');
    const nomFichier = elementTitre ? elementTitre.textContent.replace(/[\/\\:*?"<>|]/g, '_') : 'si3p0';
    
    // Initialisation du CSV avec BOM UTF-8
    let csv = '\uFEFF';
    
    // Identification des colonnes de type lien
    const entetes = [...tableau.querySelectorAll('thead th')].slice(1);
    const indicesColonnesLien = entetes.map((th, index) => {
        const texteEntete = th.textContent.replace('⯅⯆', '').trim().toLowerCase();
        return texteEntete.startsWith('lien') && (texteEntete === 'lien' || texteEntete.charAt(4) === ' ' || texteEntete.charAt(4) === '_') ? index : -1;
    }).filter(index => index !== -1);
    
    // Ajout des en-têtes au CSV
    csv += entetes
        .map(th => th.textContent.replace('⯅⯆', '').trim())
        .join(';') + '\n';
    
    // Ajout des données au CSV
    csv += lignesVisibles.map(ligne => {
        const cellules = [...ligne.querySelectorAll('td, th')].slice(1);
        
        return cellules
            .map((cellule, index) => {
                let texte = '';
                
                // Traitement spécial pour les colonnes de liens
                if (indicesColonnesLien.includes(index)) {
                    const lien = cellule.querySelector('a');
                    texte = lien ? lien.href : cellule.textContent.trim();
                } else {
                    texte = cellule.textContent.trim();
                }
                
                // Protection des champs contenant des points-virgules
                return texte.includes(';') ? `"${texte}"` : texte;
            })
            .join(';');
    }).join('\n');
    
    // Création et téléchargement du fichier (blob = binary file tempo du csv pour meilleures perfs)
    const fichierTemp = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(fichierTemp);
    
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `${nomFichier}_${new Date().toISOString().slice(0, 10)}.csv`;
    
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    
    // Nettoyage de l'URL temporaire
    setTimeout(() => URL.revokeObjectURL(url), 100);
}


// Initialisation des événements au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    const champRecherche = document.getElementById('tableSearch');
    if (champRecherche) {
        const rechercheDifferee = differerExecution(rechercherDansTableau, 300);
        champRecherche.addEventListener('keyup', rechercheDifferee);
        champRecherche.addEventListener('search', rechercheDifferee);
    }
});