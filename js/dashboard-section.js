/* ============================================================
   DASHBOARD-SECTION.JS — Dashboard Stats & Overview
   ============================================================ */

'use strict';

function renderDashboard() {
  const container = document.getElementById('dashboardContent');
  const s = DASH_STATS;

  if (!isAdmin()) {
    // ── MEMBER DASHBOARD: Announcements + Events only ──
    const activeAnnouncements = ANNOUNCEMENTS.filter(a => a.active);
    const upcomingEvents = EVENTS.filter(e => e.status === 'Upcoming');

    container.innerHTML = `
      <!-- Announcements -->
      <div class="sub-heading">Announcements</div>
      ${activeAnnouncements.length ? `
      <div class="info-grid">
        ${activeAnnouncements.map(a => `
          <div class="info-card" style="cursor:pointer" data-goto="announcements">
            <div class="info-label" style="display:flex;justify-content:space-between;align-items:center;">
              <span>${a.title}</span>
              <span class="badge badge-${a.priority === 'high' ? 'red' : a.priority === 'medium' ? 'gold' : 'green'}">${a.priority}</span>
            </div>
            <div class="info-value" style="font-size:.85rem;color:var(--txt-muted);margin-top:4px;">${a.content.length > 120 ? a.content.substring(0, 120) + '…' : a.content}</div>
            <div class="info-link" style="margin-top:6px;font-size:.78rem;color:var(--txt-muted);">By ${a.author} · ${a.date}</div>
          </div>
        `).join('')}
      </div>` : '<p class="text-muted" style="padding:var(--sp-md);">No active announcements.</p>'}

      <!-- Upcoming Events -->
      <div class="sub-heading">Upcoming Events</div>
      ${upcomingEvents.length ? `
      <div class="info-grid">
        ${upcomingEvents.map(e => `
          <div class="info-card" style="cursor:pointer" data-goto="events">
            <div class="info-label">${e.title}</div>
            <div class="info-value" style="font-size:.85rem;margin-top:4px;"><strong>${e.date}</strong> at ${e.time}</div>
            <div class="info-link" style="margin-top:6px;font-size:.78rem;color:var(--txt-muted);">${e.venue} · ${e.type}</div>
          </div>
        `).join('')}
      </div>` : '<p class="text-muted" style="padding:var(--sp-md);">No upcoming events.</p>'}
    `;

    container.querySelectorAll('[data-goto]').forEach(el => {
      el.addEventListener('click', () => navigateTo(el.dataset.goto));
    });
    return;
  }

  // ── ADMIN DASHBOARD: full overview ──
  container.innerHTML = `
    <!-- Member stats -->
    <div class="sub-heading">Member Overview</div>
    <div class="stats-grid">
      ${statCard(s.totalMembers,     'Total Members',      'More info',    'accent-saffron', 'members')}
      ${statCard(s.activeMembers,    'Active Members',     'More info',    'accent-green',   'members')}
      <div class="stat-card accent-gold" onclick="navigateTo('members'); setTimeout(() => switchMembersTab('superhumane'), 100);" style="cursor:pointer">
        <div class="stat-label">Sant-Su Children</div>
        <div class="stat-value">${(s.superhumaneCount || 0).toLocaleString()}</div>
        <div class="stat-link">View all →</div>
      </div>
      <div class="stat-card accent-purple" onclick="navigateTo('registration'); setTimeout(() => switchRegTab('pending'), 100);" style="cursor:pointer">
        <div class="stat-label">Pending Approvals</div>
        <div class="stat-value">${(s.pendingApprovals || 0).toLocaleString()}</div>
        <div class="stat-link">Review →</div>
      </div>
      ${statCard(s.expired,          'Expired',            'More info',    'accent-red',     'members')}
      ${statCard(s.activeRegLinks,   'Active Reg. Links',  'More info',    'accent-navy',    'registration')}
    </div>

    <!-- Attendance stats (admin only) -->
    ${isAdmin() ? `
    <div class="sub-heading">Attendance / Haazri Overview</div>
    <div class="stats-grid" id="dashAttendanceStats">
      <div class="stat-card accent-saffron" data-goto="attendance">
        <div class="stat-label">eSatsang Records</div>
        <div class="stat-value">—</div>
        <div class="stat-link">Loading…</div>
      </div>
      <div class="stat-card accent-green" data-goto="attendance">
        <div class="stat-label">Audio</div>
        <div class="stat-value">—</div>
        <div class="stat-link">Loading…</div>
      </div>
      <div class="stat-card accent-blue" data-goto="attendance">
        <div class="stat-label">Video</div>
        <div class="stat-value">—</div>
        <div class="stat-link">Loading…</div>
      </div>
      <div class="stat-card accent-purple" data-goto="attendance">
        <div class="stat-label">Branch Members</div>
        <div class="stat-value">—</div>
        <div class="stat-link">Loading…</div>
      </div>
    </div>
    ` : ''}

    <!-- Member Quick Search -->
    <div class="sub-heading">Member Quick Search</div>
    <div class="card" style="padding:var(--sp-lg);margin-bottom:var(--sp-xl)">
      <div style="display:flex;gap:var(--sp-md);flex-wrap:wrap;align-items:flex-end;">
        <div class="filter-group" style="flex:2;min-width:200px;">
          <label>Search</label>
          <input type="text" id="dashMemberQuery" placeholder="Type name, UID, mobile, city, branch…"
            oninput="dashMemberSearch()" style="width:100%" />
        </div>
        <div class="filter-group" style="flex:1;min-width:140px;">
          <label>Field</label>
          <select id="dashMemberField" onchange="dashMemberSearch()">
            <option value="any">Any field</option>
            <option value="name">Name</option>
            <option value="uid">UID</option>
            <option value="mobile">Mobile</option>
            <option value="city">City / State</option>
            <option value="branch">Branch</option>
            <option value="status">Status</option>
            <option value="type">Member Type</option>
          </select>
        </div>
        <div class="filter-group" style="flex:0 0 auto;">
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('dashMemberQuery').value='';dashMemberSearch()">✕ Clear</button>
        </div>
      </div>
      <div id="dashMemberResults" style="margin-top:var(--sp-md)"></div>
    </div>
  `;

  // Wire click navigation
  container.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.goto));
  });

  // Load attendance stats from API (admin only)
  if (isAdmin()) loadDashAttendanceStats();
}

