/* ============================================================
   MEMBERS-SECTION.JS — Members List, Filters, Distribution
   ============================================================ */

'use strict';

let membersData    = [...MEMBERS];
let membersPage    = 1;
const MEMBERS_PER_PAGE = 10;

function renderMembers() {
  const container = document.getElementById('membersContent');
  if (!isAdmin()) {
    const u = getCurrentUser();
    const m = MEMBERS.find(x => x.uid === u?.memberUid);
    if (m) {
      viewMember(m.uid);
    } else {
      container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--txt-muted);font-size:1rem;">No member record is linked to your account.</div>';
    }
    return;
  }
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
              <th style="min-width:110px;position:sticky;left:0;z-index:2;background:#f8faff">Actions</th>
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

function filterMembers() {
  const name     = (document.getElementById('filterName')?.value     || '').toLowerCase();
  const mobile   = (document.getElementById('filterMobile')?.value   || '');
  const zone     = (document.getElementById('filterZone')?.value     || '');
  const approval = (document.getElementById('filterApproval')?.value || '');
  const type     = (document.getElementById('filterType')?.value     || '');

  membersData = MEMBERS.filter(m => {
    if (name   && !(m.name   || '').toLowerCase().includes(name))   return false;
    if (mobile && !(m.mobile || '').includes(mobile))                return false;
    if (zone   && m.zone !== zone)                                   return false;
    if (approval && m.approvalStatus !== approval)                   return false;
    if (type   && m.type !== type)                                   return false;
    return true;
  }).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  membersData.forEach((m, i) => { m.sl = i + 1; });

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
  const deactivateBtn = isExpired
    ? `<button class="tbl-btn tbl-btn-view" onclick="toggleMemberActive('${m.uid}')">Reactivate</button>`
    : `<button class="tbl-btn tbl-btn-delete" onclick="toggleMemberActive('${m.uid}')">Deactivate</button>`;
  const v = (val) => val || '';

  const d = (val) => `<td style="font-size:0.82rem;white-space:nowrap">${formatDate(val)}</td>`;
  const yc = (val) => `<td style="text-align:center">${yesNo(val)}</td>`;

  return `
    <tr${rowStyle}>
      <td style="position:sticky;left:0;z-index:1;background:var(--bg-card);white-space:nowrap">
        <div class="td-actions">
          <button class="tbl-btn tbl-btn-view" onclick="viewMember('${m.uid}')">View</button>
          ${canWrite() ? `<button class="tbl-btn tbl-btn-edit" onclick="editMember('${m.uid}')">Edit</button>` : ''}
          ${canWrite() ? deactivateBtn : ''}
        </div>
      </td>
      <td>${v(m.sl)}</td>
      <td><code style="font-size:0.78rem;color:var(--clr-navy-mid)">${v(m.uid)}</code></td>
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
        ${mf('Name', m.name)} ${mf('Date of Initiation', formatDate(m.dateOfInitiation))} ${mf('Date of Birth', formatDate(m.dateOfBirth))}
        ${mf('Blood Group', m.bloodGroup)} ${mf('Caste', m.caste)} ${mf('Nationality', m.nationality)}
        ${mf('Ashram', m.ashram)} ${mf('SN/EXT', m.snExt)} ${mf('Record Status', m.status)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Contact</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Mobile-1', m.mobile)} ${mf('Mobile-2', m.mobile2)} ${mf('Email-1', m.email)}
        ${mf('Email-2', m.email2)} ${mf('Landline', m.landline)} ${mf('Office Phone', m.officePhone)}
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
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Family</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${mf('Father Name', m.fatherName)} ${mf('Father UID', m.fatherUid)}
        ${mf('Mother Name', m.motherName)} ${mf('Mother UID', m.motherUid)}
        ${mf('Spouse Name', m.spouseName)} ${mf('Spouse UID', m.spouseUid)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Transfer / History</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-sm);">
        ${mf('Transfer In', formatDate(m.dateTransferIn))} ${mf('From Branch', m.transferFromBranch)}
        ${mf('Transfer Out', formatDate(m.dateTransferOut))} ${mf('To Branch', m.transferToBranch)}
        ${mf('Date of Expire', formatDate(m.dateOfExpire))} ${mf('DOR Youth', formatDate(m.dorYouth))}
        ${mf('DOI (New Initiate)', formatDate(m.dateOfInitiationNew))}
      </div>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      ${!isAdmin() ? `<button class="btn btn-outline" onclick="editSelfMember('${m.uid}')">✏️ Edit My Profile</button>` : ''}
      <button class="btn btn-primary" onclick="closeForcedModal()">Close</button>
    </div>
  `);
}

