-- schema.sql — Create all tables for satsang_portal

-- Users (auth)
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(100) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'member',
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(200) UNIQUE NOT NULL,
    member_id   VARCHAR(50),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Zones
CREATE TABLE IF NOT EXISTS zones (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    code         VARCHAR(20) NOT NULL,
    active       BOOLEAN DEFAULT TRUE,
    member_count INTEGER DEFAULT 0,
    incharge     VARCHAR(200),
    phone        VARCHAR(20)
);

-- Branches
CREATE TABLE IF NOT EXISTS branches (
    id           SERIAL PRIMARY KEY,
    code         VARCHAR(50) NOT NULL,
    name         VARCHAR(200) NOT NULL,
    zone         VARCHAR(200),
    active       BOOLEAN DEFAULT TRUE,
    member_count INTEGER DEFAULT 0
);

-- Member Types (lookup)
CREATE TABLE IF NOT EXISTS member_types (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Members
CREATE TABLE IF NOT EXISTS members (
    uid             VARCHAR(50) PRIMARY KEY,
    bslno           VARCHAR(50),
    name            VARCHAR(200) NOT NULL,
    email           VARCHAR(200),
    mobile          VARCHAR(20),
    zone            VARCHAR(200),
    type            VARCHAR(100),
    status          VARCHAR(50) DEFAULT 'Active',
    approval_status VARCHAR(50) DEFAULT 'Pending',
    join_date       DATE
);

-- Registration Links
CREATE TABLE IF NOT EXISTS reg_links (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(300) NOT NULL,
    code        VARCHAR(50) NOT NULL,
    url         VARCHAR(500),
    active      BOOLEAN DEFAULT TRUE,
    max_uses    INTEGER DEFAULT 0,
    used_count  INTEGER DEFAULT 0,
    expiry      DATE,
    created_on  DATE DEFAULT CURRENT_DATE
);

-- Pending Member Registrations (submitted via reg link, awaiting admin approval)
-- Mirrors all user-fillable fields from member_details
CREATE TABLE IF NOT EXISTS pending_members (
    id                          SERIAL PRIMARY KEY,
    reg_link_code               VARCHAR(50),
    submitted_at                TIMESTAMP DEFAULT NOW(),
    status                      VARCHAR(20) DEFAULT 'pending',  -- pending | approved | rejected
    reviewed_at                 TIMESTAMP,
    reviewed_by                 VARCHAR(100),
    -- Personal
    name                        VARCHAR(200),
    uid                         VARCHAR(50),
    date_of_initiation          DATE,
    date_of_registration_jigyasu DATE,
    date_of_first_initiation    DATE,
    date_of_second_initiation   DATE,
    date_of_birth               DATE,
    blood_group                 VARCHAR(10),
    caste                       VARCHAR(100),
    nationality                 VARCHAR(100),
    profession                  VARCHAR(200),
    ashram                      VARCHAR(100),
    -- Contact
    mobile1                     VARCHAR(30),
    mobile2                     VARCHAR(30),
    landline                    VARCHAR(30),
    office_phone                VARCHAR(30),
    email1                      VARCHAR(200),
    email2                      VARCHAR(200),
    -- Address
    address_line1               VARCHAR(300),
    address_line2               VARCHAR(300),
    address_line3               VARCHAR(300),
    city                        VARCHAR(100),
    pincode                     VARCHAR(20),
    state                       VARCHAR(100),
    country                     VARCHAR(100),
    -- Professional
    qualification               VARCHAR(200),
    occupation                  VARCHAR(200),
    designation                 VARCHAR(200),
    organization                VARCHAR(200),
    -- Father
    father_title                VARCHAR(20),
    father_first_name           VARCHAR(100),
    father_middle_name          VARCHAR(100),
    father_last_name            VARCHAR(100),
    father_branch               VARCHAR(200),
    father_bslno                VARCHAR(50),
    father_uid                  VARCHAR(50),
    father_doi                  DATE,
    father_phone                VARCHAR(30),
    father_city                 VARCHAR(100),
    father_state                VARCHAR(100),
    -- Mother
    mother_title                VARCHAR(20),
    mother_first_name           VARCHAR(100),
    mother_middle_name          VARCHAR(100),
    mother_last_name            VARCHAR(100),
    mother_branch               VARCHAR(200),
    mother_bslno                VARCHAR(50),
    mother_uid                  VARCHAR(50),
    mother_doi                  DATE,
    mother_phone                VARCHAR(30),
    mother_city                 VARCHAR(100),
    mother_state                VARCHAR(100),
    -- Spouse
    spouse_title                VARCHAR(20),
    spouse_first_name           VARCHAR(100),
    spouse_middle_name          VARCHAR(100),
    spouse_last_name            VARCHAR(100),
    spouse_branch               VARCHAR(200),
    spouse_bslno                VARCHAR(50),
    spouse_uid                  VARCHAR(50),
    spouse_doi                  DATE,
    spouse_phone                VARCHAR(30),
    spouse_city                 VARCHAR(100),
    spouse_state                VARCHAR(100),
    -- Nee (maiden name)
    nee_first_name              VARCHAR(100),
    nee_middle_name             VARCHAR(100),
    nee_last_name               VARCHAR(100),
    -- Group memberships
    mahila_association_member   VARCHAR(10),
    youth_member                VARCHAR(10),
    associate_youth_member      VARCHAR(10),
    junior_pre_initiate_member  VARCHAR(10),
    senior_pre_initiate_member  VARCHAR(10),
    crc_member                  VARCHAR(10),
    cca_member                  VARCHAR(10),
    sant_su_member              VARCHAR(10),
    -- Reference 1
    ref1_name                   VARCHAR(200),
    ref1_address                VARCHAR(300),
    ref1_email                  VARCHAR(200),
    ref1_phone                  VARCHAR(30),
    ref1_branch                 VARCHAR(200),
    ref1_relation               VARCHAR(100),
    -- Reference 2
    ref2_name                   VARCHAR(200),
    ref2_address                VARCHAR(300),
    ref2_email                  VARCHAR(200),
    ref2_phone                  VARCHAR(30),
    ref2_branch                 VARCHAR(200),
    ref2_relation               VARCHAR(100),
    notes                       TEXT,
    seva_interests              TEXT
);

-- Migrate: add new columns to pending_members if upgrading from an older schema
ALTER TABLE pending_members ADD COLUMN IF NOT EXISTS uid                          VARCHAR(50);
ALTER TABLE pending_members ADD COLUMN IF NOT EXISTS date_of_initiation          DATE;
ALTER TABLE pending_members ADD COLUMN IF NOT EXISTS date_of_registration_jigyasu DATE;
ALTER TABLE pending_members ADD COLUMN IF NOT EXISTS date_of_first_initiation    DATE;
ALTER TABLE pending_members ADD COLUMN IF NOT EXISTS date_of_second_initiation   DATE;
ALTER TABLE pending_members ADD COLUMN IF NOT EXISTS member_type                  VARCHAR(50);
ALTER TABLE pending_members ADD COLUMN IF NOT EXISTS gender                       VARCHAR(20);
ALTER TABLE pending_members ADD COLUMN IF NOT EXISTS marital_status               VARCHAR(50);
ALTER TABLE pending_members ADD COLUMN IF NOT EXISTS previous_branch              VARCHAR(200);

-- Contributions
CREATE TABLE IF NOT EXISTS contributions (
    id          SERIAL PRIMARY KEY,
    member_name VARCHAR(200),
    member_id   VARCHAR(50),
    amount      NUMERIC(12,2) NOT NULL,
    category    VARCHAR(100),
    date        DATE,
    status      VARCHAR(50) DEFAULT 'Pending',
    mode        VARCHAR(50)
);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(300) NOT NULL,
    date          DATE,
    time          VARCHAR(20),
    venue         VARCHAR(300),
    type          VARCHAR(50),
    status        VARCHAR(50) DEFAULT 'Upcoming',
    attendees     INTEGER DEFAULT 0,
    max_attendees INTEGER DEFAULT 0
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id       SERIAL PRIMARY KEY,
    title    VARCHAR(300) NOT NULL,
    content  TEXT,
    date     DATE,
    author   VARCHAR(200),
    priority VARCHAR(20) DEFAULT 'medium',
    active   BOOLEAN DEFAULT TRUE
);

