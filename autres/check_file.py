from pathlib import Path
from datetime import datetime, timedelta
import csv
import smtplib
from email.message import EmailMessage


# Chemin de base
RACINE = Path(
    r"\\intra.cg30.fr\DGAML\Dossiers\MSI\Partages\SI3P0-P0446\Site\Thématiques"
)

# parametres mail
SERVEUR_SMTP = "smtpsys.intra.cg30.fr"
PORT_SMTP = 25

EXPEDITEUR = "alerte_si3p0@gard.fr"
DESTINATAIRE = "thomas.fontaine@gard.fr"

# Emplacement du rapport CSV
DOSSIER_RAPPORT = Path(
    r"\\intra.cg30.fr\DGAML\Dossiers\MSI\Partages\SI3P0-P0446\Rapports\csv"
)
# conservation csv sur 6 mois glissants
DATE_RAPPORT = datetime.now().strftime("%d-%m-%Y")
RAPPORT = DOSSIER_RAPPORT / f"rapport_cartes_dynamiques_{DATE_RAPPORT}.csv"
DUREE_CONSERVATION_RAPPORTS = 183

# Seuils d'alerte : fichier vieux de 48h, fichier < 1ko , geojson vide
LIMITE_DATE = datetime.now() - timedelta(days=2)
LIMITE_TAILLE = 1024

CHEMIN_BASE = Path(
    r"\\intra.cg30.fr\DGAML\Dossiers\MSI\Partages\SI3P0-P0446"
)
CHEMINS_EXCLUS_ANCIENNETE = [
    # maj manuelle
        Path(CHEMIN_BASE, "Site/Thématiques/Exploitation et trafic routier/PPBE"),
        Path(CHEMIN_BASE, "Site/Thématiques/Entretien voies vertes"),  
        Path(CHEMIN_BASE, "Site/Thématiques/Exploitation et trafic 3V"),  
        Path(CHEMIN_BASE, "Site/Thématiques/Référentiel 3V"),
        Path(CHEMIN_BASE, "Site/Thématiques/référentiel routier"),
        Path(CHEMIN_BASE, "Site/Thématiques/Entretien réseau routier/Chute de blocs"),
    # mensuelle, hebdo
        Path(CHEMIN_BASE, "Site/Thématiques/Education"),
        Path(CHEMIN_BASE, "Site/Thématiques/Entretien réseau routier/Fauchage/Cartes dynamiques/OLD - Suivi du débroussaillement des RD sous OLD.html"), 
    # exclusion temporaire de cartes journalieres particulieres : cartes debroussaillements suspendues jusqu'a l'automne
    # Path(CHEMIN_BASE, "Site/Thématiques/Entretien réseau routier/Fauchage/Cartes dynamiques/Opérationnel - Suivi de la campagne de fauchage débroussaillement.html"),
    # Path(CHEMIN_BASE, "Site/Thématiques/Entretien réseau routier/Fauchage/Cartes dynamiques/Stratégique - Suivi d'évolution annuelle de l'activité fauchage débroussaillement.html")
]

# Log LàD_4h : alerte si le log de la veille fait moins de 1 Mo ou est absent
DOSSIER_LOG = Path(CHEMIN_BASE, "rapport")
LIMITE_TAILLE_LOG = 1024 * 1024
# Date au format année-mois-jour dans le nom : LàD_4h_2026-09-27.log pour le 27/09/2026
DATE_VEILLE = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
MOTIF_LOG = f"LàD_4h_{DATE_VEILLE}*.log"

# Log D_4h : contrôlé le lundi uniquement, sur le log du dimanche (la veille).
# Alerte si absent ou < 100 Ko, seuil porté à 10 Mo le 1er lundi du mois (jour 1 à 7)
MOTIF_LOG_DIMANCHE = f"D_4h_{DATE_VEILLE}*.log"
EST_LUNDI = datetime.now().weekday() == 0
EST_PREMIER_LUNDI_DU_MOIS = EST_LUNDI and datetime.now().day <= 7
LIMITE_TAILLE_LOG_DIMANCHE = (
    10 * 1024 * 1024 if EST_PREMIER_LUNDI_DU_MOIS else 100 * 1024
)
LIBELLE_LIMITE_LOG_DIMANCHE = "10 Mo" if EST_PREMIER_LUNDI_DU_MOIS else "100 Ko"

