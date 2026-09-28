# Forge Cloud Deployment Guide: Render + Vercel

This guide outlines the steps to deploy the **Forge** hackathon platform to production:
- **Backend**: Hosted on [Render](https://render.com) (Python Flask + Gunicorn + SQLite)
- **Frontend**: Hosted on [Vercel](https://vercel.com) (Vite + React SPA)

---

## 1. Deploy the Backend on Render

The backend needs to be deployed first so you have its live URL (`https://<service-name>.onrender.com`) to configure in the frontend.

### Option A: Using Render Blueprint (`render.yaml`) — Recommended
1. Push your repository to GitHub / GitLab.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Select your Forge repository.
5. Render reads the root [`render.yaml`](./render.yaml) and automatically configures:
   - **Service Name**: `forge-backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT`
   - Auto-generated `SECRET_KEY`
6. Click **Apply**.

---

### Option B: Manual Web Service Setup on Render
If configuring manually via the Render UI:
1. In the Render Dashboard, click **New +** > **Web Service**.
2. Select your Forge repository.
3. Configure the service settings:
   - **Name**: `forge-backend` (or your preferred name)
   - **Region**: Choose the region closest to you or Oregon/Frankfurt
   - **Branch**: `main`
   - **Root Directory**: Leave blank (default `./`)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT`
   - **Instance Type**: `Free` (or Starter for persistent zero-sleep)
4. Under **Advanced** > **Health Check Path**, enter:
   ```text
   /health
   ```
5. Under **Environment Variables**, add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `HOST` | `0.0.0.0` | Binds to all network interfaces |
   | `PORT` | `10000` | (Render sets this dynamically) |
   | `SECRET_KEY` | *(generate a random secure string)* | Token signing |
   | `PYTHON_VERSION` | `3.11.9` | Or any 3.10+ version |
6. Click **Create Web Service**.
7. Wait for the build to finish. Once live, test your backend health check:
   ```bash
   curl https://<your-render-service>.onrender.com/health
   ```
   You should receive:
   ```json
   {"service": "forge-backend", "status": "healthy", "version": "1.0.0"}
   ```
   Copy your Render backend URL (e.g., `https://forge-backend.onrender.com`).

> [!NOTE]
> On Render's Free tier, services spin down after 15 minutes of inactivity. When a new request arrives, it may take ~30–45 seconds to wake up (cold start). Once awake, requests respond in under 50ms.

---

## 2. Deploy the Frontend on Vercel

### Step-by-Step Vercel Setup:
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your Forge Git repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`
   - **Build and Output Settings**:
     - Build Command: `npm run build` (or leave default)
     - Output Directory: `dist` (or leave default)
     - Install Command: `npm install` (or leave default)
5. Expand **Environment Variables** and add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://<your-render-service>.onrender.com` | **Your live Render backend URL** (no trailing slash) |
   | `VITE_USE_MOCK` | `false` | Ensures frontend talks to live backend |
6. Click **Deploy**.
7. Vercel will install dependencies, compile the TypeScript bundle, and deploy to your custom domain or `https://<project-name>.vercel.app`.

---

## 3. Verify the End-to-End Deployment

1. **Verify Public Gallery**:
   Visit `https://<your-vercel-project>.vercel.app/projects`.
   You should see all 6 seeded projects (e.g., *KubePulse*, *AegisDB*, *SpectraTrace*) loaded directly from your Render backend.

2. **Verify Single-Page Navigation**:
   Refresh the page on `https://<your-vercel-project>.vercel.app/dashboard` or `https://<your-vercel-project>.vercel.app/projects`.
   Because [`frontend/vercel.json`](./frontend/vercel.json) specifies SPA rewrites (`"destination": "/index.html"`), the route will reload properly without a 404.

3. **Verify Role Authentication & Workflows**:
   Log in at `https://<your-vercel-project>.vercel.app/login` with any of the pre-configured accounts:

   | Role | Email | Password | What to test |
   | :--- | :--- | :--- | :--- |
   | **Platform Admin** | `admin@forge.internal` | `forge2026` | Admin Console, system metrics, user roles |
   | **Organizer** | `organizer@forge.internal` | `forge2026` | Create Hackathon, rubric config, CSV export |
   | **Judge A** | `judge_a@forge.internal` | `forge2026` | Assigned projects, score submission (1-5) |
   | **Judge B** | `judge_b@forge.internal` | `forge2026` | Independent scoring, peer isolation |
   | **Participant** | `participant@forge.internal` | `forge2026` | Participant dashboard, team details |

---

## 4. Troubleshooting & FAQ

- **CORS Errors in Browser Console**:
  The backend includes global CORS headers (`Access-Control-Allow-Origin: *`, `OPTIONS 204`), allowing requests from any Vercel domain. If you receive a CORS error, check that `VITE_API_URL` does NOT have a trailing slash (`/`).
- **Initial Request Timeout on Vercel**:
  If Render's free backend has spun down, the first request might take ~30s to wake up. The frontend client has a 10s default timeout for interactive actions; refreshing once the backend wakes up will resolve it.
- **Database Persistence**:
  By default on Render's free tier, the SQLite file resides in the service filesystem. If the container restarts on Render Free tier, the backend automatically re-seeds default accounts and fixtures on the fly. For persistent disk on Render, upgrade to a Starter instance and attach a 1GB disk at `/data` with `DATABASE_PATH=/data/forge.db`.
