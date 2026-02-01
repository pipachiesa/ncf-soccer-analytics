# ⚽ Mighty Banyans Soccer Analytics Dashboard

![Mighty Banyans Mascot](file:///Users/felipechiesa/Desktop/ncf_isp/public/mascotMightyBanyan.png)

## 📋 Project Overview

The **Mighty Banyans Soccer Analytics Dashboard** is a high-performance, data-driven platform designed to provide elite-level tactical insights and performance metrics for the Mighty Banyans soccer team. By leveraging advanced data visualization and a robust background calculation engine, the dashboard transforms raw event data into actionable intelligence for coaches, analysts, and players.

---

## ⭐️ Key Features

### 🏟️ Overview Dashboard
A central hub for match-day performance and aggregate season trends.
- **Dynamic Match Selection**: Seamlessly toggle between specific matches or an "All Games" unified view.
- **Smart KPI Analytics**: Interactive metric cards with precision rounding using `BigNumber.js`, covering Shots, Passes, Recoveries, and Defensive actions.
- **Per-90 Analysis**: Normalize statistics across different playtimes for fair player and team comparisons.
- **Spatial Visualizations**:
    - **Shot Map**: Canvas-based plotting of shots with outcome-based color coding.
    - **Activity Heatmaps**: Sector-based intensity maps for attacking, defensive, and recovery zones.
- **Performance Timeline**: 5-minute interval aggregation of xG, momentum, and event distribution.

### 📊 Team Tactical Analysis
Deep-dive into team structure and collective performance.
- **Interactive Lineups**: Visual formation displays reflecting tactical positioning.
- **Expandable Metric Tiers**: Hierarchical breakdown of team stats from macro-trends to micro-event details.
- **Tactical Pitch Mapping**: Advanced spatial analysis showing team density and field control.

### 👤 Player Performance Profile
Individualized analysis for scouting and player development.
- **Player Radar Charts**: 6-dimension performance comparison against team averages.
- **Touch & Event Maps**: Individual "footprint" analysis showing every action taken by a player on the pitch.
- **Aggregated Stat Tables**: Quick-access summary of goals, assists, and defensive contributions.

---

## 🛠️ Technical Architecture

### Tech Stack
- **Frontend**: ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) `18.2.0`
- **Build Tool**: ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) `5.0.8`
- **State Management**: React Context (MatchContext) for global match state.
- **Data & Storage**: ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white) (PostgreSQL)
- **Visualizations**: 
    - **Recharts**: For temporal and comparative charting.
    - **Canvas API**: For high-performance spatial data rendering.
- **Mathematics**: `BigNumber.js` for precise rate and percentage calculations (e.g., xG aggregation).

### Data Flow & Processing
The application employs a custom-built **Statistics Engine** (`useFetchData.js`) that:
1.  Fetches raw events from Supabase with automated pagination beyond the 1000-row limit.
2.  Calculates derived metrics on-the-fly, including:
    - **xG (Expected Goals)** aggregation.
    - **Progressive Pass** identification.
    - **Recovery/Loss Ratios**.
    - **Duel Win Rates**.
3.  Maps spatial coordinates to tactical zones and normalized pitch dimensions.

---

## 📂 Project Structure

```text
src/
├── hooks/              # Statistics engine & data fetching logic
│   ├── useFetchData.js # Core calculation logic for all KPIs
│   └── useMatchData.js # Context-aware match state
├── components/         # Reusable UI & Visualization components
│   ├── ActivityHeatmap.jsx
│   ├── LineupFormation.jsx
│   ├── PerformanceChart.jsx
│   └── PlayerRadarChart.jsx
├── pages/              # Main application views
│   ├── Overview.jsx
│   ├── TeamAnalysis.jsx
│   └── PlayerAnalysis.jsx
└── utils/              # Calculation helpers & canvas drawing
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Account

### Installation

1.  **Clone & Install**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

3.  **Launch**:
    ```bash
    npm run dev
    ```

---

## 👥 Contributors
- **Jose Araya**
- **Sebastian Rodriguez**
- **Felipe Chiesa**

---
*Developed for the New College of Florida (NCF) Soccer Program.*