// ── Member self-edit (contact + address + professional only) ──
function editSelfMember(uid) {
  const m = MEMBERS.find(x => x.uid === uid);
  if (!m) return;
  const ea = v => String(v ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  const fld = (id, label, val, type='text') =>
    `<div class="form-field"><label>${label}</label><input id="${id}" type="${type}" value="${ea(val)}" /></div>`;

  openModal(`
    <div class="modal-header">
      <h3>✏️ Edit My Profile — ${ea(m.name)}</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div style="overflow-y:auto;max-height:60vh;padding-right:4px;">
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:8px 0 6px">Contact</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${fld('sm_mobile',      'Mobile 1',     m.mobile)}
        ${fld('sm_mobile2',     'Mobile 2',     m.mobile2)}
        ${fld('sm_landline',    'Landline',     m.landline)}
        ${fld('sm_officePhone', 'Office Phone', m.officePhone)}
        ${fld('sm_email',       'Email 1',      m.email,  'email')}
        ${fld('sm_email2',      'Email 2',      m.email2, 'email')}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Address</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${fld('sm_addr1',   'Address Line 1', m.addressLine1)}
        ${fld('sm_addr2',   'Address Line 2', m.addressLine2)}
        ${fld('sm_addr3',   'Address Line 3', m.addressLine3)}
        ${fld('sm_city',    'City',           m.city)}
        ${fld('sm_pincode', 'Pincode',        m.pincode)}
        ${fld('sm_state',   'State',          m.state)}
        ${fld('sm_country', 'Country',        m.country)}
      </div>
      <div style="font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--txt-muted);margin:14px 0 6px">Professional</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-sm);">
        ${fld('sm_qual',   'Qualification', m.qualification)}
        ${fld('sm_occ',    'Occupation',    m.occupation)}
        ${fld('sm_desig',  'Designation',   m.designation)}
        ${fld('sm_org',    'Organization',  m.organization)}
        ${fld('sm_prof',   'Profession',    m.profession)}
      </div>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="viewMember('${ea(uid)}')">← Back</button>
      <button class="btn btn-saffron" onclick="saveSelfMember('${ea(uid)}')">Save Changes</button>
    </div>
  `);
}

async function saveSelfMember(uid) {
  const g = id => (document.getElementById(id)?.value || '').trim();
  try {
    await apiPut('/api/members/' + uid + '/self', {
      mobile:        g('sm_mobile'),
      mobile2:       g('sm_mobile2'),
      landline:      g('sm_landline'),
      officePhone:   g('sm_officePhone'),
      email:         g('sm_email'),
      email2:        g('sm_email2'),
      addressLine1:  g('sm_addr1'),
      addressLine2:  g('sm_addr2'),
      addressLine3:  g('sm_addr3'),
      city:          g('sm_city'),
      pincode:       g('sm_pincode'),
      state:         g('sm_state'),
      country:       g('sm_country'),
      qualification: g('sm_qual'),
      occupation:    g('sm_occ'),
      designation:   g('sm_desig'),
      organization:  g('sm_org'),
      profession:    g('sm_prof'),
    });
    await reloadMembers();
    closeForcedModal();
    showToast('Profile updated successfully!', 'success');
    // Re-open view modal with fresh data
    const m = MEMBERS.find(x => x.uid === uid);
    if (m) viewMember(m.uid);
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
}

function switchEditTab(name, btn) {
  document.querySelectorAll('.etab-pane').forEach(p => { p.style.display = 'none'; });
  document.querySelectorAll('.edit-tab').forEach(b => b.classList.remove('active'));
  const pane = document.getElementById('etab-' + name);
  if (pane) pane.style.display = pane.dataset.display || 'grid';
  if (btn) btn.classList.add('active');
}

function editMember(uid) {
  const m = MEMBERS.find(x => x.uid === uid);
  if (!m) return;

  // Escape for HTML attribute values
  const ea = v => String(v ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  // Date fields: strip time component if present
  const dt = v => v ? String(v).split('T')[0] : '';

  const fld = (id, label, val, type='text') =>
    `<div class="form-field"><label>${label}</label><input id="${id}" type="${type}" value="${ea(type==='date' ? dt(val) : val)}" /></div>`;

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
      <button class="btn btn-primary" onclick="saveMemberEdit('${ea(uid)}')">Save All Changes</button>
    </div>
  `, true);
}

async function saveMemberEdit(uid) {
  const name = document.getElementById('em_name')?.value.trim();
  if (!name) { showToast('Name is required!', 'error'); return; }
  const g = id => document.getElementById(id)?.value ?? '';

  try {
    await apiPut('/api/members/' + uid, {
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
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
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
      <button class="btn ${newStatus === 'Deactivated' ? 'btn-danger' : 'btn-saffron'}" onclick="confirmToggleMember('${uid}', '${newStatus}')">${action}</button>
    </div>
  `);
}

async function confirmToggleMember(uid, newStatus) {
  const m = MEMBERS.find(x => x.uid === uid);
  if (!m) return;
  try {
    await apiPut('/api/members/' + uid, { status: newStatus });
    await reloadMembers();
    await reloadDashStats();
    renderCache.delete('dashboard');
    closeForcedModal();
    filterMembers();
    showToast(newStatus === 'Deactivated' ? 'Member deactivated.' : 'Member reactivated!', newStatus === 'Deactivated' ? '' : 'success');
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
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
      <button class="btn btn-saffron" onclick="saveNewMember()">Add Member</button>
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
      showToast(data.error || 'Failed to add member.', 'error');
      return;
    }
    await reloadMembers();
    closeForcedModal();
    filterMembers();
    renderCache.delete('dashboard');
    showToast('New member added!', 'success');
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
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

function modalField(label, value) {
  return `
    <div>
      <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--txt-muted);margin-bottom:3px">${label}</div>
      <div style="font-size:0.9rem;color:var(--txt-primary)">${value || '—'}</div>
    </div>
  `;
}