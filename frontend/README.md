# 🖥️ Landslide Risk Assessment — Frontend

Modern React 19 dashboard built with Vite, Tailwind CSS 4, and React Router for landslide risk visualization, community reporting, and AI-powered advisory chat.

---

## 🎯 Features

- **Dashboard**: Real-time risk overview, recent alerts, high-risk locations
- **Risk Map**: Interactive Leaflet map with location-based risk analysis
- **Risk Analysis**: Historical trends, factor breakdowns, area comparisons
- **Reports**: Community-submitted incident reports and status tracking
- **Alerts**: System-generated warnings by severity, plus SMS alert subscription for a saved location
- **AI Assistant**: LLM-powered chat interface for landslide risk queries (also available as a floating widget on every page)
- **Authentication**: Supabase-based login, signup, password reset, and protected routes
- **Admin Panel**: Separate admin-only area — dashboard stats, report moderation, user role management, risk zone editing, risk threshold configuration, and audit logs
- **Internationalization**: UI available in English, Hindi, Assamese, Bengali, and Nepali

---

## 🛠️ Tech Stack

- **React 19** with Hooks and Context API
- **Vite 8** for fast development and HMR
- **Tailwind CSS 4** with custom design system
- **React Router 7** for client-side routing
- **Leaflet & React-Leaflet** for interactive maps
- **Recharts** for data visualization
- **Supabase JS Client** for authentication & database
- **Lucide React** for iconography
- **i18next** with browser language detection for multi-language support

---

## 📦 Setup

### Install Dependencies
```bash
cd frontend
npm install
```

### Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your actual values:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_KEY` | Supabase anon/public key | `eyJhbG...` |
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000` |

---

## 🚀 Running the App

### Development Mode
```bash
npm run dev
```
Starts the Vite dev server at **`http://localhost:5173`** with hot module replacement.

### Production Build
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
```
Runs **Oxlint** for code quality checks.

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layout/       # Layout, Sidebar, Topbar, LanguageSelector
│   │   ├── dashboard/    # Dashboard widgets
│   │   ├── alerts/       # Alert list/summary + SMS location alert subscription form
│   │   ├── analysis/     # Risk Analysis page components (trend chart, factor breakdown, comparisons)
│   │   ├── reports/      # Report forms and lists
│   │   ├── assistant/    # AI chat components (chat page)
│   │   ├── ai-floating/  # Floating AI Assistant widget shown across pages
│   │   ├── riskmap/      # Map layers and location detail panel
│   │   └── admin/        # Admin-only layout, sidebar, metric cards, report detail modal
│   ├── pages/            # Top-level route pages
│   │   ├── Dashboard.jsx
│   │   ├── RiskMap.jsx
│   │   ├── RiskAnalysis.jsx
│   │   ├── Reports.jsx
│   │   ├── Alerts.jsx
│   │   ├── AIAssistant.jsx
│   │   ├── LoginPage.jsx
│   │   ├── Signup.jsx
│   │   ├── UpdatePassword.jsx
│   │   ├── Unauthorized.jsx
│   │   ├── NotFound.jsx
│   │   └── admin/        # AdminDashboard, AdminReports, AdminUsers, AdminRiskZones, AdminConfig, AdminAuditLogs
│   ├── context/          # React Context providers
│   │   └── AuthContext.jsx
│   ├── hooks/            # useAdminAuth, useRiskMapData, useTranslation
│   ├── i18n/             # i18next setup + locale JSON files (en, hi, as, bn, ne)
│   ├── api/              # adminApi.js — typed calls to the backend admin API
│   ├── common/           # Shared components (Card, CardHeader, Modal, SectionHeader)
│   ├── data/             # Mock data and constants
│   ├── supabase.js       # Supabase client instance
│   ├── App.jsx           # Router configuration
│   └── main.jsx          # App entry point
├── public/               # Static assets
├── .env.example          # Environment template
├── vite.config.js        # Vite configuration
└── package.json
```

---

## 🔒 Authentication Flow

1. User logs in via **`/login`** or signs up via **`/signup`**
2. Supabase returns an access token stored in local session
3. **`AuthContext`** manages user state across components
4. **`ProtectedRoute`** wrapper guards authenticated pages
5. **`GuestRoute`** wrapper redirects logged-in users away from login/signup
6. API calls to backend include `Authorization: Bearer <token>` header

---

## 🗺️ Routing

| Path | Component | Auth Required |
| :--- | :--- | :--- |
| `/login` | `LoginPage` | No (redirects if logged in) |
| `/signup` | `Signup` | No (redirects if logged in) |
| `/` | `Dashboard` | Yes |
| `/risk-map` | `RiskMap` | Yes |
| `/risk-analysis` | `RiskAnalysis` | Yes |
| `/reports` | `Reports` | Yes |
| `/alerts` | `Alerts` | Yes |
| `/assistant` | `AIAssistant` | Yes |
| `/update-password` | `UpdatePassword` | No |
| `/unauthorized` | `Unauthorized` | No |
| `/admin/*` | Admin pages (`AdminDashboard`, `AdminReports`, `AdminUsers`, `AdminRiskZones`, `AdminConfig`, `AdminAuditLogs`) | Yes + `ADMIN` role |
| `*` | `NotFound` | No |

Admin routes are guarded client-side by `AdminRoute` (via `useAdminAuth`), but
the actual authorization check happens server-side on every request in the
backend (`requireAdmin` — see `../backend/README.md`); the frontend guard is
only for UX.

---

## 🧩 Key Components

### Layout Components
- **`Layout`**: Main app shell with sidebar navigation
- **`Sidebar`**: Navigation menu with active route highlighting
- **`Topbar`**: User profile and logout controls

### Dashboard Widgets
- **`RiskOverview`**: Donut chart showing risk distribution
- **`HighRiskLocations`**: List of critical areas
- **`RecentAlerts`**: Latest system warnings
- **`RecentReports`**: Community-submitted incidents
- **`QuickActions`**: Shortcuts to key features

### AI Assistant
- **`ChatBubble`**: Message display with user/bot differentiation
- **`ChatInput`**: Message composition with send button
- **`TypingIndicator`**: Loading state animation

---

## 🌐 API Integration

Frontend communicates with:

1. **Supabase** (direct): Authentication, user management, database queries
2. **Backend API** (`VITE_API_URL`): Proxied risk analysis, protected endpoints

Example API call:
```javascript
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({ message: userInput }),
});
```

---

## 🎨 Styling

Uses **Tailwind CSS 4** with:
- Custom color palette for risk levels (low/moderate/high/critical)
- Responsive breakpoints for mobile, tablet, desktop
- Dark mode support (planned)

---

## 🌍 Internationalization

`src/i18n/` configures i18next with browser language detection and locale
files for English (`en`), Hindi (`hi`), Assamese (`as`), Bengali (`bn`), and
Nepali (`ne`). Components read strings via the `useTranslation` hook; the
`LanguageSelector` in the layout lets users switch at runtime.

## 📝 Notes

- Mock data in `src/data/` is used for development/testing when backend is unavailable
- Map requires `leaflet.css` imported in component files
- Chart components use Recharts with custom styling
- `LocationAlertSubscription` (in `components/alerts/`) posts to the backend's
  `/api/auth/alerts/subscribe` so a user's phone number + location can receive
  automatic SMS alerts — see `../backend/README.md` for the alert monitor.
