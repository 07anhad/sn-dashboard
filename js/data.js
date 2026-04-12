/* ============================================================
   DATA.JS — All Mock Data
   ============================================================ */

'use strict';

// ── Dashboard Stats ───────────────────────
const DASH_STATS = {
  totalMembers:       1604,
  activeMembers:      1602,
  transferIn:         0,
  transferOut:        2,
  expired:            0,
  pendingApprovals:   3,
  activeRegLinks:     12,
  activeZones:        1,
  inactiveZones:      0,
  membersWithZone:    1,
  activeBranchCodes:  3,
  inactiveBranchCodes:0,
  membersWithBranch:  1600
};

// ── Zones ─────────────────────────────────
const ZONES = [
  { id: 1, name: 'Vasant Kunj',  code: 'VK',  active: true,  memberCount: 1, incharge: 'Ramesh Kumar',  phone: '9810012345' },
  { id: 2, name: 'Dwarka',       code: 'DW',  active: false, memberCount: 0, incharge: 'Sunita Arora',  phone: '9811098765' },
  { id: 3, name: 'Rohini',       code: 'RH',  active: false, memberCount: 0, incharge: 'Mahesh Singh',  phone: '9812034567' }
];

// ── Branch Codes ──────────────────────────
const BRANCHES = [
  { id: 1, code: 'BR-001', name: 'Main Branch Delhi',    zone: 'Vasant Kunj', active: true,  memberCount: 850 },
  { id: 2, code: 'BR-002', name: 'South Delhi Branch',   zone: 'Vasant Kunj', active: true,  memberCount: 450 },
  { id: 3, code: 'BR-003', name: 'West Delhi Branch',    zone: 'Dwarka',      active: true,  memberCount: 300 },
  { id: 4, code: 'BR-004', name: 'North Delhi Branch',   zone: 'Rohini',      active: false, memberCount: 0   }
];

// ── Member Types ──────────────────────────
const MEMBER_TYPES = [
  'Sant Su Ph-I', 'Sant Su Ph-II', 'Sant Su P-I', 'Sant Su P-II',
  'Satsangi Children', 'Jr. Pre Initiate', 'Sr. Pre Initiate',
  'CCA', 'CRC', 'Associate', 'YA Member', 'YA Member MA Member',
  'Initiated Gents Member', 'Initiated Ladies Member',
  'Jigyasu Member', 'Children', 'Others', 'Visitors(Long Term)'
];

