/* ============================================================
   DATA.JS — Data Layer (loads from PostgreSQL via API)
   ============================================================ */

'use strict';

// ── Global data stores (populated by loadAllData) ─
let DASH_STATS = {};
let ZONES = [];
let MEMBER_TYPES = [];
let MEMBERS = [];
let REG_LINKS = [];
let EVENTS = [];
let ANNOUNCEMENTS = [];

let dataLoaded = false;

// ── Load all data from backend ────────────
async function loadAllData() {
  try {
    const [stats, zones, memberTypes, members, regLinks, announcements] = await Promise.all([
      apiGet('/api/dashboard/stats'),
      apiGet('/api/zones'),
      apiGet('/api/member-types'),
      apiGet('/api/members'),
      apiGet('/api/reg-links'),
      apiGet('/api/announcements'),
    ]);

    DASH_STATS = stats;
    ZONES = zones;
    MEMBER_TYPES = memberTypes;
    MEMBERS = members.map((m, i) => ({
      // identity
      sl: i + 1, uid: m.uid, bslno: m.bsl, name: m.name,
      // initiation dates
      dateOfInitiation: m.date_of_initiation,
      dateOfBirth: m.date_of_birth,
      dateOfRegistration: m.date_of_registration_jigyasu,
      dateOfFirstInitiation: m.date_of_first_initiation,
      dateOfSecondInitiation: m.date_of_second_initiation,
      // contact
      mobile: m.mobile1, mobile2: m.mobile2,
      landline: m.landline, officePhone: m.office_phone,
      email: m.email1, email2: m.email2,
      // address
      addressLine1: m.address_line1, addressLine2: m.address_line2, addressLine3: m.address_line3,
      city: m.city, pincode: m.pincode, state: m.state, country: m.country,
      // personal
      snExt: m.sn_ext, ashram: m.ashram,
      bloodGroup: m.blood_group, branchIdCard: m.branch_id_card_received,
      caste: m.caste, nationality: m.nationality,
      qualification: m.qualification, occupation: m.occupation,
      designation: m.designation, organization: m.organization,
      profession: m.profession, professionCode: m.profession_code,
      commGridCode: m.communication_grid_code,
      // membership flags
      mahila: m.mahila_association_member, youth: m.youth_member,
      assocYouth: m.associate_youth_member,
      jrPreInit: m.junior_pre_initiate_member, srPreInit: m.senior_pre_initiate_member,
      crc: m.crc_member, cca: m.cca_member, santSu: m.sant_su_member,
      // nee
      neeFirst: m.nee_first_name, neeMiddle: m.nee_middle_name, neeLast: m.nee_last_name,
      // father
      fatherTitle: m.father_title,
      fatherFirstName: m.father_first_name, fatherMiddleName: m.father_middle_name, fatherLastName: m.father_last_name,
      fatherBranch: m.father_branch, fatherBslno: m.father_bslno, fatherUid: m.father_uid,
      fatherDoi: m.father_doi, fatherPhone: m.father_phone, fatherCity: m.father_city, fatherState: m.father_state,
      // mother
      motherTitle: m.mother_title,
      motherFirstName: m.mother_first_name, motherMiddleName: m.mother_middle_name, motherLastName: m.mother_last_name,
      motherBranch: m.mother_branch, motherBslno: m.mother_bslno, motherUid: m.mother_uid,
      motherDoi: m.mother_doi, motherPhone: m.mother_phone, motherCity: m.mother_city, motherState: m.mother_state,
      // spouse
      spouseTitle: m.spouse_title,
      spouseFirstName: m.spouse_first_name, spouseMiddleName: m.spouse_middle_name, spouseLastName: m.spouse_last_name,
      spouseBranch: m.spouse_branch, spouseBslno: m.spouse_bslno, spouseUid: m.spouse_uid,
      spouseDoi: m.spouse_doi, spousePhone: m.spouse_phone, spouseCity: m.spouse_city, spouseState: m.spouse_state,
      // ref-1
      ref1Name: m.ref1_name, ref1Address: m.ref1_address, ref1Email: m.ref1_email,
      ref1Phone: m.ref1_phone, ref1Branch: m.ref1_branch, ref1Relation: m.ref1_relation,
      // ref-2
      ref2Name: m.ref2_name, ref2Address: m.ref2_address, ref2Email: m.ref2_email,
      ref2Phone: m.ref2_phone, ref2Branch: m.ref2_branch, ref2Relation: m.ref2_relation,
      // transfer / history
      dorYouth: m.dor_youth, dateOfInitiationNew: m.date_of_initiation_new,
      dateTransferIn: m.date_transfer_in, transferFromBranch: m.transfer_from_branch,
      dateTransferOut: m.date_transfer_out, transferToBranch: m.transfer_to_branch,
      dateOfExpire: m.date_of_expire,
      // status (kept for existing filter/badge compat)
      status: m.record_status || 'Active',
      approvalStatus: 'Approved',
      joinDate: m.date_of_initiation,
      zone: m.city,
      type: (m.sant_su_member === 'Y' ? 'Sant Su' :
             m.mahila_association_member === 'Y' ? 'Initiated Ladies Member' :
             m.youth_member === 'Y' ? 'YA Member' :
             m.crc_member === 'Y' ? 'CRC' :
             m.cca_member === 'Y' ? 'CCA' :
             m.junior_pre_initiate_member === 'Y' ? 'Jr. Pre Initiate' :
             m.senior_pre_initiate_member === 'Y' ? 'Sr. Pre Initiate' :
             'Initiated Gents Member'),
    }));
    REG_LINKS = regLinks.map(r => ({
      id: r.id, title: r.title, code: r.code, url: r.url,
      active: r.active, maxUses: r.max_uses, usedCount: r.used_count,
      expiry: r.expiry, createdOn: r.created_on
    }));
    ANNOUNCEMENTS = announcements.map(a => ({
      id: a.id, title: a.title, content: a.content, date: a.date,
      author: a.author, priority: a.priority, active: a.active
    }));

    dataLoaded = true;
  } catch (err) {
    console.error('Failed to load data from API:', err);
  }
}

