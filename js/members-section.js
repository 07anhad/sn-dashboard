/* ============================================================
   MEMBERS-SECTION.JS — Members List, Filters, Distribution
   ============================================================ */

'use strict';

let membersData      = [...MEMBERS];
let membersPage      = 1;
const MEMBERS_PER_PAGE = 10;
let membersActiveTab = 'members'; // 'members' | 'superhumane' | 'edit-log'

/* Superhumane tab state */
let superhumaneAllData  = [];
let superhumaneFiltered = [];
let superhumanePage     = 1;
const SH_PER_PAGE       = 10;

/* Set a button into loading/done state */
function setButtonLoading(btn, loading, loadingLabel) {
  if (!btn) return;
  if (loading) {
    btn.dataset.origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span>${loadingLabel || btn.innerHTML}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.origHtml || btn.innerHTML;
  }
}

function renderMembers() {
  const container = document.getElementById('membersContent');
  if (!isAdmin()) {
    const u = getCurrentUser();
    const m = MEMBERS.find(x => x.uid === u?.memberUid);
    if (m) {
      renderSelfProfileInline(m);
    } else {
      container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--txt-muted);font-size:1rem;">No member record is linked to your account.</div>';
    }
    return;
  }
  // ── Admin: Tab switcher ──
  container.innerHTML = `
    <div class="section-tabs">
      <button class="section-tab-btn ${membersActiveTab === 'members' ? 'active' : ''}"
              onclick="switchMembersTab('members')">Members</button>
      <button class="section-tab-btn ${membersActiveTab === 'superhumane' ? 'active' : ''}"
              onclick="switchMembersTab('superhumane')">Superhumane (Sant-Su)</button>
      ${isSuperAdmin() ? `<button class="section-tab-btn ${membersActiveTab === 'edit-log' ? 'active' : ''}"
              onclick="switchMembersTab('edit-log')">Profile Updates</button>` : ''}
    </div>
    <div id="membersTabContent"></div>
  `;
  if (membersActiveTab === 'members') {
    _renderMembersListTab();
  } else if (membersActiveTab === 'edit-log') {
    renderMemberEditLogTab();
  } else {
    renderSuperhumaneAdminTab();
  }
}

function switchMembersTab(tab) {
  membersActiveTab = tab;
  renderMembers();
}

