. ("$PSScriptRoot\..\..\API\PowerShell\api_complète.ps1")

$dossierDonnees = "$PSScriptRoot\..\Données"
$dossierRapports = "$PSScriptRoot\..\Rapports\LàD_0hà0h_F10min_moissonner_peupler"
$dossierLogsHubeau = "$PSScriptRoot\..\Rapports\Temps_Hubeau"

# nettoyage préalable
Remove-Item "$dossierDonnees\hydrométrie.sql" -ErrorAction Ignore
Remove-Item "$dossierRapports\*" -ErrorAction Ignore

# préparation du journal des temps Hubeau
$dateNomLogAPI = Get-Date -Format "yyyy-MM-dd HH-mm-ss"
$fichierLogAPI = "$dossierLogsHubeau\$dateNomLogAPI - temps Hubeau global - EN COURS.txt"
$tempsTotalHubeau = 0.0

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

# préparation de l'appel global Hubeau sur les dernières 24 heures
$listeCodes = $codesStations -join ","
$dateDebut = (Get-Date).ToUniversalTime().AddHours(-24).ToString("yyyy-MM-ddTHH:mm:ssZ")

$uriHubeau = "https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr" +
             "?code_entite=$listeCodes" +
             "&date_debut_obs=$dateDebut" +
             "&size=20000" +
             "&sort=desc" +
             "&grandeur_hydro=H,Q" +
             "&fields=code_station,grandeur_hydro,date_obs,resultat_obs"

Afficher-Message-Date -message "Début de l'appel global API Hubeau."

$relevesToutesStations = @()
$appelGlobalReussi = $false
$chronoGlobal = [System.Diagnostics.Stopwatch]::StartNew()

try {
    # première page
    $reponseHubeau = Invoke-RestMethod -Uri $uriHubeau -ErrorAction Stop
    $relevesToutesStations = @($reponseHubeau.data)

    # pages suivantes si le volume dépasse 20 000 résultats
    while ($reponseHubeau.next) {
        Afficher-Message-Date -message "Récupération d'une page supplémentaire API Hubeau."
        $reponseHubeau = Invoke-RestMethod -Uri $reponseHubeau.next -ErrorAction Stop
        $relevesToutesStations += @($reponseHubeau.data)
    }

    $appelGlobalReussi = $true
}
catch {
    Afficher-Message-Date -message "Échec de l'appel global API Hubeau : $($_.Exception.Message)"
    Afficher-Message-Date -message "Bascule vers les appels individuels de secours."
}
finally {
    $chronoGlobal.Stop()
    $tempsTotalHubeau += $chronoGlobal.Elapsed.TotalSeconds
}

$ligneLog = "{0} - Appel global Hubeau : {1:N2} seconde(s), {2} relevé(s) reçu(s), succès : {3}" -f `
    (Get-Date -Format "yyyy/MM/dd HH:mm:ss"), `
    $chronoGlobal.Elapsed.TotalSeconds, `
    $relevesToutesStations.Count, `
    $appelGlobalReussi

$ligneLog | Tee-Object -FilePath $fichierLogAPI -Append | Write-Output

# traitement de chaque station
foreach ($codeStation in $codesStations) {

    # six relevés les plus récents trouvés dans l'appel global
    $donneesStation = @(
        $relevesToutesStations |
            Where-Object { $_.code_station -eq $codeStation } |
            Sort-Object { [datetime]$_.date_obs } -Descending |
            Select-Object -First 6
    )

    # appel individuel de secours si l'appel global a échoué
    # ou si moins de six relevés existent sur les dernières 24 heures
    if (!$appelGlobalReussi -or $donneesStation.Count -lt 6) {
        $nombreTrouve = $donneesStation.Count

        Afficher-Message-Date -message "Station $codeStation : $nombreTrouve relevé(s) disponible(s). Appel individuel de secours."

        $chronoStation = [System.Diagnostics.Stopwatch]::StartNew()

        $uriStation = "https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr" +
                      "?code_entite=$codeStation" +
                      "&size=6" +
                      "&grandeur_hydro=H,Q" +
                      "&fields=code_station,grandeur_hydro,date_obs,resultat_obs"

        $reponseIndividuelle = Invoke-RestMethod -Uri $uriStation

        $chronoStation.Stop()
        $tempsTotalHubeau += $chronoStation.Elapsed.TotalSeconds
        $donneesStation = @($reponseIndividuelle.data)

        $ligneLog = "{0} - Appel individuel Hubeau station {1} : {2:N2} seconde(s)" -f `
            (Get-Date -Format "yyyy/MM/dd HH:mm:ss"), `
            $codeStation, `
            $chronoStation.Elapsed.TotalSeconds

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
    ("Temps de l'appel GeoJSON Vigicrues : {0:N2} seconde(s)" -f $chronoGeoJSON.Elapsed.TotalSeconds)
) | Tee-Object -FilePath $fichierLogAPI -Append | Write-Output

# le nom final contient le temps total Hubeau
$tempsHubeauNom = $tempsTotalHubeau.ToString("0.00", [System.Globalization.CultureInfo]::InvariantCulture)
$fichierLogAPIFinal = "$dossierLogsHubeau\$dateNomLogAPI - temps Hubeau global $tempsHubeauNom s.txt"
Move-Item -Path $fichierLogAPI -Destination $fichierLogAPIFinal -Force

Write-Output "Log des temps API : $fichierLogAPIFinal"


$ecriture.WriteLine("commit;")
$ecriture.Close()
$ecriture = $null

# exécution du fichier SQL construit
SIg-Executer-Fichier -fichier $fichierSQL -sortie "$dossierRapports\$(Get-Date -Format 'yyyy-MM-dd HH-mm-ss') - exécution hydrométrie.sql.txt"
