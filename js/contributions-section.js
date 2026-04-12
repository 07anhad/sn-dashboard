/* ============================================================
   CONTRIBUTIONS-SECTION.JS
   ============================================================ */

'use strict';

function renderContributions() {
  const container = document.getElementById('contributionsContent');
  const total     = CONTRIBUTIONS.reduce((a, c) => a + c.amount, 0);
  const received  = CONTRIBUTIONS.filter(c => c.status === 'Received').reduce((a, c) => a + c.amount, 0);
  const pending   = CONTRIBUTIONS.filter(c => c.status === 'Pending').reduce((a, c) => a + c.amount, 0);

  // Category breakdown
  const byCat = {};
  CONTRIBUTIONS.forEach(c => { byCat[c.category] = (byCat[c.category] || 0) + c.amount; });

  container.innerHTML = `
    <!-- Summary -->
    <div class="contrib-summary">
      <div class="contrib-card">
        <h4>Total Contributions</h4>
        <div class="amount">${formatCurrency(total)}</div>
      </div>
      <div class="contrib-card" style="border-left-color:var(--clr-green)">
        <h4>Received</h4>
        <div class="amount" style="color:var(--clr-green)">${formatCurrency(received)}</div>
      </div>
      <div class="contrib-card" style="border-left-color:var(--clr-saffron)">
        <h4>Pending</h4>
        <div class="amount" style="color:var(--clr-saffron-dk)">${formatCurrency(pending)}</div>
      </div>
      <div class="contrib-card" style="border-left-color:var(--clr-blue)">
        <h4>Total Entries</h4>
        <div class="amount" style="color:var(--clr-blue)">${CONTRIBUTIONS.length}</div>
      </div>
    </div>

    <!-- Category breakdown -->
    <div class="sub-heading">By Category</div>
    <div style="display:flex;gap:var(--sp-sm);flex-wrap:wrap;margin-bottom:var(--sp-xl)">
      ${Object.entries(byCat).map(([cat, amt]) => `
        <div class="card" style="min-width:160px;padding:var(--sp-md)">
          <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;color:var(--txt-muted);margin-bottom:4px">${cat}</div>
          <div style="font-size:1.4rem;font-weight:700;color:var(--clr-navy);font-family:var(--font-display)">${formatCurrency(amt)}</div>
        </div>
      `).join('')}
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div class="table-toolbar">
        <div>
          <span class="table-title">All Contributions</span>
          <span class="table-count">${CONTRIBUTIONS.length} records</span>
        </div>
        <button class="toolbar-btn toolbar-btn-saffron" onclick="openAddContribModal()">+ Add Contribution</button>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Member Name</th><th>Member ID</th><th>Amount</th>
              <th>Category</th><th>Date</th><th>Mode</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${CONTRIBUTIONS.map((c, i) => `
              <tr>
                <td>${i+1}</td>
                <td><strong>${c.memberName}</strong></td>
                <td><code style="font-size:0.78rem;color:var(--clr-navy-mid)">${c.memberId}</code></td>
                <td><strong style="color:var(--clr-green)">${formatCurrency(c.amount)}</strong></td>
                <td>${c.category}</td>
                <td>${formatDate(c.date)}</td>
                <td><span class="badge badge-info">${c.mode}</span></td>
                <td>${c.status === 'Received' ? '<span class="badge badge-success">Received</span>' : '<span class="badge badge-warning">Pending</span>'}</td>
                <td>
                  <div class="td-actions">
                    <button class="tbl-btn tbl-btn-view" onclick="viewContrib(${c.id})">View</button>
                    <button class="tbl-btn tbl-btn-delete" onclick="deleteContrib(${c.id})">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function viewContrib(id) {
  const c = CONTRIBUTIONS.find(x => x.id === id);
  if (!c) return;
  openModal(`
    <div class="modal-header">
      <h3>💛 Contribution Details</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md)">
      ${modalField('Member Name', c.memberName)}
      ${modalField('Member ID', c.memberId)}
      ${modalField('Amount', formatCurrency(c.amount))}
      ${modalField('Category', c.category)}
      ${modalField('Date', formatDate(c.date))}
      ${modalField('Mode', c.mode)}
      ${modalField('Status', c.status)}
    </div>
    <div style="margin-top:var(--sp-lg);text-align:right">
      <button class="btn btn-primary" onclick="closeForcedModal()">Close</button>
    </div>
  `);
}

function openAddContribModal() {
  openModal(`
    <div class="modal-header">
      <h3>➕ Add Contribution</h3>
      <button class="modal-close" onclick="closeForcedModal()">✕</button>
    </div>
    <div class="form-field"><label>Member Name *</label><input id="ac_name" placeholder="Member full name" /></div>
    <div class="form-field"><label>Member ID *</label><input id="ac_mid" placeholder="e.g. UID001" /></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md)">
      <div class="form-field"><label>Amount (₹) *</label><input id="ac_amt" type="number" placeholder="0" /></div>
      <div class="form-field"><label>Date *</label><input id="ac_date" type="date" value="${new Date().toISOString().split('T')[0]}" /></div>
    </div>
    <div class="form-field">
      <label>Category</label>
      <select id="ac_cat">
        ${SEVA_CATEGORIES.filter(s=>s.active).map(s=>`<option>${s.name}</option>`).join('')}
      </select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md)">
      <div class="form-field">
        <label>Mode</label>
        <select id="ac_mode">
          <option>Online Transfer</option><option>Cash</option><option>Cheque</option><option>UPI</option>
        </select>
      </div>
      <div class="form-field">
        <label>Status</label>
        <select id="ac_status"><option>Received</option><option>Pending</option></select>
      </div>
    </div>
    <div style="margin-top:var(--sp-lg);display:flex;gap:var(--sp-sm);justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeForcedModal()">Cancel</button>
      <button class="btn btn-saffron" onclick="saveNewContrib()">Add</button>
    </div>
  `);
}

function saveNewContrib() {
  const name = document.getElementById('ac_name').value.trim();
  const mid  = document.getElementById('ac_mid').value.trim();
  const amt  = parseFloat(document.getElementById('ac_amt').value);
  if (!name || !mid || !amt) { showToast('Name, ID, and amount required!', 'error'); return; }
  CONTRIBUTIONS.push({
    id: CONTRIBUTIONS.length + 1,
    memberName: name, memberId: mid, amount: amt,
    category: document.getElementById('ac_cat').value,
    date:     document.getElementById('ac_date').value,
    status:   document.getElementById('ac_status').value,
    mode:     document.getElementById('ac_mode').value
  });
  closeForcedModal();
  renderCache.delete('contributions');
  renderContributions();
  showToast('Contribution recorded!', 'success');
}

function deleteContrib(id) {
  const idx = CONTRIBUTIONS.findIndex(x => x.id === id);
  if (idx !== -1) CONTRIBUTIONS.splice(idx, 1);
  renderCache.delete('contributions');
  renderContributions();
  showToast('Entry deleted.', 'error');
}