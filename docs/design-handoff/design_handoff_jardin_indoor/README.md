# Handoff: Jardin Indoor — refonte complète du site e-drive

## Overview
Refonte du site https://jardin-indoor.com/ (grow-shop / head-shop indépendant à Vannes, depuis 2011). Le site est un **e-drive** : commande en ligne, retrait en boutique, remises fidélité appliquées au panier, aucun frais de port. 6 écrans : Accueil, Catégorie, Fiche produit, Paiement (checkout), Connexion/Inscription, Mon compte.

## About the Design Files
Les fichiers `.dc.html` de ce dossier sont des **références de design en HTML** (prototypes montrant l'aspect et le comportement attendus), **pas du code de production à copier**. La tâche est de **recréer ces designs dans l'environnement du codebase cible** (le site actuel semble être WordPress/WooCommerce — thème enfant ou thème bloc ; sinon choisir le framework le plus adapté, ex. Next.js + headless WooCommerce) en suivant ses patterns.

Pour les ouvrir : servir le dossier en local (`npx serve .`) puis ouvrir chaque `.dc.html` dans un navigateur. `support.js` est le runtime du prototype ; `image-slot.js` est un composant de placeholder d'image (en prod → simple `<img>` / `object-fit: cover`).

Structure d'un fichier : un template HTML à styles inline avec des trous `{{ valeur }}`, `<sc-for>` (boucle), `<sc-if>` (condition), `<dc-import name="Site Header">` (composant partagé), et une classe JS `Component` dont `renderVals()` fournit les données et handlers. Les données mock (produits, horaires, commandes) sont dans ces classes.

## Fidelity
**High-fidelity.** Couleurs, typos, espacements, rayons et copies sont définitifs. Reproduire fidèlement.

## Design Tokens

### Couleurs
| Rôle | Hex |
|---|---|
| Fond page (ivoire) | `#F7F5F1` |
| Fond section alternée | `#EFECE6` |
| Surface carte / input | `#FFFFFF` / `#FBFAF7` |
| Bordure douce | `#E6E2DA` · `#DFDBD2` · `#CFCAC0` |
| Encre principale | `#16261D` (titres, boutons sombres) · `#173A2A` (logo/header) |
| Texte secondaire | `#4B5A51` · `#5B6961` · `#7C877F` · `#9AA39D` (barré) |
| Vert profond (blocs sombres) | `#1B3226` |
| Vert marque | `#1F4A36` · nav inactive `#4E7A62` |
| Footer | `#0E4A36`, texte `#DCE8E0`, labels `#9FBFAE` |
| Accent cuivre (CTA principaux, eyebrows) | `#8C4A26` |
| Accent lime (sur fond sombre) | `#C9D98F` |
| Texte sur sombre | `#F7F5F1` · `#B8C4BC` · `#8E9C93` |
| Pastille « ouvert » | fond `#E1EBDD`, texte `#1F4A36` · « fermé » fond `#EFE3DA`, texte `#8C4A26` |

### Typographie (Google Fonts)
- **Noto Serif** (400/500/600, italique 400/500) — tous les titres, logo (italique 600, 20px), nav, prix hero. Italique utilisé pour l'emphase dans les titres (`<em>`).
- **Manrope** (400–700) — corps, labels, boutons.
- Échelle : H1 `clamp(48px,7vw,92px)` (accueil) / `clamp(38px,5vw,60px)` (pages internes), line-height 1.02, letter-spacing -0.025em · H2 `clamp(30px,4vw,52px)` · H3 cartes 17–32px · corps 14–16px, line-height 1.6–1.7.
- **Eyebrow** : Manrope 11px, 600, uppercase, letter-spacing 0.22em, couleur `#8C4A26` (ou `#C9D98F` sur fond sombre).
- **Bouton CTA** : Manrope 12–12.5px, 700, uppercase, letter-spacing 0.12em.

### Rayons, ombres, espacement
- Rayons : boutons/inputs 10–12px · cartes 16–20px · grandes images/blocs 24px · pills 999px.
- Ombres : hero image `0 30px 60px rgba(22,38,29,.16)` · carte flottante `0 20px 40px rgba(22,38,29,.14)` · CTA cuivre `0 10px 24px rgba(140,74,38,.25)`.
- Conteneur : `max-width:1240px`, padding latéral 24px. Sections : padding vertical `clamp(64px,8vw,112px)`. Gaps de grille 22–40px.
- Inputs : hauteur 48–50px, bordure 1px `#DFDBD2`, rayon 12px, padding 0 14px.

## Screens

### Composants partagés
- **Site Header** (`Site Header.dc.html`) — sticky, fond `rgba(247,245,241,.92)` + `backdrop-filter: blur(12px)`, bordure basse `#E6E2DA`. Logo serif italique à gauche, nav serif 14px au centre (item actif : couleur `#16261D` + soulignement 1px), à droite « Mon compte » et « Panier » avec badge compteur (pastille `#173A2A`). Props : `active`, `cartCount`.
- **Site Footer** (`Site Footer.dc.html`) — fond `#0E4A36`, 4 colonnes (adresse · Boutique · E-drive · Informations), liens serif italiques soulignés, bas de page « © 2026 … » / « Vente interdite aux mineurs ».

### 1. Accueil (`Jardin Indoor - Accueil v3.dc.html`)
1. **Hero** — grille 2 colonnes (auto-fit, min 400px). Gauche : eyebrow « Jardinerie urbaine · Vannes », H1 « Cultiver / *chez soi,* / sans compromis. », paragraphe, CTA sombre « Explorer le catalogue » + lien « Commander en E-drive → ». Droite : image carrée rayon 24px (`images/hero-boutique.png`) + citation flottante blanche en bas à gauche (débord négatif) « Aucun quota de marque… ».
2. **L'indépendance comme méthode** — fond `#EFECE6`, titre centré, 3 piliers (pastille ronde 48px vert `#1F4A36` avec chiffre romain italique : Sélection / Conseil / Proximité).
3. **Nos univers** (bento, flex-wrap gap 22px) — 
   - Culture indoor : `flex:2 1 520px`, min-height 440px, image plein cadre `images/indoor.jpeg`, dégradé bas sombre, titre + texte + CTA cuivre « Découvrir ».
   - CBD & CBG : `flex:1 1 280px`, 440px, `images/cbd.jpeg`, pill verre dépoli « Leaf District », texte bas.
   - Outdoor & hors-sol : `flex:2 1 520px`, split image (`images/outdoor.jpeg`) / texte sur `#E3E0D9`, bouton contour « Parcourir ».
   - Vinyles & pop culture : `flex:1 1 280px`, 300px, `images/vinyles.jpeg`, dégradé **haut** sombre, texte en haut.
4. **E-drive** — bloc `#1B3226` rayon 24px, 2 colonnes : titre « Commandez en ligne, *retirez en boutique.* », CTA cuivre « Créer mon compte » + bouton verre « Me connecter » ; à droite 3 étapes en cartes translucides (numéro serif italique lime) + mention légale.
5. **La boutique** — adresse en H2, pastille statut ouvert/fermé (calculée sur l'heure réelle), liste des horaires, CTA téléphone ; image `images/facade.jpeg` 4:3.4.
6. **Bandeau devis** — image plein cadre `images/banner.jpeg`, voile `rgba(15,28,21,.62)`, titre italique centré « Un projet d'installation ? », CTA cuivre + bouton verre.
7. Footer.

### 2. Catégorie (`Jardin Indoor - Categorie.dc.html`)
- Fil d'Ariane, H1 « Culture *indoor* » + intro en 2 colonnes.
- Chips sous-catégories (Tout, Éclairage, Chambres, Ventilation, Contrôle, Accessoires) avec compteur ; chip active = fond `#16261D`. **Filtre réel** de la grille.
- Layout flex : sidebar sticky 230px (checkbox Marque, Prix, « En stock à Vannes », encart aide `#1B3226` avec téléphone) + contenu.
- Barre : « N produits » + select Tri (Popularité / Prix croissant / décroissant — fonctionnel).
- Grille `repeat(auto-fill,minmax(230px,1fr))`, carte : image 4:5 rayon 16px, badge (Promo cuivre, Best-seller vert, Nouveau encre, Conseil `#4E7A62`), marque eyebrow, nom serif 17px, prix 700 + ancien prix barré, bouton contour « Ajouter » (hover plein) → incrémente le badge panier du header.
- Pagination pills 40px.

### 3. Fiche produit (`Jardin Indoor - Produit.dc.html`)
- 2 colonnes : galerie (image principale carrée rayon 24px + badge « Promo −17 % », 4 miniatures, active bordure 2px `#16261D`) / infos sticky.
- Infos : eyebrow marque, H1 serif, description, prix serif 34px + barré + pill « Prix e-drive », sélecteur de variante (3 boutons, actif sombre — change le prix), stepper quantité, CTA cuivre pleine largeur « Ajouter au panier » (→ « Ajouté au panier ✓ » 1.6s, met à jour le header), encart stock « En stock à Vannes — prêt en retrait dès demain ».
- Onglets serif (Description / Caractéristiques / Conseil) — Caractéristiques = liste clé/valeur ; Conseil = bloc `#1B3226` citation italique.
- « Souvent *associés* » : 4 cartes produit.

### 4. Paiement (`Jardin Indoor - Paiement.dc.html`)
- H1 « Finaliser *ma commande* » + stepper (Panier ✓ — Retrait & paiement (actif, pill) — Confirmation).
- Colonne gauche (cartes blanches rayon 20px) : Coordonnées (4 champs) · Retrait en boutique (choix du jour, 4 créneaux sélectionnables) · Paiement (radio : Carte bancaire en ligne / Paiement au retrait ; si CB → champs carte, expiration, cryptogramme) + « Les chèques ne sont pas acceptés ».
- Récap sticky `#1B3226` : articles (vignette 56px), sous-total, **remise fidélité 5 %** (lime), retrait gratuit, total serif 30px, CTA cuivre « Payer X € » / « Valider la commande » → « Commande confirmée ✓ », mentions CGV/majorité.

### 5. Connexion (`Jardin Indoor - Connexion.dc.html`)
- 2 colonnes : image plein cadre (placeholder, dégradé bas + message e-drive) / formulaire max 460px.
- Segmented control Connexion / Créer un compte (fond `#EFECE6`, onglet actif blanc + ombre). Titre et CTA changent ; inscription ajoute Prénom/Nom + case « Je certifie avoir plus de 18 ans et accepte les CGV » ; connexion : lien « Oublié ? » + « Rester connecté ». Prop `mode`: login|signup.

### 6. Mon compte (`Jardin Indoor - Mon compte.dc.html`)
- H1 « Bonjour, *Camille.* », sidebar sticky (Tableau de bord, Commandes, Favoris, Mes informations, Se déconnecter).
- **Tableau de bord** : carte fidélité `#1B3226` (palier « Sève », 5 %, barre de progression 69 % vers « Racine » 8 % à 600 €), carte commande en cours (pill « Prête au retrait »), carte retrait boutique ; liste des 3 dernières commandes (N°, date, articles, statut pill, total) + « Tout voir ».
- Commandes : liste complète. Favoris : état vide avec CTA. Mes informations : formulaire + « Enregistrer ».
- ⚠ Les paliers fidélité (Sève/Racine, 5/8 %, 600 €) sont **inventés** pour la maquette — à remplacer par les règles réelles.

## Interactions & Behavior
- Statut ouvert/fermé calculé côté client depuis les horaires : Lun & Jeu 14h00–18h40 · Mar, Mer, Ven 10h00–18h40 · Sam 12h00–18h40 · Dim fermé.
- Hovers : liens → `#8C4A26` ; cartes produit bouton « Ajouter » se remplit ; boutons contour → plein.
- Responsive : tout en `auto-fit/minmax` + flex-wrap ; les colonnes s'empilent sous ~900px ; sidebars passent au-dessus du contenu.
- Aucune animation spécifique au-delà des transitions par défaut (suggestion : 150–200ms ease sur couleurs).

## State Management (à brancher sur WooCommerce)
- Panier (compteur header, lignes, totaux), remise fidélité par client, créneau de retrait, mode de paiement, filtres/tri catégorie, variante + quantité produit, onglet actif, session utilisateur, historique commandes et statuts (En préparation / Prête au retrait / Retirée).

## Contenu & règles métier (du site actuel)
- Adresse : 36 Avenue Gontran Bienvenu, 56000 Vannes · 02 97 49 95 09.
- Prix/promos/remises valables uniquement sur commandes en ligne avec compte ; remises non cumulables avec promos ; chèques refusés ; pas de frais de port ; vente interdite aux mineurs.
- Partenaire CBD : Leaf District.

## Assets
Dossier `images/` (générées par IA, validées par le client) :
- `hero-boutique.png` — intérieur boutique (hero accueil)
- `indoor.jpeg` — tente de culture (carte Culture indoor)
- `cbd.jpeg` — bocaux ambrés sur comptoir (carte CBD)
- `outdoor.jpeg` — table substrats (carte Outdoor)
- `vinyles.jpeg` — bacs vinyles (carte Vinyles & pop culture)
- `facade.jpeg` — façade boutique (section La boutique)
- `banner.jpeg` — rangée de tentes (bandeau devis)

Emplacements encore vides : image Connexion, photos produits (Catégorie, Produit, Paiement) → utiliser les vraies photos du catalogue WooCommerce.

⚠ **Juridique** : plusieurs images montrent des plants ressemblant à du cannabis. En France, la promotion de la culture de cannabis est interdite ; faire valider ou remplacer ces visuels (plants de tomate/basilic) avant mise en ligne.

## Files
- `Jardin Indoor - Accueil v3.dc.html`
- `Jardin Indoor - Categorie.dc.html`
- `Jardin Indoor - Produit.dc.html`
- `Jardin Indoor - Paiement.dc.html`
- `Jardin Indoor - Connexion.dc.html`
- `Jardin Indoor - Mon compte.dc.html`
- `Site Header.dc.html`, `Site Footer.dc.html` (composants partagés)
- `support.js` (runtime du prototype), `image-slot.js` (placeholder image)
- `images/`
