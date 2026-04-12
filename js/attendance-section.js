/* ============================================================
   ATTENDANCE-SECTION.JS — Haazri / Attendance Management
   Reads real data from CSV files in /dataset/ at runtime
   ============================================================ */

'use strict';

// ── State ─────────────────────────────────
let esatsangData     = [];
let branchData       = [];
let haazriData       = [];
let filteredEsatsang = [];
let filteredBranch   = [];
let attLogPage       = 1;
let attSummaryPage   = 1;
let activeAttTab     = 'log';
let attDataLoaded    = false;
const ATT_PER_PAGE     = 15;
const SUMMARY_PER_PAGE = 20;

// ── CSV Parser ────────────────────────────
function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < headers.length) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
    rows.push(obj);
  }
  return { headers, rows };
}

// ── Load all CSVs ─────────────────────────
async function loadAttendanceData() {
  if (attDataLoaded) return;

  const container = document.getElementById('attendanceContent');
  container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--txt-muted)">Loading attendance data from CSV files…</div>';

  try {
    const [esatsangRes, branchRes, haazriRes] = await Promise.all([
      fetch('/dataset/esatsang_attendance.csv').then(r => r.ok ? r.text() : ''),
      fetch('/dataset/branch_attendance.csv').then(r => r.ok ? r.text() : ''),
      fetch('/dataset/haazri_attendance.csv').then(r => r.ok ? r.text() : '')
    ]);

    // Parse eSatsang attendance
    if (esatsangRes) {
      const parsed = parseCSV(esatsangRes);
      esatsangData = parsed.rows.map((r, i) => ({
        id: i + 1,
        date: r.ATTENDANCE_DATE || '',
        memberId: r.MEMBER_ID || '',
        event: r.EVENT_NAME || '',
        firstName: r.FIRST_NAME || '',
        middleName: r.MIDDLE_NAME || '',
        lastName: r.LAST_NAME || '',
        name: [r.FIRST_NAME, r.MIDDLE_NAME, r.LAST_NAME].filter(Boolean).join(' ') || '—',
        uid: r.MEMBER_UID || '',
        branch: r.BRANCH_NAME || '',
        location: r.LOCATION || '',
        type: r.ATTENDANCE_TYPE || ''
      }));
    }

    // Parse branch attendance
    if (branchRes) {
      const parsed = parseCSV(branchRes);
      branchData = parsed.rows.map((r, i) => {
        const attended = parseInt(r.EVENTS_ATTENDED) || 0;
        const total = parseInt(r.TOTAL_BRANCH_EVENTS) || 0;
        return {
          id: i + 1,
          memberId: r.MEMBER_ID || '',
          memberName: r.MEMBER_NAME || '—',
          eventsAttended: attended,
          totalEvents: total,
          branch: r.BRANCH_NAME || '',
          attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0
        };
      });
    }

    // Parse haazri CSV
    if (haazriRes) {
      const parsed = parseCSV(haazriRes);
      haazriData = parsed.rows.filter(r => r.UID || r.NAME).map((r, i) => ({
        id: i + 1,
        uid: r.UID || '',
        name: r.NAME || '',
        dateTime: r.DATE_TIME_STR || '',
        haazriId: r.HAAZRI_ID || '',
        event: r.EVENT_NAME || '',
        branch: r.BRANCH_NAME || '',
        geolocation: r.GEOLOCATION_NAME || ''
      }));
    }

    filteredEsatsang = [...esatsangData];
    filteredBranch = [...branchData];
    attDataLoaded = true;
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--clr-red)">Failed to load CSV files. Make sure you are serving the site via a web server (not file://).</div>';
    return;
  }

  renderAttendanceUI();
}

// ── Main render (called by router) ────────
function renderAttendance() {
  if (!isAdmin()) {
    const container = document.getElementById('attendanceContent');
    container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--clr-red);font-size:1.1rem;">⛔ Access Denied — Attendance data is restricted to administrators only.</div>';
    return;
  }
  attDataLoaded = false;
  loadAttendanceData();
}

