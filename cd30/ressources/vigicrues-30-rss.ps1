<#
	//// Vigilance crues du Gard (dept 30) pour widget-meteo-crues.js ////

	Vigicrues ne renvoie pas d'en-tete CORS : une page web ne peut pas lire ses
	flux elle-meme. Ce script lit cote serveur le flux RSS de vigilance des
	troncons du Gard et ecrit un petit fichier JSON que le widget peut charger.

	Regle reproduite : la couleur " crues " d'un departement, transmise par le
	SCHAPI a Meteo-France, est le niveau le plus eleve des troncons rattaches a
	ce departement (RIC, annexe 2.a, colonne " Departements concernes par la
	vigilance departementale "). Le SPC peut ajuster ce rattachement en crise ;
	cet ajustement n'est pas publie, il n'est donc pas reproduit ici.

	Execution :
	  - GitHub Actions (.github/workflows/vigicrues-30.yml, PowerShell 7) ;
	  - ou tache planifiee Windows sur le serveur IIS :
	      powershell -NoProfile -File vigicrues-30-rss.ps1 -Sortie D:\site\...\vigicrues-30.json

	Fichier produit (UTF-8 sans BOM) :
	  { "departement": "30", "niveau": 2, "ref": "2026-09-29T14:33:47+02:00",
	    "date": "2026-09-29T14:33:47+02:00", "source": "...",
	    "troncons": [ { "code": "GA6", "nom": "Vidourle", "niveau": 2 }, ... ],
	    "absents": [] }
	  niveau : 1 vert, 2 jaune, 3 orange, 4 rouge (couleur donnee par Vigicrues)
	  date   : mise a jour Vigicrues la plus recente des troncons, a l'heure de Paris
	           avec son decalage (+02:00 en ete, +01:00 en hiver), validite 24 h
	  ref    : identique a date (le flux RSS n'a pas de reference de production)
#>
param(
	[Parameter(Mandatory = $true)]
	[string] $Sortie
)

$ErrorActionPreference = 'Stop'

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

# Flux RSS "niveau de vigilance d'un ensemble de troncons" (page Flux RSS de
# vigicrues.gouv.fr) : ne renvoie que les troncons demandes, environ 15 Ko,
# au lieu des 2,2 Mo de InfoVigiCru.geojson (toute la France, geometries comprises).
$URL_VIGICRUES = 'https://www.vigicrues.gouv.fr/territoire/rss?CdEntVigiCru=' + ($TRONCONS_GARD -join ',')

# Windows PowerShell 5.1 n'active pas toujours TLS 1.2, exige par Vigicrues
if ($PSVersionTable.PSEdition -ne 'Core') {
	[Net.ServicePointManager]::SecurityProtocol =
		[Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
}

# Lecture en octets puis decodage UTF-8 explicite : Windows PowerShell 5.1
# peut sinon se tromper d'encodage sur les accents des noms de troncons.
$reponse = Invoke-WebRequest -Uri $URL_VIGICRUES -UseBasicParsing -TimeoutSec 60
$texte = [Text.Encoding]::UTF8.GetString($reponse.RawContentStream.ToArray())

# Parametre refuse ou panne : Vigicrues renvoie autre chose que du XML, la
# conversion echoue et le script s'arrete sans toucher au fichier existant.
$rss = [xml]$texte
# SelectNodes et non $rss.rss.channel.item : sans element <item>, ".item"
# designerait l'indexeur de l'objet XML au lieu de renvoyer une liste vide.
$items = @($rss.SelectNodes('/rss/channel/item'))
if ($items.Count -eq 0) {
	throw 'Flux Vigicrues inattendu : aucun troncon dans le flux RSS'
}

$NIVEAUX = @{ vert = 1; jaune = 2; orange = 3; rouge = 4 }
$parCode = @{}
foreach ($item in $items) {
	# Les champs structures sont dans la description : nom, (code), couleur.
	# Le lien, lui, ne porte pas le code des troncons en vert.
	# "tron.on" : le point remplace le c cedille (script en ASCII pur).
	$desc = [string]$item.description
	if ($desc -notmatch 'Nom du tron.on : <b>([^<]*)</b> \(([A-Z0-9]+)\)') {
		throw ('Element RSS illisible (nom ou code) : ' + $item.title)
	}
	$nom = $Matches[1]
	$code = $Matches[2]
	# Couleur inconnue (libelle modifie par Vigicrues) : arret plutot qu'un niveau faux
	if ($desc -notmatch 'Couleur de vigilance crues du tron.on : <b>([a-z]+)</b>' -or -not $NIVEAUX.ContainsKey($Matches[1])) {
		throw ('Couleur de vigilance illisible pour ' + $code + ' : ' + $item.title)
	}
	$parCode[$code] = @{
		nom    = $nom
		niveau = $NIVEAUX[$Matches[1]]
		# pubDate (format RSS, ex. "Tue, 29 Sep 2026 14:33:47 +0200") :
		# heure de mise a jour de la page du territoire, gardee a l'heure de Paris
		date   = [DateTimeOffset]::ParseExact([string]$item.pubDate, 'ddd, dd MMM yyyy HH:mm:ss zzz',
			[Globalization.CultureInfo]::InvariantCulture)
	}
}

$troncons = @()
$absents = @()
$dateProd = [DateTimeOffset]::MinValue
foreach ($code in $TRONCONS_GARD) {
	$p = $parCode[$code]
	if ($null -eq $p) {
		$absents += $code
		continue
	}
	$troncons += [ordered]@{
		code   = $code
		nom    = $p.nom
		niveau = $p.niveau
	}
	if ($p.date -gt $dateProd) { $dateProd = $p.date }
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

$dateIso = $dateProd.ToString("yyyy-MM-dd'T'HH:mm:sszzz", [Globalization.CultureInfo]::InvariantCulture)

$resultat = [ordered]@{
	departement = '30'
	niveau      = $niveau
	ref         = $dateIso
	date        = $dateIso
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
