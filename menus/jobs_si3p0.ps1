# -----------------------------------------------------------------------------
# Jobs spécifiques à si3p0 (SIg du Gard)
# -----------------------------------------------------------------------------

# -------------------------------------------------------------------------------
# Job de génération d'une carte Leaflet sur la base de vues/tables
# géographiques.
#
# Format attendu de $parametres :
# .racineAPI : Le chemin vers le dossier racine de l'API PowerShell.
# .sources : Les vues/tables décrivant les couches de la cartes. 
#  			 Appeller couches points avant lignes/polygones pr legende.
# .carte : Le chemin de sauvegarde de la carte.
# .titre : Le titre de la carte.
# .couchesActives : Les noms des couches à activer par défaut.
# .idInfo : L'identifiant du texte d'information à afficher sur le bouton d'aide.
# .rechJson : recherche objet métier. 
# .activerZoomClic : activer le zoom auto lors du clic sur un élément de couche.
# .utilisateur : L'utilisateur pour la connexion à la base de données.
# -------------------------------------------------------------------------------
$Job_SI3P0_Generer_Carte = {
    param (
        [object] $parametres
    )

    . ("$($parametres.racineAPI)\fonctions_si3p0.ps1")

    SI3P0-Generer-Carte `
        -sources $parametres.sources `
        -carte $parametres.carte `
        -titre $parametres.titre `
        -idInfo $parametres.idInfo `
		-rechJson $parametres.rechJson `
        -couchesActives $parametres.couchesActives `
        -activerZoomClic $parametres.activerZoomClic `
        -utilisateur $parametres.utilisateur
}

# -------------------------------------------------------------------------------
# Paramètrage d'un job de génération d'une carte Leaflet sur la base de
# vues/tables géographiques.
# $racineAPI : Le chemin vers le dossier racine de l'API PowerShell.
# $sources : Les vues/tables décrivant les couches de la cartes. 
# 			 Appeller couches points avant lignes/polygones pr legende.            
# $carte : Le chemin de sauvegarde de la carte.
# $titre : Le titre de la carte.
# $idInfo : L'identifiant du texte d'information à afficher sur le bouton d'aide.
# $rechJson : recherche objet métier. 
# $couchesActives : Les noms des couches à activer par défaut.
# $activerZoomClic : Activer le zoom auto lors du clic sur un élément de couche.
# $utilisateur : L'utilisateur pour la connexion à la base de données.
# -------------------------------------------------------------------------------
function Parametrer-Job-SI3P0-Generer-Carte {
    param (
        [string] $racineAPI = $PSScriptRoot,
        [parameter(Mandatory=$true)] [string[]] $sources,
        [parameter(Mandatory=$true)] [string] $carte,
        [string] $titre = 'Carte DGAML',
        [string] $idInfo = 'vue_defaut',
		[string] $rechJson = 'false',
        [string[]] $couchesActives = $null,
        [bool] $activerZoomClic = $true,
        [string] $utilisateur = $sigUtilisateur,
        [bool] $afficherNbEntites = $true
    )

    @{
        script = $Job_SI3P0_Generer_Carte
        racineAPI = $racineAPI
        sources = $sources
        carte = $carte
        titre = $titre
        idInfo = $idInfo
		rechJson = $rechJson
        couchesActives = $couchesActives
        activerZoomClic = $activerZoomClic
        utilisateur = $utilisateur
    }
}

# -----------------------------------------------------------------------------
# Job de génération d'une carte de chaleur Leaflet sur la base de vues/tables
# géographiques.
#
# Format attendu de $parametres :
# .racineAPI : Le chemin vers le dossier racine de l'API PowerShell.
# .sources : Les vues/tables décrivant les couches de la cartes.
# .carte : Le chemin de sauvegarde de la carte.
# .titre : Le titre de la carte.
# .couchesActives : Les noms des couches à activer par défaut.
# .idInfo : L'identifiant du texte d'information à afficher sur le bouton
#           d'aide.
# .rechJson : recherche objet métier. 
# .activerZoomClic : Pour activer le zoom auto lors du clic sur un élément
#                    d'une couche.
# .utilisateur : L'utilisateur pour la connexion à la base de données.
# -----------------------------------------------------------------------------
$Job_SI3P0_Generer_Carte_Heatmap = {
    param (
        [object] $parametres
    )

    . ("$($parametres.racineAPI)\fonctions_si3p0.ps1")

    SI3P0-Generer-Carte-Heatmap `
        -sources $parametres.sources `
        -carte $parametres.carte `
        -titre $parametres.titre `
        -daterTitre $parametres.daterTitre `
        -fondDePlan $parametres.fondDePlan `
        -idInfo $parametres.idInfo `
		-rechJson $parametres.rechJson `
        -couchesActives $parametres.couchesActives `
        -replierBoiteControle $parametres.replierBoiteControle `
        -activerZoomClic $parametres.activerZoomClic `
        -activerPermaliens $parametres.activerPermaliens `
        -actualisationAuto $parametres.actualisationAuto `
        -utilisateur $parametres.utilisateur
}


# -----------------------------------------------------------------------------
# Paramètrage d'un job de génération d'une carte de chaleur Leaflet sur la base de
# vues/tables géographiques.
#
# $racineAPI : Le chemin vers le dossier racine de l'API PowerShell.
# $sources : Les vues/tables décrivant les couches de la cartes.            
# $carte : Le chemin de sauvegarde de la carte.
# $titre : Le titre de la carte.
# $idInfo : L'identifiant du texte d'information à afficher sur le bouton
#           d'aide.
# $rechJson : recherche objet métier. 
# $couchesActives : Les noms des couches à activer par défaut.
# $activerInfosBulles : Pour activer l'affichage des informations au survol.
# $replierBoiteControle : Pour replier la boîte de contrôle en haut à droite.
# $activerZoomClic : Pour activer le zoom auto lors du clic sur un élément
#                    d'une couche.
# $activerPermaliens : Pour activer la gestion des permaliens.
# $actualisationAuto : Délai pour l'actualisation automatique de la carte, 0
#                      pour désactiver.
# $utilisateur : L'utilisateur pour la connexion à la base de données.
# -----------------------------------------------------------------------------
function Parametrer-Job-SI3P0-Generer-Carte-Heatmap {
    param (
        [string] $racineAPI = $PSScriptRoot,
        [parameter(Mandatory=$true)] [string[]] $sources,
        [parameter(Mandatory=$true)] [string] $carte,
        [string] $titre = 'Carte DGAML',
        [bool] $daterTitre = $false,
        [string] $fondDePlan = 'cartoDB',
        [string] $idInfo = 'vue_defaut',
		[string] $rechJson = 'false',
        [string[]] $couchesActives = $null,
        [bool] $replierBoiteControle = $false,
        [bool] $activerZoomClic = $false,
        [bool] $activerPermaliens = $false,
        [int] $actualisationAuto = 0,
        [string] $utilisateur = $sigUtilisateur,
        [bool] $afficherNbEntites = $true
    )

    @{
        script = $Job_SI3P0_Generer_Carte_Heatmap
        racineAPI = $racineAPI
        sources = $sources
        carte = $carte
        titre = $titre
        daterTitre = $daterTitre
        fondDePlan = $fondDePlan
        idInfo = $idInfo
		rechJson = $rechJson
        couchesActives = $couchesActives
        replierBoiteControle = $replierBoiteControle
        activerZoomClic = $activerZoomClic
        activerPermaliens = $activerPermaliens
        actualisationAuto = $actualisationAuto
        utilisateur = $utilisateur
    }
}