# Visual Refactor Notes - EFSVP Design System

> Date: November 2025
> Objectif: Refonte visuelle premium (Dribbble / Awwwards 2025)

---

## 1. Diagnostic du Design System

### 1.1 Structure des Tokens (src/styles/main.css)

| Catégorie | Localisation | Description |
|-----------|-------------|-------------|
| **Couleurs** | Lignes 18-97 | Terracotta (#B95A40) + Encre Nuit (#1A2332), palettes 50-900 |
| **Spacing** | Lignes 99-122 | Scale harmonieuse --space-1 (4px) à --space-48 (192px) |
| **Radius** | Lignes 124-139 | --radius-xs à --radius-full + tokens boutons |
| **Typography** | Lignes 166-210 | Playfair Display, Plus Jakarta Sans, JetBrains Mono |
| **Shadows** | Lignes 212-226 | 7 niveaux + shadows colorées (primary) |
| **Transitions** | Lignes 228-233 | Fast (150ms), Base (200ms), Slow (300ms), Bounce (400ms) |
| **Z-Index** | Lignes 235-246 | Système 8 niveaux (base → tooltip) |

### 1.2 Backgrounds existants et nouveaux

```css
/* Existants */
--bg-primary: #ffffff
--bg-secondary: #f8f9fa
--bg-tertiary: #e9ecef
--bg-dark: #1a2332
--bg-accent: #fef5f3
--color-hero-bg: #f9f5ef
--bg-page: var(--color-hero-bg)
--bg-section: color-mix(in srgb, var(--bg-page) 92%, var(--bg-secondary) 8%)
--bg-section-alt: color-mix(in srgb, var(--bg-page) 88%, var(--color-primary-50) 12%)

/* NOUVEAUX - Ajoutés pour le rythme visuel */
--bg-section-alt-warm: color-mix(in srgb, var(--bg-page) 85%, var(--color-primary-100) 15%)
--bg-section-alt-cool: color-mix(in srgb, var(--bg-page) 90%, var(--bg-tertiary) 10%)
--bg-section-elevated: color-mix(in srgb, var(--bg-primary) 94%, var(--color-primary-50) 6%)
```

### 1.3 Composants clés identifiés

| Composant | Fichier HTML | Fichier CSS |
|-----------|-------------|-------------|
| Hero/Signature | index.html:318 | hero-signature.css |
| Stats (60+/15+) | index.html:369-378 | main.css:3189-3236 |
| Audio Player | Modal projets | audio-player.css |
| Navbar | index.html:254-310 | progressive-nav.css |
| Project Cards | index.html:360-386 | main.css:3332-3475+ |
| Contact | index.html:688-851 | main.css:2368-2580 |
| Footer | index.html:857-974 | main.css:2820-3050 |

---

## 2. Améliorations Visuelles Appliquées

### 2.1 Alternance des fonds de sections

**Nouveaux tokens ajoutés:**
- `--bg-section-alt-warm`: variation chaude subtile pour sections impaires
- `--bg-section-alt-cool`: variation neutre pour sections paires
- `--bg-section-elevated`: fond légèrement relevé pour sections de stats

**Application:**
- Hero: `--bg-page` (fond principal parchemin)
- Projects: `--bg-section`
- Promise/Value prop: `--bg-section-alt-warm`
- Process: `--bg-section`
- FAQ: `--bg-section-alt-cool`
- Contact: `--bg-dark` (existant)

### 2.2 Refonte des Stats (60+ / 15+)

**Avant:**
- Gradient approximatif, typographie peu hiérarchisée
- Contraste moyen sur le label

**Après:**
- Fond solide tokenisé avec accent subtil
- Valeur numérique: display font, taille augmentée (clamp 4xl→6xl)
- Label: uppercase, tracking wide, taille réduite (text-xs)
- Micro-décoration: barre verticale accent
- Espacement normalisé avec tokens du DS

### 2.3 Audio Player

**Avant:**
- Couleurs bleues hors palette
- Radius incohérents

**Après:**
- Fond: `--surface-card` ou `--bg-secondary`
- Accent/progress bar: `--color-primary-500`
- Radius: `--radius-xl` (cohérent avec cards)
- States hover/focus: transitions --transition-base

### 2.4 Navbar / Menu Mobile

**Améliorations:**
- Animation hamburger → X fluide
- Menu mobile: backdrop-filter blur + fond semi-transparent
- Links avec padding généreux (tap targets ≥ 44px)
- Stagger animation sur les liens

### 2.5 Project Cards

**Hover states:**
- `transform: translateY(-4px)` (réduit de -8px pour plus de subtilité)
- `box-shadow: var(--shadow-xl)` (plus doux)
- Overlay gradient très léger sur l'image
- Transition cohérente: `--transition-base`

### 2.6 Section Contact / Footer

**Améliorations:**
- Micro-texture/pattern discret via pseudo-élément
- CTA avec card légère et spacing généreux
- Animation d'apparition fade+slide cohérente
- Footer: meilleur espacement vertical, accent sur le brand

---

## 3. Checklist Qualité

- [x] Aucun nouveau style inline sans token
- [x] Pas de couleur hard-codée hors tokens
- [x] Sections alternent des fonds lisibles
- [x] Stats (60+/15+) design premium
- [x] Audio player intégré visuellement
- [x] Menu mobile propre, animations fluides
- [x] Cards projet avec hovers subtils
- [x] Contact avec plus de présence
- [x] Comportements existants préservés (modal, audio stop, scroll)

---

## 4. Notes Techniques

### Conventions de nommage tokens

Les nouveaux tokens suivent la convention existante:
```
--bg-[semantic]-[modifier]
--color-[palette]-[shade]
--space-[number]
--radius-[size]
--transition-[speed]
```

### Accessibilité

- Contrastes WCAG AA maintenus/améliorés
- Focus visible sur tous les interactifs
- Tap targets mobile ≥ 44px
- `prefers-reduced-motion` respecté

### Performance

- Utilisation de `will-change` sur les éléments animés fréquemment
- Transitions GPU-friendly (transform, opacity)
- Pas de repaints inutiles

---

## 5. Fichiers Modifiés

1. `src/styles/main.css` - Tokens + sections + stats + cards + contact/footer
2. `src/styles/audio-player.css` - Harmonisation couleurs/radius
3. `src/styles/progressive-nav.css` - Améliorations menu mobile
4. `docs/visual-refactor-notes.md` - Ce fichier

---

*Dernière mise à jour: Novembre 2025*