async function renderMemberEditLogTab() {
  const tabContent = document.getElementById('membersTabContent');
  if (!tabContent) return;
  tabContent.innerHTML = '<div style="padding:40px;text-align:center;color:var(--txt-muted)">Loading…</div>';
  try {
    const rows = await apiGet('/api/members/edit-log?limit=200');
    if (!rows.length) {
      tabContent.innerHTML = '<div class="card" style="padding:var(--sp-xl);text-align:center;color:var(--txt-muted)">No profile updates recorded yet.</div>';
      return;
    }
    const fmt = iso => {
      const d = new Date(iso);
      return isNaN(d) ? iso : d.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    };
    tabContent.innerHTML = `
      <div class="table-wrap">
        <div class="table-toolbar">
          <div>
            <span class="table-title">Profile Updates</span>
            <span class="table-count">${rows.length} update${rows.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>UID</th><th>Updated On</th><th>Fields Changed</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td style="color:var(--txt-muted);font-size:0.82rem">${i + 1}</td>
                  <td><a href="#" onclick="editMember(this.dataset.uid);return false;" data-uid="${r.member_uid}" style="font-weight:600">${r.member_name || '—'}</a></td>
                  <td><code style="font-size:0.78rem">${r.member_uid}</code></td>
                  <td style="font-size:0.82rem;white-space:nowrap">${fmt(r.edited_at)}</td>
                  <td style="font-size:0.82rem;color:var(--txt-muted)">${r.fields_changed || '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (e) {
    tabContent.innerHTML = `<div class="card" style="padding:var(--sp-xl);text-align:center;color:var(--clr-red)">${e.message}</div>`;
  }
}

function _renderMembersListTab() {
  const tabContent = document.getElementById('membersTabContent');
  if (!tabContent) return;
  tabContent.innerHTML = `
    <!-- Upload Card -->
    <div class="card" style="padding:var(--sp-lg);display:flex;align-items:center;gap:var(--sp-lg);flex-wrap:wrap;margin-bottom:var(--sp-xl)">
      <div style="flex:1;min-width:200px">
        <div style="font-weight:600;font-size:1rem;margin-bottom:4px">Upload Members Excel / CSV</div>
        <div class="text-muted" style="font-size:0.85em">
          Accepts <code>.xlsx</code>, <code>.xlsm</code>, or <code>.csv</code>. <strong>Multi-sheet supported</strong> — will auto-import from all sheets with member data (FormA, Jigyasus, etc.). Required: UID column.
        </div>
        <div id="membersUploadStatus" style="margin-top:8px;font-size:0.85em"></div>
        <div id="membersProgressWrap" style="display:none;margin-top:10px">
          <div style="display:flex;justify-content:space-between;font-size:0.78em;color:var(--txt-muted);margin-bottom:4px">
            <span id="membersProgressLabel">Uploading…</span>
            <span id="membersProgressPct">0%</span>
          </div>
          <div style="height:8px;background:var(--border);border-radius:99px;overflow:hidden">
            <div id="membersProgressBar" style="height:100%;width:0%;background:var(--clr-saffron);border-radius:99px;transition:width 0.2s"></div>
          </div>
        </div>
      </div>
      ${canWrite() ? `<label class="btn btn-primary" style="cursor:pointer;white-space:nowrap">
        ↑ Upload Excel / CSV
        <input type="file" accept=".csv,.xlsx,.xlsm,.xls" style="display:none" onchange="handleMembersUpload(event)">
      </label>` : '<span class="text-muted" style="font-size:0.85em">View-only access — contact a Super Admin to upload.</span>'}
    </div>

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
        <label>Member Type</label>
        <select id="filterType" onchange="filterMembers()">
          <option value="">Select Member Type</option>
          ${MEMBER_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Zone</label>
        <select id="filterZone" onchange="filterMembers()">
          <option value="">All Zones</option>
          ${[...new Set(MEMBERS.map(m => m.zone).filter(Boolean))].sort().map(z => `<option value="${z}">${z}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Pincode</label>
        <input type="text" id="filterPincode" placeholder="e.g. 110001…" oninput="filterMembers()" />
      </div>
      <div class="filter-group filter-reset">
        <button class="btn btn-outline btn-sm" onclick="clearMemberFilters()">✕ Reset</button>
      </div>
    </div>

    <!-- Members Table -->
    <div class="table-wrap" style="margin-top:var(--sp-lg);">
      <div class="table-toolbar">
        <div>
          <span class="table-title">Members List</span>
          <span class="table-count" id="memberCount">0</span>
        </div>
        <div class="table-actions">
          ${canWrite() ? '<button class="toolbar-btn toolbar-btn-saffron" onclick="openAddMemberModal()">+ Add Member</button>' : ''}
          <button class="toolbar-btn" onclick="exportMembers()">↓ Export</button>
        </div>
      </div>
      <div class="table-scroll" style="overflow-x:auto;">
        <table style="min-width:11000px;">
          <thead>
            <tr>
              <th style="min-width:52px;position:sticky;left:0;z-index:2;background:#f8faff">Actions</th>
              <th style="min-width:40px">SL</th>
              <th style="min-width:160px">UID</th>
              <th style="min-width:60px">BSL</th>
              <th style="min-width:180px">Name</th>
              <th style="min-width:105px">Date of Initiation</th>
              <th style="min-width:105px">Date of Birth</th>
              <th style="min-width:125px">Date of Reg. (Jigyasu)</th>
              <th style="min-width:115px">Date of 1st Init.</th>
              <th style="min-width:115px">Date of 2nd Init.</th>
              <th style="min-width:70px">SN/EXT</th>
              <th style="min-width:80px">Ashram</th>
              <th style="min-width:120px">Branch ID Card</th>
              <th style="min-width:120px">City</th>
              <th style="min-width:100px">State</th>
              <th style="min-width:80px">Pincode</th>
              <th style="min-width:80px">Country</th>
              <th style="min-width:120px">Mobile-1</th>
              <th style="min-width:120px">Mobile-2</th>
              <th style="min-width:90px">Landline</th>
              <th style="min-width:100px">Office Phone</th>
              <th style="min-width:180px">Email-1</th>
              <th style="min-width:180px">Email-2</th>
              <th style="min-width:70px">Blood Grp</th>
              <th style="min-width:130px">Caste</th>
              <th style="min-width:90px">Nationality</th>
              <th style="min-width:160px">Qualification</th>
              <th style="min-width:160px">Occupation</th>
              <th style="min-width:160px">Designation</th>
              <th style="min-width:180px">Organization</th>
              <th style="min-width:150px">Profession</th>
              <th style="min-width:90px">Prof. Code</th>
              <th style="min-width:100px">Comm. Grid Code</th>
              <th style="min-width:200px">Address Line 1</th>
              <th style="min-width:180px">Address Line 2</th>
              <th style="min-width:180px">Address Line 3</th>
              <th style="min-width:60px">Mahila</th>
              <th style="min-width:60px">Youth</th>
              <th style="min-width:75px">Assoc Youth</th>
              <th style="min-width:75px">Jr Pre-Init</th>
              <th style="min-width:75px">Sr Pre-Init</th>
              <th style="min-width:50px">CRC</th>
              <th style="min-width:50px">CCA</th>
              <th style="min-width:65px">Sant-Su</th>
              <th style="min-width:90px">Nee First</th>
              <th style="min-width:90px">Nee Middle</th>
              <th style="min-width:90px">Nee Last</th>
              <th style="min-width:60px">Father Title</th>
              <th style="min-width:110px">Father First Name</th>
              <th style="min-width:110px">Father Mid. Name</th>
              <th style="min-width:110px">Father Last Name</th>
              <th style="min-width:130px">Father Branch</th>
              <th style="min-width:80px">Father BSL</th>
              <th style="min-width:140px">Father UID</th>
              <th style="min-width:100px">Father DOI</th>
              <th style="min-width:110px">Father Phone</th>
              <th style="min-width:100px">Father City</th>
              <th style="min-width:90px">Father State</th>
              <th style="min-width:60px">Mother Title</th>
              <th style="min-width:110px">Mother First Name</th>
              <th style="min-width:110px">Mother Mid. Name</th>
              <th style="min-width:110px">Mother Last Name</th>
              <th style="min-width:130px">Mother Branch</th>
              <th style="min-width:80px">Mother BSL</th>
              <th style="min-width:140px">Mother UID</th>
              <th style="min-width:100px">Mother DOI</th>
              <th style="min-width:110px">Mother Phone</th>
              <th style="min-width:100px">Mother City</th>
              <th style="min-width:90px">Mother State</th>
              <th style="min-width:60px">Spouse Title</th>
              <th style="min-width:110px">Spouse First Name</th>
              <th style="min-width:110px">Spouse Mid. Name</th>
              <th style="min-width:110px">Spouse Last Name</th>
              <th style="min-width:130px">Spouse Branch</th>
              <th style="min-width:80px">Spouse BSL</th>
              <th style="min-width:140px">Spouse UID</th>
              <th style="min-width:100px">Spouse DOI</th>
              <th style="min-width:110px">Spouse Phone</th>
              <th style="min-width:100px">Spouse City</th>
              <th style="min-width:90px">Spouse State</th>
              <th style="min-width:130px">Ref-1 Name</th>
              <th style="min-width:180px">Ref-1 Address</th>
              <th style="min-width:160px">Ref-1 Email</th>
              <th style="min-width:110px">Ref-1 Phone</th>
              <th style="min-width:130px">Ref-1 Branch</th>
              <th style="min-width:100px">Ref-1 Relation</th>
              <th style="min-width:130px">Ref-2 Name</th>
              <th style="min-width:180px">Ref-2 Address</th>
              <th style="min-width:160px">Ref-2 Email</th>
              <th style="min-width:110px">Ref-2 Phone</th>
              <th style="min-width:130px">Ref-2 Branch</th>
              <th style="min-width:100px">Ref-2 Relation</th>
              <th style="min-width:100px">DOR Youth</th>
              <th style="min-width:115px">DOI (New Init.)</th>
              <th style="min-width:105px">Transfer In</th>
              <th style="min-width:140px">Transfer From</th>
              <th style="min-width:105px">Transfer Out</th>
              <th style="min-width:140px">Transfer To</th>
              <th style="min-width:105px">Date of Expire</th>
              <th style="min-width:105px">Record Status</th>
            </tr>
          </thead>
          <tbody id="membersTableBody"></tbody>
        </table>
      </div>
      <div class="pagination" id="membersPagination"></div>
    </div>
  `;
  filterMembers();
}

function renderSuperhumaneAdminTab() {
  const tabContent = document.getElementById('membersTabContent');
  if (!tabContent) return;
  tabContent.innerHTML = '<div style="padding:40px;text-align:center;color:var(--txt-muted);">Loading Superhumane records…</div>';

  fetch('/api/all-superhumane')
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        tabContent.innerHTML = `<div class="alert alert-error">${data.error || 'Failed to load.'}</div>`;
        return;
      }
      superhumaneAllData = data.children || [];
      superhumanePage = 1;
      tabContent.innerHTML = `
        <!-- Upload Card -->
        <div class="card" style="padding:var(--sp-lg);display:flex;align-items:center;gap:var(--sp-lg);flex-wrap:wrap;margin-bottom:var(--sp-xl)">
          <div style="flex:1;min-width:200px">
            <div style="font-weight:600;font-size:1rem;margin-bottom:4px">Upload Superhumane (Sant-Su) Excel / CSV</div>
            <div class="text-muted" style="font-size:0.85em">
              Accepts <code>.xlsx</code>, <code>.xlsm</code>, or <code>.csv</code>. Auto-detects Superhumane sheet. Required: UID column.
            </div>
            <div id="shUploadStatus" style="margin-top:8px;font-size:0.85em"></div>
            <div id="shProgressWrap" style="display:none;margin-top:10px">
              <div style="display:flex;justify-content:space-between;font-size:0.78em;color:var(--txt-muted);margin-bottom:4px">
                <span id="shProgressLabel">Uploading…</span>
                <span id="shProgressPct">0%</span>
              </div>
              <div style="height:8px;background:var(--border);border-radius:99px;overflow:hidden">
                <div id="shProgressBar" style="height:100%;width:0%;background:var(--clr-saffron);border-radius:99px;transition:width 0.2s"></div>
              </div>
            </div>
          </div>
          ${canWrite() ? `<label class="btn btn-primary" style="cursor:pointer;white-space:nowrap">
            ↑ Upload Excel / CSV
            <input type="file" accept=".csv,.xlsx,.xlsm,.xls" style="display:none" onchange="handleSuperhumaneUpload(event)">
          </label>` : '<span class="text-muted" style="font-size:0.85em">View-only access.</span>'}
        </div>

        <!-- SantSu Filter Bar -->
        <div class="filters-bar">
          <div class="filter-group">
            <label>Search by Name</label>
            <input type="text" id="shFilterName" placeholder="Enter name…" oninput="filterSuperhumane()" />
          </div>
          <div class="filter-group">
            <label>Search by UID</label>
            <input type="text" id="shFilterUid" placeholder="Enter UID…" oninput="filterSuperhumane()" />
          </div>
          <div class="filter-group">
            <label>Status</label>
            <select id="shFilterStatus" onchange="filterSuperhumane()">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="exited">Exited</option>
            </select>
          </div>
          <div class="filter-group filter-reset">
            <button class="btn btn-outline btn-sm" onclick="clearSuperhumaneFilters()">✕ Reset</button>
          </div>
        </div>

        <!-- SantSu Table -->
        <div class="table-wrap" style="margin-top:var(--sp-lg);">
          <div class="table-toolbar">
            <div>
              <span class="table-title">Superhumane (Sant-Su)</span>
              <span class="table-count" id="shCount">0</span>
            </div>
            <div class="table-actions">
              ${canWrite() ? '<button class="toolbar-btn toolbar-btn-saffron" onclick="openAddSuperhumaneModal()">+ Add</button>' : ''}
              <button class="toolbar-btn" onclick="exportSuperhumane()">↓ Export</button>
            </div>
          </div>
          <div class="table-scroll" style="overflow-x:auto;">
            <table style="min-width:2400px;">
              <thead>
                <tr>
                  <th style="min-width:52px;position:sticky;left:0;z-index:2;background:#f8faff">Actions</th>
                  <th style="min-width:40px">S.No</th>
                  <th style="min-width:160px">UID</th>
                  <th style="min-width:180px">Name</th>
                  <th style="min-width:70px">Gender</th>
                  <th style="min-width:105px">Date of Birth</th>
                  <th style="min-width:80px">Phase</th>
                  <th style="min-width:140px">Branch</th>
                  <th style="min-width:120px">Member Type</th>
                  <th style="min-width:60px">BSL</th>
                  <th style="min-width:110px">Form Check</th>
                  <th style="min-width:90px">UID Check</th>
                  <th style="min-width:105px">Scheme Entry</th>
                  <th style="min-width:105px">Scheme Exit</th>
                  <th style="min-width:70px">Status</th>
                  <th style="min-width:200px">Address</th>
                  <th style="min-width:160px">Father Name</th>
                  <th style="min-width:140px">Father UID</th>
                  <th style="min-width:110px">Father Contact</th>
                  <th style="min-width:105px">Father DOI</th>
                  <th style="min-width:160px">Mother Name</th>
                  <th style="min-width:140px">Mother UID</th>
                  <th style="min-width:110px">Mother Contact</th>
                  <th style="min-width:105px">Mother DOI</th>
                  <th style="min-width:160px">Grandfather Name</th>
                  <th style="min-width:140px">Grandfather UID</th>
                  <th style="min-width:110px">Grandfather Contact</th>
                  <th style="min-width:160px">Grandmother Name</th>
                  <th style="min-width:140px">Grandmother UID</th>
                  <th style="min-width:110px">Grandmother Contact</th>
                  <th style="min-width:200px">Comments</th>
                </tr>
              </thead>
              <tbody id="shTableBody"></tbody>
            </table>
          </div>
          <div class="pagination" id="shPagination"></div>
        </div>
      `;
      filterSuperhumane();
    })
    .catch(err => {
      tabContent.innerHTML = `<div class="alert alert-error">Network error: ${err.message}</div>`;
    });
}

function filterSuperhumane() {
  const name   = (document.getElementById('shFilterName')?.value   || '').toLowerCase();
  const uid    = (document.getElementById('shFilterUid')?.value    || '').toLowerCase();
  const status = (document.getElementById('shFilterStatus')?.value || '');

  superhumaneFiltered = superhumaneAllData.filter(c => {
    if (name   && !(c.name || '').toLowerCase().includes(name))         return false;
    if (uid    && !(c.uid  || '').toLowerCase().includes(uid))          return false;
    if (status === 'active' && c.date_exit_scheme)                      return false;
    if (status === 'exited' && !c.date_exit_scheme)                     return false;
    return true;
  });

  superhumanePage = 1;
  renderSuperhumaneTable();
}

function clearSuperhumaneFilters() {
  ['shFilterName', 'shFilterUid', 'shFilterStatus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  filterSuperhumane();
}

function renderSuperhumaneTable() {
  const tbody   = document.getElementById('shTableBody');
  const countEl = document.getElementById('shCount');
  if (!tbody) return;

  const total = superhumaneFiltered.length;
  if (countEl) countEl.textContent = total + ' records';

  const start = (superhumanePage - 1) * SH_PER_PAGE;
  const slice = superhumaneFiltered.slice(start, start + SH_PER_PAGE);

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="31" style="padding:32px;text-align:center;color:var(--txt-muted);">No records match your filters.</td></tr>`;
    renderSuperhumanePagination(total);
    return;
  }

  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const sh  = x => (x != null && x !== '') ? String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '—';

  tbody.innerHTML = slice.map(c => {
    const statusBadge = c.date_exit_scheme
      ? '<span class="badge badge-gray">Exited</span>'
      : '<span class="badge badge-success">Active</span>';
    const exitItem = canWrite()
      ? (c.date_exit_scheme
          ? `<button class="act-item act-warn" onclick="toggleSuperhumaneStatus('${c.uid}');closeActMenus()">\u2191 Reactivate</button>`
          : `<button class="act-item act-delete" onclick="toggleSuperhumaneStatus('${c.uid}');closeActMenus()">\u2298 Deactivate</button>`)
      : '';
    return `<tr${c.date_exit_scheme ? ' style="opacity:0.55;filter:grayscale(0.5)"' : ''}>
      <td style="position:sticky;left:0;z-index:1;background:var(--bg-card);white-space:nowrap">
        <div class="act-menu" onclick="event.stopPropagation()">
          <button class="act-trigger" onclick="toggleActMenu(this)" title="Actions">⋮</button>
          <div class="act-dropdown">
            <button class="act-item act-view" onclick="viewSuperhumane('${c.uid}');closeActMenus()">\ud83d\udc41 View</button>
            ${canWrite() ? `<button class="act-item act-edit" onclick="editSuperhumane('${c.uid}');closeActMenus()">\u270f Edit</button>` : ''}
            ${exitItem}
          </div>
        </div>
      </td>
      <td>${sh(c.sno)}</td>
      <td><code style="font-size:0.78rem;color:var(--clr-navy-mid)">${sh(c.uid)}</code></td>
      <td><strong>${sh(c.name)}</strong></td>
      <td>${c.gender === 'M' ? 'Male' : c.gender === 'F' ? 'Female' : sh(c.gender)}</td>
      <td>${fmt(c.date_of_birth)}</td>
      <td>${sh(c.phase)}</td>
      <td style="font-size:0.82rem">${sh(c.branch)}</td>
      <td>${sh(c.member_type)}</td>
      <td>${sh(c.bsl)}</td>
      <td style="font-size:0.82rem">${sh(c.form_check)}</td>
      <td>${sh(c.uid_check)}</td>
      <td>${fmt(c.date_entry_scheme)}</td>
      <td>${c.date_exit_scheme ? fmt(c.date_exit_scheme) : '—'}</td>
      <td>${statusBadge}</td>
      <td style="font-size:0.82rem">${sh(c.address)}</td>
      <td>${sh(c.father_name)}</td>
      <td><code style="font-size:0.78rem">${sh(c.father_uid)}</code></td>
      <td>${sh(c.father_contact)}</td>
      <td>${fmt(c.father_doi)}</td>
      <td>${sh(c.mother_name)}</td>
      <td><code style="font-size:0.78rem">${sh(c.mother_uid)}</code></td>
      <td>${sh(c.mother_contact)}</td>
      <td>${fmt(c.mother_doi)}</td>
      <td>${sh(c.grandfather_name)}</td>
      <td><code style="font-size:0.78rem">${sh(c.grandfather_uid)}</code></td>
      <td>${sh(c.grandfather_contact)}</td>
      <td>${sh(c.grandmother_name)}</td>
      <td><code style="font-size:0.78rem">${sh(c.grandmother_uid)}</code></td>
      <td>${sh(c.grandmother_contact)}</td>
      <td style="font-size:0.82rem">${sh(c.comments)}</td>
    </tr>`;
  }).join('');

  renderSuperhumanePagination(total);
}

function renderSuperhumanePagination(total) {
  const el = document.getElementById('shPagination');
  if (!el) return;
  const pages = Math.ceil(total / SH_PER_PAGE);
  if (pages <= 1) { el.innerHTML = ''; return; }

  const p = superhumanePage;
  const btn = (i, label, cls='') =>
    `<button class="page-btn ${cls}" onclick="gotoSuperhumanePage(${i})">${label}</button>`;
  const disabled = (label, cls='') =>
    `<button class="page-btn ${cls}" disabled>${label}</button>`;

  let html = '';
  html += p === 1 ? disabled('‹ Prev') : btn(p - 1, '‹ Prev');

  const WINDOW = 2;
  const showFirst = p > WINDOW + 2;
  const showLast  = p < pages - WINDOW - 1;
  if (showFirst) { html += btn(1, '1'); html += disabled('…'); }

  const lo = Math.max(1, p - WINDOW);
  const hi = Math.min(pages, p + WINDOW);
  for (let i = lo; i <= hi; i++) html += btn(i, i, i === p ? 'active' : '');

  if (showLast) { html += disabled('…'); html += btn(pages, pages); }
  html += p === pages ? disabled('Next ›') : btn(p + 1, 'Next ›');
  html += `<span style="margin-left:12px;font-size:0.8rem;color:var(--txt-muted);align-self:center">Page ${p} of ${pages} &nbsp;|&nbsp; ${total} records</span>`;

  el.innerHTML = html;
}

function gotoSuperhumanePage(page) {
  const pages = Math.ceil(superhumaneFiltered.length / SH_PER_PAGE);
  if (page < 1 || page > pages) return;
  superhumanePage = page;
  renderSuperhumaneTable();
}

function exportSuperhumane() {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  const COLS = [
    ['S.No',              c => c.sno],
    ['UID',               c => c.uid],
    ['Name',              c => c.name],
    ['Gender',            c => c.gender === 'M' ? 'Male' : c.gender === 'F' ? 'Female' : (c.gender || '')],
    ['Date of Birth',     c => fmt(c.date_of_birth)],
    ['Phase',             c => c.phase],
    ['Branch',            c => c.branch],
    ['Member Type',       c => c.member_type],
    ['BSL',               c => c.bsl],
    ['Form Check',        c => c.form_check],
    ['UID Check',         c => c.uid_check],
    ['Scheme Entry',      c => fmt(c.date_entry_scheme)],
    ['Scheme Exit',       c => fmt(c.date_exit_scheme)],
    ['Status',            c => c.date_exit_scheme ? 'Exited' : 'Active'],
    ['Address',           c => c.address],
    ['Father Name',       c => c.father_name],
    ['Father UID',        c => c.father_uid],
    ['Father Contact',    c => c.father_contact],
    ['Father DOI',        c => fmt(c.father_doi)],
    ['Mother Name',       c => c.mother_name],
    ['Mother UID',        c => c.mother_uid],
    ['Mother Contact',    c => c.mother_contact],
    ['Mother DOI',        c => fmt(c.mother_doi)],
    ['Grandfather Name',  c => c.grandfather_name],
    ['Grandfather UID',   c => c.grandfather_uid],
    ['Grandfather Cont.', c => c.grandfather_contact],
    ['Grandmother Name',  c => c.grandmother_name],
    ['Grandmother UID',   c => c.grandmother_uid],
    ['Grandmother Cont.', c => c.grandmother_contact],
    ['Comments',          c => c.comments],
  ];

  const header = COLS.map(([h]) => esc(h)).join(',');
  const rows   = superhumaneFiltered.map(c => COLS.map(([, fn]) => esc(fn(c))).join(','));
  const csv    = [header, ...rows].join('\r\n');
  const blob   = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = 'superhumane_export.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ── Superhumane: reload cache + re-filter ─── */
async function reloadSuperhumane() {
  const r    = await fetch('/api/all-superhumane');
  const data = await r.json();
  if (data.ok) superhumaneAllData = data.children || [];
  filterSuperhumane();
}

/* ── Superhumane: View modal ─────────────── */
function viewSuperhumane(uid) {
  const c = superhumaneAllData.find(x => x.uid === uid);
  if (!c) return;
  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const sh  = x => (x != null && x !== '') ? String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '—';
  const rf  = (label, val) => `<div><span style="color:var(--txt-muted);font-size:0.76rem;">${label}</span><br><strong style="font-size:0.88rem;">${sh(val)}</strong></div>`;
  const rfd = (label, val) => `<div><span style="color:var(--txt-muted);font-size:0.76rem;">${label}</span><br><strong style="font-size:0.88rem;">${fmt(val)}</strong></div>`;
  const sec = t => `<div style="grid-column:1/-1;font-weight:700;font-size:0.73rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin-top:10px;padding-top:8px;border-top:1px solid var(--border);">${t}</div>`;
  const statusBadge = c.date_exit_scheme
    ? '<span class="badge badge-gray">Exited Scheme</span>'
    : '<span class="badge badge-success">Active</span>';

  openModal(`
    <div class="modal-header">
      <h3>Superhumane Record</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--clr-saffron);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:700;flex-shrink:0;">${(c.name||'?').charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-size:1.05rem;font-weight:700;">${sh(c.name)}</div>
        <div style="font-size:0.8rem;color:var(--txt-muted);">UID: <code>${sh(c.uid)}</code> &nbsp;|&nbsp; ${sh(c.member_type)} &nbsp;|&nbsp; ${statusBadge}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px 16px;font-size:0.84rem;">
      ${sec('Identity')}
      ${rf('UID', c.uid)}  ${rf('BSL', c.bsl)}  ${rf('Phase', c.phase)}  ${rf('Branch', c.branch)}
      ${rf('Gender', c.gender === 'M' ? 'Male' : c.gender === 'F' ? 'Female' : c.gender)}
      ${rf('Member Type', c.member_type)}  ${rf('UID Check', c.uid_check)}  ${rf('Form Check', c.form_check)}
      ${sec('Dates')}
      ${rfd('Date of Birth', c.date_of_birth)}  ${rfd('Scheme Entry', c.date_entry_scheme)}  ${rfd('Scheme Exit', c.date_exit_scheme)}
      ${sec('Address / Comments')}
      ${rf('Address', c.address)}  ${rf('Comments', c.comments)}
      ${sec('Father')}
      ${rf('Name', c.father_name)}  ${rf('UID', c.father_uid)}  ${rf('Contact', c.father_contact)}  ${rfd('DOI', c.father_doi)}
      ${sec('Mother')}
      ${rf('Name', c.mother_name)}  ${rf('UID', c.mother_uid)}  ${rf('Contact', c.mother_contact)}  ${rfd('DOI', c.mother_doi)}
      ${(c.grandfather_name||c.grandfather_uid) ? sec('Grandfather') : ''}
      ${rf('Name', c.grandfather_name)}  ${rf('UID', c.grandfather_uid)}  ${rf('Contact', c.grandfather_contact)}
      ${(c.grandmother_name||c.grandmother_uid) ? sec('Grandmother') : ''}
      ${rf('Name', c.grandmother_name)}  ${rf('UID', c.grandmother_uid)}  ${rf('Contact', c.grandmother_contact)}
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end;flex-wrap:wrap;">
      ${canWrite() ? `<button class="btn btn-outline" onclick="closeForcedModal();editSuperhumane('${uid}')">✏️ Edit</button>` : ''}
      <button class="btn btn-outline" onclick="closeForcedModal()">Close</button>
    </div>
  `, true);
}

/* ── Superhumane: Edit modal ─────────────── */
function editSuperhumane(uid) {
  const c = superhumaneAllData.find(x => x.uid === uid);
  if (!c) return;
  const dv = (k, fallback='') => (c[k] != null && c[k] !== '') ? c[k] : fallback;
  const dateVal = k => c[k] ? c[k].slice(0, 10) : '';
  const fi = (id, label, val, type='text') =>
    `<div class="form-field"><label>${label}</label><input id="${id}" type="${type}" value="${String(val||'').replace(/"/g,'&quot;')}" /></div>`;
  const sel = (id, label, val, opts) =>
    `<div class="form-field"><label>${label}</label><select id="${id}">${opts.map(o => `<option value="${o}"${o===val?' selected':''}>${o||'—'}</option>`).join('')}</select></div>`;

  openModal(`
    <div class="modal-header">
      <h3>✏️ Edit Superhumane — ${String(c.name||'').replace(/</g,'&lt;')}</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md);">
      ${fi('she_name',        'Name *',         dv('name'))}
      ${fi('she_uid',         'UID *',           dv('uid'))}
      ${fi('she_bsl',         'BSL',             dv('bsl'))}
      ${fi('she_member_type', 'Member Type',     dv('member_type'))}
      ${sel('she_gender',     'Gender',          dv('gender'), ['','M','F'])}
      ${fi('she_phase',       'Phase',           dv('phase'))}
      ${fi('she_branch',      'Branch',          dv('branch'))}
      ${fi('she_dob',         'Date of Birth',   dateVal('date_of_birth'), 'date')}
      ${fi('she_form_check',  'Form Check',      dv('form_check'))}
      ${fi('she_uid_check',   'UID Check',       dv('uid_check'))}
      ${fi('she_date_entry',  'Scheme Entry',    dateVal('date_entry_scheme'), 'date')}
      ${fi('she_date_exit',   'Scheme Exit',     dateVal('date_exit_scheme'), 'date')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md);margin-top:var(--sp-md);">
      ${fi('she_address',     'Address',         dv('address'))}
      ${fi('she_comments',    'Comments',        dv('comments'))}
    </div>
    <div style="font-weight:600;font-size:0.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--txt-muted);margin:var(--sp-md) 0 var(--sp-sm);">Father</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md);">
      ${fi('she_father_name',    'Father Name',    dv('father_name'))}
      ${fi('she_father_uid',     'Father UID',     dv('father_uid'))}
      ${fi('she_father_contact', 'Father Contact', dv('father_contact'))}
      ${fi('she_father_doi',     'Father DOI',     dateVal('father_doi'), 'date')}
    </div>
    <div style="font-weight:600;font-size:0.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--txt-muted);margin:var(--sp-md) 0 var(--sp-sm);">Mother</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md);">
      ${fi('she_mother_name',    'Mother Name',    dv('mother_name'))}
      ${fi('she_mother_uid',     'Mother UID',     dv('mother_uid'))}
      ${fi('she_mother_contact', 'Mother Contact', dv('mother_contact'))}
      ${fi('she_mother_doi',     'Mother DOI',     dateVal('mother_doi'), 'date')}
    </div>
    <div style="font-weight:600;font-size:0.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--txt-muted);margin:var(--sp-md) 0 var(--sp-sm);">Grandparents</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md);">
      ${fi('she_gf_name',    'Grandfather Name',    dv('grandfather_name'))}
      ${fi('she_gf_uid',     'Grandfather UID',     dv('grandfather_uid'))}
      ${fi('she_gf_contact', 'Grandfather Contact', dv('grandfather_contact'))}
      ${fi('she_gm_name',    'Grandmother Name',    dv('grandmother_name'))}
      ${fi('she_gm_uid',     'Grandmother UID',     dv('grandmother_uid'))}
      ${fi('she_gm_contact', 'Grandmother Contact', dv('grandmother_contact'))}
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end;">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button id="shEditSaveBtn" class="btn btn-primary" onclick="saveSuperhumaneEdit('${uid}')">Save Changes</button>
    </div>
  `, true);
}

