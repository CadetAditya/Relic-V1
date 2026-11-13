# RELIC Cybercrime Intelligence Platform — Deployment Guide

This guide details how to deploy the full-stack **RELIC Cybercrime Platform** (React Frontend + Leaflet GIS Map + FastAPI Backend + Random Forest ML Inference + SQLite DB).

---

## Architecture Overview

RELIC uses a **Unified Production Architecture**:
- The **FastAPI backend** serves both:
  1. The REST API endpoints (`/api/v1/...`, `/health`, `/docs`)
  2. The production React SPA frontend (`/`, `/predict`, `/map`, etc.) from `frontend/dist`
- **Zero CORS Configuration**: Both frontend and backend run on the exact same port and domain, eliminating cross-origin errors completely.
- **Watermark-Free Tactical Maps**: Uses OpenStreetMap and ESRI Dark Gray Canvas (0 API keys required).

---

## Method 1: Deploy to Render.com (Recommended — 100% Free & Automatic)

Render connects directly to your GitHub repository: `https://github.com/CadetAditya/Relic-V1.git`

### Step-by-Step:
1. Go to **[render.com](https://render.com/)** and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Select your repository: **`CadetAditya/Relic-V1`**.
4. Configure the settings:
   - **Name**: `relic-intelligence` (or your choice)
   - **Region**: Closest to you (e.g., *Singapore* or *Oregon*)
   - **Environment / Runtime**: **Docker** (Render will automatically detect the root `Dockerfile`)
   - **Instance Type**: **Free**
5. Click **Create Web Service**.

Render will automatically:
- Build the React frontend with Node.js
- Install Python requirements and load the trained Random Forest model
- Expose the app on a public URL: `https://relic-intelligence.onrender.com`

---

## Method 2: Deploy to Railway.app

1. Go to **[railway.app](https://railway.app/)** and log in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select **`CadetAditya/Relic-V1`**.
4. Railway detects the `Dockerfile` and deploys automatically.
5. In project settings, click **Generate Domain** to get a public `.up.railway.app` URL.

---

## Method 3: Deploy via Docker (Local or VPS / Cloud VM)

If deploying to a self-hosted server (Ubuntu, AWS EC2, DigitalOcean Droplet, GCP):

### Run with Docker Compose:
```bash
docker compose up -d --build
```
The system will be live at: `http://<YOUR_SERVER_IP>:8000`

---

## Method 4: Split Hosting (Vercel Frontend + Render Backend)

If you prefer hosting the frontend on Vercel:

1. **Deploy Backend on Render**:
   - Runtime: Python 3.11
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend`
   - Obtain backend URL: `https://relic-backend.onrender.com`

2. **Deploy Frontend on Vercel**:
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Environment Variable: `VITE_API_URL = https://relic-backend.onrender.com/api/v1`
   - Deploy.

---

## Default Authorized Credentials for Production

| Badge ID | Password | Role | Zone Clearance |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin` | **Head Admin** | All Zones (State-wide) |
| **`OFFICER_007`** | `relic2026` | **Regional Admin** | Jalandhar Zone |
| **`OFFICER_704`** | `relic2026` | **Investigator** | Ludhiana Zone |
| **`OFFICER_102`** | `relic2026` | **Investigator** | Amritsar Zone |

