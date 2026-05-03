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
  'attendance':      renderAttendance
};

const SECTION_TITLES = {
  'dashboard':       'Dashboard',
  'change-password': 'Change Password',
  'members':         'Members',
  'registration':    'Registration Links',
  'announcements':   'Announcements',
  'attendance':      'Attendance / Haazri'
};

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
  await loadAllData();

  // Hide loader
  const loader = document.getElementById('appLoader');
  if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.style.display = 'none', 350); }

  // Show admin-only nav items for admins
  document.querySelectorAll('.admin-only-nav').forEach(el => {
    el.style.display = isAdmin() ? '' : 'none';
  });

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
  if (titleEl) titleEl.textContent = SECTION_TITLES[section] || section;

  currentSection = section;

  // Render if not cached
  if (!renderCache.has(section)) {
    SECTION_RENDERERS[section]();
    renderCache.add(section);
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