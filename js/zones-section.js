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
