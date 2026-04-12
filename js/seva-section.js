/* ============================================================
   SEVA-SECTION.JS — Seva Category Master Management
   ============================================================ */

'use strict';

function renderSeva() {
  const container = document.getElementById('sevaContent');
  if (!isAdmin()) { container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--clr-red);font-size:1.1rem;">⛔ Access Denied — Admin only.</div>'; return; }
  const cats = SEVA_CATEGORIES;

  container.innerHTML = `
    <div class="table-wrap">
      <div class="table-toolbar">
        <div>
          <span class="table-title">Seva Categories</span>
          <span class="table-count">${cats.length}</span>
        </div>
        <div class="table-actions">
          ${isAdmin() ? '<button class="toolbar-btn toolbar-btn-saffron" onclick="openAddSevaModal()">+ Add Category</button>' : ''}
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Sort Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="sevaTableBody"></tbody>
        </table>
      </div>
    </div>
  `;

  renderSevaTable();
}

function renderSevaTable() {
  const tbody = document.getElementById('sevaTableBody');
  const cats = SEVA_CATEGORIES;

  if (!cats.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No seva categories found.</td></tr>';
    return;
  }

  tbody.innerHTML = cats.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.name}</td>
      <td>${c.description}</td>
      <td>${c.sortOrder}</td>
      <td><span class="badge ${c.active ? 'badge-green' : 'badge-red'}">${c.active ? 'Active' : 'Inactive'}</span></td>
      <td>
        ${isAdmin() ? `<button class="action-btn" onclick="editSeva(${c.id})">✎</button>` : ''}
        ${isAdmin() ? `<button class="action-btn action-btn-danger" onclick="toggleSevaStatus(${c.id})">${c.active ? '✕' : '✓'}</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function openAddSevaModal() {
  showSevaModal('Add Seva Category', { id: null, name: '', description: '', active: true, sortOrder: SEVA_CATEGORIES.length + 1 });
}

function editSeva(id) {
  const cat = SEVA_CATEGORIES.find(c => c.id === id);
  if (cat) showSevaModal('Edit Seva Category', { ...cat });
}

function showSevaModal(title, cat) {
  const box = document.getElementById('modalBox');
  box.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" onclick="closeModal(event)">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Category Name</label>
        <input type="text" id="sevaName" value="${cat.name}" placeholder="Enter category name" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <input type="text" id="sevaDesc" value="${cat.description}" placeholder="Enter description" />
      </div>
      <div class="form-group">
        <label>Sort Order</label>
        <input type="number" id="sevaSortOrder" value="${cat.sortOrder}" min="1" />
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="sevaActive">
          <option value="true" ${cat.active ? 'selected' : ''}>Active</option>
          <option value="false" ${!cat.active ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal(event)">Cancel</button>
      <button class="btn btn-primary" onclick="saveSeva(${cat.id})">Save</button>
    </div>
  `;
  document.getElementById('modal-overlay').style.display = 'flex';
}

function saveSeva(id) {
  const name   = document.getElementById('sevaName').value.trim();
  const desc   = document.getElementById('sevaDesc').value.trim();
  const sort   = parseInt(document.getElementById('sevaSortOrder').value, 10);
  const active = document.getElementById('sevaActive').value === 'true';

  if (!name) return alert('Category name is required.');

  if (id) {
    const cat = SEVA_CATEGORIES.find(c => c.id === id);
    if (cat) {
      cat.name = name;
      cat.description = desc;
      cat.sortOrder = sort;
      cat.active = active;
    }
  } else {
    const newId = SEVA_CATEGORIES.length ? Math.max(...SEVA_CATEGORIES.map(c => c.id)) + 1 : 1;
    SEVA_CATEGORIES.push({ id: newId, name, description: desc, active, sortOrder: sort });
  }

  document.getElementById('modal-overlay').style.display = 'none';
  renderSevaTable();
}

function toggleSevaStatus(id) {
  const cat = SEVA_CATEGORIES.find(c => c.id === id);
  if (cat) {
    cat.active = !cat.active;
    renderSevaTable();
  }
}
