/* ============================================================
   ANNOUNCEMENTS-SECTION.JS
   ============================================================ */

'use strict';

function renderAnnouncements() {
  const container = document.getElementById('announcementsContent');
  const active   = ANNOUNCEMENTS.filter(a => a.active);
  const inactive = ANNOUNCEMENTS.filter(a => !a.active);

  container.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-lg)">
      ${isAdmin() ? '<button class="toolbar-btn toolbar-btn-saffron" onclick="openAddAnnouncementModal()">+ New Announcement</button>' : ''}
    </div>

    <div class="sub-heading">Active Announcements</div>
    <div style="display:flex;flex-direction:column;gap:var(--sp-md)" id="activeAnnDiv">
      ${active.map(a => announcementCard(a)).join('') || '<p class="text-muted">No active announcements.</p>'}
    </div>

    <div class="sub-heading" style="margin-top:var(--sp-xl)">Inactive / Archived</div>
    <div style="display:flex;flex-direction:column;gap:var(--sp-md)">
      ${inactive.map(a => announcementCard(a)).join('') || '<p class="text-muted">No archived announcements.</p>'}
    </div>
  `;
}

function announcementCard(a) {
  const priorityStyles = {
    high:   { badge: 'badge-danger',  icon: '🔴', border: 'var(--clr-red)' },
    medium: { badge: 'badge-warning', icon: '🟡', border: 'var(--clr-saffron)' },
    low:    { badge: 'badge-info',    icon: '🔵', border: 'var(--clr-blue)' }
  };
  const ps = priorityStyles[a.priority] || priorityStyles.low;

  return `
    <div class="card" style="border-left: 4px solid ${ps.border}; padding: var(--sp-lg);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-md);flex-wrap:wrap">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span>${ps.icon}</span>
            <strong style="font-size:1rem">${a.title}</strong>
            <span class="badge ${ps.badge}">${a.priority.toUpperCase()}</span>
            ${!a.active ? '<span class="badge badge-gray">Archived</span>' : ''}
          </div>
          <p style="font-size:0.88rem;color:var(--txt-secondary);line-height:1.6">${a.content}</p>
          <div style="margin-top:10px;font-size:0.78rem;color:var(--txt-muted)">
            By <strong>${a.author}</strong> &nbsp;·&nbsp; ${formatDate(a.date)}
          </div>
        </div>
        ${isAdmin() ? `<div style="display:flex;gap:6px;flex-shrink:0">
          <button class="tbl-btn tbl-btn-edit"   onclick="editAnnouncement(${a.id})">Edit</button>
          <button class="tbl-btn ${a.active ? 'tbl-btn-delete' : 'tbl-btn-view'}" onclick="toggleAnnouncement(${a.id})">
            ${a.active ? 'Archive' : 'Restore'}
          </button>
        </div>` : ''}
      </div>
    </div>
  `;
}

function openAddAnnouncementModal() {
  openModal(`
    <div class="modal-header">
      <h3>📢 New Announcement</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Title *</label><input id="aa_title" placeholder="Announcement title" /></div>
    <div class="form-field"><label>Content *</label><textarea id="aa_content" placeholder="Write the announcement content here…"></textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md)">
      <div class="form-field">
        <label>Priority</label>
        <select id="aa_priority">
          <option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option>
        </select>
      </div>
      <div class="form-field"><label>Author</label><input id="aa_author" value="Admin" /></div>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-saffron" onclick="saveNewAnnouncement()">Post</button>
    </div>
  `);
}

async function saveNewAnnouncement() {
  const title   = document.getElementById('aa_title').value.trim();
  const content = document.getElementById('aa_content').value.trim();
  if (!title || !content) { showToast('Title and content required!', 'error'); return; }
  try {
    await apiPost('/api/announcements', {
      title, content,
      date:     new Date().toISOString().split('T')[0],
      author:   document.getElementById('aa_author').value || 'Admin',
      priority: document.getElementById('aa_priority').value,
      active:   true
    });
    await reloadAnnouncements();
    closeForcedModal();
    renderCache.delete('announcements');
    renderAnnouncements();
    showToast('Announcement posted!', 'success');
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
}

function editAnnouncement(id) {
  const a = ANNOUNCEMENTS.find(x => x.id === id);
  if (!a) return;
  openModal(`
    <div class="modal-header">
      <h3>✏️ Edit Announcement</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Title</label><input id="ea_title" value="${a.title}" /></div>
    <div class="form-field"><label>Content</label><textarea id="ea_content">${a.content}</textarea></div>
    <div class="form-field">
      <label>Priority</label>
      <select id="ea_priority">
        <option value="low" ${a.priority==='low'?'selected':''}>Low</option>
        <option value="medium" ${a.priority==='medium'?'selected':''}>Medium</option>
        <option value="high" ${a.priority==='high'?'selected':''}>High</option>
      </select>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveAnnouncementEdit(${id})">Save</button>
    </div>
  `);
}

async function saveAnnouncementEdit(id) {
  const a = ANNOUNCEMENTS.find(x => x.id === id);
  if (!a) return;
  try {
    await apiPut('/api/announcements/' + id, {
      ...a,
      title:    document.getElementById('ea_title').value,
      content:  document.getElementById('ea_content').value,
      priority: document.getElementById('ea_priority').value
    });
    await reloadAnnouncements();
    closeForcedModal();
    renderCache.delete('announcements');
    renderAnnouncements();
    showToast('Announcement updated!', 'success');
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
}

async function toggleAnnouncement(id) {
  const a = ANNOUNCEMENTS.find(x => x.id === id);
  if (!a) return;
  try {
    await apiPut('/api/announcements/' + id, { ...a, active: !a.active });
    await reloadAnnouncements();
    renderCache.delete('announcements');
    renderAnnouncements();
    showToast(`Announcement ${!a.active ? 'restored' : 'archived'}!`);
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
}