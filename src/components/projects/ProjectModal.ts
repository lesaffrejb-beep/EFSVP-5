import { SECTOR_LABELS, type Project } from '@/types/project';
import { createProjectAudioPlayer, destroyProjectAudioPlayer } from '@/scripts/modules/projectAudioPlayer';
import { getProjectMedia, type ProjectMedia } from '@/data/projectMedia.loader';

/**
 * Filet de sécurité : correspondance directe slug → URL d'embed YouTube
 * Garantit l'affichage même si les données du loader/Zod échouent
 */
const YOUTUBE_EMBEDS_BY_SLUG: Record<string, string> = {
  'doue-en-sports': 'https://www.youtube-nocookie.com/embed/B9gNlAPX6Mk',
  'doue-en-anjou-ou-culture-et-patrimoine-se-rencontrent': 'https://www.youtube-nocookie.com/embed/njW0C7Pc_yc',
  'agglobus': 'https://www.youtube-nocookie.com/embed/KIGZtJu44C4',
  'dis-moi-des-mots-damour': 'https://www.youtube-nocookie.com/embed/5YAAq56OpFk',
  'souffler-sur-les-braises': 'https://www.youtube-nocookie.com/embed/DbCl91k-hSQ',
  'la-force-de-la-douceur': 'https://www.youtube-nocookie.com/embed/njCyyG_pl9g',
  'le-jardin-de-cocagne': 'https://www.youtube-nocookie.com/embed/NBfXv0B2VB8',
};

declare global {
  interface Window {
    lenis?: {
      stop?: () => void;
      start?: () => void;
    };
  }
}

const EMPTY_MEDIA: ProjectMedia = {
  heroImage: null,
  heroVideo: null,
  audioTrack: null,
};

/**
 * Project modal lifecycle overview
 * - Content lives in content/projects.json and is normalized in src/data/projects.loader.ts
 *   (cover/thumbnail resolution, slug → assets folder mapping, and strict asset existence checks
 *   for media like /assets/videos/projects/<folder>/video.mp4).
 * - The modal renders these normalized Project objects: details + cover image by default,
 *   optional HTML5 video/audio players only when the loader confirmed a real asset.
 * - Opening locks the background scroll via a simple body class, focuses the modal, and scrolls
 *   only inside .project-modal. Closing removes the lock class and restores focus to the trigger.
 */

export class ProjectModal {
  private modal: HTMLElement | null;
  private closeButton: HTMLElement | null;
  private overlay: HTMLElement | null;
  private currentAudioPlayer: any = null;
  private currentFallbackAudio: HTMLAudioElement | null = null;
  private focusableElements: HTMLElement[] = [];
  private keydownHandler: (event: KeyboardEvent) => void;
  private triggerElement: HTMLElement | null = null;
  private audioReadyTimeout: number | null = null;
  private audioFallbackApplied = false;
  private lenis: { stop?: () => void; start?: () => void } | null = null;
  private lenisWasActive = false;

  constructor() {
    this.modal = document.getElementById('project-modal');
    this.closeButton = document.getElementById('project-modal-close');
    this.overlay = this.modal?.querySelector('.modal-overlay') as HTMLElement | null;
    this.keydownHandler = (event: KeyboardEvent) => this.handleKeydown(event);
    this.applyModalAccessibilityAttributes();
    this.setModalAccessibility(false);
    this.attachEvents();
    this.syncLenisInstance();
  }

