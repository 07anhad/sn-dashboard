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

// ── Handle login form submission ─────────────
// Admin/superadmin: direct login (no OTP)
// Member: OTP verification required
function handleLogin(e) {
  e.preventDefault();
  const id   = document.getElementById('loginId').value.trim();
  const pass = document.getElementById('loginPass').value;
  const btn  = document.getElementById('loginBtn');
  const err  = document.getElementById('loginError');

  btn.disabled = true;

  // ── Admin: direct login, no OTP ──
  if (currentRole === 'admin') {
    btn.querySelector('.btn-text').textContent = 'Signing in…';
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: id, password: pass, role: currentRole })
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
        window.location.replace('dashboard.html');
      } else {
        err.textContent = 'Invalid admin credentials. Please try again.';
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
    return;
  }

  // ── Member: OTP flow ──
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
      document.getElementById('otpMaskedEmail').textContent = data.email || data.maskedEmail;
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
      window.location.replace('dashboard.html');
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
      document.getElementById('otpMaskedEmail').textContent = data.email || data.maskedEmail;
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
  window.location.replace('index.html');
}

// ── Guard: redirect to login if not authed ─
function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.replace('index.html');
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

  // Also fires on bfcache restore (back button on mobile/Safari)
  window.addEventListener('pageshow', function() {
    if (!getCurrentUser()) window.location.replace('index.html');
  });

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
  if (user) window.location.replace('dashboard.html');

  // Also fires on bfcache restore (back button on mobile/Safari)
  window.addEventListener('pageshow', function(e) {
    if (getCurrentUser()) window.location.replace('dashboard.html');
  });
}

// ── Form switching ────────────────────────
function showSignup(e) {
  e.preventDefault();
  document.getElementById('loginForm').style.display  = 'none';
  document.getElementById('forgotForm').style.display = 'none';
  document.getElementById('signupOtpForm').style.display = 'none';
  document.getElementById('signupForm').style.display = 'flex';
  document.getElementById('loginHint').style.display  = 'none';
  document.querySelector('.login-toggle').style.display = 'none';
}

function showForgotPassword(e) {
  e.preventDefault();
  _forgotUsername = null;
  document.getElementById('loginForm').style.display      = 'none';
  document.getElementById('signupForm').style.display     = 'none';
  document.getElementById('signupOtpForm').style.display  = 'none';
  document.getElementById('forgotForm').style.display     = 'flex';
  document.getElementById('forgotOtpForm').style.display  = 'none';
  document.getElementById('otpForm').style.display        = 'none';
  document.getElementById('loginHint').style.display      = 'none';
  document.querySelector('.login-toggle').style.display   = 'none';
  ['forgotError','forgotSuccess','forgotOtpError'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
}

function showLoginForm(e) {
  e.preventDefault();
  _otpCredentials = null;
  _forgotUsername = null;
  _pendingSignup  = null;
  document.getElementById('loginForm').style.display     = 'flex';
  document.getElementById('signupForm').style.display    = 'none';
  document.getElementById('signupOtpForm').style.display = 'none';
  document.getElementById('forgotForm').style.display    = 'none';
  document.getElementById('forgotOtpForm').style.display = 'none';
  document.getElementById('otpForm').style.display       = 'none';
  const hint = document.getElementById('loginHint');
  if (hint) hint.style.display = 'none';
  document.querySelector('.login-toggle').style.display = 'flex';
  ['signupError', 'forgotError', 'forgotSuccess', 'forgotOtpError', 'loginError', 'otpError', 'signupOtpError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// ── Signup handler ────────────────────────
// Nothing is stored until the emailed code is verified, so a mistyped address
// leaves no orphan account and never occupies a username.
let _pendingSignup = null;

function handleSignup(e) {
  e.preventDefault();
  const name     = document.getElementById('signupName').value.trim();
  const username = document.getElementById('signupUsername').value.trim().toLowerCase();
  const memberId = document.getElementById('signupMemberId').value.trim();
  const email    = document.getElementById('signupEmail').value.trim().toLowerCase();
  const pass     = document.getElementById('signupPass').value;
  const confirm  = document.getElementById('signupConfirm').value;
  const consent  = document.getElementById('signupConsent')?.checked;
  const errEl    = document.getElementById('signupError');
  const succEl   = document.getElementById('signupSuccess');
  const btn      = document.getElementById('signupBtn');

  errEl.style.display  = 'none';
  succEl.style.display = 'none';

  const fail = (msg, focusId) => {
    errEl.textContent = msg;
    errEl.style.display = 'block';
    if (focusId) document.getElementById(focusId)?.focus();
  };

  if (!name) return fail('Please enter your full name.', 'signupName');
  if (!username || !/^[a-z0-9._]+$/.test(username))
    return fail('Username can only contain lowercase letters, numbers, dots and underscores.', 'signupUsername');
  if (!memberId) return fail('Please enter your UID or Branch ID.', 'signupMemberId');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return fail('Please enter a valid email address.', 'signupEmail');
  if (pass.length < 6) return fail('Password must be at least 6 characters.');
  if (pass !== confirm) return fail('Passwords do not match.', 'signupConfirm');
  if (!consent) return fail('You must give your data consent to create an account.');

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Sending code…';

  fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, email, password: pass, memberIdentifier: memberId })
  })
  .then(r => r.json())
  .then(data => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Create Account';
    if (data.ok) {
      _pendingSignup = { username, email: data.email || email };
      showSignupOtpStep(_pendingSignup.email);
    } else {
      fail(data.error || 'Signup failed. Please try again.');
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Create Account';
    fail('Server error. Please try again later.');
  });
}