// ── Members ───────────────────────────────
const MEMBERS = [
  { uid: 'UID001', bslno: 'BSL-0001', name: 'Rajesh Kumar',       email: 'rajesh.k@email.com',    mobile: '9810011111', zone: 'Vasant Kunj', type: 'Initiated Gents Member', status: 'Active', approvalStatus: 'Approved', joinDate: '2018-03-15' },
  { uid: 'UID002', bslno: 'BSL-0002', name: 'Sunita Devi',        email: 'sunita.d@email.com',    mobile: '9810022222', zone: 'Vasant Kunj', type: 'Initiated Ladies Member', status: 'Active', approvalStatus: 'Approved', joinDate: '2018-05-20' },
  { uid: 'UID003', bslno: 'BSL-0003', name: 'Arun Sharma',        email: 'arun.s@email.com',      mobile: '9810033333', zone: 'Vasant Kunj', type: 'Satsangi Children',        status: 'Active', approvalStatus: 'Approved', joinDate: '2019-01-10' },
  { uid: 'UID004', bslno: 'BSL-0004', name: 'Priya Verma',        email: 'priya.v@email.com',     mobile: '9810044444', zone: 'Vasant Kunj', type: 'Sr. Pre Initiate',          status: 'Active', approvalStatus: 'Approved', joinDate: '2019-07-22' },
  { uid: 'UID005', bslno: 'BSL-0005', name: 'Mohan Lal',          email: 'mohan.l@email.com',     mobile: '9810055555', zone: 'Vasant Kunj', type: 'CCA',                       status: 'Active', approvalStatus: 'Pending',  joinDate: '2024-10-01' },
  { uid: 'UID006', bslno: 'BSL-0006', name: 'Kavitha Rajan',      email: 'kavitha.r@email.com',   mobile: '9810066666', zone: 'Vasant Kunj', type: 'Associate',                 status: 'Active', approvalStatus: 'Approved', joinDate: '2020-03-12' },
  { uid: 'UID007', bslno: 'BSL-0007', name: 'Deepak Nair',        email: 'deepak.n@email.com',    mobile: '9810077777', zone: 'Vasant Kunj', type: 'Jr. Pre Initiate',           status: 'Active', approvalStatus: 'Pending',  joinDate: '2024-11-05' },
  { uid: 'UID008', bslno: 'BSL-0008', name: 'Anita Singh',        email: 'anita.s@email.com',     mobile: '9810088888', zone: 'Vasant Kunj', type: 'YA Member',                 status: 'Active', approvalStatus: 'Approved', joinDate: '2021-08-30' },
  { uid: 'UID009', bslno: 'BSL-0009', name: 'Vikram Mishra',      email: 'vikram.m@email.com',    mobile: '9810099999', zone: 'Vasant Kunj', type: 'Initiated Gents Member',    status: 'Active', approvalStatus: 'Approved', joinDate: '2017-12-01' },
  { uid: 'UID010', bslno: 'BSL-0010', name: 'Rekha Pandey',       email: 'rekha.p@email.com',     mobile: '9810010101', zone: 'Vasant Kunj', type: 'Initiated Ladies Member',   status: 'Active', approvalStatus: 'Approved', joinDate: '2017-12-15' },
  { uid: 'UID011', bslno: 'BSL-0011', name: 'Suresh Gupta',       email: 'suresh.g@email.com',    mobile: '9810011011', zone: 'Vasant Kunj', type: 'CRC',                       status: 'Active', approvalStatus: 'Pending',  joinDate: '2024-12-01' },
  { uid: 'UID012', bslno: 'BSL-0012', name: 'Meena Tripathi',     email: 'meena.t@email.com',     mobile: '9810012012', zone: 'Vasant Kunj', type: 'Jigyasu Member',            status: 'Active', approvalStatus: 'Approved', joinDate: '2022-04-18' },
  { uid: 'UID013', bslno: 'BSL-0013', name: 'Harish Chandra',     email: 'harish.c@email.com',    mobile: '9810013013', zone: 'Vasant Kunj', type: 'Sant Su Ph-I',              status: 'Active', approvalStatus: 'Approved', joinDate: '2016-06-01' },
  { uid: 'UID014', bslno: 'BSL-0014', name: 'Geeta Bose',         email: 'geeta.b@email.com',     mobile: '9810014014', zone: 'Vasant Kunj', type: 'Initiated Ladies Member',   status: 'Expired',approvalStatus: 'Expired',  joinDate: '2015-01-10' },
  { uid: 'UID015', bslno: 'BSL-0015', name: 'Naresh Yadav',       email: 'naresh.y@email.com',    mobile: '9810015015', zone: 'Vasant Kunj', type: 'Others',                    status: 'Active', approvalStatus: 'Rejected', joinDate: '2024-09-14' },
  { uid: 'UID016', bslno: 'BSL-0016', name: 'Shanti Devi',        email: 'shanti.d@email.com',    mobile: '9810016016', zone: 'Vasant Kunj', type: 'Sant Su Ph-II',             status: 'Active', approvalStatus: 'Approved', joinDate: '2018-11-20' },
  { uid: 'UID017', bslno: 'BSL-0017', name: 'Alok Saxena',        email: 'alok.s@email.com',      mobile: '9810017017', zone: 'Vasant Kunj', type: 'Visitors(Long Term)',       status: 'Active', approvalStatus: 'Approved', joinDate: '2023-03-05' },
  { uid: 'UID018', bslno: 'BSL-0018', name: 'Pooja Malhotra',     email: 'pooja.m@email.com',     mobile: '9810018018', zone: 'Vasant Kunj', type: 'YA Member MA Member',       status: 'Active', approvalStatus: 'Approved', joinDate: '2022-07-19' },
  { uid: 'UID019', bslno: 'BSL-0019', name: 'Ravi Kumar',         email: 'ravi.k@email.com',      mobile: '9810019019', zone: 'Vasant Kunj', type: 'Initiated Gents Member',    status: 'Active', approvalStatus: 'Approved', joinDate: '2019-09-09' },
  { uid: 'UID020', bslno: 'BSL-0020', name: 'Lata Joshi',         email: 'lata.j@email.com',      mobile: '9810020020', zone: 'Vasant Kunj', type: 'Children',                  status: 'Active', approvalStatus: 'Approved', joinDate: '2021-02-28' }
];