-- Seva Categories
CREATE TABLE IF NOT EXISTS seva_categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    active      BOOLEAN DEFAULT TRUE,
    sort_order  INTEGER DEFAULT 0
);

-- eSatsang Attendance
CREATE TABLE IF NOT EXISTS esatsang_attendance (
    id              SERIAL PRIMARY KEY,
    attendance_date DATE,
    member_id       VARCHAR(50),
    event_name      VARCHAR(300),
    first_name      VARCHAR(100),
    middle_name     VARCHAR(100),
    last_name       VARCHAR(100),
    member_uid      VARCHAR(50),
    branch_name     VARCHAR(200),
    location        VARCHAR(200),
    attendance_type VARCHAR(50)
);

-- Indexes for esatsang_attendance (speed up ORDER BY date, member UID lookups)
CREATE INDEX IF NOT EXISTS idx_esatsang_date     ON esatsang_attendance (attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_esatsang_uid      ON esatsang_attendance (member_uid);
CREATE INDEX IF NOT EXISTS idx_esatsang_member   ON esatsang_attendance (member_id);
CREATE INDEX IF NOT EXISTS idx_esatsang_branch   ON esatsang_attendance (branch_name);

-- Branch Attendance
CREATE TABLE IF NOT EXISTS branch_attendance (
    id                  SERIAL PRIMARY KEY,
    member_id           VARCHAR(50),
    member_name         VARCHAR(200),
    events_attended     INTEGER DEFAULT 0,
    total_branch_events INTEGER DEFAULT 0,
    branch_name         VARCHAR(200)
);

-- Haazri Attendance
CREATE TABLE IF NOT EXISTS haazri_attendance (
    id                SERIAL PRIMARY KEY,
    uid               VARCHAR(50),
    name              VARCHAR(200),
    date_time_str     VARCHAR(100),
    haazri_id         VARCHAR(50),
    event_name        VARCHAR(300),
    branch_name       VARCHAR(200),
    geolocation_name  VARCHAR(300)
);

-- Member Details (imported from Excel)
CREATE TABLE IF NOT EXISTS member_details (
    sl                              INTEGER,
    uid                             VARCHAR(50) PRIMARY KEY,
    name                            VARCHAR(200),
    date_of_initiation              DATE,
    bsl                             VARCHAR(50),
    date_of_birth                   DATE,
    date_of_registration_jigyasu    DATE,
    date_of_first_initiation        DATE,
    date_of_second_initiation       DATE,
    caste                           VARCHAR(100),
    nationality                     VARCHAR(100),
    qualification                   VARCHAR(200),
    occupation                      VARCHAR(200),
    designation                     VARCHAR(200),
    organization                    VARCHAR(200),
    profession                      VARCHAR(200),
    address_line1                   VARCHAR(300),
    address_line2                   VARCHAR(300),
    address_line3                   VARCHAR(300),
    city                            VARCHAR(100),
    pincode                         VARCHAR(20),
    state                           VARCHAR(100),
    country                         VARCHAR(100),
    sn_ext                          VARCHAR(50),
    ashram                          VARCHAR(100),
    email1                          VARCHAR(200),
    email2                          VARCHAR(200),
    mobile1                         VARCHAR(30),
    mobile2                         VARCHAR(30),
    landline                        VARCHAR(30),
    office_phone                    VARCHAR(30),
    blood_group                     VARCHAR(10),
    branch_id_card_received         VARCHAR(100),
    father_title                    VARCHAR(20),
    father_first_name               VARCHAR(100),
    father_middle_name              VARCHAR(100),
    father_last_name                VARCHAR(100),
    father_branch                   VARCHAR(200),
    father_bslno                    VARCHAR(50),
    father_uid                      VARCHAR(50),
    father_doi                      DATE,
    father_phone                    VARCHAR(30),
    father_city                     VARCHAR(100),
    father_state                    VARCHAR(100),
    mother_title                    VARCHAR(20),
    mother_first_name               VARCHAR(100),
    mother_middle_name              VARCHAR(100),
    mother_last_name                VARCHAR(100),
    mother_branch                   VARCHAR(200),
    mother_bslno                    VARCHAR(50),
    mother_uid                      VARCHAR(50),
    mother_doi                      DATE,
    mother_phone                    VARCHAR(30),
    mother_city                     VARCHAR(100),
    mother_state                    VARCHAR(100),
    spouse_title                    VARCHAR(20),
    spouse_first_name               VARCHAR(100),
    spouse_middle_name              VARCHAR(100),
    spouse_last_name                VARCHAR(100),
    spouse_branch                   VARCHAR(200),
    spouse_bslno                    VARCHAR(50),
    spouse_uid                      VARCHAR(50),
    spouse_doi                      DATE,
    spouse_phone                    VARCHAR(30),
    spouse_city                     VARCHAR(100),
    spouse_state                    VARCHAR(100),
    mahila_association_member       VARCHAR(10),
    youth_member                    VARCHAR(10),
    associate_youth_member          VARCHAR(10),
    junior_pre_initiate_member      VARCHAR(10),
    senior_pre_initiate_member      VARCHAR(10),
    crc_member                      VARCHAR(10),
    cca_member                      VARCHAR(10),
    sant_su_member                  VARCHAR(10),
    nee_first_name                  VARCHAR(100),
    nee_middle_name                 VARCHAR(100),
    nee_last_name                   VARCHAR(100),
    ref1_name                       VARCHAR(200),
    ref1_address                    VARCHAR(300),
    ref1_email                      VARCHAR(200),
    ref1_phone                      VARCHAR(30),
    ref1_branch                     VARCHAR(200),
    ref1_relation                   VARCHAR(100),
    ref2_name                       VARCHAR(200),
    ref2_address                    VARCHAR(300),
    ref2_email                      VARCHAR(200),
    ref2_phone                      VARCHAR(30),
    ref2_branch                     VARCHAR(200),
    ref2_relation                   VARCHAR(100),
    dor_youth                       DATE,
    date_of_initiation_new          DATE,
    date_transfer_in                DATE,
    transfer_from_branch            VARCHAR(200),
    date_transfer_out               DATE,
    transfer_to_branch              VARCHAR(200),
    date_of_expire                  DATE,
    record_status                   VARCHAR(50),
    profession_code                 VARCHAR(50),
    communication_grid_code         VARCHAR(50),
    -- Extra fields from FormA
    category                        VARCHAR(100),
    gender                          VARCHAR(20),
    marital_status                  VARCHAR(50),
    previous_branch                 VARCHAR(200)
);

-- Migrate: add FormA extra columns to member_details if upgrading
ALTER TABLE member_details ADD COLUMN IF NOT EXISTS category        VARCHAR(100);
ALTER TABLE member_details ADD COLUMN IF NOT EXISTS gender          VARCHAR(20);
ALTER TABLE member_details ADD COLUMN IF NOT EXISTS marital_status  VARCHAR(50);
ALTER TABLE member_details ADD COLUMN IF NOT EXISTS previous_branch VARCHAR(200);

-- Mandatory "Form A" text columns: backfill blanks to 'N/A', default 'N/A', enforce NOT NULL.
-- (Date columns are left nullable — they surface as N/A only in the Form A export.)
DO $$
DECLARE col TEXT;
BEGIN
    FOREACH col IN ARRAY ARRAY[
        'name','category','gender','caste','nationality','qualification','occupation',
        'address_line1','city','pincode','state','country','mobile1',
        'father_title','father_first_name','nee_first_name'
    ] LOOP
        EXECUTE format('UPDATE member_details SET %I = ''N/A'' WHERE %I IS NULL OR btrim(%I) = ''''', col, col, col);
        EXECUTE format('ALTER TABLE member_details ALTER COLUMN %I SET DEFAULT ''N/A''', col);
        EXECUTE format('ALTER TABLE member_details ALTER COLUMN %I SET NOT NULL', col);
    END LOOP;
END $$;

-- Superhumane (children in Sant-Su scheme) — linked to parents via father_uid / mother_uid
CREATE TABLE IF NOT EXISTS superhumane_details (
    id                  SERIAL PRIMARY KEY,
    sno                 INTEGER,
    member_type         VARCHAR(50),
    name                VARCHAR(200),
    form_check          VARCHAR(200),
    uid_check           VARCHAR(100),
    bsl                 VARCHAR(50),
    gender              VARCHAR(5),
    comments            TEXT,
    uid                 VARCHAR(50) UNIQUE,
    date_of_birth       DATE,
    phase               INTEGER,
    branch              VARCHAR(200),
    father_name         VARCHAR(200),
    father_contact      VARCHAR(30),
    father_uid          VARCHAR(50),
    father_doi          DATE,
    mother_name         VARCHAR(200),
    mother_contact      VARCHAR(30),
    mother_uid          VARCHAR(50),
    mother_doi          DATE,
    address             TEXT,
    grandfather_name    VARCHAR(200),
    grandfather_uid     VARCHAR(50),
    grandfather_contact VARCHAR(30),
    grandmother_name    VARCHAR(200),
    grandmother_uid     VARCHAR(50),
    grandmother_contact VARCHAR(30),
    date_entry_scheme   DATE,
    date_exit_scheme    DATE
);

-- OTP tokens for email-based login verification
CREATE TABLE IF NOT EXISTS otp_tokens (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(200) NOT NULL,
    code       VARCHAR(6)   NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      DEFAULT FALSE,
    created_at TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens (email);

CREATE TABLE IF NOT EXISTS member_edit_log (
    id             SERIAL PRIMARY KEY,
    member_uid     TEXT NOT NULL,
    member_name    TEXT,
    edited_by      TEXT,
    edited_at      TIMESTAMPTZ DEFAULT NOW(),
    fields_changed TEXT
);
CREATE INDEX IF NOT EXISTS idx_mel_edited_at ON member_edit_log (edited_at DESC);
