. ("$PSScriptRoot\..\..\API\PowerShell\api_complète.ps1")

$dossierDonnees = "$PSScriptRoot\..\Données"
$dossierRapports = "$PSScriptRoot\..\Rapports\LàD_0hà0h_F10min_moissonner_peupler"
$dossierLogsHubeau = "$PSScriptRoot\..\Rapports\Temps_Hubeau"

# fenêtre de l'appel global : Hub'Eau met environ 4 ms par relevé renvoyé.
# 6 h donnent 6 relevés à chaque station active (moins d'1 h au pas de 5 min,
# 3 h 40 pour la station au pas horaire lors des mesures du 05/10/2026)
$heuresFenetre = 6
$nombreReleves = 6

# nettoyage préalable
Remove-Item "$dossierDonnees\hydrométrie.sql" -ErrorAction Ignore
Remove-Item "$dossierRapports\*" -ErrorAction Ignore

# préparation du journal des temps Hubeau
New-Item -ItemType Directory -Path $dossierLogsHubeau -Force | Out-Null
$dateNomLogAPI = Get-Date -Format "yyyy-MM-dd HH-mm-ss"
$fichierLogAPI = "$dossierLogsHubeau\$dateNomLogAPI - temps Hubeau global - EN COURS.txt"
$tempsTotalHubeau = 0.0
$nombreAppelsHubeau = 0
$nombreSecours = 0

# recherche des tronçons et stations à moissonner
SIg-Exporter-CSV -requete 'select CodeTronconHydro from TronconHydro' -csv "$dossierRapports\tronçons_hydro.csv"
SIg-Exporter-CSV -requete 'select CodeStationHydro from StationHydro' -csv "$dossierRapports\stations_hydro.csv"

# chargement des tronçons hydro à partir du fichier CSV
$troncons = Import-Csv "$dossierRapports\tronçons_hydro.csv"

# construction d'un fichier SQL à partir des données issues de Vigicrues et Hubeau
$fichierSQL = "$dossierDonnees\hydrométrie.sql"
$ecriture = [System.IO.StreamWriter]::new($fichierSQL, [Text.UTF8Encoding]::new($true))

$ecriture.WriteLine("set search_path to m, public;")
$ecriture.WriteLine("start transaction;")
$ecriture.WriteLine("")
$ecriture.WriteLine("delete from ReleveHydro;")
$ecriture.WriteLine("")

# télécharger et parser le fichier GeoJSON
$geojsonUrl = "https://www.vigicrues.gouv.fr/services/InfoVigiCru.geojson"

$chronoGeoJSON = [System.Diagnostics.Stopwatch]::StartNew()
$geojsonData = Invoke-RestMethod -Uri $geojsonUrl
$chronoGeoJSON.Stop()

$ligneLog = "{0} - API GeoJSON Vigicrues : {1:N2} seconde(s)" -f `
    (Get-Date -Format "yyyy/MM/dd HH:mm:ss"), `
    $chronoGeoJSON.Elapsed.TotalSeconds

$ligneLog | Tee-Object -FilePath $fichierLogAPI -Append | Write-Output

# afficher les données brutes (débogage)
Write-Output "GeoJSON Data:"
Write-Output $geojsonData

# exploration des données GeoJSON
$features = $geojsonData.features

foreach ($feature in $features) {
    $properties = $feature.properties

    $codeTroncon = $properties.CdEntCru
    $typeEntite = $properties.TypEntCru

    # vérifier si le code tronçon existe dans le fichier CSV
    if ($troncons.CodeTronconHydro -contains $codeTroncon) {
        if ($typeEntite -eq 8) {
            $codeVigilance = $properties.NivInfViCr

            Write-Output "codeTroncon"
            Write-Output $codeTroncon
            Write-Output "codeVigilance"
            Write-Output $codeVigilance

            # mise à jour du niveau de vigilance pour ce tronçon particulier
            $ecriture.WriteLine("update TronconHydro set CodeVigilanceHydro = $codeVigilance where CodeTronconHydro = '$codeTroncon';")

            # affichage des valeurs pour débogage
            Write-Output "Update Statement: update TronconHydro set CodeVigilanceHydro = $codeVigilance where CodeTronconHydro = '$codeTroncon';"
        }
    }
}

