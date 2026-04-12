/* ============================================================
   ROUTER.JS — Section Navigation & Sidebar Toggle
   ============================================================ */

'use strict';

// Section → renderer mapping
const SECTION_RENDERERS = {
  'dashboard':       renderDashboard,
  'change-password': renderChangePassword,
  'members':         renderMembers,
  'zones':           renderZones,
  'branches':        renderBranches,
  'registration':    renderRegistration,
  'contributions':   renderContributions,
  'events':          renderEvents,
  'announcements':   renderAnnouncements,
  'seva':            renderSeva
};

const SECTION_TITLES = {
  'dashboard':       'Dashboard',
  'change-password': 'Change Password',
  'members':         'Members',
  'zones':           'Zone Management',
  'branches':        'Branch Code Management',
  'registration':    'Registration Links',
  'contributions':   'Contributions',
  'events':          'All Events',
  'announcements':   'Announcements',
  'seva':            'Seva Category Master'
};

let currentSection = 'dashboard';
let renderCache    = new Set();

// ── Init router on DOM ready ───────────────
document.addEventListener('DOMContentLoaded', () => {
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

// ── Re-render a section (e.g. after data change) ─
function reRenderSection(section) {
  renderCache.delete(section);
  if (currentSection === section) {
    SECTION_RENDERERS[section]();
    renderCache.add(section);
  }
}