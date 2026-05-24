/* ============================================================
   ROUTER.JS — Section Navigation & Sidebar Toggle
   ============================================================ */

'use strict';

// Section → renderer mapping
const SECTION_RENDERERS = {
  'dashboard':       renderDashboard,
  'change-password': renderChangePassword,
  'members':         renderMembers,
  'registration':    renderRegistration,
  'announcements':   renderAnnouncements,
  'attendance':      renderAttendance,
  'my-children':     renderMyChildren
};

function getSectionTitle(section) {
  const adminTitles = { members: 'Members', attendance: 'Attendance / Haazri' };
  const memberTitles = { members: 'My Profile', attendance: 'My Attendance' };
  const base = {
    'dashboard':       'Dashboard',
    'change-password': 'Change Password',
    'members':         'Members',
    'registration':    'Registration Links',
    'announcements':   'Announcements',
    'attendance':      'Attendance / Haazri',
    'my-children':     'My Children'
  };
  if (!isAdmin() && memberTitles[section]) return memberTitles[section];
  return base[section] || section;
}

let currentSection = 'dashboard';
let renderCache    = new Set();

// ── Init router on DOM ready ───────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Wire nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const section = el.dataset.section;
      navigateTo(section);
      // Close sidebar on mobile
      if (window.innerWidth <= 900) closeSidebar();
    });
  });

  // Load all data from API before rendering
  try {
    await loadAllData();
  } catch (err) {
    // Error screen is already shown by loadAllData; stop init
    return;
  }

  // Hide loader
  const loader = document.getElementById('appLoader');
  if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.style.display = 'none', 350); }

  // Show admin-only nav items for admins
  document.querySelectorAll('.admin-only-nav').forEach(el => {
    el.style.display = isAdmin() ? '' : 'none';
  });

  // Show member-visible nav items for all logged-in users
  document.querySelectorAll('.member-visible-nav').forEach(el => {
    el.style.display = '';
  });

  // Show/hide children nav based on whether this member has children in superhumane
  checkAndShowChildrenNav();

  // For admins: restore original label text
  if (isAdmin()) {
    const membersLink = document.querySelector('[data-section="members"]');
    if (membersLink) membersLink.querySelector('span:last-child').textContent = 'Members';
    const attLink = document.querySelector('[data-section="attendance"]');
    if (attLink) attLink.querySelector('span:last-child').textContent = 'Attendance / Haazri';
  }

  // Render initial section
  navigateTo('dashboard');
});

// ── Navigate to a section ──────────────────
function navigateTo(section) {
  if (!SECTION_RENDERERS[section]) return;

  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  // Show target
  const el = document.getElementById('section-' + section);
  if (el) el.classList.add('active');

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.section === section);
  });

  // Update topbar title
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = getSectionTitle(section);

  currentSection = section;

  // Non-admin members: profile/attendance always re-render (modal-based, no cache)
  const noCache = !isAdmin() && (section === 'members' || section === 'attendance');

  // Render if not cached
  if (noCache || !renderCache.has(section)) {
    SECTION_RENDERERS[section]();
    if (!noCache) renderCache.add(section);
  }
}

// ── Sidebar toggle (mobile) ────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ── Dark / Light Theme ─────────────────────
(function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  // Button icon updated after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
  });
})();

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next   = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

// ── Re-render a section (e.g. after data change) ─
function reRenderSection(section) {
  renderCache.delete(section);
  if (currentSection === section) {
    SECTION_RENDERERS[section]();
    renderCache.add(section);
  }
}
