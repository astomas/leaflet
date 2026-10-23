. ("$PSScriptRoot\API\PowerShell\api_complète.ps1")
. ("$PSScriptRoot\API\PowerShell\constantes_privées.ps1")

# Décommenter au moins 1 thematique

#Executer-FichierPS -chemin "$si3p0DossierRacine\si3p0\SAJAC\PowerShell\LàD_4h.ps1"
#Executer-FichierPS -chemin "$si3p0DossierRacine\si3p0\ADPR\PowerShell\LàD_4h.ps1"
#Executer-FichierPS -chemin "$si3p0DossierRacine\si3p0\Exploitation et trafic routier\PowerShell\LàD_4h.ps1"
#Executer-FichierPS -chemin "$si3p0DossierRacine\si3p0\Fiches cantonales\PowerShell\LàD_4h.ps1"
#Executer-FichierPS -chemin "$si3p0DossierRacine\si3p0\PICH\PowerShell\LàD_4h.ps1"
#Executer-FichierPS -chemin "$si3p0DossierRacine\si3p0\Patrimoine foncier et bâti\PowerShell\LàD_4h.ps1" # Patrimoine foncier et bâti avant RH pour avoir la bonne localisation des résidences administratives
#Executer-FichierPS -chemin "$si3p0DossierRacine\si3p0\RH\PowerShell\LàD_4h.ps1"
#Executer-FichierPS -chemin "$si3p0DossierRacine\si3p0\THD\PowerShell\LàD_4h.ps1"
#Executer-FichierPS -chemin "$si3p0DossierRacine\si3p0\Waze\PowerShell\LàD_4h.ps1"
#Executer-FichierPS -chemin "$si3p0DossierRacine\si3p0\Fauchage\PowerShell\LàD_4h.ps1"

# génération des pages du portail
SI3P0-Generer-Thematiques-Portail
#SI3P0-Generer-Accueil-Portail -exclure 'En cours', 'DGADS', 'RH - Organisation'