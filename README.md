# Tv-Centre du Québec — maquette v2

Maquette de présentation, direction « Télécommande ». Version légale de l’offre : appareils 4K, configuration à distance et solutions officielles.

Site statique (HTML, CSS, JavaScript), sans étape de construction, prêt pour Vercel.

## Pages

- `index.html` : accueil en 8 chaînes (touches 1 à 8, télécommande 3D cliquable sur ordinateur), dont un guide des solutions légales et une foire aux questions
- `bilan.html` : bilan télé en 3 questions, résultat mis à jour en direct (colonne fixe sur ordinateur, barre de résumé sur téléphone)
- `boutique.html` : présentoir à croix directionnelle, filtres, comparateur, panier simulé
- `appareil.html#identifiant` : fiche appareil (un gabarit pour les 5 appareils), position dans la gamme, plan coté quand les dimensions sont connues
- `404.html` : page « Pas de signal » servie par Vercel pour les adresses inconnues

## Données

Tout le contenu produit est dans `js/data.js` : prix, caractéristiques, fidélité, taxes. Les valeurs `null` s’affichent « à compléter ».

## À compléter avant mise en ligne réelle

- Courriel professionnel, téléphone, adresse, NEQ, zone desservie
- Mentions légales, politique de confidentialité, livraison et retours
- Conditions et délai de la configuration à distance
- Prix taxes incluses ou non
- Caractéristiques manquantes (voir les champs « à compléter »)
- Liste des services légaux et des chaînes captées à l’antenne, à vérifier

## Partage et référencement

Les pages ont un aperçu de partage (`img/partage.jpg`) et sont exclues des moteurs de recherche (`noindex`) tant que c’est une maquette. Retirer la balise `robots` le jour de la mise en ligne réelle.

## Outils

GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG, ScrambleText), Lenis, three.js, police Geist (OFL). Tous hébergés dans `vendor/` et `fonts/`.

Tests utiles : ajouter `#sans-webgl` à l’adresse de l’accueil pour voir la télécommande en SVG ; activer « Mode calme » dans l’en-tête pour la version sans animations.