$ecriture.WriteLine("")

# chargement des stations hydrométriques
$codesStations = @(
    Import-Csv "$dossierRapports\stations_hydro.csv" -Encoding UTF8 |
        Select-Object -ExpandProperty codestationhydro
)

# une liste de relevés par station, remplie en un seul passage sur la réponse globale
$relevesParStation = @{}
foreach ($codeStation in $codesStations) {
    $relevesParStation[$codeStation] = [System.Collections.Generic.List[object]]::new()
}

# préparation de l'appel global Hubeau sur les dernières heures
$dateDebut = (Get-Date).ToUniversalTime().AddHours(-$heuresFenetre).ToString("yyyy-MM-ddTHH:mm:ssZ", [System.Globalization.CultureInfo]::InvariantCulture)

$uriHubeau = "https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr" +
             "?code_entite=$($codesStations -join ',')" +
             "&date_debut_obs=$dateDebut" +
             "&size=20000" +
             "&sort=desc" +
             "&grandeur_hydro=H,Q" +
             "&fields=code_station,grandeur_hydro,date_obs,resultat_obs"

$appelGlobalReussi = $false

# deux essais : Hub'Eau renvoie parfois une erreur 503 passagère, et un échec
# définitif coûte 42 appels individuels.
# aucun appel sans station : un code_entite vide renverrait toute la France
for ($essai = 1; $essai -le 2 -and !$appelGlobalReussi -and $codesStations.Count -gt 0; $essai++) {

    Afficher-Message-Date -message "Début de l'appel global API Hubeau (essai $essai)."

    $nombreRecus = 0
    $chronoGlobal = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        $uri = $uriHubeau

        # pages suivantes si le volume dépasse 20 000 résultats
        while ($uri) {
            $nombreAppelsHubeau++
            $reponseHubeau = Invoke-RestMethod -Uri $uri -ErrorAction Stop

            # l'API trie par date décroissante : les premiers relevés rencontrés
            # pour une station sont ses plus récents
            foreach ($releve in $reponseHubeau.data) {
                $liste = $relevesParStation[$releve.code_station]

                # $null -ne : une liste vide vaut $false en PowerShell
                if ($null -ne $liste -and $liste.Count -lt $nombreReleves) {
                    $liste.Add($releve)
                }
            }

            $nombreRecus += @($reponseHubeau.data).Count
            $uri = $reponseHubeau.next
        }

        $appelGlobalReussi = $true
    }
    catch {
        Afficher-Message-Date -message "Échec de l'appel global API Hubeau : $($_.Exception.Message)"

        # pas de page partielle : l'essai suivant repart de zéro
        foreach ($liste in $relevesParStation.Values) {
            $liste.Clear()
        }
    }
    finally {
        $chronoGlobal.Stop()
        $tempsTotalHubeau += $chronoGlobal.Elapsed.TotalSeconds
    }

    $ligneLog = "{0} - Appel global Hubeau ({1} h), essai {2} : {3:N2} seconde(s), {4} relevé(s) reçu(s), succès : {5}" -f `
        (Get-Date -Format "yyyy/MM/dd HH:mm:ss"), `
        $heuresFenetre, `
        $essai, `
        $chronoGlobal.Elapsed.TotalSeconds, `
        $nombreRecus, `
        $appelGlobalReussi

    $ligneLog | Tee-Object -FilePath $fichierLogAPI -Append | Write-Output

    if (!$appelGlobalReussi -and $essai -lt 2) {
        Start-Sleep -Seconds 10
    }
}

