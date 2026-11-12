import sys
import os

# Ensure backend root in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import init_db
from app.db.repository import DatabaseRepository
from app.services.ml_service import MLInferenceService

def test_full_system():
    print("=== INITIALIZING DB ===")
    init_db()

    print("\n--- 1. SECURE LOGIN & RBAC ---")
    admin_auth = DatabaseRepository.authenticate_officer("admin", "admin")
    assert admin_auth is not None, "Admin auth failed"
    print("Admin authenticated:", admin_auth["name"], "| Role:", admin_auth["role"])

    regional_auth = DatabaseRepository.authenticate_officer("OFFICER_007", "relic2026")
    assert regional_auth is not None, "Regional Admin auth failed"
    print("Regional Admin authenticated:", regional_auth["name"], "| Zone:", regional_auth["zone"])

    inv_auth = DatabaseRepository.authenticate_officer("OFFICER_704", "relic2026")
    assert inv_auth is not None, "Investigator auth failed"
    print("Investigator authenticated:", inv_auth["name"], "| Role:", inv_auth["role"])

    print("\n--- 2. ROLE-BASED DASHBOARD STATS ---")
    head_stats = DatabaseRepository.get_role_dashboard_stats("Head Admin", "All Zones")
    assert head_stats["total_complaints"] > 0, "No complaints found"
    print(f"Head Admin Stats: {head_stats['total_complaints']} total, {head_stats['pending_complaints']} pending, {head_stats['high_priority_complaints']} high-priority")

    zonal_stats = DatabaseRepository.get_role_dashboard_stats("Regional Admin", "Jalandhar")
    print(f"Jalandhar Zonal Stats: {zonal_stats['total_complaints']} complaints, Red Hotspots: {zonal_stats['atm_hotspots']['red_hotspots']}")

    print("\n--- 3. FILE NEW COMPLAINT ---")
    complaint_data = {
        "victim_account_id": "ACC000002",
        "beneficiary_account_id": "ACC000397",
        "fraud_type": "phishing",
        "reported_amount": 75000.0,
        "transaction_id": "TX_TEST_9999",
        "beneficiary_bank_id": "SBIN",
        "beneficiary_city": "Jalandhar",
        "priority": "HIGH",
        "description": "Victim received fraudulent banking OTP link. Funds transferred into suspected mule account."
    }
    complaint_res = DatabaseRepository.create_complaint(complaint_data, officer=regional_auth)
    assert complaint_res is not None and "complaint_id" in complaint_res, "Complaint creation failed"
    new_c_id = complaint_res["complaint_id"]
    print("Created complaint:", new_c_id)

    print("\n--- 4. COMPLAINT SEARCH & DETAILS ---")
    c_detail = DatabaseRepository.get_complaint_by_id(new_c_id)
    assert c_detail is not None, "Complaint retrieval failed"
    print("Retrieved complaint:", c_detail["complaint_id"], "| Amount:", c_detail["reported_amount"])

    print("\n--- 5. AI-POWERED PREDICTIVE INTELLIGENCE ---")
    ml_service = MLInferenceService()
    pred_res = ml_service.predict(complaint_id=new_c_id, amount=75000.0, top_k=3)
    assert len(pred_res.recommendations) == 3, "Did not get 3 recommendations"
    print("Top 1 ATM:", pred_res.recommendations[0].candidate_atm_id, "| Score:", pred_res.recommendations[0].cal_score)
    pred_id = DatabaseRepository.save_prediction(pred_res.model_dump(), officer=regional_auth)
    print("Saved prediction record ID:", pred_id)

    pred_history = DatabaseRepository.get_prediction_history(limit=5)
    assert len(pred_history) > 0, "No prediction history found"
    print("Recent predictions count:", len(pred_history))

    print("\n--- 6. ATM LOCATIONS & HOTSPOT CLUSTERS ---")
    atms_data = DatabaseRepository.get_all_atms(city="Jalandhar")
    assert len(atms_data["atms"]) > 0, "No Jalandhar ATMs found"
    print(f"Loaded {len(atms_data['atms'])} ATMs in Jalandhar. Sample ATM: {atms_data['atms'][0]['atm_id']}")

    print("\n--- 7. ACCOUNT & MONEY TRAIL NETWORK ---")
    net_data = DatabaseRepository.get_account_network("ACC000397")
    print(f"Account ACC000397: Total Inflow: ₹{net_data['total_received']:,} | Outflow Extractions: ₹{net_data['total_withdrawn']:,} | Counterparties: {len(net_data['counterparties'])}")

    print("\n--- 8. EVIDENCE & CCTV REFERENCES ---")
    ev_data = {
        "title": "CCTV Footage Request - Extraction ATM",
        "evidence_type": "CCTV_FOOTAGE",
        "description": "Request for CCTV surveillance camera 01 & 02 footage during predicted withdrawal time window.",
        "atm_id": pred_res.recommendations[0].candidate_atm_id,
        "request_status": "REQUESTED"
    }
    ev_res = DatabaseRepository.add_evidence_record(new_c_id, regional_auth, ev_data)
    print("Attached evidence record ID:", ev_res["id"])
    ev_list = DatabaseRepository.get_complaint_evidence(new_c_id)
    assert len(ev_list) > 0, "No evidence records retrieved"
    print("Retrieved evidence records for case:", len(ev_list))

    print("\n--- 9. ALERTS & NOTIFICATIONS ---")
    alerts_data = DatabaseRepository.get_alerts()
    print(f"Total alerts in system: {len(alerts_data['alerts'])}, Unread count: {alerts_data['unread_count']}")
    if alerts_data["alerts"]:
        first_alert = alerts_data["alerts"][0]
        DatabaseRepository.mark_alert_read(first_alert["id"])
        print(f"Marked alert #{first_alert['id']} as read.")

    print("\n--- 10. INVESTIGATION MANAGEMENT ---")
    DatabaseRepository.assign_investigator(new_c_id, "OFFICER_704", assigned_by_officer=regional_auth)
    DatabaseRepository.update_complaint_status(new_c_id, "under investigation", officer=inv_auth)
    DatabaseRepository.add_investigation_note(new_c_id, inv_auth, "Patrol car dispatched to target ATM. Interception protocol active.")
    notes = DatabaseRepository.get_complaint_notes(new_c_id)
    assert len(notes) > 0, "No notes found"
    print(f"Investigation notes logged: {len(notes)}. Latest note: {notes[0]['note_text']}")

    print("\n--- 11. REGIONAL/ZONAL MONITORING ---")
    reg_mon = DatabaseRepository.get_regional_monitoring("Ludhiana")
    print(f"Ludhiana Monitoring: {reg_mon['total_complaints']} complaints, {len(reg_mon['investigator_workload'])} investigators assigned.")

    print("\n--- 12. OFFICER MANAGEMENT & AUDIT LOGS ---")
    officers = DatabaseRepository.get_all_officers()
    print(f"Officers roster count: {len(officers)}")
    logs = DatabaseRepository.get_audit_logs(limit=10)
    print(f"Audit logs count: {len(logs)}. Latest action: {logs[0]['action']} on module {logs[0]['module']}")

    print("\n=======================================================")
    print("SUCCESS: ALL 12 RELIC OPERATIONAL MODULES VERIFIED!")
    print("=======================================================")

if __name__ == "__main__":
    test_full_system()
