
/* ============================================================
   EVENTS-SECTION.JS — All Events
   ============================================================ */

'use strict';

function renderEvents() {
  const container = document.getElementById('eventsContent');
  const upcoming  = EVENTS.filter(e => e.status === 'Upcoming');
  const completed = EVENTS.filter(e => e.status === 'Completed');

  container.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-lg)">
      <button class="toolbar-btn toolbar-btn-saffron" onclick="openAddEventModal()">+ Create Event</button>
    </div>

    <div class="sub-heading">Upcoming Events <span class="badge badge-info" style="font-size:0.78rem">${upcoming.length}</span></div>
    <div class="event-grid">
      ${upcoming.map(e => eventCard(e)).join('') || '<p class="text-muted">No upcoming events.</p>'}
    </div>

    <div class="sub-heading" style="margin-top:var(--sp-xl)">Past Events <span class="badge badge-gray" style="font-size:0.78rem">${completed.length}</span></div>
    <div class="event-grid">
      ${completed.map(e => eventCard(e)).join('') || '<p class="text-muted">No past events.</p>'}
    </div>
  `;
}

function eventCard(e) {
  const typeColors = {
    Satsang:     'var(--clr-saffron)',
    Festival:    'var(--clr-red)',
    Ceremony:    'var(--clr-purple)',
    Camp:        'var(--clr-green)',
    Orientation: 'var(--clr-blue)'
  };
  const headerBg = typeColors[e.type] || 'var(--clr-navy)';

  return `
    <div class="event-card">
      <div class="event-card-header" style="background:${headerBg};color:${e.type==='Festival'||e.type==='Satsang'?'#fff':'#fff'}">
        <span style="font-weight:600">${e.title}</span>
        <span class="badge" style="background:rgba(255,255,255,0.2);color:#fff">${e.type}</span>
      </div>
      <div class="event-card-body">
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="font-size:0.85rem"><span style="color:var(--txt-muted)">📅</span> ${formatDate(e.date)} at ${e.time}</div>
          <div style="font-size:0.85rem"><span style="color:var(--txt-muted)">📍</span> ${e.venue}</div>
          ${e.status === 'Completed'
            ? `<div style="font-size:0.85rem"><span style="color:var(--txt-muted)">👥</span> ${e.attendees} attended</div>`
            : `<div style="font-size:0.85rem"><span style="color:var(--txt-muted)">🎯</span> Max: ${e.maxAttendees}</div>`
          }
        </div>
      </div>
      <div class="event-card-footer">
        <button class="tbl-btn tbl-btn-edit" onclick="editEvent(${e.id})">Edit</button>
        <button class="tbl-btn tbl-btn-delete" onclick="deleteEvent(${e.id})">Delete</button>
        ${e.status === 'Upcoming' ? `<button class="tbl-btn tbl-btn-view" onclick="markCompleted(${e.id})">Mark Done</button>` : ''}
      </div>
    </div>
  `;
}

function openAddEventModal() {
  openModal(`
    <div class="modal-header">
      <h3>📅 Create New Event</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Event Title *</label><input id="ae_title" placeholder="Event name" /></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md)">
      <div class="form-field"><label>Date *</label><input id="ae_date" type="date" /></div>
      <div class="form-field"><label>Time</label><input id="ae_time" type="time" value="06:00" /></div>
    </div>
    <div class="form-field"><label>Venue</label><input id="ae_venue" placeholder="Location / Hall name" /></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md)">
      <div class="form-field">
        <label>Type</label>
        <select id="ae_type">
          <option>Satsang</option><option>Festival</option><option>Ceremony</option>
          <option>Camp</option><option>Orientation</option><option>Other</option>
        </select>
      </div>
      <div class="form-field"><label>Max Attendees</label><input id="ae_max" type="number" value="200" /></div>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-saffron" onclick="saveNewEvent()">Create</button>
    </div>
  `);
}

function saveNewEvent() {
  const title = document.getElementById('ae_title').value.trim();
  const date  = document.getElementById('ae_date').value;
  if (!title || !date) { showToast('Title and date required!', 'error'); return; }
  EVENTS.push({
    id: EVENTS.length + 1, title, date,
    time:         document.getElementById('ae_time').value,
    venue:        document.getElementById('ae_venue').value,
    type:         document.getElementById('ae_type').value,
    status:       'Upcoming',
    attendees:    0,
    maxAttendees: parseInt(document.getElementById('ae_max').value) || 200
  });
  closeForcedModal();
  renderCache.delete('events');
  renderEvents();
  showToast('Event created!', 'success');
}

function markCompleted(id) {
  const e = EVENTS.find(x => x.id === id);
  if (!e) return;
  e.status = 'Completed';
  e.attendees = Math.floor(e.maxAttendees * 0.7);
  renderCache.delete('events');
  renderEvents();
  showToast('Event marked as completed!', 'success');
}

function editEvent(id) {
  const e = EVENTS.find(x => x.id === id);
  if (!e) return;
  openModal(`
    <div class="modal-header">
      <h3>✏️ Edit Event</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Title</label><input id="ee_title" value="${e.title}" /></div>
    <div class="form-field"><label>Venue</label><input id="ee_venue" value="${e.venue}" /></div>
    <div class="form-field"><label>Date</label><input id="ee_date" type="date" value="${e.date}" /></div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEventEdit(${id})">Save</button>
    </div>
  `);
}

function saveEventEdit(id) {
  const e = EVENTS.find(x => x.id === id);
  if (!e) return;
  e.title = document.getElementById('ee_title').value;
  e.venue = document.getElementById('ee_venue').value;
  e.date  = document.getElementById('ee_date').value;
  closeForcedModal();
  renderCache.delete('events');
  renderEvents();
  showToast('Event updated!', 'success');
}

function deleteEvent(id) {
  const idx = EVENTS.findIndex(x => x.id === id);
  if (idx !== -1) EVENTS.splice(idx, 1);
  renderCache.delete('events');
  renderEvents();
  showToast('Event deleted.', 'error');
}