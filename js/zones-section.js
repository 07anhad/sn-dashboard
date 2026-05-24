/* ============================================================
   ZONES-SECTION.JS — Zone Management
   ============================================================ */

'use strict';

function renderZones() {
  const container = document.getElementById('zonesContent');
  if (!isAdmin()) { container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--clr-red);font-size:1.1rem;">⛔ Access Denied — Admin only.</div>'; return; }
  container.innerHTML = `
    <div class="table-wrap">
      <div class="table-toolbar">
        <div>
          <span class="table-title">Zones</span>
          <span class="table-count">${ZONES.length} zones</span>
        </div>
        ${isAdmin() ? '<button class="toolbar-btn toolbar-btn-saffron" onclick="openAddZoneModal()">+ Add Zone</button>' : ''}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--sp-md);padding:var(--sp-lg);border-bottom:1px solid var(--border)">
        <div class="contrib-card">
          <h4>Total Zones</h4>
          <div class="amount">${ZONES.length}</div>
        </div>
        <div class="contrib-card" style="border-left-color:var(--clr-green)">
          <h4>Active</h4>
          <div class="amount">${ZONES.filter(z=>z.active).length}</div>
        </div>
        <div class="contrib-card" style="border-left-color:var(--clr-red)">
          <h4>Inactive</h4>
          <div class="amount">${ZONES.filter(z=>!z.active).length}</div>
        </div>
        <div class="contrib-card" style="border-left-color:var(--clr-blue)">
          <h4>Total Members</h4>
          <div class="amount">${ZONES.reduce((a,z)=>a+z.memberCount,0).toLocaleString()}</div>
        </div>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Zone Name</th><th>Code</th><th>Incharge</th>
              <th>Phone</th><th>Members</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="zonesTableBody">
            ${zonesRows()}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function zonesRows() {
  if (!ZONES.length) return '<tr><td colspan="8" class="empty-row">No zones found.</td></tr>';
  return ZONES.map((z, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${z.name}</strong></td>
      <td><code style="font-size:0.78rem">${z.code}</code></td>
      <td>${z.incharge}</td>
      <td>${z.phone}</td>
      <td>${z.memberCount}</td>
      <td><span class="badge ${z.active ? 'badge-green' : 'badge-red'}">${z.active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div class="act-menu" onclick="event.stopPropagation()">
          <button class="act-trigger" onclick="toggleActMenu(this)" title="Actions">⋮</button>
          <div class="act-dropdown">
            ${isAdmin() ? `<button class="act-item act-edit" onclick="editZone(${z.id});closeActMenus()">✏ Edit</button>` : ''}
            ${isAdmin() ? `<button class="act-item ${z.active ? 'act-delete' : 'act-warn'}" onclick="toggleZoneStatus(${z.id});closeActMenus()">${z.active ? '⊘ Deactivate' : '↑ Activate'}</button>` : ''}
          </div>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddZoneModal() {
  showZoneModal('Add Zone', { id: null, name: '', code: '', active: true, incharge: '', phone: '', memberCount: 0 });
}

function editZone(id) {
  const z = ZONES.find(x => x.id === id);
  if (z) showZoneModal('Edit Zone', { ...z });
}

function showZoneModal(title, z) {
  const box = document.getElementById('modalBox');
  box.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" onclick="closeModal(event)">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group"><label>Zone Name</label><input type="text" id="zoneName" value="${z.name}" placeholder="Enter zone name" /></div>
      <div class="form-group"><label>Zone Code</label><input type="text" id="zoneCode" value="${z.code}" placeholder="e.g. VK" /></div>
      <div class="form-group"><label>Incharge Name</label><input type="text" id="zoneIncharge" value="${z.incharge}" placeholder="Enter incharge name" /></div>
      <div class="form-group"><label>Phone</label><input type="text" id="zonePhone" value="${z.phone}" placeholder="Enter phone number" /></div>
      <div class="form-group">
        <label>Status</label>
        <select id="zoneActive">
          <option value="true" ${z.active ? 'selected' : ''}>Active</option>
          <option value="false" ${!z.active ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal(event)">Cancel</button>
      <button class="btn btn-primary" onclick="saveZone(${z.id})">Save</button>
    </div>
  `;
  document.getElementById('modal-overlay').style.display = 'flex';
}

