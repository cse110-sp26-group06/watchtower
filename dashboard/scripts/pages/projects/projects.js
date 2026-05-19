import { requireAuth } from '../../utils/auth.js';
import { escHtml } from '../../utils/dom.js';
import {
  deleteStoredProject,
  getStoredProjects,
  normalizeProjectName,
  renameStoredProject,
  setCurrentProject,
} from '../../utils/projects.js';
import { showToast } from '../../utils/toast.js';

const session = requireAuth();

if (session) {
  const userEmailDisplay = document.getElementById('user-email-display');
  if (userEmailDisplay) {
    userEmailDisplay.textContent = `Logged in as ${session.email}`;
  }
}

const projectsList = document.getElementById('projects-list');
const newProjectBtn = document.getElementById('new-project-btn');
let openMenuButton = null;

function openProject(project) {
  setCurrentProject(project);
  window.location.assign('error-list.html');
}

function handleRenameProject(project) {
  const nextName = window.prompt('Rename project', project.name);
  if (nextName === null) {
    return;
  }

  try {
    renameStoredProject(project.id, normalizeProjectName(nextName));
    renderProjects();
    showToast('Project renamed.');
  } catch (error) {
    showToast(error.message, true);
  }
}

function handleDeleteProject(project) {
  const confirmed = window.confirm(`Delete "${project.name}"?`);
  if (!confirmed) {
    return;
  }

  try {
    deleteStoredProject(project.id);
    renderProjects();
    showToast('Project deleted.');
  } catch (error) {
    showToast(error.message, true);
  }
}

function closeProjectMenu(button) {
  if (!button) {
    return;
  }

  button.setAttribute('aria-expanded', 'false');
  const menu = button.parentElement?.querySelector('.project-item__menu');
  menu?.setAttribute('hidden', '');
  if (openMenuButton === button) {
    openMenuButton = null;
  }
}

function openProjectMenu(button) {
  if (openMenuButton && openMenuButton !== button) {
    closeProjectMenu(openMenuButton);
  }

  button.setAttribute('aria-expanded', 'true');
  const menu = button.parentElement?.querySelector('.project-item__menu');
  menu?.removeAttribute('hidden');
  openMenuButton = button;
}

function toggleProjectMenu(button) {
  const isExpanded = button.getAttribute('aria-expanded') === 'true';

  if (isExpanded) {
    closeProjectMenu(button);
    return;
  }

  openProjectMenu(button);
}

function renderProjects() {
  const projects = getStoredProjects();

  if (projects.length === 0) {
    window.location.replace('onboarding.html');
    return;
  }

  projectsList.innerHTML = '';

  projects.forEach((project) => {
    const date = new Date(project.createdAt).toLocaleDateString('en-US');

    const projectCard = document.createElement('div');
    projectCard.className = 'project-item';
    projectCard.tabIndex = 0;
    projectCard.setAttribute('role', 'link');
    projectCard.setAttribute('aria-label', `Open ${project.name}`);
    projectCard.innerHTML = `
      <div class="project-item__header">
        <h3 class="project-item__title">${escHtml(project.name)}</h3>
        <div class="project-item__menu-wrap">
          <button
            type="button"
            class="project-item__menu-trigger"
            aria-label="Project actions for ${escHtml(project.name)}"
            aria-haspopup="menu"
            aria-expanded="false"
          >
            <span aria-hidden="true">•••</span>
          </button>
          <div class="project-item__menu" role="menu" hidden>
            <button type="button" class="project-item__menu-action" data-action="rename" role="menuitem">Rename Project</button>
            <button type="button" class="project-item__menu-action project-item__menu-action--danger" data-action="delete" role="menuitem">Delete Project</button>
          </div>
        </div>
      </div>
      <div class="project-item__status">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.75"></circle><line x1="12" y1="8.25" x2="12" y2="12.4"></line><circle cx="12" cy="15.85" r="0.9" fill="currentColor" stroke="none"></circle></svg>
        <span>0 errors in last 24h</span>
      </div>
      <div class="project-item__meta">Created ${date}</div>
    `;

    const menuTrigger = projectCard.querySelector('.project-item__menu-trigger');
    const menu = projectCard.querySelector('.project-item__menu');
    const menuActions = projectCard.querySelectorAll('.project-item__menu-action');

    menuTrigger.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleProjectMenu(menuTrigger);
    });
    menuTrigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.stopPropagation();
      }
    });

    menu.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.stopPropagation();
      }
    });

    menuActions.forEach((actionButton) => {
      actionButton.addEventListener('click', (event) => {
        event.stopPropagation();
        closeProjectMenu(menuTrigger);

        if (actionButton.dataset.action === 'rename') {
          handleRenameProject(project);
          return;
        }

        handleDeleteProject(project);
      });
      actionButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.stopPropagation();
        }
      });
    });

    projectCard.addEventListener('click', () => {
      openProject(project);
    });

    projectCard.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      openProject(project);
    });

    projectsList.appendChild(projectCard);
  });
}

newProjectBtn.addEventListener('click', () => {
  window.location.assign('onboarding.html');
});

document.addEventListener('click', (event) => {
  if (!openMenuButton) {
    return;
  }

  const menuWrap = openMenuButton.closest('.project-item__menu-wrap');
  if (menuWrap?.contains(event.target)) {
    return;
  }

  closeProjectMenu(openMenuButton);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openMenuButton) {
    closeProjectMenu(openMenuButton);
  }
});

window.addEventListener('DOMContentLoaded', renderProjects);
