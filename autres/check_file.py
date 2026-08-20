from pathlib import Path
from datetime import datetime, timedelta
import csv
import smtplib
from email.message import EmailMessage


# Chemin de base
RACINE = Path(
    r"Q:\Dossiers\MSI\Partages\SI3P0-P0446\Site\Thématiques"
)

# parametres mail
SERVEUR_SMTP = "smtpsys.intra.cg30.fr"
PORT_SMTP = 25

EXPEDITEUR = "alerte_si3p0@gard.fr"
DESTINATAIRE = "thomas.fontaine@gard.fr"

# Emplacement du rapport CSV
DOSSIER_RAPPORT = Path(
    r"Q:\Dossiers\MSI\Partages\SI3P0-P0446\Rapports"
)
RAPPORT = DOSSIER_RAPPORT / "rapport_cartes_dynamiques.csv"

# Seuils d'alerte, fichier vieux d'au moins 1 semaine et/ou < 1ko
LIMITE_DATE = datetime.now() - timedelta(weeks=1, hours=1)
LIMITE_TAILLE = 1024

CHEMINS_EXCLUS_ANCIENNETE = [
    Path(
        r"Q:\Dossiers\MSI\Partages\SI3P0-P0446"
        r"\Site\Thématiques\Exploitation et trafic routier\PPBE"
    ),
    Path(
        r"Q:\Dossiers\MSI\Partages\SI3P0-P0446"
        r"\Site\Thématiques\Entretien réseau routier\Chute de blocs"
    ),
    Path(
        r"Q:\Dossiers\MSI\Partages\SI3P0-P0446"
        r"\Site\Thématiques\3V"
    ),    
    Path(
        r"Q:\Dossiers\MSI\Partages\SI3P0-P0446"
        r"\Site\Thématiques\Entretien Voies Vertes"
    ),
    Path(
        r"Q:\Dossiers\MSI\Partages\SI3P0-P0446"
        r"\Site\Thématiques\référentiel routier"
    ),
    Path(
        r"Q:\Dossiers\MSI\Partages\SI3P0-P0446"
        r"\Site\Thématiques\Education"
    )
]

fichiers_non_modifies = []
fichiers_moins_1ko = []

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
    message["Subject"] = (
        "ALERTE CARTOGRAPHIE - "
        f"{len(fichiers)} fichier(s) inférieur(s) à 1 Ko"
    )

    liste_fichiers = "\n".join(
        (
            f"- {ligne['fichier']} "
            f"({ligne['taille_octets']} octets)"
        )
        for ligne in fichiers
    )

    texte = (
    f"{len(fichiers)} fichier(s) HTML strictement inférieur(s) "
    "à 1 Ko ont été détecté(s).\n\n"
    f"{liste_fichiers}\n\n"
    "Le rapport CSV complet est disponible en pièce jointe."
    )

    message.set_content(texte)

    message.add_alternative(
        f"""
        <html>
            <body>
                <p>
                    {len(fichiers)} fichier(s) HTML strictement inférieur(s)
                    à 1 Ko ont été détecté(s).
                </p>

                <p>{liste_fichiers.replace(chr(10), "<br>")}</p>

                <p>
                    Le rapport CSV complet est disponible en pièce jointe.
                </p>
            </body>
        </html>
        """,
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

    # Envoi par le serveur SMTP de l'entreprise
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

                    # Contrôle de la taille en priorité
                    if informations.st_size < LIMITE_TAILLE:
                        fichiers_moins_1ko.append(
                            creer_ligne(
                                fichier,
                                informations,
                                date_modification,
                                "Fichier inférieur à 1 Ko",
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
                                    "Non modifié depuis plus de "
                                    "1 semaine et 1 heure"
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



resultats = fichiers_moins_1ko + fichiers_non_modifies


if not resultats:
    print("Aucun fichier HTML en anomalie.")
    print("Aucun mail envoyé.")
    raise SystemExit(0)

try:
    DOSSIER_RAPPORT.mkdir(
        parents=True,
        exist_ok=True
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

        writer.writeheader()
        writer.writerows(resultats)

    print(f"{len(resultats)} exception(s) détectée(s).")
    print(
        f"- Fichiers inférieurs à 1 Ko : "
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



# Le mail part uniquement s'il existe au moins un fichier < 1 Ko.

if fichiers_moins_1ko:
    try:
        envoyer_alerte_mail(
            fichiers_moins_1ko,
            RAPPORT
        )

        print(
            f"Alerte envoyée à {DESTINATAIRE}."
        )

    except (smtplib.SMTPException, OSError) as erreur:
        print(
            f"Impossible d'envoyer l'alerte mail : {erreur}"
        )

else:
    print(
        "Aucun fichier inférieur à 1 Ko : "
        "aucun mail envoyé."
    )

print("Fin du contrôle.")
