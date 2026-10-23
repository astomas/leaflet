# -----------------------------------------------------------------------------
# Fonctions spécifiques à si3p0 (SIg du Gard)
# -----------------------------------------------------------------------------

. ("$PSScriptRoot\constantes_si3p0.ps1")
. ("$PSScriptRoot\fonctions_outils.ps1")
. ("$PSScriptRoot\sig_défaut.ps1")

Add-Type -AssemblyName System.Web

# -----------------------------------------------------------------------------
# Génération d'une page HTML du portail.
# Utilise le modèle présent dans les ressources de l'API.
#
# $titre : Le titre de la page.
# $contenu : Le contenu de la page.
# $sortie : Le chemin de sauvegarde de la page.
# $activerBoutonAccueil : Pour demander l'affichage du bouton de retour à
#                         l'accueil du portail.
# -----------------------------------------------------------------------------
function SI3P0-Generer-Page-Portail {
    param (
        [parameter(Mandatory=$true)] [string] $titre,
        [parameter(Mandatory=$true)] [string] $contenu,
        [parameter(Mandatory=$true)] [string] $sortie,
        [bool] $activerBoutonAccueil = $true,
		[bool] $activerBoutonRetour = $false 
    )

    $html = Get-Content "$PSScriptRoot\..\Ressources\modèle_page_accordeon.html"
    $html = $html.replace("<!-- inserer titre ici -->", $titre)
    $html = $html.replace("<!-- inserer contenu ici -->", $contenu)

    if ($activerBoutonAccueil) {
        $html = [RegEx]::Replace($html, '<!-- retirer commentaire pour activer bouton accueil (.*)-->', '<$1>')
    }
	
	if ($activerBoutonRetour) {		
        $boutonRetour = '<a href="../" title="Retour page thématique"><i class="fa fa-step-backward" style="font-size: 1.7em; color: white; margin-left: 10px;"></i></a>'
        $html = $html -replace '<div id="titre">', "$boutonRetour<div id=`"titre`">"
    }

    $html | Out-File $sortie -Force -Encoding utf8
}

# -----------------------------------------------------------------------------
# Génération d'une page HTML TABLEAU 
#
# $titre : Le titre de la page.
# $contenu : Le contenu de la page.
# $sortie : Le chemin de sauvegarde de la page.
# $activerBoutonAccueil : Pour demander l'affichage du bouton de retour à
#                         l'accueil du portail.
# -----------------------------------------------------------------------------
function SI3P0-Generer-Page-Portail-Tableau {
    param (
        [parameter(Mandatory=$true)] [string] $titre,
        [parameter(Mandatory=$true)] [string] $contenu,
        [parameter(Mandatory=$true)] [string] $sortie,
        [bool] $activerBoutonAccueil = $true
    )

    $html = Get-Content "$PSScriptRoot\..\Ressources\modèle_page_tableau.html"
    $html = $html.replace("<!-- inserer titre ici -->", $titre)
    $html = $html.replace("<!-- inserer contenu ici -->", $contenu)

    if ($activerBoutonAccueil) {
        $html = [RegEx]::Replace($html, '<!-- retirer commentaire pour activer bouton accueil (.*)-->', '<$1>')
    }

    $html | Out-File $sortie -Force -Encoding utf8
}

# -----------------------------------------------------------------------------
# Génération d'une page HTML avec recherche via la BAN.
# Utilise le modèle présent dans les ressources de l'API.
#
# $url : L'url de l'iframe à piloter par la recherche BAN.
# $sortie : Le chemin de sauvegarde de la page.
# $activerBoutonAccueil : Pour demander l'affichage du bouton de retour à
#                         l'accueil du portail.
# -----------------------------------------------------------------------------
function SI3P0-Generer-Page-BAN-Portail {
    param (
        [parameter(Mandatory=$true)] [string] $url,
        [parameter(Mandatory=$true)] [string] $sortie,
        [bool] $activerBoutonAccueil = $true
    )

    $html = Get-Content "$PSScriptRoot\..\Ressources\modèle_page_ban.html"
    $html = $html.replace("<!-- insérer url iframe ici -->", $url)

    if ($activerBoutonAccueil) {
        $html = [RegEx]::Replace($html, '<!-- retirer commentaire pour activer bouton accueil (.*)-->', '<$1>')
    }

    $html | Out-File $sortie -Force -Encoding utf8
}

# -----------------------------------------------------------------------------
# Génération de la page d'accueil du portail.
#
# Itère sur les dossiers présents dans Thématiques pour déterminer les tuiles
# à afficher.
#
# $exclure : Le thématiques à exclure de la génération.
# -----------------------------------------------------------------------------
function SI3P0-Generer-Accueil-Portail {
    param (
        [string[]] $exclure = $null
    )
	
    $contenu = [Text.StringBuilder]::new()
	
    # génération d'une tuile par thématique
    if ($exclure) {
        $dossiersThematiques = (Get-ChildItem $si3p0ThematiquesPortailWeb -Directory -Exclude $exclure).Name
    }
    else {
        $dossiersThematiques = (Get-ChildItem $si3p0ThematiquesPortailWeb -Directory).Name
    }

    foreach ($dossierThematique in $dossiersThematiques) {

        [void]$contenu.AppendLine("<div class=`"cadre_thematique`">")
        [void]$contenu.AppendLine("<a href=`"/Thématiques/$dossierThematique/`">")

        [void]$contenu.AppendLine("<div class=`"illustration_thematique`">")
        # /!\ placer une image "illustration.png" la thématique de taille 250px * 250px
        [void]$contenu.AppendLine("<img class=`"ajuste`" src=`"/Thématiques/$dossierThematique/illustration.png`" title=`"$dossierThematique`" alt=`"$dossierThematique`" />")
        [void]$contenu.AppendLine("</div>")

        [void]$contenu.AppendLine("<div class=`"titre_thematique`">$dossierThematique</div>")

        [void]$contenu.AppendLine("</a>")
        [void]$contenu.AppendLine("</div>")
    }

    SI3P0-Generer-Page-Portail -titre 'si3p0' -contenu $contenu.ToString() -activerBoutonAccueil $false -sortie "$si3p0PortailWeb\index.html"
}

# -----------------------------------------------------------------------------
# Génération de la page d'index d'une thématique du portail.
#
# $dossierThematique : Le dossier contenant les ressources de la thématique.
# $sortie : Le chemin de sauvegarde de la page.
# -----------------------------------------------------------------------------
function SI3P0-Generer-Thematique-Portail {
    param (
        [parameter(Mandatory=$true)] [string] $dossierThematique,
        [parameter(Mandatory=$true)] [string] $sortie,
		[bool] $activerBoutonRetour = $false
    )
	
    $contenu = [Text.StringBuilder]::new()

    # parcours des sous-dossiers
    foreach ($dossier in Get-ChildItem $dossierThematique -Directory) {
		[void]$contenu.AppendLine("<div class=`"accordeon-section`">")
		[void]$contenu.AppendLine("<input type=`"checkbox`" id=`"$dossier`" checked>")
		[void]$contenu.AppendLine("<label class=`"accordeon-label`" for=`"$dossier`" >$dossier</label>")
		[void]$contenu.AppendLine("<div class=`"accordeon-contenu`">")            

		# ajout d'un hyperlien vers les fichiers .html, .pdf et .url
		foreach ($fichier in Get-ChildItem "$($dossier.FullName)\*" -Include '*.html', '*.pdf', '*.url') {
			$nomAffiche = [IO.Path]::GetFileNameWithoutExtension($fichier)
			# sous-menu accordeon pour liens url metabase
			if ($fichier.Extension -ieq '.url') {
				$urlCible = (Get-Content $fichier.FullName | Where-Object { $_ -match '^URL=' }) -replace '^URL=', ''
				if ($urlCible) {
					[void]$contenu.AppendLine("<a href=`"$urlCible`">$nomAffiche</a></br>")
				}
			}
			else {
				[void]$contenu.AppendLine("<a href=`"./$($dossier.Name)/$($fichier.Name)`">$nomAffiche</a></br>")
			}
		}
		[void]$contenu.AppendLine("</div>")
		[void]$contenu.AppendLine("</div>")	
    }
	


    [void]$contenu.AppendLine("</div>")
	# mettre en comm lors de bascule nvx menus
	#[void]$contenu.AppendLine("<script type=`"text/javascript`" src=`"../../Ressources/Scripts/tri_menu.js`"></script>")

    SI3P0-Generer-Page-Portail -titre ([IO.Path]::GetFileName($dossierThematique)) -contenu $contenu.ToString() -sortie $sortie -activerBoutonRetour $activerBoutonRetour
}

# -----------------------------------------------------------------------------
# Génération de la page d'index des thématiques du portail.
#
# Itère sur les dossiers présents dans Thématiques et en génère les pages.
# Effectue un Recurse uniquement lorsque sous thematique
# et qu'ils sont des sous-dossiers des dossiers présents dans $dossiersThematiques.
# $exclure : Les thématiques racines à exclure de la génération lors de l'appel.
# -----------------------------------------------------------------------------
function SI3P0-Generer-Thematiques-Portail {
    param (
        [string[]] $exclure = $null
    )
    
    if ($exclure) {
        $dossiersThematiques = Get-ChildItem $si3p0ThematiquesPortailWeb -Directory -Exclude $exclure
    }
    else {
        $dossiersThematiques = Get-ChildItem $si3p0ThematiquesPortailWeb -Directory
    }

    foreach ($dossierThematique in $dossiersThematiques) {
        # Génère index.html pour le dossier thématique principal
        SI3P0-Generer-Thematique-Portail -dossierThematique $dossierThematique.FullName -sortie "$($dossierThematique.FullName)/index.html"		
		
        #Traitement spécial pour le dossier 'Territoires - PER/'fiches cantonales'
		if ($dossierThematique.Name -ieq 'Territoires - PER') {
			$dossierFichesCantonales = "$($dossierThematique.FullName)\fiches cantonales"
			#Génère index.html pour le dossier racine 'fiches cantonales'
			SI3P0-Generer-Thematique-Portail -dossierThematique $dossierFichesCantonales -sortie "$dossierFichesCantonales\index.html" -activerBoutonRetour $true
			$sousDossiers = Get-ChildItem $dossierFichesCantonales -Directory
			foreach ($sousDossier in $sousDossiers) {
				#Génère index.html pour chaque sous-dossier 'fiches cantonales'
				SI3P0-Generer-Thematique-Portail -dossierThematique $sousDossier.FullName -sortie "$($sousDossier.FullName)\index.html" -activerBoutonRetour $true
			}
		}		
        # bouton retour sous-thematiques hors entretien exploit.
        else {
            $sousDossiersThematiques = Get-ChildItem $dossierThematique.FullName -Directory -Recurse | Where-Object { $_.Name -ieq 'waze' -or $_.Name -ieq 'lieux covoiturages' -or $_.Name -ieq 'ppbe' -or $_.Name -ieq 'conventions et DDP' -or $_.Name -ieq 'fauchage' -or $_.Name -ieq 'Chute de blocs' -or $_.Name -ieq 'Curage'}
            foreach ($sousDossierThematique in $sousDossiersThematiques) {
                SI3P0-Generer-Thematique-Portail -dossierThematique $sousDossierThematique.FullName -sortie "$($sousDossierThematique.FullName)/index.html" -activerBoutonRetour $true
            }
        }
    }
}

# -----------------------------------------------------------------------------
# Génération d'une page HTML du portail pour l'affichage du contenu d'un CSV.
#
# $csv : Le chemin vers le fichier CSV.
# $urlCsv : L'URL de téléchargement du fichier CSV.
# $sortie : Le chemin de sauvegarde de la page.
# $titre : Le titre de la page.
# $delimiteur : Le délimiteur utilisé dans le CSV.
# -----------------------------------------------------------------------------
function SI3P0-Generer-Tableau-Portail {
    param (
        [parameter(Mandatory=$true)] [string] $csv,
        [parameter(Mandatory=$true)] [string] $urlCsv,
        [parameter(Mandatory=$true)] [string] $sortie,
        [string] $titre = [IO.Path]::GetFileNameWithoutExtension($csv),
        [string] $delimiteur = (Get-Culture).TextInfo.ListSeparator
    )
    
    $contenuCSV = @(Import-Csv $csv -Delimiter $delimiteur)
    
    if ($contenuCSV.Count -ge 0) {

        $contenu = [Text.StringBuilder]::new()
        [void]$contenu.AppendLine('<table id="myTable" class="csv2html">')
    
		# en-tête
        [void]$contenu.AppendLine('<thead>')
    
        # lien de téléchargement des données
        [void]$contenu.AppendLine('<tr>')

		
		 [void]$contenu.AppendLine('<td colspan="10">')
		 [void]$contenu.AppendLine('<div style="display: flex; align-items: center;">')
		 [void]$contenu.AppendLine("<a href=""$urlCsv"" title=""Télécharger tableau"" style=""margin-left:10px;"">")
		 [void]$contenu.AppendLine('<i class="fa-solid fa-download fa-2x" style="color: #004d99;"></i>')
		 [void]$contenu.AppendLine('</a>')
		 [void]$contenu.AppendLine('<div class="search-wrapper" >')
		 [void]$contenu.AppendLine('<input type="text" id="tableSearch" style="margin-left:40px; margin-right:6px; font-size:1.2em" placeholder="Rechercher..." title="Si rech. valeur unique: mettre un ! à la fin">')
		 [void]$contenu.AppendLine('<span class="search-clear" onclick="effacerRecherche()">✕</span>')
		 [void]$contenu.AppendLine('</div>')
		 [void]$contenu.AppendLine('<button onclick="exporterResultatsRecherche()" style="height:30px">Exporter résultats</button>')
		 [void]$contenu.AppendLine('</div>')
		 [void]$contenu.AppendLine('</td>')
				
		
		[void]$contenu.AppendLine('</tr>')			
		
		# en-têtes colonnes et tri
		[void]$contenu.AppendLine('<tr>')
		[void]$contenu.AppendLine("<th onclick='trierTableau(0)'>#<span class='sort-arrow'>⯅⯆</span></th>")
		$colIndex = 1
		$contenuCSV[0].PSObject.Properties | foreach {
			[void]$contenu.AppendLine("<th onclick='trierTableau($colIndex)'>$($_.Name)<span class='sort-arrow'>⯅⯆</span></th>")
			$colIndex++
		}
		[void]$contenu.AppendLine('</tr>')
		
		[void]$contenu.AppendLine('</thead>')

        # corps du tableau
        [void]$contenu.AppendLine('<tbody class="csv2html">')

        # ligne à ligne
        $numLig = 0
        $contenuCSV | foreach {

            $numLig++

            [void]$contenu.AppendLine('<tr>')
            [void]$contenu.AppendLine("<th>$numLig</th>")

            # colonne à colonne
            $_.PSObject.Properties | foreach {
                [void]$contenu.Append("<td title=""#$numLig-$($_.Name)"">")
                
                if ($_.Name.StartsWith('Lien')) {
                    [void]$contenu.Append("<a href=""$($_.Value)"" target=""_blank"">Accéder au lien</a>")
                }
                else {
                    [void]$contenu.Append($_.Value)
                }

                [void]$contenu.AppendLine('</td>')
            }

            [void]$contenu.AppendLine('</tr>')
        }

        [void]$contenu.AppendLine('</tbody>')
        [void]$contenu.AppendLine('</table>')

        SI3P0-Generer-Page-Portail-Tableau -titre $titre -contenu $contenu.ToString() -sortie $sortie
    }
}

# -----------------------------------------------------------------------------
# Génération d'une page HTML du portail pour l'affichage du contenu de chaque
# CSV présent dans un dossier donné.
#
# $dossier : Le chemin vers le dossier contenant les CSV.
# $urlCsv : L'URL du dossier contenant les CSV.
# $sortie : Le chemin de sauvegarde des pages.
# $delimiteur : Le délimiteur utilisé dans les CSV.
# -----------------------------------------------------------------------------
function SI3P0-Generer-Tableaux-Portail {
    param (
        [parameter(Mandatory=$true)] [string] $dossier,
        [parameter(Mandatory=$true)] [string] $urlDossier,
        [parameter(Mandatory=$true)] [string] $sortie,
        [string] $delimiteur = (Get-Culture).TextInfo.ListSeparator
    )

    foreach ($csv in Get-ChildItem "$dossier\*.csv") {
        SI3P0-Generer-Tableau-Portail -csv $csv -urlCsv "$urlDossier/$($csv.BaseName).csv" -sortie "$sortie\$($csv.BaseName).html"
    }
}

# -----------------------------------------------------------------------------
# Ajout un texte d'information utilisable dans les cartes HTML.
# Le texte d'information est encodé avant l'ajout.
#
# $identifiant : L'identifiant unique du texte d'information.
# $texte : Le texte d'information.
# -----------------------------------------------------------------------------
function SI3P0-Ajouter-Information-Carte {
    param (
        [parameter(Mandatory=$true)] [string] $identifiant,
        [parameter(Mandatory=$true)] [string] $texte
    )

    SIg-Executer-Commande -commande @"
delete from m.infos_carte where id = '$identifiant';
insert into m.infos_carte (id, texte_info) values ('$identifiant', '$([System.Web.HttpUtility]::HtmlEncode($texte).Replace([System.Environment]::NewLine, '<br>'))');
"@
}

# -----------------------------------------------------------------------------
# Ajout un texte d'information utilisable dans les cartes HTML.
# Le texte d'information doit être encodé avant l'appel.
#
# $identifiant : L'identifiant unique du texte d'information.
# $texte : Le texte d'information.
# -----------------------------------------------------------------------------
function SI3P0-Ajouter-Information-Encodee-Carte {
    param (
        [parameter(Mandatory=$true)] [string] $identifiant,
        [parameter(Mandatory=$true)] [string] $texte
    )

    SIg-Executer-Commande -commande @"
delete from m.infos_carte where id = '$identifiant';
insert into m.infos_carte (id, texte_info) values ('$identifiant', '$($texte.Replace([System.Environment]::NewLine, ''))');
"@
}

# -----------------------------------------------------------------------------
# Génération d'une carte Leaflet sur la base de vues/tables géographiques.
#
# $sources : Les vues/tables décrivant les couches de la cartes.
#  			 Appeller couches points avant lignes/polygones pr legende.
# $carte : Le chemin de sauvegarde de la carte.
# $titre : Le titre de la carte.
# $idInfo : L'identifiant du texte d'information à afficher sur le bouton d'aide.
# $rechJson : recherche objet métier. 
# $couchesActives : Les noms des couches à activer par défaut.
# $activerZoomClic : activer le zoom auto lors du clic sur élément d'une couche.
# $utilisateur : L'utilisateur pour la connexion à la base de données.
# -----------------------------------------------------------------------------
function SI3P0-Generer-Carte {
    param (
        [parameter(Mandatory=$true)] [string[]] $sources,
        [parameter(Mandatory=$true)] [string] $carte,
        [string] $titre = 'Carte DGAML',
        [string] $idInfo = 'vue_defaut',
		[string] $rechJson = 'false',
        [string[]] $couchesActives = $null,
        [bool] $activerZoomClic = $true,
        [string] $utilisateur = $sigUtilisateur
    )

    Afficher-Message-Date "Génération de la carte HTML issue de ($sources) vers $carte."

    $tableauSources = "array[$([string]::Join(', ', ($sources | foreach {"'$($_.ToLower())'"})))]"
    $tableauCouchesActives = "'$([string]::Join(',', ($sources | foreach { if ($couchesActives -ne $null -and $couchesActives.Contains($_)) { 1 } else { 0 }})))'"

    $commande = `
@"
        select vershtml_n(
            $tableauSources,
            $tableauCouchesActives,
            '$([System.Web.HttpUtility]::HtmlEncode($titre))',  
            $activerZoomClic,
            '$idInfo',
			'$rechJson')
"@

    # passe par un fichier temporaire pour que la carte reste disponible à l'utilisateur le temps de la génération
    New-Item -ItemType Directory -Force -Path "$dossierTravailTemp\SI3P0-Generer-Carte\"
    $carteTemp = "$dossierTravailTemp\SI3P0-Generer-Carte\$(New-Guid).html"

    SIg-Executer-Commande -commande $commande -utilisateur $utilisateur -autresParams '--tuples-only', '--no-align' -sortie $carteTemp -erreur $false
    
    New-Item -ItemType Directory -Force -Path (Split-Path -Path $carte)
    Move-Item $carteTemp $carte -Force
}


# -----------------------------------------------------------------------------
# Génération d'une carte de chaleur Leaflet sur la base de vues/tables géographiques.
#
# $sources : Les vues/tables décrivant les couches de la cartes.
# $carte : Le chemin de sauvegarde de la carte.
# $titre : Le titre de la carte.
# $idInfo : L'identifiant du texte d'information à afficher sur le bouton d'aide.
# $rechJson : recherche objet métier. Modif TF
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
function SI3P0-Generer-Carte-Heatmap {
    param (
        [parameter(Mandatory=$true)] [string[]] $sources,
        [parameter(Mandatory=$true)] [string] $carte,
        [string] $titre = 'Carte DGAML',
        [bool] $daterTitre = $false,
        [string] $fondDePlan = 'cartoDB',
        [string] $idInfo = 'vue_defaut',
		[string] $rechJson = 'false',
        [string[]] $couchesActives = $null,
        [bool] $activerInfosBulles = $true,
        [bool] $replierBoiteControle = $false,
        [bool] $activerZoomClic = $false,
        [bool] $activerPermaliens = $false,
        [int] $actualisationAuto = 0,
        [string] $utilisateur = $sigUtilisateur
    )

    Afficher-Message-Date "Génération de la carte HTML issue de ($sources) vers $carte."

    $tableauSources = "array[$([string]::Join(', ', ($sources | foreach {"'$($_.ToLower())'"})))]"
    $tableauCouchesActives = "'$([string]::Join(',', ($sources | foreach { if ($couchesActives -ne $null -and $couchesActives.Contains($_)) { 1 } else { 0 }})))'"

    $commande = `
@"
        select vershtml_heatmap(
            $tableauSources,
            $tableauCouchesActives,
            '$([System.Web.HttpUtility]::HtmlEncode($titre))',
            '$fondDePlan',
            $activerInfosBulles,
            $daterTitre,
            $replierBoiteControle,
            $activerZoomClic,
            $activerPermaliens,
            '$idInfo',
			'$rechJson',
            $actualisationAuto)
"@

    # passe par un fichier temporaire pour que la carte reste disponible à l'utilisateur le temps de la génération
    New-Item -ItemType Directory -Force -Path "$dossierTravailTemp\SI3P0-Generer-Carte\"
    $carteTemp = "$dossierTravailTemp\SI3P0-Generer-Carte\$(New-Guid).html"

    SIg-Executer-Commande -commande $commande -utilisateur $utilisateur -autresParams '--tuples-only', '--no-align' -sortie $carteTemp -erreur $false
    
    New-Item -ItemType Directory -Force -Path (Split-Path -Path $carte)
    Move-Item $carteTemp $carte -Force
}