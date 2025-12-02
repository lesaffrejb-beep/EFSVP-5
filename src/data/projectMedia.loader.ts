import projectsData from '../../content/projects.json';

export type ProjectMedia = {
  heroImage: string | null;
  heroVideo: string | null;
  audioTrack: string | null;
};

const EMPTY_MEDIA: ProjectMedia = {
  heroImage: null,
  heroVideo: null,
  audioTrack: null,
};

const SLUG_TO_FOLDER_MAP: Record<string, string> = {
  'doue-en-anjou-ou-culture-et-patrimoine-se-rencontrent': 'doue-en-anjou',
  'le-jardin-de-cocagne': 'jardin-de-cocagne',
  'le-moulin-de-brissac': 'moulin-de-brissac',
  'les-seigneurs-de-clisson': 'seigneurs-de-clisson',
  agglobus: 'agglo-bus',
  'dis-moi-des-mots-damour': 'dis-moi-des-mots-d-amour',
};

type MediaEntry = {
  images: string[];
  videos: string[];
  audios: string[];
};

const projectSlugs = new Set<string>(
  Array.isArray(projectsData)
    ? (projectsData as Array<{ slug?: string; id?: string }>)
        .map((project) => project.slug || project.id)
        .filter((slug): slug is string => Boolean(slug))
    : [],
);

function extractSlug(path: string): string | null {
  const normalized = path.replace(/\\/g, '/');
  const marker = '/projects/';
  const markerIndex = normalized.lastIndexOf(marker);

  if (markerIndex === -1) return null;

  const slug = normalized.slice(markerIndex + marker.length).split('/')[0];
  return normalizeSlug(slug);
}

function normalizeSlug(slug: string | null): string | null {
  if (!slug) return null;
  const matchingSlug = Object.entries(SLUG_TO_FOLDER_MAP).find(([, folder]) => folder === slug)?.[0];
  return matchingSlug || slug;
}

function toPublicPath(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  return normalized.replace(/^\.\.\/\.\.\/public/, '');
}

function selectHero(candidates: string[]): string | null {
  if (!candidates.length) return null;

  const sorted = [...candidates].sort((a, b) => a.localeCompare(b));
  const preferred = sorted.find((entry) => {
    const fileName = entry.split('/').pop() ?? '';
    return /cover|hero/i.test(fileName);
  });

  return preferred ?? sorted[0];
}

function buildMediaIndex(): Record<string, MediaEntry> {
  try {
    const index: Record<string, MediaEntry> = {};

    const addToIndex = (slug: string, type: keyof MediaEntry, path: string) => {
      if (projectSlugs.size && !projectSlugs.has(slug)) return;
      if (!index[slug]) {
        index[slug] = { images: [], videos: [], audios: [] };
      }
      index[slug][type].push(path);
    };

    const imageGlobs = import.meta.glob(
      '../../public/assets/images/projects/**/*.{jpg,jpeg,png,webp,avif,gif}',
      { eager: true },
    );
    Object.keys(imageGlobs).forEach((path) => {
      const slug = extractSlug(path);
      if (!slug) return;
      addToIndex(slug, 'images', toPublicPath(path));
    });

    const videoGlobs = import.meta.glob(
      '../../public/assets/videos/projects/**/*.{mp4,MP4,webm,WEBM,mov,MOV,m4v,M4V}',
      {
        eager: true,
      },
    );
    Object.keys(videoGlobs).forEach((path) => {
      const slug = extractSlug(path);
      if (!slug) return;
      addToIndex(slug, 'videos', toPublicPath(path));
    });

    const audioGlobs = import.meta.glob('../../public/assets/audio/projects/**/*.{mp3,ogg,wav}', {
      eager: true,
      as: 'url',
    });

    Object.entries(audioGlobs).forEach(([path, resolvedUrl]) => {
      const slug = extractSlug(path);
      if (!slug) return;

      if (typeof resolvedUrl !== 'string' || !resolvedUrl.trim()) {
        console.error('[projectMedia.loader] URL audio introuvable pour', slug, path);
        return;
      }

      addToIndex(slug, 'audios', resolvedUrl);
    });

    return index;
  } catch (error) {
    console.error('projectMedia.loader: erreur lors de la construction de l\'index des médias', error);
    return {};
  }
}

const mediaIndex = buildMediaIndex();

export function getProjectMedia(slug: string): ProjectMedia {
  try {
    const entry = mediaIndex[slug];

    if (!entry) {
      return { ...EMPTY_MEDIA };
    }

    return {
      heroImage: selectHero(entry.images),
      heroVideo: selectHero(entry.videos),
      audioTrack: selectHero(entry.audios),
    };
  } catch (error) {
    console.error('projectMedia.loader: erreur lors de la récupération des médias pour', slug, error);
    return { ...EMPTY_MEDIA };
  }
}
