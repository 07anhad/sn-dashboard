/* ============================================================
   BRANCHES-SECTION.JS — Branch Code Management
   ============================================================ */

'use strict';

function renderBranches() {
  const container = document.getElementById('branchesContent');
  container.innerHTML = `
    <div class="table-wrap">
      <div class="table-toolbar">
        <div>
          <span class="table-title">Branch Codes</span>
          <span class="table-count">${BRANCHES.length} branches</span>
        </div>
        <button class="toolbar-btn toolbar-btn-saffron" onclick="openAddBranchModal()">+ Add Branch</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--sp-md);padding:var(--sp-lg);border-bottom:1px solid var(--border)">
        <div class="contrib-card">
          <h4>Total Branches</h4>
          <div class="amount">${BRANCHES.length}</div>
        </div>
        <div class="contrib-card" style="border-left-color:var(--clr-green)">
          <h4>Active</h4>
          <div class="amount">${BRANCHES.filter(b=>b.active).length}</div>
        </div>
        <div class="contrib-card" style="border-left-color:var(--clr-red)">
          <h4>Inactive</h4>
          <div class="amount">${BRANCHES.filter(b=>!b.active).length}</div>
        </div>
        <div class="contrib-card" style="border-left-color:var(--clr-blue)">
          <h4>Total Members</h4>
          <div class="amount">${BRANCHES.reduce((a,b)=>a+b.memberCount,0).toLocaleString()}</div>
        </div>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Branch Code</th><th>Branch Name</th><th>Zone</th>
              <th>Members</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="branchesTableBody">
            ${branchesRows()}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function branchesRows() {
  return BRANCHES.map((b, i) => `
    <tr>
      <td>${i+1}</td>
      <td><code style="color:var(--clr-navy-mid);font-size:0.82rem">${b.code}</code></td>
      <td><strong>${b.name}</strong></td>
      <td>${b.zone}</td>
      <td><span class="badge badge-info">${b.memberCount.toLocaleString()}</span></td>
      <td>${b.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td>
      <td>
        <div class="td-actions">
          <button class="tbl-btn tbl-btn-edit"   onclick="editBranch(${b.id})">Edit</button>
          <button class="tbl-btn ${b.active ? 'tbl-btn-delete' : 'tbl-btn-view'}" onclick="toggleBranch(${b.id})">
            ${b.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function refreshBranchesTable() {
  const el = document.getElementById('branchesTableBody');
  if (el) el.innerHTML = branchesRows();
}

function openAddBranchModal() {
  openModal(`
    <div class="modal-header">
      <h3>➕ Add New Branch Code</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Branch Code *</label><input id="ab_code" placeholder="e.g. BR-005" /></div>
    <div class="form-field"><label>Branch Name *</label><input id="ab_name" placeholder="Branch display name" /></div>
    <div class="form-field">
      <label>Zone</label>
      <select id="ab_zone">${ZONES.map(z=>`<option>${z.name}</option>`).join('')}</select>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-saffron" onclick="saveNewBranch()">Add Branch</button>
    </div>
  `);
}

function saveNewBranch() {
  const code = document.getElementById('ab_code').value.trim();
  const name = document.getElementById('ab_name').value.trim();
  if (!code || !name) { showToast('Code and name are required!', 'error'); return; }
  BRANCHES.push({
    id: BRANCHES.length + 1, code, name,
    zone: document.getElementById('ab_zone').value,
    active: true, memberCount: 0
  });
  closeForcedModal();
  renderCache.delete('branches');
  renderBranches();
  showToast('Branch added!', 'success');
}

function editBranch(id) {
  const b = BRANCHES.find(x => x.id === id);
  if (!b) return;
  openModal(`
    <div class="modal-header">
      <h3>✏️ Edit Branch — ${b.code}</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Branch Code</label><input id="eb_code" value="${b.code}" /></div>
    <div class="form-field"><label>Branch Name</label><input id="eb_name" value="${b.name}" /></div>
    <div class="form-field">
      <label>Zone</label>
      <select id="eb_zone">${ZONES.map(z=>`<option ${b.zone===z.name?'selected':''}>${z.name}</option>`).join('')}</select>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveBranchEdit(${id})">Save</button>
    </div>
  `);
}

function saveBranchEdit(id) {
  const b = BRANCHES.find(x => x.id === id);
  if (!b) return;
  b.code = document.getElementById('eb_code').value;
  b.name = document.getElementById('eb_name').value;
  b.zone = document.getElementById('eb_zone').value;
  closeForcedModal();
  refreshBranchesTable();
  showToast('Branch updated!', 'success');
}

function toggleBranch(id) {
  const b = BRANCHES.find(x => x.id === id);
  if (!b) return;
  b.active = !b.active;
  refreshBranchesTable();
  showToast(`Branch ${b.active ? 'activated' : 'deactivated'}!`);
}