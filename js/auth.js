/* ============================================================
   AUTH.JS — Login, Logout, Session, Signup, Forgot Password
   ============================================================ */

'use strict';

// ── Default users (built-in) ──────────────
const DEFAULT_USERS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    email: 'admin@satsang.org'
  },
  member_anhad: {
    username: 'anhad.parashar',
    password: 'member123',
    role: 'member',
    name: 'Anhad Parashar',
    email: 'anhad.parashar@email.com',
    memberId: 'M-00101'
  }
};

// ── localStorage user helpers ─────────────
function getStoredUsers() {
  try { return JSON.parse(localStorage.getItem('sn_users') || '{}'); }
  catch { return {}; }
}
function saveStoredUsers(users) {
  localStorage.setItem('sn_users', JSON.stringify(users));
}
function getPasswordOverrides() {
  try { return JSON.parse(localStorage.getItem('sn_pass_overrides') || '{}'); }
  catch { return {}; }
}
function savePasswordOverrides(overrides) {
  localStorage.setItem('sn_pass_overrides', JSON.stringify(overrides));
}

// ── Merged user lookup (built-in + signups) ─
function getAllUsers() {
  const merged = {};
  const overrides = getPasswordOverrides();
  for (const key in DEFAULT_USERS) {
    const u = { ...DEFAULT_USERS[key] };
    if (overrides[u.username]) u.password = overrides[u.username];
    merged[key] = u;
  }
  const stored = getStoredUsers();
  for (const key in stored) {
    merged[key] = stored[key];
  }
  return merged;
}

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
    hint.innerHTML = 'Admin: <strong>admin</strong> / <strong>admin123</strong>';
    label.textContent = 'Username / Email';
  } else {
    btnMember.classList.add('active');
    btnAdmin.classList.remove('active');
    slider.style.transform = 'translateX(100%)';
    hint.innerHTML = 'Member: <strong>anhad.parashar</strong> / <strong>member123</strong>';
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

  setTimeout(() => {
    const user = authenticateUser(id, pass, currentRole);
    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      window.location.href = 'dashboard.html';
    } else {
      err.textContent = currentRole === 'admin'
        ? 'Invalid admin credentials. Please try again.'
        : 'Invalid member credentials. Please try again.';
      err.style.display = 'block';
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'Sign In';
    }
  }, 600);
}

function authenticateUser(id, pass, role) {
  const allUsers = getAllUsers();
  for (const key in allUsers) {
    const u = allUsers[key];
    if (u.role === role && (u.username === id || u.email === id) && u.password === pass) {
      return { username: u.username, name: u.name, role: u.role, email: u.email, memberId: u.memberId || null };
    }
  }
  return null;
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
    document.getElementById('userRole').textContent  = user.role === 'admin' ? 'Administrator' : 'Member';
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
  document.getElementById('loginHint').style.display = 'block';
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
  const errEl    = document.getElementById('signupError');
  const succEl   = document.getElementById('signupSuccess');

  errEl.style.display = 'none';
  succEl.style.display = 'none';

  // Validate
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

  // Check for duplicates
  const allUsers = getAllUsers();
  for (const key in allUsers) {
    if (allUsers[key].username === username) {
      errEl.textContent = 'Username already taken.';
      errEl.style.display = 'block';
      return;
    }
    if (allUsers[key].email === email) {
      errEl.textContent = 'Email already registered.';
      errEl.style.display = 'block';
      return;
    }
  }

  // Generate member ID
  const stored = getStoredUsers();
  const count = Object.keys(stored).length;
  const memberId = 'M-' + String(10000 + count + 1).padStart(5, '0');

  // Save
  const userKey = 'signup_' + username;
  stored[userKey] = {
    username: username,
    password: pass,
    role: 'member',
    name: name,
    email: email,
    memberId: memberId
  };
  saveStoredUsers(stored);

  // Show success
  succEl.textContent = 'Account created! You can now sign in as "' + username + '".';
  succEl.style.display = 'block';
  document.getElementById('signupForm').reset();
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

  // Find the user
  const allUsers = getAllUsers();
  let found = false;
  let isBuiltIn = false;

  for (const key in DEFAULT_USERS) {
    if (DEFAULT_USERS[key].username === username) {
      found = true;
      isBuiltIn = true;
      break;
    }
  }

  if (!found) {
    const stored = getStoredUsers();
    for (const key in stored) {
      if (stored[key].username === username) {
        found = true;
        // Update password in stored users
        stored[key].password = newPass;
        saveStoredUsers(stored);
        break;
      }
    }
  }

  if (!found) {
    errEl.textContent = 'Username not found.';
    errEl.style.display = 'block';
    return;
  }

  if (isBuiltIn) {
    // Store password override for built-in users
    const overrides = getPasswordOverrides();
    overrides[username] = newPass;
    savePasswordOverrides(overrides);
  }

  succEl.textContent = 'Password updated! You can now sign in with your new password.';
  succEl.style.display = 'block';
  document.getElementById('forgotForm').reset();
}