// ── Render the full UI once data is loaded ─
function renderAttendanceUI() {
  const container = document.getElementById('attendanceContent');

  // Compute stats from loaded data
  const totalRecords = esatsangData.length;
  const audioCount = esatsangData.filter(r => r.type === 'AUDIO').length;
  const videoCount = esatsangData.filter(r => r.type === 'VIDEO').length;
  const branchTotal = branchData.length;
  const branchAttended = branchData.filter(r => r.eventsAttended > 0).length;
  const uniqueDates = [...new Set(esatsangData.map(r => r.date).filter(Boolean))];
  const dateLabel = uniqueDates.length === 1 ? uniqueDates[0] : uniqueDates.length + ' dates';

  container.innerHTML = `
    <!-- Overview Cards -->
    <div class="stats-grid" style="margin-bottom:var(--sp-xl)">
      <div class="stat-card accent-saffron">
        <div class="stat-label">eSatsang Records</div>
        <div class="stat-value">${totalRecords.toLocaleString()}</div>
        <div class="stat-link">${dateLabel || 'No data'}</div>
      </div>
      <div class="stat-card accent-green">
        <div class="stat-label">Audio Attendance</div>
        <div class="stat-value">${audioCount.toLocaleString()}</div>
        <div class="stat-link">${totalRecords ? Math.round(audioCount/totalRecords*100) : 0}% of total</div>
      </div>
      <div class="stat-card accent-blue">
        <div class="stat-label">Video Attendance</div>
        <div class="stat-value">${videoCount.toLocaleString()}</div>
        <div class="stat-link">${totalRecords ? Math.round(videoCount/totalRecords*100) : 0}% of total</div>
      </div>
      <div class="stat-card accent-purple">
        <div class="stat-label">Branch Members</div>
        <div class="stat-value">${branchTotal.toLocaleString()}</div>
        <div class="stat-link">${branchAttended} attended (${branchTotal ? Math.round(branchAttended/branchTotal*100) : 0}%)</div>
      </div>
    </div>

    <!-- Event Breakdown -->
    ${totalRecords > 0 ? `
      <div class="sub-heading">Event-wise Breakdown</div>
      <div class="info-grid" style="margin-bottom:var(--sp-xl)">
        ${eventBreakdownCards()}
      </div>
    ` : ''}

    <!-- Tab Switcher -->
    <div class="att-tabs" style="display:flex;gap:0;margin-bottom:var(--sp-lg);border-bottom:2px solid var(--border)">
      <button class="att-tab active" id="tabLog" onclick="switchAttTab('log')">eSatsang Log (${esatsangData.length})</button>
      <button class="att-tab" id="tabSummary" onclick="switchAttTab('summary')">Branch Summary (${branchData.length})</button>
      <button class="att-tab" id="tabHaazri" onclick="switchAttTab('haazri')">Haazri Import${haazriData.length ? ' (' + haazriData.length + ')' : ''}</button>
    </div>

    <!-- Tab Content -->
    <div id="attTabContent"></div>
  `;

  activeAttTab = 'log';
  renderAttTab();
}

function eventBreakdownCards() {
  const eventCounts = {};
  esatsangData.forEach(r => {
    if (!eventCounts[r.event]) eventCounts[r.event] = { total: 0, audio: 0, video: 0, na: 0 };
    eventCounts[r.event].total++;
    if (r.type === 'AUDIO') eventCounts[r.event].audio++;
    else if (r.type === 'VIDEO') eventCounts[r.event].video++;
    else eventCounts[r.event].na++;
  });
  const colors = ['var(--clr-saffron)','var(--clr-blue)','var(--clr-green)','var(--clr-purple)','var(--clr-red)'];
  return Object.entries(eventCounts).map(([name, c], i) => `
    <div class="info-card" style="border-left:3px solid ${colors[i % colors.length]}">
      <h4 style="font-size:0.82rem">${name}</h4>
      <div class="info-num">${c.total}</div>
      <div style="font-size:0.75rem;color:var(--txt-muted);margin-top:4px">
        🔊 ${c.audio} &nbsp; 📹 ${c.video} &nbsp; ◻ ${c.na}
      </div>
    </div>
  `).join('');
}

