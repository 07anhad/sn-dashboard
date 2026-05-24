# SN Dashboard — Setup Guide

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
The user/password defaults to `postgres` / `anhad12345`.  
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

The server starts at **http://localhost:5000**  
On first run it automatically:
- Creates all tables (`schema.sql`)
- Seeds initial data (admin user, member types, etc.)

### 5. Open in browser
Go to **http://localhost:5000**

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
