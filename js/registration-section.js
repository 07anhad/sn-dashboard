/* ============================================================
   REGISTRATION-SECTION.JS — Registration Links Management
   ============================================================ */

'use strict';

async function renderRegistration() {
  const container = document.getElementById('registrationContent');
  if (!isAdmin()) { container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--clr-red);font-size:1.1rem;">Access Denied — Admin only.</div>'; return; }

  // Load pending count
  let pending = [];
  try { const r = await fetch('/api/pending-members'); pending = await r.json(); } catch {}
  const pendingOpen = pending.filter(p => p.status === 'pending');

  const active   = REG_LINKS.filter(l => l.active);
  const inactive = REG_LINKS.filter(l => !l.active);

  container.innerHTML = `
    <!-- Tab bar -->
    <div style="display:flex;gap:0;margin-bottom:var(--sp-xl);border-bottom:2px solid var(--border)">
      <button class="reg-tab active" id="regTabLinks" onclick="switchRegTab('links')" style="background:none;border:none;color:var(--clr-saffron);font-size:0.9rem;font-weight:600;padding:8px 20px 10px;cursor:pointer;border-bottom:3px solid var(--clr-saffron);margin-bottom:-2px">
        Registration Links (${REG_LINKS.length})
      </button>
      <button class="reg-tab" id="regTabPending" onclick="switchRegTab('pending')" style="background:none;border:none;color:var(--txt-muted);font-size:0.9rem;font-weight:500;padding:8px 20px 10px;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px">
        Pending Approvals ${pendingOpen.length > 0 ? `<span style="background:var(--clr-red);color:#fff;border-radius:99px;padding:1px 7px;font-size:0.75rem;margin-left:4px">${pendingOpen.length}</span>` : ''}
      </button>
    </div>

    <!-- Links tab -->
    <div id="regPanelLinks">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-md);margin-bottom:var(--sp-lg)">
        <div style="display:flex;gap:var(--sp-md);flex-wrap:wrap">
          <div class="contrib-card" style="min-width:100px">
            <h4>Active Links</h4>
            <div class="amount" style="color:var(--clr-green)">${active.length}</div>
          </div>
          <div class="contrib-card" style="min-width:100px;border-left-color:var(--clr-red)">
            <h4>Inactive Links</h4>
            <div class="amount" style="color:var(--clr-red)">${inactive.length}</div>
          </div>
          <div class="contrib-card" style="min-width:100px;border-left-color:var(--clr-saffron)">
            <h4>Pending</h4>
            <div class="amount" style="color:var(--clr-saffron)">${pendingOpen.length}</div>
          </div>
        </div>
        <button class="toolbar-btn toolbar-btn-saffron" onclick="openAddLinkModal()">+ Create Link</button>
      </div>
      <div class="sub-heading">Active Registration Links</div>
      <div class="event-grid">
        ${active.map(l => regLinkCard(l)).join('') || '<p class="text-muted">No active links.</p>'}
      </div>
      <div class="sub-heading">Inactive / Expired Links</div>
      <div class="event-grid">
        ${inactive.map(l => regLinkCard(l)).join('') || '<p class="text-muted">No inactive links.</p>'}
      </div>
    </div>

    <!-- Pending approvals tab -->
    <div id="regPanelPending" style="display:none">
      ${renderPendingTable(pending)}
    </div>
  `;
}

function switchRegTab(tab) {
  const isLinks = tab === 'links';
  document.getElementById('regPanelLinks').style.display   = isLinks ? '' : 'none';
  document.getElementById('regPanelPending').style.display = isLinks ? 'none' : '';
  const btnLinks   = document.getElementById('regTabLinks');
  const btnPending = document.getElementById('regTabPending');
  btnLinks.style.color        = isLinks ? 'var(--clr-saffron)' : 'var(--txt-muted)';
  btnLinks.style.borderBottom = isLinks ? '3px solid var(--clr-saffron)' : '3px solid transparent';
  btnPending.style.color        = !isLinks ? 'var(--clr-saffron)' : 'var(--txt-muted)';
  btnPending.style.borderBottom = !isLinks ? '3px solid var(--clr-saffron)' : '3px solid transparent';
}

