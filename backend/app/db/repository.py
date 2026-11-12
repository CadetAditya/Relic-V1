import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.db.session import get_db_connection

class DatabaseRepository:
    """Repository providing database operations for all 12 modules of RELIC."""

    # --------------------------------------------------------------------------
    # MODULE 1: Secure Login, Authentication & RBAC
    # --------------------------------------------------------------------------
    @staticmethod
    def get_officer_by_badge(badge_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM officers WHERE LOWER(badge_id) = LOWER(?)", (badge_id.strip(),))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def authenticate_officer(badge_id: str, password: str) -> Optional[Dict[str, Any]]:
        officer = DatabaseRepository.get_officer_by_badge(badge_id)
        if officer and officer.get("password") == password and officer.get("status") == "active":
            # Record audit log
            DatabaseRepository.add_audit_log(
                officer_id=officer["badge_id"],
                officer_name=officer["name"],
                action="LOGIN",
                module="AUTH",
                target_id=officer["badge_id"],
                details=f"Officer {officer['name']} logged in as {officer['role']} ({officer['zone']})."
            )
            return officer
        return None

    # --------------------------------------------------------------------------
    # MODULE 12: Officer Management & Audit Logs
    # --------------------------------------------------------------------------
    @staticmethod
    def get_all_officers(zone: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT badge_id, name, role, zone, email, phone, rank, status, created_at FROM officers WHERE 1=1"
        params = []
        if zone and zone != "All Zones":
            query += " AND (zone = ? OR zone = 'All Zones')"
            params.append(zone)
        if role:
            query += " AND role = ?"
            params.append(role)
        query += " ORDER BY role ASC, name ASC"
        cursor.execute(query, tuple(params))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def create_officer(data: Dict[str, Any], created_by_officer: Dict[str, Any]) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        badge_id = data["badge_id"].strip().upper()
        cursor.execute("""
        INSERT INTO officers (badge_id, name, password, role, zone, email, phone, rank, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            badge_id,
            data["name"].strip(),
            data.get("password", "relic2026"),
            data.get("role", "Investigator"),
            data.get("zone", "Punjab Zone"),
            data.get("email"),
            data.get("phone"),
            data.get("rank", "Inspector"),
            data.get("status", "active"),
        ))
        conn.commit()
        conn.close()

        DatabaseRepository.add_audit_log(
            officer_id=created_by_officer.get("badge_id", "ADMIN"),
            officer_name=created_by_officer.get("name", "Head Admin"),
            action="CREATE_OFFICER",
            module="ADMIN",
            target_id=badge_id,
            details=f"Created officer account {badge_id} ({data['name']}) with role {data.get('role')} in zone {data.get('zone')}."
        )
        return DatabaseRepository.get_officer_by_badge(badge_id)

    @staticmethod
    def update_officer(badge_id: str, data: Dict[str, Any], updated_by_officer: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE officers
        SET name = COALESCE(?, name),
            role = COALESCE(?, role),
            zone = COALESCE(?, zone),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            rank = COALESCE(?, rank),
            status = COALESCE(?, status),
            password = COALESCE(?, password)
        WHERE badge_id = ?
        """, (
            data.get("name"),
            data.get("role"),
            data.get("zone"),
            data.get("email"),
            data.get("phone"),
            data.get("rank"),
            data.get("status"),
            data.get("password"),
            badge_id
        ))
        conn.commit()
        conn.close()

        DatabaseRepository.add_audit_log(
            officer_id=updated_by_officer.get("badge_id", "ADMIN"),
            officer_name=updated_by_officer.get("name", "Head Admin"),
            action="UPDATE_OFFICER",
            module="ADMIN",
            target_id=badge_id,
            details=f"Updated officer {badge_id} attributes: {data}."
        )
        return DatabaseRepository.get_officer_by_badge(badge_id)

    @staticmethod
    def add_audit_log(officer_id: str, officer_name: str, action: str, module: str, target_id: Optional[str] = None, details: Optional[str] = None, ip_address: str = "127.0.0.1"):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO audit_logs (officer_id, officer_name, action, module, target_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (officer_id, officer_name, action, module, target_id, details, ip_address))
            conn.commit()
            conn.close()
        except Exception as e:
            print("Audit log error:", e)

    @staticmethod
    def get_audit_logs(officer_id: Optional[str] = None, module: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []
        if officer_id:
            query += " AND officer_id = ?"
            params.append(officer_id)
        if module:
            query += " AND module = ?"
            params.append(module)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        cursor.execute(query, tuple(params))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    # --------------------------------------------------------------------------
    # MODULES 3, 4, 10: File Complaint, Search, Details, Investigation Management
    # --------------------------------------------------------------------------
    @staticmethod
    def get_next_complaint_id() -> str:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT complaint_id FROM complaints WHERE complaint_id LIKE 'COMP%'")
        rows = cursor.fetchall()
        conn.close()
        num_ids = [int(r[0].replace("COMP", "")) for r in rows if r[0].replace("COMP", "").isdigit()]
        max_id = max(num_ids) if num_ids else 360
        return f"COMP{max_id + 1:06d}"

    @staticmethod
    def create_complaint(data: Dict[str, Any], officer: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        c_id = data.get("complaint_id")
        if not c_id or not str(c_id).strip():
            c_id = DatabaseRepository.get_next_complaint_id()
        else:
            c_id = str(c_id).strip().upper()

        c_date = data.get("complaint_date") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        amt = float(data.get("reported_amount", 25000.0))
        priority = data.get("priority") or ("HIGH" if amt >= 40000 or str(data.get("fraud_type", "")).lower() in ["investment scam", "remote access scam"] else ("MEDIUM" if amt >= 15000 else "LOW"))

        conn = get_db_connection()
        cursor = conn.cursor()

        # Resolve city
        ben_id = str(data.get("beneficiary_account_id", "")).strip()
        ben_city = data.get("beneficiary_city")
        if not ben_city:
            cursor.execute("SELECT registered_address_region FROM accounts WHERE account_id = ?", (ben_id,))
            acc_row = cursor.fetchone()
            ben_city = acc_row[0] if acc_row else "Jalandhar"

        # Resolve UPI
        ben_upi = data.get("beneficiary_upi_id")
        if not ben_upi:
            cursor.execute("SELECT upi_id FROM accounts WHERE account_id = ?", (ben_id,))
            acc_row = cursor.fetchone()
            ben_upi = acc_row[0] if acc_row and acc_row[0] else f"user{ben_id}@syntheticupi"

        assigned_id = data.get("assigned_officer_id")
        assigned_name = data.get("assigned_officer_name")
        if assigned_id and not assigned_name:
            cursor.execute("SELECT name FROM officers WHERE badge_id = ?", (assigned_id,))
            off_row = cursor.fetchone()
            assigned_name = off_row[0] if off_row else None

        cursor.execute("""
        INSERT INTO complaints (
            complaint_id, complaint_date, fraud_type, reported_amount,
            victim_account_id, transaction_id, beneficiary_account_id,
            beneficiary_upi_id, complaint_status, priority, linked_fraud_account,
            beneficiary_city, assigned_officer_id, assigned_officer_name, officer_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            c_id,
            c_date,
            str(data.get("fraud_type", "UPI fraud")),
            amt,
            str(data.get("victim_account_id", "ACC000001")),
            data.get("transaction_id"),
            ben_id,
            str(ben_upi),
            str(data.get("complaint_status", "unresolved")),
            priority,
            int(data.get("linked_fraud_account", 1)),
            ben_city,
            assigned_id,
            assigned_name,
            data.get("officer_notes", "Case filed via Law Enforcement Portal.")
        ))
        conn.commit()
        conn.close()

        # Audit log
        officer_badge = officer.get("badge_id", "SYSTEM") if officer else "SYSTEM"
        officer_name = officer.get("name", "System") if officer else "System"
        DatabaseRepository.add_audit_log(
            officer_id=officer_badge,
            officer_name=officer_name,
            action="CREATE_COMPLAINT",
            module="COMPLAINTS",
            target_id=c_id,
            details=f"Filed {data.get('fraud_type')} complaint {c_id} for INR {amt:,.2f} targeting mule {ben_id} in {ben_city}."
        )

        # Trigger alert if HIGH or CRITICAL priority
        if priority == "HIGH":
            DatabaseRepository.create_alert(
                alert_type="HIGH_PRIORITY_COMPLAINT",
                title=f"High-Priority {data.get('fraud_type', 'Fraud')} Filed",
                message=f"Docket {c_id}: Disputed loss of INR {amt:,.2f} routed to suspect mule {ben_id} in {ben_city}.",
                complaint_id=c_id,
                zone=ben_city,
                severity="HIGH"
            )

        return DatabaseRepository.get_complaint_by_id(c_id)

    @staticmethod
    def get_complaints(
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        city: Optional[str] = None,
        assigned_officer_id: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM complaints WHERE 1=1"
        count_query = "SELECT COUNT(*) FROM complaints WHERE 1=1"
        params = []

        if search:
            s = f"%{search.strip().lower()}%"
            clause = " AND (LOWER(complaint_id) LIKE ? OR LOWER(victim_account_id) LIKE ? OR LOWER(beneficiary_account_id) LIKE ? OR LOWER(fraud_type) LIKE ?)"
            query += clause
            count_query += clause
            params.extend([s, s, s, s])

        if status:
            clause = " AND LOWER(complaint_status) = LOWER(?)"
            query += clause
            count_query += clause
            params.append(status)

        if priority:
            clause = " AND priority = ?"
            query += clause
            count_query += clause
            params.append(priority)

        if city and city != "All":
            clause = " AND LOWER(beneficiary_city) = LOWER(?)"
            query += clause
            count_query += clause
            params.append(city)

        if assigned_officer_id:
            clause = " AND assigned_officer_id = ?"
            query += clause
            count_query += clause
            params.append(assigned_officer_id)

        if date_from:
            clause = " AND complaint_date >= ?"
            query += clause
            count_query += clause
            params.append(date_from)

        if date_to:
            clause = " AND complaint_date <= ?"
            query += clause
            count_query += clause
            params.append(date_to)

        cursor.execute(count_query, tuple(params))
        total = cursor.fetchone()[0]

        query += " ORDER BY complaint_date DESC, complaint_id DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])
        cursor.execute(query, tuple(params))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()

        return {"total": total, "skip": skip, "limit": limit, "complaints": rows}

    @staticmethod
    def get_complaint_by_id(complaint_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM complaints WHERE complaint_id = ?", (complaint_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None
        complaint = dict(row)

        # Attach linked transactions
        cursor.execute("""
        SELECT * FROM transactions
        WHERE (sender_account_id = ? AND receiver_account_id = ?)
           OR transaction_id = ?
        ORDER BY transaction_datetime DESC LIMIT 10
        """, (complaint.get("victim_account_id"), complaint.get("beneficiary_account_id"), complaint.get("transaction_id")))
        complaint["linked_transactions"] = [dict(t) for t in cursor.fetchall()]

        # Attach investigation notes / timeline
        cursor.execute("""
        SELECT * FROM investigation_notes
        WHERE complaint_id = ?
        ORDER BY created_at DESC
        """, (complaint_id,))
        complaint["timeline"] = [dict(n) for n in cursor.fetchall()]

        # Attach evidence records
        cursor.execute("""
        SELECT * FROM evidence_records
        WHERE complaint_id = ?
        ORDER BY created_at DESC
        """, (complaint_id,))
        complaint["evidence"] = [dict(e) for e in cursor.fetchall()]

        # Attach past predictions
        cursor.execute("""
        SELECT * FROM predictions
        WHERE complaint_id = ?
        ORDER BY created_at DESC LIMIT 5
        """, (complaint_id,))
        complaint["predictions"] = [dict(p) for p in cursor.fetchall()]

        conn.close()
        return complaint

    @staticmethod
    def update_complaint_status(complaint_id: str, new_status: str, officer: Dict[str, Any], notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
        UPDATE complaints
        SET complaint_status = ?, updated_at = ?
        WHERE complaint_id = ?
        """, (new_status, now, complaint_id))

        note_text = f"Status updated to '{new_status}'." + (f" Note: {notes}" if notes else "")
        cursor.execute("""
        INSERT INTO investigation_notes (complaint_id, officer_id, officer_name, note_text, action_type)
        VALUES (?, ?, ?, ?, 'STATUS_CHANGE')
        """, (complaint_id, officer.get("badge_id", "SYSTEM"), officer.get("name", "Officer"), note_text))

        conn.commit()
        conn.close()

        DatabaseRepository.add_audit_log(
            officer_id=officer.get("badge_id", "SYSTEM"),
            officer_name=officer.get("name", "Officer"),
            action="UPDATE_STATUS",
            module="COMPLAINTS",
            target_id=complaint_id,
            details=f"Updated status of {complaint_id} to {new_status}."
        )
        return DatabaseRepository.get_complaint_by_id(complaint_id)

    @staticmethod
    def assign_investigator(complaint_id: str, investigator_badge_id: str, assigned_by_officer: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        investigator = DatabaseRepository.get_officer_by_badge(investigator_badge_id)
        if not investigator:
            return None

        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
        UPDATE complaints
        SET assigned_officer_id = ?, assigned_officer_name = ?, updated_at = ?
        WHERE complaint_id = ?
        """, (investigator["badge_id"], investigator["name"], now, complaint_id))

        note_text = f"Assigned case to investigator {investigator['name']} ({investigator['badge_id']}) by {assigned_by_officer.get('name', 'Admin')}."
        cursor.execute("""
        INSERT INTO investigation_notes (complaint_id, officer_id, officer_name, note_text, action_type)
        VALUES (?, ?, ?, ?, 'ASSIGNMENT')
        """, (complaint_id, assigned_by_officer.get("badge_id", "ADMIN"), assigned_by_officer.get("name", "Admin"), note_text))

        conn.commit()
        conn.close()

        DatabaseRepository.add_audit_log(
            officer_id=assigned_by_officer.get("badge_id", "ADMIN"),
            officer_name=assigned_by_officer.get("name", "Admin"),
            action="ASSIGN_INVESTIGATOR",
            module="INVESTIGATION",
            target_id=complaint_id,
            details=f"Assigned {complaint_id} to {investigator['name']}."
        )
        return DatabaseRepository.get_complaint_by_id(complaint_id)

    @staticmethod
    def add_investigation_note(complaint_id: str, officer: Dict[str, Any], note_text: str, action_type: str = "NOTE_ADDED") -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO investigation_notes (complaint_id, officer_id, officer_name, note_text, action_type)
        VALUES (?, ?, ?, ?, ?)
        """, (complaint_id, officer.get("badge_id", "SYSTEM"), officer.get("name", "Officer"), note_text, action_type))
        note_id = cursor.lastrowid
        conn.commit()
        conn.close()

        DatabaseRepository.add_audit_log(
            officer_id=officer.get("badge_id", "SYSTEM"),
            officer_name=officer.get("name", "Officer"),
            action="ADD_NOTE",
            module="INVESTIGATION",
            target_id=complaint_id,
            details=f"Added investigation note to {complaint_id}."
        )
        return {"id": note_id, "complaint_id": complaint_id, "officer_name": officer.get("name"), "note_text": note_text, "created_at": datetime.now().isoformat()}

    # --------------------------------------------------------------------------
    # MODULE 8: Evidence and CCTV References
    # --------------------------------------------------------------------------
    @staticmethod
    def add_evidence_record(complaint_id: str, officer: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO evidence_records (
            complaint_id, officer_id, title, evidence_type, description,
            atm_id, cctv_camera_id, footage_window_start, footage_window_end,
            bank_contact_person, request_status, file_reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            complaint_id,
            officer.get("badge_id", "SYSTEM"),
            data["title"],
            data.get("evidence_type", "CCTV Footage Reference"),
            data.get("description"),
            data.get("atm_id"),
            data.get("cctv_camera_id"),
            data.get("footage_window_start"),
            data.get("footage_window_end"),
            data.get("bank_contact_person"),
            data.get("request_status", "REQUESTED"),
            data.get("file_reference")
        ))
        ev_id = cursor.lastrowid

        # Also add a timeline entry
        timeline_note = f"Evidence Attached: {data['title']} ({data.get('evidence_type')})"
        cursor.execute("""
        INSERT INTO investigation_notes (complaint_id, officer_id, officer_name, note_text, action_type)
        VALUES (?, ?, ?, ?, 'EVIDENCE_ATTACHED')
        """, (complaint_id, officer.get("badge_id", "SYSTEM"), officer.get("name", "Officer"), timeline_note))

        conn.commit()
        conn.close()

        DatabaseRepository.add_audit_log(
            officer_id=officer.get("badge_id", "SYSTEM"),
            officer_name=officer.get("name", "Officer"),
            action="ADD_EVIDENCE",
            module="EVIDENCE",
            target_id=complaint_id,
            details=f"Attached evidence {data['title']} to {complaint_id}."
        )
        return {"id": ev_id, "complaint_id": complaint_id, "title": data["title"], "status": "saved"}

    @staticmethod
    def get_complaint_evidence(complaint_id: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence_records WHERE complaint_id = ? ORDER BY created_at DESC", (complaint_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def get_complaint_notes(complaint_id: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM investigation_notes WHERE complaint_id = ? ORDER BY created_at DESC", (complaint_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def update_evidence_status(evidence_id: int, new_status: str, officer: Dict[str, Any]) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE evidence_records SET request_status = ? WHERE id = ?", (new_status, evidence_id))
        conn.commit()
        conn.close()

        DatabaseRepository.add_audit_log(
            officer_id=officer.get("badge_id", "SYSTEM"),
            officer_name=officer.get("name", "Officer"),
            action="UPDATE_EVIDENCE_STATUS",
            module="EVIDENCE",
            target_id=str(evidence_id),
            details=f"Updated evidence record #{evidence_id} status to {new_status}."
        )
        return True

    # --------------------------------------------------------------------------
    # MODULE 5: AI-Powered Predictive Intelligence & History
    # --------------------------------------------------------------------------
    @staticmethod
    def save_prediction(prediction_res: Dict[str, Any], officer: Optional[Dict[str, Any]] = None) -> int:
        recs = prediction_res.get("recommendations", [])
        top1 = recs[0] if len(recs) > 0 else {}
        top2 = recs[1] if len(recs) > 1 else {}
        top3 = recs[2] if len(recs) > 2 else {}

        # Synthesize realistic time window based on current time
        now = datetime.now()
        # Typical withdrawal window: 45 min to 3.5 hrs from complaint registration
        window_start = (now).strftime("%Y-%m-%d %H:%M:%S")
        window_end = (now + timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S")

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO predictions (
            complaint_id, account_id, amount, registered_city,
            top1_atm_id, top1_score, top2_atm_id, top2_score,
            top3_atm_id, top3_score, predicted_window_start,
            predicted_window_end, expected_amount, advisory,
            generated_by_officer_id, generated_by_officer_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            prediction_res.get("complaint_id"),
            prediction_res.get("target_account_id"),
            prediction_res.get("reported_amount", 25000.0),
            prediction_res.get("account_summary", {}).get("registered_city", "Punjab"),
            top1.get("candidate_atm_id"),
            top1.get("cal_score"),
            top2.get("candidate_atm_id"),
            top2.get("cal_score"),
            top3.get("candidate_atm_id"),
            top3.get("cal_score"),
            window_start,
            window_end,
            prediction_res.get("reported_amount", 25000.0),
            prediction_res.get("operational_advisory"),
            officer.get("badge_id") if officer else "SYSTEM",
            officer.get("name") if officer else "System AI Kernel"
        ))
        pred_id = cursor.lastrowid

        # Also add alert for patrol dispatch
        city = prediction_res.get("account_summary", {}).get("registered_city", "Punjab")
        top1_atm = top1.get("candidate_atm_id", "ATM")
        score_pct = (top1.get("cal_score", 0) * 100)
        cursor.execute("""
        INSERT INTO alerts (alert_type, title, message, complaint_id, atm_id, zone, severity)
        VALUES ('NEW_PREDICTION', ?, ?, ?, ?, ?, 'CRITICAL')
        """, (
            f"Extraction Imminent: {top1_atm} ({score_pct:.1f}%)",
            f"Predicted cashout at {top1_atm} in {city} for suspect {prediction_res.get('target_account_id')}. Dispatch intercept team immediately.",
            prediction_res.get("complaint_id"),
            top1_atm,
            city
        ))

        # Add investigation timeline entry if complaint_id present
        if prediction_res.get("complaint_id"):
            cursor.execute("""
            INSERT INTO investigation_notes (complaint_id, officer_id, officer_name, note_text, action_type)
            VALUES (?, ?, ?, ?, 'PREDICTION_RUN')
            """, (
                prediction_res["complaint_id"],
                officer.get("badge_id") if officer else "SYSTEM",
                officer.get("name") if officer else "AI Kernel",
                f"Generated predictive extraction radar: Top-1 Target {top1_atm} ({score_pct:.1f}% confidence, window: {window_start} to {window_end})."
            ))

        conn.commit()
        conn.close()

        DatabaseRepository.add_audit_log(
            officer_id=officer.get("badge_id", "SYSTEM") if officer else "SYSTEM",
            officer_name=officer.get("name", "System") if officer else "System",
            action="RUN_PREDICTION",
            module="PREDICTION",
            target_id=prediction_res.get("target_account_id"),
            details=f"Ran predictive model. Target 1: {top1_atm} ({score_pct:.1f}%) in {city}."
        )

        return pred_id

    @staticmethod
    def get_prediction_history(complaint_id: Optional[str] = None, account_id: Optional[str] = None, zone: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM predictions WHERE 1=1"
        params = []
        if complaint_id:
            query += " AND complaint_id = ?"
            params.append(complaint_id)
        if account_id:
            query += " AND account_id = ?"
            params.append(account_id)
        if zone and zone != "All Zones":
            query += " AND registered_city = ?"
            params.append(zone)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        cursor.execute(query, tuple(params))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    # --------------------------------------------------------------------------
    # MODULE 9: Alerts & Notifications
    # --------------------------------------------------------------------------
    @staticmethod
    def create_alert(alert_type: str, title: str, message: str, complaint_id: Optional[str] = None, atm_id: Optional[str] = None, zone: Optional[str] = None, severity: str = "HIGH") -> int:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO alerts (alert_type, title, message, complaint_id, atm_id, zone, severity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (alert_type, title, message, complaint_id, atm_id, zone, severity))
        alert_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return alert_id

    @staticmethod
    def get_alerts(zone: Optional[str] = None, unread_only: bool = False, limit: int = 50) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM alerts WHERE 1=1"
        params = []
        if zone and zone != "All Zones":
            query += " AND (zone = ? OR zone IS NULL)"
            params.append(zone)
        if unread_only:
            query += " AND is_read = 0"
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        cursor.execute(query, tuple(params))
        rows = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT COUNT(*) FROM alerts WHERE is_read = 0")
        unread_count = cursor.fetchone()[0]

        conn.close()
        return {"unread_count": unread_count, "alerts": rows}

    @staticmethod
    def mark_alert_read(alert_id: int) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET is_read = 1 WHERE id = ?", (alert_id,))
        conn.commit()
        conn.close()
        return True

    # --------------------------------------------------------------------------
    # MODULE 6: ATM Locations & Hotspots
    # --------------------------------------------------------------------------
    @staticmethod
    def get_all_atms(city: Optional[str] = None) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
        SELECT a.atm_id, a.bank_id, a.city, a.latitude, a.longitude,
               COUNT(w.withdrawal_id) as total_wd,
               SUM(CASE WHEN w.fraud_linked = 1 THEN 1 ELSE 0 END) as fraud_wd
        FROM atm_locations a
        LEFT JOIN withdrawals w ON a.atm_id = w.atm_id
        WHERE 1=1
        """
        params = []
        if city and city != "All":
            query += " AND LOWER(a.city) = LOWER(?)"
            params.append(city)
        query += " GROUP BY a.atm_id ORDER BY a.atm_id ASC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        cursor.execute("SELECT DISTINCT city FROM atm_locations ORDER BY city ASC")
        cities = [r[0] for r in cursor.fetchall()]
        conn.close()

        atms = []
        for r in rows:
            tot = r[5] or 0
            frd = r[6] or 0
            ratio = float(frd) / float(tot) if tot > 0 else 0.0
            atms.append({
                "atm_id": r[0],
                "bank_id": r[1],
                "city": r[2],
                "latitude": r[3],
                "longitude": r[4],
                "historical_withdrawals_count": tot,
                "fraud_intensity_ratio": round(ratio, 4),
            })
        return {"total": len(atms), "cities": cities, "atms": atms}

    # --------------------------------------------------------------------------
    # MODULE 7: Account and Transaction Analysis (Network & Money Trail)
    # --------------------------------------------------------------------------
    @staticmethod
    def get_account_network(account_id: str) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Robust ID resolution (e.g. ACC_000001 -> ACC000001)
        norm_id = account_id.replace("_", "").upper() if account_id else ""
        cursor.execute("SELECT * FROM accounts WHERE account_id = ? OR account_id = ?", (account_id, norm_id))
        acc_row = cursor.fetchone()
        account_profile = dict(acc_row) if acc_row else {}
        target_acc_id = account_profile.get("account_id", norm_id or account_id)

        # Inbound and Outbound transactions
        cursor.execute("""
        SELECT * FROM transactions
        WHERE sender_account_id = ? OR receiver_account_id = ?
           OR sender_account_id = ? OR receiver_account_id = ?
        ORDER BY transaction_datetime DESC LIMIT 50
        """, (target_acc_id, target_acc_id, account_id, account_id))
        txs = [dict(r) for r in cursor.fetchall()]

        # Withdrawals
        cursor.execute("""
        SELECT w.*, a.city, a.latitude, a.longitude, a.bank_id
        FROM withdrawals w
        LEFT JOIN atm_locations a ON w.atm_id = a.atm_id
        WHERE w.account_id = ? OR w.account_id = ?
        ORDER BY w.withdrawal_datetime DESC LIMIT 50
        """, (target_acc_id, account_id))
        withdrawals = [dict(r) for r in cursor.fetchall()]

        # Build Counterparties graph
        counterparties = {}
        for tx in txs:
            is_sender = tx["sender_account_id"] == account_id
            c_party = tx["receiver_account_id"] if is_sender else tx["sender_account_id"]
            if c_party not in counterparties:
                counterparties[c_party] = {
                    "account_id": c_party,
                    "direction": "outbound" if is_sender else "inbound",
                    "total_amount": 0,
                    "tx_count": 0,
                }
            counterparties[c_party]["total_amount"] += float(tx["amount"])
            counterparties[c_party]["tx_count"] += 1

        conn.close()
        return {
            "account": account_profile,
            "transactions": txs,
            "withdrawals": withdrawals,
            "counterparties": list(counterparties.values()),
            "total_sent": sum(t["amount"] for t in txs if t["sender_account_id"] == account_id),
            "total_received": sum(t["amount"] for t in txs if t["receiver_account_id"] == account_id),
            "total_withdrawn": sum(w["amount"] for w in withdrawals),
        }

    # --------------------------------------------------------------------------
    # MODULE 2 & 11: Role-Based Dashboard & Regional/Zonal Monitoring
    # --------------------------------------------------------------------------
    @staticmethod
    def get_role_dashboard_stats(role: str, zone: str, officer_id: Optional[str] = None) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()

        is_head_admin = role == "Head Admin" or zone == "All Zones"

        # 1. Complaints breakdown
        c_query = "SELECT COUNT(*), SUM(reported_amount) FROM complaints WHERE 1=1"
        c_params = []
        if not is_head_admin:
            c_query += " AND LOWER(beneficiary_city) = LOWER(?)"
            c_params.append(zone)
        cursor.execute(c_query, tuple(c_params))
        c_row = cursor.fetchone()
        total_complaints = c_row[0] or 0
        total_fraud_volume = c_row[1] or 0.0

        # Pending & High Priority
        p_query = "SELECT COUNT(*) FROM complaints WHERE complaint_status IN ('unresolved', 'under investigation')"
        p_params = []
        if not is_head_admin:
            p_query += " AND LOWER(beneficiary_city) = LOWER(?)"
            p_params.append(zone)
        cursor.execute(p_query, tuple(p_params))
        pending_complaints = cursor.fetchone()[0] or 0

        hp_query = "SELECT COUNT(*) FROM complaints WHERE priority = 'HIGH' AND complaint_status != 'cleared'"
        hp_params = []
        if not is_head_admin:
            hp_query += " AND LOWER(beneficiary_city) = LOWER(?)"
            hp_params.append(zone)
        cursor.execute(hp_query, tuple(hp_params))
        high_priority_complaints = cursor.fetchone()[0] or 0

        # My Assigned Caseload (for Investigator)
        my_cases_count = 0
        if officer_id:
            cursor.execute("SELECT COUNT(*) FROM complaints WHERE assigned_officer_id = ? AND complaint_status != 'cleared'", (officer_id,))
            my_cases_count = cursor.fetchone()[0] or 0

        # 2. Regional ATM Hotspots
        atm_query = "SELECT a.atm_id, a.bank_id, a.city, a.latitude, a.longitude, COUNT(w.withdrawal_id) as total_wd, SUM(CASE WHEN w.fraud_linked = 1 THEN 1 ELSE 0 END) as fraud_wd FROM atm_locations a LEFT JOIN withdrawals w ON a.atm_id = w.atm_id WHERE 1=1"
        atm_params = []
        if not is_head_admin:
            atm_query += " AND LOWER(a.city) = LOWER(?)"
            atm_params.append(zone)
        atm_query += " GROUP BY a.atm_id"
        cursor.execute(atm_query, tuple(atm_params))
        atm_rows = cursor.fetchall()

        hotspot_atms = []
        yellow_count = 0
        orange_count = 0
        red_count = 0

        for r in atm_rows:
            tot = r[5] or 0
            frd = r[6] or 0
            ratio = float(frd) / float(tot) if tot > 0 else 0.0

            # Yellow: 5-10%, Orange: 10-20%, Red: >20%
            color = "green"
            if ratio >= 0.20:
                color = "red"
                red_count += 1
            elif ratio >= 0.10:
                color = "orange"
                orange_count += 1
            elif ratio >= 0.05:
                color = "yellow"
                yellow_count += 1

            hotspot_atms.append({
                "atm_id": r[0],
                "bank_id": r[1],
                "city": r[2],
                "latitude": r[3],
                "longitude": r[4],
                "total_withdrawals": tot,
                "fraud_withdrawals": frd,
                "fraud_intensity_ratio": round(ratio, 4),
                "hotspot_color": color,
            })

        # 3. Investigator Workload (by region or overall)
        off_query = """
        SELECT o.badge_id, o.name, o.zone, o.rank,
               COUNT(c.complaint_id) as active_cases
        FROM officers o
        LEFT JOIN complaints c ON o.badge_id = c.assigned_officer_id AND c.complaint_status != 'cleared'
        WHERE o.role = 'Investigator'
        """
        off_params = []
        if not is_head_admin:
            off_query += " AND (o.zone = ? OR o.zone = 'All Zones')"
            off_params.append(zone)
        off_query += " GROUP BY o.badge_id ORDER BY active_cases DESC"
        cursor.execute(off_query, tuple(off_params))
        investigator_workload = [dict(r) for r in cursor.fetchall()]

        # 4. Recent Activity & Live Alerts
        alt_query = "SELECT * FROM alerts WHERE 1=1"
        alt_params = []
        if not is_head_admin:
            alt_query += " AND (zone = ? OR zone IS NULL)"
            alt_params.append(zone)
        alt_query += " ORDER BY created_at DESC LIMIT 6"
        cursor.execute(alt_query, tuple(alt_params))
        recent_alerts = [dict(r) for r in cursor.fetchall()]

        # 5. Recent Complaints
        rc_query = "SELECT * FROM complaints WHERE 1=1"
        rc_params = []
        if not is_head_admin:
            rc_query += " AND LOWER(beneficiary_city) = LOWER(?)"
            rc_params.append(zone)
        rc_query += " ORDER BY complaint_date DESC LIMIT 6"
        cursor.execute(rc_query, tuple(rc_params))
        recent_complaints = [dict(r) for r in cursor.fetchall()]

        conn.close()

        return {
            "role": role,
            "zone": zone,
            "total_complaints": total_complaints,
            "pending_complaints": pending_complaints,
            "high_priority_complaints": high_priority_complaints,
            "my_cases_count": my_cases_count,
            "total_fraud_volume": round(total_fraud_volume, 2),
            "atm_hotspots": {
                "total_atms": len(hotspot_atms),
                "red_hotspots": red_count,
                "orange_hotspots": orange_count,
                "yellow_hotspots": yellow_count,
                "atms": hotspot_atms,
            },
            "investigator_workload": investigator_workload,
            "recent_alerts": recent_alerts,
            "recent_complaints": recent_complaints,
        }

    @staticmethod
    def get_regional_monitoring(zone_name: str) -> Dict[str, Any]:
        return DatabaseRepository.get_role_dashboard_stats(
            role="Regional/Zonal Admin",
            zone=zone_name
        )
