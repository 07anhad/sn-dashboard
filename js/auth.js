/* ============================================================
   AUTH.JS — Login, Logout, Session, Signup, Forgot Password
   All auth calls go to the backend PostgreSQL via API.
   ============================================================ */

'use strict';

// Current selected role on login page
let currentRole = 'admin';

// ── Toggle admin/member on login page ─────
function switchRole(role) {
  currentRole = role;
  const btnAdmin  = document.getElementById('btnAdmin');
  const btnMember = document.getElementById('btnMember');
  const slider    = document.getElementById('toggleSlider');
  const hint      = document.getElementById('loginHint');
  const label     = document.getElementById('loginLabel');

  if (role === 'admin') {
    btnAdmin.classList.add('active');
    btnMember.classList.remove('active');
    slider.style.transform = 'translateX(0)';
    if (hint) hint.style.display = 'none';
    label.textContent = 'Username / Email';
  } else {
    btnMember.classList.add('active');
    btnAdmin.classList.remove('active');
    slider.style.transform = 'translateX(100%)';
    if (hint) hint.style.display = 'none';
    label.textContent = 'Member Username';
  }
  // Clear error
  const err = document.getElementById('loginError');
  if (err) err.style.display = 'none';
}

// ── Toggle password visibility ────────────
function togglePass() {
  const input = document.getElementById('loginPass');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ── Handle login form submission ──────────
function handleLogin(e) {
  e.preventDefault();
  const id   = document.getElementById('loginId').value.trim();
  const pass = document.getElementById('loginPass').value;
  const btn  = document.getElementById('loginBtn');
  const err  = document.getElementById('loginError');

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Signing in…';

  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: id, password: pass, role: currentRole })
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      sessionStorage.setItem('currentUser', JSON.stringify({
        username: data.user.username,
        name: data.user.name,
        role: data.user.role,
        email: data.user.email,
        memberId: data.user.member_id || null,
        memberUid: data.user.member_uid || null
      }));
      window.location.href = 'dashboard.html';
    } else {
      err.textContent = currentRole === 'admin'
        ? 'Invalid admin credentials. Please try again.'
        : 'Invalid member credentials. Please try again.';
      err.style.display = 'block';
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'Sign In';
    }
  })
  .catch(() => {
    err.textContent = 'Server error. Please try again later.';
    err.style.display = 'block';
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Sign In';
  });
}

// ── Logout ────────────────────────────────
function logout() {
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// ── Guard: redirect to login if not authed ─
function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

// ── Get current session user ──────────────
function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser'));
  } catch {
    return null;
  }
}

// ── On dashboard.html: guard + init UI ────
if (document.getElementById('userName')) {
  const user = requireAuth();
  if (user) {
    document.getElementById('userName').textContent  = user.name;
    document.getElementById('userRole').textContent  = user.role === 'superadmin' ? 'Super Administrator' : user.role === 'admin' ? 'Administrator' : 'Member';
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('topbarUser').textContent = user.name;
  }
}

// ── On login page: redirect if already logged in ─
if (document.getElementById('loginForm')) {
  const user = getCurrentUser();
  if (user) window.location.href = 'dashboard.html';
}

// ── Form switching ────────────────────────
function showSignup(e) {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('forgotForm').style.display = 'none';
  document.getElementById('signupForm').style.display = 'flex';
  document.getElementById('loginHint').style.display = 'none';
  document.querySelector('.login-toggle').style.display = 'none';
}

function showForgotPassword(e) {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('forgotForm').style.display = 'flex';
  document.getElementById('loginHint').style.display = 'none';
  document.querySelector('.login-toggle').style.display = 'none';
}

function showLoginForm(e) {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'flex';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('forgotForm').style.display = 'none';
  const hint = document.getElementById('loginHint');
  if (hint) hint.style.display = 'none';
  document.querySelector('.login-toggle').style.display = 'flex';
  // Clear messages
  ['signupError','signupSuccess','forgotError','forgotSuccess'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// ── Signup handler ────────────────────────
function handleSignup(e) {
  e.preventDefault();
  const name     = document.getElementById('signupName').value.trim();
  const username = document.getElementById('signupUsername').value.trim().toLowerCase();
  const email    = document.getElementById('signupEmail').value.trim().toLowerCase();
  const pass     = document.getElementById('signupPass').value;
  const confirm  = document.getElementById('signupConfirm').value;
  const consent  = document.getElementById('signupConsent')?.checked;
  const errEl    = document.getElementById('signupError');
  const succEl   = document.getElementById('signupSuccess');

  errEl.style.display = 'none';
  succEl.style.display = 'none';

  if (!consent) {
    errEl.textContent = 'You must give your data consent to create an account.';
    errEl.style.display = 'block';
    return;
  }

  if (pass !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block';
    return;
  }
  if (pass.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }
  if (!/^[a-z0-9._]+$/.test(username)) {
    errEl.textContent = 'Username can only contain lowercase letters, numbers, dots and underscores.';
    errEl.style.display = 'block';
    return;
  }

  fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, email, password: pass })
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      succEl.textContent = 'Account created! You can now sign in as "' + username + '".';
      succEl.style.display = 'block';
      document.getElementById('signupForm').reset();
    } else {
      errEl.textContent = data.error || 'Signup failed.';
      errEl.style.display = 'block';
    }
  })
  .catch(() => {
    errEl.textContent = 'Server error. Please try again later.';
    errEl.style.display = 'block';
  });
}

// ── Forgot password handler ───────────────
function handleForgotPassword(e) {
  e.preventDefault();
  const username = document.getElementById('forgotUsername').value.trim().toLowerCase();
  const newPass  = document.getElementById('forgotNewPass').value;
  const confirm  = document.getElementById('forgotConfirm').value;
  const errEl    = document.getElementById('forgotError');
  const succEl   = document.getElementById('forgotSuccess');

  errEl.style.display = 'none';
  succEl.style.display = 'none';

  if (newPass !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block';
    return;
  }
  if (newPass.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }

  fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, newPassword: newPass })
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      succEl.textContent = 'Password updated! You can now sign in with your new password.';
      succEl.style.display = 'block';
      document.getElementById('forgotForm').reset();
    } else {
      errEl.textContent = data.error || 'Reset failed.';
      errEl.style.display = 'block';
    }
  })
  .catch(() => {
    errEl.textContent = 'Server error. Please try again later.';
    errEl.style.display = 'block';
  });
}