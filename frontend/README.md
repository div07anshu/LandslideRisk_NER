# 🖥️ Landslide Risk Assessment — Frontend

Modern React 19 dashboard built with Vite, Tailwind CSS 4, and React Router for landslide risk visualization, community reporting, and AI-powered advisory chat.

---

## 🎯 Features

- **Dashboard**: Real-time risk overview, recent alerts, high-risk locations
- **Risk Map**: Interactive Leaflet map with location-based risk analysis
- **Risk Analysis**: Historical trends, factor breakdowns, area comparisons
- **Reports**: Community-submitted incident reports and status tracking
- **Alerts**: System-generated warnings by severity level
- **AI Assistant**: LLM-powered chat interface for landslide risk queries
- **Authentication**: Supabase-based login, signup, and protected routes

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
│   │   ├── layout/       # Layout, Sidebar, Topbar
│   │   ├── dashboard/    # Dashboard widgets
│   │   ├── alerts/       # Alert components
│   │   ├── reports/      # Report forms and lists
│   │   ├── assistant/    # AI chat components
│   │   └── riskmap/      # Map panels
│   ├── pages/            # Top-level route pages
│   │   ├── Dashboard.jsx
│   │   ├── RiskMap.jsx
│   │   ├── RiskAnalysis.jsx
│   │   ├── Reports.jsx
│   │   ├── Alerts.jsx
│   │   ├── AIAssistant.jsx
│   │   ├── LoginPage.jsx
│   │   └── Signup.jsx
│   ├── context/          # React Context providers
│   │   └── AuthContext.jsx
│   ├── common/           # Shared components (Card, SectionHeader)
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
| `*` | `NotFound` | No |

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

## 📝 Notes

- Mock data in `src/data/` is used for development/testing when backend is unavailable
- Map requires `leaflet.css` imported in component files
- Chart components use Recharts with custom styling
