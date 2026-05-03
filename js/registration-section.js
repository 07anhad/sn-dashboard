/* ============================================================
   REGISTRATION-SECTION.JS — Registration Links Management
   ============================================================ */

'use strict';

function renderRegistration() {
  const container = document.getElementById('registrationContent');
  if (!isAdmin()) { container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--clr-red);font-size:1.1rem;">⛔ Access Denied — Admin only.</div>'; return; }
  const active    = REG_LINKS.filter(l => l.active);
  const inactive  = REG_LINKS.filter(l => !l.active);

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-lg)">
      <div style="display:flex;gap:var(--sp-md)">
        <div class="contrib-card" style="min-width:120px">
          <h4>Active Links</h4>
          <div class="amount" style="color:var(--clr-green)">${active.length}</div>
        </div>
        <div class="contrib-card" style="min-width:120px;border-left-color:var(--clr-red)">
          <h4>Inactive Links</h4>
          <div class="amount" style="color:var(--clr-red)">${inactive.length}</div>
        </div>
      </div>
      ${isAdmin() ? '<button class="toolbar-btn toolbar-btn-saffron" onclick="openAddLinkModal()">+ Create Link</button>' : ''}
    </div>

    <div class="sub-heading">Active Registration Links</div>
    <div class="event-grid" id="activeLinksGrid">
      ${active.map(l => regLinkCard(l)).join('') || '<p class="text-muted">No active links.</p>'}
    </div>

    <div class="sub-heading">Inactive / Expired Links</div>
    <div class="event-grid" id="inactiveLinksGrid">
      ${inactive.map(l => regLinkCard(l)).join('') || '<p class="text-muted">No inactive links.</p>'}
    </div>
  `;
}

function regLinkCard(l) {
  const used = Math.round((l.usedCount / l.maxUses) * 100);
  const progressColor = used >= 90 ? 'var(--clr-red)' : used >= 60 ? 'var(--clr-saffron)' : 'var(--clr-green)';
  return `
    <div class="reg-link-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
        <strong style="font-size:0.95rem">${l.title}</strong>
        ${l.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}
      </div>
      <div class="reg-link-meta">
        <span class="badge badge-info">Code: ${l.code}</span>
        <span style="font-size:0.78rem;color:var(--txt-muted)">Expires: ${formatDate(l.expiry)}</span>
      </div>
      <div class="reg-link-url" title="${l.url}">${l.url}</div>
      <div style="margin-top:6px">
        <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--txt-muted);margin-bottom:4px">
          <span>Used: ${l.usedCount} / ${l.maxUses}</span>
          <span>${used}%</span>
        </div>
        <div style="height:6px;background:var(--border);border-radius:99px;overflow:hidden">
          <div style="width:${used}%;height:100%;background:${progressColor};border-radius:99px;transition:width 0.5s"></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="tbl-btn tbl-btn-view" onclick="copyLink('${l.url}')">Copy URL</button>
        ${isAdmin() ? `<button class="tbl-btn tbl-btn-edit" onclick="editLink(${l.id})">Edit</button>` : ''}
        ${isAdmin() ? `<button class="tbl-btn tbl-btn-delete" onclick="toggleLink(${l.id})">${l.active ? 'Deactivate' : 'Activate'}</button>` : ''}
      </div>
    </div>
  `;
}

function copyLink(url) {
  navigator.clipboard?.writeText(url).then(() => showToast('Link copied to clipboard!', 'success'))
    .catch(() => showToast('Could not copy — try manually.', ''));
}

function openAddLinkModal() {
  openModal(`
    <div class="modal-header">
      <h3>🔗 Create Registration Link</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Link Title *</label><input id="al_title" placeholder="e.g. General" /></div>
    <div class="form-field"><label>Link Code *</label><input id="al_code" placeholder="Short unique code, e.g. GEN2025" /></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md)">
      <div class="form-field"><label>Max Uses</label><input id="al_max" type="number" placeholder="e.g. 200" value="100" /></div>
      <div class="form-field"><label>Expiry Date</label><input id="al_expiry" type="date" /></div>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-saffron" onclick="saveNewLink()">Create</button>
    </div>
  `);
}

async function saveNewLink() {
  const title = document.getElementById('al_title').value.trim();
  const code  = document.getElementById('al_code').value.trim();
  if (!title || !code) { showToast('Title and code required!', 'error'); return; }
  try {
    await apiPost('/api/reg-links', {
      title, code,
      url: 'https://satsang.org/register/' + code,
      active: true,
      maxUses:  parseInt(document.getElementById('al_max').value) || 100,
      usedCount: 0,
      expiry:   document.getElementById('al_expiry').value || '2025-12-31',
      createdOn: new Date().toISOString().split('T')[0]
    });
    await reloadRegLinks();
    closeForcedModal();
    renderCache.delete('registration');
    renderRegistration();
    showToast('Registration link created!', 'success');
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
}

function editLink(id) {
  const l = REG_LINKS.find(x => x.id === id);
  if (!l) return;
  openModal(`
    <div class="modal-header">
      <h3>✏️ Edit Link — ${l.code}</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Title</label><input id="el_title" value="${l.title}" /></div>
    <div class="form-field"><label>Max Uses</label><input id="el_max" type="number" value="${l.maxUses}" /></div>
    <div class="form-field"><label>Expiry Date</label><input id="el_expiry" type="date" value="${l.expiry}" /></div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveLinkEdit(${id})">Save</button>
    </div>
  `);
}

async function saveLinkEdit(id) {
  const l = REG_LINKS.find(x => x.id === id);
  if (!l) return;
  try {
    await apiPut('/api/reg-links/' + id, {
      title:   document.getElementById('el_title').value,
      code:    l.code,
      url:     l.url,
      active:  l.active,
      maxUses: parseInt(document.getElementById('el_max').value),
      usedCount: l.usedCount,
      expiry:  document.getElementById('el_expiry').value
    });
    await reloadRegLinks();
    closeForcedModal();
    renderCache.delete('registration');
    renderRegistration();
    showToast('Link updated!', 'success');
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
}

async function toggleLink(id) {
  const l = REG_LINKS.find(x => x.id === id);
  if (!l) return;
  try {
    await apiPut('/api/reg-links/' + id, {
      title: l.title, code: l.code, url: l.url,
      active: !l.active, maxUses: l.maxUses,
      usedCount: l.usedCount, expiry: l.expiry
    });
    await reloadRegLinks();
    renderCache.delete('registration');
    renderRegistration();
    showToast(`Link ${!l.active ? 'activated' : 'deactivated'}!`);
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
}