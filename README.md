# 🏔️ Landslide Risk Assessment & Early Warning System (NER)

A full-stack, AI-powered landslide susceptibility and early warning system tailored for the **North-East Region (NER) of India**. The platform analyzes real-time meteorological conditions, historical landslide inventory, elevation, slope, and soil metrics to assess landslide hazards and provide actionable alerts.

---

## 📐 Architecture Overview

The system follows a modern three-tier decoupled architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 React Frontend (Vite + Tailwind)            │
│  - Interactive Risk Maps (Leaflet) & Analytics Dashboard    │
│  - User Authentication & Community Incident Reporting       │
│  - AI Assistant Chat Interface                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / Supabase Auth Tokens
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          Node.js Backend Gateway (Express + TypeScript)     │
│  - Centralized API Gateway & Security Headers (Helmet)      │
│  - Supabase Bearer-Token Authentication Middleware          │
│  - Rate Limiting & Proxying to AI / Database Services       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Proxied REST calls
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             AI & ML Microservice (FastAPI + Python)         │
│  - Machine Learning Model (`landslide_risk_model.joblib`)   │
│  - Real-Time Weather Integration (Open-Meteo API)           │
│  - LLM-Powered Advisory Assistant (Groq API)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── frontend/             # React 19 + Vite + Tailwind CSS dashboard UI
├── backend/              # Node.js + Express + TypeScript API gateway
├── ai_services/          # FastAPI Python service hosting ML models and chat
├── data/                 # Landslide catalogues, district GeoJSONs, ML scripts
├── requirements.txt      # Python dependencies for ai_services & data pipelines
└── README.md             # Project documentation (this file)
```

---

## 🛠️ Prerequisites

Ensure you have the following installed on your system:

- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x or higher
- **Python**: v3.10 to v3.12
- **Supabase Account**: For database, storage, and authentication
- **Groq Cloud API Key**: For the AI Assistant service

---

## 🚀 Quick Start & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/LandslideRisk_NER.git
cd LandslideRisk_NER
```

### 2. Set Up the Python AI Service (Root / `ai_services/`)
```bash
# Create and activate Python virtual environment
python -m venv venv
# On Windows (Git Bash):
source venv/Scripts/activate
# On Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp ai_services/.env.example ai_services/.env
```
*Edit `ai_services/.env` and add your `GROQ_API_KEY`, `SUPABASE_URL`, and `SUPABASE_KEY`.*

**Run AI Service:**
```bash
cd ai_services
uvicorn app.main:app --port 8000 --reload
```

---

### 3. Set Up the Node.js Backend Gateway
Open a new terminal:
```bash
cd backend
npm install

# Configure environment
cp .env.example .env
```
*Edit `backend/.env` with your `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.*

**Run Backend Service:**
```bash
# Start in development mode (port 4000)
npm run dev
```

---

### 4. Set Up the React Frontend
Open a new terminal:
```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
```
*Edit `frontend/.env` with your `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, and `VITE_API_URL=http://localhost:4000`.*

**Run Frontend Client:**
```bash
# Start Vite development server (port 5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔐 Environment Variables Summary

| Service | File | Key Variables |
| :--- | :--- | :--- |
| **Frontend** | `frontend/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_API_URL` |
| **Backend** | `backend/.env` | `PORT`, `CORS_ORIGIN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FASTAPI_URL` |
| **AI Services** | `ai_services/.env` | `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY` |

---

## 🧪 Testing & Code Verification

### Backend Tests
```bash
cd backend
npm test          # Run Jest + Supertest test suite
npm run typecheck # Validate TypeScript types
```

### Frontend Linting
```bash
cd frontend
npm run lint      # Run Oxlint checks
```

---

## 📄 License
This project is developed for educational and research purposes in landslide hazard mitigation.