// ── Registration Links ────────────────────
const REG_LINKS = [
  { id: 1, title: 'General Membership 2025',       code: 'GEN2025',  url: 'https://satsang.org/register/GEN2025',  active: true,  maxUses: 500, usedCount: 234, expiry: '2025-12-31', createdOn: '2025-01-01' },
  { id: 2, title: 'Youth Registration Q1',         code: 'YA-Q1',    url: 'https://satsang.org/register/YA-Q1',   active: true,  maxUses: 100, usedCount: 67,  expiry: '2025-03-31', createdOn: '2025-01-01' },
  { id: 3, title: 'Vasant Kunj Zone Sign-up',      code: 'VK-ZONE',  url: 'https://satsang.org/register/VK-ZONE', active: true,  maxUses: 200, usedCount: 180, expiry: '2025-06-30', createdOn: '2024-12-01' },
  { id: 4, title: 'New Satsangi Onboarding',       code: 'NEW-SAT',  url: 'https://satsang.org/register/NEW-SAT', active: true,  maxUses: 300, usedCount: 89,  expiry: '2025-09-30', createdOn: '2025-01-15' },
  { id: 5, title: 'Initiation Batch Mar 2025',     code: 'INIT-MAR', url: 'https://satsang.org/register/INIT-MAR',active: true,  maxUses: 50,  usedCount: 12,  expiry: '2025-03-20', createdOn: '2025-02-01' },
  { id: 6, title: 'Expired Link 2024',             code: 'EXP2024',  url: 'https://satsang.org/register/EXP2024', active: false, maxUses: 100, usedCount: 100, expiry: '2024-12-31', createdOn: '2024-01-01' }
];

// ── Contributions ─────────────────────────
const CONTRIBUTIONS = [
  { id: 1, memberName: 'Rajesh Kumar',   memberId: 'UID001', amount: 5000,  category: 'Monthly Seva',     date: '2025-01-05', status: 'Received', mode: 'Online Transfer' },
  { id: 2, memberName: 'Sunita Devi',    memberId: 'UID002', amount: 2500,  category: 'Langar Fund',      date: '2025-01-10', status: 'Received', mode: 'Cash'           },
  { id: 3, memberName: 'Vikram Mishra',  memberId: 'UID009', amount: 10000, category: 'Building Fund',    date: '2025-01-12', status: 'Received', mode: 'Cheque'         },
  { id: 4, memberName: 'Rekha Pandey',   memberId: 'UID010', amount: 1100,  category: 'Monthly Seva',     date: '2025-01-15', status: 'Received', mode: 'Online Transfer' },
  { id: 5, memberName: 'Harish Chandra', memberId: 'UID013', amount: 7500,  category: 'Special Donation', date: '2025-01-20', status: 'Received', mode: 'Cheque'         },
  { id: 6, memberName: 'Kavitha Rajan',  memberId: 'UID006', amount: 3000,  category: 'Monthly Seva',     date: '2025-02-01', status: 'Pending',  mode: 'Online Transfer' },
  { id: 7, memberName: 'Anita Singh',    memberId: 'UID008', amount: 500,   category: 'Langar Fund',      date: '2025-02-05', status: 'Received', mode: 'Cash'           },
  { id: 8, memberName: 'Shanti Devi',    memberId: 'UID016', amount: 2000,  category: 'Building Fund',    date: '2025-02-08', status: 'Received', mode: 'Online Transfer' }
];

