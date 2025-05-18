# Projectile Motion Simulator & Data Explorer

## Overview

This web application lets you simulate, visualize, and analyze projectile motion with customizable physics parameters. Run single or batch simulations, explore the effects of angle, velocity, spin, drag, and more, and gain insights through interactive charts and a 3D replay viewer.

## Features

- **Interactive Simulator:** Launch projectiles with custom settings and see real-time 3D motion.
- **Batch Simulation:** Generate hundreds of random trials to explore parameter effects statistically.
- **Data Table:** View all simulation results in a sortable, paginated table.
- **Replay Viewer:** Click any trial to watch its 3D trajectory replay in an immersive overlay.
- **Parameter Sensitivity Heatmap:** Visualize how combinations of angle and velocity affect outcomes.
- **Customizable Charts:** Analyze correlations and trends with scatter plots, line charts, and histograms.
- **CSV Export/Import:** Download your data or upload your own trials for analysis.
- **Tooltips & Help:** Hover for quick explanations of controls and data.

## How to Use

1. **Run Simulations:**  
   - Use the “Free Simulation” button to launch a single trial with custom parameters.
   - Or run a batch of randomized trials for statistical exploration.

2. **Explore Data:**  
   - The table shows all trials. Hover for tooltips; click a row to open the replay viewer.
   - Use the charts to see how parameters affect distance, height, and air time.

3. **Replay & Analyze:**  
   - In the replay overlay, scrub through the flight, pause/play, and adjust playback speed.

4. **Import/Export:**  
   - Download your results as CSV.
   - Upload a CSV to analyze your own or shared data (trajectory data supported).

## Installation

1. Clone the repository:

```
git clone https://github.com/your-username/projectile-simulator.git
cd projectile-simulator
```
2. Install Dependencies:

```
npm install
```
3. Start the app:

```
npm start
```

## Tech Stack

- **React** (Vite/CRA)
- **Chakra UI v3+** (composable components)
- **Recharts** (data visualization)
- **@react-three/fiber** (3D simulation)
- **PapaParse** (CSV parsing)

## CSV Format

| Velocity | Angle | Spin | Distance | Max Height | Air Time | Trajectory |
|----------|-------|------|----------|------------|----------|------------|
| number   | number|number| number   | number     | number   | JSON array |

Trajectory is a JSON array of `{x, y, z}` points.

## License

MIT





