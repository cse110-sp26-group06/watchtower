import { requireAuth } from '../../utils/auth.js';
import { escHtml } from '../../utils/dom.js';
import {
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
        <button type="button" class="btn btn--outline project-item__rename">Rename</button>
      </div>
      <div class="project-item__status">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.75"></circle><line x1="12" y1="8.25" x2="12" y2="12.4"></line><circle cx="12" cy="15.85" r="0.9" fill="currentColor" stroke="none"></circle></svg>
        <span>0 errors in last 24h</span>
      </div>
      <div class="project-item__meta">Created ${date}</div>
    `;

    const renameButton = projectCard.querySelector('.project-item__rename');
    renameButton.addEventListener('click', (event) => {
      event.stopPropagation();
      handleRenameProject(project);
    });
    renameButton.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.stopPropagation();
      }
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

window.addEventListener('DOMContentLoaded', renderProjects);
