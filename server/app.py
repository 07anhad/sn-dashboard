"""
app.py — Flask server: serves static frontend + REST API
"""
import os, sys, logging
from logging.handlers import TimedRotatingFileHandler
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from db import query, execute

app = Flask(__name__, static_folder=None)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB upload limit

ROOT = os.path.join(os.path.dirname(__file__), '..')

# ═══════════════════════════════════════════
# Audit logger — writes to logs/audit_YYYY-MM-DD.log
# ═══════════════════════════════════════════
_LOG_DIR = os.path.join(ROOT, 'logs')
os.makedirs(_LOG_DIR, exist_ok=True)

_audit_logger = logging.getLogger('audit')
_audit_logger.setLevel(logging.INFO)
_audit_logger.propagate = False
_handler = TimedRotatingFileHandler(
    os.path.join(_LOG_DIR, 'audit.log'),
    when='midnight', backupCount=90, encoding='utf-8'
)
_handler.suffix = '%Y-%m-%d'
_handler.setFormatter(logging.Formatter('%(asctime)s | %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
_audit_logger.addHandler(_handler)

def audit(action: str, detail: str = ''):
    """Log a user action. Reads actor info from the X-User header sent by the frontend."""
    actor = request.headers.get('X-User', 'unknown')
    ip = request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown')
    msg = f"actor={actor} | ip={ip} | action={action}"
    if detail:
        msg += f" | detail={detail}"
    _audit_logger.info(msg)

# ═══════════════════════════════════════════
# Static file serving
# ═══════════════════════════════════════════
@app.route('/')
@app.route('/index.html')
def index():
    return send_from_directory(os.path.join(ROOT, 'html'), 'index.html')

@app.route('/dashboard.html')
def dashboard():
    return send_from_directory(os.path.join(ROOT, 'html'), 'dashboard.html')

@app.route('/html/<path:filename>')
def html_files(filename):
    return send_from_directory(os.path.join(ROOT, 'html'), filename)

@app.route('/css/<path:filename>')
def css_files(filename):
    return send_from_directory(os.path.join(ROOT, 'css'), filename)

@app.route('/js/<path:filename>')
def js_files(filename):
    return send_from_directory(os.path.join(ROOT, 'js'), filename)

@app.route('/dataset/<path:filename>')
def dataset_files(filename):
    return send_from_directory(os.path.join(ROOT, 'dataset'), filename)

# ═══════════════════════════════════════════
# AUTH API
# ═══════════════════════════════════════════
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    role = (data.get('role') or '').strip()

    # 'admin' toggle on login page covers both admin and superadmin
    if role == 'admin':
        user = query(
            "SELECT id,username,name,role,email,member_id FROM users WHERE (username=%s OR email=%s) AND password=%s AND role IN ('admin','superadmin')",
            (username, username, password),
            one=True
        )
    else:
        user = query(
            "SELECT id,username,name,role,email,member_id FROM users WHERE (username=%s OR email=%s) AND password=%s AND role=%s",
            (username, username, password, role),
            one=True
        )
    if user:
        audit('LOGIN_SUCCESS', f"username={username} role={user['role']}")
        return jsonify({'ok': True, 'user': user})
    audit('LOGIN_FAILED', f"username={username} attempted_role={role}")
    return jsonify({'ok': False, 'error': 'Invalid credentials'}), 401

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    username = (data.get('username') or '').strip().lower()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not name or not username or not email or len(password) < 6:
        return jsonify({'ok': False, 'error': 'All fields required. Password min 6 chars.'}), 400

    # Check duplicates
    existing = query("SELECT id FROM users WHERE username=%s OR email=%s", (username, email))
    if existing:
        return jsonify({'ok': False, 'error': 'Username or email already taken.'}), 409

    # Generate member ID
    count = query("SELECT count(*) as c FROM users WHERE role='member'", one=True)
    member_id = 'M-' + str(10000 + (count['c'] if count else 0) + 1).zfill(5)

    user = execute(
        "INSERT INTO users (username,password,role,name,email,member_id) VALUES (%s,%s,'member',%s,%s,%s) RETURNING id,username,name,role,email,member_id",
        (username, password, name, email, member_id),
        returning=True
    )
    audit('SIGNUP', f"new_user={username} email={email}")
    return jsonify({'ok': True, 'user': user}), 201

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.json or {}
    username = (data.get('username') or '').strip().lower()
    new_password = data.get('newPassword') or ''

    if len(new_password) < 6:
        return jsonify({'ok': False, 'error': 'Password min 6 chars.'}), 400

    user = query("SELECT id FROM users WHERE username=%s", (username,), one=True)
    if not user:
        return jsonify({'ok': False, 'error': 'Username not found.'}), 404

    execute("UPDATE users SET password=%s WHERE username=%s", (new_password, username))
    audit('RESET_PASSWORD', f"target_user={username}")
    return jsonify({'ok': True})

# ═══════════════════════════════════════════
# ZONES API
# ═══════════════════════════════════════════
@app.route('/api/zones')
def get_zones():
    return jsonify(query("SELECT * FROM zones ORDER BY id"))

@app.route('/api/zones', methods=['POST'])
def add_zone():
    d = request.json
    row = execute(
        "INSERT INTO zones (name,code,active,member_count,incharge,phone) VALUES (%s,%s,%s,%s,%s,%s) RETURNING *",
        (d['name'], d['code'], d.get('active', True), d.get('member_count', 0), d.get('incharge',''), d.get('phone','')),
        returning=True
    )
    audit('ADD_ZONE', f"name={d['name']} code={d['code']}")
    return jsonify(row), 201

@app.route('/api/zones/<int:id>', methods=['PUT'])
def update_zone(id):
    d = request.json
    execute(
        "UPDATE zones SET name=%s,code=%s,active=%s,member_count=%s,incharge=%s,phone=%s WHERE id=%s",
        (d['name'], d['code'], d.get('active', True), d.get('member_count', 0), d.get('incharge',''), d.get('phone',''), id)
    )
    audit('EDIT_ZONE', f"id={id} name={d['name']}")
    return jsonify({'ok': True})

@app.route('/api/zones/<int:id>', methods=['DELETE'])
def delete_zone(id):
    execute("DELETE FROM zones WHERE id=%s", (id,))
    audit('DELETE_ZONE', f"id={id}")
    return jsonify({'ok': True})

# ═══════════════════════════════════════════
# BRANCHES API
# ═══════════════════════════════════════════
# ═══════════════════════════════════════════
# MEMBERS API
# ═══════════════════════════════════════════
@app.route('/api/members')
def get_members():
    return jsonify(query("SELECT * FROM member_details ORDER BY name"))

@app.route('/api/member-types')
def get_member_types():
    rows = query("SELECT name FROM member_types ORDER BY id")
    return jsonify([r['name'] for r in rows])

@app.route('/api/members', methods=['POST'])
def add_member():
    import psycopg2
    d = request.json
    uid = (d.get('uid') or '').strip()
    if not uid:
        return jsonify({'ok': False, 'error': 'UID is required.'}), 400
    try:
        execute(
            """INSERT INTO member_details
               (uid, bsl, name, mobile1, email1, city, state, record_status)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (uid, d.get('bslno',''), d.get('name',''), d.get('mobile',''),
             d.get('email',''), d.get('city',''), d.get('state',''),
             d.get('status','Activated'))
        )
        audit('ADD_MEMBER', f"uid={uid} name={d.get('name','')}")
        return jsonify({'ok': True, 'uid': uid}), 201
    except psycopg2.errors.UniqueViolation:
        return jsonify({'ok': False, 'error': f"A member with UID '{uid}' already exists."}), 409
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/api/members/<uid>', methods=['PUT'])
def update_member(uid):
    d = request.json

    # Status-only update (toggle activate/deactivate)
    if set(d.keys()) <= {'status'}:
        execute("UPDATE member_details SET record_status=%s WHERE uid=%s",
                (d.get('status', 'Activated'), uid))
        audit('UPDATE_MEMBER_STATUS', f"uid={uid} status={d.get('status','Activated')}")
        return jsonify({'ok': True})

    # Full field update
    or_none = lambda k: d.get(k) or None
    execute("""
        UPDATE member_details SET
          name=%s, bsl=%s,
          date_of_initiation=%s, date_of_birth=%s,
          date_of_registration_jigyasu=%s,
          date_of_first_initiation=%s, date_of_second_initiation=%s,
          blood_group=%s, caste=%s, nationality=%s,
          ashram=%s, sn_ext=%s, branch_id_card_received=%s,
          record_status=%s,
          mobile1=%s, mobile2=%s, landline=%s, office_phone=%s,
          email1=%s, email2=%s,
          address_line1=%s, address_line2=%s, address_line3=%s,
          city=%s, pincode=%s, state=%s, country=%s,
          qualification=%s, occupation=%s, designation=%s,
          organization=%s, profession=%s,
          profession_code=%s, communication_grid_code=%s,
          mahila_association_member=%s, youth_member=%s, associate_youth_member=%s,
          junior_pre_initiate_member=%s, senior_pre_initiate_member=%s,
          crc_member=%s, cca_member=%s, sant_su_member=%s,
          nee_first_name=%s, nee_middle_name=%s, nee_last_name=%s,
          father_title=%s, father_first_name=%s, father_middle_name=%s, father_last_name=%s,
          father_branch=%s, father_bslno=%s, father_uid=%s, father_doi=%s,
          father_phone=%s, father_city=%s, father_state=%s,
          mother_title=%s, mother_first_name=%s, mother_middle_name=%s, mother_last_name=%s,
          mother_branch=%s, mother_bslno=%s, mother_uid=%s, mother_doi=%s,
          mother_phone=%s, mother_city=%s, mother_state=%s,
          spouse_title=%s, spouse_first_name=%s, spouse_middle_name=%s, spouse_last_name=%s,
          spouse_branch=%s, spouse_bslno=%s, spouse_uid=%s, spouse_doi=%s,
          spouse_phone=%s, spouse_city=%s, spouse_state=%s,
          ref1_name=%s, ref1_address=%s, ref1_email=%s, ref1_phone=%s,
          ref1_branch=%s, ref1_relation=%s,
          ref2_name=%s, ref2_address=%s, ref2_email=%s, ref2_phone=%s,
          ref2_branch=%s, ref2_relation=%s,
          dor_youth=%s, date_of_initiation_new=%s,
          date_transfer_in=%s, transfer_from_branch=%s,
          date_transfer_out=%s, transfer_to_branch=%s,
          date_of_expire=%s
        WHERE uid=%s
    """, (
        d.get('name'),              d.get('bslno'),
        or_none('dateOfInitiation'),or_none('dateOfBirth'),
        or_none('dateOfRegistration'),
        or_none('dateOfFirstInitiation'), or_none('dateOfSecondInitiation'),
        d.get('bloodGroup'),        d.get('caste'),         d.get('nationality'),
        d.get('ashram'),            d.get('snExt'),         d.get('branchIdCard'),
        d.get('status', 'Activated'),
        d.get('mobile'),            d.get('mobile2'),       d.get('landline'),      d.get('officePhone'),
        d.get('email'),             d.get('email2'),
        d.get('addressLine1'),      d.get('addressLine2'),  d.get('addressLine3'),
        d.get('city'),              d.get('pincode'),       d.get('state'),         d.get('country'),
        d.get('qualification'),     d.get('occupation'),    d.get('designation'),
        d.get('organization'),      d.get('profession'),
        d.get('professionCode'),    d.get('commGridCode'),
        d.get('mahila'),            d.get('youth'),         d.get('assocYouth'),
        d.get('jrPreInit'),         d.get('srPreInit'),
        d.get('crc'),               d.get('cca'),           d.get('santSu'),
        d.get('neeFirst'),          d.get('neeMiddle'),     d.get('neeLast'),
        d.get('fatherTitle'),       d.get('fatherFirstName'), d.get('fatherMiddleName'), d.get('fatherLastName'),
        d.get('fatherBranch'),      d.get('fatherBslno'),   d.get('fatherUid'),     or_none('fatherDoi'),
        d.get('fatherPhone'),       d.get('fatherCity'),    d.get('fatherState'),
        d.get('motherTitle'),       d.get('motherFirstName'), d.get('motherMiddleName'), d.get('motherLastName'),
        d.get('motherBranch'),      d.get('motherBslno'),   d.get('motherUid'),     or_none('motherDoi'),
        d.get('motherPhone'),       d.get('motherCity'),    d.get('motherState'),
        d.get('spouseTitle'),       d.get('spouseFirstName'), d.get('spouseMiddleName'), d.get('spouseLastName'),
        d.get('spouseBranch'),      d.get('spouseBslno'),   d.get('spouseUid'),     or_none('spouseDoi'),
        d.get('spousePhone'),       d.get('spouseCity'),    d.get('spouseState'),
        d.get('ref1Name'),          d.get('ref1Address'),   d.get('ref1Email'),     d.get('ref1Phone'),
        d.get('ref1Branch'),        d.get('ref1Relation'),
        d.get('ref2Name'),          d.get('ref2Address'),   d.get('ref2Email'),     d.get('ref2Phone'),
        d.get('ref2Branch'),        d.get('ref2Relation'),
        or_none('dorYouth'),        or_none('dateOfInitiationNew'),
        or_none('dateTransferIn'),  d.get('transferFromBranch'),
        or_none('dateTransferOut'), d.get('transferToBranch'),
        or_none('dateOfExpire'),
        uid
    ))
    audit('EDIT_MEMBER', f"uid={uid} name={d.get('name','')}")
    return jsonify({'ok': True})

@app.route('/api/members/<uid>', methods=['DELETE'])
def delete_member(uid):
    execute("DELETE FROM members WHERE uid=%s", (uid,))
    audit('DELETE_MEMBER', f"uid={uid}")
    return jsonify({'ok': True})

# ═══════════════════════════════════════════
# REG LINKS API
# ═══════════════════════════════════════════
@app.route('/api/reg-links')
def get_reg_links():
    return jsonify(query("SELECT * FROM reg_links ORDER BY id"))

@app.route('/api/reg-links', methods=['POST'])
def add_reg_link():
    d = request.json
    row = execute(
        "INSERT INTO reg_links (title,code,url,active,max_uses,used_count,expiry,created_on) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
        (d['title'], d['code'], d.get('url',''), d.get('active',True), d.get('maxUses',0), d.get('usedCount',0), d.get('expiry'), d.get('createdOn')),
        returning=True
    )
    audit('ADD_REG_LINK', f"title={d['title']} code={d['code']}")
    return jsonify(row), 201

@app.route('/api/reg-links/<int:id>', methods=['PUT'])
def update_reg_link(id):
    d = request.json
    execute(
        "UPDATE reg_links SET title=%s,code=%s,url=%s,active=%s,max_uses=%s,used_count=%s,expiry=%s WHERE id=%s",
        (d['title'], d['code'], d.get('url',''), d.get('active',True), d.get('maxUses',0), d.get('usedCount',0), d.get('expiry'), id)
    )
    audit('EDIT_REG_LINK', f"id={id} title={d['title']}")
    return jsonify({'ok': True})

@app.route('/api/reg-links/<int:id>', methods=['DELETE'])
def delete_reg_link(id):
    execute("DELETE FROM reg_links WHERE id=%s", (id,))
    audit('DELETE_REG_LINK', f"id={id}")
    return jsonify({'ok': True})

# ═══════════════════════════════════════════
# ANNOUNCEMENTS API
# ═══════════════════════════════════════════
@app.route('/api/announcements')
def get_announcements():
    return jsonify(query("SELECT * FROM announcements ORDER BY date DESC"))

@app.route('/api/announcements', methods=['POST'])
def add_announcement():
    d = request.json
    row = execute(
        "INSERT INTO announcements (title,content,date,author,priority,active) VALUES (%s,%s,%s,%s,%s,%s) RETURNING *",
        (d['title'], d.get('content',''), d.get('date'), d.get('author','Admin'), d.get('priority','medium'), d.get('active',True)),
        returning=True
    )
    audit('ADD_ANNOUNCEMENT', f"title={d['title']}")
    return jsonify(row), 201

@app.route('/api/announcements/<int:id>', methods=['PUT'])
def update_announcement(id):
    d = request.json
    execute(
        "UPDATE announcements SET title=%s,content=%s,date=%s,author=%s,priority=%s,active=%s WHERE id=%s",
        (d['title'], d.get('content',''), d.get('date'), d.get('author','Admin'), d.get('priority','medium'), d.get('active',True), id)
    )
    audit('EDIT_ANNOUNCEMENT', f"id={id} title={d['title']} active={d.get('active',True)}")
    return jsonify({'ok': True})

@app.route('/api/announcements/<int:id>', methods=['DELETE'])
def delete_announcement(id):
    execute("DELETE FROM announcements WHERE id=%s", (id,))
    audit('DELETE_ANNOUNCEMENT', f"id={id}")
    return jsonify({'ok': True})

# ═══════════════════════════════════════════
# ATTENDANCE APIs
# ═══════════════════════════════════════════
@app.route('/api/attendance/esatsang')
def get_esatsang():
    return jsonify(query("SELECT * FROM esatsang_attendance ORDER BY attendance_date DESC NULLS LAST, id DESC"))

@app.route('/api/attendance/esatsang/upload', methods=['POST'])
def upload_esatsang_attendance():
    """Accept xlsx or csv, parse, and import into esatsang_attendance."""
    if 'file' not in request.files:
        return jsonify({'ok': False, 'error': 'No file provided.'}), 400
    f = request.files['file']
    filename = f.filename.lower()
    try:
        if filename.endswith('.csv'):
            import csv, io
            text = f.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(text))
            raw = list(reader)
            headers = list(reader.fieldnames or [])
        elif filename.endswith(('.xlsx', '.xlsm', '.xls')):
            import openpyxl, io
            wb = openpyxl.load_workbook(io.BytesIO(f.read()), data_only=True)
            ws = wb.active
            all_rows = list(ws.iter_rows(values_only=True))
            if not all_rows:
                return jsonify({'ok': False, 'error': 'Empty workbook.'}), 400
            headers = [str(h).strip() if h is not None else '' for h in all_rows[0]]
            raw = [dict(zip(headers, [str(c).strip() if c is not None else '' for c in row])) for row in all_rows[1:]]
        else:
            return jsonify({'ok': False, 'error': 'Unsupported file type. Use .xlsx or .csv'}), 400

        def find_col(headers, *keywords):
            norm = lambda s: s.upper().replace(' ', '_').replace('-', '_')
            for h in headers:
                hn = norm(h)
                if any(kw in hn for kw in keywords):
                    return h
            return None

        col_date   = find_col(headers, 'ATTENDANCE_DATE', 'DATE', 'ATT_DATE')
        col_mid    = find_col(headers, 'MEMBER_ID', 'MID', 'MEMB_ID', 'MEMBER_I')
        col_event  = find_col(headers, 'EVENT_NAME', 'EVENT')
        col_first  = find_col(headers, 'FIRST_NAME', 'FIRST')
        col_mid_nm = find_col(headers, 'MIDDLE_NAME', 'MIDDLE')
        col_last   = find_col(headers, 'LAST_NAME', 'LAST')
        col_uid    = find_col(headers, 'MEMBER_UID', 'UID')
        col_branch = find_col(headers, 'BRANCH_NAME', 'BRANCH')
        col_loc    = find_col(headers, 'LOCATION', 'LOC')
        col_type   = find_col(headers, 'ATTENDANCE_TYPE', 'ATT_TYPE', 'TYPE')

        def sv(row, col):
            return str(row.get(col, '') or '').strip() if col else ''

        parsed = [
            {
                'date':      sv(r, col_date),
                'memberId':  sv(r, col_mid),
                'eventName': sv(r, col_event),
                'firstName': sv(r, col_first),
                'middleName':sv(r, col_mid_nm),
                'lastName':  sv(r, col_last),
                'memberUid': sv(r, col_uid),
                'branchName':sv(r, col_branch),
                'location':  sv(r, col_loc),
                'type':      sv(r, col_type),
            }
            for r in raw
            if sv(r, col_mid) or sv(r, col_first) or sv(r, col_uid)
        ]
        if not parsed:
            return jsonify({'ok': False, 'error': 'No valid data rows found.'}), 400

        # Bulk upsert — one DB round trip for all rows.
        # ON CONFLICT DO NOTHING skips exact duplicates (date+member_id+event).
        # Requires a unique index on those three columns (created if missing).
        from db import get_conn
        import psycopg2.extras, psycopg2
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                # Ensure unique index exists for dedup
                cur.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS uq_esatsang_date_member_event
                    ON esatsang_attendance (attendance_date, member_id, event_name)
                """)
                values = [
                    (r['date'] or None, r['memberId'], r['eventName'],
                     r['firstName'], r['middleName'], r['lastName'],
                     r['memberUid'], r['branchName'], r['location'], r['type'])
                    for r in parsed
                ]
                before = cur.execute("SELECT count(*) FROM esatsang_attendance") or 0
                cur.execute("SELECT count(*) FROM esatsang_attendance")
                before = cur.fetchone()[0]
                psycopg2.extras.execute_values(
                    cur,
                    """INSERT INTO esatsang_attendance
                       (attendance_date, member_id, event_name, first_name, middle_name,
                        last_name, member_uid, branch_name, location, attendance_type)
                       VALUES %s
                       ON CONFLICT (attendance_date, member_id, event_name) DO NOTHING""",
                    values,
                    page_size=2000
                )
                cur.execute("SELECT count(*) FROM esatsang_attendance")
                after = cur.fetchone()[0]
            conn.commit()
            inserted = after - before
            audit('UPLOAD_ESATSANG_ATTENDANCE', f"file={f.filename} inserted={inserted} skipped={len(parsed)-inserted}")
            return jsonify({'ok': True, 'count': inserted, 'skipped': len(parsed) - inserted}), 201
        except Exception as e:
            conn.rollback()
            raise
        finally:
            conn.close()
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/api/attendance/branch')
def get_branch_attendance():
    return jsonify(query("SELECT * FROM branch_attendance ORDER BY member_name"))

@app.route('/api/attendance/branch/upload', methods=['POST'])
def upload_branch_attendance():
    """Accept an xlsx or csv file upload, parse it, and import into branch_attendance."""
    if 'file' not in request.files:
        return jsonify({'ok': False, 'error': 'No file provided.'}), 400

    f = request.files['file']
    filename = f.filename.lower()

    rows = []
    try:
        if filename.endswith('.csv'):
            import csv, io
            text = f.read().decode('utf-8-sig')  # strips BOM if present
            reader = csv.DictReader(io.StringIO(text))
            raw = list(reader)
            headers = reader.fieldnames or []
        elif filename.endswith(('.xlsx', '.xlsm', '.xls')):
            import openpyxl, io
            wb = openpyxl.load_workbook(io.BytesIO(f.read()), data_only=True)
            ws = wb.active
            all_rows = list(ws.iter_rows(values_only=True))
            if not all_rows:
                return jsonify({'ok': False, 'error': 'Empty workbook.'}), 400
            headers = [str(h).strip() if h is not None else '' for h in all_rows[0]]
            raw = [dict(zip(headers, [str(c).strip() if c is not None else '' for c in row])) for row in all_rows[1:]]
        else:
            return jsonify({'ok': False, 'error': 'Unsupported file type. Use .xlsx or .csv'}), 400

        # Flexible column detection (case-insensitive, underscore/space-insensitive)
        def find_col(headers, *keywords):
            norm = lambda s: s.upper().replace(' ','_').replace('-','_')
            for h in headers:
                hn = norm(h)
                if any(kw in hn for kw in keywords):
                    return h
            return None

        col_id   = find_col(headers, 'MEMBER_ID', 'MID', 'MEMB_ID')
        col_name = find_col(headers, 'MEMBER_NAME', 'NAME', 'FULL_NAME')
        col_att  = find_col(headers, 'EVENTS_ATT', 'ATTENDED', 'ATT')
        col_tot  = find_col(headers, 'TOTAL', 'TOT_EVENTS', 'MAX_EVENTS')
        col_br   = find_col(headers, 'BRANCH')

        missing = [k for k, v in [('Member ID', col_id), ('Member Name', col_name),
                                   ('Events Attended', col_att), ('Total Events', col_tot),
                                   ('Branch', col_br)] if not v]
        if missing:
            return jsonify({
                'ok': False,
                'error': f"Could not detect columns: {', '.join(missing)}. "
                         f"Columns found: {', '.join(headers)}"
            }), 400

        def safe_int(v):
            try: return int(float(str(v).strip() or 0))
            except: return 0

        parsed = [
            {
                'memberId':     str(r.get(col_id, '') or '').strip(),
                'memberName':   str(r.get(col_name, '') or '').strip(),
                'eventsAttended': safe_int(r.get(col_att, 0)),
                'totalEvents':  safe_int(r.get(col_tot, 0)),
                'branch':       str(r.get(col_br, '') or '').strip(),
            }
            for r in raw if str(r.get(col_name, '') or '').strip()
        ]

        if not parsed:
            return jsonify({'ok': False, 'error': 'No valid data rows found.'}), 400

        execute("DELETE FROM branch_attendance")
        for r in parsed:
            execute(
                "INSERT INTO branch_attendance (member_id, member_name, events_attended, total_branch_events, branch_name) VALUES (%s,%s,%s,%s,%s)",
                (r['memberId'], r['memberName'], r['eventsAttended'], r['totalEvents'], r['branch'])
            )
        audit('UPLOAD_BRANCH_ATTENDANCE', f"file={f.filename} rows={len(parsed)}")
        return jsonify({'ok': True, 'count': len(parsed)}), 201

    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/api/attendance/haazri')
def get_haazri():
    return jsonify(query("SELECT * FROM haazri_attendance ORDER BY id"))

@app.route('/api/attendance/haazri', methods=['POST'])
def add_haazri_batch():
    """Accept an array of haazri records."""
    rows = request.json or []
    for r in rows:
        execute(
            "INSERT INTO haazri_attendance (uid,name,date_time_str,haazri_id,event_name,branch_name,geolocation_name) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (r.get('uid',''), r.get('name',''), r.get('dateTimeStr',''), r.get('haazriId',''), r.get('eventName',''), r.get('branchName',''), r.get('geolocationName',''))
        )
    return jsonify({'ok': True, 'count': len(rows)}), 201

# ═══════════════════════════════════════════
# DASHBOARD STATS (computed)
# ═══════════════════════════════════════════
@app.route('/api/dashboard/stats')
def dashboard_stats():
    stats = {}
    # Members — from member_details
    stats['totalMembers']    = query("SELECT count(*) as c FROM member_details", one=True)['c']
    stats['activeMembers']   = query("SELECT count(*) as c FROM member_details WHERE record_status='Activated'", one=True)['c']
    stats['transferIn']      = query("SELECT count(*) as c FROM member_details WHERE date_transfer_in IS NOT NULL", one=True)['c']
    stats['transferOut']     = query("SELECT count(*) as c FROM member_details WHERE date_transfer_out IS NOT NULL", one=True)['c']
    stats['expired']         = query("SELECT count(*) as c FROM member_details WHERE date_of_expire IS NOT NULL AND date_of_expire < CURRENT_DATE", one=True)['c']
    stats['pendingApprovals'] = 0
    # Reg links
    stats['activeRegLinks']  = query("SELECT count(*) as c FROM reg_links WHERE active=true", one=True)['c']
    # Zones
    stats['activeZones']     = query("SELECT count(*) as c FROM zones WHERE active=true", one=True)['c']
    stats['inactiveZones']   = query("SELECT count(*) as c FROM zones WHERE active=false", one=True)['c']
    stats['membersWithZone'] = query("SELECT count(*) as c FROM member_details WHERE city IS NOT NULL AND city != ''", one=True)['c']
    # Branch (no branches table, derive from member_details)
    stats['activeBranchCodes']   = query("SELECT count(DISTINCT branch_id_card_received) as c FROM member_details WHERE branch_id_card_received IS NOT NULL AND branch_id_card_received != ''", one=True)['c']
    stats['inactiveBranchCodes'] = 0
    stats['membersWithBranch']   = query("SELECT count(*) as c FROM member_details WHERE branch_id_card_received IS NOT NULL AND branch_id_card_received != ''", one=True)['c']
    return jsonify(stats)

@app.route('/api/dashboard/attendance-stats')
def dashboard_attendance_stats():
    esatsang_count = query("SELECT count(*) as c FROM esatsang_attendance", one=True)['c']
    audio = query("SELECT count(*) as c FROM esatsang_attendance WHERE attendance_type='AUDIO'", one=True)['c']
    video = query("SELECT count(*) as c FROM esatsang_attendance WHERE attendance_type='VIDEO'", one=True)['c']
    branch_total = query("SELECT count(*) as c FROM branch_attendance", one=True)['c']
    branch_attended = query("SELECT count(*) as c FROM branch_attendance WHERE events_attended > 0", one=True)['c']
    latest_date = query("SELECT MAX(attendance_date) as d FROM esatsang_attendance", one=True)
    return jsonify({
        'esatsangCount': esatsang_count,
        'audioCount': audio,
        'videoCount': video,
        'branchTotal': branch_total,
        'branchAttended': branch_attended,
        'latestDate': str(latest_date['d']) if latest_date and latest_date['d'] else ''
    })

# ═══════════════════════════════════════════
# CHANGE PASSWORD (authenticated user)
# ═══════════════════════════════════════════
@app.route('/api/auth/change-password', methods=['POST'])
def change_password():
    data = request.json or {}
    username = (data.get('username') or '').strip()
    old_password = data.get('oldPassword') or ''
    new_password = data.get('newPassword') or ''

    if len(new_password) < 6:
        return jsonify({'ok': False, 'error': 'New password must be at least 6 characters.'}), 400

    user = query("SELECT id FROM users WHERE username=%s AND password=%s", (username, old_password), one=True)
    if not user:
        return jsonify({'ok': False, 'error': 'Current password is incorrect.'}), 403

    execute("UPDATE users SET password=%s WHERE username=%s", (new_password, username))
    return jsonify({'ok': True})


if __name__ == '__main__':
    # Run schema + seed on first start
    from db import get_conn
    import seed as seed_module

    print("Setting up database...")
    conn = get_conn()
    cur = conn.cursor()
    with open(os.path.join(os.path.dirname(__file__), 'schema.sql')) as f:
        cur.execute(f.read())
    conn.commit()
    cur.close()
    conn.close()

    print("Seeding data...")
    seed_module.seed()

    print("Starting server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
