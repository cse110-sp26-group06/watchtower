const PROJECTS_STORAGE_KEY = 'watchtower:projects';
const CURRENT_PROJECT_STORAGE_KEY = 'watchtower:current-project';

/**
 * Trims a project name and collapses internal whitespace.
 * @param {string} value - Raw project name input.
 * @returns {string} Normalized project name.
 */
export function normalizeProjectName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Reads all locally stored dashboard projects.
 * @returns {Array<{id: string, name: string, apiKey: string, createdAt: string}>} Stored projects, or an empty array.
 */
export function getStoredProjects() {
  try {
    const rawProjects = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    return rawProjects ? JSON.parse(rawProjects) : [];
  } catch {
    return [];
  }
}

/**
 * Persists the complete project list and keeps the selected project in sync.
 * @param {Array<{id: string, name: string, apiKey: string, createdAt: string}>} projects - Projects to save.
 * @returns {void}
 */
export function saveStoredProjects(projects) {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  syncCurrentProject(projects);
}

/**
 * Checks whether a project name is non-empty and unique within a project list.
 * @param {string} name - Project name to check.
 * @param {Array<{id: string, name: string}>} [projects=getStoredProjects()] - Projects to compare against.
 * @param {string | null} [excludeId=null] - Existing project id to ignore during rename checks.
 * @returns {boolean} True when the normalized name is unique.
 */
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

/**
 * Returns the next available default project name.
 * @param {Array<{id: string, name: string}>} [projects=getStoredProjects()] - Existing projects.
 * @returns {string} A unique name in the form "Project N".
 */
export function getNextProjectName(projects = getStoredProjects()) {
  let index = 1;

  while (!isProjectNameUnique(`Project ${index}`, projects)) {
    index += 1;
  }

  return `Project ${index}`;
}

/**
 * Adds a new project to local storage after validating its name.
 * @param {{id: string, name: string, apiKey: string, createdAt: string}} project - Project to store.
 * @returns {{id: string, name: string, apiKey: string, createdAt: string}} Stored project with normalized name.
 * @throws {Error} When the project name is missing or already used.
 */
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

/**
 * Renames an existing stored project and syncs the active project selection.
 * @param {string} projectId - Project id to rename.
 * @param {string} nextName - New project name.
 * @returns {{id: string, name: string, apiKey: string, createdAt: string}} Renamed project.
 * @throws {Error} When the project is missing or the new name is invalid.
 */
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

/**
 * Deletes a stored project and clears the active project when needed.
 * @param {string} projectId - Project id to delete.
 * @returns {void}
 * @throws {Error} When no stored project matches the id.
 */
export function deleteStoredProject(projectId) {
  const projects = getStoredProjects();
  const nextProjects = projects.filter((project) => project.id !== projectId);

  if (nextProjects.length === projects.length) {
    throw new Error('Project not found.');
  }

  saveStoredProjects(nextProjects);
}

/**
 * Returns the selected project from local storage, using a single-project fallback.
 * @returns {{id: string, name: string, apiKey: string, createdAt: string} | null} Active project, or null when none can be resolved.
 */
export function getCurrentProject() {
  try {
    const projects = getStoredProjects();
    const rawCurrentProject = window.sessionStorage.getItem(CURRENT_PROJECT_STORAGE_KEY);

    if (rawCurrentProject) {
      const currentProject = JSON.parse(rawCurrentProject);
      const storedProject = projects.find((project) => project.id === currentProject.id);

      if (storedProject) {
        return storedProject;
      }
    }

    if (projects.length === 1) {
      setCurrentProject(projects[0]);
      return projects[0];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Stores the currently selected project for project-scoped dashboard pages.
 * @param {{id: string, name: string, apiKey: string, createdAt: string}} project - Project to mark active.
 * @returns {void}
 */
export function setCurrentProject(project) {
  window.sessionStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, JSON.stringify(project));
}

/**
 * Updates or removes the active project snapshot after the stored project list changes.
 * @param {Array<{id: string, name: string, apiKey: string, createdAt: string}>} projects - Current stored projects.
 * @returns {void}
 */
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