date_du_jour = datetime.now().strftime("%d/%m/%Y")
fichiers_non_modifies = []
fichiers_moins_1ko = []
fichiers_geojson_vides = []
fichiers_couches_vides = []
fichiers_log_alerte = []
fichiers_log_dimanche_alerte = []

MOTIF_GEOJSON_VIDE = '{"type": "FeatureCollection", "features": null}'
COORD_PARTIELLEMENT_VIDE = '"geometry": null'

def creer_ligne(
    fichier,
    informations,
    date_modification,
    type_exception
):
    return {
        "type_exception": type_exception,
        "fichier": str(fichier),
        "taille_octets": informations.st_size,
        "date_modification": date_modification.strftime(
            "%d/%m/%Y %H:%M:%S"
        ),
    }

def chemin_relatif(fichier):
    # Cartes affichées depuis RACINE, log (hors RACINE) depuis CHEMIN_BASE
    chemin = Path(fichier)

    try:
        return chemin.relative_to(RACINE)
    except ValueError:
        return chemin.relative_to(CHEMIN_BASE)

def controler_log(motif, limite_taille, libelle_limite, nom_log):
    # Lignes d'alerte pour un log de DOSSIER_LOG : absent ou plus petit que limite_taille
    lignes = []

    try:
        logs = list(DOSSIER_LOG.glob(motif))

        if not logs:
            lignes.append(
                {
                    "type_exception": f"{nom_log} absent",
                    "fichier": str(DOSSIER_LOG / motif),
                    "taille_octets": "",
                    "date_modification": "",
                }
            )

        for fichier in logs:
            informations = fichier.stat()

            if informations.st_size < limite_taille:
                lignes.append(
                    creer_ligne(
                        fichier,
                        informations,
                        datetime.fromtimestamp(informations.st_mtime),
                        f"{nom_log} < {libelle_limite}",
                    )
                )

    except (PermissionError, OSError) as erreur:
        print(
            f"Impossible de contrôler le log {motif} : "
            f"{DOSSIER_LOG} - {erreur}"
        )

    return lignes

def est_exclu_du_controle_anciennete(fichier):
    chemin = str(fichier).rstrip("\\").casefold()

    for chemin_exclu in CHEMINS_EXCLUS_ANCIENNETE:
        exclusion = str(chemin_exclu).rstrip("\\").casefold()

        if chemin == exclusion or chemin.startswith(exclusion + "\\"):
            return True

    return False


def envoyer_alerte_mail(fichiers, rapport):
    message = EmailMessage()

    message["From"] = EXPEDITEUR
    message["To"] = DESTINATAIRE
    message["Subject"] = ("Alerte carto Si3p0")

    liste_fichiers = "\n".join(
        (
            f"- {ligne['type_exception']} : "
            f"{chemin_relatif(ligne['fichier'])}"
        )
        for ligne in fichiers
    )

    message.add_alternative(
        f"""<html>
        <body>
        <p>
        {len(fichiers)} anomalie(s) déclenchant l'alerte au {date_du_jour} :
        </p>
        <p>{liste_fichiers.replace(chr(10), "<br>")}</p>

        <p><strong>Récapitulatif du contrôle complet : {len(resultats)} exception(s) détectée(s)</strong></p>
         <ul>            
            <li>Fichiers &lt; 1 Ko : {len(fichiers_moins_1ko)}</li>
            <li>Fichiers non modifiés : {len(fichiers_non_modifies)}</li>
            <li>Fichiers avec une couche vide ou au moins une coord. manquante : {len(fichiers_geojson_vides)}</li>
            <li>Log LàD_4h de la veille &lt; 1 Mo ou absent : {len(fichiers_log_alerte)}</li>
            <li>Log D_4h du dimanche (contrôle du lundi) &lt; {LIBELLE_LIMITE_LOG_DIMANCHE} ou absent : {len(fichiers_log_dimanche_alerte)}</li>
        </ul>

        <p>
        Rapport CSV complet rattaché en PJ ou sur Q:\\Dossiers\\MSI\\Partages\\SI3P0-P0446\\Rapports\\csv.
        </p>
        </body>
        </html>""",
        subtype="html",
    )

    # Ajout du rapport CSV en pièce jointe
    with rapport.open("rb") as fichier_csv:
        message.add_attachment(
            fichier_csv.read(),
            maintype="text",
            subtype="csv",
            filename=rapport.name,
        )

    # Envoi par le serveur SMTP 
    with smtplib.SMTP(
        SERVEUR_SMTP,
        PORT_SMTP,
        timeout=30
    ) as smtp:
        smtp.send_message(message)