async function saveSuperhumaneEdit(uid) {
  const g = id => document.getElementById(id)?.value.trim() ?? '';
  const name = g('she_name');
  if (!name) { showToast('Name is required!', 'error'); return; }
  const btn = document.getElementById('shEditSaveBtn');
  setButtonLoading(btn, true, 'Saving…');
  try {
    await apiPut('/api/superhumane/' + uid, {
      name,
      member_type:         g('she_member_type'),
      gender:              g('she_gender'),
      bsl:                 g('she_bsl'),
      phase:               g('she_phase'),
      branch:              g('she_branch'),
      date_of_birth:       g('she_dob')         || null,
      form_check:          g('she_form_check'),
      uid_check:           g('she_uid_check'),
      address:             g('she_address'),
      comments:            g('she_comments'),
      father_name:         g('she_father_name'),
      father_uid:          g('she_father_uid'),
      father_contact:      g('she_father_contact'),
      father_doi:          g('she_father_doi')   || null,
      mother_name:         g('she_mother_name'),
      mother_uid:          g('she_mother_uid'),
      mother_contact:      g('she_mother_contact'),
      mother_doi:          g('she_mother_doi')   || null,
      grandfather_name:    g('she_gf_name'),
      grandfather_uid:     g('she_gf_uid'),
      grandfather_contact: g('she_gf_contact'),
      grandmother_name:    g('she_gm_name'),
      grandmother_uid:     g('she_gm_uid'),
      grandmother_contact: g('she_gm_contact'),
      date_entry_scheme:   g('she_date_entry')   || null,
      date_exit_scheme:    g('she_date_exit')    || null,
    });
    await reloadSuperhumane();
    closeForcedModal();
    showToast('Superhumane record updated!', 'success');
  } catch(e) {
    setButtonLoading(btn, false);
    showToast('Failed: ' + e.message, 'error');
  }
}

