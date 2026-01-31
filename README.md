# Mighty Banyans Soccer Analytics Dashboard

A comprehensive soccer analytics platform providing detailed match and player statistics, visualizations, and tactical analysis for the Mighty Banyans team.

## Features

### Overview Page
Main dashboard for team performance analysis across matches.

- **Match Selector** - Choose between individual matches or "All Games" aggregate view
- **Per-90 Toggle** - Calculate statistics per 90 minutes when viewing all games
- **KPI Cards** - Interactive cards with dropdown metric options:
  - Shots (total shots, goals, xG, chances created, crosses, shot accuracy, conversion rate)
  - Passes (attempts, accuracy, progressive, long passes, key passes, assists)
  - Recoveries (total, losses, ratio, controlled, dangerous losses)
  - Defensive (duels, aerial duels, tackles, clearances, blocks, fouls)
- **Match Info Box** - Displays home/away teams, score, date, stadium, and referee
- **Lineup Display** - Visual formation with player names and shirt numbers
- **Shot Map** - Canvas-based visualization with color shots (goals, on target, blocked, off target, post)
- **Performance Chart** - Timeline visualization with 5-minute interval aggregation (xG & Shots, Recoveries, Losses, Duels, Passes)
- **Activity Heatmap** - Color pitch zones showing intensity for attacking activity, recovery, losses, defensive actions, crosses, and aerial duels

### Team Analysis Page
Detailed team-level tactical and performance analysis.

- **Lineup Formation** - Interactive formation display with player positioning
- **Expandable Metric Boxes** - Detailed breakdown for passes, shots, duels, recoveries, expected goals, and losses
- **Tactical Pitch Card** - Advanced pitch visualization with tactical positioning and heat density

### Player Analysis Page
Individual player performance and detailed statistics.

- **Player Selector** - Dropdown to choose from available players
- **Player Info Card** - Jersey number and quick stat summary (actions, goals, assists, passes)
- **Player Activity Heatmap** - Shows where on pitch player was active
- **Player Radar Chart** - 6-metric radar normalized relative to team average (Passes, Shots, Duels Won, Aerial Duels, Recoveries, Tackles)
- **Player Touch Map** - Detailed visualization of all player touches and actions
- **Player Events Table** - Aggregated event summary with counts by type

## Tech Stack

| Frontend Framework: React 18.2.0 
| Build Tool: Vite 5.0.8 
| Routing: React Router DOM 6.21.0 
| Styling: Tailwind CSS 3.4.0 
| Charts: Recharts 2.12.0 
| Custom Visualizations: Canvas API
| Backend/Database: Supabase (PostgreSQL) 
| Icons: Lucide React 
| Precision Math: BigNumber.js 

## Project Structure

```
src/
├── App.jsx                 # Main app with routing & MatchContext
├── main.jsx                # React entry point
├── lib/
│   └── supabase.js         # Supabase client initialization
├── pages/
│   ├── Overview.jsx        # Team overview & match analysis
│   ├── TeamAnalysis.jsx    # Team tactical analysis
│   └── PlayerAnalysis.jsx  # Individual player statistics
├── components/
│   ├── Sidebar.jsx         # Navigation sidebar
│   ├── MatchSelector.jsx   # Match dropdown selector
│   ├── KPICard.jsx         # Key Performance Indicator cards
│   ├── Per90Toggle.jsx     # Per-90 minutes stat toggle
│   ├── MetricBox.jsx       # Expandable metric cards
│   ├── PerformanceChart.jsx    # Timeline/performance chart
│   ├── ActivityHeatmap.jsx     # Pitch heatmap visualization
│   ├── LineupFormation.jsx     # Formation display
│   ├── PlayerRadarChart.jsx    # Radar chart for player comparison
│   ├── PlayerInfoCard.jsx      # Player profile card
│   ├── PlayerHeatmap.jsx       # Player activity heatmap
│   ├── PlayerTouchMap.jsx      # Player touch/action map
│   ├── Overview/
│   │   ├── MatchInfoBox.jsx        # Match header info
│   │   ├── LineupsAndStatsRow.jsx  # Lineup display & match stats
│   │   └── ShotMap.jsx             # Shot visualization on pitch
│   └── TeamAnalysis/
│       └── TacticalPitchCard.jsx   # Tactical analysis visualization
├── hooks/
│   ├── useFetchData.js     # Main data fetching hooks (18 hooks)
│   └── useMatchData.js     # Match-specific data hooks
└── utils/
    ├── canvasUtils.js      # Canvas drawing utilities
    ├── tacticalMapping.js  # Tactical position mapping
    └── verifyData.js       # Data validation helpers
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and Anon Key:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Navigate to http://localhost:5173

## Build Commands

```bash
npm run dev       # Start development server
npm run build     # Create production build
npm run preview   # Preview production build
```

## Database Schema

The application uses the following Supabase tables:

Tables: 
`matches`
`team_stats` 
`player_stats`
`events` 
`players`
`match_lineups`
'match_stats'
'rivals_lineup'
'player_minutes'


## Team Members

- **Jose Araya**
- **Sebastian Rodriguez**
- **Felipe Chiesa**