try:
    if not RACINE.exists():
        raise FileNotFoundError(
            f"Chemin introuvable : {RACINE}"
        )

    # Recherche de tous les dossiers nommés "Cartes dynamiques"
    for dossier in RACINE.rglob("*"):
        try:
            if not dossier.is_dir():
                continue

            if dossier.name.casefold() != "cartes dynamiques":
                continue

            # Contrôle des fichiers HTML du dossier
            for fichier in dossier.glob("*.html"):
                try:
                    informations = fichier.stat()

                    date_modification = datetime.fromtimestamp(
                        informations.st_mtime
                    )

                    # Recherche d'au moins une couche GeoJSON vide
                    contenu = fichier.read_text(
                        encoding="utf-8",
                        errors="replace"
                    )

                    if MOTIF_GEOJSON_VIDE in contenu:
                        ligne_couche_vide = creer_ligne(
                            fichier,
                            informations,
                            date_modification,
                            "Une ou plusieurs couche vide",
                        )
                        fichiers_geojson_vides.append(ligne_couche_vide)
                        fichiers_couches_vides.append(ligne_couche_vide)

                    if COORD_PARTIELLEMENT_VIDE in contenu:
                        fichiers_geojson_vides.append(
                            creer_ligne(
                                fichier,
                                informations,
                                date_modification,
                                (
                                    "Couche vide ou avec au moins une coord. manquante"
                                ),
                            )
                        )

                    # Contrôle de la taille 
                    if informations.st_size < LIMITE_TAILLE:
                        fichiers_moins_1ko.append(
                            creer_ligne(
                                fichier,
                                informations,
                                date_modification,
                                "Fichier carte html < 1 Ko",
                            )
                        )

                    # Sinon, contrôle de l'ancienneté
                    elif (
                        date_modification < LIMITE_DATE
                        and not est_exclu_du_controle_anciennete(fichier)
                    ):
                        fichiers_non_modifies.append(
                            creer_ligne(
                                fichier,
                                informations,
                                date_modification,
                                (
                                    "Carte quotidienne non modifiée depuis 2 jours"
                                ),
                            )
                        )

                except (PermissionError, OSError) as erreur:
                    print(
                        f"Impossible de lire le fichier : "
                        f"{fichier} - {erreur}"
                    )

        except (PermissionError, OSError) as erreur:
            print(
                f"Impossible de parcourir le dossier : "
                f"{dossier} - {erreur}"
            )

except (FileNotFoundError, PermissionError, OSError) as erreur:
    print(
        f"Impossible d'accéder au chemin réseau : {erreur}"
    )
    raise SystemExit(1)


# Contrôle du log LàD_4h de la veille (identifié par la date de son nom)
fichiers_log_alerte.extend(
    controler_log(
        MOTIF_LOG,
        LIMITE_TAILLE_LOG,
        "1 Mo",
        "Log LàD_4h de la veille",
    )
)

# Le lundi : contrôle du log D_4h du dimanche
if EST_LUNDI:
    fichiers_log_dimanche_alerte.extend(
        controler_log(
            MOTIF_LOG_DIMANCHE,
            LIMITE_TAILLE_LOG_DIMANCHE,
            LIBELLE_LIMITE_LOG_DIMANCHE,
            "Log D_4h du dimanche",
        )
    )


