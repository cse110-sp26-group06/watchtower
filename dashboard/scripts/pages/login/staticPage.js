import { renderNavbar } from '../../components/navbar.js';
import { requireAuth } from '../../utils/auth.js';

const session = requireAuth();

if (session) {
  renderNavbar(document.body.dataset.navId ?? '');
}
