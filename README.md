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
- Attendance data lives in `esatsang_attendance` table — upload via the Haazri tab
- Member data lives in `member_details` table (831 rows seeded from `seed.py`)
- The `.venv/` folder is gitignored — never commit it