resultats = (
    fichiers_moins_1ko
    + fichiers_non_modifies
    + fichiers_geojson_vides
    + fichiers_log_alerte
    + fichiers_log_dimanche_alerte
)

# Regroupement par type d'exception, avec ce type toujours en dernier
TYPE_EXCEPTION_EN_DERNIER = (
    "Couche vide ou avec au moins une coord. manquante"
)

resultats.sort(
    key=lambda ligne: (
        ligne["type_exception"] == TYPE_EXCEPTION_EN_DERNIER,
        ligne["type_exception"],
        ligne["fichier"].casefold(),
    )
)


if not resultats:
    print("Aucun fichier HTML en anomalie.")
    print("Aucun mail envoyé.")
    raise SystemExit(0)

try:
    DOSSIER_RAPPORT.mkdir(
        parents=True,
        exist_ok=True
    )

    # Conservation glissante : suppression des rapports dates de plus de 30 jours.
    date_limite_rapports = (
        datetime.now().date()
        - timedelta(days=DUREE_CONSERVATION_RAPPORTS)
    )

    for ancien_rapport in DOSSIER_RAPPORT.glob(
        "rapport_cartes_dynamiques_??-??-????.csv"
    ):
        try:
            date_rapport = datetime.strptime(
                ancien_rapport.stem.removeprefix(
                    "rapport_cartes_dynamiques_"
                ),
                "%d-%m-%Y",
            ).date()

            if date_rapport < date_limite_rapports:
                ancien_rapport.unlink()

        except (ValueError, PermissionError, OSError) as erreur:
            print(
                f"Impossible de traiter l'ancien rapport : "
                f"{ancien_rapport} - {erreur}"
            )

    with RAPPORT.open(
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as fichier_csv:

        colonnes = [
            "type_exception",
            "fichier",
            "taille_octets",
            "date_modification",
        ]

        writer = csv.DictWriter(
            fichier_csv,
            fieldnames=colonnes,
            delimiter=";",
        )

        resultats_csv = []

        for ligne in resultats:
            ligne_csv = ligne.copy()
            ligne_csv["fichier"] = "\\" + str(
                chemin_relatif(ligne["fichier"])
            )
            resultats_csv.append(ligne_csv)

        writer.writeheader()
        writer.writerows(resultats_csv)

    print(f"{len(resultats)} exception(s) détectée(s).")
    print(
        f"- Fichiers avec une couche vide ou au moins une coord. manquante : "
        f"{len(fichiers_geojson_vides)}"
    )
    print(
        f"- Fichiers < 1 Ko : "
        f"{len(fichiers_moins_1ko)}"
    )
    print(
        f"- Fichiers non modifiés : "
        f"{len(fichiers_non_modifies)}"
    )
    print(
        f"- Log LàD_4h de la veille < 1 Mo ou absent : "
        f"{len(fichiers_log_alerte)}"
    )
    print(
        f"- Log D_4h du dimanche < {LIBELLE_LIMITE_LOG_DIMANCHE} ou absent : "
        f"{len(fichiers_log_dimanche_alerte)}"
    )

except (PermissionError, OSError) as erreur:
    print(
        f"Impossible de créer le rapport CSV : {erreur}"
    )
    raise SystemExit(1)



# Le mail part s'il existe au moins un fichier < 1 Ko, une carte quotidienne non mise à jour depuis 48 h,
# un log LàD_4h de la veille < 1 Mo ou absent, ou (le lundi) un log D_4h du dimanche trop petit ou absent
fichiers_alerte = (
    fichiers_moins_1ko
    + fichiers_non_modifies
    + fichiers_log_alerte
    + fichiers_log_dimanche_alerte
    # + fichiers_couches_vides
)

if fichiers_alerte:
    envoyer_alerte_mail(
        fichiers_alerte,
        RAPPORT
    )
else:
    print(
        "Aucun fichier < 1 Ko, aucune carte quotidienne non mise à jour depuis 48, logs LàD_4h / D_4h corrects : aucun mail envoyé."
    )

print("Fin du contrôle.")
