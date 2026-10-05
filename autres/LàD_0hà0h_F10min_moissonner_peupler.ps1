. ("$PSScriptRoot\..\..\API\PowerShell\api_complète.ps1")

$dossierDonnees = "$PSScriptRoot\..\Données"
$dossierRapports = "$PSScriptRoot\..\Rapports\LàD_0hà0h_F10min_moissonner_peupler"

# nettoyage préalable
Remove-Item "$dossierDonnees\hydrométrie.sql" -ErrorAction Ignore
Remove-Item "$dossierRapports\*" -ErrorAction Ignore

# recherche des tronçons et stations à moissonner
SIg-Exporter-CSV -requete 'select CodeTronconHydro from TronconHydro' -csv "$dossierRapports\tronçons_hydro.csv"
SIg-Exporter-CSV -requete 'select CodeStationHydro from StationHydro' -csv "$dossierRapports\stations_hydro.csv"

# Chargement des tronçons hydro à partir du fichier CSV
$troncons = Import-Csv "$dossierRapports\tronçons_hydro.csv"

# construction d'un fichier SQL à partir des données issues de Vigicrues et Hubeau
$fichierSQL = "$dossierDonnees\hydrométrie.sql"
$ecriture = [System.IO.StreamWriter]::new($fichierSQL, [Text.UTF8Encoding]::new($true))

$ecriture.WriteLine("set search_path to m, public;")
$ecriture.WriteLine("start transaction;")
$ecriture.WriteLine("")
$ecriture.WriteLine("delete from ReleveHydro;")
$ecriture.WriteLine("")

# Télécharger et parser le fichier GeoJSON
$geojsonUrl = "https://www.vigicrues.gouv.fr/services/InfoVigiCru.geojson"
$geojsonData = Invoke-RestMethod -Uri $geojsonUrl

# Afficher les données brutes (Débogage)
Write-Output "GeoJSON Data:"
Write-Output $geojsonData

# Exploration des données GeoJSON
$features = $geojsonData.features

# Assurez-vous que les propriétés nécessaires existent et concernent votre recherche.
foreach ($feature in $features) {
    $properties = $feature.properties

    $codeTroncon = $properties.CdEntCru
    $typeEntite = $properties.TypEntCru
    
    # Vérifiez si le codeTroncon existe dans le fichier CSV
    if ($troncons.CodeTronconHydro -contains $codeTroncon) {
        if ($typeEntite -eq 8) {
            $codeVigilance = $properties.NivInfViCr
            Write-Output "codeTroncon"
            Write-Output $codeTroncon
            Write-Output "codeVigilance"
            Write-Output $codeVigilance
            
            # mise à jour du niveau de vigilance pour ce tronçon particulier
            $ecriture.WriteLine("update TronconHydro set CodeVigilanceHydro = $codeVigilance where CodeTronconHydro = '$codeTroncon';")
            
            # Affichage des valeurs pour débogage
            Write-Output "Update Statement: update TronconHydro set CodeVigilanceHydro = $codeVigilance where CodeTronconHydro = '$codeTroncon';"
        }
    }
}

$ecriture.WriteLine("")

# pour chaque station hydrométrique
foreach ($codeStation in Import-Csv "$dossierRapports\stations_hydro.csv" -Encoding UTF8 | select -ExpandProperty codestationhydro) {

    $relevesStation = Invoke-RestMethod -Uri "https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr?code_entite=$codeStation&size=6&grandeur_hydro=H,Q&fields=code_station,grandeur_hydro,date_obs,resultat_obs"

    # insertion des relevés
    foreach ($dateReleve in $relevesStation.data | select -Unique date_obs -ExpandProperty date_obs) {
        $ecriture.WriteLine("insert into ReleveHydro (CodeStationHydro, Date) values ('$codeStation', '$dateReleve'::timestamp at time zone 'UTC');")
    }

    # mise à jour de la hauteur
    foreach ($releve in $relevesStation.data | where grandeur_hydro -eq 'H' | select date_obs, resultat_obs) {
        $ecriture.WriteLine("update ReleveHydro set hauteur = $($releve.resultat_obs) where CodeStationHydro = '$codeStation' and Date = '$($releve.date_obs)'::timestamp at time zone 'UTC';")
    }

    # mise à jour du débit
    foreach ($releve in $relevesStation.data | where grandeur_hydro -eq 'Q' | select date_obs, resultat_obs) {
        $ecriture.WriteLine("update ReleveHydro set debit = $($releve.resultat_obs) where CodeStationHydro = '$codeStation' and Date = '$($releve.date_obs)'::timestamp at time zone 'UTC';")
    }

    $ecriture.WriteLine("")
}

$ecriture.WriteLine("commit;")

$ecriture.Close() 
$ecriture = $null

# exécution du fichier SQL construit
SIg-Executer-Fichier -fichier $fichierSQL -sortie "$dossierRapports\$(Get-Date -Format 'yyyy-MM-dd HH-mm-ss') - exécution hydrométrie.sql.txt"