function switchAttTab(tab) {
  activeAttTab = tab;
  document.querySelectorAll('.att-tab').forEach(t => t.classList.remove('active'));
  const tabId = { log: 'tabLog', summary: 'tabSummary', haazri: 'tabHaazri' }[tab];
  document.getElementById(tabId)?.classList.add('active');
  renderAttTab();
}

function renderAttTab() {
  const el = document.getElementById('attTabContent');
  if (activeAttTab === 'log')          renderAttLog(el);
  else if (activeAttTab === 'summary') renderAttSummary(el);
  else                                  renderAttHaazri(el);
}

// ════════════════════════════════════════════
// TAB 1: eSatsang Attendance Log
// ════════════════════════════════════════════
function renderAttLog(container) {
  if (!esatsangData.length) {
    container.innerHTML = '<div class="card" style="padding:var(--sp-xl);text-align:center"><p class="text-muted">No eSatsang attendance data found.<br>Place <code>esatsang_attendance.csv</code> in the <code>/dataset/</code> folder.</p></div>';
    return;
  }

  const uniqueEvents = [...new Set(esatsangData.map(r => r.event))].sort();

  container.innerHTML = `
    <div class="filters-bar">
      <div class="filter-group">
        <label>Search Name / UID</label>
        <input type="text" id="attFilterName" placeholder="Name or UID…" oninput="filterAttLog()" />
      </div>
      <div class="filter-group">
        <label>Event</label>
        <select id="attFilterEvent" onchange="filterAttLog()">
          <option value="">All Events</option>
          ${uniqueEvents.map(e => `<option value="${e}">${e}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Type</label>
        <select id="attFilterType" onchange="filterAttLog()">
          <option value="">All Types</option>
          <option value="AUDIO">Audio</option>
          <option value="VIDEO">Video</option>
          <option value="NA">NA</option>
        </select>
      </div>
      <div class="filter-group filter-reset">
        <button class="btn btn-outline btn-sm" onclick="clearAttLogFilters()">✕ Reset</button>
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-toolbar">
        <div>
          <span class="table-title">eSatsang Attendance</span>
          <span class="table-count" id="attLogCount">${esatsangData.length} records</span>
        </div>
        <div class="table-actions">
          <button class="toolbar-btn" onclick="exportAttLog()">↓ Export CSV</button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Date</th><th>Member ID</th><th>UID</th>
              <th>Name</th><th>Event</th><th>Branch</th><th>Type</th>
            </tr>
          </thead>
          <tbody id="attLogBody"></tbody>
        </table>
      </div>
      <div class="pagination" id="attLogPagination"></div>
    </div>
  `;
  filterAttLog();
}

function filterAttLog() {
  const q     = (document.getElementById('attFilterName')?.value || '').toLowerCase();
  const event = document.getElementById('attFilterEvent')?.value || '';
  const type  = document.getElementById('attFilterType')?.value || '';

  filteredEsatsang = esatsangData.filter(r => {
    if (q && !r.name.toLowerCase().includes(q) && !r.uid.toLowerCase().includes(q) && !r.memberId.toLowerCase().includes(q)) return false;
    if (event && r.event !== event) return false;
    if (type && r.type !== type) return false;
    return true;
  });
  attLogPage = 1;
  renderAttLogTable();
}

function clearAttLogFilters() {
  ['attFilterName','attFilterEvent','attFilterType'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  filterAttLog();
}

function renderAttLogTable() {
  const tbody = document.getElementById('attLogBody');
  const countEl = document.getElementById('attLogCount');
  if (!tbody) return;

  const total = filteredEsatsang.length;
  if (countEl) countEl.textContent = total.toLocaleString() + ' records';

  const start = (attLogPage - 1) * ATT_PER_PAGE;
  const slice = filteredEsatsang.slice(start, start + ATT_PER_PAGE);

  const typeBadge = t => {
    if (t === 'AUDIO') return '<span class="badge badge-info">🔊 Audio</span>';
    if (t === 'VIDEO') return '<span class="badge badge-success">📹 Video</span>';
    return '<span class="badge badge-gray">◻ NA</span>';
  };

  tbody.innerHTML = slice.length
    ? slice.map((r, i) => `
      <tr>
        <td>${start + i + 1}</td>
        <td style="font-size:0.82rem">${r.date}</td>
        <td><code style="font-size:0.78rem;color:var(--clr-navy-mid)">${r.memberId || '—'}</code></td>
        <td><code style="font-size:0.78rem">${r.uid || '—'}</code></td>
        <td><strong>${r.name}</strong></td>
        <td style="font-size:0.82rem">${r.event}</td>
        <td><span class="badge badge-info">${r.branch}</span></td>
        <td>${typeBadge(r.type)}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="8" style="padding:32px;text-align:center;color:var(--txt-muted)">No records match your filters.</td></tr>';

  renderPagination('attLogPagination', total, attLogPage, ATT_PER_PAGE, 'gotoAttLogPage');
}