function showSignupOtpStep(email) {
  document.getElementById('signupForm').style.display    = 'none';
  document.getElementById('signupOtpForm').style.display = 'block';
  document.getElementById('signupOtpEmail').textContent  = email;
  document.getElementById('signupOtpCode').value = '';
  document.getElementById('signupOtpError').style.display = 'none';
  setTimeout(() => document.getElementById('signupOtpCode').focus(), 100);
}

// Return to the signup form with every field still filled in, so only the
// email needs correcting.
function changeSignupEmail(e) {
  e.preventDefault();
  document.getElementById('signupOtpForm').style.display = 'none';
  document.getElementById('signupForm').style.display    = 'flex';
  const emailEl = document.getElementById('signupEmail');
  emailEl.focus();
  emailEl.select();
}

function handleVerifySignupOtp() {
  const code = (document.getElementById('signupOtpCode').value || '').trim();
  const btn  = document.getElementById('signupOtpBtn');
  const err  = document.getElementById('signupOtpError');

  if (code.length !== 6) {
    err.textContent = 'Please enter the 6-digit code from your email.';
    err.style.display = 'block';
    return;
  }
  if (!_pendingSignup) { showLoginForm({ preventDefault: () => {} }); return; }

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Verifying…';
  err.style.display = 'none';

  fetch('/api/auth/signup/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: _pendingSignup.username, code })
  })
  .then(r => r.json())
  .then(data => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Verify & Create Account';
    if (data.ok) {
      _pendingSignup = null;
      document.getElementById('signupForm').reset();
      // Verifying the code already proves the email — sign them straight in.
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
      window.location.replace('dashboard.html');
    } else {
      err.textContent = data.error || 'Invalid or expired code.';
      err.style.display = 'block';
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Verify & Create Account';
    err.textContent = 'Server error. Please try again.';
    err.style.display = 'block';
  });
}

function handleResendSignupOtp(e) {
  e.preventDefault();
  if (!_pendingSignup) { showLoginForm(e); return; }
  const err = document.getElementById('signupOtpError');
  err.style.display = 'none';
  document.getElementById('signupOtpCode').value = '';

  fetch('/api/auth/signup/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: _pendingSignup.username, email: _pendingSignup.email })
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      document.getElementById('signupOtpEmail').textContent = data.email || _pendingSignup.email;
      err.style.cssText = 'display:block;background:rgba(34,197,94,0.15);color:#22c55e;border-color:rgba(34,197,94,0.3)';
      err.textContent = 'New code sent!';
      setTimeout(() => { err.style.display = 'none'; err.removeAttribute('style'); }, 3000);
    } else {
      err.textContent = data.error || 'Failed to resend. Please try changing your email.';
      err.style.display = 'block';
    }
  })
  .catch(() => {
    err.textContent = 'Server error. Please try again.';
    err.style.display = 'block';
  });
}

