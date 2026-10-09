# Vercel Deployment Guide — TBM Post-Production CRM

This project is fully optimized and configured for **zero-friction Vercel deployment**.

---

## 🚀 Quick Deploy Options

### Option A: Via Vercel Web Dashboard (Recommended)

1. Push your repository to **GitHub** / **GitLab** / **Bitbucket**.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Configure the Project:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**:
     - Either leave as default (`./` — supported via root `vercel.json`)
     - **OR** set to `tbm-crm/system/web` (recommended for fastest builds)
   - **Build Command**: `pnpm run build` (or `npm run build`)
   - **Output Directory**: `dist`
4. Click **Deploy**.

---

### Option B: Via Vercel CLI

From your terminal:

```bash
# Navigate to the web application directory
cd tbm-crm/system/web

# Deploy to Vercel preview
npx vercel

# Deploy to production
npx vercel --prod
```

---

## ⚙️ Environment Variables (Optional)

The application operates **100% autonomously out of the box** using client-side Zustand persistence with embedded real dataset (109 projects, 12 team members, 7 brands).

To enable AI assistant features or custom keys, configure these in **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | Optional: Enables streaming GPT-4o-mini AI assistant | `sk-proj-...` |
| `VITE_TURNSTILE_KEY` | Cloudflare Turnstile human verification key | `1x00000000000000000000AA` |

---

## 📁 Pre-Configured Vercel Architecture

- **SPA Rewrites**: All client routes (`/app/dashboard`, `/app/projects`, `/app/projects/pipeline`, `/app/projects/portal`, `/app/audit`, etc.) route cleanly to `/index.html` with zero 404s.
- **Serverless API Routes**:
  - `GET /api/health` — System status check
  - `GET /api/projects` — 109 deliverables with complete metadata
  - `GET /api/brands` — 7 client brands
  - `GET /api/members` — 12 team members
  - `POST /api/chat` — Streaming AI assistant endpoint
- **Asset Caching**: Immutable 1-year caching for static JavaScript, CSS, and font chunks (`/assets/*`).
- **Fast Uploads (`.vercelignore`)**: Ignores heavy monorepo packages and caches during upload.
