<#
	//// Vigilance crues du Gard (dept 30) pour widget-meteo-crues.js ////

	Vigicrues ne renvoie pas d'en-tete CORS : une page web ne peut pas lire
	InfoVigiCru.geojson elle-meme. Ce script le lit cote serveur et ecrit un
	petit fichier JSON que le widget, lui, peut charger.

	Regle reproduite : la couleur " crues " d'un departement, transmise par le
	SCHAPI a Meteo-France, est le niveau le plus eleve des troncons rattaches a
	ce departement (RIC, annexe 2.a, colonne " Departements concernes par la
	vigilance departementale "). Le SPC peut ajuster ce rattachement en crise ;
	cet ajustement n'est pas publie, il n'est donc pas reproduit ici.

	Execution :
	  - GitHub Actions (.github/workflows/vigicrues-30.yml, PowerShell 7) ;
	  - ou tache planifiee Windows sur le serveur IIS :
	      powershell -NoProfile -File vigicrues-30.ps1 -Sortie D:\site\...\vigicrues-30.json

	Fichier produit (UTF-8 sans BOM) :
	  { "departement": "30", "niveau": 2, "ref": "29092026_10",
	    "date": "2026-09-29T07:52:49Z", "source": "...",
	    "troncons": [ { "code": "GA6", "nom": "Vidourle", "niveau": 2 }, ... ],
	    "absents": [] }
	  niveau : 1 vert, 2 jaune, 3 orange, 4 rouge (NivInfViCr de Vigicrues)
	  date   : heure de la production Vigicrues (UTC), validite 24 h
#>
param(
	[Parameter(Mandatory = $true)]
	[string] $Sortie
)

$ErrorActionPreference = 'Stop'

$URL_VIGICRUES = 'https://www.vigicrues.gouv.fr/services/InfoVigiCru.geojson'

# Troncons rattaches au Gard pour la vigilance departementale.
# Source : RIC du SPC Grand Delta (dec. 2025) et RIC du SPC Garonne-Tarn-Lot,
# annexe 2.a. A revoir a chaque revision de ces RIC.
$TRONCONS_GARD = @(
	'GA1',  # Ceze amont
	'GA2',  # Ceze aval
	'GA3',  # Gardon d'Ales
	'GA4',  # Gardon d'Anduze
	'GA5',  # Gardon aval (" Gardons reunis " dans le RIC)
	'GA6',  # Vidourle (30, 34)
	'GA9',  # Rhone d'Avignon a la mer (30, 13)
	'GA10', # Rhone de Pont-Saint-Esprit a Avignon (30, 84)
	'GA22', # Ardeche aval (07, 30)
	'GA32', # Vistre
	'TL3'   # Haut Tarn, au titre de la Dourbie (12, 30) - SPC Garonne-Tarn-Lot
)

# Windows PowerShell 5.1 n'active pas toujours TLS 1.2, exige par Vigicrues
if ($PSVersionTable.PSEdition -ne 'Core') {
	[Net.ServicePointManager]::SecurityProtocol =
		[Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
}

# Lecture en octets puis decodage UTF-8 explicite : Windows PowerShell 5.1
# peut sinon se tromper d'encodage sur les accents des noms de troncons.
$reponse = Invoke-WebRequest -Uri $URL_VIGICRUES -UseBasicParsing -TimeoutSec 60
$texte = [Text.Encoding]::UTF8.GetString($reponse.RawContentStream.ToArray())
$geo = $texte | ConvertFrom-Json

# Flux vide ou tronque : on s'arrete sans toucher au fichier existant
if (-not $geo.features -or -not $geo.RefInfoVigiCru -or -not $geo.DtHrInfoVigiCru) {
	throw 'Flux Vigicrues inattendu : troncons, reference ou date de production absents'
}

$parCode = @{}
foreach ($f in $geo.features) {
	$parCode[[string]$f.properties.CdEntCru] = $f.properties
}

$troncons = @()
$absents = @()
foreach ($code in $TRONCONS_GARD) {
	$p = $parCode[$code]
	if ($null -eq $p) {
		$absents += $code
		continue
	}
	$troncons += [ordered]@{
		code   = $code
		nom    = [string]$p.lbentcru
		niveau = [int]$p.NivInfViCr
	}
}
if ($troncons.Count -eq 0) {
	throw 'Aucun troncon du Gard dans le flux Vigicrues'
}
if ($absents.Count -gt 0) {
	# Code de troncon disparu du flux : referentiel Vigicrues modifie, liste a revoir
	Write-Warning ('Troncons absents du flux Vigicrues : ' + ($absents -join ', '))
}

$niveau = 1
foreach ($t in $troncons) {
	if ($t.niveau -gt $niveau) { $niveau = $t.niveau }
}

# PowerShell 7 convertit deja les dates ISO en [datetime] (heure locale) ;
# Windows PowerShell 5.1 laisse une chaine. On ramene les deux cas en UTC.
$dateProd = $geo.DtHrInfoVigiCru
if ($dateProd -is [datetime]) {
	$dateProd = $dateProd.ToUniversalTime()
} else {
	$dateProd = [DateTimeOffset]::Parse([string]$dateProd, [Globalization.CultureInfo]::InvariantCulture).UtcDateTime
}

$resultat = [ordered]@{
	departement = '30'
	niveau      = $niveau
	ref         = [string]$geo.RefInfoVigiCru
	date        = $dateProd.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [Globalization.CultureInfo]::InvariantCulture)
	source      = $URL_VIGICRUES
	troncons    = $troncons
	absents     = $absents
}
$json = $resultat | ConvertTo-Json -Depth 4

# Ecriture dans un fichier temporaire puis renommage : le widget ne lit
# jamais un fichier a moitie ecrit.
$cible = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Sortie)
$temp = Join-Path (Split-Path -Parent $cible) ('.vigicrues-30.' + [guid]::NewGuid().ToString('N') + '.tmp')
[IO.File]::WriteAllText($temp, $json, (New-Object Text.UTF8Encoding $false))
Move-Item -LiteralPath $temp -Destination $cible -Force

Write-Host ('Vigilance crues Gard : niveau ' + $niveau + ' (production ' + $resultat.ref + ', ' + $resultat.date + ')')
