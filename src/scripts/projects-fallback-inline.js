/**
 * ====================================================================
 * FALLBACK ULTRA-ROBUSTE POUR L'AFFICHAGE DES PROJETS
 * ====================================================================
 * Ce script garantit que les cartes projets s'affichent, même si
 * le pipeline TypeScript/Zod/loader principal échoue.
 *
 * Il charge directement depuis content/projects.json et rend les cartes
 * dans le DOM avec du HTML/CSS vanilla.
 * ====================================================================
 */

(async function initProjectsFallback() {
  console.log('🚨 FALLBACK: Démarrage du système de secours pour les projets');

  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }

  // Attendre 2 secondes pour laisser le système principal tenter de se lancer
  await new Promise(resolve => setTimeout(resolve, 2000));

  const gridContainer = document.querySelector('.projects__grid');
  const filtersContainer = document.querySelector('.projects__filters');

  if (!gridContainer) {
    console.warn('🚨 FALLBACK: Conteneur .projects__grid non trouvé');
    return;
  }

  // Si des cartes sont déjà rendues, ne rien faire
  if (gridContainer.children.length > 0) {
    console.log('✅ FALLBACK: Des cartes sont déjà rendues, pas besoin du fallback');
    return;
  }

  console.log('🚨 FALLBACK: Aucune carte rendue, activation du fallback');

  try {
    // Charger les projets depuis le JSON
    const response = await fetch('/content/projects.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const projects = await response.json();
    console.log(`✅ FALLBACK: ${projects.length} projets chargés depuis le JSON`);

    // Rendre les cartes
    projects.forEach(project => {
      const card = document.createElement('article');
      card.className = 'project-card card-lift';
      card.dataset.projectId = project.id;
      card.dataset.sector = project.sector;

      const gradient = `linear-gradient(135deg, ${project.cover?.gradient?.from || 'var(--color-primary-500)'} 0%, ${project.cover?.gradient?.to || 'var(--color-primary-700)'} 100%)`;

      card.innerHTML = `
        <div class="project-card__visual">
          <div class="project-card__visual-frame" style="background-image: ${gradient}">
            ${project.thumbnailSrc || project.coverSrc ? `<img class="project-card__image" src="${project.thumbnailSrc || project.coverSrc}" alt="${project.title}" loading="lazy">` : ''}
            <span class="project-card__category">${project.category || ''}</span>
            <span class="project-card__initials">${project.cover?.initials || project.title.slice(0, 2).toUpperCase()}</span>
            <span class="project-card__location">${project.location || ''}</span>
          </div>
        </div>
        <div class="project-card__body">
          <div class="project-card__content">
            <div class="project-card__header">
              <h3 class="project-card__title">${project.title}</h3>
              <span class="project-card__year">${project.year}</span>
            </div>
            <p class="project-card__tagline">${project.shortDescription || ''}</p>
          </div>
          <div class="project-card__footer">
            ${project.tags && project.tags.length ? `
              <div class="project-card__tags">
                ${project.tags.slice(0, 4).map(tag => `<span class="project-card__tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
            <div class="project-card__footer-row">
              <span class="project-card__status project-card__status--${project.status}">
                ${project.status === 'delivered' ? 'Livré' : project.status === 'in-progress' ? 'En cours' : 'Planifié'}
              </span>
              <button type="button" class="project-card__link">Voir le projet</button>
            </div>
          </div>
        </div>
      `;

      gridContainer.appendChild(card);
    });

    console.log(`✅ FALLBACK: ${projects.length} cartes rendues avec succès`);

    // Mettre à jour le debug div si présent
    const debugDiv = document.getElementById('debug-info');
    if (debugDiv) {
      debugDiv.innerHTML = `
        🚨 FALLBACK activé<br>
        📦 ${projects.length} projets chargés<br>
        ✅ Cartes rendues avec succès<br>
        ⏰ ${new Date().toLocaleTimeString()}
      `;
    }

  } catch (error) {
    console.error('❌ FALLBACK: Erreur lors du chargement:', error);

    const debugDiv = document.getElementById('debug-info');
    if (debugDiv) {
      debugDiv.innerHTML = `
        ❌ FALLBACK échoué<br>
        Erreur: ${error.message}<br>
        ⏰ ${new Date().toLocaleTimeString()}
      `;
    }
  }
})();
