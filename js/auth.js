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

// ── Temp store credentials across OTP step ─
let _otpCredentials = null;

// ── Handle login form submission — sends OTP ─
function handleLogin(e) {
  e.preventDefault();
  const id   = document.getElementById('loginId').value.trim();
  const pass = document.getElementById('loginPass').value;
  const btn  = document.getElementById('loginBtn');
  const err  = document.getElementById('loginError');

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Sending code…';

  fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: id, password: pass, role: currentRole })
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      // Store credentials temporarily for the verify step
      _otpCredentials = { username: id, password: pass, role: currentRole };
      // Show OTP step
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('otpForm').style.display   = 'block';
      document.getElementById('otpMaskedEmail').textContent = data.maskedEmail;
      document.getElementById('otpCode').value = '';
      document.getElementById('otpError').style.display = 'none';
      setTimeout(() => document.getElementById('otpCode').focus(), 100);
    } else {
      err.textContent = data.error || 'Invalid credentials. Please try again.';
      err.style.display = 'block';
    }
  })
  .catch(() => {
    err.textContent = 'Server error. Please try again later.';
    err.style.display = 'block';
  })
  .finally(() => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Sign In';
  });
}

// ── Verify OTP code ───────────────────────
function handleVerifyOtp() {
  const code = (document.getElementById('otpCode').value || '').trim();
  const btn  = document.getElementById('otpVerifyBtn');
  const err  = document.getElementById('otpError');

  if (code.length !== 6) {
    err.textContent = 'Please enter the 6-digit code from your email.';
    err.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Verifying…';
  err.style.display = 'none';

  fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ..._otpCredentials, code })
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      const userPayload = {
        username:  data.user.username,
        name:      data.user.name,
        role:      data.user.role,
        email:     data.user.email,
        memberId:  data.user.member_id  || null,
        memberUid: data.user.member_uid || null
      };
      sessionStorage.setItem('currentUser', JSON.stringify(userPayload));
      localStorage.setItem('currentUser',   JSON.stringify(userPayload));
      _otpCredentials = null;
      window.location.href = 'dashboard.html';
    } else {
      err.textContent = data.error || 'Invalid or expired code.';
      err.style.display = 'block';
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'Verify & Sign In';
    }
  })
  .catch(() => {
    err.textContent = 'Server error. Please try again.';
    err.style.display = 'block';
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Verify & Sign In';
  });
}

// ── Resend OTP ────────────────────────────
function handleResendOtp(e) {
  e.preventDefault();
  if (!_otpCredentials) { showLoginForm(e); return; }
  const err = document.getElementById('otpError');
  err.style.display = 'none';
  document.getElementById('otpCode').value = '';

  fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(_otpCredentials)
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      document.getElementById('otpMaskedEmail').textContent = data.maskedEmail;
      err.style.cssText = 'display:block;background:rgba(34,197,94,0.15);color:#22c55e;border-color:rgba(34,197,94,0.3)';
      err.textContent = 'New code sent!';
      setTimeout(() => { err.style.display = 'none'; err.removeAttribute('style'); }, 3000);
    } else {
      err.textContent = data.error || 'Failed to resend. Please go back and try again.';
      err.style.display = 'block';
    }
  })
  .catch(() => {
    err.textContent = 'Server error. Please try again.';
    err.style.display = 'block';
  });
}

// ── Logout ────────────────────────────────
function logout() {
  sessionStorage.removeItem('currentUser');
  localStorage.removeItem('currentUser');
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
// Checks sessionStorage first, falls back to localStorage.
// This prevents macOS Safari from logging users out when a tab is suspended
// or restored from the back-forward cache (which wipes sessionStorage).
function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    if (!raw) return null;
    const user = JSON.parse(raw);
    // If we got it from localStorage but not sessionStorage, re-hydrate sessionStorage
    // so same-tab code that reads sessionStorage directly still works.
    if (!sessionStorage.getItem('currentUser')) {
      sessionStorage.setItem('currentUser', raw);
    }
    return user;
  } catch {
    return null;
  }
}

// ── Role helpers ──────────────────────────
function isAdmin() {
  const u = getCurrentUser();
  return u && (u.role === 'admin' || u.role === 'superadmin');
}

function isSuperAdmin() {
  const u = getCurrentUser();
  return u && u.role === 'superadmin';
}

