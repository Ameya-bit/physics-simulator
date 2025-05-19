# Projectile Motion Simulator & Data Explorer

## Overview

This web application lets you simulate and analyze projectile motion with customizable physics parameters. Run single or batch simulations, explore the effects of angle, velocity, spin, drag, and more, and gain insights through interactive charts.

## Features

- **Interactive Simulator:** Launch projectiles with custom settings and see real-time 3D motion.
- **Batch Simulation:** Generate hundreds of random trials to explore parameter effects statistically.
- **Data Table:** View all simulation results in a sortable, paginated table.
- **Parameter Sensitivity Heatmap:** Visualize how combinations of angle and velocity affect outcomes.
- **Customizable Charts:** Analyze correlations and trends with scatter plots, line charts, and histograms.
- **CSV Export/Import:** Download your data or upload your own trials for analysis.
- **Tooltips & Help:** Hover for quick explanations of controls and data.

## How to Use

1. **Run Simulations:**  
   - Use the "Free Simulation" button to launch a single trial with custom parameters.
   - Or run a batch of randomized trials for statistical exploration.

2. **Explore Data:**  
   - The table shows all trials with key metrics. Hover for tooltips.
   - Use the charts to see how parameters affect distance, height, and air time.

3. **Import/Export:**  
   - Download your results as CSV for external analysis.
   - Upload a CSV to analyze your own experimental data.

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

| Velocity | Angle | Spin | Distance | Max Height | Air Time |
|----------|-------|------|----------|------------|----------|
| number   | number|number| number   | number     | number   |

## License

MIT
