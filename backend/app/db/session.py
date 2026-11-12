import os
import sqlite3
import pandas as pd
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = Path("backend/app/db/relic.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def init_db():
    """Initialize database tables and seed initial data if not present."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Officers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS officers (
        badge_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        zone TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        rank TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Complaints Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS complaints (
        complaint_id TEXT PRIMARY KEY,
        complaint_date TEXT NOT NULL,
        fraud_type TEXT NOT NULL,
        reported_amount REAL NOT NULL,
        victim_account_id TEXT NOT NULL,
        transaction_id TEXT,
        beneficiary_account_id TEXT NOT NULL,
        beneficiary_upi_id TEXT,
        complaint_status TEXT DEFAULT 'unresolved',
        priority TEXT DEFAULT 'HIGH',
        linked_fraud_account INTEGER DEFAULT 1,
        beneficiary_city TEXT,
        assigned_officer_id TEXT,
        assigned_officer_name TEXT,
        officer_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(assigned_officer_id) REFERENCES officers(badge_id)
    );
    """)

    # 3. Investigation Notes & Case Timeline
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS investigation_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id TEXT NOT NULL,
        officer_id TEXT NOT NULL,
        officer_name TEXT NOT NULL,
        note_text TEXT NOT NULL,
        action_type TEXT DEFAULT 'NOTE_ADDED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(complaint_id) REFERENCES complaints(complaint_id)
    );
    """)

    # 4. Evidence and CCTV References
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id TEXT NOT NULL,
        officer_id TEXT NOT NULL,
        title TEXT NOT NULL,
        evidence_type TEXT NOT NULL,
        description TEXT,
        atm_id TEXT,
        cctv_camera_id TEXT,
        footage_window_start TEXT,
        footage_window_end TEXT,
        bank_contact_person TEXT,
        request_status TEXT DEFAULT 'REQUESTED',
        file_reference TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(complaint_id) REFERENCES complaints(complaint_id)
    );
    """)

    # 5. Predictions History
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id TEXT,
        account_id TEXT NOT NULL,
        amount REAL NOT NULL,
        registered_city TEXT,
        top1_atm_id TEXT,
        top1_score REAL,
        top2_atm_id TEXT,
        top2_score REAL,
        top3_atm_id TEXT,
        top3_score REAL,
        predicted_window_start TEXT,
        predicted_window_end TEXT,
        expected_amount REAL,
        advisory TEXT,
        generated_by_officer_id TEXT,
        generated_by_officer_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Alerts & Notifications
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        complaint_id TEXT,
        atm_id TEXT,
        zone TEXT,
        severity TEXT DEFAULT 'HIGH',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 7. Audit Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        officer_id TEXT NOT NULL,
        officer_name TEXT,
        action TEXT NOT NULL,
        module TEXT NOT NULL,
        target_id TEXT,
        details TEXT,
        ip_address TEXT DEFAULT '127.0.0.1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 8. Accounts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS accounts (
        account_id TEXT PRIMARY KEY,
        account_number_hash TEXT,
        account_holder_hash TEXT,
        upi_id TEXT,
        bank_id TEXT,
        branch_id TEXT,
        ifsc TEXT,
        account_type TEXT,
        account_open_date TEXT,
        account_status TEXT,
        registered_mobile_hash TEXT,
        registered_email_hash TEXT,
        registered_address_region TEXT,
        is_fraud_confirmed INTEGER
    );
    """)

    # 9. ATMs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS atm_locations (
        atm_id TEXT PRIMARY KEY,
        bank_id TEXT,
        latitude REAL,
        longitude REAL,
        address TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        atm_status TEXT
    );
    """)

    # 10. Transactions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        transaction_id TEXT PRIMARY KEY,
        utr_reference TEXT,
        sender_account_id TEXT,
        receiver_account_id TEXT,
        amount REAL,
        transaction_datetime TEXT,
        transaction_type TEXT,
        transaction_status TEXT,
        transaction_direction TEXT,
        sender_bank_id TEXT,
        receiver_bank_id TEXT,
        sender_ifsc TEXT,
        receiver_ifsc TEXT,
        balance_before REAL,
        balance_after REAL
    );
    """)

    # 11. Withdrawals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS withdrawals (
        withdrawal_id TEXT PRIMARY KEY,
        transaction_id TEXT,
        account_id TEXT,
        card_id_hash TEXT,
        atm_id TEXT,
        withdrawal_datetime TEXT,
        amount REAL,
        withdrawal_status TEXT,
        fraud_linked INTEGER
    );
    """)

    conn.commit()

    # Seed initial officers if empty
    cursor.execute("SELECT COUNT(*) FROM officers")
    if cursor.fetchone()[0] == 0:
        seed_officers = [
            ("admin", "Director General Rajiv Sharma", "admin", "Head Admin", "All Zones", "rajiv.sharma@cybercrime.gov.in", "+91 98140 10001", "Director General"),
            ("OFFICER_007", "ACP Vikram Sen", "relic2026", "Regional/Zonal Admin", "Jalandhar", "vikram.sen@cybercrime.gov.in", "+91 98140 10007", "Assistant Commissioner"),
            ("OFFICER_704", "Insp. Ananya Roy", "relic2026", "Investigator", "Ludhiana", "ananya.roy@cybercrime.gov.in", "+91 98140 10704", "Inspector"),
            ("OFFICER_102", "SI Gurpreet Singh", "relic2026", "Investigator", "Amritsar", "gurpreet.singh@cybercrime.gov.in", "+91 98140 10102", "Sub-Inspector"),
            ("OFFICER_205", "Insp. Harpreet Kaur", "relic2026", "Investigator", "Phagwara", "harpreet.kaur@cybercrime.gov.in", "+91 98140 10205", "Inspector"),
            ("OFFICER_309", "ACP Baldev Verma", "relic2026", "Regional/Zonal Admin", "Ludhiana", "baldev.verma@cybercrime.gov.in", "+91 98140 10309", "Assistant Commissioner"),
            ("OFFICER_412", "SI Rajesh Dogra", "relic2026", "Investigator", "Hoshiarpur", "rajesh.dogra@cybercrime.gov.in", "+91 98140 10412", "Sub-Inspector"),
            ("OFFICER_518", "Insp. Manjit Sandhu", "relic2026", "Investigator", "Kapurthala", "manjit.sandhu@cybercrime.gov.in", "+91 98140 10518", "Inspector")
        ]
        cursor.executemany("""
        INSERT INTO officers (badge_id, name, password, role, zone, email, phone, rank)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_officers)
        conn.commit()

    # Seed Accounts from CSV if empty
    cursor.execute("SELECT COUNT(*) FROM accounts")
    if cursor.fetchone()[0] == 0 and os.path.exists("data/raw/accounts.csv"):
        df_acc = pd.read_csv("data/raw/accounts.csv")
        df_acc.to_sql("accounts", conn, if_exists="append", index=False)

    # Seed ATMs from CSV if empty
    cursor.execute("SELECT COUNT(*) FROM atm_locations")
    if cursor.fetchone()[0] == 0 and os.path.exists("data/raw/atm_locations.csv"):
        df_atm = pd.read_csv("data/raw/atm_locations.csv")
        df_atm.to_sql("atm_locations", conn, if_exists="append", index=False)

    # Seed Transactions from CSV if empty
    cursor.execute("SELECT COUNT(*) FROM transactions")
    if cursor.fetchone()[0] == 0 and os.path.exists("data/raw/transactions.csv"):
        df_tx = pd.read_csv("data/raw/transactions.csv")
        df_tx.to_sql("transactions", conn, if_exists="append", index=False)

    # Seed Withdrawals from CSV if empty
    cursor.execute("SELECT COUNT(*) FROM withdrawals")
    if cursor.fetchone()[0] == 0 and os.path.exists("data/raw/withdrawals.csv"):
        df_wd = pd.read_csv("data/raw/withdrawals.csv")
        df_wd.to_sql("withdrawals", conn, if_exists="append", index=False)

    # Seed Complaints from CSV if empty
    cursor.execute("SELECT COUNT(*) FROM complaints")
    if cursor.fetchone()[0] == 0 and os.path.exists("data/raw/complaints.csv"):
        df_comp = pd.read_csv("data/raw/complaints.csv")
        # Map cities
        df_acc_map = pd.read_csv("data/raw/accounts.csv").set_index("account_id")["registered_address_region"].to_dict()
        
        complaint_rows = []
        for _, row in df_comp.iterrows():
            ben_id = str(row["beneficiary_account_id"]).strip()
            city = df_acc_map.get(ben_id, "Jalandhar")
            amt = float(row.get("reported_amount", 25000))
            priority = "HIGH" if amt >= 40000 or str(row.get("fraud_type")).lower() in ["investment scam", "remote access scam"] else ("MEDIUM" if amt >= 15000 else "LOW")
            status = str(row.get("complaint_status", "unresolved"))

            # Assign some officers realistically based on city
            officer_id = None
            officer_name = None
            if status in ["under investigation", "confirmed"]:
                if city == "Jalandhar":
                    officer_id, officer_name = "OFFICER_007", "ACP Vikram Sen"
                elif city == "Ludhiana":
                    officer_id, officer_name = "OFFICER_704", "Insp. Ananya Roy"
                elif city == "Amritsar":
                    officer_id, officer_name = "OFFICER_102", "SI Gurpreet Singh"
                elif city == "Phagwara":
                    officer_id, officer_name = "OFFICER_205", "Insp. Harpreet Kaur"
                elif city == "Hoshiarpur":
                    officer_id, officer_name = "OFFICER_412", "SI Rajesh Dogra"
                elif city == "Kapurthala":
                    officer_id, officer_name = "OFFICER_518", "Insp. Manjit Sandhu"

            complaint_rows.append((
                str(row["complaint_id"]),
                str(row["complaint_date"]),
                str(row["fraud_type"]),
                amt,
                str(row["victim_account_id"]),
                str(row.get("transaction_id", "")) if not pd.isna(row.get("transaction_id")) else None,
                ben_id,
                str(row.get("beneficiary_upi_id", f"user{ben_id}@syntheticupi")),
                status,
                priority,
                int(row.get("linked_fraud_account", 1)),
                city,
                officer_id,
                officer_name,
                "Case synced from national NCR portal."
            ))

        cursor.executemany("""
        INSERT OR IGNORE INTO complaints (
            complaint_id, complaint_date, fraud_type, reported_amount,
            victim_account_id, transaction_id, beneficiary_account_id,
            beneficiary_upi_id, complaint_status, priority, linked_fraud_account,
            beneficiary_city, assigned_officer_id, assigned_officer_name, officer_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, complaint_rows)
        conn.commit()

    # Seed Initial Alerts if empty
    cursor.execute("SELECT COUNT(*) FROM alerts")
    if cursor.fetchone()[0] == 0:
        initial_alerts = [
            ("HIGH_PRIORITY_COMPLAINT", "Critical Investment Scam Logged", "High-loss unauthorized transfer of INR 68,000 flagged to mule account ACC000397.", "COMP000362", "ATM0061", "Jalandhar", "CRITICAL"),
            ("APPROACHING_WINDOW", "Extraction Window Imminent (ATM0061)", "Predicted cash withdrawal window approaching in next 45 minutes for mule ACC000397.", "COMP000362", "ATM0061", "Jalandhar", "CRITICAL"),
            ("UNASSIGNED_ACTION", "Unassigned High-Priority Case", "Complaint COMP000009 (Card Fraud, INR 58,959) requires immediate investigator assignment.", "COMP000009", None, "Jalandhar", "HIGH"),
            ("NEW_PREDICTION", "Predictive Radar Dispatched", "Ensemble model generated Top-3 extraction targets with 88.5% confidence for COMP000038.", "COMP000038", "ATM0025", "Ludhiana", "MEDIUM"),
            ("MULE_ACTIVITY", "Repeat Mule Activity Detected", "Mule ACC000014 recorded 3rd extraction attempt across Grand Trunk corridor.", "COMP000341", "ATM0001", "Phagwara", "HIGH")
        ]
        cursor.executemany("""
        INSERT INTO alerts (alert_type, title, message, complaint_id, atm_id, zone, severity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, initial_alerts)
        conn.commit()

    # Seed Initial Audit Log if empty
    cursor.execute("SELECT COUNT(*) FROM audit_logs")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO audit_logs (officer_id, officer_name, action, module, target_id, details)
        VALUES ('SYSTEM', 'RELIC Security Kernel', 'INITIALIZE_SYSTEM', 'SYSTEM', 'DB_INIT', 'Relic relational database and RBAC security layer successfully initialized.')
        """)
        conn.commit()

    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialization complete.")
