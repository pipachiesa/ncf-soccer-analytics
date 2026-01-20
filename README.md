# Soccer Analytics Dashboard

## Features Completed

- **Overview Page** - Main dashboard with comprehensive match analytics
- **Match Selector** - Dropdown to switch between matches
- **Match Info Card** - Displays match details (teams, score, date, venue)
- **KPI Cards with Dropdowns** - Interactive cards with multiple metric options:
  - Shots (shots, goals, xG, chances created, crosses, shot accuracy, conversion rate)
  - Passes (attempts, accuracy, progressive, long passes, key passes, assists)
  - Recoveries (total, losses, ratio, controlled, dangerous losses)
  - Defensive (duels, aerial duels, tackles, clearances, blocks, fouls)
- **Timeline Chart** - Performance visualization with dropdown options for xG & Shots, Recoveries, Losses, Duels, Passes
- **Outcomes Chart** - Bar chart displaying team performance metrics
- **Activity Heatmap** - Visual representation of activity by pitch zone
- **Supabase Integration** - Real-time data from database

## Features Still to Implement

- Team Analysis Page (Shot Map)
- Player Analysis Page (Individual stats, radar charts)
- Reports Page (CSV export)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and Anon Key

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Go to http://localhost:5173

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Recharts
- Supabase
- Lucide Icons


## Team Members
- **Jose Araya**
- **Sebastian Rodriguez**
- **Felipe Chiesa**