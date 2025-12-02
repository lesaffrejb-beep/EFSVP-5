# Audit UX Premium 2025 - Implémentation

## Changements clés
- Échelle typographique fluidifiée via `clamp()` et application sur titres (hero, sections, cartes, corps de texte).
- Chapitrage visuel des sections avec nouveaux tokens `--section-bg-*` et harmonisation des espacements verticaux.
- Portfolio scindé en deux blocs : sélection courte en tête de page + section complète avec filtres et ancre.
- Bouton d'accès rapide "Voir tous nos projets" pour mobile, limite 4 cartes en sélection sur petits écrans.
- Cartes projets restructurées en flex column avec fallback visuel gradient pour les projets sans image.
- Micro-interactions homogènes : easing premium, gloss sur CTAs primaires, hover lift renforcé sur cartes.
- Focus visible uniformisé avec `--focus-color` et respect de `prefers-reduced-motion`.

## Fichiers impactés
- `src/styles/main.css` : tokens typo/animation, chapitrage sections, hover/focus, cartes projets.
- `src/styles/hero-signature.css` : hiérarchie typo hero.
- `src/data/content.js` & `src/scripts/content-init.js` : nouveaux libellés portfolio.
- `src/scripts/projects-app.ts` : double rendu portfolio + limite mobile.
- `src/components/projects/ProjectCard.ts` : fallback gradient pour cartes sans visuel.
- `index.html` : nouvelle section "Toutes nos réalisations" + bouton d'ancrage.
- `docs/DESIGN_SYSTEM.md` : documentation mise à jour (typo fluide, sections, animations).

## Décisions
- Le portfolio principal conserve les filtres complets, tandis que la sélection haute mise en avant est limitée (6 desktop / 4 mobile) pour alléger le scroll initial.
- Les arrière-plans de sections utilisent `--section-bg-soft` pour les zones centrales (impact, process, offres) et `--section-bg-default` pour garder un rythme clair.
- Les CTAs primaires adoptent un effet gloss au hover et une translation légère pour renforcer la perception premium sans nuire à l'accessibilité.