  private attachEvents() {
    this.closeButton?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());
  }

  open(project: Project, triggerElement?: HTMLElement | null) {
    if (!this.modal) return;

    // 🔍 DIAGNOSTIC LOG - Données du projet au moment de l'ouverture de la modal (DEV only)
    if (import.meta.env.DEV) {
      console.log('[MODAL DEBUG]', {
        slug: project.slug,
        title: project.title,
        videoEmbedUrl: project.videoEmbedUrl,
        media: project.media,
        video: project.video,
        audio: project.audio,
        hasVideo: project.media?.video,
        hasAudio: project.media?.audio,
      });
    }

    this.triggerElement = triggerElement ?? null;

    this.syncLenisInstance();
    this.stopLenis();
    document.body.classList.add('project-modal-open');

    const tagEl = document.getElementById('project-modal-tag');
    const titleEl = document.getElementById('project-modal-title');
    const metaEl = document.getElementById('project-modal-meta');
    const descriptionEl = document.getElementById('project-modal-description');
    const statsContainer = document.getElementById('project-modal-stats');
    const statsGrid = document.getElementById('project-modal-stats-content');
    const visualContainer = document.getElementById('project-modal-visual');
    const videoContainer = document.getElementById('project-modal-video');
    const audioContainer = document.getElementById('project-modal-audio');
    const mediaFromLoader = this.resolveProjectMedia(project.slug);

    if (tagEl) tagEl.textContent = project.category;
    if (titleEl) titleEl.textContent = project.title;
    if (metaEl) metaEl.textContent = [project.client, project.year, project.location].filter(Boolean).join(' · ');

    if (descriptionEl) {
      descriptionEl.innerHTML = '';
      project.longDescription.forEach((paragraph) => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        descriptionEl.appendChild(p);
      });
    }

    if (statsContainer && statsGrid) {
      const stats = [
        { label: 'Secteur', value: SECTOR_LABELS[project.sector] },
        { label: 'Format', value: project.details.format },
        { label: 'Durée', value: project.details.duration },
        { label: 'Public', value: project.details.audience },
        { label: 'Livrables', value: project.details.deliverables.join(' • ') },
        { label: 'Thèmes', value: project.themes.join(' • ') },
        { label: 'Équipe', value: project.team.join(' • ') },
      ].filter((entry) => Boolean(entry.value));

      statsGrid.innerHTML = '';
      stats.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'stat-item';

        const term = document.createElement('dt');
        term.textContent = entry.label;

        const definition = document.createElement('dd');
        definition.textContent = entry.value;

        item.append(term, definition);
        statsGrid.appendChild(item);
      });

      statsContainer.style.display = stats.length ? 'block' : 'none';
    }

    this.destroyCurrentMediaPlayers();
    this.setupProjectMedia({
      project,
      visualContainer,
      videoContainer,
      audioContainer,
      media: mediaFromLoader,
    });

    this.modal.classList.add('active');
    (this.modal as HTMLElement).scrollTop = 0;
    this.setModalAccessibility(true);
    this.refreshFocusableElements();

    const initialFocusTarget = this.focusableElements[0] || this.closeButton;
    if (initialFocusTarget) {
      initialFocusTarget.focus();
    }

    document.addEventListener('keydown', this.keydownHandler);
  }

  close() {
    if (!this.modal) return;

    this.modal.classList.remove('active');
    document.body.classList.remove('project-modal-open');
    this.resumeLenis();

    this.destroyCurrentMediaPlayers();
    this.setModalAccessibility(false);
    document.removeEventListener('keydown', this.keydownHandler);

    if (this.triggerElement && typeof this.triggerElement.focus === 'function') {
      this.triggerElement.focus();
    }
    this.triggerElement = null;
  }

  private destroyCurrentMediaPlayers() {
    this.clearAudioReadyTimeout();
    this.audioFallbackApplied = false;

    this.stopCurrentAudioPlayback();

    if (this.currentAudioPlayer) {
      if (typeof this.currentAudioPlayer.stop === 'function') {
        try {
          this.currentAudioPlayer.stop();
        } catch (error) {
          console.error('[ProjectModal] Impossible d\'arrêter le player audio', error);
        }
      }

      destroyProjectAudioPlayer(this.currentAudioPlayer);
      this.currentAudioPlayer = null;
    }

    this.currentFallbackAudio = null;

    const videoContainer = document.getElementById('project-modal-video');
    if (videoContainer) {
      videoContainer.innerHTML = '';
      videoContainer.style.display = 'none';
      videoContainer.setAttribute('aria-hidden', 'true');
    }

    const visualContainer = document.getElementById('project-modal-visual');
    if (visualContainer) {
      const iframe = visualContainer.querySelector('iframe');
      if (iframe) {
        // Stop YouTube/Vimeo video by clearing src, then restore it for next open
        const currentSrc = iframe.getAttribute('src');
        if (currentSrc) {
          iframe.setAttribute('data-src', currentSrc);
          iframe.setAttribute('src', '');
        }
      }

      const inlineVideo = visualContainer.querySelector('video');
      if (inlineVideo) {
        try {
          inlineVideo.pause();
          inlineVideo.currentTime = 0;
        } catch (error) {
          console.error('[ProjectModal] Impossible de réinitialiser la vidéo inline', error);
        }
      }

      visualContainer.innerHTML = '';
      visualContainer.style.display = 'none';
      visualContainer.setAttribute('aria-hidden', 'true');
    }
  }

  private syncLenisInstance() {
    if (typeof window !== 'undefined' && window.lenis) {
      this.lenis = window.lenis;
    }
  }

  private stopLenis() {
    if (this.lenis?.stop) {
      try {
        this.lenis.stop();
        this.lenisWasActive = true;
      } catch (error) {
        console.error('[ProjectModal] Impossible d\'arrêter Lenis', error);
        this.lenisWasActive = false;
      }
    } else {
      this.lenisWasActive = false;
    }
  }

  private resumeLenis() {
    if (this.lenisWasActive && this.lenis?.start) {
      try {
        this.lenis.start();
      } catch (error) {
        console.error('[ProjectModal] Impossible de relancer Lenis', error);
      }
    }

    this.lenisWasActive = false;
  }

  private setupProjectMedia({
    project,
    visualContainer,
    videoContainer,
    audioContainer,
    media,
  }: {
    project: Project;
    visualContainer: HTMLElement | null;
    videoContainer: HTMLElement | null;
    audioContainer: HTMLElement | null;
    media: ProjectMedia;
  }) {
    const heroImage = media.heroImage || project.coverSrc || project.thumbnailSrc || null;

    // Calcul de effectiveVideoEmbedUrl avec fallback sur la map de sécurité
    const slug = project.slug;
    const fallbackEmbed = slug && YOUTUBE_EMBEDS_BY_SLUG[slug] ? YOUTUBE_EMBEDS_BY_SLUG[slug] : undefined;
    const effectiveVideoEmbedUrl =
      project.videoEmbedUrl && project.videoEmbedUrl.trim().length > 0
        ? project.videoEmbedUrl
        : fallbackEmbed || null;

    const videoSrc =
      effectiveVideoEmbedUrl
        ? null
        : media.heroVideo ||
          project.media?.video ||
          project.video?.files?.mp4 ||
          project.video?.files?.webm ||
          project.video?.files?.mov ||
          null;
    const audioSrc = media.audioTrack || project.audio?.files?.mp3 || project.media?.audio || null;
    const visualLabel = [project.title, project.location].filter(Boolean).join(' – ') || project.title;

    if (videoContainer) {
      videoContainer.style.display = 'none';
      videoContainer.classList.remove('is-loading');
      videoContainer.removeAttribute('aria-busy');
      videoContainer.innerHTML = '';
      videoContainer.setAttribute('aria-hidden', 'true');
    }
    if (audioContainer) {
      audioContainer.style.display = 'none';
      audioContainer.innerHTML = '';
    }

    this.renderHeroVisual({
      heroImage,
      videoSrc,
      videoEmbedUrl: effectiveVideoEmbedUrl,
      visualContainer,
      videoContainer,
      visualLabel,
    });

    if (audioContainer && audioSrc) {
      try {
        const audioConfig =
          project.audio?.enabled && project.audio.files?.mp3
            ? { ...project.audio, files: { ...project.audio.files, mp3: audioSrc } }
            : {
                enabled: true,
                title: project.title,
                files: { mp3: audioSrc },
                description: project.details?.format,
              };

        const projectWithAudio: Project = { ...project, audio: audioConfig };

        audioContainer.style.display = 'block';
        audioContainer.removeAttribute('aria-hidden');
        this.currentAudioPlayer = createProjectAudioPlayer(audioContainer, projectWithAudio);

        if (this.currentAudioPlayer?.on) {
          this.audioFallbackApplied = false;
          this.audioReadyTimeout = window.setTimeout(() => {
            this.applyAudioFallback({
              audioContainer,
              audioSrc,
              project,
              reason: 'timeout: wave surfer ready non reçu',
            });
          }, 5000);

          this.currentAudioPlayer.on('ready', () => {
            this.clearAudioReadyTimeout();
          });

          this.currentAudioPlayer.on('error', (error: unknown) => {
            this.clearAudioReadyTimeout();
            console.error('[ProjectModal] Erreur WaveSurfer – bascule fallback', project.slug, error);
            this.applyAudioFallback({ audioContainer, audioSrc, project, reason: 'wavesurfer error' });
          });
        } else if (!this.currentAudioPlayer) {
          this.applyAudioFallback({ audioContainer, audioSrc, project, reason: 'init manquante' });
        }
      } catch (error) {
        console.error(
          '[ProjectModal] Impossible d\'initialiser le lecteur audio pour',
          project.slug,
          error,
        );
        audioContainer.style.display = 'none';
        audioContainer.setAttribute('aria-hidden', 'true');
        audioContainer.innerHTML = '';
      }
    }
  }

  private applyAudioFallback({
    audioContainer,
    audioSrc,
    project,
    reason,
  }: {
    audioContainer: HTMLElement;
    audioSrc: string;
    project: Project;
    reason: string;
  }) {
    if (this.audioFallbackApplied) return;
    this.audioFallbackApplied = true;
    this.clearAudioReadyTimeout();
    destroyProjectAudioPlayer(this.currentAudioPlayer);
    this.currentAudioPlayer = null;
    this.currentFallbackAudio = null;

    audioContainer.innerHTML = `
      <section class="project-audio" aria-label="Lecteur audio du projet">
        <p class="project-audio__label">Extrait audio</p>
      </section>
    `;

    const projectAudioSection = audioContainer.querySelector('.project-audio');
    if (!projectAudioSection) {
      console.error('[ProjectModal] Impossible de créer le conteneur audio de fallback');
      return;
    }

    const audioEl = document.createElement('audio');
    audioEl.className = 'project-audio__native';
    audioEl.controls = true;
    audioEl.preload = 'metadata';
    audioEl.src = audioSrc;
    audioEl.setAttribute('aria-label', `Lecture audio pour ${project.title}`);
    audioEl.addEventListener('error', (event) => {
      console.error('[ProjectModal] Fallback audio HTML5 en erreur pour', project.slug, reason, event);
    });

    projectAudioSection.appendChild(audioEl);

    this.currentFallbackAudio = audioEl;

    console.error('[ProjectModal] Fallback audio HTML5 utilisé pour', project.slug, reason);
  }

  private clearAudioReadyTimeout() {
    if (this.audioReadyTimeout !== null) {
      window.clearTimeout(this.audioReadyTimeout);
      this.audioReadyTimeout = null;
    }
  }

  private resolveProjectMedia(slug: string): ProjectMedia {
    try {
      return getProjectMedia(slug);
    } catch (error) {
      console.error('[ProjectModal] Impossible de récupérer les médias du projet', slug, error);
      return { ...EMPTY_MEDIA };
    }
  }

  private getVideoMimeType(src: string): string {
    if (src.endsWith('.webm')) return 'video/webm';
    if (src.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4';
  }

  private renderHeroVisual({
    heroImage,
    videoSrc,
    videoEmbedUrl,
    visualContainer,
    videoContainer,
    visualLabel,
  }: {
    heroImage: string | null;
    videoSrc: string | null;
    videoEmbedUrl: string | null;
    visualContainer: HTMLElement | null;
    videoContainer: HTMLElement | null;
    visualLabel: string;
  }) {
    if (!visualContainer) return;

    // Logique simplifiée : si embed dispo → iframe, sinon vidéo locale, sinon image
    const hasEmbed = Boolean(videoEmbedUrl);
    const hasFileVideo = Boolean(videoSrc);

    visualContainer.innerHTML = '';

    if (hasEmbed) {
      // Branche iframe YouTube/Vimeo (nocookie)
      const embedWrapper = document.createElement('div');
      embedWrapper.className = 'project-modal__visual-embed';

      const iframe = document.createElement('iframe');
      iframe.className = 'project-modal__visual-iframe';
      iframe.src = videoEmbedUrl!;
      iframe.title = visualLabel || 'Vidéo du projet';
      iframe.loading = 'lazy';
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;

      embedWrapper.appendChild(iframe);

      // Lien fallback pour navigateurs/bloqueurs qui empêchent l'iframe
      const fallbackLink = document.createElement('a');
      fallbackLink.href = videoEmbedUrl!.replace('youtube-nocookie.com', 'youtube.com');
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      fallbackLink.className = 'project-modal__video-fallback-link';
      fallbackLink.textContent = 'Voir la vidéo sur YouTube';

      visualContainer.appendChild(embedWrapper);
      visualContainer.appendChild(fallbackLink);
      visualContainer.style.display = 'block';
      visualContainer.removeAttribute('aria-hidden');
    } else if (hasFileVideo) {
      // Branche <video> HTML5 locale
      const videoEl = document.createElement('video');
      videoEl.className = 'project-modal__visual-video';
      videoEl.controls = true;
      videoEl.preload = 'metadata';
      videoEl.playsInline = true;
      videoEl.setAttribute('aria-label', `Vidéo du projet ${visualLabel}`);
      if (heroImage) {
        videoEl.poster = heroImage;
      }

      const source = document.createElement('source');
      source.src = videoSrc!;
      source.type = this.getVideoMimeType(videoSrc!);
      videoEl.appendChild(source);

      videoEl.addEventListener('error', () => {
        this.renderFallbackImage({ visualContainer, heroImage, visualLabel });
      });

      visualContainer.appendChild(videoEl);
      visualContainer.style.display = 'block';
      visualContainer.removeAttribute('aria-hidden');
    } else if (heroImage) {
      // Image de couverture
      this.renderFallbackImage({ visualContainer, heroImage, visualLabel });
    } else {
      // Placeholder neutre
      visualContainer.style.display = 'none';
      visualContainer.setAttribute('aria-hidden', 'true');
    }

    if (videoContainer) {
      videoContainer.style.display = 'none';
      videoContainer.setAttribute('aria-hidden', 'true');
      videoContainer.innerHTML = '';
    }
  }

  private renderFallbackImage({
    visualContainer,
    heroImage,
    visualLabel,
  }: {
    visualContainer: HTMLElement;
    heroImage: string | null;
    visualLabel: string;
  }) {
    visualContainer.innerHTML = '';
    if (!heroImage) {
      visualContainer.style.display = 'none';
      visualContainer.setAttribute('aria-hidden', 'true');
      return;
    }

    const imgEl = document.createElement('img');
    imgEl.loading = 'lazy';
    imgEl.src = heroImage;
    imgEl.alt = visualLabel;

    visualContainer.appendChild(imgEl);
    visualContainer.style.display = 'block';
    visualContainer.removeAttribute('aria-hidden');
  }

  private setModalAccessibility(isOpen: boolean) {
    if (!this.modal) return;

    this.modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

    if (isOpen) {
      this.modal.removeAttribute('inert');
    } else {
      this.modal.setAttribute('inert', '');
    }
  }

  private applyModalAccessibilityAttributes() {
    if (!this.modal) return;

    const labelledBy = this.modal.querySelector<HTMLElement>('#project-modal-title');
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');
    if (labelledBy?.id) {
      this.modal.setAttribute('aria-labelledby', labelledBy.id);
    }
  }

  private stopCurrentAudioPlayback() {
    try {
      if (this.currentAudioPlayer?.pause) {
        this.currentAudioPlayer.pause();
      }

      if (this.currentAudioPlayer?.seekTo) {
        this.currentAudioPlayer.seekTo(0);
      }
    } catch (error) {
      console.error('[ProjectModal] Impossible de réinitialiser WaveSurfer', error);
    }

    if (this.currentFallbackAudio) {
      try {
        this.currentFallbackAudio.pause();
        this.currentFallbackAudio.currentTime = 0;
      } catch (error) {
        console.error('[ProjectModal] Impossible d\'arrêter l\'audio natif', error);
      }
    }

    const nativeAudio = document.getElementById('project-modal-audio')?.querySelector('audio');
    if (nativeAudio && nativeAudio !== this.currentFallbackAudio) {
      try {
        nativeAudio.pause();
        nativeAudio.currentTime = 0;
      } catch (error) {
        console.error('[ProjectModal] Impossible d\'arrêter un audio HTML5', error);
      }
    }
  }

  private refreshFocusableElements() {
    if (!this.modal) {
      this.focusableElements = [];
      return;
    }

    const selectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    this.focusableElements = Array.from(
      this.modal.querySelectorAll<HTMLElement>(selectors.join(','))
    ).filter((el) => el.offsetParent !== null);
  }

  private handleKeydown(event: KeyboardEvent) {
    if (!this.modal?.classList.contains('active')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') return;

    this.refreshFocusableElements();
    if (!this.focusableElements.length) return;

    const first = this.focusableElements[0];
    const last = this.focusableElements[this.focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