// ── On dashboard.html: guard + init UI ────
if (document.getElementById('userName')) {
  const user = requireAuth();
  if (user) {
    document.getElementById('userName').textContent   = user.name;
    document.getElementById('userRole').textContent   = user.role === 'superadmin'
      ? 'Super Administrator'
      : user.role === 'admin' ? 'Administrator' : 'Member';
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
  document.getElementById('loginForm').style.display  = 'none';
  document.getElementById('forgotForm').style.display = 'none';
  document.getElementById('signupForm').style.display = 'flex';
  document.getElementById('loginHint').style.display  = 'none';
  document.querySelector('.login-toggle').style.display = 'none';
}

function showForgotPassword(e) {
  e.preventDefault();
  document.getElementById('loginForm').style.display  = 'none';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('forgotForm').style.display = 'flex';
  document.getElementById('loginHint').style.display  = 'none';
  document.querySelector('.login-toggle').style.display = 'none';
}

function showLoginForm(e) {
  e.preventDefault();
  _otpCredentials = null;
  document.getElementById('loginForm').style.display  = 'flex';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('forgotForm').style.display = 'none';
  document.getElementById('otpForm').style.display    = 'none';
  const hint = document.getElementById('loginHint');
  if (hint) hint.style.display = 'none';
  document.querySelector('.login-toggle').style.display = 'flex';
  // Clear messages
  ['signupError', 'signupSuccess', 'forgotError', 'forgotSuccess', 'loginError', 'otpError'].forEach(id => {
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
  const btn      = document.getElementById('signupBtn');

  errEl.style.display  = 'none';
  succEl.style.display = 'none';

  if (!name) {
    errEl.textContent = 'Please enter your full name.';
    errEl.style.display = 'block';
    document.getElementById('signupName').focus();
    return;
  }
  if (!username || !/^[a-z0-9._]+$/.test(username)) {
    errEl.textContent = 'Username can only contain lowercase letters, numbers, dots and underscores.';
    errEl.style.display = 'block';
    document.getElementById('signupUsername').focus();
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = 'Please enter a valid email address.';
    errEl.style.display = 'block';
    document.getElementById('signupEmail').focus();
    return;
  }
  if (pass.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }
  if (pass !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block';
    document.getElementById('signupConfirm').focus();
    return;
  }
  if (!consent) {
    errEl.textContent = 'You must give your data consent to create an account.';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Creating account…';

  fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, email, password: pass })
  })
  .then(r => r.json())
  .then(data => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Create Account';
    if (data.ok) {
      // Account created — now send OTP and go straight to verify step
      btn.querySelector('.btn-text').textContent = 'Sending code…';
      btn.disabled = true;
      fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass, role: 'member' })
      })
      .then(r => r.json())
      .then(otpData => {
        btn.disabled = false;
        btn.querySelector('.btn-text').textContent = 'Create Account';
        document.getElementById('signupForm').reset();
        if (otpData.ok) {
          _otpCredentials = { username, password: pass, role: 'member' };
          document.getElementById('signupForm').style.display = 'none';
          document.getElementById('otpForm').style.display    = 'block';
          document.getElementById('otpMaskedEmail').textContent = otpData.maskedEmail;
          document.getElementById('otpCode').value = '';
          document.getElementById('otpError').style.display = 'none';
          setTimeout(() => document.getElementById('otpCode').focus(), 100);
        } else {
          // Email failed — fall back to login form
          succEl.innerHTML = '✓ Account created! Please sign in.';
          succEl.style.display = 'block';
          setTimeout(() => {
            showLoginForm({ preventDefault: () => {} });
            const loginIdEl = document.getElementById('loginId');
            if (loginIdEl) { loginIdEl.value = username; document.getElementById('loginPass')?.focus(); }
          }, 1800);
        }
      })
      .catch(() => {
        btn.disabled = false;
        btn.querySelector('.btn-text').textContent = 'Create Account';
        succEl.innerHTML = '✓ Account created! Please sign in.';
        succEl.style.display = 'block';
        setTimeout(() => showLoginForm({ preventDefault: () => {} }), 1800);
      });
    } else {
      errEl.textContent = data.error || 'Signup failed. Please try again.';
      errEl.style.display = 'block';
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Create Account';
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
  const btn      = document.getElementById('forgotBtn');

  errEl.style.display  = 'none';
  succEl.style.display = 'none';

  if (!username) {
    errEl.textContent = 'Please enter your username.';
    errEl.style.display = 'block';
    document.getElementById('forgotUsername').focus();
    return;
  }
  if (newPass.length < 6) {
    errEl.textContent = 'New password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }
  if (newPass !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block';
    document.getElementById('forgotConfirm').focus();
    return;
  }

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Resetting…';

  fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, newPassword: newPass })
  })
  .then(r => r.json())
  .then(data => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Reset Password';
    if (data.ok) {
      succEl.textContent = '✓ Password updated! Redirecting to sign in…';
      succEl.style.display = 'block';
      document.getElementById('forgotForm').reset();
      setTimeout(() => {
        showLoginForm({ preventDefault: () => {} });
        const loginIdEl = document.getElementById('loginId');
        if (loginIdEl) {
          loginIdEl.value = username;
          document.getElementById('loginPass')?.focus();
        }
      }, 1800);
    } else {
      errEl.textContent = data.error || 'Reset failed. Check your username.';
      errEl.style.display = 'block';
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Reset Password';
    errEl.textContent = 'Server error. Please try again later.';
    errEl.style.display = 'block';
  });
}
