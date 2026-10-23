. ("$PSScriptRoot\..\..\API\PowerShell\api_complète.ps1")

$dossierRapports = "$PSScriptRoot\..\Rapports\manuel_cartographier"
$dossierSQL4Map = "$PSScriptRoot\..\SQL.4Map"

# nettoyage préalable
Remove-Item "$dossierRapports\*"

SIg-Executer-Fichier -fichier "$dossierSQL4Map\4Map (drop).sql" -sortie "$dossierRapports\$(Get-Date -Format 'yyyy-MM-dd HH-mm-ss') - 4Map (drop).txt"

# création des vues pour la production des cartes
SIg-Executer-Fichier -fichier "$dossierSQL4Map\4Map (create).sql" -sortie "$dossierRapports\$(Get-Date -Format 'yyyy-MM-dd HH-mm-ss') - 4Map (create).txt"

# ajout des textes d'information pour chacune des cartes
SI3P0-Ajouter-Information-Carte `
    -identifiant 'Ref3V' `
    -texte @'
Cette carte sert de base au référentiel Véloroute et Voies Vertes.
Seuls les tronçons des Euro-Vélo (EV), des Voies Vertes Nationales (V) et des Voies Vertes Départementales (V30) 
sont représentés est dont le CD30 et propriétaire et/ou gestionnaire du réseau.
Leur géométrie est simplifiée comme pour les routes, avec un point de départ et une arrivée.

Les PR sont également présents comme pour le référentiel routier.
Ils servent de référence à la localisation et au calcul de distance au sein de ces itinéraires.

De plus, il est possible d'afficher les tronçons qui complètent les itinéraires et qui ne sont pas sous gestion du CD30.
'@

SI3P0-Ajouter-Information-Carte `
    -identifiant 'Ref3VSMD' `
    -texte @'
A travers le Schéma Des Mobilités, le CD30 a structuré son réseau de Véloroutes et Voies Vertes en référnetiel.
Celui-ci est composé des Euro-Vélo (EV), des Voies Vertes Nationales (V) et des Voies Vertes Départementales (V30).
De plus, des PR sont également présents comme pour le référentiel routier pour pouvoir géolocaliser avec précision toutes parties de ces itinéraires.
'@

SI3P0-Ajouter-Information-Carte `
    -identifiant 'SRT_segment_cyclable' `
    -texte @'
Cette carte présente les tronçons cyclables ouverts du référentiel Véloroutes et Voies Vertes (3V) sous la gestion de SRT.
La catégorisation est faite à partir du type de voie cyclable.
'@

# paramétrage des jobs de génération des cartes
$parametresJobs = [Collections.ArrayList]::new()

[void]$parametresJobs.Add((
    Parametrer-Job-SI3P0-Generer-Carte `
        -sources 'D30_Pr_vv_4Map', 'D30_troncon_ref_3v_CD30', 'D30_troncon_ref_3v_autre_CD30', 'LimiteGestionPER_4Map', 'LimiteGestionUT_4Map' `
        -carte "$si3p0ThematiquesPortailWeb\Référentiel 3V\Cartes dynamiques\Gard - Référentiel Véloroutes et Voies Vertes.html" `
        -titre "Gard - Référentiel Véloroutes et Voies Vertes" `
		-rechJson '1|leafletsearch|PR par N° Itinéraire, Pr+Abs ; 2|leafletsearch|Segment par Nom Itinéraire, Pr+Abs' `
        -idInfo 'Ref3V'))

[void]$parametresJobs.Add((
    Parametrer-Job-SI3P0-Generer-Carte `
        -sources 'SRT_segment_vv_4Map', 'LimiteGestionUT_4Map' `
        -carte "$si3p0ThematiquesPortailWeb\Référentiel 3V\Cartes dynamiques\SRT - Référentiel 3V.html" `
        -titre "Tronçons 3V sous gestion de SRT" `
		-rechJson '1|leafletsearch|itinéraire par n°, nom officiel, portion, segment' `
        -idInfo 'SRT_segment_cyclable'))

[void]$parametresJobs.Add((
    Parametrer-Job-SI3P0-Generer-Carte `
        -sources 'D30_Pr_vv_4Map', 'D30_troncon_ref_3v_sdm' `
        -carte "$si3p0ThematiquesPortailWeb\Référentiel 3V\Cartes dynamiques\SDM - Référentiel Véloroutes et Voies Vertes.html" `
        -titre "Référentiel Véloroutes et Voies Vertes du SDM" `
		-rechJson '1|leafletsearch|PR par N° Itinéraire, Pr+Abs ; 2|leafletsearch|Segment par Nom Itinéraire, Pr+Abs' `
        -idInfo 'Ref3VSMD'))

# exécution des jobs de génération des cartes
Executer-Jobs -parametresJobs $parametresJobs

# nettoyage final
SIg-Executer-Fichier -fichier "$dossierSQL4Map\4Map (drop).sql" -sortie "$dossierRapports\$(Get-Date -Format 'yyyy-MM-dd HH-mm-ss') - 4Map (drop).txt"