function gotoAttLogPage(page) {
  const pages = Math.ceil(filteredEsatsang.length / ATT_PER_PAGE);
  if (page < 1 || page > pages) return;
  attLogPage = page;
  renderAttLogTable();
}

function exportAttLog() {
  const headers = ['#','Date','Member ID','UID','Name','Event','Branch','Location','Type'];
  const rows = filteredEsatsang.map((r, i) =>
    [i+1, r.date, r.memberId, r.uid, '"'+r.name+'"', '"'+r.event+'"', '"'+r.branch+'"', r.location, r.type].join(',')
  );
  downloadCSV([headers.join(','), ...rows].join('\n'), 'esatsang_attendance_export.csv');
}

// ════════════════════════════════════════════
// TAB 2: Branch Attendance Summary
// ════════════════════════════════════════════
function renderAttSummary(container) {
  if (!branchData.length) {
    container.innerHTML = '<div class="card" style="padding:var(--sp-xl);text-align:center"><p class="text-muted">No branch attendance data found.<br>Place <code>branch_attendance.csv</code> in the <code>/dataset/</code> folder.</p></div>';
    return;
  }

  const attended = branchData.filter(r => r.eventsAttended > 0).length;
  const notAttended = branchData.filter(r => r.eventsAttended === 0).length;
  const totalEvents = branchData[0]?.totalEvents || 0;

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--sp-md);margin-bottom:var(--sp-lg)">
      <div class="contrib-card">
        <h4>Total Members</h4>
        <div class="amount">${branchData.length.toLocaleString()}</div>
      </div>
      <div class="contrib-card" style="border-left-color:var(--clr-green)">
        <h4>Attended ≥1</h4>
        <div class="amount">${attended}</div>
      </div>
      <div class="contrib-card" style="border-left-color:var(--clr-red)">
        <h4>Zero Attendance</h4>
        <div class="amount">${notAttended.toLocaleString()}</div>
      </div>
      <div class="contrib-card" style="border-left-color:var(--clr-blue)">
        <h4>Total Branch Events</h4>
        <div class="amount">${totalEvents}</div>
      </div>
    </div>

    <div class="sub-heading">Attendance Distribution</div>
    <div class="card" style="padding:var(--sp-lg);margin-bottom:var(--sp-lg)" id="attDistChart"></div>

    <div class="filters-bar">
      <div class="filter-group">
        <label>Search Name / ID</label>
        <input type="text" id="summFilterName" placeholder="Name or ID…" oninput="filterAttSummary()" />
      </div>
      <div class="filter-group">
        <label>Attendance</label>
        <select id="summFilterAtt" onchange="filterAttSummary()">
          <option value="">All</option>
          <option value="0">Zero (0)</option>
          <option value="1+">1+ Events</option>
          <option value="3+">3+ Events</option>
        </select>
      </div>
      <div class="filter-group filter-reset">
        <button class="btn btn-outline btn-sm" onclick="clearAttSummaryFilters()">✕ Reset</button>
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-toolbar">
        <div>
          <span class="table-title">Branch Attendance Summary</span>
          <span class="table-count" id="attSummaryCount">${branchData.length} members</span>
        </div>
        <div class="table-actions">
          <button class="toolbar-btn" onclick="exportAttSummary()">↓ Export CSV</button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Member ID</th><th>Name</th><th>Branch</th>
              <th>Events Attended</th><th>Total Events</th><th>Attendance %</th>
            </tr>
          </thead>
          <tbody id="attSummaryBody"></tbody>
        </table>
      </div>
      <div class="pagination" id="attSummaryPagination"></div>
    </div>
  `;

  renderAttDistChart();
  filterAttSummary();
}

function renderAttDistChart() {
  const el = document.getElementById('attDistChart');
  if (!el) return;
  const dist = {};
  branchData.forEach(r => { dist[r.eventsAttended] = (dist[r.eventsAttended] || 0) + 1; });
  const max = Math.max(...Object.values(dist));

  el.innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:6px;height:120px;padding-bottom:24px;position:relative">
      ${Object.entries(dist).sort((a,b) => Number(a[0]) - Number(b[0])).map(([k, v]) => {
        const pct = Math.round(v / max * 100);
        const color = Number(k) === 0 ? 'var(--clr-red)' : Number(k) >= 3 ? 'var(--clr-green)' : 'var(--clr-saffron)';
        return `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <span style="font-size:0.72rem;font-weight:600;color:var(--txt-secondary)">${v.toLocaleString()}</span>
            <div style="width:100%;max-width:60px;height:${pct}%;min-height:4px;background:${color};border-radius:4px 4px 0 0;transition:height 0.3s"></div>
            <span style="font-size:0.72rem;color:var(--txt-muted);position:absolute;bottom:0">${k}</span>
          </div>
        `;
      }).join('')}
    </div>
    <div style="text-align:center;font-size:0.78rem;color:var(--txt-muted);margin-top:8px">Events Attended →</div>
  `;
}

