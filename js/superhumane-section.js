'use strict';

function renderMyChildren() {
  const container = document.getElementById('myChildrenContent');
  const user = getCurrentUser();
  const uid = user?.memberUid;

  if (!uid) {
    container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--txt-muted);font-size:1rem;">No member UID is linked to your account.</div>';
    return;
  }

  container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--txt-muted);">Loading…</div>';

  fetch(`/api/my-children?uid=${encodeURIComponent(uid)}`)
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        container.innerHTML = `<div class="alert alert-error">${data.error || 'Failed to load children.'}</div>`;
        return;
      }
      const children = data.children || [];
      if (children.length === 0) {
        container.innerHTML = '<div style="padding:60px;text-align:center;color:var(--txt-muted);font-size:1rem;">No children are registered under your UID in the Sant-Su scheme.</div>';
        return;
      }
      container.innerHTML = renderChildrenCards(children);
    })
    .catch(err => {
      container.innerHTML = `<div class="alert alert-error">Network error: ${err.message}</div>`;
    });
}

function renderChildrenCards(children) {
  const cards = children.map(c => {
    const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const gender = c.gender === 'M' ? 'Male' : c.gender === 'F' ? 'Female' : c.gender || '—';
    const statusBadge = c.date_exit_scheme
      ? '<span style="background:var(--clr-danger,#e05252);color:#fff;padding:2px 8px;border-radius:12px;font-size:0.72rem;">Exited</span>'
      : '<span style="background:var(--clr-success,#27ae60);color:#fff;padding:2px 8px;border-radius:12px;font-size:0.72rem;">Active</span>';
    const rf = (label, val) => val ? `<div><span style="color:var(--txt-muted);font-size:0.76rem;">${esc(label)}</span><br><strong style="font-size:0.84rem;">${esc(String(val))}</strong></div>` : '';
    const sec = title => `<div style="grid-column:1/-1;font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--txt-muted);margin-top:10px;padding-top:8px;border-top:1px solid var(--border);">${title}</div>`;

    return `
      <div class="card" style="margin-bottom:var(--sp-lg);padding:var(--sp-lg);max-width:900px;margin-left:auto;margin-right:auto;">\n
        <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;">
          <div style="
            width:52px;height:52px;border-radius:50%;
            background:var(--clr-saffron,#e07b29);
            color:#fff;display:flex;align-items:center;justify-content:center;
            font-size:1.4rem;font-weight:600;flex-shrink:0;
          ">${(c.name || '?').charAt(0).toUpperCase()}</div>

          <div style="flex:1;min-width:200px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
              <span style="font-size:1.05rem;font-weight:600;color:var(--txt-primary);">${esc(c.name || '—')}</span>
              ${statusBadge}
            </div>
            <div style="font-size:0.8rem;color:var(--txt-muted);margin-bottom:12px;">
              UID: <code style="font-size:0.78rem;">${esc(c.uid || '—')}</code>
              &nbsp;|&nbsp; ${esc(c.member_type || '—')}
              &nbsp;|&nbsp; BSL: ${esc(String(c.bsl || '—'))}
              &nbsp;|&nbsp; Phase ${c.phase || '—'}
              &nbsp;|&nbsp; ${esc(c.branch || '—')}
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px 16px;">
              ${sec('Child Details')}
              ${rf('Gender', gender)}
              ${rf('Date of Birth', fmt(c.date_of_birth))}
              ${rf('Scheme Entry', fmt(c.date_entry_scheme))}
              ${rf('Scheme Exit', c.date_exit_scheme ? fmt(c.date_exit_scheme) : 'Active')}
              ${rf('UID Check', c.uid_check)}
              ${rf('Form Check', c.form_check)}
              ${rf('Comments', c.comments)}
              ${rf('Address', c.address)}

              ${sec('Father')}
              ${rf('Name', c.father_name)}
              ${rf('UID', c.father_uid)}
              ${rf('Contact', c.father_contact)}
              ${rf('DOI / DOR', fmt(c.father_doi))}

              ${sec('Mother')}
              ${rf('Name', c.mother_name)}
              ${rf('UID', c.mother_uid)}
              ${rf('Contact', c.mother_contact)}
              ${rf('DOI / DOR', fmt(c.mother_doi))}

              ${(c.grandfather_name || c.grandfather_uid) ? sec('Grandfather') : ''}
              ${rf('Name', c.grandfather_name)}
              ${rf('UID', c.grandfather_uid)}
              ${rf('Contact', c.grandfather_contact)}

              ${(c.grandmother_name || c.grandmother_uid) ? sec('Grandmother') : ''}
              ${rf('Name', c.grandmother_name)}
              ${rf('UID', c.grandmother_uid)}
              ${rf('Contact', c.grandmother_contact)}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  return `
    <div style="margin-bottom:var(--sp-md);">
      <span style="font-size:0.9rem;color:var(--txt-muted);">${children.length} child${children.length !== 1 ? 'ren' : ''} registered</span>
    </div>
    ${cards}`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function checkAndShowChildrenNav() {
  const user = getCurrentUser();
  const uid = user?.memberUid;
  const navLi = document.getElementById('nav-children-li');
  if (!navLi) return;

  if (!uid || isAdmin()) {
    navLi.style.display = 'none';
    return;
  }

  try {
    const r = await fetch(`/api/my-children?uid=${encodeURIComponent(uid)}`);
    const data = await r.json();
    navLi.style.display = (data.ok && data.children && data.children.length > 0) ? '' : 'none';
  } catch {
    navLi.style.display = 'none';
  }
}