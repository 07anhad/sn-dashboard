/* ============================================================
   AUTH.JS — Login, Logout, Session Management
   ============================================================ */

'use strict';

// ── User store (mock) ─────────────────────
const USERS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    email: 'admin@satsang.org'
  },
  member_ravi: {
    username: 'ravi.sharma',
    password: 'member123',
    role: 'member',
    name: 'Ravi Sharma',
    email: 'ravi.sharma@email.com',
    memberId: 'M-00101'
  },
  member_priya: {
    username: 'priya.verma',
    password: 'member123',
    role: 'member',
    name: 'Priya Verma',
    email: 'priya.verma@email.com',
    memberId: 'M-00204'
  }
};

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
    hint.innerHTML = 'Member: <strong>ravi.sharma</strong> / <strong>member123</strong>';
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
  for (const key in USERS) {
    const u = USERS[key];
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