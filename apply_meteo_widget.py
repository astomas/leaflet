#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Applique le widget vigilance météo à tous les root maps.
"""
import re

FILES = [
    "Fréquentation 3V.html",
    "Opérationnel intervention Fauchage_claude-sans-legende.html",
    "Suivi du déploiement_claude-sans-legende.html",
    "UT Alès - Référentiel routier_claude-sans-legende.html",
    "doublons lignes test-UTVI Fauchages Débroussaillement_claude-sans-legende.html",
    "equipements_dynamiques_claude-sans-legende.html",
    "regime_priorite_modif_claude-sans-legende.html",
]

# 1. Liens CSS/JS à insérer après le lien GPlaceAutocomplete.css
CSS_JS_INSERTION = """\n\n\t<!-- Widget vigilance météo -->\n\t<link rel="stylesheet" href="/leaflet/Ressources 26/librairies_cd30/widget-meteo.css">\n\t<script src="/leaflet/Ressources 26/librairies_cd30/widget-meteo.js"></script>"""

# 2. HTML .meteo-zone à insérer avant <div class="modern-header-actions">
METEO_ZONE_HTML = """\n      <div class="meteo-zone">\n        <div id="meteoWidget" class="modern-meteo-widget"></div>\n        <a class="meteo-vig-lien" href="https://vigilance.meteofrance.fr/fr/gard" target="_blank" rel="noopener">⚠ accès site vigilance météo et crues Gard</a>\n      </div>"""

# 3. Méthode this.widgetMeteo à insérer avant this.importFichier
WIDGET_METEO_METHOD = """\nthis.widgetMeteo = function() {\n\tinitWidgetMeteo({\n\t\tTEST_J:  null, // null = données réelles\n\t\tTEST_J1: null  // null = données réelles\n\t});\n};\n"""

# 4. Appel à insérer après carteLeaflet.spiderfyPoints()
WIDGET_METEO_CALL = "\n\tcarteLeaflet.widgetMeteo();"


def apply_modifications(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    original = content
    errors = []

    # --- 1. Liens CSS/JS dans le head ---
    # Pattern: after GPlaceAutocomplete.css link line
    gac_css_pattern = r'(<link rel="stylesheet" href="/leaflet/Ressources 26/GPlaceAutocomplete\.css"\s*/?>)'
    if re.search(gac_css_pattern, content):
        content = re.sub(
            gac_css_pattern,
            r'\1' + CSS_JS_INSERTION,
            content,
            count=1
        )
    else:
        errors.append("Lien GPlaceAutocomplete.css non trouvé")

    # --- 2. HTML .meteo-zone dans le body ---
    # Pattern: before <div class="modern-header-actions">
    header_actions_pattern = r'(\s*<div class="modern-header-actions">)'
    if re.search(header_actions_pattern, content):
        content = re.sub(
            header_actions_pattern,
            METEO_ZONE_HTML + r'\1',
            content,
            count=1
        )
    else:
        errors.append("modern-header-actions non trouvé")

    # --- 3. Méthode this.widgetMeteo ---
    # Pattern: before "this.importFichier = function"
    import_fichier_pattern = r'(\nthis\.importFichier = function)'
    if re.search(import_fichier_pattern, content):
        content = re.sub(
            import_fichier_pattern,
            '\n' + WIDGET_METEO_METHOD + r'\1',
            content,
            count=1
        )
    else:
        errors.append("this.importFichier non trouvé")

    # --- 4. Appel carteLeaflet.widgetMeteo() ---
    # Pattern: after carteLeaflet.spiderfyPoints();
    spiderfy_pattern = r'(\tcarteLeaflet\.spiderfyPoints\(\);)'
    if re.search(spiderfy_pattern, content):
        content = re.sub(
            spiderfy_pattern,
            r'\1' + WIDGET_METEO_CALL,
            content,
            count=1
        )
    else:
        errors.append("carteLeaflet.spiderfyPoints() non trouvé")

    if content == original:
        print(f"  [WARN] Aucune modification apportée à {filepath}")
        return False

    if errors:
        print(f"  [WARN] {filepath}: {'; '.join(errors)}")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return True


if __name__ == "__main__":
    import os
    os.chdir("/home/user/leaflet")

    for fname in FILES:
        print(f"\nTraitement: {fname}")
        if not os.path.exists(fname):
            print(f"  [ERREUR] Fichier non trouvé")
            continue
        success = apply_modifications(fname)
        if success:
            print(f"  [OK] Modifications appliquées")

    print("\nTerminé.")
