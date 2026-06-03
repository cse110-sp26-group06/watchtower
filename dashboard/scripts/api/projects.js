import { saveStoredProjects } from '../utils/projects.js';

const API_BASE_URL = 'https://watchtower-backend.group6.workers.dev/api';
const USER_ID_STORAGE_KEY = 'watchtower:user_id';
const USER_EMAIL_STORAGE_KEY = 'watchtower:user_email';

/**
 * Returns a persisted backend user id when it belongs to the active dashboard email.
 * @param {string} email - Active session email.
 * @returns {string | null}
 */
export function getStoredUserId(email) {
  const userId = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  const userEmail = window.localStorage.getItem(USER_EMAIL_STORAGE_KEY);

  if (!userId) {return null;}
  if (userEmail && userEmail !== email) {return null;}

  return userId;
}

/**
 * Creates a backend user for the active dashboard email and stores its id locally.
 * @param {string} email - Active session email.
 * @returns {Promise<string>}
 */
export async function createBackendUser(email) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create backend user: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'ok' || !data.user_id) {
    throw new Error('User API returned an invalid response.');
  }

  window.localStorage.setItem(USER_ID_STORAGE_KEY, data.user_id);
  window.localStorage.setItem(USER_EMAIL_STORAGE_KEY, data.email ?? email);

  return data.user_id;
}

/**
 * Gets the backend user id required for project-scoped backend requests.
 * @param {string} email - Active session email.
 * @returns {Promise<string>}
 */
export async function getOrCreateBackendUserId(email) {
  if (!email) {
    throw new Error('Login session is missing an email address.');
  }

  return getStoredUserId(email) ?? await createBackendUser(email);
}

/**
 * Fetches projects owned by the backend user.
 * @param {string} userId - Backend user id.
 * @returns {Promise<Array<{id: string, name: string, apiKey: string, createdAt: string}>>}
 */
export async function fetchBackendProjects(userId) {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'GET',
    headers: {
      'x-user-id': userId,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load projects: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'ok' || !Array.isArray(data.projects)) {
    throw new Error('Projects API returned an invalid response.');
  }

  return data.projects.map((project) => ({
    id: project.id,
    name: project.name,
    apiKey: project.api_key,
    createdAt: project.created_at,
  }));
}

/**
 * Loads backend projects for the signed-in user and stores them locally.
 * @param {string} email - Active session email.
 * @returns {Promise<Array<{id: string, name: string, apiKey: string, createdAt: string}>>}
 */
export async function syncBackendProjectsForEmail(email) {
  const userId = await getOrCreateBackendUserId(email);
  const projects = await fetchBackendProjects(userId);
  saveStoredProjects(projects);
  return projects;
}
