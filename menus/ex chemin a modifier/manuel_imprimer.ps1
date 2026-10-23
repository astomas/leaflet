. ("$PSScriptRoot\..\..\API\PowerShell\api_complète.ps1")

$dossierRapports = "$PSScriptRoot\..\Rapports\manuel_imprimer"

# nettoyage préalable
Remove-Item "$dossierRapports\*"

QGisProcess-Imprimer-MiseEnPage `    -projet "$PSScriptRoot\..\QGis\3V.qgz" `    -miseEnPage 'Itinéraire 3V et BC - ArchE' `    -pdf "$si3p0ThematiquesPortailWeb\Référentiel 3V\Cartes statiques\Véloroutes, voies vertes et boucles cyclo-découvertes du Gard - Format Arch E.pdf" `    -sortie "$dossierRapports\$(Get-Date -Format 'yyyy-MM-dd HH-mm-ss') - imprimer Véloroutes, voies vertes et boucles cyclo-découvertes du Gard - Format Arch E.txt"QGisProcess-Imprimer-Atlas `    -projet "$PSScriptRoot\..\QGis\3V.qgz" `    -miseEnPage 'Itinéraire Mode Doux Atlas - ArchE' `    -dossier "$si3p0ThematiquesPortailWeb\Référentiel 3V\Atlas" `    -sortie "$dossierRapports\$(Get-Date -Format 'yyyy-MM-dd HH-mm-ss') - imprimer Atlas Itinéraire des modes doux du Gard - Format Arch E.txt"