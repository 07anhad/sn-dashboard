"""
seed.py — Populate all tables with initial data + import CSVs
"""
import os, csv, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import get_conn

def seed():
    conn = get_conn()
    cur = conn.cursor()

    # ── Users ──
    cur.execute("SELECT count(*) FROM users")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO users (username,password,role,name,email,member_id) VALUES (%s,%s,%s,%s,%s,%s)",
            [
                ('superadmin', 'super123',  'superadmin', 'Super Admin',    'superadmin@satsang.org', None),
                ('admin',      'admin123',  'admin',      'Admin User',     'admin@satsang.org',      None),
                ('anhad.parashar','member123','member',   'Anhad Parashar', 'anhad.parashar@email.com','M-00101'),
            ]
        )

    # ── Zones ──
    cur.execute("SELECT count(*) FROM zones")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO zones (name,code,active,member_count,incharge,phone) VALUES (%s,%s,%s,%s,%s,%s)",
            [
                ('Vasant Kunj','VK',True,1,'Ramesh Kumar','9810012345'),
                ('Dwarka','DW',False,0,'Sunita Arora','9811098765'),
                ('Rohini','RH',False,0,'Mahesh Singh','9812034567'),
            ]
        )

    # ── Branches ──
    cur.execute("SELECT count(*) FROM branches")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO branches (code,name,zone,active,member_count) VALUES (%s,%s,%s,%s,%s)",
            [
                ('BR-001','Main Branch Delhi','Vasant Kunj',True,850),
                ('BR-002','South Delhi Branch','Vasant Kunj',True,450),
                ('BR-003','West Delhi Branch','Dwarka',True,300),
                ('BR-004','North Delhi Branch','Rohini',False,0),
            ]
        )

    # ── Member Types ──
    cur.execute("SELECT count(*) FROM member_types")
    if cur.fetchone()[0] == 0:
        types = [
            'Sant Su Ph-I','Sant Su Ph-II','Sant Su P-I','Sant Su P-II',
            'Satsangi Children','Jr. Pre Initiate','Sr. Pre Initiate',
            'CCA','CRC','Associate','YA Member','YA Member MA Member',
            'Initiated Gents Member','Initiated Ladies Member',
            'Jigyasu Member','Children','Others','Visitors(Long Term)'
        ]
        cur.executemany("INSERT INTO member_types (name) VALUES (%s)", [(t,) for t in types])

    # ── Members ──
    cur.execute("SELECT count(*) FROM members")
    if cur.fetchone()[0] == 0:
        members = [
            ('UID001','BSL-0001','Rajesh Kumar','rajesh.k@email.com','9810011111','Vasant Kunj','Initiated Gents Member','Active','Approved','2018-03-15'),
            ('UID002','BSL-0002','Sunita Devi','sunita.d@email.com','9810022222','Vasant Kunj','Initiated Ladies Member','Active','Approved','2018-05-20'),
        ]
        cur.executemany(
            "INSERT INTO members (uid,bslno,name,email,mobile,zone,type,status,approval_status,join_date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            members
        )

    # ── Reg Links ──
    cur.execute("SELECT count(*) FROM reg_links")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO reg_links (title,code,url,active,max_uses,used_count,expiry,created_on) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            [
                ('General','GEN2025','https://satsang.org/register/GEN2025',True,500,234,'2025-12-31','2025-01-01'),
            ]
        )

    # ── Contributions ──
    cur.execute("SELECT count(*) FROM contributions")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO contributions (member_name,member_id,amount,category,date,status,mode) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            [
                ('Rajesh Kumar','UID001',5000,'Monthly Seva','2025-01-05','Received','Online Transfer'),
                ('Sunita Devi','UID002',2500,'Langar Fund','2025-01-10','Received','Cash'),
                ('Vikram Mishra','UID009',10000,'Building Fund','2025-01-12','Received','Cheque'),
                ('Rekha Pandey','UID010',1100,'Monthly Seva','2025-01-15','Received','Online Transfer'),
                ('Harish Chandra','UID013',7500,'Special Donation','2025-01-20','Received','Cheque'),
                ('Kavitha Rajan','UID006',3000,'Monthly Seva','2025-02-01','Pending','Online Transfer'),
                ('Anita Singh','UID008',500,'Langar Fund','2025-02-05','Received','Cash'),
                ('Shanti Devi','UID016',2000,'Building Fund','2025-02-08','Received','Online Transfer'),
            ]
        )

    # ── Events ──
    cur.execute("SELECT count(*) FROM events")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO events (title,date,time,venue,type,status,attendees,max_attendees) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            [
                ('Satsang Cleaning','2025-03-15','07:00 PM','Soami Nagar Branch, Delhi','Satsang','Upcoming',0,100),
            ]
        )

    # ── Announcements ──
    cur.execute("SELECT count(*) FROM announcements")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO announcements (title,content,date,author,priority,active) VALUES (%s,%s,%s,%s,%s,%s)",
            [
                ('Holi Satsang Notice','The Holi Satsang on 14th March will begin at 7 AM sharp. All members are requested to be present by 6:45 AM. Prasad distribution after the programme.','2025-03-05','Admin','low',True),
            ]
        )

    # ── Seva Categories ──
    cur.execute("SELECT count(*) FROM seva_categories")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO seva_categories (name,description,active,sort_order) VALUES (%s,%s,%s,%s)",
            [
                ('Monthly Seva','Regular monthly spiritual service contribution',True,1),
                ('Langar Fund','Contribution towards community kitchen and food',True,2),
                ('Building Fund','Donation for construction and maintenance',True,3),
                ('Special Donation','One-time special contributions and donations',True,4),
                ('Youth Seva','Service activities for YA members',True,5),
                ('Medical Seva','Contribution towards health and medical services',False,6),
                ('Education Seva','Support for educational programmes and scholarships',True,7),
                ('Event Management','Seva for organising Satsang events and gatherings',True,8),
            ]
        )

    # ── Import CSVs into attendance tables ──
    dataset_dir = os.path.join(os.path.dirname(__file__), '..', 'dataset')

    # eSatsang attendance
    cur.execute("SELECT count(*) FROM esatsang_attendance")
    if cur.fetchone()[0] == 0:
        csv_path = os.path.join(dataset_dir, 'esatsang_attendance.csv')
        if os.path.exists(csv_path):
            with open(csv_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    vals = [row.get(h,'').strip() for h in ['ATTENDANCE_DATE','MEMBER_ID','EVENT_NAME','FIRST_NAME','MIDDLE_NAME','LAST_NAME','MEMBER_UID','BRANCH_NAME','LOCATION','ATTENDANCE_TYPE']]
                    if any(vals):
                        cur.execute(
                            "INSERT INTO esatsang_attendance (attendance_date,member_id,event_name,first_name,middle_name,last_name,member_uid,branch_name,location,attendance_type) VALUES (NULLIF(%s,'')::date,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                            vals
                        )

    # Branch attendance
    cur.execute("SELECT count(*) FROM branch_attendance")
    if cur.fetchone()[0] == 0:
        csv_path = os.path.join(dataset_dir, 'branch_attendance.csv')
        if os.path.exists(csv_path):
            with open(csv_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    vals = [row.get(h,'').strip() for h in ['MEMBER_ID','MEMBER_NAME','EVENTS_ATTENDED','TOTAL_BRANCH_EVENTS','BRANCH_NAME']]
                    if any(vals):
                        cur.execute(
                            "INSERT INTO branch_attendance (member_id,member_name,events_attended,total_branch_events,branch_name) VALUES (%s,%s,COALESCE(NULLIF(%s,'')::int,0),COALESCE(NULLIF(%s,'')::int,0),%s)",
                            vals
                        )

    # Haazri attendance
    cur.execute("SELECT count(*) FROM haazri_attendance")
    if cur.fetchone()[0] == 0:
        csv_path = os.path.join(dataset_dir, 'haazri_attendance.csv')
        if os.path.exists(csv_path):
            with open(csv_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    vals = [row.get(h,'').strip() for h in ['UID','NAME','DATE_TIME_STR','HAAZRI_ID','EVENT_NAME','BRANCH_NAME','GEOLOCATION_NAME']]
                    if any(vals):
                        cur.execute(
                            "INSERT INTO haazri_attendance (uid,name,date_time_str,haazri_id,event_name,branch_name,geolocation_name) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                            vals
                        )

    conn.commit()
    cur.close()
    conn.close()
    print("Seed complete!")

if __name__ == '__main__':
    seed()


'''
changes for member_links.py

"""
member_links.py — personal login links for initiated members (https://snbranch.org/<token>).

Used by app.py for link login, and as a CLI for admins:

    python server/member_links.py generate [--dry-run]   create links for initiated members who have none
    python server/member_links.py export [--out FILE]    write UID / Name / Father / Phone / Link to Excel
    python server/member_links.py show UID [UID ...]     print a member's current link
    python server/member_links.py rotate UID [UID ...]   revoke the old link and issue a new one
    python server/member_links.py revoke UID [UID ...]   disable a member's link
"""
import argparse
import datetime as _dt
import getpass
import os
import re
import secrets
import sys

sys.path.insert(0, os.path.dirname(__file__))

from db import query, get_conn, _release

# Base58: no 0/O/I/l, so a link read aloud or typed by hand can't be misread.
TOKEN_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
TOKEN_LENGTH   = 16                       # 58^16 ≈ 2^93 possible links
TOKEN_PATTERN  = '[1-9A-HJ-NP-Za-km-z]{16}'
TOKEN_RE       = re.compile(rf'^{TOKEN_PATTERN}$')

DEFAULT_BASE_URL = os.environ.get('PUBLIC_BASE_URL', 'https://snbranch.org').rstrip('/')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

INITIATED_WHERE = """
    (LOWER(TRIM(COALESCE(md.category, ''))) = 'initiated'
     OR md.date_of_initiation IS NOT NULL
     OR md.date_of_first_initiation IS NOT NULL
     OR md.date_of_second_initiation IS NOT NULL)
    AND md.date_of_expire IS NULL
    AND COALESCE(md.record_status, 'Activated') = 'Activated'
"""


def new_token():
    return ''.join(secrets.choice(TOKEN_ALPHABET) for _ in range(TOKEN_LENGTH))


def link_url(token, base_url=DEFAULT_BASE_URL):
    return f"{base_url.rstrip('/')}/{token}"


# ── Used by app.py ──────────────────────────────────────────────────────────
def find_active_link(token):
    """Active link + member for a token, or None. Never raises on malformed input."""
    if not token or not TOKEN_RE.match(token):
        return None
    return query(
        "SELECT l.id, l.member_uid, md.name, md.email1 "
        "FROM member_links l JOIN member_details md ON md.uid = l.member_uid "
        "WHERE l.token = %s AND l.revoked_at IS NULL",
        (token,), one=True
    ) or None


def is_link_active(link_id, member_uid):
    return bool(query(
        "SELECT 1 FROM member_links WHERE id=%s AND member_uid=%s AND revoked_at IS NULL",
        (link_id, member_uid), one=True
    ))


def record_use(link_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE member_links SET last_used_at=NOW(), use_count=use_count+1 WHERE id=%s",
                (link_id,)
            )
        conn.commit()
    finally:
        _release(conn)


# ── Link management ─────────────────────────────────────────────────────────
def _insert_link(cur, member_uid, created_by):
    """Insert an active link; returns the token, or None if the member already has one."""
    for _ in range(5):
        token = new_token()
        cur.execute(
            "INSERT INTO member_links (member_uid, token, created_by) VALUES (%s, %s, %s) "
            "ON CONFLICT DO NOTHING RETURNING token",
            (member_uid, token, created_by)
        )
        row = cur.fetchone()
        if row:
            return row[0]
        cur.execute(
            "SELECT 1 FROM member_links WHERE member_uid=%s AND revoked_at IS NULL", (member_uid,)
        )
        if cur.fetchone():
            return None
        # Otherwise the token itself collided — astronomically unlikely, just retry.
    raise RuntimeError(f'Could not generate a unique token for {member_uid}')


def generate_missing(created_by, dry_run=False):
    """Create links for every initiated member without an active one. Safe to re-run."""
    missing = query(f"""
        SELECT md.uid FROM member_details md
        WHERE {INITIATED_WHERE}
          AND NOT EXISTS (SELECT 1 FROM member_links l
                          WHERE l.member_uid = md.uid AND l.revoked_at IS NULL)
        ORDER BY md.uid
    """)
    uids = [r['uid'] for r in missing]
    if dry_run or not uids:
        return uids

    conn = get_conn()
    created = []
    try:
        with conn.cursor() as cur:
            for uid in uids:
                if _insert_link(cur, uid, created_by):
                    created.append(uid)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _release(conn)
    return created


def rotate(member_uid, created_by):
    """Revoke the member's current link (if any) and issue a fresh one. Returns the new token."""
    if not query("SELECT 1 FROM member_details WHERE uid=%s", (member_uid,), one=True):
        raise ValueError(f'No member with UID {member_uid}')
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE member_links SET revoked_at=NOW() WHERE member_uid=%s AND revoked_at IS NULL",
                (member_uid,)
            )
            token = _insert_link(cur, member_uid, created_by)
        conn.commit()
        return token
    except Exception:
        conn.rollback()
        raise
    finally:
        _release(conn)


def revoke(member_uid):
    """Disable the member's active link. Returns True if one was revoked."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE member_links SET revoked_at=NOW() WHERE member_uid=%s AND revoked_at IS NULL",
                (member_uid,)
            )
            changed = cur.rowcount
        conn.commit()
        return changed > 0
    except Exception:
        conn.rollback()
        raise
    finally:
        _release(conn)


def active_token(member_uid):
    row = query(
        "SELECT token FROM member_links WHERE member_uid=%s AND revoked_at IS NULL",
        (member_uid,), one=True
    )
    return row['token'] if row else None


# ── Excel export ────────────────────────────────────────────────────────────
def _clean(v):
    s = str(v).strip() if v is not None else ''
    return '' if s.upper() in ('N/A', 'NA', '#N/A', 'NONE', 'NULL', '-', '0') else s


def normalize_mobile(raw):
    """10-digit Indian mobile number, or None if the value isn't one."""
    digits = re.sub(r'\D', '', _clean(raw))
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith('0'):
        digits = digits[1:]
    return digits if re.fullmatch(r'[6-9]\d{9}', digits) else None


def compose_name(title, first, middle, last):
    """Same rules as composeName() in js/data.js: drop repeated words from legacy records."""
    seen, words = set(), []
    for part in (first, middle, last):
        for w in _clean(part).split():
            if w.upper() not in seen:
                seen.add(w.upper())
                words.append(w)
    if not words:
        return ''
    return ' '.join(filter(None, [_clean(title), ' '.join(words)]))


def export_rows(base_url=DEFAULT_BASE_URL):
    rows = query(f"""
        SELECT md.uid, md.name, md.category, md.mobile1, md.mobile2,
               md.father_title, md.father_first_name, md.father_middle_name, md.father_last_name,
               l.token
        FROM member_details md
        LEFT JOIN member_links l ON l.member_uid = md.uid AND l.revoked_at IS NULL
        WHERE {INITIATED_WHERE}
        ORDER BY md.name, md.uid
    """)

    out = []
    for r in rows:
        notes = []
        phone = normalize_mobile(r['mobile1']) or normalize_mobile(r['mobile2'])
        if not phone:
            raw = _clean(r['mobile1']) or _clean(r['mobile2'])
            notes.append(f'Invalid mobile: {raw}' if raw else 'No mobile number')
        father = compose_name(r['father_title'], r['father_first_name'],
                              r['father_middle_name'], r['father_last_name'])
        if not father:
            notes.append("Father's name missing")
        if not r['token']:
            notes.append('No link yet — run "generate"')
        out.append({
            'uid': r['uid'], 'name': _clean(r['name']), 'category': _clean(r['category']),
            'father': father, 'phone': phone or '',
            'link': link_url(r['token'], base_url) if r['token'] else '', 'notes': notes,
        })

    # Families often share one phone; flag it so the sender knows which link is whose.
    counts = {}
    for o in out:
        if o['phone']:
            counts[o['phone']] = counts.get(o['phone'], 0) + 1
    for o in out:
        n = counts.get(o['phone'], 0)
        if n > 1:
            o['notes'].append(f'Phone shared with {n - 1} other member(s)')
    return out


def export_xlsx(path, base_url=DEFAULT_BASE_URL):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment

    rows = export_rows(base_url)
    wb = Workbook()
    ws = wb.active
    ws.title = 'Initiated Members'

    headers = ['UID', 'Name', 'Category', "Father's Name", 'Phone', 'Link', 'Notes']
    widths  = [22, 32, 14, 34, 14, 40, 45]
    ws.append(headers)
    for i, w in enumerate(widths, start=1):
        ws.cell(row=1, column=i).font = Font(bold=True, color='FFFFFF')
        ws.cell(row=1, column=i).fill = PatternFill('solid', fgColor='1C1F2E')
        ws.cell(row=1, column=i).alignment = Alignment(vertical='center')
        ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = w

    for r_idx, r in enumerate(rows, start=2):
        values = [r['uid'], r['name'], r['category'], r['father'], r['phone'], r['link'], '; '.join(r['notes'])]
        for c_idx, v in enumerate(values, start=1):
            cell = ws.cell(row=r_idx, column=c_idx, value=v)
            # Force text: stops Excel turning phones into 9.87E+09 and '=...' into formulas.
            cell.data_type = 's'
            cell.number_format = '@'
        if r['link']:
            link_cell = ws.cell(row=r_idx, column=6)
            link_cell.hyperlink = r['link']
            link_cell.style = 'Hyperlink'
            link_cell.number_format = '@'

    ws.freeze_panes = 'A2'
    ws.auto_filter.ref = ws.dimensions

    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    wb.save(path)
    return rows


# ── CLI ─────────────────────────────────────────────────────────────────────
def _cli_actor():
    try:
        return f'cli:{getpass.getuser()}'
    except Exception:
        return 'cli'


def main(argv=None):
    p = argparse.ArgumentParser(description='Manage personal login links for initiated members.')
    sub = p.add_subparsers(dest='cmd', required=True)

    g = sub.add_parser('generate', help='create links for initiated members who have none')
    g.add_argument('--dry-run', action='store_true', help='only report who would get a link')

    e = sub.add_parser('export', help='write the links spreadsheet')
    e.add_argument('--out', help='output .xlsx path (default: exports/initiated_member_links_<date>.xlsx)')
    e.add_argument('--base-url', default=DEFAULT_BASE_URL, help=f'default: {DEFAULT_BASE_URL}')

    for name, text in (('show', "print a member's link"), ('rotate', 'replace a link'), ('revoke', 'disable a link')):
        sp = sub.add_parser(name, help=text)
        sp.add_argument('uids', nargs='+', metavar='UID')
        if name in ('show', 'rotate'):
            sp.add_argument('--base-url', default=DEFAULT_BASE_URL)

    args = p.parse_args(argv)

    if args.cmd == 'generate':
        uids = generate_missing(_cli_actor(), dry_run=args.dry_run)
        verb = 'Would create' if args.dry_run else 'Created'
        print(f'{verb} {len(uids)} new link(s).')
        if not args.dry_run:
            print('Next: python server/member_links.py export')
        return 0

    if args.cmd == 'export':
        out = args.out or os.path.join(ROOT, 'exports',
                                       f'initiated_member_links_{_dt.date.today():%Y-%m-%d}.xlsx')
        rows = export_xlsx(out, args.base_url)
        no_link  = sum(1 for r in rows if not r['link'])
        no_phone = sum(1 for r in rows if not r['phone'])
        print(f'Wrote {len(rows)} member(s) to {out}')
        print(f'  without link: {no_link}   without valid mobile: {no_phone}')
        print('  This file contains working login links - share it only with the admin sending them.')
        return 0

    status = 0
    for uid in args.uids:
        uid = uid.strip()
        if args.cmd == 'show':
            token = active_token(uid)
            print(f'{uid}: {link_url(token, args.base_url) if token else "no active link"}')
        elif args.cmd == 'rotate':
            try:
                print(f'{uid}: {link_url(rotate(uid, _cli_actor()), args.base_url)}')
            except ValueError as ex:
                print(f'{uid}: {ex}')
                status = 1
        elif args.cmd == 'revoke':
            print(f'{uid}: {"revoked" if revoke(uid) else "no active link"}')
    return status


if __name__ == '__main__':
    sys.exit(main())


'''
