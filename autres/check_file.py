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

date_du_jour = datetime.now().strftime("%d/%m/%Y")
fichiers_non_modifies = []
fichiers_moins_1ko = []
fichiers_geojson_vides = []
fichiers_couches_vides = []

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
            f"{Path(ligne['fichier']).relative_to(RACINE)}"
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



resultats = (
    fichiers_moins_1ko
    + fichiers_non_modifies
    + fichiers_geojson_vides
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
                Path(ligne["fichier"]).relative_to(RACINE)
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

except (PermissionError, OSError) as erreur:
    print(
        f"Impossible de créer le rapport CSV : {erreur}"
    )
    raise SystemExit(1)



# Le mail part s'il existe au moins un fichier < 1 Ko, une carte quotidienne non mise à jour depuis 48 h 
fichiers_alerte = (
    fichiers_moins_1ko
    + fichiers_non_modifies
    # + fichiers_couches_vides
)

if fichiers_alerte:
    envoyer_alerte_mail(
        fichiers_alerte,
        RAPPORT
    )
else:
    print(
        "Aucun fichier < 1 Ko, aucune carte quotidienne non mise à jour depuis 48 : aucun mail envoyé."
    )

print("Fin du contrôle.")
