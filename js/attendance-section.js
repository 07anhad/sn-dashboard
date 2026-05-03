/* ============================================================
   ATTENDANCE-SECTION.JS — Haazri / Attendance Management
   ============================================================ */

'use strict';

let attData     = [];
let filteredAtt = [];
let attPage     = 1;
const ATT_PER_PAGE = 10;

// ── Entry point (called by router) ─────────
function renderAttendance() {
  if (!isAdmin()) {
    document.getElementById('attendanceContent').innerHTML =
      '<div style="padding:60px;text-align:center;color:var(--clr-red);font-size:1.1rem;">\u26d4 Access Denied \u2014 Attendance data is restricted to administrators only.</div>';
    return;
  }
  loadAttendanceData();
}

// ── Load from DB ───────────────────────────
async function loadAttendanceData() {
  const container = document.getElementById('attendanceContent');
  container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--txt-muted)">Loading\u2026</div>';
  try {
    const raw = await apiGet('/api/attendance/esatsang');
    attData = mapRows(raw);
  } catch (e) {
    attData = [];
  }
  filteredAtt = [...attData];
  renderAttUI();
}

function normalizeDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return String(raw).split('T')[0].split(' ')[0]; // fallback
  // Format as yyyy-mm-dd in local time
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mapRows(raw) {
  return raw.map((r, i) => ({
    id:       r.id || i + 1,
    date:     normalizeDate(r.attendance_date),
    memberId: r.member_id || '',
    event:    r.event_name || '',
    name:     [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || '\u2014',
    uid:      r.member_uid || '',
    branch:   r.branch_name || '',
    location: r.location || '',
    type:     r.attendance_type || '',
  }));
}

// ── Main render ────────────────────────────
function renderAttUI() {
  const container = document.getElementById('attendanceContent');
  const total = attData.length;
  const audio = attData.filter(r => (r.type || '').toUpperCase() === 'AUDIO').length;
  const video = attData.filter(r => (r.type || '').toUpperCase() === 'VIDEO').length;
  const uniqueBranches = [...new Set(attData.map(r => r.branch).filter(Boolean))].sort();
  const uniqueEvents   = [...new Set(attData.map(r => r.event).filter(Boolean))].sort();

  container.innerHTML = `
    <!-- Upload Card -->
    <div class="card" style="padding:var(--sp-lg);display:flex;align-items:center;gap:var(--sp-lg);flex-wrap:wrap;margin-bottom:var(--sp-xl)">
      <div style="flex:1;min-width:200px">
        <div style="font-weight:600;font-size:1rem;margin-bottom:4px">Upload Attendance File</div>
        <div class="text-muted" style="font-size:0.85em">
          Accepts <code>.xlsx</code> or <code>.csv</code>. Expected columns: Attendance Date, Member Id, Event Name, Member First/Middle/Last Name, Member Uid, Branch Name, Location, Attendance Type
        </div>
        <div id="attUploadStatus" style="margin-top:8px;font-size:0.85em"></div>
        <div id="attProgressWrap" style="display:none;margin-top:10px">
          <div style="display:flex;justify-content:space-between;font-size:0.78em;color:var(--txt-muted);margin-bottom:4px">
            <span id="attProgressLabel">Uploading…</span>
            <span id="attProgressPct">0%</span>
          </div>
          <div style="height:8px;background:var(--border);border-radius:99px;overflow:hidden">
            <div id="attProgressBar" style="height:100%;width:0%;background:var(--clr-saffron);border-radius:99px;transition:width 0.2s"></div>
          </div>
        </div>
      </div>
      <label class="btn btn-primary" style="cursor:pointer;white-space:nowrap">
        \u2191 Upload Excel / CSV
        <input type="file" accept=".csv,.xlsx,.xlsm,.xls" style="display:none" onchange="handleAttUpload(event)">
      </label>
    </div>

    ${total > 0 ? `
    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom:var(--sp-xl)">
      <div class="stat-card accent-saffron">
        <div class="stat-label">Total Records</div>
        <div class="stat-value">${total.toLocaleString()}</div>
      </div>
      <div class="stat-card accent-green">
        <div class="stat-label">Audio</div>
        <div class="stat-value">${audio.toLocaleString()}</div>
        <div class="stat-link">${total ? Math.round(audio / total * 100) : 0}%</div>
      </div>
      <div class="stat-card accent-blue">
        <div class="stat-label">Video</div>
        <div class="stat-value">${video.toLocaleString()}</div>
        <div class="stat-link">${total ? Math.round(video / total * 100) : 0}%</div>
      </div>
      <div class="stat-card accent-purple">
        <div class="stat-label">Branches</div>
        <div class="stat-value">${uniqueBranches.length}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar" style="margin-bottom:var(--sp-lg)">
      <div class="filter-group">
        <label>Search Name / ID</label>
        <input type="text" id="attSearch" placeholder="Name, UID, or Member ID..." oninput="filterAtt()" />
      </div>
      <div class="filter-group">
        <label>Event</label>
        <select id="attFilterEvent" onchange="filterAtt()">
          <option value="">All Events</option>
          ${uniqueEvents.map(e => `<option value="${e}">${e}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Branch</label>
        <select id="attFilterBranch" onchange="filterAtt()">
          <option value="">All Branches</option>
          ${uniqueBranches.map(b => `<option value="${b}">${b}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Type</label>
        <select id="attFilterType" onchange="filterAtt()">
          <option value="">All Types</option>
          <option value="AUDIO">Audio</option>
          <option value="VIDEO">Video</option>
          <option value="NA">NA</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Date</label>
        <input type="date" id="attFilterDate" onchange="filterAtt()" />
      </div>
      <div class="filter-group filter-reset">
        <button class="btn btn-outline btn-sm" onclick="clearAttFilters()">Reset</button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div class="table-toolbar">
        <div>
          <span class="table-title">Attendance Records</span>
          <span class="table-count" id="attCount">${total.toLocaleString()} records</span>
        </div>
        <div class="table-actions">
          <button class="toolbar-btn" onclick="exportAtt()">\u2193 Export CSV</button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Member ID</th>
              <th>UID</th>
              <th>Name</th>
              <th>Event</th>
              <th>Branch</th>
              <th>Location</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody id="attTableBody"></tbody>
        </table>
      </div>
      <div class="pagination" id="attPagination"></div>
    </div>
    ` : `
    <div class="card" style="padding:var(--sp-xl);text-align:center;color:var(--txt-muted)">
      No attendance records yet. Upload a file above to get started.
    </div>`}
  `;

  if (total > 0) renderAttTable();
}

// ── Filter ─────────────────────────────────
function filterAtt() {
  const q      = (document.getElementById('attSearch')?.value || '').toLowerCase();
  const event  = document.getElementById('attFilterEvent')?.value  || '';
  const branch = document.getElementById('attFilterBranch')?.value || '';
  const type   = (document.getElementById('attFilterType')?.value  || '').toUpperCase();
  const date   = document.getElementById('attFilterDate')?.value   || ''; // yyyy-mm-dd

  filteredAtt = attData.filter(r => {
    if (q && !r.name.toLowerCase().includes(q) &&
             !r.uid.toLowerCase().includes(q) &&
             !r.memberId.toLowerCase().includes(q)) return false;
    if (event  && r.event  !== event)                    return false;
    if (branch && r.branch !== branch)                   return false;
    if (type   && (r.type || '').toUpperCase() !== type) return false;
    if (date   && !String(r.date).startsWith(date))      return false;
    return true;
  });
  attPage = 1;
  renderAttTable();
}

function clearAttFilters() {
  ['attSearch', 'attFilterEvent', 'attFilterBranch', 'attFilterType', 'attFilterDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  filterAtt();
}

function renderAttTable() {
  const tbody   = document.getElementById('attTableBody');
  const countEl = document.getElementById('attCount');
  if (!tbody) return;

  const total = filteredAtt.length;
  if (countEl) countEl.textContent = total.toLocaleString() + ' records';

  const start = (attPage - 1) * ATT_PER_PAGE;
  const page  = filteredAtt.slice(start, start + ATT_PER_PAGE);

  const typeBadge = t => {
    const u = (t || '').toUpperCase();
    const cls = u === 'AUDIO' ? 'badge-success' : u === 'VIDEO' ? 'badge-info' : 'badge-warning';
    return t ? `<span class="badge ${cls}" style="font-size:0.75rem">${t}</span>` : '\u2014';
  };

  tbody.innerHTML = page.map((r, i) => `
    <tr>
      <td style="color:var(--txt-muted);font-size:0.82rem">${start + i + 1}</td>
      <td style="font-size:0.82rem;white-space:nowrap">${r.date || '\u2014'}</td>
      <td><code style="font-size:0.78rem">${r.memberId || '\u2014'}</code></td>
      <td><code style="font-size:0.78rem">${r.uid || '\u2014'}</code></td>
      <td><strong>${r.name}</strong></td>
      <td style="font-size:0.82rem">${r.event || '\u2014'}</td>
      <td><span class="badge badge-info" style="font-size:0.75rem">${r.branch || '\u2014'}</span></td>
      <td style="font-size:0.82rem">${r.location || '\u2014'}</td>
      <td>${typeBadge(r.type)}</td>
    </tr>
  `).join('') || '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--txt-muted)">No matching records.</td></tr>';

  renderAttPagination(total);
}

function gotoAttPage(p) {
  const pages = Math.ceil(filteredAtt.length / ATT_PER_PAGE);
  attPage = Math.max(1, Math.min(p, pages));
  renderAttTable();
}

function renderAttPagination(total) {
  const el = document.getElementById('attPagination');
  if (!el) return;
  const pages = Math.ceil(total / ATT_PER_PAGE);
  if (pages <= 1) { el.innerHTML = ''; return; }

  const maxShow = 7;
  let s = Math.max(1, attPage - 3);
  let e = Math.min(pages, s + maxShow - 1);
  if (e - s < maxShow - 1) s = Math.max(1, e - maxShow + 1);

  let html = `<button class="page-btn" onclick="gotoAttPage(${attPage - 1})" ${attPage === 1 ? 'disabled' : ''}>\u2039</button>`;
  if (s > 1) html += `<button class="page-btn" onclick="gotoAttPage(1)">1</button><span style="padding:0 4px">\u2026</span>`;
  for (let i = s; i <= e; i++)
    html += `<button class="page-btn ${i === attPage ? 'active' : ''}" onclick="gotoAttPage(${i})">${i}</button>`;
  if (e < pages) html += `<span style="padding:0 4px">\u2026</span><button class="page-btn" onclick="gotoAttPage(${pages})">${pages}</button>`;
  html += `<button class="page-btn" onclick="gotoAttPage(${attPage + 1})" ${attPage === pages ? 'disabled' : ''}>\u203a</button>`;
  el.innerHTML = html;
}

// ── Upload ─────────────────────────────────
function handleAttUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const status   = document.getElementById('attUploadStatus');
  const wrap     = document.getElementById('attProgressWrap');
  const bar      = document.getElementById('attProgressBar');
  const pct      = document.getElementById('attProgressPct');
  const lbl      = document.getElementById('attProgressLabel');

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
      showToast('Imported ' + data.count.toLocaleString() + ' records!', 'success');
      if (status) status.innerHTML = '<span style="color:var(--clr-green)">✅ ' + data.count.toLocaleString() + ' new records imported' + (data.skipped ? ', ' + data.skipped + ' skipped (duplicates)' : '') + '.</span>';

      const fresh = await apiGet('/api/attendance/esatsang');
      attData     = mapRows(fresh);
      filteredAtt = [...attData];
      renderAttUI();
    } catch (e) {
      if (status) status.innerHTML = '<span style="color:var(--clr-red)">Invalid server response.</span>';
    }
  };

  xhr.onerror = () => {
    if (bar)    bar.style.background = 'var(--clr-red)';
    if (status) status.innerHTML = '<span style="color:var(--clr-red)">Network error.</span>';
    showToast('Upload failed: network error', 'error');
  };

  xhr.open('POST', '/api/attendance/esatsang/upload');
  xhr.send(formData);
}

// ── Export ─────────────────────────────────
function exportAtt() {
  const headers = ['Date', 'Member ID', 'UID', 'Name', 'Event', 'Branch', 'Location', 'Type'];
  const rows = filteredAtt.map(r =>
    [r.date, r.memberId, r.uid, '"' + r.name + '"', '"' + r.event + '"', '"' + r.branch + '"', '"' + r.location + '"', r.type].join(',')
  );
  const csv  = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'attendance_export.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('Exported attendance_export.csv', 'success');
}
