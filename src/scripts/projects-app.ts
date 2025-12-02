import { getAllProjects, getUniqueSectors } from '@/data/projects.loader';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { SectorFilter } from '@/components/projects/SectorFilter';
import type { Project, ProjectSector } from '@/types/project';
import { devLog } from '@/scripts/utils/logger';

export async function initProjectsApp() {
  devLog('🚀 initProjectsApp: Démarrage');

  const INITIAL_PROJECT_COUNT = 6;

  const FEATURED_ORDER = [
    'la-force-de-la-douceur',
    'sival',
    'a2mo',
    'atelier-lacour',
    'le-jardin-de-cocagne',
    'les-seigneurs-de-clisson',
    'etat-de-nature',
  ];

  const sortProjects = (a: Project, b: Project) => {
    const indexA = FEATURED_ORDER.indexOf(a.id);
    const indexB = FEATURED_ORDER.indexOf(b.id);

    const aFeatured = indexA !== -1;
    const bFeatured = indexB !== -1;

    if (aFeatured && bFeatured) return indexA - indexB;
    if (aFeatured) return -1;
    if (bFeatured) return 1;

    const yearDiff = b.year - a.year;
    if (yearDiff !== 0) return yearDiff;

    return a.title.localeCompare(b.title);
  };

  const filtersContainer = document.querySelector('.projects__filters--all');
  const featuredGridContainer = document.querySelector('.projects__grid--featured');
  const allGridContainer = document.querySelector('.projects__grid--all');
  const viewAllButton = document.querySelector('[data-projects-view-all]') as HTMLButtonElement | null;

  if (!filtersContainer && !allGridContainer && !featuredGridContainer) {
    console.warn('⚠️ initProjectsApp: Aucun container de projets trouvé');
    return;
  }

  let projects = getAllProjects().sort(sortProjects);
  let sectors = getUniqueSectors();

  // 🚨 FALLBACK: Si getAllProjects() renvoie un tableau vide (validation Zod échouée),
  // charger directement depuis le JSON brut
  if (projects.length === 0) {
    console.warn('⚠️ FALLBACK activé: chargement direct du JSON...');
    try {
      const { default: projectsData } = await import('../../content/projects.json');
      projects = (projectsData as any[]).sort(sortProjects);
      sectors = Array.from(new Set(projects.map((p: any) => p.sector).filter(Boolean)));
      devLog(`✅ FALLBACK: ${projects.length} projets chargés`);
    } catch (fallbackError) {
      console.error('❌ FALLBACK échoué:', fallbackError);
      projects = [];
      sectors = [];
    }
  }

  devLog(`📊 initProjectsApp: ${projects.length} projets, ${sectors.length} secteurs uniques`, {
    sectors,
  });

  const modal = new ProjectModal();
  const featuredGrid = featuredGridContainer
    ? new ProjectGrid({
        container: featuredGridContainer as HTMLElement,
        onSelect: (project: Project, trigger?: HTMLElement | null) => modal.open(project, trigger),
      })
    : null;

  const fullGrid = allGridContainer
    ? new ProjectGrid({
        container: allGridContainer as HTMLElement,
        onSelect: (project: Project, trigger?: HTMLElement | null) => modal.open(project, trigger),
      })
    : null;

  const renderInitialProjects = () => {
    if (featuredGrid) {
      featuredGrid.render(projects.slice(0, INITIAL_PROJECT_COUNT));
      return;
    }

    fullGrid?.render(projects.slice(0, INITIAL_PROJECT_COUNT));
  };

  const renderAllProjects = () => {
    featuredGrid?.render(projects);
    fullGrid?.render(projects);
  };

  const handleFilterChange = (sector: ProjectSector | 'tous') => {
    const filtered = sector === 'tous' ? projects : projects.filter((project) => project.sector === sector);
    devLog(`🔍 Filtrage: secteur="${sector}", ${filtered.length} projets affichés`);
    fullGrid?.render(filtered);
  };

  if (filtersContainer && fullGrid) {
    new SectorFilter({
      container: filtersContainer as HTMLElement,
      sectors,
      selected: 'tous',
      onChange: handleFilterChange,
    });
  }

  renderInitialProjects();

  if (viewAllButton && projects.length <= INITIAL_PROJECT_COUNT) {
    viewAllButton.hidden = true;
  }

  if (viewAllButton) {
    viewAllButton.addEventListener('click', () => {
      renderAllProjects();
      viewAllButton.disabled = true;
      viewAllButton.textContent = 'Tous nos projets sont affichés';
      viewAllButton.classList.add('projects__view-all--done');
    });
  }

  devLog('✅ initProjectsApp: Rendu complet');
}
