# SN Dashboard

## Requirements
- Python 3.10+
- PostgreSQL (pgAdmin is fine)

---

## First-time setup on a new machine

### 1. Clone the repo
```
git clone <your-github-url>
cd sn-dashboard
```

### 2. Create the PostgreSQL database
Open **pgAdmin** (or psql) and run:
```sql
CREATE DATABASE satsang_portal;
```
The user/password defaults to `postgres`.  
To use different credentials, set environment variables before starting the server:
```
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=satsang_portal
DB_HOST=localhost
DB_PORT=5432
```

### 3. Create a virtual environment and install dependencies
**Windows:**
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```
**Mac/Linux:**
```
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Start the server
**Windows:**
```
.venv\Scripts\python.exe server/app.py
```
**Mac/Linux:**
```
.venv/bin/python server/app.py
```

---

## Notes
- **Attendance data** lives in `esatsang_attendance` table — upload via the Haazri tab
- **Member data** lives in `member_details` table — upload via the Members tab (Excel/CSV upload button)
- The `.venv/` folder is gitignored — never commit it

## Importing Data

### Members (Initiated + Jigyasus)
Go to **Dashboard → Members** and click **"Upload Excel / CSV"** at the top.
- Accepts `.xlsx`, `.xlsm`, or `.csv` files
- **Multi-sheet support**: Automatically imports from all sheets with member data (FormA, Jigyasus, etc.)
- **Required column**: UID
- All other columns are auto-detected from Excel headers (e.g., Name, Mobile-1, Email-1, City, etc.)
- Existing records (matching UID) are updated; new UIDs are inserted
- No Python environment needed — works entirely from the browser

### Superhumane (Sant-Su Children)
Go to **Dashboard → Members → Superhumane (Sant-Su)** tab and click **"Upload Excel / CSV"**.
- Auto-detects Superhumane sheet from your Excel file
- Imports children data including parent info (Father/Mother UID, contact, DOI)
- **Required column**: UID
- Supports the standard FormA Excel format with Superhumane sheet

### Attendance
Go to **Dashboard → Haazri** and click **"Upload Excel / CSV"**.
- Accepts `.xlsx` or `.csv` files
- Required columns: Attendance Date, Member ID, Event Name
- Duplicates (same date + member + event) are automatically skipped

---

## Production Deployment

### Platform
Configured for **Railway** (also works on Render, Heroku, any Linux VPS).

### Tech Stack
| | |
|---|---|
| Language | Python 3.11.4 |
| Web framework | Flask + Gunicorn |
| Database | PostgreSQL |
| Start command | `gunicorn --bind 0.0.0.0:$PORT --workers 4 --threads 2 server.app:app` |

### Environment Variables
Set these in the platform's dashboard (e.g. Railway → Variables tab):

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgres://user:password@host:port/dbname` | Platform usually provides this automatically when you add a Postgres plugin |
| `SECRET_KEY` | any random 32+ character string | Used for Flask session signing |

If `DATABASE_URL` is not available as a single URL, these individual vars are also supported:

| Variable | Example |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | *(your db password)* |
| `DB_NAME` | `satsang_portal` |

### Database Setup
After the PostgreSQL database is created on the platform, run the schema once to create all tables:
```bash
psql -h <host> -U <user> -d <dbname> -f server/schema.sql
```
Or open the platform's DB shell and paste the contents of `server/schema.sql`.

### Files to deploy (entire repo)
```
server/app.py        ← main application
server/db.py         ← database helper
server/schema.sql    ← run once to create tables
manifest.json        ← PWA manifest
sw.js                ← service worker
icons/               ← app icons
html/ css/ js/       ← frontend
Procfile             ← start command (Railway/Heroku reads this automatically)
requirements.txt
runtime.txt
```

### PWA / Mobile App
This app is a Progressive Web App (PWA). Members can install it on their phones:
- **Android (Chrome)**: Browser will show an "Add to Home Screen" prompt automatically
- **iPhone (Safari only)**: Tap the Share button → "Add to Home Screen"
  _(must use Safari, not Chrome, on iPhone)_

> **Security note**: Never share your actual `SECRET_KEY` or `DB_PASSWORD` over chat/email. Enter them directly into the platform's environment variable settings.

