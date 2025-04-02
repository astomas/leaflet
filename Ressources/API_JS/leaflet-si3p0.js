function ajouterHoverEtClic(bouton, params) {
    let isLocked = false;
    const {
        isVisible, // fonction qui vérifie si l'élément est visible
        afficher,  // fonction pour afficher
        masquer,   // fonction pour masquer
        onClose    // fonction optionnelle pour la gestion de fermeture
    } = params;

    if (bouton) {
        bouton.addEventListener('click', () => {
            isLocked = !isLocked;
            if (!isVisible()) {
                afficher();
            }
        });

        bouton.addEventListener('mouseenter', () => {
            if (!isLocked && !isVisible()) {
                afficher();
            }
        });

        bouton.addEventListener('mouseleave', () => {
            if (!isLocked && isVisible()) {
                masquer();
                isLocked = false;
            }
        });

        if (onClose) {
            onClose(() => {
                isLocked = false;
            });
        }
    }
}