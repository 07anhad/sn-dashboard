/* ============================================================
   MEMBERS-SECTION.JS — Members List, Filters, Distribution
   ============================================================ */

'use strict';

let membersData    = [...MEMBERS];
let membersPage    = 1;
const MEMBERS_PER_PAGE = 8;

function renderMembers() {
  const container = document.getElementById('membersContent');
  container.innerHTML = `
    <!-- Filter Bar -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Search by Name</label>
        <input type="text" id="filterName" placeholder="Enter name…" oninput="filterMembers()" />
      </div>
      <div class="filter-group">
        <label>Search by Mobile</label>
        <input type="text" id="filterMobile" placeholder="Enter mobile…" oninput="filterMembers()" />
      </div>
      <div class="filter-group">
        <label>Filter by Zone</label>
        <select id="filterZone" onchange="filterMembers()">
          <option value="">All Zones</option>
          ${ZONES.map(z => `<option value="${z.name}">${z.name}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Approval Status</label>
        <select id="filterApproval" onchange="filterMembers()">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Expired">Expired</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Member Type</label>
        <select id="filterType" onchange="filterMembers()">
          <option value="">Select Member Type</option>
          ${MEMBER_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group filter-reset">
        <button class="btn btn-outline btn-sm" onclick="clearMemberFilters()">✕ Reset</button>
      </div>
    </div>

    <!-- Zone Distribution -->
    <div class="sub-heading">Zone-wise Member Distribution</div>
    <div id="zoneDistribution"></div>

    <!-- Members Table -->
    <div class="table-wrap" style="margin-top:var(--sp-lg);">
      <div class="table-toolbar">
        <div>
          <span class="table-title">Members List</span>
          <span class="table-count" id="memberCount">0</span>
        </div>
        <div class="table-actions">
          <button class="toolbar-btn toolbar-btn-saffron" onclick="openAddMemberModal()">+ Add Member</button>
          <button class="toolbar-btn" onclick="exportMembers()">↓ Export</button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>UID</th>
              <th>BSL No.</th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Zone</th>
              <th>Membership Type</th>
              <th>Status</th>
              <th>Approval</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="membersTableBody"></tbody>
        </table>
      </div>
      <div class="pagination" id="membersPagination"></div>
    </div>
  `;

  renderZoneDistribution();
  filterMembers();
}

function renderZoneDistribution() {
  const el = document.getElementById('zoneDistribution');
  if (!el) return;
  const activeZones = ZONES.filter(z => z.active);
  el.innerHTML = activeZones.map(zone => {
    const zoneMembers = MEMBERS.filter(m => m.zone === zone.name);
    return `
      <div class="card mb-md">
        <div class="dist-header">
          <span class="dist-zone-name">📍 ${zone.name}</span>
          <span class="dist-count">${zoneMembers.length}</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>UID</th><th>BSL No.</th><th>Name</th><th>Email</th>
                <th>Mobile</th><th>Zone</th><th>Membership Type</th>
                <th>Status</th><th>Approved Status</th><th>Join Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${zoneMembers.slice(0, 5).map(m => memberRow(m)).join('') || '<tr><td colspan="11" class="text-center text-muted" style="padding:16px">No members in this zone</td></tr>'}
            </tbody>
          </table>
        </div>
        ${zoneMembers.length > 5 ? `<div style="padding:10px 16px; font-size:0.82rem; color:var(--txt-muted);">Showing 5 of ${zoneMembers.length} members. Use filters above to see all.</div>` : ''}
      </div>
    `;
  }).join('') || '<p class="text-muted">No active zones found.</p>';
}

function filterMembers() {
  const name     = (document.getElementById('filterName')?.value     || '').toLowerCase();
  const mobile   = (document.getElementById('filterMobile')?.value   || '');
  const zone     = (document.getElementById('filterZone')?.value     || '');
  const approval = (document.getElementById('filterApproval')?.value || '');
  const type     = (document.getElementById('filterType')?.value     || '');

  membersData = MEMBERS.filter(m => {
    if (name   && !m.name.toLowerCase().includes(name))         return false;
    if (mobile && !m.mobile.includes(mobile))                    return false;
    if (zone   && m.zone !== zone)                               return false;
    if (approval && m.approvalStatus !== approval)               return false;
    if (type   && m.type !== type)                               return false;
    return true;
  });

  membersPage = 1;
  renderMembersTable();
}

function clearMemberFilters() {
  ['filterName','filterMobile','filterZone','filterApproval','filterType'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  filterMembers();
}

function renderMembersTable() {
  const tbody = document.getElementById('membersTableBody');
  const countEl = document.getElementById('memberCount');
  if (!tbody) return;

  const total = membersData.length;
  if (countEl) countEl.textContent = total + ' members';

  const start = (membersPage - 1) * MEMBERS_PER_PAGE;
  const slice = membersData.slice(start, start + MEMBERS_PER_PAGE);

  tbody.innerHTML = slice.length
    ? slice.map(m => memberRow(m)).join('')
    : `<tr><td colspan="11" style="padding:32px; text-align:center; color:var(--txt-muted);">No members found matching your filters.</td></tr>`;

  renderMembersPagination(total);
}

function memberRow(m) {
  const statusBadge   = m.status === 'Active'
    ? '<span class="badge badge-success">Active</span>'
    : '<span class="badge badge-danger">Expired</span>';
  const approvalBadge = {
    'Approved': '<span class="badge badge-success">Approved</span>',
    'Pending':  '<span class="badge badge-warning">Pending</span>',
    'Rejected': '<span class="badge badge-danger">Rejected</span>',
    'Expired':  '<span class="badge badge-gray">Expired</span>'
  }[m.approvalStatus] || '';

  return `
    <tr>
      <td><code style="font-size:0.78rem; color:var(--clr-navy-mid)">${m.uid}</code></td>
      <td>${m.bslno}</td>
      <td><strong>${m.name}</strong></td>
      <td style="font-size:0.82rem;">${m.email}</td>
      <td>${m.mobile}</td>
      <td><span class="badge badge-info">${m.zone}</span></td>
      <td style="font-size:0.82rem;">${m.type}</td>
      <td>${statusBadge}</td>
      <td>${approvalBadge}</td>
      <td style="font-size:0.82rem;">${formatDate(m.joinDate)}</td>
      <td>
        <div class="td-actions">
          <button class="tbl-btn tbl-btn-view"   onclick="viewMember('${m.uid}')">View</button>
          <button class="tbl-btn tbl-btn-edit"   onclick="editMember('${m.uid}')">Edit</button>
          <button class="tbl-btn tbl-btn-delete" onclick="deleteMember('${m.uid}')">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function renderMembersPagination(total) {
  const el = document.getElementById('membersPagination');
  if (!el) return;
  const pages = Math.ceil(total / MEMBERS_PER_PAGE);
  if (pages <= 1) { el.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="gotoMembersPage(${membersPage-1})" ${membersPage===1?'disabled':''}>‹ Prev</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn ${i===membersPage?'active':''}" onclick="gotoMembersPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="gotoMembersPage(${membersPage+1})" ${membersPage===pages?'disabled':''}>Next ›</button>`;
  el.innerHTML = html;
}

function gotoMembersPage(page) {
  const pages = Math.ceil(membersData.length / MEMBERS_PER_PAGE);
  if (page < 1 || page > pages) return;
  membersPage = page;
  renderMembersTable();
}

// ── CRUD Modals ────────────────────────────
function viewMember(uid) {
  const m = MEMBERS.find(x => x.uid === uid);
  if (!m) return;
  openModal(`
    <div class="modal-header">
      <h3>👤 Member Details</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md);">
      ${modalField('UID', m.uid)}
      ${modalField('BSL No.', m.bslno)}
      ${modalField('Full Name', m.name)}
      ${modalField('Email', m.email)}
      ${modalField('Mobile', m.mobile)}
      ${modalField('Zone', m.zone)}
      ${modalField('Membership Type', m.type)}
      ${modalField('Status', m.status)}
      ${modalField('Approval Status', m.approvalStatus)}
      ${modalField('Join Date', formatDate(m.joinDate))}
    </div>
    <div style="margin-top:var(--sp-lg);text-align:right">
      <button class="btn btn-primary" onclick="closeForcedModal()">Close</button>
    </div>
  `);
}

function editMember(uid) {
  const m = MEMBERS.find(x => x.uid === uid);
  if (!m) return;
  openModal(`
    <div class="modal-header">
      <h3>✏️ Edit Member — ${m.name}</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Full Name</label><input id="em_name" value="${m.name}" /></div>
    <div class="form-field"><label>Email</label><input id="em_email" value="${m.email}" /></div>
    <div class="form-field"><label>Mobile</label><input id="em_mobile" value="${m.mobile}" /></div>
    <div class="form-field">
      <label>Zone</label>
      <select id="em_zone">${ZONES.map(z=>`<option ${m.zone===z.name?'selected':''}>${z.name}</option>`).join('')}</select>
    </div>
    <div class="form-field">
      <label>Approval Status</label>
      <select id="em_approval">
        ${['Pending','Approved','Rejected','Expired'].map(s=>`<option ${m.approvalStatus===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveMemberEdit('${uid}')">Save Changes</button>
    </div>
  `);
}

function saveMemberEdit(uid) {
  const idx = MEMBERS.findIndex(x => x.uid === uid);
  if (idx === -1) return;
  MEMBERS[idx].name           = document.getElementById('em_name').value;
  MEMBERS[idx].email          = document.getElementById('em_email').value;
  MEMBERS[idx].mobile         = document.getElementById('em_mobile').value;
  MEMBERS[idx].zone           = document.getElementById('em_zone').value;
  MEMBERS[idx].approvalStatus = document.getElementById('em_approval').value;
  closeForcedModal();
  filterMembers();
  renderCache.delete('members');
  showToast('Member updated successfully!', 'success');
}

function deleteMember(uid) {
  const m = MEMBERS.find(x => x.uid === uid);
  if (!m) return;
  openModal(`
    <div class="modal-header">
      <h3>🗑 Delete Member</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <p>Are you sure you want to delete <strong>${m.name}</strong> (${m.uid})?<br/>
    <span style="color:var(--clr-red);font-size:0.85rem;">This action cannot be undone.</span></p>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-danger"  onclick="confirmDeleteMember('${uid}')">Delete</button>
    </div>
  `);
}

function confirmDeleteMember(uid) {
  const idx = MEMBERS.findIndex(x => x.uid === uid);
  if (idx !== -1) MEMBERS.splice(idx, 1);
  closeForcedModal();
  filterMembers();
  showToast('Member deleted.', 'error');
}

function openAddMemberModal() {
  openModal(`
    <div class="modal-header">
      <h3>➕ Add New Member</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md);">
      <div class="form-field"><label>Full Name *</label><input id="am_name" placeholder="Full Name" /></div>
      <div class="form-field"><label>Mobile *</label><input id="am_mobile" placeholder="10-digit number" /></div>
      <div class="form-field"><label>Email</label><input id="am_email" placeholder="email@domain.com" /></div>
      <div class="form-field">
        <label>Zone</label>
        <select id="am_zone">${ZONES.map(z=>`<option>${z.name}</option>`).join('')}</select>
      </div>
      <div class="form-field" style="grid-column:1/-1">
        <label>Membership Type</label>
        <select id="am_type"><option value="">-- Select --</option>${MEMBER_TYPES.map(t=>`<option>${t}</option>`).join('')}</select>
      </div>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-saffron" onclick="saveNewMember()">Add Member</button>
    </div>
  `);
}

function saveNewMember() {
  const name   = document.getElementById('am_name').value.trim();
  const mobile = document.getElementById('am_mobile').value.trim();
  if (!name || !mobile) { showToast('Name and mobile are required!', 'error'); return; }

  const newId = 'UID' + String(MEMBERS.length + 1).padStart(3, '0');
  const newBSL = 'BSL-' + String(MEMBERS.length + 1).padStart(4, '0');
  MEMBERS.push({
    uid: newId, bslno: newBSL,
    name,
    email:          document.getElementById('am_email').value,
    mobile,
    zone:           document.getElementById('am_zone').value,
    type:           document.getElementById('am_type').value || 'Others',
    status:         'Active',
    approvalStatus: 'Pending',
    joinDate:       new Date().toISOString().split('T')[0]
  });
  closeForcedModal();
  filterMembers();
  renderCache.delete('dashboard');
  showToast('New member added!', 'success');
}

function exportMembers() {
  const headers = ['UID','BSL No.','Name','Email','Mobile','Zone','Type','Status','Approval','Join Date'];
  const rows    = membersData.map(m =>
    [m.uid, m.bslno, m.name, m.email, m.mobile, m.zone, m.type, m.status, m.approvalStatus, m.joinDate].join(',')
  );
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = 'members.csv'; a.click();
  showToast('Members exported as CSV!', 'success');
}

function modalField(label, value) {
  return `
    <div>
      <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--txt-muted);margin-bottom:3px">${label}</div>
      <div style="font-size:0.9rem;color:var(--txt-primary)">${value || '—'}</div>
    </div>
  `;
}