async function loadDashAttendanceStats() {
  const el = document.getElementById('dashAttendanceStats');
  if (!el) return;
  try {
    const data = await apiGet('/api/dashboard/attendance-stats');
    const totalRecords = data.esatsangCount || 0;
    const audioCount = data.audioCount || 0;
    const videoCount = data.videoCount || 0;
    const branchTotal = data.branchTotal || 0;
    const branchAttended = data.branchAttended || 0;
    const dateLabel = data.latestDate || '—';

    el.innerHTML = `
      ${statCard(totalRecords, 'eSatsang Records', dateLabel, 'accent-saffron', 'attendance')}
      ${statCard(audioCount, 'Audio Attendance', totalRecords ? Math.round(audioCount/totalRecords*100) + '%' : '0%', 'accent-green', 'attendance')}
      ${statCard(videoCount, 'Video Attendance', totalRecords ? Math.round(videoCount/totalRecords*100) + '%' : '0%', 'accent-blue', 'attendance')}
      ${statCard(branchTotal, 'Branch Members', branchAttended + ' attended (' + (branchTotal ? Math.round(branchAttended/branchTotal*100) : 0) + '%)', 'accent-purple', 'attendance')}
    `;
    el.querySelectorAll('[data-goto]').forEach(c => {
      c.addEventListener('click', () => navigateTo(c.dataset.goto));
    });
  } catch {
    el.innerHTML = '<p class="text-muted" style="padding:var(--sp-md)">Could not load attendance stats.</p>';
  }
}

function statCard(value, label, linkText, accent, goto) {
  return `
    <div class="stat-card ${accent}" data-goto="${goto}">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${(value ?? 0).toLocaleString()}</div>
      <div class="stat-link">${linkText} →</div>
    </div>
  `;
}