async function saveZone(id) {
  const name     = document.getElementById('zoneName').value.trim();
  const code     = document.getElementById('zoneCode').value.trim();
  const incharge = document.getElementById('zoneIncharge').value.trim();
  const phone    = document.getElementById('zonePhone').value.trim();
  const active   = document.getElementById('zoneActive').value === 'true';

  if (!name || !code) return alert('Zone name and code are required.');

  try {
    if (id) {
      const z = ZONES.find(x => x.id === id);
      await apiPut('/api/zones/' + id, { name, code, active, member_count: z ? z.memberCount : 0, incharge, phone });
    } else {
      await apiPost('/api/zones', { name, code, active, member_count: 0, incharge, phone });
    }
    await reloadZones();
    document.getElementById('modal-overlay').style.display = 'none';
    reRenderSection('zones');
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
}

async function toggleZoneStatus(id) {
  const z = ZONES.find(x => x.id === id);
  if (z) {
    try {
      await apiPut('/api/zones/' + id, { name: z.name, code: z.code, active: !z.active, member_count: z.memberCount, incharge: z.incharge, phone: z.phone });
      await reloadZones();
      reRenderSection('zones');
    } catch(e) { showToast('Failed: ' + e.message, 'error'); }
  }
}



/*=========

'use strict';

function renderMyChildren() {
  const container = document.getElementById('myChildrenContent');
  const user = getCurrentUser();
  const uid = user?.memberUid;

  if (!uid) {
    container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--txt-muted);font-size:1rem;">No member UID is linked to your account.</div>';
    return;
  }

  container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--txt-muted);">Loading…</div>';

  fetch(`/api/my-children?uid=${encodeURIComponent(uid)}`)
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        container.innerHTML = `<div class="alert alert-error">${data.error || 'Failed to load children.'}</div>`;
        return;
      }
      const children = data.children || [];
      if (children.length === 0) {
        container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--txt-muted);font-size:1rem;">No children are registered under your UID in the Sant-Su scheme.</div>';
        return;
      }
      container.innerHTML = renderChildrenCards(children);
    })
    .catch(err => {
      container.innerHTML = `<div class="alert alert-error">Network error: ${err.message}</div>`;
    });
}

function renderChildrenCards(children) {
  const cards = children.map(c => {
    const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const gender = c.gender === 'M' ? 'Male' : c.gender === 'F' ? 'Female' : c.gender || '—';
    const statusBadge = c.date_exit_scheme
      ? '<span style="background:var(--clr-danger,#e05252);color:#fff;padding:2px 8px;border-radius:12px;font-size:0.72rem;">Exited</span>'
      : '<span style="background:var(--clr-success,#27ae60);color:#fff;padding:2px 8px;border-radius:12px;font-size:0.72rem;">Active</span>';
    const rf = (label, val) => val ? `<div><span style="color:var(--txt-muted);font-size:0.76rem;">${esc(label)}</span><br><strong style="font-size:0.84rem;">${esc(String(val))}</strong></div>` : '';
    const sec = title => `<div style="grid-column:1/-1;font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--txt-muted);margin-top:10px;padding-top:8px;border-top:1px solid var(--border);">${title}</div>`;

    return `
      <div class="card" style="margin-bottom:var(--sp-lg);padding:var(--sp-lg);max-width:900px;margin-left:auto;margin-right:auto;">\n
        <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;">
          <div style="
            width:52px;height:52px;border-radius:50%;
            background:var(--clr-saffron,#e07b29);
            color:#fff;display:flex;align-items:center;justify-content:center;
            font-size:1.4rem;font-weight:600;flex-shrink:0;
          ">${(c.name || '?').charAt(0).toUpperCase()}</div>

          <div style="flex:1;min-width:200px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
              <span style="font-size:1.05rem;font-weight:600;color:var(--txt-primary);">${esc(c.name || '—')}</span>
              ${statusBadge}
            </div>
            <div style="font-size:0.8rem;color:var(--txt-muted);margin-bottom:12px;">
              UID: <code style="font-size:0.78rem;">${esc(c.uid || '—')}</code>
              &nbsp;|&nbsp; ${esc(c.member_type || '—')}
              &nbsp;|&nbsp; BSL: ${esc(String(c.bsl || '—'))}
              &nbsp;|&nbsp; Phase ${c.phase || '—'}
              &nbsp;|&nbsp; ${esc(c.branch || '—')}
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px 16px;">
              ${sec('Child Details')}
              ${rf('Gender', gender)}
              ${rf('Date of Birth', fmt(c.date_of_birth))}
              ${rf('Scheme Entry', fmt(c.date_entry_scheme))}
              ${rf('Scheme Exit', c.date_exit_scheme ? fmt(c.date_exit_scheme) : 'Active')}
              ${rf('UID Check', c.uid_check)}
              ${rf('Form Check', c.form_check)}
              ${rf('Comments', c.comments)}
              ${rf('Address', c.address)}

              ${sec('Father')}
              ${rf('Name', c.father_name)}
              ${rf('UID', c.father_uid)}
              ${rf('Contact', c.father_contact)}
              ${rf('DOI / DOR', fmt(c.father_doi))}

              ${sec('Mother')}
              ${rf('Name', c.mother_name)}
              ${rf('UID', c.mother_uid)}
              ${rf('Contact', c.mother_contact)}
              ${rf('DOI / DOR', fmt(c.mother_doi))}

              ${(c.grandfather_name || c.grandfather_uid) ? sec('Grandfather') : ''}
              ${rf('Name', c.grandfather_name)}
              ${rf('UID', c.grandfather_uid)}
              ${rf('Contact', c.grandfather_contact)}

              ${(c.grandmother_name || c.grandmother_uid) ? sec('Grandmother') : ''}
              ${rf('Name', c.grandmother_name)}
              ${rf('UID', c.grandmother_uid)}
              ${rf('Contact', c.grandmother_contact)}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  return `
    <div style="margin-bottom:var(--sp-md);">
      <span style="font-size:0.9rem;color:var(--txt-muted);">${children.length} child${children.length !== 1 ? 'ren' : ''} registered</span>
    </div>
    ${cards}`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function checkAndShowChildrenNav() {
  const user = getCurrentUser();
  const uid = user?.memberUid;
  const navLi = document.getElementById('nav-children-li');
  if (!navLi) return;

  if (!uid || isAdmin()) {
    navLi.style.display = 'none';
    return;
  }

  try {
    const r = await fetch(`/api/my-children?uid=${encodeURIComponent(uid)}`);
    const data = await r.json();
    navLi.style.display = (data.ok && data.children && data.children.length > 0) ? '' : 'none';
  } catch {
    navLi.style.display = 'none';
  }
}

******/
