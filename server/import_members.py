"""
import_members.py — Import member_details.xlsm into the member_details table.

Usage:
    python server/import_members.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

import openpyxl
from datetime import datetime, date
from db import get_conn

EXCEL_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'dataset', 'member_details.xlsm'
)

# Maps Excel column header → DB column name (in order, matching the sheet)
COLUMN_MAP = [
    ('SL',                                    'sl'),
    ('UID',                                   'uid'),
    ('Name',                                  'name'),
    ('Date of Initiation',                    'date_of_initiation'),
    ('BSL',                                   'bsl'),
    ('Date of Birth',                         'date_of_birth'),
    ('Date of Registration (Jigyasu)',         'date_of_registration_jigyasu'),
    ('Date of First Initiation',              'date_of_first_initiation'),
    ('Date of Second Initiation',             'date_of_second_initiation'),
    ('caste',                                 'caste'),
    ('Nationality',                           'nationality'),
    ('Qualification',                         'qualification'),
    ('Occupation',                            'occupation'),
    ('Designation',                           'designation'),
    ('Organization',                          'organization'),
    ('Profession',                            'profession'),
    ('Address Line1',                         'address_line1'),
    ('Address Line2',                         'address_line2'),
    ('Address Line3',                         'address_line3'),
    ('City',                                  'city'),
    ('Pincode',                               'pincode'),
    ('State',                                 'state'),
    ('Country',                               'country'),
    ('SN/EXT',                               'sn_ext'),
    ('ASHRAM',                               'ashram'),
    ('Email-1',                               'email1'),
    ('Email-2',                               'email2'),
    ('Mobile-1',                              'mobile1'),
    ('Mobile-2',                              'mobile2'),
    ('Landline',                              'landline'),
    ('Office Phone',                          'office_phone'),
    ('Blood Group',                           'blood_group'),
    ('Branch I. Card Received',               'branch_id_card_received'),
    ('Father Title',                          'father_title'),
    ('Father First Name',                     'father_first_name'),
    ('Father Middle Name',                    'father_middle_name'),
    ('Father Last Name',                      'father_last_name'),
    ('Father Branch',                         'father_branch'),
    ('Father BSLNO',                          'father_bslno'),
    ('Father UID',                            'father_uid'),
    ('Father DOI',                            'father_doi'),
    ('Father Phone No.',                      'father_phone'),
    ('Father City',                           'father_city'),
    ('Father State',                          'father_state'),
    ('Mother Title',                          'mother_title'),
    ('Mother First Name',                     'mother_first_name'),
    ('Mother Middle Name',                    'mother_middle_name'),
    ('Mother Last Name',                      'mother_last_name'),
    ('Mother Branch',                         'mother_branch'),
    ('Mother BSLNO',                          'mother_bslno'),
    ('Mother UID',                            'mother_uid'),
    ('Mother DOI',                            'mother_doi'),
    ('Mother Phone No.',                      'mother_phone'),
    ('Mother City',                           'mother_city'),
    ('Mother State',                          'mother_state'),
    ('Spouse Title',                          'spouse_title'),
    ('Spouse First Name',                     'spouse_first_name'),
    ('Spouse Middle Name',                    'spouse_middle_name'),
    ('Spouse Last Name',                      'spouse_last_name'),
    ('Spouse Branch',                         'spouse_branch'),
    ('Spouse BSLNO',                          'spouse_bslno'),
    ('Spouse UID',                            'spouse_uid'),
    ('Spouse DOI',                            'spouse_doi'),
    ('Spouse Phone No.',                      'spouse_phone'),
    ('Spouse City',                           'spouse_city'),
    ('Spouse State',                          'spouse_state'),
    ('Mahila Association Member',             'mahila_association_member'),
    ('Youth Member',                          'youth_member'),
    ('Associate Youth Member',                'associate_youth_member'),
    ('Junior Pre Initiate Member',            'junior_pre_initiate_member'),
    ('Senior Pre Initiate Member',            'senior_pre_initiate_member'),
    ('CRC Member',                            'crc_member'),
    ('CCA Member',                            'cca_member'),
    ('Sant-Su Member',                        'sant_su_member'),
    ('Nee (First Name)',                      'nee_first_name'),
    ('Nee (Middle Name)',                     'nee_middle_name'),
    ('Nee (Last Name)',                       'nee_last_name'),
    ('Ref-1 (Name)',                          'ref1_name'),
    ('Ref-1 (Address)',                       'ref1_address'),
    ('Ref-1 (E-mail)',                        'ref1_email'),
    ('Ref-1 (Mobile/Phone)',                  'ref1_phone'),
    ('Ref-1 (Branch Name)',                   'ref1_branch'),
    ('Ref-1 (Relation)',                      'ref1_relation'),
    ('Ref-2 (Name)',                          'ref2_name'),
    ('Ref-2 (Address)',                       'ref2_address'),
    ('Ref-3 (E-mail)',                        'ref2_email'),
    ('Ref-4 (Mobile/Phone)',                  'ref2_phone'),
    ('Ref-5 (Branch Name)',                   'ref2_branch'),
    ('Ref-6 (Relation)',                      'ref2_relation'),
    ('DOR (youth)',                           'dor_youth'),
    ('Date of Initiation (For New Initiate)', 'date_of_initiation_new'),
    ('Date of Transfer In',                   'date_transfer_in'),
    ('Transfer From (Branch)',                'transfer_from_branch'),
    ('Date of Transfer Out',                  'date_transfer_out'),
    ('Transfer To (Branch)',                  'transfer_to_branch'),
    ('Date of Expire',                        'date_of_expire'),
    ('Record Status',                         'record_status'),
    ('Profession Code',                       'profession_code'),
    ('Communication Grid Code',              'communication_grid_code'),
]

DATE_COLUMNS = {
    'date_of_initiation', 'date_of_birth', 'date_of_registration_jigyasu',
    'date_of_first_initiation', 'date_of_second_initiation',
    'father_doi', 'mother_doi', 'spouse_doi',
    'dor_youth', 'date_of_initiation_new',
    'date_transfer_in', 'date_transfer_out', 'date_of_expire',
}


def parse_date(val):
    """Return a date object or None from various possible cell formats."""
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        return val if isinstance(val, date) else val.date()
    s = str(val).strip()
    if not s:
        return None
    for fmt in ('%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d', '%m/%d/%Y', '%d-%b-%Y', '%d %b %Y'):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None


def clean(val, db_col):
    """Coerce a cell value to the appropriate Python type for the DB column."""
    if val is None:
        return None
    if db_col == 'sl':
        try:
            return int(val)
        except (TypeError, ValueError):
            return None
    if db_col in DATE_COLUMNS:
        return parse_date(val)
    # Everything else → string, stripped (incl. non-breaking spaces), None if empty
    s = str(val).replace('\xa0', ' ').strip() if not isinstance(val, str) else val.replace('\xa0', ' ').strip()
    return s if s else None


def build_header_index(ws, header_row=2):
    """
    Read the given header_row and return a dict {excel_header_text: col_index (0-based)}.
    Strips regular and non-breaking whitespace.
    """
    headers = {}
    for idx, cell in enumerate(next(ws.iter_rows(min_row=header_row, max_row=header_row))):
        if cell.value is not None:
            key = str(cell.value).replace('\xa0', ' ').strip()
            headers[key] = idx
    return headers


def import_members():
    path = os.path.abspath(EXCEL_PATH)
    print(f"Opening: {path}")

    wb = openpyxl.load_workbook(path, read_only=True, keep_vba=False, data_only=True)
    ws = wb.active
    print(f"Active sheet: {ws.title}")

    HEADER_ROW = 2
    DATA_START_ROW = 3
    header_index = build_header_index(ws, header_row=HEADER_ROW)

    # Resolve which Excel column index maps to each DB column
    col_mapping = []   # list of (db_col, excel_col_idx)
    for excel_hdr, db_col in COLUMN_MAP:
        if excel_hdr in header_index:
            col_mapping.append((db_col, header_index[excel_hdr]))
        else:
            print(f"  WARNING: header '{excel_hdr}' not found in sheet — column will be NULL")

    db_cols = [db_col for db_col, _ in col_mapping]
    placeholders = ', '.join(['%s'] * len(db_cols))
    col_names = ', '.join(db_cols)

    INSERT_SQL = (
        f"INSERT INTO member_details ({col_names}) VALUES ({placeholders}) "
        f"ON CONFLICT (uid) DO UPDATE SET "
        + ', '.join(f"{c} = EXCLUDED.{c}" for c in db_cols if c != 'uid')
    )

    conn = get_conn()
    cur = conn.cursor()

    inserted = 0
    skipped = 0

    for row_num, row in enumerate(ws.iter_rows(min_row=DATA_START_ROW, values_only=True), start=DATA_START_ROW):
        # Skip completely empty rows
        if all(cell is None for cell in row):
            continue

        values = []
        uid_val = None
        for db_col, col_idx in col_mapping:
            raw = row[col_idx] if col_idx < len(row) else None
            v = clean(raw, db_col)
            values.append(v)
            if db_col == 'uid':
                uid_val = v

        # Skip rows with no UID
        if not uid_val:
            skipped += 1
            continue

        try:
            cur.execute(INSERT_SQL, values)
            inserted += 1
        except Exception as e:
            print(f"  Row {row_num} (UID={uid_val}): ERROR — {e}")
            conn.rollback()
            skipped += 1
            continue

    conn.commit()
    cur.close()
    conn.close()
    wb.close()

    print(f"\nDone. Inserted/updated: {inserted}  |  Skipped: {skipped}")


if __name__ == '__main__':
    import_members()
