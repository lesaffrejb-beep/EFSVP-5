# 📁 Assets projets (slug)

Tous les médias projets sont rangés par **slug** (valeur `slug` dans `content/projects.json`).

```
/public/assets/
├── images/projects/<slug>/  # visuels de couverture + galerie
├── videos/projects/<slug>/  # teasers / vidéos hébergées dans le repo
└── audio/projects/<slug>/   # extraits audio locaux (gitkeep seulement par défaut)
```

## Extensions acceptées
- Images : `jpg`, `jpeg`, `png`, `webp`, `avif`, `gif`
- Vidéos : `mp4`, `webm`, `mov`
- Audio : `mp3`, `ogg`, `wav`

## Règles rapides
1) Dépose tes fichiers directement dans le dossier du slug (ex : `public/assets/images/projects/la-force-de-la-douceur/`).
2) Pas besoin de nommer les fichiers : le loader privilégie les noms contenant `cover` ou `hero`, puis prend le premier fichier par ordre alphabétique.
3) Les dossiers existent pour chaque slug (avec `.gitkeep` si vide) afin d'éviter les 404.

## Slugs actuels
```
a2mo
agglobus
atelier-lacour
capeb
la-force-de-la-douceur
dis-moi-des-mots-damour
doue-en-anjou-ou-culture-et-patrimoine-se-rencontrent
doue-en-sports
le-jardin-de-cocagne
forges-tout-feu-tout-flamme
les-seigneurs-de-clisson
le-moulin-de-brissac
don-quijote-de-la-francia
anjour-et-nuit
etat-de-nature
sival
souffler-sur-les-braises
```

### Audio
Les fichiers volumineux restent ignorés par Git (`public/assets/audio/projects/*`), seules les empreintes `.gitkeep` sont versionnées pour garantir la structure.