# traitement de chaque station
foreach ($codeStation in $codesStations) {

    $donneesStation = $relevesParStation[$codeStation]

    # appel individuel de secours si moins de six relevés dans la fenêtre
    # (station muette, pas de temps long ou échec de l'appel global)
    if ($donneesStation.Count -lt $nombreReleves) {

        Afficher-Message-Date -message "Station $codeStation : $($donneesStation.Count) relevé(s) dans la fenêtre. Appel individuel de secours."

        $uriStation = "https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr" +
                      "?code_entite=$codeStation" +
                      "&size=$nombreReleves" +
                      "&grandeur_hydro=H,Q" +
                      "&fields=code_station,grandeur_hydro,date_obs,resultat_obs"

        # vidé avant l'appel : en cas d'échec, rien n'est écrit pour cette station
        # au lieu de réutiliser les relevés de la station précédente
        $donneesStation = @()
        $chronoStation = [System.Diagnostics.Stopwatch]::StartNew()

        try {
            $donneesStation = @((Invoke-RestMethod -Uri $uriStation -ErrorAction Stop).data)
        }
        catch {
            Afficher-Message-Date -message "Échec de l'appel individuel station $codeStation : $($_.Exception.Message)"
        }

        $chronoStation.Stop()
        $tempsTotalHubeau += $chronoStation.Elapsed.TotalSeconds
        $nombreSecours++
        $nombreAppelsHubeau++

        $ligneLog = "{0} - Appel individuel Hubeau station {1} : {2:N2} seconde(s), {3} relevé(s)" -f `
            (Get-Date -Format "yyyy/MM/dd HH:mm:ss"), `
            $codeStation, `
            $chronoStation.Elapsed.TotalSeconds, `
            $donneesStation.Count

        $ligneLog | Tee-Object -FilePath $fichierLogAPI -Append | Write-Output
    }

    # insertion des relevés
    foreach ($dateReleve in $donneesStation | Select-Object -Unique date_obs -ExpandProperty date_obs) {
        $ecriture.WriteLine("insert into ReleveHydro (CodeStationHydro, Date) values ('$codeStation', '$dateReleve'::timestamp at time zone 'UTC');")
    }

    # mise à jour de la hauteur
    foreach ($releve in $donneesStation | Where-Object grandeur_hydro -eq 'H' | Select-Object date_obs, resultat_obs) {
        $ecriture.WriteLine("update ReleveHydro set hauteur = $($releve.resultat_obs) where CodeStationHydro = '$codeStation' and Date = '$($releve.date_obs)'::timestamp at time zone 'UTC';")
    }

    # mise à jour du débit
    foreach ($releve in $donneesStation | Where-Object grandeur_hydro -eq 'Q' | Select-Object date_obs, resultat_obs) {
        $ecriture.WriteLine("update ReleveHydro set debit = $($releve.resultat_obs) where CodeStationHydro = '$codeStation' and Date = '$($releve.date_obs)'::timestamp at time zone 'UTC';")
    }

    $ecriture.WriteLine("")
}

# synthèse du temps Hubeau
@(
    ""
    "SYNTHESE"
    ("Temps total Hubeau, appel global et éventuels secours : {0:N2} seconde(s)" -f $tempsTotalHubeau)
    ("Appels Hubeau : {0}, dont {1} appel(s) individuel(s) de secours" -f $nombreAppelsHubeau, $nombreSecours)
    ("Temps de l'appel GeoJSON Vigicrues : {0:N2} seconde(s)" -f $chronoGeoJSON.Elapsed.TotalSeconds)
) | Tee-Object -FilePath $fichierLogAPI -Append | Write-Output

# le nom final contient le temps total Hubeau
$tempsHubeauNom = $tempsTotalHubeau.ToString("0", [System.Globalization.CultureInfo]::InvariantCulture)
$fichierLogAPIFinal = "$dossierLogsHubeau\$dateNomLogAPI - temps Hubeau global $tempsHubeauNom s.txt"
Move-Item -Path $fichierLogAPI -Destination $fichierLogAPIFinal -Force

Write-Output "Log des temps API : $fichierLogAPIFinal"


$ecriture.WriteLine("commit;")
$ecriture.Close()
$ecriture = $null

# exécution du fichier SQL construit
SIg-Executer-Fichier -fichier $fichierSQL -sortie "$dossierRapports\$(Get-Date -Format 'yyyy-MM-dd HH-mm-ss') - exécution hydrométrie.sql.txt"
