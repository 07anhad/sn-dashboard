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