/* ── Superhumane: Toggle Deactivate status ─ */
function toggleSuperhumaneStatus(uid) {
  const c = superhumaneAllData.find(x => x.uid === uid);
  if (!c) return;
  const isExit = !c.date_exit_scheme; // true = about to exit, false = about to reactivate
  openModal(`
    <div class="modal-header">
      <h3>${isExit ? '⬜ Deactivate' : '✅ Reactivate'}</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <p>${isExit ? 'Mark <strong>' + String(c.name||'').replace(/</g,'&lt;') + '</strong> as exited from the Sant-Su scheme?' : 'Reactivate <strong>' + String(c.name||'').replace(/</g,'&lt;') + '</strong> in the Sant-Su scheme?'}</p>
    <p style="font-size:0.85rem;color:var(--txt-muted);">${isExit ? 'Today\'s date will be recorded as the exit date.' : 'The exit date will be cleared.'}</p>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end;">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button id="shToggleBtn" class="btn ${isExit ? 'btn-danger' : 'btn-saffron'}"
              onclick="confirmToggleSuperhumane('${uid}', ${isExit})">${isExit ? 'Deactivate' : 'Reactivate'}</button>
    </div>
  `);
}

async function confirmToggleSuperhumane(uid, doExit) {
  const btn = document.getElementById('shToggleBtn');
  setButtonLoading(btn, true, doExit ? 'Exiting…' : 'Reactivating…');
  try {
    await apiPut('/api/superhumane/' + uid, { exit: doExit });
    await reloadSuperhumane();
    closeForcedModal();
    showToast(doExit ? 'Marked as exited from scheme.' : 'Reactivated!', doExit ? '' : 'success');
  } catch(e) {
    setButtonLoading(btn, false);
    showToast('Failed: ' + e.message, 'error');
  }
}

/* ── Superhumane: Add new record modal ───── */
function openAddSuperhumaneModal() {
  openModal(`
    <div class="modal-header">
      <h3>➕ Add Superhumane Record</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md);">
      <div class="form-field"><label>UID *</label><input id="sha_uid" placeholder="Child's UID" /></div>
      <div class="form-field"><label>Name *</label><input id="sha_name" placeholder="Full Name" /></div>
      <div class="form-field"><label>Member Type</label><input id="sha_member_type" placeholder="e.g. Superhumane" /></div>
      <div class="form-field"><label>Gender</label>
        <select id="sha_gender"><option value="">—</option><option value="M">Male</option><option value="F">Female</option></select>
      </div>
      <div class="form-field"><label>BSL</label><input id="sha_bsl" type="number" /></div>
      <div class="form-field"><label>Phase</label><input id="sha_phase" /></div>
      <div class="form-field"><label>Branch</label><input id="sha_branch" /></div>
      <div class="form-field"><label>Date of Birth</label><input id="sha_dob" type="date" /></div>
      <div class="form-field"><label>Scheme Entry Date</label><input id="sha_entry" type="date" /></div>
      <div class="form-field"><label>Father UID</label><input id="sha_father_uid" placeholder="Father's member UID" /></div>
      <div class="form-field"><label>Father Name</label><input id="sha_father_name" /></div>
      <div class="form-field"><label>Father Contact</label><input id="sha_father_contact" /></div>
      <div class="form-field"><label>Mother UID</label><input id="sha_mother_uid" placeholder="Mother's member UID" /></div>
      <div class="form-field"><label>Mother Name</label><input id="sha_mother_name" /></div>
      <div class="form-field"><label>Mother Contact</label><input id="sha_mother_contact" /></div>
      <div class="form-field" style="grid-column:1/-1"><label>Address</label><input id="sha_address" /></div>
      <div class="form-field" style="grid-column:1/-1"><label>Comments</label><input id="sha_comments" /></div>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end;">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button id="shAddSaveBtn" class="btn btn-saffron" onclick="saveNewSuperhumane()">Add Record</button>
    </div>
  `, true);
}

async function saveNewSuperhumane() {
  const g = id => document.getElementById(id)?.value.trim() ?? '';
  const uid  = g('sha_uid');
  const name = g('sha_name');
  if (!uid)  { showToast('UID is required!',  'error'); return; }
  if (!name) { showToast('Name is required!', 'error'); return; }
  const btn = document.getElementById('shAddSaveBtn');
  setButtonLoading(btn, true, 'Adding…');
  try {
    await apiPost('/api/superhumane', {
      uid, name,
      member_type:    g('sha_member_type'),
      gender:         g('sha_gender'),
      bsl:            g('sha_bsl') || null,
      phase:          g('sha_phase'),
      branch:         g('sha_branch'),
      date_of_birth:  g('sha_dob')          || null,
      date_entry_scheme: g('sha_entry')     || null,
      father_name:    g('sha_father_name'),
      father_uid:     g('sha_father_uid'),
      father_contact: g('sha_father_contact'),
      mother_name:    g('sha_mother_name'),
      mother_uid:     g('sha_mother_uid'),
      mother_contact: g('sha_mother_contact'),
      address:        g('sha_address'),
      comments:       g('sha_comments'),
    });
    await reloadSuperhumane();
    closeForcedModal();
    showToast('Superhumane record added!', 'success');
  } catch(e) {
    setButtonLoading(btn, false);
    showToast('Failed: ' + e.message, 'error');
  }
}

function filterMembers() {
  const name    = (document.getElementById('filterName')?.value    || '').toLowerCase();
  const mobile  = (document.getElementById('filterMobile')?.value  || '');
  const type    = (document.getElementById('filterType')?.value    || '');
  const zone    = (document.getElementById('filterZone')?.value    || '');
  const pincode = (document.getElementById('filterPincode')?.value || '').trim();

  membersData = MEMBERS.filter(m => {
    if (name) {
      const words = name.split(/\s+/).filter(Boolean);
      const mn = (m.name || '').toLowerCase();
      if (!words.every(w => mn.includes(w))) return false;
    }
    if (mobile  && !(m.mobile  || '').includes(mobile))               return false;
    if (type    && m.type !== type)                                    return false;
    if (zone    && (m.zone    || '') !== zone)                         return false;
    if (pincode && !(m.pincode || '').includes(pincode))               return false;
    return true;
  }).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  membersData.forEach((m, i) => { m.sl = i + 1; });

  membersPage = 1;
  renderMembersTable();
}

