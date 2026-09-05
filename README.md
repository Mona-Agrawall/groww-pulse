# ⚡ Pulse: Smart Market Watchlist

*An intelligent market dashboard built for CODE 2026.*

**Pulse** goes beyond traditional stock tickers by introducing a **deterministic Time Engine**. Instead of just showing current prices, it calculates what has *meaningfully changed* since you last visited the app, highlights these shifts, and provides AI-generated explanations of the institutional mechanics behind the moves.

---

## ✨ Features

- 🕒 **"You Were Away" Narrative**: The app remembers your last visit (`lastVisitTimestamp`) and surfaces only the meaningful market events that occurred during your absence.
- 🎯 **Proprietary Attention Scoring**: A custom 0-100 algorithm ranks stocks based on volume surges, technical breakouts, gaps, and intraday reversals.
- 🧠 **AI-Powered Insights**: Integrates with Google Gemini (`gemini-2.0-flash`) to explain *why* a stock moved, acting strictly as an explanation layer to prevent hallucinated data.
- ⏳ **Time Travel Simulation**: A built-in developer tool to simulate being away for different time periods (e.g., "7h 42m") to instantly test the state machine.
- 🎨 **Premium Aesthetic**: Built with React, Tailwind CSS v4, and Framer Motion. Features glassmorphism, stagger animations, full accessibility (`aria` tags, reduced-motion), and interactive SVG charting.

---

## 🛠 Tech Stack

*   **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion
*   **Backend**: Node.js, Express (orchestrated directly within Vite via `tsx`)
*   **AI Integration**: Google GenAI SDK (`gemini-2.0-flash`)
*   **Data Abstraction**: Plug-and-play `IMarketDataProvider` interface (ready for Twelve Data or Polygon.io)

---

## 🚀 Quick Start

The application works perfectly out-of-the-box using offline, deterministic demo data—perfect for hackathon presentations without worrying about API rate limits or live market hours.

### 1. Install & Run
```bash
# Clone the repository
git clone https://github.com/JayD108/Pulse.git
cd Pulse

# Install dependencies
npm install

# Start the frontend and backend concurrently
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 2. Enable AI Explanations (Optional)
To enable dynamic stock narratives via Google Gemini:
1. Copy `.env.example` to `.env`
2. Add your API key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

---

## 🧠 Architecture Overview

*   `server.ts`: Core Express backend serving the `/api` REST routes.
*   `server/marketEngine.ts`: The deterministic state machine, mock data provider, and scoring engine.
*   `src/lib/marketDataTypes.ts`: Interfaces for seamlessly swapping to live real-money data providers.
*   `src/components/`: Modular React frontend components (e.g., `MarketPulseHero`, `StockDetailModal`).

---
*Built with precision for CODE 2026.*
