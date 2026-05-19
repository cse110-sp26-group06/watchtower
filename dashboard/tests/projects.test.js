import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  addStoredProject,
  deleteStoredProject,
  getNextProjectName,
  getStoredProjects,
  normalizeProjectName,
  renameStoredProject,
  setCurrentProject,
} from '../scripts/utils/projects.js';

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

beforeEach(() => {
  global.window = {
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
  };
});

test('normalizeProjectName trims and collapses whitespace', () => {
  assert.equal(normalizeProjectName('  My   Project  Name  '), 'My Project Name');
});

test('getNextProjectName returns the next available numbered project', () => {
  window.localStorage.setItem('watchtower:projects', JSON.stringify([
    { id: 'p1', name: 'Project 1', apiKey: 'key-1', createdAt: '2026-05-19T00:00:00.000Z' },
    { id: 'p2', name: 'Project 2', apiKey: 'key-2', createdAt: '2026-05-19T00:00:00.000Z' },
  ]));

  assert.equal(getNextProjectName(), 'Project 3');
});

test('addStoredProject persists a normalized unique name', () => {
  const project = addStoredProject({
    id: 'p1',
    name: '  Project   Alpha  ',
    apiKey: 'wt_test_123',
    createdAt: '2026-05-19T00:00:00.000Z',
  });

  assert.equal(project.name, 'Project Alpha');
  assert.deepEqual(getStoredProjects(), [project]);
});

test('addStoredProject rejects duplicate names case-insensitively', () => {
  addStoredProject({
    id: 'p1',
    name: 'Project Alpha',
    apiKey: 'wt_test_123',
    createdAt: '2026-05-19T00:00:00.000Z',
  });

  assert.throws(() => addStoredProject({
    id: 'p2',
    name: '  project alpha ',
    apiKey: 'wt_test_456',
    createdAt: '2026-05-19T00:00:00.000Z',
  }), /Project name must be unique\./);
});

test('renameStoredProject updates the active project in session storage', () => {
  const project = addStoredProject({
    id: 'p1',
    name: 'Project Alpha',
    apiKey: 'wt_test_123',
    createdAt: '2026-05-19T00:00:00.000Z',
  });

  setCurrentProject(project);
  const renamedProject = renameStoredProject('p1', 'Renamed Project');

  assert.equal(renamedProject.name, 'Renamed Project');
  assert.equal(
    JSON.parse(window.sessionStorage.getItem('watchtower:current-project')).name,
    'Renamed Project'
  );
});

test('deleteStoredProject removes the project and clears current-project session state', () => {
  const project = addStoredProject({
    id: 'p1',
    name: 'Project Alpha',
    apiKey: 'wt_test_123',
    createdAt: '2026-05-19T00:00:00.000Z',
  });

  setCurrentProject(project);
  deleteStoredProject('p1');

  assert.deepEqual(getStoredProjects(), []);
  assert.equal(window.sessionStorage.getItem('watchtower:current-project'), null);
});