function clearMemberFilters() {
  ['filterName', 'filterMobile', 'filterType', 'filterZone', 'filterPincode'].forEach(id => {
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
  const activeCount = membersData.filter(m => (m.status || '').toLowerCase() !== 'deactivated').length;
  if (countEl) countEl.textContent = activeCount + ' members';

  const start = (membersPage - 1) * MEMBERS_PER_PAGE;
  const slice = membersData.slice(start, start + MEMBERS_PER_PAGE);

  tbody.innerHTML = slice.length
    ? slice.map(m => memberRow(m)).join('')
    : `<tr><td colspan="100" style="padding:32px; text-align:center; color:var(--txt-muted);">No members found matching your filters.</td></tr>`;

  renderMembersPagination(total);
}

function yesNo(v) {
  if (v === 'Y' || v === 'y') return '<span class="badge badge-success" style="font-size:0.7rem;padding:2px 6px">Y</span>';
  if (v === 'N' || v === 'n' || !v) return '';
  return v;
}

function memberRow(m) {
  const isExpired = m.status && m.status.toLowerCase() === 'deactivated';
  const rowStyle  = isExpired ? ' style="opacity:0.5;filter:grayscale(0.6);"' : '';
  const statusBadge = m.status === 'Activated'
    ? '<span class="badge badge-success">Activated</span>'
    : m.status === 'Deactivated'
      ? '<span class="badge badge-gray">Deactivated</span>'
      : m.status
        ? `<span class="badge badge-gray">${m.status}</span>`
        : '';
  const deactivateItem = isExpired
    ? `<button class="act-item act-warn" onclick="toggleMemberActive('${m.uid}');closeActMenus()">\u2191 Reactivate</button>`
    : `<button class="act-item act-delete" onclick="toggleMemberActive('${m.uid}');closeActMenus()">\u2298 Deactivate</button>`;
  const v = (val) => val || '';

  const d = (val) => `<td style="font-size:0.82rem;white-space:nowrap">${formatDate(val)}</td>`;
  const yc = (val) => `<td style="text-align:center">${yesNo(val)}</td>`;

  return `
    <tr${rowStyle}>
      <td style="position:sticky;left:0;z-index:1;background:var(--bg-card);white-space:nowrap">
        <div class="act-menu" onclick="event.stopPropagation()">
          <button class="act-trigger" onclick="toggleActMenu(this)" title="Actions">⋮</button>
          <div class="act-dropdown">
            <button class="act-item act-view" onclick="viewMember('${m.uid}');closeActMenus()">\ud83d\udc41 View</button>
            ${canWrite() ? `<button class="act-item act-edit" onclick="editMember('${m.uid}');closeActMenus()">\u270f Edit</button>` : ''}
            ${canWrite() ? deactivateItem : ''}
          </div>
        </div>
      </td>
      <td>${v(m.sl)}</td>
<td><code style="font-size:0.78rem;color:var(--clr-navy-mid)" ${m.uid?.startsWith('PENDING-') ? 'data-pending title="UID not yet assigned"' : ''}>${v(m.uid)}</code></td>
      <td>${v(m.bslno)}</td>
      <td><strong>${v(m.name)}</strong></td>
      ${d(m.dateOfInitiation)}
      ${d(m.dateOfBirth)}
      ${d(m.dateOfRegistration)}
      ${d(m.dateOfFirstInitiation)}
      ${d(m.dateOfSecondInitiation)}
      <td>${v(m.snExt)}</td>
      <td>${v(m.ashram)}</td>
      <td style="font-size:0.78rem">${v(m.branchIdCard)}</td>
      <td>${v(m.city)}</td>
      <td>${v(m.state)}</td>
      <td>${v(m.pincode)}</td>
      <td>${v(m.country)}</td>
      <td>${v(m.mobile)}</td>
      <td>${v(m.mobile2)}</td>
      <td>${v(m.landline)}</td>
      <td>${v(m.officePhone)}</td>
      <td style="font-size:0.82rem">${v(m.email)}</td>
      <td style="font-size:0.82rem">${v(m.email2)}</td>
      <td>${v(m.bloodGroup)}</td>
      <td>${v(m.caste)}</td>
      <td>${v(m.nationality)}</td>
      <td>${v(m.qualification)}</td>
      <td>${v(m.occupation)}</td>
      <td>${v(m.designation)}</td>
      <td>${v(m.organization)}</td>
      <td>${v(m.profession)}</td>
      <td style="font-size:0.78rem">${v(m.professionCode)}</td>
      <td style="font-size:0.78rem">${v(m.commGridCode)}</td>
      <td style="font-size:0.78rem">${v(m.addressLine1)}</td>
      <td style="font-size:0.78rem">${v(m.addressLine2)}</td>
      <td style="font-size:0.78rem">${v(m.addressLine3)}</td>
      ${yc(m.mahila)}
      ${yc(m.youth)}
      ${yc(m.assocYouth)}
      ${yc(m.jrPreInit)}
      ${yc(m.srPreInit)}
      ${yc(m.crc)}
      ${yc(m.cca)}
      ${yc(m.santSu)}
      <td>${v(m.neeFirst)}</td>
      <td>${v(m.neeMiddle)}</td>
      <td>${v(m.neeLast)}</td>
      <td>${v(m.fatherTitle)}</td>
      <td>${v(m.fatherFirstName)}</td>
      <td>${v(m.fatherMiddleName)}</td>
      <td>${v(m.fatherLastName)}</td>
      <td style="font-size:0.82rem">${v(m.fatherBranch)}</td>
      <td>${v(m.fatherBslno)}</td>
      <td><code style="font-size:0.78rem">${v(m.fatherUid)}</code></td>
      ${d(m.fatherDoi)}
      <td>${v(m.fatherPhone)}</td>
      <td>${v(m.fatherCity)}</td>
      <td>${v(m.fatherState)}</td>
      <td>${v(m.motherTitle)}</td>
      <td>${v(m.motherFirstName)}</td>
      <td>${v(m.motherMiddleName)}</td>
      <td>${v(m.motherLastName)}</td>
      <td style="font-size:0.82rem">${v(m.motherBranch)}</td>
      <td>${v(m.motherBslno)}</td>
      <td><code style="font-size:0.78rem">${v(m.motherUid)}</code></td>
      ${d(m.motherDoi)}
      <td>${v(m.motherPhone)}</td>
      <td>${v(m.motherCity)}</td>
      <td>${v(m.motherState)}</td>
      <td>${v(m.spouseTitle)}</td>
      <td>${v(m.spouseFirstName)}</td>
      <td>${v(m.spouseMiddleName)}</td>
      <td>${v(m.spouseLastName)}</td>
      <td style="font-size:0.82rem">${v(m.spouseBranch)}</td>
      <td>${v(m.spouseBslno)}</td>
      <td><code style="font-size:0.78rem">${v(m.spouseUid)}</code></td>
      ${d(m.spouseDoi)}
      <td>${v(m.spousePhone)}</td>
      <td>${v(m.spouseCity)}</td>
      <td>${v(m.spouseState)}</td>
      <td style="font-size:0.82rem">${v(m.ref1Name)}</td>
      <td style="font-size:0.78rem">${v(m.ref1Address)}</td>
      <td style="font-size:0.82rem">${v(m.ref1Email)}</td>
      <td>${v(m.ref1Phone)}</td>
      <td style="font-size:0.82rem">${v(m.ref1Branch)}</td>
      <td>${v(m.ref1Relation)}</td>
      <td style="font-size:0.82rem">${v(m.ref2Name)}</td>
      <td style="font-size:0.78rem">${v(m.ref2Address)}</td>
      <td style="font-size:0.82rem">${v(m.ref2Email)}</td>
      <td>${v(m.ref2Phone)}</td>
      <td style="font-size:0.82rem">${v(m.ref2Branch)}</td>
      <td>${v(m.ref2Relation)}</td>
      ${d(m.dorYouth)}
      ${d(m.dateOfInitiationNew)}
      ${d(m.dateTransferIn)}
      <td style="font-size:0.82rem">${v(m.transferFromBranch)}</td>
      ${d(m.dateTransferOut)}
      <td style="font-size:0.82rem">${v(m.transferToBranch)}</td>
      ${d(m.dateOfExpire)}
      <td>${statusBadge}</td>
    </tr>
  `;
}

function renderMembersPagination(total) {
  const el = document.getElementById('membersPagination');
  if (!el) return;
  const pages = Math.ceil(total / MEMBERS_PER_PAGE);
  if (pages <= 1) { el.innerHTML = ''; return; }

  const p = membersPage;
  const btn = (i, label, cls='') =>
    `<button class="page-btn ${cls}" onclick="gotoMembersPage(${i})">${label}</button>`;
  const disabled = (label, cls='') =>
    `<button class="page-btn ${cls}" disabled>${label}</button>`;

  let html = '';
  html += p === 1 ? disabled('‹ Prev') : btn(p - 1, '‹ Prev');

  const WINDOW = 2; // pages either side of current
  const showFirst = p > WINDOW + 2;
  const showLast  = p < pages - WINDOW - 1;

  if (showFirst) {
    html += btn(1, '1');
    html += disabled('…');
  }

  const lo = Math.max(1, p - WINDOW);
  const hi = Math.min(pages, p + WINDOW);
  for (let i = lo; i <= hi; i++) {
    html += btn(i, i, i === p ? 'active' : '');
  }

  if (showLast) {
    html += disabled('…');
    html += btn(pages, pages);
  }

  html += p === pages ? disabled('Next ›') : btn(p + 1, 'Next ›');
  html += `<span style="margin-left:12px;font-size:0.8rem;color:var(--txt-muted);align-self:center">Page ${p} of ${pages} &nbsp;|&nbsp; ${total} members</span>`;

  el.innerHTML = html;
}

function gotoMembersPage(page) {
  const pages = Math.ceil(membersData.length / MEMBERS_PER_PAGE);
  if (page < 1 || page > pages) return;
  membersPage = page;
  renderMembersTable();
}

// ── CRUD Modals ────────────────────────────
// ── Inline self-profile (card page, no modal) ────────────────
function renderSelfProfileInline(m) {
  const container = document.getElementById('membersContent');
  container.innerHTML = buildSelfProfileHTML(m);
}

function buildSelfProfileHTML(m) {
  const pf = (label, val) => val
    ? `<div>
        <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--txt-muted);margin-bottom:3px">${label}</div>
        <div style="font-size:0.88rem;color:var(--txt-primary)">${val}</div>
       </div>`
    : '';
  const sec = title =>
    `<div style="grid-column:1/-1;font-weight:700;font-size:0.78rem;text-transform:uppercase;
       letter-spacing:.06em;color:var(--clr-saffron,#e07b29);margin-top:18px;padding-top:12px;
       border-top:1px solid var(--border);">${title}</div>`;
  const grid = (...fields) =>
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px 20px;margin-top:8px;">
       ${fields.join('')}
     </div>`;
  const badge = label =>
    `<span style="display:inline-block;background:var(--clr-saffron,#e07b29);color:#fff;
       padding:3px 10px;border-radius:12px;font-size:0.75rem;margin:3px 4px 3px 0;">${label}</span>`;

  const flags = [
    m.mahila    === 'Y' && badge('Mahila Association'),
    m.youth     === 'Y' && badge('Youth Member'),
    m.assocYouth=== 'Y' && badge('Associate Youth'),
    m.jrPreInit === 'Y' && badge('Jr. Pre-Initiate'),
    m.srPreInit === 'Y' && badge('Sr. Pre-Initiate'),
    m.crc       === 'Y' && badge('CRC'),
    m.cca       === 'Y' && badge('CCA'),
    m.santSu    === 'Y' && badge('Sant-Su'),
  ].filter(Boolean).join('') || '<span style="color:var(--txt-muted);font-size:0.85rem;">—</span>';

  return `
    <div class="card" style="padding:var(--sp-lg);max-width:900px;margin:0 auto;">

      <!-- Header row -->
        <div class="profile-header-row" style="display:flex;align-items:center;gap:16px;margin-bottom:20px;flex-wrap:wrap;">
        <div style="width:60px;height:60px;border-radius:50%;background:var(--clr-saffron,#e07b29);
          color:#fff;display:flex;align-items:center;justify-content:center;
          font-size:1.6rem;font-weight:700;flex-shrink:0;">
          ${(m.name||'?').charAt(0).toUpperCase()}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:1.15rem;font-weight:700;color:var(--txt-primary);">${m.name}</div>
          <div style="font-size:0.82rem;color:var(--txt-muted);margin-top:2px;">
            UID: <code style="font-size:0.8rem;">${m.uid||'—'}</code>
            ${[m.category, m.gender, m.status].filter(Boolean).map(v=>`&nbsp;·&nbsp; ${v}`).join('')}
          </div>
        </div>
        <button class="btn btn-saffron" onclick="editSelfProfileInline('${m.uid}')">✏️ Edit Profile</button>
      </div>

      <!-- Identity -->
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);">Identity</div>
      ${grid(
        pf('SL', m.sl), pf('UID', m.uid), pf('BSL No.', m.bslno),
        pf('Category', m.category), pf('Gender', m.gender), pf('Marital Status', m.maritalStatus),
        pf('Previous Branch', m.previousBranch), pf('SN/EXT', m.snExt), pf('Ashram', m.ashram),
        pf('Branch I.D. Card', m.branchIdCard), pf('Record Status', m.status)
      )}

      <!-- Initiation Dates -->
      ${sec('Initiation Dates')}
      ${grid(
        pf('Date of Initiation', formatDate(m.dateOfInitiation)),
        pf('Date of Birth', formatDate(m.dateOfBirth)),
        pf('Reg. Date (Jigyasu)', formatDate(m.dateOfRegistration)),
        pf('1st Initiation', formatDate(m.dateOfFirstInitiation)),
        pf('2nd Initiation', formatDate(m.dateOfSecondInitiation)),
        pf('DOR (Youth)', formatDate(m.dorYouth)),
        pf('DOI (New Initiate)', formatDate(m.dateOfInitiationNew))
      )}

      <!-- Personal -->
      ${sec('Personal')}
      ${grid(
        pf('Blood Group', m.bloodGroup), pf('Caste', m.caste), pf('Nationality', m.nationality),
        pf('Nee First Name', m.neeFirst), pf('Nee Middle Name', m.neeMiddle), pf('Nee Last Name', m.neeLast)
      )}

      <!-- Contact -->
      ${sec('Contact')}
      ${grid(
        pf('Mobile 1', m.mobile), pf('Mobile 2', m.mobile2), pf('Landline', m.landline),
        pf('Office Phone', m.officePhone), pf('Email 1', m.email), pf('Email 2', m.email2)
      )}

      <!-- Address -->
      ${sec('Address')}
      ${grid(
        pf('Line 1', m.addressLine1), pf('Line 2', m.addressLine2), pf('Line 3', m.addressLine3),
        pf('City', m.city), pf('Pincode', m.pincode), pf('State', m.state), pf('Country', m.country)
      )}

      <!-- Professional -->
      ${sec('Professional')}
      ${grid(
        pf('Qualification', m.qualification), pf('Occupation', m.occupation), pf('Designation', m.designation),
        pf('Organization', m.organization), pf('Profession', m.profession),
        pf('Profession Code', m.professionCode), pf('Comm. Grid Code', m.commGridCode)
      )}

      <!-- Membership Flags -->
      ${sec('Membership Flags')}
      <div style="margin-top:8px;">${flags}</div>

      <!-- Father -->
      ${sec('Father')}
      ${grid(
        pf('Name', m.fatherName), pf('UID', m.fatherUid), pf('BSL No.', m.fatherBslno),
        pf('Branch', m.fatherBranch), pf('DOI', formatDate(m.fatherDoi)), pf('Phone', m.fatherPhone),
        pf('City', m.fatherCity), pf('State', m.fatherState)
      )}

      <!-- Mother -->
      ${sec('Mother')}
      ${grid(
        pf('Name', m.motherName), pf('UID', m.motherUid), pf('BSL No.', m.motherBslno),
        pf('Branch', m.motherBranch), pf('DOI', formatDate(m.motherDoi)), pf('Phone', m.motherPhone),
        pf('City', m.motherCity), pf('State', m.motherState)
      )}

      <!-- Spouse -->
      ${sec('Spouse')}
      ${grid(
        pf('Name', m.spouseName), pf('UID', m.spouseUid), pf('BSL No.', m.spouseBslno),
        pf('Branch', m.spouseBranch), pf('DOI', formatDate(m.spouseDoi)), pf('Phone', m.spousePhone),
        pf('City', m.spouseCity), pf('State', m.spouseState)
      )}

      <!-- Reference 1 -->
      ${sec('Reference 1')}
      ${grid(
        pf('Name', m.ref1Name), pf('Relation', m.ref1Relation), pf('Branch', m.ref1Branch),
        pf('Email', m.ref1Email), pf('Phone', m.ref1Phone), pf('Address', m.ref1Address)
      )}

      <!-- Reference 2 -->
      ${sec('Reference 2')}
      ${grid(
        pf('Name', m.ref2Name), pf('Relation', m.ref2Relation), pf('Branch', m.ref2Branch),
        pf('Email', m.ref2Email), pf('Phone', m.ref2Phone), pf('Address', m.ref2Address)
      )}

      <!-- Transfer / History -->
      ${sec('Transfer / History')}
      ${grid(
        pf('Transfer In', formatDate(m.dateTransferIn)), pf('From Branch', m.transferFromBranch),
        pf('Transfer Out', formatDate(m.dateTransferOut)), pf('To Branch', m.transferToBranch),
        pf('Date of Expire', formatDate(m.dateOfExpire))
      )}

    </div>`;
}

function editSelfProfileInline(uid) {
  // Open the full tabbed edit modal in self-edit mode
  editMember(uid, true);
}

function viewMember(uid) {
  const m = MEMBERS.find(x => x.uid === uid);
  if (!m) return;
  const mf = (label, val) => val ? modalField(label, val) : '';
  const yBadge = v => v === 'Y' ? '<span class="badge badge-success">Yes</span>' : '';
  openModal(`
    <div class="modal-header">
      <h3>👤 Member Details — ${m.name}</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div style="overflow-y:auto;max-height:70vh;">
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:12px 0 6px">Identity</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('SL', m.sl)} ${mf('UID', m.uid)} ${mf('BSL No.', m.bslno)}
        ${mf('Name', m.name)} ${mf('Category', m.category)} ${mf('Gender', m.gender)}
        ${mf('Marital Status', m.maritalStatus)} ${mf('Previous Branch', m.previousBranch)} ${mf('Record Status', m.status)}
        ${mf('SN/EXT', m.snExt)} ${mf('Ashram', m.ashram)} ${mf('Branch I.D. Card', m.branchIdCard)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Initiation Dates</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Date of Initiation', formatDate(m.dateOfInitiation))}
        ${mf('Date of Birth', formatDate(m.dateOfBirth))}
        ${mf('Date of Reg. (Jigyasu)', formatDate(m.dateOfRegistration))}
        ${mf('Date of 1st Initiation', formatDate(m.dateOfFirstInitiation))}
        ${mf('Date of 2nd Initiation', formatDate(m.dateOfSecondInitiation))}
        ${mf('DOR (Youth)', formatDate(m.dorYouth))}
        ${mf('DOI (New Initiate)', formatDate(m.dateOfInitiationNew))}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Personal</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Blood Group', m.bloodGroup)} ${mf('Caste', m.caste)} ${mf('Nationality', m.nationality)}
        ${mf('Nee First Name', m.neeFirst)} ${mf('Nee Middle Name', m.neeMiddle)} ${mf('Nee Last Name', m.neeLast)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Contact</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Mobile-1', m.mobile)} ${mf('Mobile-2', m.mobile2)} ${mf('Landline', m.landline)}
        ${mf('Office Phone', m.officePhone)} ${mf('Email-1', m.email)} ${mf('Email-2', m.email2)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Address</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Line 1', m.addressLine1)} ${mf('Line 2', m.addressLine2)} ${mf('Line 3', m.addressLine3)}
        ${mf('City', m.city)} ${mf('Pincode', m.pincode)} ${mf('State', m.state)}
        ${mf('Country', m.country)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Professional</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Qualification', m.qualification)} ${mf('Occupation', m.occupation)} ${mf('Designation', m.designation)}
        ${mf('Organization', m.organization)} ${mf('Profession', m.profession)} ${mf('Profession Code', m.professionCode)}
        ${mf('Comm. Grid Code', m.commGridCode)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Membership Flags</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;padding:4px 0 8px">
        ${m.mahila === 'Y' ? '<span class="badge badge-info">Mahila Association</span>' : ''}
        ${m.youth === 'Y' ? '<span class="badge badge-info">Youth Member</span>' : ''}
        ${m.assocYouth === 'Y' ? '<span class="badge badge-info">Associate Youth</span>' : ''}
        ${m.jrPreInit === 'Y' ? '<span class="badge badge-info">Jr. Pre-Initiate</span>' : ''}
        ${m.srPreInit === 'Y' ? '<span class="badge badge-info">Sr. Pre-Initiate</span>' : ''}
        ${m.crc === 'Y' ? '<span class="badge badge-info">CRC</span>' : ''}
        ${m.cca === 'Y' ? '<span class="badge badge-info">CCA</span>' : ''}
        ${m.santSu === 'Y' ? '<span class="badge badge-info">Sant-Su</span>' : ''}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Father</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Name', m.fatherName)} ${mf('UID', m.fatherUid)} ${mf('BSL No.', m.fatherBslno)}
        ${mf('Branch', m.fatherBranch)} ${mf('DOI', formatDate(m.fatherDoi))} ${mf('Phone', m.fatherPhone)}
        ${mf('City', m.fatherCity)} ${mf('State', m.fatherState)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Mother</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Name', m.motherName)} ${mf('UID', m.motherUid)} ${mf('BSL No.', m.motherBslno)}
        ${mf('Branch', m.motherBranch)} ${mf('DOI', formatDate(m.motherDoi))} ${mf('Phone', m.motherPhone)}
        ${mf('City', m.motherCity)} ${mf('State', m.motherState)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Spouse</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Name', m.spouseName)} ${mf('UID', m.spouseUid)} ${mf('BSL No.', m.spouseBslno)}
        ${mf('Branch', m.spouseBranch)} ${mf('DOI', formatDate(m.spouseDoi))} ${mf('Phone', m.spousePhone)}
        ${mf('City', m.spouseCity)} ${mf('State', m.spouseState)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Reference 1</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Name', m.ref1Name)} ${mf('Relation', m.ref1Relation)} ${mf('Branch', m.ref1Branch)}
        ${mf('Email', m.ref1Email)} ${mf('Phone', m.ref1Phone)} ${mf('Address', m.ref1Address)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Reference 2</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Name', m.ref2Name)} ${mf('Relation', m.ref2Relation)} ${mf('Branch', m.ref2Branch)}
        ${mf('Email', m.ref2Email)} ${mf('Phone', m.ref2Phone)} ${mf('Address', m.ref2Address)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Transfer / History</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-sm);">
        ${mf('Transfer In', formatDate(m.dateTransferIn))} ${mf('From Branch', m.transferFromBranch)}
        ${mf('Transfer Out', formatDate(m.dateTransferOut))} ${mf('To Branch', m.transferToBranch)}
        ${mf('Date of Expire', formatDate(m.dateOfExpire))}
      </div>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-primary" onclick="closeForcedModal()">Close</button>
    </div>
  `);
}

function switchEditTab(name, btn) {
  document.querySelectorAll('.etab-pane').forEach(p => { p.style.display = 'none'; });
  document.querySelectorAll('.edit-tab').forEach(b => b.classList.remove('active'));
  const pane = document.getElementById('etab-' + name);
  if (pane) pane.style.display = pane.dataset.display || 'grid';
  if (btn) btn.classList.add('active');
}

function editMember(uid, isSelfEdit = false) {
  const m = MEMBERS.find(x => x.uid === uid);
  if (!m) return;

  // Escape for HTML attribute values
  const ea = v => String(v ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  // Date fields: strip time component if present
  const dt = v => v ? String(v).split('T')[0] : '';

  const fld = (id, label, val, type='text', readonly=false) =>
    `<div class="form-field"><label>${label}</label><input id="${id}" type="${type}" value="${ea(type==='date' ? dt(val) : val)}" ${readonly ? 'readonly style="opacity:0.5;cursor:not-allowed"' : ''}/></div>`;

  const sel = (id, label, val, opts) =>
    `<div class="form-field"><label>${label}</label><select id="${id}">${opts.map(o=>`<option value="${ea(o)}" ${String(val)===String(o)?'selected':''}>${o||'—'}</option>`).join('')}</select></div>`;

  const ynsEl = (id, label, val) => sel(id, label, val, ['','Y','N']);

  const secHdr = txt => `<div style="grid-column:1/-1;font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:8px 0 2px">${txt}</div>`;

  openModal(`
    <div class="modal-header">
      <h3>✏️ Edit Member — ${ea(m.name)}</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>

    <div class="edit-tabs">
      <button class="edit-tab active"        onclick="switchEditTab('personal',this)">Personal</button>
      <button class="edit-tab"               onclick="switchEditTab('contact',this)">Contact & Address</button>
      <button class="edit-tab"               onclick="switchEditTab('professional',this)">Professional</button>
      <button class="edit-tab"               onclick="switchEditTab('flags',this)">Flags & Nee</button>
      <button class="edit-tab"               onclick="switchEditTab('family',this)">Family</button>
      <button class="edit-tab"               onclick="switchEditTab('references',this)">References</button>
      <button class="edit-tab"               onclick="switchEditTab('admin',this)">Admin / Transfer</button>
    </div>

    <div style="overflow-y:auto;max-height:58vh;padding-right:4px;">

      <!-- ── PERSONAL ────────────────────────── -->
      <div id="etab-personal" class="etab-pane" data-display="grid"
           style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${fld('em_name',        'Full Name *',            m.name)}
        ${fld('em_bslno',       'BSL No.',                m.bslno)}
        ${fld('em_blood',       'Blood Group',            m.bloodGroup)}
        ${fld('em_doi',         'Date of Initiation',     m.dateOfInitiation,        'date')}
        ${fld('em_dob',         'Date of Birth',          m.dateOfBirth,             'date')}
        ${fld('em_dor',         'Date of Reg. (Jigyasu)', m.dateOfRegistration,      'date')}
        ${fld('em_doi1',        'Date of 1st Init.',      m.dateOfFirstInitiation,   'date')}
        ${fld('em_doi2',        'Date of 2nd Init.',      m.dateOfSecondInitiation,  'date')}
        ${fld('em_caste',       'Caste',                  m.caste)}
        ${fld('em_nationality', 'Nationality',            m.nationality)}
        ${fld('em_ashram',      'Ashram',                 m.ashram)}
        ${fld('em_snext',       'SN/EXT',                 m.snExt)}
        ${fld('em_branch',      'Branch ID Card',         m.branchIdCard)}
        ${sel('em_status',      'Record Status',          m.status, ['Activated','Deactivated'])}
      </div>

      <!-- ── CONTACT & ADDRESS ──────────────── -->
      <div id="etab-contact" class="etab-pane" data-display="grid"
           style="display:none;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${fld('em_mobile',      'Mobile 1',      m.mobile)}
        ${fld('em_mobile2',     'Mobile 2',      m.mobile2)}
        ${fld('em_landline',    'Landline',      m.landline)}
        ${fld('em_officePhone', 'Office Phone',  m.officePhone)}
        ${fld('em_email',       'Email 1',       m.email,  'email')}
        ${fld('em_email2',      'Email 2',       m.email2, 'email')}
        ${fld('em_addr1',       'Address Line 1',m.addressLine1)}
        ${fld('em_addr2',       'Address Line 2',m.addressLine2)}
        ${fld('em_addr3',       'Address Line 3',m.addressLine3)}
        ${fld('em_city',        'City',          m.city)}
        ${fld('em_pincode',     'Pincode',       m.pincode)}
        ${fld('em_state',       'State',         m.state)}
        ${fld('em_country',     'Country',       m.country)}
      </div>

      <!-- ── PROFESSIONAL ──────────────────── -->
      <div id="etab-professional" class="etab-pane" data-display="grid"
           style="display:none;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${fld('em_qual',      'Qualification',    m.qualification)}
        ${fld('em_occ',       'Occupation',       m.occupation)}
        ${fld('em_desig',     'Designation',      m.designation)}
        ${fld('em_org',       'Organization',     m.organization)}
        ${fld('em_prof',      'Profession',       m.profession)}
        ${fld('em_profCode',  'Profession Code',  m.professionCode)}
        ${fld('em_gridCode',  'Comm. Grid Code',  m.commGridCode)}
      </div>

      <!-- ── FLAGS & NEE ───────────────────── -->
      <div id="etab-flags" class="etab-pane" data-display="block" style="display:none;">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-sm);">
          ${ynsEl('em_mahila',    'Mahila',          m.mahila)}
          ${ynsEl('em_youth',     'Youth',           m.youth)}
          ${ynsEl('em_assocYouth','Associate Youth',  m.assocYouth)}
          ${ynsEl('em_jrPreInit', 'Jr. Pre-Initiate', m.jrPreInit)}
          ${ynsEl('em_srPreInit', 'Sr. Pre-Initiate', m.srPreInit)}
          ${ynsEl('em_crc',       'CRC',             m.crc)}
          ${ynsEl('em_cca',       'CCA',             m.cca)}
          ${ynsEl('em_santSu',    'Sant-Su',         m.santSu)}
        </div>
        <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:16px 0 8px">Nee (Maiden Name)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
          ${fld('em_neeFirst',  'Nee First Name',   m.neeFirst)}
          ${fld('em_neeMiddle', 'Nee Middle Name',  m.neeMiddle)}
          ${fld('em_neeLast',   'Nee Last Name',    m.neeLast)}
        </div>
      </div>

      <!-- ── FAMILY ────────────────────────── -->
      <div id="etab-family" class="etab-pane" data-display="block" style="display:none;">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-sm);">
          ${secHdr('Father')}
          ${fld('em_fTitle',  'Title',       m.fatherTitle)}
          ${fld('em_fFirst',  'First Name',  m.fatherFirstName)}
          ${fld('em_fMid',    'Middle Name', m.fatherMiddleName)}
          ${fld('em_fLast',   'Last Name',   m.fatherLastName)}
          ${fld('em_fBranch', 'Branch',      m.fatherBranch)}
          ${fld('em_fBsl',    'BSL',         m.fatherBslno)}
          ${fld('em_fUid',    'UID',         m.fatherUid)}
          ${fld('em_fDoi',    'DOI',         m.fatherDoi,  'date')}
          ${fld('em_fPhone',  'Phone',       m.fatherPhone)}
          ${fld('em_fCity',   'City',        m.fatherCity)}
          ${fld('em_fState',  'State',       m.fatherState)}

          ${secHdr('Mother')}
          ${fld('em_mTitle',  'Title',       m.motherTitle)}
          ${fld('em_mFirst',  'First Name',  m.motherFirstName)}
          ${fld('em_mMid',    'Middle Name', m.motherMiddleName)}
          ${fld('em_mLast',   'Last Name',   m.motherLastName)}
          ${fld('em_mBranch', 'Branch',      m.motherBranch)}
          ${fld('em_mBsl',    'BSL',         m.motherBslno)}
          ${fld('em_mUid',    'UID',         m.motherUid)}
          ${fld('em_mDoi',    'DOI',         m.motherDoi,  'date')}
          ${fld('em_mPhone',  'Phone',       m.motherPhone)}
          ${fld('em_mCity',   'City',        m.motherCity)}
          ${fld('em_mState',  'State',       m.motherState)}

          ${secHdr('Spouse')}
          ${fld('em_sTitle',  'Title',       m.spouseTitle)}
          ${fld('em_sFirst',  'First Name',  m.spouseFirstName)}
          ${fld('em_sMid',    'Middle Name', m.spouseMiddleName)}
          ${fld('em_sLast',   'Last Name',   m.spouseLastName)}
          ${fld('em_sBranch', 'Branch',      m.spouseBranch)}
          ${fld('em_sBsl',    'BSL',         m.spouseBslno)}
          ${fld('em_sUid',    'UID',         m.spouseUid)}
          ${fld('em_sDoi',    'DOI',         m.spouseDoi,  'date')}
          ${fld('em_sPhone',  'Phone',       m.spousePhone)}
          ${fld('em_sCity',   'City',        m.spouseCity)}
          ${fld('em_sState',  'State',       m.spouseState)}
        </div>
      </div>

      <!-- ── REFERENCES ─────────────────────── -->
      <div id="etab-references" class="etab-pane" data-display="block" style="display:none;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
          ${secHdr('Reference 1')}
          ${fld('em_r1Name',     'Name',     m.ref1Name)}
          ${fld('em_r1Address',  'Address',  m.ref1Address)}
          ${fld('em_r1Email',    'Email',    m.ref1Email,  'email')}
          ${fld('em_r1Phone',    'Phone',    m.ref1Phone)}
          ${fld('em_r1Branch',   'Branch',   m.ref1Branch)}
          ${fld('em_r1Relation', 'Relation', m.ref1Relation)}

          ${secHdr('Reference 2')}
          ${fld('em_r2Name',     'Name',     m.ref2Name)}
          ${fld('em_r2Address',  'Address',  m.ref2Address)}
          ${fld('em_r2Email',    'Email',    m.ref2Email,  'email')}
          ${fld('em_r2Phone',    'Phone',    m.ref2Phone)}
          ${fld('em_r2Branch',   'Branch',   m.ref2Branch)}
          ${fld('em_r2Relation', 'Relation', m.ref2Relation)}
        </div>
      </div>

      <!-- ── ADMIN / TRANSFER ───────────────── -->
      <div id="etab-admin" class="etab-pane" data-display="grid"
           style="display:none;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${fld('em_dorYouth',     'DOR Youth',              m.dorYouth,            'date')}
        ${fld('em_doiNew',       'DOI (New Initiate)',      m.dateOfInitiationNew, 'date')}
        ${fld('em_transferIn',   'Transfer In Date',        m.dateTransferIn,      'date')}
        ${fld('em_transferFrom', 'Transfer From Branch',    m.transferFromBranch)}
        ${fld('em_transferOut',  'Transfer Out Date',       m.dateTransferOut,     'date')}
        ${fld('em_transferTo',   'Transfer To Branch',      m.transferToBranch)}
        ${fld('em_dateExpire',   'Date of Expire',          m.dateOfExpire,        'date')}
      </div>

    </div>

    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button id="editMemberSaveBtn" class="btn btn-primary" onclick="saveMemberEdit('${ea(uid)}', ${isSelfEdit})">Save Changes</button>
    </div>
  `, true);
}

async function saveMemberEdit(uid, isSelfEdit = false) {
  const name = document.getElementById('em_name')?.value.trim();
  if (!name) { showToast('Name is required!', 'error'); return; }
  const g = id => document.getElementById(id)?.value ?? '';

  const btn = document.getElementById('editMemberSaveBtn');
  setButtonLoading(btn, true, 'Saving…');
  try {
    await apiPut('/api/members/' + uid + (isSelfEdit ? '/self' : ''), {
      name,
      bslno:                  g('em_bslno'),
      dateOfInitiation:       g('em_doi')          || null,
      dateOfBirth:            g('em_dob')          || null,
      dateOfRegistration:     g('em_dor')          || null,
      dateOfFirstInitiation:  g('em_doi1')         || null,
      dateOfSecondInitiation: g('em_doi2')         || null,
      bloodGroup:             g('em_blood'),
      caste:                  g('em_caste'),
      nationality:            g('em_nationality'),
      ashram:                 g('em_ashram'),
      snExt:                  g('em_snext'),
      branchIdCard:           g('em_branch'),
      status:                 g('em_status'),
      mobile:                 g('em_mobile'),
      mobile2:                g('em_mobile2'),
      landline:               g('em_landline'),
      officePhone:            g('em_officePhone'),
      email:                  g('em_email'),
      email2:                 g('em_email2'),
      addressLine1:           g('em_addr1'),
      addressLine2:           g('em_addr2'),
      addressLine3:           g('em_addr3'),
      city:                   g('em_city'),
      pincode:                g('em_pincode'),
      state:                  g('em_state'),
      country:                g('em_country'),
      qualification:          g('em_qual'),
      occupation:             g('em_occ'),
      designation:            g('em_desig'),
      organization:           g('em_org'),
      profession:             g('em_prof'),
      professionCode:         g('em_profCode'),
      commGridCode:           g('em_gridCode'),
      mahila:                 g('em_mahila'),
      youth:                  g('em_youth'),
      assocYouth:             g('em_assocYouth'),
      jrPreInit:              g('em_jrPreInit'),
      srPreInit:              g('em_srPreInit'),
      crc:                    g('em_crc'),
      cca:                    g('em_cca'),
      santSu:                 g('em_santSu'),
      neeFirst:               g('em_neeFirst'),
      neeMiddle:              g('em_neeMiddle'),
      neeLast:                g('em_neeLast'),
      fatherTitle:            g('em_fTitle'),
      fatherFirstName:        g('em_fFirst'),
      fatherMiddleName:       g('em_fMid'),
      fatherLastName:         g('em_fLast'),
      fatherBranch:           g('em_fBranch'),
      fatherBslno:            g('em_fBsl'),
      fatherUid:              g('em_fUid'),
      fatherDoi:              g('em_fDoi')          || null,
      fatherPhone:            g('em_fPhone'),
      fatherCity:             g('em_fCity'),
      fatherState:            g('em_fState'),
      motherTitle:            g('em_mTitle'),
      motherFirstName:        g('em_mFirst'),
      motherMiddleName:       g('em_mMid'),
      motherLastName:         g('em_mLast'),
      motherBranch:           g('em_mBranch'),
      motherBslno:            g('em_mBsl'),
      motherUid:              g('em_mUid'),
      motherDoi:              g('em_mDoi')          || null,
      motherPhone:            g('em_mPhone'),
      motherCity:             g('em_mCity'),
      motherState:            g('em_mState'),
      spouseTitle:            g('em_sTitle'),
      spouseFirstName:        g('em_sFirst'),
      spouseMiddleName:       g('em_sMid'),
      spouseLastName:         g('em_sLast'),
      spouseBranch:           g('em_sBranch'),
      spouseBslno:            g('em_sBsl'),
      spouseUid:              g('em_sUid'),
      spouseDoi:              g('em_sDoi')          || null,
      spousePhone:            g('em_sPhone'),
      spouseCity:             g('em_sCity'),
      spouseState:            g('em_sState'),
      ref1Name:               g('em_r1Name'),
      ref1Address:            g('em_r1Address'),
      ref1Email:              g('em_r1Email'),
      ref1Phone:              g('em_r1Phone'),
      ref1Branch:             g('em_r1Branch'),
      ref1Relation:           g('em_r1Relation'),
      ref2Name:               g('em_r2Name'),
      ref2Address:            g('em_r2Address'),
      ref2Email:              g('em_r2Email'),
      ref2Phone:              g('em_r2Phone'),
      ref2Branch:             g('em_r2Branch'),
      ref2Relation:           g('em_r2Relation'),
      dorYouth:               g('em_dorYouth')      || null,
      dateOfInitiationNew:    g('em_doiNew')        || null,
      dateTransferIn:         g('em_transferIn')    || null,
      transferFromBranch:     g('em_transferFrom'),
      dateTransferOut:        g('em_transferOut')   || null,
      transferToBranch:       g('em_transferTo'),
      dateOfExpire:           g('em_dateExpire')    || null,
    });
    await reloadMembers();
    closeForcedModal();
    filterMembers();
    renderCache.delete('members');
    showToast('Member updated successfully!', 'success');
  } catch(e) {
    setButtonLoading(btn, false);
    showToast('Failed: ' + e.message, 'error');
  }
}

async function toggleMemberActive(uid) {
  const m = MEMBERS.find(x => x.uid === uid);
  if (!m) return;
  const newStatus = m.status === 'Deactivated' ? 'Activated' : 'Deactivated';
  const action    = newStatus === 'Deactivated' ? 'Deactivate' : 'Reactivate';
  openModal(`
    <div class="modal-header">
      <h3>${newStatus === 'Inactive' ? '⬜' : '✅'} ${action} Member</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <p>${action} <strong>${m.name}</strong> (${m.uid})?<br/>
    <span style="color:var(--txt-muted);font-size:0.85rem;">The record will be kept in the database — only marked ${newStatus.toLowerCase()}.</span></p>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button id="confirmToggleBtn" class="btn ${newStatus === 'Deactivated' ? 'btn-danger' : 'btn-saffron'}" onclick="confirmToggleMember('${uid}', '${newStatus}')">${action}</button>
    </div>
  `);
}

async function confirmToggleMember(uid, newStatus) {
  const m = MEMBERS.find(x => x.uid === uid);
  if (!m) return;
  const btn = document.getElementById('confirmToggleBtn');
  setButtonLoading(btn, true, newStatus === 'Deactivated' ? 'Deactivating…' : 'Reactivating…');
  try {
    await apiPut('/api/members/' + uid, { status: newStatus });
    await reloadMembers();
    await reloadDashStats();
    renderCache.delete('dashboard');
    closeForcedModal();
    filterMembers();
    showToast(newStatus === 'Deactivated' ? 'Member deactivated.' : 'Member reactivated!', newStatus === 'Deactivated' ? '' : 'success');
  } catch(e) {
    setButtonLoading(btn, false);
    showToast('Failed: ' + e.message, 'error');
  }
}

function openAddMemberModal() {
  openModal(`
    <div class="modal-header">
      <h3>➕ Add New Member</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md);">
      <div class="form-field"><label>UID *</label><input id="am_uid" placeholder="e.g. RSSB-001234" /></div>
      <div class="form-field"><label>BSL No.</label><input id="am_bslno" placeholder="BSL number" /></div>
      <div class="form-field"><label>Full Name *</label><input id="am_name" placeholder="Full Name" /></div>
      <div class="form-field"><label>Mobile *</label><input id="am_mobile" placeholder="10-digit number" /></div>
      <div class="form-field"><label>Email</label><input id="am_email" type="email" placeholder="email@domain.com" /></div>
      <div class="form-field"><label>City</label><input id="am_city" placeholder="City" /></div>
      <div class="form-field"><label>State</label><input id="am_state" placeholder="State" /></div>
      <div class="form-field">
        <label>Record Status</label>
        <select id="am_status">
          <option value="Activated">Activated</option>
          <option value="Deactivated">Deactivated</option>
        </select>
      </div>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button id="addMemberSaveBtn" class="btn btn-saffron" onclick="saveNewMember()">Add Member</button>
    </div>
  `);
}

async function saveNewMember() {
  const uid    = document.getElementById('am_uid').value.trim();
  const name   = document.getElementById('am_name').value.trim();
  const mobile = document.getElementById('am_mobile').value.trim();
  if (!uid)    { showToast('UID is required!',    'error'); return; }
  if (!name)   { showToast('Name is required!',   'error'); return; }
  if (!mobile) { showToast('Mobile is required!', 'error'); return; }

  const btn = document.getElementById('addMemberSaveBtn');
  setButtonLoading(btn, true, 'Adding…');
  try {
    const u = getCurrentUser();
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User': u ? `${u.username}(${u.role})` : 'anonymous' },
      body: JSON.stringify({
        uid,
        bslno:  document.getElementById('am_bslno').value.trim(),
        name,
        mobile,
        email:  document.getElementById('am_email').value.trim(),
        city:   document.getElementById('am_city').value.trim(),
        state:  document.getElementById('am_state').value.trim(),
        status: document.getElementById('am_status').value,
      })
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      setButtonLoading(btn, false);
      showToast(data.error || 'Failed to add member.', 'error');
      return;
    }
    await reloadMembers();
    closeForcedModal();
    filterMembers();
    renderCache.delete('dashboard');
    showToast('New member added!', 'success');
  } catch(e) {
    setButtonLoading(btn, false);
    showToast('Failed: ' + e.message, 'error');
  }
}

function exportMembers() {
  // Wrap a value in quotes, escaping any internal quotes
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const COLS = [
    ['SL',                        m => m.sl],
    ['UID',                       m => m.uid],
    ['BSL',                       m => m.bslno],
    ['Name',                      m => m.name],
    ['Date of Initiation',        m => m.dateOfInitiation],
    ['Date of Birth',             m => m.dateOfBirth],
    ['Date of Reg. (Jigyasu)',    m => m.dateOfRegistration],
    ['Date of 1st Init.',         m => m.dateOfFirstInitiation],
    ['Date of 2nd Init.',         m => m.dateOfSecondInitiation],
    ['SN/EXT',                    m => m.snExt],
    ['Ashram',                    m => m.ashram],
    ['Branch ID Card',            m => m.branchIdCard],
    ['City',                      m => m.city],
    ['State',                     m => m.state],
    ['Pincode',                   m => m.pincode],
    ['Country',                   m => m.country],
    ['Mobile-1',                  m => m.mobile],
    ['Mobile-2',                  m => m.mobile2],
    ['Landline',                  m => m.landline],
    ['Office Phone',              m => m.officePhone],
    ['Email-1',                   m => m.email],
    ['Email-2',                   m => m.email2],
    ['Blood Group',               m => m.bloodGroup],
    ['Caste',                     m => m.caste],
    ['Nationality',               m => m.nationality],
    ['Qualification',             m => m.qualification],
    ['Occupation',                m => m.occupation],
    ['Designation',               m => m.designation],
    ['Organization',              m => m.organization],
    ['Profession',                m => m.profession],
    ['Profession Code',           m => m.professionCode],
    ['Comm. Grid Code',           m => m.commGridCode],
    ['Address Line 1',            m => m.addressLine1],
    ['Address Line 2',            m => m.addressLine2],
    ['Address Line 3',            m => m.addressLine3],
    ['Mahila',                    m => m.mahila],
    ['Youth',                     m => m.youth],
    ['Associate Youth',           m => m.assocYouth],
    ['Jr Pre-Initiate',           m => m.jrPreInit],
    ['Sr Pre-Initiate',           m => m.srPreInit],
    ['CRC',                       m => m.crc],
    ['CCA',                       m => m.cca],
    ['Sant-Su',                   m => m.santSu],
    ['Nee First Name',            m => m.neeFirst],
    ['Nee Middle Name',           m => m.neeMiddle],
    ['Nee Last Name',             m => m.neeLast],
    ['Father Title',              m => m.fatherTitle],
    ['Father First Name',         m => m.fatherFirstName],
    ['Father Middle Name',        m => m.fatherMiddleName],
    ['Father Last Name',          m => m.fatherLastName],
    ['Father Branch',             m => m.fatherBranch],
    ['Father BSL',                m => m.fatherBslno],
    ['Father UID',                m => m.fatherUid],
    ['Father DOI',                m => m.fatherDoi],
    ['Father Phone',              m => m.fatherPhone],
    ['Father City',               m => m.fatherCity],
    ['Father State',              m => m.fatherState],
    ['Mother Title',              m => m.motherTitle],
    ['Mother First Name',         m => m.motherFirstName],
    ['Mother Middle Name',        m => m.motherMiddleName],
    ['Mother Last Name',          m => m.motherLastName],
    ['Mother Branch',             m => m.motherBranch],
    ['Mother BSL',                m => m.motherBslno],
    ['Mother UID',                m => m.motherUid],
    ['Mother DOI',                m => m.motherDoi],
    ['Mother Phone',              m => m.motherPhone],
    ['Mother City',               m => m.motherCity],
    ['Mother State',              m => m.motherState],
    ['Spouse Title',              m => m.spouseTitle],
    ['Spouse First Name',         m => m.spouseFirstName],
    ['Spouse Middle Name',        m => m.spouseMiddleName],
    ['Spouse Last Name',          m => m.spouseLastName],
    ['Spouse Branch',             m => m.spouseBranch],
    ['Spouse BSL',                m => m.spouseBslno],
    ['Spouse UID',                m => m.spouseUid],
    ['Spouse DOI',                m => m.spouseDoi],
    ['Spouse Phone',              m => m.spousePhone],
    ['Spouse City',               m => m.spouseCity],
    ['Spouse State',              m => m.spouseState],
    ['Ref-1 Name',                m => m.ref1Name],
    ['Ref-1 Address',             m => m.ref1Address],
    ['Ref-1 Email',               m => m.ref1Email],
    ['Ref-1 Phone',               m => m.ref1Phone],
    ['Ref-1 Branch',              m => m.ref1Branch],
    ['Ref-1 Relation',            m => m.ref1Relation],
    ['Ref-2 Name',                m => m.ref2Name],
    ['Ref-2 Address',             m => m.ref2Address],
    ['Ref-2 Email',               m => m.ref2Email],
    ['Ref-2 Phone',               m => m.ref2Phone],
    ['Ref-2 Branch',              m => m.ref2Branch],
    ['Ref-2 Relation',            m => m.ref2Relation],
    ['DOR Youth',                 m => m.dorYouth],
    ['DOI (New Initiate)',        m => m.dateOfInitiationNew],
    ['Date Transfer In',          m => m.dateTransferIn],
    ['Transfer From Branch',      m => m.transferFromBranch],
    ['Date Transfer Out',         m => m.dateTransferOut],
    ['Transfer To Branch',        m => m.transferToBranch],
    ['Date of Expire',            m => m.dateOfExpire],
    ['Record Status',             m => m.status],
  ];

  const header = COLS.map(([h]) => esc(h)).join(',');
  const rows   = membersData.map(m => COLS.map(([, fn]) => esc(fn(m))).join(','));
  const csv    = [header, ...rows].join('\n');

  const blob = new Blob(['\uFEFF' + csv, { type: 'text/csv;charset=utf-8;' }]);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'members.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${membersData.length} members as CSV!`, 'success');
}

// ── Upload Members Excel/CSV ────────────────
function handleMembersUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const status = document.getElementById('membersUploadStatus');
  const wrap   = document.getElementById('membersProgressWrap');
  const bar    = document.getElementById('membersProgressBar');
  const pct    = document.getElementById('membersProgressPct');
  const lbl    = document.getElementById('membersProgressLabel');

  // Reset UI
  if (status) status.textContent = '';
  if (wrap)   { wrap.style.display = 'block'; }
  if (bar)    { bar.style.width = '0%'; bar.style.background = 'var(--clr-saffron)'; }
  if (pct)    pct.textContent = '0%';
  if (lbl)    lbl.textContent = 'Uploading ' + file.name + '…';

  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();

  // Upload progress (browser → server)
  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const p = Math.round(e.loaded / e.total * 100);
      if (bar) bar.style.width = p + '%';
      if (pct) pct.textContent = p + '%';
      if (lbl) lbl.textContent = p < 100 ? 'Uploading…' : 'Processing on server…';
    }
  };

  xhr.onload = async () => {
    if (bar) { bar.style.width = '100%'; }
    if (pct) pct.textContent = '100%';
    try {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status < 200 || xhr.status >= 300 || !data.ok) {
        const err = data.error || 'Upload failed';
        if (lbl)    lbl.textContent = 'Error';
        if (bar)    bar.style.background = 'var(--clr-red)';
        if (status) status.innerHTML = '<span style="color:var(--clr-red)">' + err + '</span>';
        showToast('Upload failed: ' + err, 'error');
        return;
      }
      if (lbl) lbl.textContent = 'Done!';
      if (bar) bar.style.background = 'var(--clr-green)';
      
      const sheetsInfo = data.sheets_processed ? ` (from: ${data.sheets_processed.join(', ')})` : '';
      const msg = data.inserted > 0 
        ? `✅ ${data.inserted} new, ${data.updated} updated${sheetsInfo}`
        : `✅ ${data.updated} members updated${sheetsInfo}`;
      showToast(`Processed ${data.count.toLocaleString()} records!`, 'success');
      if (status) status.innerHTML = `<span style="color:var(--clr-green)">${msg}</span>`;

      // Reload members data
      await reloadMembers();
      await reloadDashStats();
      renderCache.delete('dashboard');
      filterMembers();
    } catch (e) {
      if (status) status.innerHTML = '<span style="color:var(--clr-red)">Invalid server response.</span>';
    }
  };

  xhr.onerror = () => {
    if (bar)    bar.style.background = 'var(--clr-red)';
    if (status) status.innerHTML = '<span style="color:var(--clr-red)">Network error.</span>';
    showToast('Upload failed: network error', 'error');
  };

  xhr.open('POST', '/api/members/upload');
  const u = getCurrentUser();
  if (u) xhr.setRequestHeader('X-User', `${u.username}(${u.role})`);
  xhr.send(formData);
}

