import { createSession, getRedirectTarget, getSession, redirectToDashboard, validateCredentials } from '../../utils/auth.js';

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const submitButton = document.getElementById('login-submit');

if (getSession()) {
  redirectToDashboard();
}

/**
 * Renders a field error and syncs accessibility state.
 * @param {HTMLInputElement} input
 * @param {HTMLElement | null} errorNode
 * @param {string} message
 * @returns {void}
 */
function setFieldError(input, errorNode, message) {
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  input.setCustomValidity(message);
  if (errorNode) {errorNode.textContent = message;}
}

/**
 * Validates the current form values.
 * @returns {boolean}
 */
function validateForm() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const errors = validateCredentials(email, password);

  setFieldError(emailInput, emailError, errors.email);
  setFieldError(passwordInput, passwordError, errors.password);

  return !errors.email && !errors.password;
}

emailInput?.addEventListener('input', () => {
  if (emailInput.getAttribute('aria-invalid') === 'true') {validateForm();}
});

passwordInput?.addEventListener('input', () => {
  if (passwordInput.getAttribute('aria-invalid') === 'true') {validateForm();}
});

form?.addEventListener('submit', event => {
  event.preventDefault();

  if (!validateForm()) {
    const invalidField = [emailInput, passwordInput].find(input => input.validationMessage);
    invalidField?.reportValidity();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Signing In...';

  createSession(emailInput.value.trim());

  const target = getRedirectTarget();
  window.location.replace(target);
});

form?.setAttribute('data-ready', 'true');
submitButton.disabled = false;