function infoCard(value, label, action, goto) {
  return `
    <div class="info-card">
      <h4>${label}</h4>
      <div class="info-num">${(value ?? 0).toLocaleString()}</div>
      <span class="info-action" data-goto="${goto}">${action}</span>
    </div>
  `;
}

// ── Member Quick Search (searches both members and superhumane) ────────────────────
function dashMemberSearch() {
  const query  = (document.getElementById('dashMemberQuery')?.value || '').toLowerCase().trim();
  const field  = document.getElementById('dashMemberField')?.value || 'any';
  const out    = document.getElementById('dashMemberResults');
  if (!out) return;

  if (!query) { out.innerHTML = ''; return; }

  const TYPE_KEYWORDS = {
    mahila: m => m.mahila === 'Y',
    ladies: m => m.mahila === 'Y',
    youth:  m => m.youth === 'Y',
    crc:    m => m.crc === 'Y',
    cca:    m => m.cca === 'Y',
    'sant su': m => m.santSu === 'Y' || m._isSuperhumane,
    'sant-su': m => m.santSu === 'Y' || m._isSuperhumane,
    'superhumane': m => m._isSuperhumane,
    'pre-init': m => m.jrPreInit === 'Y' || m.srPreInit === 'Y',
  };

  // Search function for both member types
  const matchesQuery = (m) => {
    if (field === 'name')   return (m.name   || '').toLowerCase().includes(query);
    if (field === 'uid')    return (m.uid    || '').toLowerCase().includes(query);
    if (field === 'mobile') return ((m.mobile || m.fatherContact || '') + ' ' + (m.mobile2 || m.motherContact || '')).includes(query);
    if (field === 'city')   return ((m.city || m.branch || '') + ' ' + (m.state || '')).toLowerCase().includes(query);
    if (field === 'branch') return ((m.branchIdCard || m.branch || '')).toLowerCase().includes(query);
    if (field === 'status') return (m.status || '').toLowerCase().includes(query);
    if (field === 'type') {
      for (const [kw, fn] of Object.entries(TYPE_KEYWORDS)) {
        if (kw.includes(query) && fn(m)) return true;
      }
      return (m.type || '').toLowerCase().includes(query);
    }
    // any field — search across all commonly used fields
    const searchFields = [
      m.name, m.uid, m.bslno,
      m.mobile, m.mobile2, m.landline, m.fatherContact, m.motherContact,
      m.email, m.email2,
      m.city, m.state, m.country, m.branch, m.address,
      m.addressLine1, m.addressLine2, m.addressLine3,
      m.branchIdCard, m.status,
      m.fatherName, m.motherName, m.spouseName,
      m.fatherUid, m.motherUid, m.spouseUid,
      m.occupation, m.organization, m.profession
    ];
    return searchFields.some(f => (f || '').toLowerCase().includes(query));
  };

  // Search both arrays
  const memberResults = MEMBERS.filter(matchesQuery).map(m => ({...m, _source: 'member'}));
  const superhumaneResults = (typeof SUPERHUMANE !== 'undefined' ? SUPERHUMANE : [])
    .filter(matchesQuery).map(s => ({...s, _source: 'superhumane'}));
  
  const results = [...memberResults, ...superhumaneResults].slice(0, 50);

  if (!results.length) {
    out.innerHTML = '<p class="text-muted" style="padding:var(--sp-sm) 0">No members found.</p>';
    return;
  }

  const statusBadge = s => s === 'Activated'
    ? '<span class="badge badge-success" style="font-size:0.72rem">Activated</span>'
    : `<span class="badge badge-gray" style="font-size:0.72rem">${s || '—'}</span>`;

  const typeBadge = m => m._isSuperhumane || m._source === 'superhumane'
    ? '<span class="badge" style="font-size:0.72rem;background:var(--clr-saffron);color:#fff">Sant-Su</span>'
    : '';

  out.innerHTML = `
    <div style="font-size:0.82rem;color:var(--txt-muted);margin-bottom:var(--sp-sm)">
      ${results.length} result${results.length !== 1 ? 's' : ''}${results.length === 50 ? ' (showing first 50)' : ''}
      <span style="margin-left:8px;font-size:0.75rem">(${memberResults.length} members, ${superhumaneResults.length} Sant-Su)</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--sp-sm)">
      ${results.map(m => `
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-sm);
                    padding:var(--sp-md);background:var(--bg-body);border:1px solid var(--border);border-radius:var(--radius-md)">
          <div style="flex:1;min-width:180px">
            <div style="font-weight:600;font-size:0.95rem">${m.name || '—'} ${typeBadge(m)}</div>
            <div style="font-size:0.78rem;color:var(--txt-muted);margin-top:2px">
              <code style="font-size:0.75rem;color:var(--clr-navy-mid)">${m.uid}</code>
              &nbsp;·&nbsp;${m.city || m.branch || '—'}${m.state ? ', ' + m.state : ''}
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:0.82rem;color:var(--txt-muted)">
            ${m.mobile || m.fatherContact ? `<span>${m.mobile || m.fatherContact}</span>` : ''}
            ${m._source === 'superhumane' ? '' : statusBadge(m.status)}
          </div>
          <div style="display:flex;gap:var(--sp-sm)">
            <button class="tbl-btn tbl-btn-view" onclick="${m._source === 'superhumane' ? `viewSuperhumaneQuick('${m.uid}')` : `viewMember('${m.uid}')`}">View</button>
            ${canWrite() ? `<button class="tbl-btn tbl-btn-edit" onclick="${m._source === 'superhumane' ? `editSuperhumane('${m.uid}')` : `editMember('${m.uid}')`}">Edit</button>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── View Superhumane from Quick Search ────────────────────
async function viewSuperhumaneQuick(uid) {
  // Try to find in global SUPERHUMANE first, if not there fetch from API
  let c = (typeof SUPERHUMANE !== 'undefined' ? SUPERHUMANE : []).find(x => x.uid === uid);
  
  if (!c) {
    // Fetch from API
    const data = await apiGet('/api/all-superhumane');
    const arr = data.children || data || [];
    c = arr.find(x => x.uid === uid);
  }
  
  if (!c) {
    showToast('Record not found', 'error');
    return;
  }

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
      <h3>Sant-Su Child Record</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--clr-saffron);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:700;flex-shrink:0;">${(c.name||'?').charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-size:1.05rem;font-weight:700;">${sh(c.name)}</div>
        <div style="font-size:0.8rem;color:var(--txt-muted);">UID: <code>${sh(c.uid)}</code> &nbsp;|&nbsp; ${sh(c.member_type || c.memberType)} &nbsp;|&nbsp; ${statusBadge}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px 16px;font-size:0.84rem;">
      ${sec('Identity')}
      ${rf('UID', c.uid)}  ${rf('BSL', c.bsl || c.bslno)}  ${rf('Phase', c.phase)}  ${rf('Branch', c.branch)}
      ${rf('Gender', c.gender === 'M' ? 'Male' : c.gender === 'F' ? 'Female' : c.gender)}
      ${rf('Member Type', c.member_type || c.memberType)}
      ${sec('Dates')}
      ${rfd('Date of Birth', c.date_of_birth || c.dateOfBirth)}
      ${sec('Address')}
      ${rf('Address', c.address)}
      ${sec('Father')}
      ${rf('Name', c.father_name || c.fatherName)}  ${rf('UID', c.father_uid || c.fatherUid)}  ${rf('Contact', c.father_contact || c.fatherContact)}
      ${sec('Mother')}
      ${rf('Name', c.mother_name || c.motherName)}  ${rf('UID', c.mother_uid || c.motherUid)}  ${rf('Contact', c.mother_contact || c.motherContact)}
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end;flex-wrap:wrap;">
      <button class="btn btn-outline" onclick="closeForcedModal()">Close</button>
    </div>
  `, true);
}
