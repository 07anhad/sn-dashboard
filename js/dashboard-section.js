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
            <div class="info-link" style="margin-top:6px;font-size:.78rem;color:var(--txt-muted);">📍 ${e.venue} · ${e.type}</div>
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
      ${statCard(s.transferIn,       'Transfer In',        'More info',    'accent-blue',    'members')}
      ${statCard(s.transferOut,      'Transfer Out',       'More info',    'accent-purple',  'members')}
      ${statCard(s.expired,          'Expired',            'More info',    'accent-red',     'members')}
      ${statCard(s.pendingApprovals, 'Pending Approvals',  'More info',    'accent-gold',    'members')}
      ${statCard(s.activeRegLinks,   'Active Reg. Links',  'More info',    'accent-teal',    'registration')}
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

// ── Member Quick Search ────────────────────
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
    'sant su': m => m.santSu === 'Y',
    'pre-init': m => m.jrPreInit === 'Y' || m.srPreInit === 'Y',
  };

  const results = MEMBERS.filter(m => {
    if (field === 'name')   return (m.name   || '').toLowerCase().includes(query);
    if (field === 'uid')    return (m.uid    || '').toLowerCase().includes(query);
    if (field === 'mobile') return ((m.mobile || '') + ' ' + (m.mobile2 || '')).includes(query);
    if (field === 'city')   return ((m.city  || '') + ' ' + (m.state || '')).toLowerCase().includes(query);
    if (field === 'branch') return (m.branchIdCard || '').toLowerCase().includes(query);
    if (field === 'status') return (m.status || '').toLowerCase().includes(query);
    if (field === 'type') {
      for (const [kw, fn] of Object.entries(TYPE_KEYWORDS)) {
        if (kw.includes(query) && fn(m)) return true;
      }
      return (m.type || '').toLowerCase().includes(query);
    }
    // any field
    return (m.name || '').toLowerCase().includes(query) ||
           (m.uid  || '').toLowerCase().includes(query) ||
           (m.mobile || '').includes(query) ||
           (m.mobile2 || '').includes(query) ||
           (m.city || '').toLowerCase().includes(query) ||
           (m.state || '').toLowerCase().includes(query) ||
           (m.branchIdCard || '').toLowerCase().includes(query) ||
           (m.email || '').toLowerCase().includes(query) ||
           (m.status || '').toLowerCase().includes(query);
  }).slice(0, 20); // cap at 20

  if (!results.length) {
    out.innerHTML = '<p class="text-muted" style="padding:var(--sp-sm) 0">No members found.</p>';
    return;
  }

  const statusBadge = s => s === 'Activated'
    ? '<span class="badge badge-success" style="font-size:0.72rem">Activated</span>'
    : `<span class="badge badge-gray" style="font-size:0.72rem">${s || '—'}</span>`;

  out.innerHTML = `
    <div style="font-size:0.82rem;color:var(--txt-muted);margin-bottom:var(--sp-sm)">
      ${results.length} result${results.length !== 1 ? 's' : ''}${results.length === 20 ? ' (showing first 20)' : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--sp-sm)">
      ${results.map(m => `
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-sm);
                    padding:var(--sp-md);background:var(--bg-body);border:1px solid var(--border);border-radius:var(--radius-md)">
          <div style="flex:1;min-width:180px">
            <div style="font-weight:600;font-size:0.95rem">${m.name || '—'}</div>
            <div style="font-size:0.78rem;color:var(--txt-muted);margin-top:2px">
              <code style="font-size:0.75rem;color:var(--clr-navy-mid)">${m.uid}</code>
              &nbsp;·&nbsp;${m.city || '—'}${m.state ? ', ' + m.state : ''}
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:0.82rem;color:var(--txt-muted)">
            ${m.mobile ? `<span>📞 ${m.mobile}</span>` : ''}
            ${statusBadge(m.status)}
          </div>
          <div style="display:flex;gap:var(--sp-sm)">
            <button class="tbl-btn tbl-btn-view" onclick="viewMember('${m.uid}')">View</button>
            ${canWrite() ? `<button class="tbl-btn tbl-btn-edit" onclick="editMember('${m.uid}')">Edit</button>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}