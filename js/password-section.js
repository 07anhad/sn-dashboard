/* ============================================================
   PASSWORD-SECTION.JS — Change Password
   ============================================================ */

'use strict';

function renderChangePassword() {
  const user = getCurrentUser();
  const container = document.getElementById('changePasswordContent');
  container.innerHTML = `
    <div class="password-card">
      <h3>🔑 Update Your Password</h3>
      <div id="pwAlert"></div>

      <div class="form-field">
        <label>Current Password</label>
        <input type="password" id="pwCurrent" placeholder="Enter current password" />
      </div>
      <div class="form-field">
        <label>New Password</label>
        <input type="password" id="pwNew" placeholder="Enter new password (min. 6 chars)" />
      </div>
      <div class="form-field">
        <label>Confirm New Password</label>
        <input type="password" id="pwConfirm" placeholder="Re-enter new password" />
      </div>

      <div style="margin-top: var(--sp-lg); display:flex; gap:var(--sp-sm);">
        <button class="btn btn-primary" onclick="submitChangePassword()">Update Password</button>
        <button class="btn btn-outline" onclick="resetPwForm()">Clear</button>
      </div>

      <div style="margin-top: var(--sp-xl); padding-top: var(--sp-md); border-top: 1px solid var(--border);">
        <p style="font-size:0.82rem; color:var(--txt-muted);">
          Logged in as: <strong>${user ? user.name : 'Unknown'}</strong> &nbsp;|&nbsp;
          Role: <strong>${user ? user.role : '—'}</strong>
        </p>
      </div>
    </div>
  `;
}

function submitChangePassword() {
  const cur     = document.getElementById('pwCurrent').value;
  const nw      = document.getElementById('pwNew').value;
  const confirm = document.getElementById('pwConfirm').value;
  const alert   = document.getElementById('pwAlert');

  if (!cur || !nw || !confirm) {
    alert.innerHTML = '<div class="alert alert-error">All fields are required.</div>';
    return;
  }
  if (nw.length < 6) {
    alert.innerHTML = '<div class="alert alert-error">New password must be at least 6 characters.</div>';
    return;
  }
  if (nw !== confirm) {
    alert.innerHTML = '<div class="alert alert-error">New password and confirm password do not match.</div>';
    return;
  }

  // Simulate verification (demo only)
  alert.innerHTML = '<div class="alert alert-success">✓ Password updated successfully! Please login again with your new password.</div>';
  document.getElementById('pwCurrent').value = '';
  document.getElementById('pwNew').value = '';
  document.getElementById('pwConfirm').value = '';
  showToast('Password changed successfully!', 'success');
}

function resetPwForm() {
  document.getElementById('pwCurrent').value  = '';
  document.getElementById('pwNew').value      = '';
  document.getElementById('pwConfirm').value  = '';
  document.getElementById('pwAlert').innerHTML = '';
}