// ── Reload a single collection ────────────
async function reloadZones()         { ZONES = await apiGet('/api/zones'); }
async function reloadMembers() {
  const members = await apiGet('/api/members');
  MEMBERS = members.map((m, i) => ({
    sl: i + 1, uid: m.uid, bslno: m.bsl, name: m.name,
    dateOfInitiation: m.date_of_initiation, dateOfBirth: m.date_of_birth,
    dateOfRegistration: m.date_of_registration_jigyasu,
    dateOfFirstInitiation: m.date_of_first_initiation,
    dateOfSecondInitiation: m.date_of_second_initiation,
    mobile: m.mobile1, mobile2: m.mobile2, landline: m.landline, officePhone: m.office_phone,
    email: m.email1, email2: m.email2,
    addressLine1: m.address_line1, addressLine2: m.address_line2, addressLine3: m.address_line3,
    city: m.city, pincode: m.pincode, state: m.state, country: m.country,
    snExt: m.sn_ext, ashram: m.ashram, bloodGroup: m.blood_group, branchIdCard: m.branch_id_card_received,
    caste: m.caste, nationality: m.nationality,
    qualification: m.qualification, occupation: m.occupation,
    designation: m.designation, organization: m.organization,
    profession: m.profession, professionCode: m.profession_code, commGridCode: m.communication_grid_code,
    mahila: m.mahila_association_member, youth: m.youth_member, assocYouth: m.associate_youth_member,
    jrPreInit: m.junior_pre_initiate_member, srPreInit: m.senior_pre_initiate_member,
    crc: m.crc_member, cca: m.cca_member, santSu: m.sant_su_member,
    neeFirst: m.nee_first_name, neeMiddle: m.nee_middle_name, neeLast: m.nee_last_name,
    fatherTitle: m.father_title, fatherFirstName: m.father_first_name, fatherMiddleName: m.father_middle_name, fatherLastName: m.father_last_name,
    fatherBranch: m.father_branch, fatherBslno: m.father_bslno, fatherUid: m.father_uid,
    fatherDoi: m.father_doi, fatherPhone: m.father_phone, fatherCity: m.father_city, fatherState: m.father_state,
    motherTitle: m.mother_title, motherFirstName: m.mother_first_name, motherMiddleName: m.mother_middle_name, motherLastName: m.mother_last_name,
    motherBranch: m.mother_branch, motherBslno: m.mother_bslno, motherUid: m.mother_uid,
    motherDoi: m.mother_doi, motherPhone: m.mother_phone, motherCity: m.mother_city, motherState: m.mother_state,
    spouseTitle: m.spouse_title, spouseFirstName: m.spouse_first_name, spouseMiddleName: m.spouse_middle_name, spouseLastName: m.spouse_last_name,
    spouseBranch: m.spouse_branch, spouseBslno: m.spouse_bslno, spouseUid: m.spouse_uid,
    spouseDoi: m.spouse_doi, spousePhone: m.spouse_phone, spouseCity: m.spouse_city, spouseState: m.spouse_state,
    ref1Name: m.ref1_name, ref1Address: m.ref1_address, ref1Email: m.ref1_email,
    ref1Phone: m.ref1_phone, ref1Branch: m.ref1_branch, ref1Relation: m.ref1_relation,
    ref2Name: m.ref2_name, ref2Address: m.ref2_address, ref2Email: m.ref2_email,
    ref2Phone: m.ref2_phone, ref2Branch: m.ref2_branch, ref2Relation: m.ref2_relation,
    dorYouth: m.dor_youth, dateOfInitiationNew: m.date_of_initiation_new,
    dateTransferIn: m.date_transfer_in, transferFromBranch: m.transfer_from_branch,
    dateTransferOut: m.date_transfer_out, transferToBranch: m.transfer_to_branch,
    dateOfExpire: m.date_of_expire,
    status: m.record_status || 'Activated',
    approvalStatus: 'Approved', joinDate: m.date_of_initiation, zone: m.city,
    type: (m.sant_su_member === 'Y' ? 'Sant Su' :
           m.mahila_association_member === 'Y' ? 'Initiated Ladies Member' :
           m.youth_member === 'Y' ? 'YA Member' :
           m.crc_member === 'Y' ? 'CRC' : m.cca_member === 'Y' ? 'CCA' :
           m.junior_pre_initiate_member === 'Y' ? 'Jr. Pre Initiate' :
           m.senior_pre_initiate_member === 'Y' ? 'Sr. Pre Initiate' : 'Initiated Gents Member'),
  }));
}
async function reloadRegLinks()      { const r = await apiGet('/api/reg-links'); REG_LINKS = r.map(x => ({ id:x.id, title:x.title, code:x.code, url:x.url, active:x.active, maxUses:x.max_uses, usedCount:x.used_count, expiry:x.expiry, createdOn:x.created_on })); }
async function reloadAnnouncements() { const a = await apiGet('/api/announcements'); ANNOUNCEMENTS = a.map(x => ({ id:x.id, title:x.title, content:x.content, date:x.date, author:x.author, priority:x.priority, active:x.active })); }
async function reloadDashStats()     { DASH_STATS = await apiGet('/api/dashboard/stats'); }

// ── Utility helpers ───────────────────────
function isAdmin() {
  const u = getCurrentUser();
  return u && u.role === 'admin';
}

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

function openModal(html, wide = false) {
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modalBox');
  box.innerHTML = html;
  box.style.maxWidth = wide ? '960px' : '';
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