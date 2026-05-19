import { requireAuth } from '../../utils/auth.js';

const session = requireAuth();

if (session) {
  const userEmailDisplay = document.getElementById('user-email-display');
  if (userEmailDisplay) {
    userEmailDisplay.textContent = `Logged in as ${session.email}`;
  }
}

const projectsList = document.getElementById('projects-list');
const newProjectBtn = document.getElementById('new-project-btn');

function renderProjects() {
  const rawProjects = window.localStorage.getItem('watchtower:projects');
  const projects = rawProjects ? JSON.parse(rawProjects) : [];

  if (projects.length === 0) {
    // If no projects, redirect to onboarding
    window.location.replace('onboarding.html');
    return;
  }

  projectsList.innerHTML = '';

  projects.forEach(project => {
    const date = new Date(project.createdAt).toLocaleDateString('en-US');
    
    const projectCard = document.createElement('a');
    projectCard.href = 'error-list.html';
    projectCard.className = 'project-item';
    projectCard.innerHTML = `
      <h3 class="project-item__title">${project.name}</h3>
      <div class="project-item__status">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.75"></circle><line x1="12" y1="8.25" x2="12" y2="12.4"></line><circle cx="12" cy="15.85" r="0.9" fill="currentColor" stroke="none"></circle></svg>
        <span>0 errors in last 24h</span>
      </div>
      <div class="project-item__meta">Created ${date}</div>
    `;

    // Optionally store the selected project in session when clicked
    projectCard.addEventListener('click', () => {
      window.sessionStorage.setItem('watchtower:current-project', JSON.stringify(project));
    });

    projectsList.appendChild(projectCard);
  });
}

newProjectBtn.addEventListener('click', () => {
  window.location.assign('onboarding.html');
});

// Render the projects when the DOM is loaded
window.addEventListener('DOMContentLoaded', renderProjects);