// ── Forgot password handler ───────────────
// ── Forgot password step 1: send OTP ─────
let _forgotUsername = null;

function handleForgotStep1(e) {
  e.preventDefault();
  const username = document.getElementById('forgotUsername').value.trim().toLowerCase();
  const errEl    = document.getElementById('forgotError');
  const btn      = document.getElementById('forgotBtn');

  errEl.style.display = 'none';
  if (!username) { errEl.textContent = 'Please enter your username.'; errEl.style.display = 'block'; return; }

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Sending code…';

  fetch('/api/auth/forgot-send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  })
  .then(r => r.json())
  .then(data => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Send OTP';
    if (data.ok) {
      _forgotUsername = username;
      document.getElementById('forgotForm').style.display     = 'none';
      document.getElementById('forgotOtpForm').style.display  = 'block';
      document.getElementById('forgotMaskedEmail').textContent = data.email || data.maskedEmail;
      document.getElementById('forgotOtpCode').value  = '';
      document.getElementById('forgotNewPass').value  = '';
      document.getElementById('forgotConfirm').value  = '';
      document.getElementById('forgotOtpError').style.display = 'none';
      setTimeout(() => document.getElementById('forgotOtpCode').focus(), 100);
    } else {
      errEl.textContent = data.error || 'Failed to send code.';
      errEl.style.display = 'block';
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Send OTP';
    errEl.textContent = 'Server error. Please try again.';
    errEl.style.display = 'block';
  });
}

// ── Forgot password step 2: verify OTP + reset ─
function handleForgotStep2() {
  const code    = (document.getElementById('forgotOtpCode').value  || '').trim();
  const newPass = (document.getElementById('forgotNewPass').value  || '');
  const confirm = (document.getElementById('forgotConfirm').value  || '');
  const errEl   = document.getElementById('forgotOtpError');
  const btn     = document.getElementById('forgotOtpBtn');

  errEl.style.display = 'none';
  if (code.length !== 6)    { errEl.textContent = 'Enter the 6-digit code from your email.'; errEl.style.display = 'block'; return; }
  if (newPass.length < 6)   { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
  if (newPass !== confirm)  { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; return; }

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Resetting…';

  fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: _forgotUsername, newPassword: newPass, code })
  })
  .then(r => r.json())
  .then(data => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Reset Password';
    if (data.ok) {
      _forgotUsername = null;
      document.getElementById('forgotOtpForm').style.display = 'none';
      document.getElementById('forgotSuccess').textContent   = '✓ Password updated! Redirecting to sign in…';
      document.getElementById('forgotSuccess').style.display = 'block';
      document.getElementById('forgotForm').style.display    = 'block';
      document.getElementById('forgotForm').reset();
      setTimeout(() => {
        showLoginForm({ preventDefault: () => {} });
        const loginIdEl = document.getElementById('loginId');
        if (loginIdEl) { loginIdEl.focus(); }
      }, 1800);
    } else {
      errEl.textContent = data.error || 'Reset failed.';
      errEl.style.display = 'block';
    }
  })
  .catch(() => {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Reset Password';
    errEl.textContent = 'Server error. Please try again.';
    errEl.style.display = 'block';
  });
}

// ── Resend OTP on forgot form ─────────────
function handleForgotResend(e) {
  e.preventDefault();
  if (!_forgotUsername) { showForgotPassword(e); return; }
  const errEl = document.getElementById('forgotOtpError');
  errEl.style.display = 'none';
  fetch('/api/auth/forgot-send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: _forgotUsername })
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      document.getElementById('forgotMaskedEmail').textContent = data.email || data.maskedEmail;
      errEl.style.cssText = 'display:block;background:rgba(34,197,94,0.15);color:#22c55e;border-color:rgba(34,197,94,0.3)';
      errEl.textContent = 'New code sent!';
      setTimeout(() => { errEl.style.display = 'none'; errEl.removeAttribute('style'); }, 3000);
    } else {
      errEl.textContent = data.error || 'Failed to resend.';
      errEl.style.display = 'block';
    }
  })
  .catch(() => { errEl.textContent = 'Server error.'; errEl.style.display = 'block'; });
}
