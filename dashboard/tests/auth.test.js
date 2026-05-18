import test from 'node:test';
import assert from 'node:assert/strict';

import { isValidEmail, validateCredentials } from '../scripts/utils/auth.js';

test('isValidEmail accepts standard email formats', () => {
  assert.equal(isValidEmail('user@example.com'), true);
  assert.equal(isValidEmail('first.last+alerts@subdomain.company.org'), true);
});

test('isValidEmail rejects malformed email addresses', () => {
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail('user@company'), false);
  assert.equal(isValidEmail('user @company.com'), false);
  assert.equal(isValidEmail('user@ company.com'), false);
  assert.equal(isValidEmail(''), false);
});

test('validateCredentials reports both email and password errors when both are invalid', () => {
  assert.deepEqual(
    validateCredentials('not-an-email', 'short'),
    {
      email: 'Enter a valid email address.',
      password: 'Password must be at least 8 characters long.',
    }
  );
});

test('validateCredentials only reports a password error when email is valid', () => {
  assert.deepEqual(
    validateCredentials('user@example.com', '1234567'),
    {
      email: '',
      password: 'Password must be at least 8 characters long.',
    }
  );
});

test('validateCredentials passes valid email and minimum-length password', () => {
  assert.deepEqual(
    validateCredentials('user@example.com', '12345678'),
    {
      email: '',
      password: '',
    }
  );
});