function renderPendingTable(pending) {
  if (!pending.length) return '<p class="text-muted" style="padding:40px;text-align:center">No registration submissions yet.</p>';
  const rows = pending.map(p => {
    const badge = p.status === 'pending'
      ? '<span class="badge badge-warning">Pending</span>'
      : p.status === 'approved'
        ? '<span class="badge badge-success">Approved</span>'
        : '<span class="badge badge-danger">Rejected</span>';
    const actions = p.status === 'pending'
      ? `<button class="tbl-btn tbl-btn-edit" onclick="viewPending(${p.id})">View</button>
         <button class="tbl-btn tbl-btn-view" style="color:var(--clr-green)" onclick="approvePending(${p.id})">✓ Approve</button>
         <button class="tbl-btn tbl-btn-delete" onclick="rejectPending(${p.id})">✗ Reject</button>`
      : `<button class="tbl-btn tbl-btn-view" onclick="viewPending(${p.id})">View</button>`;
    const sub = p.submitted_at ? new Date(p.submitted_at).toLocaleString('en-IN', {dateStyle:'short',timeStyle:'short'}) : '—';
    return `<tr>
      <td>${p.id}</td>
      <td><strong>${p.name || '—'}</strong></td>
      <td>${p.mobile1 || '—'}</td>
      <td>${p.email1 || '—'}</td>
      <td><span class="badge badge-info">${p.reg_link_code || '—'}</span></td>
      <td>${sub}</td>
      <td>${badge}</td>
      <td style="white-space:nowrap">${actions}</td>
    </tr>`;
  }).join('');
  return `
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead><tr>
          <th>#</th><th>Name</th><th>Mobile</th><th>Email</th>
          <th>Link</th><th>Submitted</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function viewPending(id) {
  fetch('/api/pending-members').then(r => r.json()).then(list => {
    const p = list.find(x => x.id === id);
    if (!p) return;
    const f = (label, val) => val
      ? `<div style="margin-bottom:6px"><span style="color:var(--txt-muted);font-size:0.75rem">${label}</span><br/><span style="font-size:0.9rem">${val}</span></div>`
      : '';
    const sec = title => `<div style="grid-column:1/-1;color:var(--clr-saffron);font-size:0.72rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;border-bottom:1px solid var(--border);padding-bottom:3px;margin-top:6px">${title}</div>`;
    const fatherName = [p.father_title, p.father_first_name, p.father_middle_name, p.father_last_name].filter(Boolean).join(' ');
    const motherName = [p.mother_title, p.mother_first_name, p.mother_middle_name, p.mother_last_name].filter(Boolean).join(' ');
    const spouseName = [p.spouse_title, p.spouse_first_name, p.spouse_middle_name, p.spouse_last_name].filter(Boolean).join(' ');
    const neeName   = [p.nee_first_name, p.nee_middle_name, p.nee_last_name].filter(Boolean).join(' ');
    const addr = [p.address_line1, p.address_line2, p.address_line3, p.city, p.state, p.pincode, p.country].filter(Boolean).join(', ');
    const memberships = ['mahila_association_member','youth_member','associate_youth_member',
      'junior_pre_initiate_member','senior_pre_initiate_member','crc_member','cca_member','sant_su_member']
      .filter(k => p[k] === 'Y').map(k => k.replace(/_member$/,'').replace(/_/g,' ')).join(', ');

    openModal(`
      <div class="modal-header">
        <h3>Registration — ${p.name || '—'}</h3>
        <button class="modal-close" onclick="closeForcedModal()">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-sm) var(--sp-md);max-height:65vh;overflow-y:auto;padding-right:4px">
        ${sec('Personal')}
        ${f('Full Name', p.name)}
        ${f('Date of Birth', p.date_of_birth)}
        ${f('Blood Group', p.blood_group)}
        ${f('Caste', p.caste)}
        ${f('Nationality', p.nationality)}
        ${f('Profession', p.profession)}
        ${f('Ashram', p.ashram)}

        ${sec('Contact')}
        ${f('Mobile 1', p.mobile1)}
        ${f('Mobile 2', p.mobile2)}
        ${f('Landline', p.landline)}
        ${f('Office Phone', p.office_phone)}
        ${f('Email 1', p.email1)}
        ${f('Email 2', p.email2)}

        ${addr ? sec('Address') + f('Address', addr) : ''}

        ${sec('Professional')}
        ${f('Qualification', p.qualification)}
        ${f('Occupation', p.occupation)}
        ${f('Designation', p.designation)}
        ${f('Organization', p.organization)}

        ${fatherName ? sec("Father") + f('Name', fatherName) + f('Phone', p.father_phone) + f('City/State', [p.father_city, p.father_state].filter(Boolean).join(', ')) + f('Branch', p.father_branch) + f('BSL / UID', [p.father_bslno, p.father_uid].filter(Boolean).join(' / ')) + f('DOI', p.father_doi) : ''}
        ${motherName ? sec("Mother") + f('Name', motherName) + f('Phone', p.mother_phone) + f('City/State', [p.mother_city, p.mother_state].filter(Boolean).join(', ')) + f('Branch', p.mother_branch) + f('BSL / UID', [p.mother_bslno, p.mother_uid].filter(Boolean).join(' / ')) + f('DOI', p.mother_doi) : ''}
        ${spouseName ? sec("Spouse") + f('Name', spouseName) + f('Phone', p.spouse_phone) + f('City/State', [p.spouse_city, p.spouse_state].filter(Boolean).join(', ')) + f('Branch', p.spouse_branch) + f('BSL / UID', [p.spouse_bslno, p.spouse_uid].filter(Boolean).join(' / ')) + f('DOI', p.spouse_doi) + f('Nee Name', neeName) : ''}

        ${memberships ? sec('Group Memberships') + `<div style="grid-column:1/-1;color:rgba(255,255,255,0.8);font-size:0.87rem;text-transform:capitalize">${memberships}</div>` : ''}

        ${p.ref1_name ? sec('References') + f('Ref 1 — Name', p.ref1_name) + f('Relation', p.ref1_relation) + f('Phone', p.ref1_phone) + f('Email', p.ref1_email) + f('Branch', p.ref1_branch) : ''}
        ${p.ref2_name ? f('Ref 2 — Name', p.ref2_name) + f('Relation', p.ref2_relation) + f('Phone', p.ref2_phone) + f('Email', p.ref2_email) + f('Branch', p.ref2_branch) : ''}

        ${p.notes ? sec('Notes') + `<div style="grid-column:1/-1;color:rgba(255,255,255,0.8);font-size:0.87rem">${p.notes}</div>` : ''}
        ${p.seva_interests ? sec('Seva Interests') + `<div style="grid-column:1/-1;color:rgba(255,255,255,0.8);font-size:0.87rem">${p.seva_interests}</div>` : ''}

        ${sec('Submission Info')}
        ${f('Status', p.status)}
        ${f('Link Code', p.reg_link_code)}
        ${f('Submitted', p.submitted_at ? new Date(p.submitted_at).toLocaleString('en-IN') : null)}
        ${f('Reviewed By', p.reviewed_by)}
      </div>
      ${p.status === 'pending' ? `
      <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
        <button class="btn btn-outline" onclick="closeForcedModal()">Close</button>
        <button class="btn" style="background:var(--clr-red);color:#fff" onclick="closeForcedModal();rejectPending(${p.id})">✗ Reject</button>
        <button class="btn btn-saffron" onclick="closeForcedModal();approvePending(${p.id})">✓ Approve</button>
      </div>` : `<div style="margin-top:var(--sp-md);text-align:right"><button class="btn btn-outline" onclick="closeForcedModal()">Close</button></div>`}
    `);
  });
}

async function approvePending(id) {
  if (!confirm('Approve this registration? A new member record will be created.')) return;
  const u = getCurrentUser();
  try {
    const res = await fetch('/api/pending-members/' + id + '/approve', {
      method: 'POST',
      headers: { 'X-User': u?.username || 'admin' }
    });
    const data = await res.json();
    if (data.ok) {
      showToast('Approved! Member UID: ' + data.uid, 'success');
      await reloadMembers();
      renderCache.delete('registration');
      renderCache.delete('members');
      renderRegistration();
    } else { showToast('Failed: ' + (data.error || 'Unknown error'), 'error'); }
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function rejectPending(id) {
  if (!confirm('Reject this registration submission?')) return;
  const u = getCurrentUser();
  try {
    const res = await fetch('/api/pending-members/' + id + '/reject', {
      method: 'POST',
      headers: { 'X-User': u?.username || 'admin' }
    });
    const data = await res.json();
    if (data.ok) {
      showToast('Submission rejected.');
      renderCache.delete('registration');
      renderRegistration();
    } else { showToast('Failed: ' + (data.error || 'Unknown error'), 'error'); }
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
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
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied to clipboard!', 'success'))
      .catch(() => _fallbackCopy(url));
  } else {
    _fallbackCopy(url);
  }
}

function _fallbackCopy(url) {
  const ta = document.createElement('textarea');
  ta.value = url;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Link copied to clipboard!', 'success');
  } catch {
    showToast('Could not copy — copy manually: ' + url, '');
  }
  document.body.removeChild(ta);
}

function openAddLinkModal() {
  const defaultExpiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
  const randCode = Array.from({length: 10}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
  openModal(`
    <div class="modal-header">
      <h3>Create Registration Link</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Link Title *</label><input id="al_title" placeholder="e.g. General Registration 2026" /></div>
    <div class="form-field"><label>Link Code *</label><input id="al_code" value="${randCode}" placeholder="Auto-generated — edit if needed" /></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md)">
      <div class="form-field"><label>Max Uses</label><input id="al_max" type="number" placeholder="e.g. 200" value="100" /></div>
      <div class="form-field"><label>Expiry Date *</label><input id="al_expiry" type="date" value="${defaultExpiry}" required /></div>
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
  const expiryVal = document.getElementById('al_expiry').value;
  if (!expiryVal) { showToast('Expiry date is required!', 'error'); return; }
  try {
    await apiPost('/api/reg-links', {
      title, code,
      url: window.location.origin + '/register?code=' + code,
      active: true,
      maxUses:  parseInt(document.getElementById('al_max').value) || 100,
      usedCount: 0,
      expiry:   expiryVal,
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
      <h3>Edit Link — ${l.code}</h3>
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