// ── Upload Superhumane Excel/CSV ────────────────
function handleSuperhumaneUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const status = document.getElementById('shUploadStatus');
  const wrap   = document.getElementById('shProgressWrap');
  const bar    = document.getElementById('shProgressBar');
  const pct    = document.getElementById('shProgressPct');
  const lbl    = document.getElementById('shProgressLabel');

  // Reset UI
  if (status) status.textContent = '';
  if (wrap)   { wrap.style.display = 'block'; }
  if (bar)    { bar.style.width = '0%'; bar.style.background = 'var(--clr-saffron)'; }
  if (pct)    pct.textContent = '0%';
  if (lbl)    lbl.textContent = 'Uploading ' + file.name + '…';

  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();

  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const p = Math.round(e.loaded / e.total * 100);
      if (bar) bar.style.width = p + '%';
      if (pct) pct.textContent = p + '%';
      if (lbl) lbl.textContent = p < 100 ? 'Uploading…' : 'Processing on server…';
    }
  };

  xhr.onload = async () => {
    if (bar) { bar.style.width = '100%'; }
    if (pct) pct.textContent = '100%';
    try {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status < 200 || xhr.status >= 300 || !data.ok) {
        const err = data.error || 'Upload failed';
        if (lbl)    lbl.textContent = 'Error';
        if (bar)    bar.style.background = 'var(--clr-red)';
        if (status) status.innerHTML = '<span style="color:var(--clr-red)">' + err + '</span>';
        showToast('Upload failed: ' + err, 'error');
        return;
      }
      if (lbl) lbl.textContent = 'Done!';
      if (bar) bar.style.background = 'var(--clr-green)';
      
      const msg = data.inserted > 0 
        ? `✅ ${data.inserted} new, ${data.updated} updated`
        : `✅ ${data.updated} children updated`;
      showToast(`Processed ${data.count.toLocaleString()} Superhumane records!`, 'success');
      if (status) status.innerHTML = `<span style="color:var(--clr-green)">${msg}</span>`;

      // Reload Superhumane data
      await reloadSuperhumane();
    } catch (e) {
      if (status) status.innerHTML = '<span style="color:var(--clr-red)">Invalid server response.</span>';
    }
  };

  xhr.onerror = () => {
    if (bar)    bar.style.background = 'var(--clr-red)';
    if (status) status.innerHTML = '<span style="color:var(--clr-red)">Network error.</span>';
    showToast('Upload failed: network error', 'error');
  };

  xhr.open('POST', '/api/superhumane/upload');
  const u = getCurrentUser();
  if (u) xhr.setRequestHeader('X-User', `${u.username}(${u.role})`);
  xhr.send(formData);
}

function modalField(label, value) {
  return `
    <div>
      <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--txt-muted);margin-bottom:3px">${label}</div>
      <div style="font-size:0.9rem;color:var(--txt-primary)">${value || '—'}</div>
    </div>
  `;
}