function filterAttSummary() {
  const q   = (document.getElementById('summFilterName')?.value || '').toLowerCase();
  const att = document.getElementById('summFilterAtt')?.value || '';

  filteredBranch = branchData.filter(r => {
    if (q && !r.memberName.toLowerCase().includes(q) && !r.memberId.toLowerCase().includes(q)) return false;
    if (att === '0'  && r.eventsAttended !== 0) return false;
    if (att === '1+' && r.eventsAttended < 1) return false;
    if (att === '3+' && r.eventsAttended < 3) return false;
    return true;
  });
  attSummaryPage = 1;
  renderAttSummaryTable();
}

function clearAttSummaryFilters() {
  ['summFilterName','summFilterAtt'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  filterAttSummary();
}

function renderAttSummaryTable() {
  const tbody = document.getElementById('attSummaryBody');
  const countEl = document.getElementById('attSummaryCount');
  if (!tbody) return;

  const total = filteredBranch.length;
  if (countEl) countEl.textContent = total.toLocaleString() + ' members';

  const start = (attSummaryPage - 1) * SUMMARY_PER_PAGE;
  const slice = filteredBranch.slice(start, start + SUMMARY_PER_PAGE);

  tbody.innerHTML = slice.length
    ? slice.map((r, i) => {
        const pct = r.attendanceRate;
        const barColor = pct === 0 ? 'var(--clr-red)' : pct < 30 ? 'var(--clr-saffron)' : 'var(--clr-green)';
        return `
          <tr>
            <td>${start + i + 1}</td>
            <td><code style="font-size:0.78rem;color:var(--clr-navy-mid)">${r.memberId || '—'}</code></td>
            <td><strong>${r.memberName}</strong></td>
            <td><span class="badge badge-info">${r.branch}</span></td>
            <td>${r.eventsAttended}</td>
            <td>${r.totalEvents}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:6px;background:var(--border);border-radius:99px;overflow:hidden;min-width:60px">
                  <div style="width:${pct}%;height:100%;background:${barColor};border-radius:99px"></div>
                </div>
                <span style="font-size:0.78rem;font-weight:600;color:${barColor}">${pct}%</span>
              </div>
            </td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="7" style="padding:32px;text-align:center;color:var(--txt-muted)">No members match your filters.</td></tr>';

  renderPagination('attSummaryPagination', total, attSummaryPage, SUMMARY_PER_PAGE, 'gotoAttSummaryPage');
}

function gotoAttSummaryPage(page) {
  const pages = Math.ceil(filteredBranch.length / SUMMARY_PER_PAGE);
  if (page < 1 || page > pages) return;
  attSummaryPage = page;
  renderAttSummaryTable();
}

function exportAttSummary() {
  const headers = ['#','Member ID','Name','Branch','Events Attended','Total Events','Attendance %'];
  const rows = filteredBranch.map((r, i) =>
    [i+1, r.memberId, '"'+r.memberName+'"', '"'+r.branch+'"', r.eventsAttended, r.totalEvents, r.attendanceRate + '%'].join(',')
  );
  downloadCSV([headers.join(','), ...rows].join('\n'), 'branch_attendance_export.csv');
}

// ════════════════════════════════════════════
// TAB 3: Haazri CSV (auto-loads + manual upload)
// ════════════════════════════════════════════
function renderAttHaazri(container) {
  container.innerHTML = `
    <div class="card" style="padding:var(--sp-xl);text-align:center;margin-bottom:var(--sp-lg)">
      <div style="font-size:2rem;margin-bottom:var(--sp-md)">📂</div>
      <h3 style="margin-bottom:var(--sp-sm)">Haazri Attendance</h3>
      <p style="color:var(--txt-muted);font-size:0.88rem;margin-bottom:var(--sp-lg)">
        Auto-loaded from <code>/dataset/haazri_attendance.csv</code><br>
        Or upload a new CSV with columns: <code>UID, NAME, DATE_TIME_STR, HAAZRI_ID, EVENT_NAME, BRANCH_NAME, GEOLOCATION_NAME</code>
      </p>
      <label class="toolbar-btn toolbar-btn-saffron" style="cursor:pointer;display:inline-block">
        Upload New CSV
        <input type="file" accept=".csv" style="display:none" onchange="handleHaazriUpload(event)" />
      </label>
      <span id="haazriStatus" style="margin-left:12px;font-size:0.85rem;color:var(--txt-muted)">
        ${haazriData.length ? haazriData.length + ' records loaded from file' : 'No data rows in current file'}
      </span>
    </div>
    <div id="haazriPreview"></div>
  `;

  if (haazriData.length) renderHaazriTable(haazriData);
}

function handleHaazriUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.getElementById('haazriStatus');
  status.textContent = 'Reading…';

  const reader = new FileReader();
  reader.onload = function(e) {
    const parsed = parseCSV(e.target.result);
    const upperHeaders = parsed.headers.map(h => h.toUpperCase());
    const requiredHeaders = ['UID','NAME','DATE_TIME_STR','HAAZRI_ID','EVENT_NAME','BRANCH_NAME','GEOLOCATION_NAME'];
    const missing = requiredHeaders.filter(h => !upperHeaders.includes(h));

    if (missing.length) {
      status.innerHTML = '<span style="color:var(--clr-red)">Missing columns: ' + missing.join(', ') + '</span>';
      return;
    }

    haazriData = parsed.rows.filter(r => r.UID || r.NAME).map((r, i) => ({
      id: i + 1,
      uid: r.UID || '',
      name: r.NAME || '',
      dateTime: r.DATE_TIME_STR || '',
      haazriId: r.HAAZRI_ID || '',
      event: r.EVENT_NAME || '',
      branch: r.BRANCH_NAME || '',
      geolocation: r.GEOLOCATION_NAME || ''
    }));

    status.innerHTML = haazriData.length
      ? '<span class="badge badge-success">' + haazriData.length + ' records loaded</span>'
      : '<span class="badge badge-warning">File parsed but 0 data rows found</span>';

    renderHaazriTable(haazriData);
  };
  reader.readAsText(file);
}

function renderHaazriTable(data) {
  const el = document.getElementById('haazriPreview');
  if (!data.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="table-wrap">
      <div class="table-toolbar">
        <div>
          <span class="table-title">Haazri Records</span>
          <span class="table-count">${data.length} records</span>
        </div>
        <div class="table-actions">
          <button class="toolbar-btn" onclick="exportHaazri()">↓ Export CSV</button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th><th>UID</th><th>Name</th><th>Date/Time</th>
              <th>Haazri ID</th><th>Event</th><th>Branch</th><th>Geolocation</th>
            </tr>
          </thead>
          <tbody>
            ${data.slice(0, 50).map((r, i) => `
              <tr>
                <td>${i+1}</td>
                <td><code style="font-size:0.78rem">${r.uid}</code></td>
                <td><strong>${r.name}</strong></td>
                <td style="font-size:0.82rem">${r.dateTime}</td>
                <td><code style="font-size:0.78rem">${r.haazriId}</code></td>
                <td style="font-size:0.82rem">${r.event}</td>
                <td><span class="badge badge-info">${r.branch}</span></td>
                <td style="font-size:0.82rem">${r.geolocation}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${data.length > 50 ? '<div style="padding:12px 16px;font-size:0.82rem;color:var(--txt-muted)">Showing 50 of ' + data.length + ' records.</div>' : ''}
    </div>
  `;
}

function exportHaazri() {
  const headers = ['UID','NAME','DATE_TIME_STR','HAAZRI_ID','EVENT_NAME','BRANCH_NAME','GEOLOCATION_NAME'];
  const rows = haazriData.map(r =>
    [r.uid, '"'+r.name+'"', r.dateTime, r.haazriId, '"'+r.event+'"', '"'+r.branch+'"', r.geolocation].join(',')
  );
  downloadCSV([headers.join(','), ...rows].join('\n'), 'haazri_export.csv');
}

// ════════════════════════════════════════════
// Shared Utilities
// ════════════════════════════════════════════
function renderPagination(elId, total, currentPage, perPage, gotoFn) {
  const el = document.getElementById(elId);
  if (!el) return;
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) { el.innerHTML = ''; return; }

  const maxShow = 7;
  let startPage = Math.max(1, currentPage - 3);
  let endPage = Math.min(pages, startPage + maxShow - 1);
  if (endPage - startPage < maxShow - 1) startPage = Math.max(1, endPage - maxShow + 1);

  let html = '<button class="page-btn" onclick="' + gotoFn + '(' + (currentPage-1) + ')" ' + (currentPage===1?'disabled':'') + '>‹</button>';
  if (startPage > 1) html += '<button class="page-btn" onclick="' + gotoFn + '(1)">1</button><span style="padding:0 4px">…</span>';
  for (let i = startPage; i <= endPage; i++) {
    html += '<button class="page-btn ' + (i===currentPage?'active':'') + '" onclick="' + gotoFn + '(' + i + ')">' + i + '</button>';
  }
  if (endPage < pages) html += '<span style="padding:0 4px">…</span><button class="page-btn" onclick="' + gotoFn + '(' + pages + ')">' + pages + '</button>';
  html += '<button class="page-btn" onclick="' + gotoFn + '(' + (currentPage+1) + ')" ' + (currentPage===pages?'disabled':'') + '>›</button>';
  el.innerHTML = html;
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported ' + filename, 'success');
}