// ── Events ────────────────────────────────
const EVENTS = [
  { id: 1, title: 'Monthly Satsang — March',    date: '2025-03-15', time: '06:00 AM', venue: 'Main Hall, Vasant Kunj', type: 'Satsang',     status: 'Upcoming',    attendees: 0,   maxAttendees: 500 },
  { id: 2, title: 'Holi Satsang 2025',          date: '2025-03-14', time: '07:00 AM', venue: 'Garden Area, VK',        type: 'Festival',    status: 'Upcoming',    attendees: 0,   maxAttendees: 800 },
  { id: 3, title: 'Weekly Satsang 9 Mar',       date: '2025-03-09', time: '06:30 AM', venue: 'Main Hall, Vasant Kunj', type: 'Satsang',     status: 'Completed',   attendees: 320, maxAttendees: 500 },
  { id: 4, title: 'Initiation Ceremony Feb',    date: '2025-02-23', time: '09:00 AM', venue: 'Prayer Hall',            type: 'Ceremony',    status: 'Completed',   attendees: 45,  maxAttendees: 60  },
  { id: 5, title: 'New Member Orientation',     date: '2025-02-16', time: '10:00 AM', venue: 'Conference Room',        type: 'Orientation', status: 'Completed',   attendees: 28,  maxAttendees: 40  },
  { id: 6, title: 'Annual Meditation Camp',     date: '2025-04-10', time: '05:00 AM', venue: 'Retreat Center',         type: 'Camp',        status: 'Upcoming',    attendees: 0,   maxAttendees: 200 }
];

// ── Announcements ─────────────────────────
const ANNOUNCEMENTS = [
  { id: 1, title: 'Holi Satsang Notice',         content: 'The Holi Satsang on 14th March will begin at 7 AM sharp. All members are requested to be present by 6:45 AM. Prasad distribution after the programme.',           date: '2025-03-05', author: 'Admin',         priority: 'high',   active: true  },
  { id: 2, title: 'New Registration Process',    content: 'Effective April 1st, all new member registrations must go through the online portal. Physical forms will no longer be accepted. Existing members are unaffected.',  date: '2025-02-28', author: 'Admin',         priority: 'medium', active: true  },
  { id: 3, title: 'Meditation Schedule Update',  content: 'Weekly meditation sessions will now be held every Sunday at 6 AM instead of 6:30 AM. Please update your schedules accordingly.',                                       date: '2025-02-20', author: 'Zone Incharge', priority: 'low',    active: true  },
  { id: 4, title: 'Building Fund Drive',         content: 'We are conducting a building fund collection drive for the new meditation hall. Your generous contributions are welcome. Contact the office for more information.',     date: '2025-02-10', author: 'Admin',         priority: 'medium', active: true  },
  { id: 5, title: 'Website Maintenance',         content: 'The member portal will be down for maintenance on March 12 from 12 AM to 4 AM. Please plan accordingly.',                                                              date: '2025-03-08', author: 'Tech Team',     priority: 'low',    active: false }
];

// ── Seva Categories ───────────────────────
const SEVA_CATEGORIES = [
  { id: 1, name: 'Monthly Seva',       description: 'Regular monthly spiritual service contribution',     active: true,  sortOrder: 1 },
  { id: 2, name: 'Langar Fund',        description: 'Contribution towards community kitchen and food',    active: true,  sortOrder: 2 },
  { id: 3, name: 'Building Fund',      description: 'Donation for construction and maintenance',          active: true,  sortOrder: 3 },
  { id: 4, name: 'Special Donation',   description: 'One-time special contributions and donations',       active: true,  sortOrder: 4 },
  { id: 5, name: 'Youth Seva',         description: 'Service activities for YA members',                  active: true,  sortOrder: 5 },
  { id: 6, name: 'Medical Seva',       description: 'Contribution towards health and medical services',   active: false, sortOrder: 6 },
  { id: 7, name: 'Education Seva',     description: 'Support for educational programmes and scholarships',active: true,  sortOrder: 7 },
  { id: 8, name: 'Event Management',   description: 'Seva for organising Satsang events and gatherings',  active: true,  sortOrder: 8 }
];

// ── Utility helpers ───────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function showToast(message, type = '') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast ' + type;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modalBox');
  box.innerHTML = html;
  overlay.style.display = 'flex';
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').style.display = 'none';
  }
}

function closeForcedModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}