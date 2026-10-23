# -----------------------------------------------------------------------------
# Constantes
# -----------------------------------------------------------------------------

$email_generique = 'si3p0@gard.fr'
$email_contact = 'valentin.bouvet@gard.fr'

if ($env:COMPUTERNAME.ToLower() -eq 'srw-si3p0') {
    $racinePostgreSQL = 'C:\Program Files\PostgreSQL\15'
    $racineQGis = 'C:\Program Files\QGIS 3.40.8'
    $racineOracle = 'C:\Logiciel\Ora12c'
    $qgisProcess = Get-ChildItem "$env:ProgramFiles\QGIS*\bin\qgis_process-qgis*.bat" | Sort-Object -Property FullName | select -Last 1 -ExpandProperty FullName # wilcard pour traiter le cas des versions LTR
}
else {
    $racinePostgreSQL = '\\si3p0\PostgreSQL'
    $racineQGis = '\\si3p0\QGIS'
    $racineOracle = 'C:\App\Ora11g'
    $qgisProcess = Get-ChildItem "C:\App\Logiciel\QGIS*\bin\qgis_process-qgis*.bat" | Sort-Object -Property FullName | select -Last 1 -ExpandProperty FullName # wilcard pour traiter le cas des versions LTR
}

# variables d'environnement
$Env:PGCLIENTENCODING = 'UTF8'
$Env:GDAL_DATA = "$racineQGis\apps\gdal\share\gdal\"

# chemin vers un répertoire de travail temporaire
# pour le bon fonctionnement de certaines fonctions, il ne doit pas y avoir d'accent dans le chemin
$dossierTravailTemp = "$env:TEMP\si3p0"

# chemins vers les outils PostgreSQL
$psql = "$racinePostgreSQL\bin\psql.exe"
$pgdump = "$racinePostgreSQL\bin\pg_dump.exe"
$pgsql2shp = "$racinePostgreSQL\bin\pgsql2shp.exe"
$shp2pgsql = "$racinePostgreSQL\bin\shp2pgsql.exe"
$raster2pgsql = "$racinePostgreSQL\bin\raster2pgsql.exe"

# chemins vers les outils et librairies Oracle
$sqlplus = "$racineOracle\Product\bin\sqlplus.exe"
$OracleDataAccessLib = "$racineOracle\Product\odp.net\bin\4\Oracle.DataAccess.dll"

# chemin vers les outils QGIS/OSGEO
$ogr2ogr = "$racineQGis\bin\ogr2ogr.exe"


# chemin vers 7-Zip
$7z = "$env:ProgramFiles\7-Zip\7z.exe"

# chemin vers Mapillary Tools
$mapillaryTools = "$PSScriptRoot\..\Outils\mapillary_tools-0.9.4-win-64bit.exe"

# chemin vers un navigateur basé sur Chromium (Google Chrome, Microsoft Edge, ...)
#$chromium = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
$chromium = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"

# serveur e-mail sortant
$serveurSMTP = 'smtpsys.intra.cg30.fr'

# SRID par défaut
$sridDefaut = '2154'