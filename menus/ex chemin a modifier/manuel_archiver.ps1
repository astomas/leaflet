. ("$PSScriptRoot\..\..\API\PowerShell\api_complète.ps1")

# choix de la base de données d'exécution
$bddProduction = $sigBDD
$bddQualification = "$($bddProduction)_qualif"

$bdd = Choisir-Option 'Merci de choisir la base de données sur laquelle l''archivage doit être fait.' -options $bddProduction, $bddQualification

$dateVersion = Read-Host -Prompt 'Merci d''indiquer la date de la version courante pour le nommage des archives (format : AAAAMM)'
$datePrecVersion = Read-Host -Prompt 'Merci d''indiquer la date de la précédente version qui doit logiquement être antérieure de 3 mois à la version courante (format : AAAAMM)'

# création des archives
SIg-Effacer-Table -bdd $bdd -table "archive.pr_vv_v$dateVersion"
SIg-Effacer-Table -bdd $bdd -table "archive.SegmentCyclable_v$dateVersion"
SIg-Effacer-Table -bdd $bdd -table "archive.PortionCyclable_v$dateVersion"
SIg-Effacer-Table -bdd $bdd -table "archive.ItineraireCyclable_v$dateVersion"
SIg-Effacer-Table -bdd $bdd -table "archive.SegmentCyclable_PortionCyclable_v$dateVersion"
SIg-Effacer-Table -bdd $bdd -table "archive.PortionCyclable_ItineraireCyclable_v$dateVersion"
SIg-Effacer-Table -bdd $bdd -table "archive.SegmentCyclable_Proprietaire_v$dateVersion"
SIg-Effacer-Table -bdd $bdd -table "archive.SegmentCyclable_Gestionnaire_v$dateVersion"

SIg-Executer-Commande -bdd $bdd -commande "create table archive.pr_vv_v$dateVersion as select * from m.pr_vv"
SIg-Executer-Commande -bdd $bdd -commande "create table archive.SegmentCyclable_v$dateVersion as select * from m.SegmentCyclable"
SIg-Executer-Commande -bdd $bdd -commande "create table archive.PortionCyclable_v$dateVersion as select * from m.PortionCyclable"
SIg-Executer-Commande -bdd $bdd -commande "create table archive.ItineraireCyclable_v$dateVersion as select * from m.ItineraireCyclable"
SIg-Executer-Commande -bdd $bdd -commande "create table archive.SegmentCyclable_PortionCyclable_v$dateVersion as select * from m.SegmentCyclable_PortionCyclable"
SIg-Executer-Commande -bdd $bdd -commande "create table archive.PortionCyclable_ItineraireCyclable_v$dateVersion as select * from m.PortionCyclable_ItineraireCyclable"
SIg-Executer-Commande -bdd $bdd -commande "create table archive.SegmentCyclable_Proprietaire_v$dateVersion as select * from m.SegmentCyclable_Proprietaire"
SIg-Executer-Commande -bdd $bdd -commande "create table archive.SegmentCyclable_Gestionnaire_v$dateVersion as select * from m.SegmentCyclable_Gestionnaire"

# suppression des vues sur l'archive courante et précédente
SIg-Effacer-Vue -bdd $bdd -vue 'archive.pr_vv_vprec'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.SegmentCyclable_vprec'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.PortionCyclable_vprec'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.ItineraireCyclable_vprec'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.SegmentCyclable_PortionCyclable_vprec'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.PortionCyclable_ItineraireCyclable_vprec'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.SegmentCyclable_Proprietaire_vprec'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.SegmentCyclable_Gestionnaire_vprec'

SIg-Effacer-Vue -bdd $bdd -vue 'archive.pr_vv_vmax'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.SegmentCyclable_vmax'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.PortionCyclable_vmax'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.ItineraireCyclable_vmax'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.SegmentCyclable_PortionCyclable_vmax'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.PortionCyclable_ItineraireCyclable_vmax'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.SegmentCyclable_Proprietaire_vmax'
SIg-Effacer-Vue -bdd $bdd -vue 'archive.SegmentCyclable_Gestionnaire_vmax'

# création des vues sur l'archive courante et précédente
SIg-Executer-Commande -bdd $bdd -commande "create view archive.pr_vv_vprec as select * from archive.pr_v$datePrecVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.SegmentCyclable_vprec as select * from archive.troncon_v$datePrecVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.PortionCyclable_vprec as select * from archive.PortionCyclable_v$datePrecVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.ItineraireCyclable_vprec as select * from archive.ItineraireCyclable_v$datePrecVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.SegmentCyclable_PortionCyclable_vprec as select * from archive.SegmentCyclable_PortionCyclable_v$datePrecVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.SegmentCyclable_Proprietaire_vprec as select * from archive.SegmentCyclable_Proprietaire_v$datePrecVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.SegmentCyclable_Gestionnaire_vprec as select * from archive.SegmentCyclable_Gestionnaire_v$datePrecVersion"

SIg-Executer-Commande -bdd $bdd -commande "create view archive.pr_vv_vmax as select * from archive.pr_v$dateVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.SegmentCyclable_vmax as select * from archive.troncon_v$dateVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.PortionCyclable_vmax as select * from archive.PortionCyclable_v$dateVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.SegmentCyclable_PortionCyclable_vmax as select * from archive.SegmentCyclable_PortionCyclable_v$datePrecVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.SegmentCyclable_Proprietaire_vmax as select * from archive.SegmentCyclable_Proprietaire_v$datePrecVersion"
SIg-Executer-Commande -bdd $bdd -commande "create view archive.SegmentCyclable_Gestionnaire_vmax as select * from archive.SegmentCyclable_Gestionnaire_v$datePrecVersion"