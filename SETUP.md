# ⚡ Pulse Setup & Configuration Guide

This guide provides step-by-step instructions to set up the **Pulse** Smart Market Watchlist from scratch, including database provisioning, API key configuration, and running the application in both Demo and Live modes.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18.0 or higher recommended)
- **npm** (comes with Node.js)
- **Git**

---

## 1️⃣ Clone and Install

First, clone the repository and install the required dependencies:

```bash
git clone https://github.com/JayD108/Pulse.git
cd Pulse
npm install
```

---

## 2️⃣ Supabase Setup (Database & Authentication)

Pulse uses Supabase for storing users, watchlists, and persistent state.

### Step 2.1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and create a free account if you don't have one.
2. Click **New Project**, select an organization, and name your project (e.g., "Pulse").
3. Set a secure database password and choose a region close to you.
4. Wait a few minutes for the database to provision.

### Step 2.2: Get Your API Keys
1. In your Supabase dashboard, go to **Project Settings** (the gear icon) > **API**.
2. Note down your **Project URL**.
3. Note down your **`anon` `public` API key** (this is your Publishable Key).
4. Note down your **`service_role` `secret` API key** (this is your Secret Key).

### Step 2.3: Run Database Migrations
Pulse comes with a complete SQL script that sets up the required tables, Row Level Security (RLS) policies, and triggers.

1. In your Supabase dashboard, go to the **SQL Editor** (the `<>` icon in the left sidebar).
2. Click **New query**.
3. Open the file `supabase/migrations/20260905_watchlist_complete.sql` from your local codebase.
4. Copy the entire contents of that file and paste it into the Supabase SQL Editor.
5. Click **Run** to execute the query. You should see a "Success" message indicating the tables and policies were created.

---

## 3️⃣ Third-Party APIs (Live Market Data & AI)

Pulse supports deterministic mock data for easy demos, but you can enable real-time features using these third-party APIs.

### Twelve Data (Live Market Quotes)
Twelve Data provides real-time stock prices.
1. Go to [Twelve Data](https://twelvedata.com/) and sign up for a free account.
2. Navigate to your **Dashboard > API Keys**.
3. Copy your API key.

### Google Gemini API (AI Explainability)
Gemini generates the intelligent narratives explaining *why* a stock moved.
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and create a new key.
3. Copy your API key.

---

## 4️⃣ Environment Variables

Create a file named `.env` in the root of your project directory (`Pulse/.env`). Copy the following template and fill in the keys you obtained in the previous steps.

```ini
# ----------------------------------------------------
# Supabase Configuration
# ----------------------------------------------------
# Found in Supabase > Project Settings > API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_public_key

# BACKEND ONLY: The service_role key allows the backend to bypass RLS.
# NEVER expose this to the frontend (do not prefix with VITE_).
SUPABASE_SECRET_KEY=your_service_role_secret_key


# ----------------------------------------------------
# Application Modes
# ----------------------------------------------------
# Set to 'false' to require actual user authentication via Supabase.
# Set to 'true' to bypass login and use the app in demo mode.
VITE_DEMO_MODE=false


# ----------------------------------------------------
# Live Market Data (Twelve Data)
# ----------------------------------------------------
# Set to 'twelve_data' to fetch live quotes, or 'mock' to use offline demo data.
MARKET_DATA_PROVIDER=twelve_data
TWELVE_DATA_API_KEY=your_twelve_data_api_key_here


# ----------------------------------------------------
# AI Explanation Layer (Google Gemini)
# ----------------------------------------------------
# Requires a gemini-2.0-flash or 3.0-pro capable key.
GEMINI_API_KEY=your_google_gemini_api_key_here

# Set to 'true' to enable AI-generated market narratives.
# Set to 'false' to preserve free-tier quota (the app will fall back to deterministic narratives).
GEMINI_ENABLED=true
```

---

## 5️⃣ Running the Application

Pulse is structured as a Vite React frontend and an Express Node.js backend. Both run concurrently in development mode.

### Start the Development Server
```bash
npm run dev
```

The application will start, and you will see output indicating that the backend is running (typically on `http://localhost:3000`) and the Vite frontend is serving the UI. 

- Open **`http://localhost:3000`** in your browser.

### Building for Production
To build the application for deployment:
```bash
npm run build
```
This will bundle the React frontend into the `dist/` directory and compile the backend into a standalone `dist/server.cjs` file.

To start the production build:
```bash
npm run start
```

---

## 💡 Troubleshooting & Tips

- **White Screen / React Errors**: Ensure your `.env` variables are correctly prefixed. Any variable that needs to be accessed by the React frontend *must* start with `VITE_`.
- **"Failed to fetch market data"**: If you are using Twelve Data on a free tier, you may hit rate limits (8 requests/minute). The app has a built-in TTL cache and graceful mock-data fallback to prevent crashes, but you may see console warnings.
- **Supabase Authentication**: If you disable `VITE_DEMO_MODE`, users will be prompted to log in. You can configure authentication providers (Email/Password, Google, etc.) in the Supabase Dashboard under **Authentication > Providers**.
