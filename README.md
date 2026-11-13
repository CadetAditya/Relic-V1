# RELIC — Cybercrime Cashpoint Intelligence & Predictive Interception Platform

[![Live Platform](https://img.shields.io/badge/Live%20Platform-Render-brightgreen?style=for-the-badge&logo=render)](https://relic-cybercrime-intelligence.onrender.com)
[![API Docs](https://img.shields.io/badge/API%20Docs-Swagger-blue?style=for-the-badge&logo=fastapi)](https://relic-cybercrime-intelligence.onrender.com/docs)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Leaflet GIS](https://img.shields.io/badge/GIS-OpenStreetMap%20%26%20ESRI-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)

> **Predict the Risk. Locate the Threat. Prevent the Fraud.**  
> Operational law-enforcement platform forecasting cybercrime ATM cash extractions in advance to enable proactive interception, tactical dispatch, and mule account tracking across Indian jurisdictions.

---

## 🌐 Live Deployment Links

- **🚀 Live Web Platform**: [https://relic-cybercrime-intelligence.onrender.com](https://relic-cybercrime-intelligence.onrender.com)
- **📑 Interactive API Documentation (Swagger)**: [https://relic-cybercrime-intelligence.onrender.com/docs](https://relic-cybercrime-intelligence.onrender.com/docs)
- **🩺 Health Check**: [https://relic-cybercrime-intelligence.onrender.com/health](https://relic-cybercrime-intelligence.onrender.com/health)

---

## 🔐 Demo Authorized Officer Clearances

Log in to the live portal using any of the seeded operational profiles:

| Badge ID | Password | Role / Clearance | Jurisdiction |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin` | **Head Admin** | State-wide (All Zones) |
| **`OFFICER_007`** | `relic2026` | **Regional / Zonal Admin** | Jalandhar Zone |
| **`OFFICER_704`** | `relic2026` | **Investigator** | Ludhiana Zone |
| **`OFFICER_102`** | `relic2026` | **Investigator** | Amritsar Zone |
| **`OFFICER_205`** | `relic2026` | **Investigator** | Phagwara Zone |

---

## ⚡ Core Operational Capabilities

1. **Secure Login & RBAC**: Strict role-based views for Head Admin, Regional/Zonal Admin, and Field Investigators.
2. **Operations Desk**: Real-time KPI telemetry, high-priority fraud queues, interactive district choropleth map, and recent extraction advisories.
3. **Register Cybercrime Complaint**: Ingest victim and beneficiary bank accounts, transaction UTRs, reported fraud types, and auto-generate unique complaint tracking IDs.
4. **Complaint Dossiers**: Comprehensive filterable ledger with assigned officer routing, evidence attachments, and CCTV identification logs.
5. **Live AI Predictive Radar**: Random Forest inference engine ranking Top-3 predicted cash-out ATMs with calibrated probability scores, expected amounts, and extraction time windows.
6. **ATM GIS Intelligence Map**: OpenStreetMap and ESRI Dark Grid layers color-coded into 4 calibrated risk tiers (Critical Hotspots, Elevated, Moderate, Monitored).
7. **Money Trail Network**: Full multi-hop fund flow visualization, mule account transaction graphs, and historical extraction habit tracking.
8. **Zonal Command**: District-level risk heatmaps, investigator workload allocations, and regional threat registers.
9. **Officer Administration & Audit Logs**: Full officer account lifecycle management and tamper-evident audit trails.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide Icons, Leaflet GIS (OSM & ESRI Dark Gray Canvas)
- **Backend**: Python 3.11, FastAPI, Uvicorn (Unified SPA & API Server), SQLite with WAL journal
- **Machine Learning**: Scikit-Learn `CalibratedClassifierCV` (Random Forest), Joblib, Pandas, NumPy
- **Deployment**: Multi-Stage Docker Container, Render.com Web Service

