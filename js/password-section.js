/* ============================================================
   PASSWORD-SECTION.JS — Change Password
   ============================================================ */

'use strict';

function renderChangePassword() {
  const user = getCurrentUser();
  const container = document.getElementById('changePasswordContent');
  container.innerHTML = `
    <div class="password-card">
      <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:var(--sp-lg);color:var(--txt-primary)">🔑 Update Your Password</h3>
      <div id="pwAlert"></div>

      <div class="form-field" style="position:relative">
        <label>Current Password</label>
        <div style="position:relative">
          <input type="password" id="pwCurrent" placeholder="Enter current password" autocomplete="current-password" />
          <button type="button" class="pw-eye-btn" onclick="togglePwEye('pwCurrent',this)" tabindex="-1">👁</button>
        </div>
      </div>
      <div class="form-field">
        <label>New Password</label>
        <div style="position:relative">
          <input type="password" id="pwNew" placeholder="At least 6 characters" autocomplete="new-password"
                 oninput="updatePwStrength(this.value)" />
          <button type="button" class="pw-eye-btn" onclick="togglePwEye('pwNew',this)" tabindex="-1">👁</button>
        </div>
        <div id="pwStrengthBar" style="margin-top:6px;height:4px;border-radius:99px;background:var(--border);overflow:hidden;display:none">
          <div id="pwStrengthFill" style="height:100%;width:0%;transition:width 0.3s,background 0.3s;border-radius:99px"></div>
        </div>
        <p id="pwStrengthLabel" style="font-size:0.75rem;margin-top:4px;color:var(--txt-muted);display:none"></p>
      </div>
      <div class="form-field">
        <label>Confirm New Password</label>
        <div style="position:relative">
          <input type="password" id="pwConfirm" placeholder="Re-enter new password" autocomplete="new-password"
                 oninput="checkPwMatch()" />
          <button type="button" class="pw-eye-btn" onclick="togglePwEye('pwConfirm',this)" tabindex="-1">👁</button>
        </div>
        <p id="pwMatchLabel" style="font-size:0.75rem;margin-top:4px;display:none"></p>
      </div>

      <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);flex-wrap:wrap">
        <button class="btn btn-primary" id="pwSubmitBtn" onclick="submitChangePassword()">
          <span id="pwBtnText">Update Password</span>
        </button>
        <button class="btn btn-outline" onclick="resetPwForm()">Clear</button>
      </div>

      <div style="margin-top:var(--sp-xl);padding-top:var(--sp-md);border-top:1px solid var(--border)">
        <p style="font-size:0.82rem;color:var(--txt-muted)">
          Logged in as: <strong style="color:var(--txt-secondary)">${user ? user.name : 'Unknown'}</strong> &nbsp;|&nbsp;
          Role: <strong style="color:var(--txt-secondary)">${user ? user.role : '—'}</strong>
        </p>
        ${user && user.memberUid ? `
        <div style="margin-top:var(--sp-md)">
          <button class="btn btn-outline" onclick="editMember('${user.memberUid}', true)" style="font-size:0.9rem">
            ✏️ Edit My Profile Details
          </button>
          <p style="font-size:0.78rem;color:var(--txt-muted);margin-top:6px">Update your personal, contact, family and other information.</p>
        </div>` : ''}
      </div>
    </div>
  `;
}

function togglePwEye(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.style.opacity = inp.type === 'text' ? '1' : '0.45';
}

function updatePwStrength(val) {
  const bar   = document.getElementById('pwStrengthBar');
  const fill  = document.getElementById('pwStrengthFill');
  const label = document.getElementById('pwStrengthLabel');
  if (!bar || !fill || !label) return;
  if (!val) { bar.style.display = 'none'; label.style.display = 'none'; return; }
  bar.style.display = 'block'; label.style.display = 'block';
  let score = 0;
  if (val.length >= 6)  score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { pct: '20%',  color: '#ef4444', text: 'Very weak' },
    { pct: '40%',  color: '#f97316', text: 'Weak' },
    { pct: '60%',  color: '#eab308', text: 'Fair' },
    { pct: '80%',  color: '#22c55e', text: 'Strong' },
    { pct: '100%', color: '#16a34a', text: 'Very strong' },
  ];
  const lv = levels[Math.max(0, score - 1)] || levels[0];
  fill.style.width = lv.pct;
  fill.style.background = lv.color;
  label.textContent = lv.text;
  label.style.color = lv.color;
  checkPwMatch();
}

function checkPwMatch() {
  const nw      = (document.getElementById('pwNew')?.value || '');
  const confirm = (document.getElementById('pwConfirm')?.value || '');
  const label   = document.getElementById('pwMatchLabel');
  if (!label || !confirm) { if (label) label.style.display = 'none'; return; }
  label.style.display = 'block';
  if (nw === confirm) {
    label.textContent = '✓ Passwords match';
    label.style.color = '#22c55e';
  } else {
    label.textContent = '✗ Passwords do not match';
    label.style.color = '#ef4444';
  }
}

async function submitChangePassword() {
  const user    = getCurrentUser();
  const cur     = document.getElementById('pwCurrent').value;
  const nw      = document.getElementById('pwNew').value;
  const confirm = document.getElementById('pwConfirm').value;
  const alertEl = document.getElementById('pwAlert');
  const btn     = document.getElementById('pwSubmitBtn');
  const btnText = document.getElementById('pwBtnText');

  const showErr = msg => {
    alertEl.innerHTML = `<div class="alert alert-error" style="margin-bottom:var(--sp-md)">${msg}</div>`;
  };
  alertEl.innerHTML = '';

  if (!user) {
    showErr('You are not logged in. Please refresh the page.');
    return;
  }
  if (!cur) { showErr('Please enter your current password.'); return; }
  if (!nw)  { showErr('Please enter a new password.'); return; }
  if (nw.length < 6) { showErr('New password must be at least 6 characters.'); return; }
  if (nw !== confirm) { showErr('New password and confirm password do not match.'); return; }
  if (cur === nw) { showErr('New password must be different from the current one.'); return; }

  btn.disabled = true;
  btnText.textContent = 'Updating…';

  try {
    const data = await apiPost('/api/auth/change-password', {
      username: user.username,
      oldPassword: cur,
      newPassword: nw
    });
    if (data.ok) {
      alertEl.innerHTML = `<div class="alert alert-success" style="margin-bottom:var(--sp-md)">✓ Password updated successfully!</div>`;
      showToast('Password changed — please login again with new password.', 'success');
      document.getElementById('pwCurrent').value = '';
      document.getElementById('pwNew').value = '';
      document.getElementById('pwConfirm').value = '';
      // Auto-logout after 3 seconds so user must re-login with new password
      setTimeout(() => logout(), 3000);
    } else {
      showErr(data.error || 'Password update failed.');
    }
  } catch (err) {
    // API throws on non-ok status
    const msg = err.message || 'Server error. Please try again.';
    if (msg.includes('incorrect') || msg.includes('403')) {
      showErr('Current password is incorrect.');
    } else {
      showErr(msg);
    }
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Update Password';
  }
}

function resetPwForm() {
  ['pwCurrent','pwNew','pwConfirm'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const alertEl = document.getElementById('pwAlert');
  if (alertEl) alertEl.innerHTML = '';
  const bar   = document.getElementById('pwStrengthBar');
  const label = document.getElementById('pwStrengthLabel');
  const match = document.getElementById('pwMatchLabel');
  if (bar)   bar.style.display   = 'none';
  if (label) label.style.display = 'none';
  if (match) match.style.display = 'none';
}
