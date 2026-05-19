const PROJECTS_STORAGE_KEY = 'watchtower:projects';
const CURRENT_PROJECT_STORAGE_KEY = 'watchtower:current-project';

export function normalizeProjectName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function getStoredProjects() {
  try {
    const rawProjects = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    return rawProjects ? JSON.parse(rawProjects) : [];
  } catch {
    return [];
  }
}

export function saveStoredProjects(projects) {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  syncCurrentProject(projects);
}

export function isProjectNameUnique(name, projects = getStoredProjects(), excludeId = null) {
  const normalizedName = normalizeProjectName(name).toLocaleLowerCase();
  if (!normalizedName) {return false;}

  return projects.every((project) => {
    if (excludeId && project.id === excludeId) {
      return true;
    }

    return normalizeProjectName(project.name).toLocaleLowerCase() !== normalizedName;
  });
}

export function getNextProjectName(projects = getStoredProjects()) {
  let index = 1;

  while (!isProjectNameUnique(`Project ${index}`, projects)) {
    index += 1;
  }

  return `Project ${index}`;
}

export function addStoredProject(project) {
  const projects = getStoredProjects();
  const normalizedName = normalizeProjectName(project.name);

  if (!normalizedName) {
    throw new Error('Project name is required.');
  }

  if (!isProjectNameUnique(normalizedName, projects)) {
    throw new Error('Project name must be unique.');
  }

  const nextProject = {
    ...project,
    name: normalizedName,
  };

  projects.push(nextProject);
  saveStoredProjects(projects);
  return nextProject;
}

export function renameStoredProject(projectId, nextName) {
  const projects = getStoredProjects();
  const normalizedName = normalizeProjectName(nextName);

  if (!normalizedName) {
    throw new Error('Project name is required.');
  }

  if (!isProjectNameUnique(normalizedName, projects, projectId)) {
    throw new Error('Project name must be unique.');
  }

  let renamedProject = null;
  const nextProjects = projects.map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    renamedProject = {
      ...project,
      name: normalizedName,
    };

    return renamedProject;
  });

  if (!renamedProject) {
    throw new Error('Project not found.');
  }

  saveStoredProjects(nextProjects);
  return renamedProject;
}

export function deleteStoredProject(projectId) {
  const projects = getStoredProjects();
  const nextProjects = projects.filter((project) => project.id !== projectId);

  if (nextProjects.length === projects.length) {
    throw new Error('Project not found.');
  }

  saveStoredProjects(nextProjects);
}

export function setCurrentProject(project) {
  window.sessionStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, JSON.stringify(project));
}

function syncCurrentProject(projects) {
  try {
    const rawCurrentProject = window.sessionStorage.getItem(CURRENT_PROJECT_STORAGE_KEY);
    if (!rawCurrentProject) {return;}

    const currentProject = JSON.parse(rawCurrentProject);
    const nextCurrentProject = projects.find((project) => project.id === currentProject.id);

    if (nextCurrentProject) {
      setCurrentProject(nextCurrentProject);
      return;
    }

    window.sessionStorage.removeItem(CURRENT_PROJECT_STORAGE_KEY);
  } catch {
    window.sessionStorage.removeItem(CURRENT_PROJECT_STORAGE_KEY);
  }
}
