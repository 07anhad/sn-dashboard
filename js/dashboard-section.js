/* ============================================================
   DASHBOARD-SECTION.JS — Dashboard Stats & Overview
   ============================================================ */

'use strict';

function renderDashboard() {
  const container = document.getElementById('dashboardContent');
  const s = DASH_STATS;

  container.innerHTML = `
    <!-- Member stats -->
    <div class="sub-heading">Member Overview</div>
    <div class="stats-grid">
      ${statCard(s.totalMembers,     'Total Members',      'More info',    'accent-saffron', 'members')}
      ${statCard(s.activeMembers,    'Active Members',     'More info',    'accent-green',   'members')}
      ${statCard(s.transferIn,       'Transfer In',        'More info',    'accent-blue',    'members')}
      ${statCard(s.transferOut,      'Transfer Out',       'More info',    'accent-purple',  'members')}
      ${statCard(s.expired,          'Expired',            'More info',    'accent-red',     'members')}
      ${statCard(s.pendingApprovals, 'Pending Approvals',  'More info',    'accent-gold',    'members')}
      ${statCard(s.activeRegLinks,   'Active Reg. Links',  'More info',    'accent-teal',    'registration')}
    </div>

    <!-- Zone stats -->
    <div class="sub-heading">Zone Statistics</div>
    <div class="info-grid">
      ${infoCard(s.activeZones,      'Active Zones',         'View All',       'zones')}
      ${infoCard(s.inactiveZones,    'Inactive Zones',       'Manage',         'zones')}
      ${infoCard(s.membersWithZone,  'Members with Zone',    'View Members',   'members')}
    </div>

    <!-- Branch stats -->
    <div class="sub-heading">Branch Code Statistics</div>
    <div class="info-grid">
      ${infoCard(s.activeBranchCodes,   'Active Branch Codes',     'View All',     'branches')}
      ${infoCard(s.inactiveBranchCodes, 'Inactive Branch Codes',   'Manage',       'branches')}
      ${infoCard(s.membersWithBranch,   'Members with Branch Code','View Members', 'members')}
    </div>
  `;

  // Wire click navigation
  container.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.goto));
  });
}

function statCard(value, label, linkText, accent, goto) {
  return `
    <div class="stat-card ${accent}" data-goto="${goto}">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value.toLocaleString()}</div>
      <div class="stat-link">${linkText} →</div>
    </div>
  `;
}

function infoCard(value, label, action, goto) {
  return `
    <div class="info-card">
      <h4>${label}</h4>
      <div class="info-num">${value.toLocaleString()}</div>
      <span class="info-action" data-goto="${goto}">${action}</span>
    </div>
  `;
}