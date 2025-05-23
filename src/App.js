import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import PhysicsScene from "./physicsscene";
import UIControls from "./UIControls";
import ProjectileInfoPanel from "./ProjectileInfoPanel";
import EnergyBar from "./EnergyBar";
import DataPage from "./DataPage";
import { Html } from "@react-three/drei";
import { Button } from "@chakra-ui/react";

export default function App() {
  const [showDataPage, setShowDataPage] = useState(false);
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [activeParams, setActiveParams] = useState({
    mass: 1,
    angle: 45,
    launchVelocity: 15,
    drag: 0.47,
    airDensity: 1.225,
    gravity: 9.81,
    restitution: 0.5,
    spin: 0,
  });
  const [trials, setTrials] = useState([]);
  const [inFlight, setInFlight] = useState(false);
  const maxHeight = useRef(0);
  const startTime = useRef(0);
  const boxRef = useRef(null);

  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [trajectory, setTrajectory] = useState([]);
  const [trajectoryColor, setTrajectoryColor] = useState("#888");
  const [oldTrajectories, setOldTrajectories] = useState([]); // Array of { points, color }
  const [currentTrajectory, setCurrentTrajectory] = useState({
    points: [],
    color: getRandomColor(),
  });
  const [showTrajectories, setShowTrajectories] = useState(true);

  const batchSize = 10; // Adjust as needed

  const runBatchSimulations = async () => {
    setIsRunningBatch(true);
    setBatchProgress(0);

    const newTrials = []; // Initialize as array

    for (let i = 0; i < batchSize; i++) {
      const params = {
        mass: Math.random() * 5 + 0.5,
        angle: Math.random() * 90,
        launchVelocity: Math.random() * 50 + 10,
        drag: Math.random() * 0.5 + 0.1,
        spin: (Math.random() - 0.5) * 20,
        gravity: 9.81,
        airDensity: 1.225,
      };

      const result = await runHeadlessSimulation(params);
      newTrials.push({
        // Push trial objects into the array
        params,
        results: {
          distance: result.distance || 0,
          maxHeight: result.maxHeight || 0,
          airTime: result.airTime || 0,
          trajectory: result.trajectory || [],
        },
      });

      setBatchProgress(((i + 1) / batchSize) * 100);
    }

    setTrials((prev) => [...prev, ...newTrials]);
    setIsRunningBatch(false);
  };

  async function runHeadlessSimulation(params) {
    return new Promise((resolve) => {
      if (
        typeof params.launchVelocity !== "number" ||
        typeof params.angle !== "number" ||
        typeof params.gravity !== "number"
      ) {
        resolve({ error: "Invalid parameters" });
        return;
      }
      const state = {
        position: {
          x: 0,
          y: params.initialHeight ?? 5, // Default to 5 if undefined
          z: 0,
        },
        velocity: {
          x:
            (params.launchVelocity || 0) *
            Math.cos((params.angle * Math.PI) / 180),
          y:
            (params.launchVelocity || 0) *
            Math.sin((params.angle * Math.PI) / 180),
        },
        trajectory: [],
      };

      const dt = 0.016; // 60fps timestep
      let airTime = 0;
      const maxIterations = 10000; // Prevent infinite loops
      let iteration = 0;

      while (state.position.y > 0.5 && iteration < maxIterations) {
        const speed = Math.hypot(state.velocity.x, state.velocity.y);

        // Guard against invalid velocities
        if (isNaN(speed) || speed === 0) break;

        // Correct drag force: F_d = ½ρv²C_dA → components = -F_d * (vx/|v|)
        const dragForce = 0.5 * params.airDensity * params.drag * speed ** 2;
        const dragX = (-dragForce * state.velocity.x) / (params.mass * speed);
        const dragY = (-dragForce * state.velocity.y) / (params.mass * speed);

        // Update velocities
        state.velocity.x += dragX * dt;
        state.velocity.y += (dragY - params.gravity) * dt;

        // Update positions
        state.position.x += state.velocity.x * dt;
        state.position.y += state.velocity.y * dt;

        // Record trajectory
        if (airTime % 0.1 < dt) {
          state.trajectory.push({ ...state.position });
        }

        airTime += dt;
        iteration++;
      }

      // Handle invalid results
      const maxHeight =
        state.trajectory.length > 0
          ? Math.max(...state.trajectory.map((p) => p.y))
          : 0;

      resolve({
        distance: isNaN(state.position.x) ? 0 : state.position.x.toFixed(2),
        maxHeight: maxHeight.toFixed(2),
        airTime: airTime.toFixed(2),
        trajectory: state.trajectory,
      });
    });
  }

  useEffect(() => {
    if (inFlight) {
      if (position.y > maxHeight.current) {
        maxHeight.current = position.y;
      }
      if (position.y < 0.5 && maxHeight.current > 1) {
        console.log(trajectory);
        setOldTrajectories((prev) => [
          ...prev,
          { points: trajectory, color: trajectoryColor },
        ]);
        setInFlight(false);
        const airTime = (Date.now() - startTime.current) / 1000;
        const newTrial = {
          params: activeParams,
          results: {
            distance: position.x,
            maxHeight: maxHeight.current,
            airTime: airTime,
          },
        };
        setTrials((prev) => [...prev, newTrial]);
      }
    }
  }, [position, inFlight, activeParams, trials]);

  function getRandomColor() {
    // Hue: any, Saturation: 70-100%, Lightness: 35-50% (avoids pastels/white)
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 30) + 70; // 70-100%
    const lightness = Math.floor(Math.random() * 15) + 35;  // 35-50%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  const reset = (params) => {
    boxRef.current.resetForces(true);
    boxRef.current.resetTorques(true);
    boxRef.current.setTranslation({ x: 0, y: 6, z: 0 }, true); // Initial height = 5 units
    boxRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    boxRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    boxRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    setOldTrajectories((prev) => [
          ...prev,
          { points: trajectory, color: trajectoryColor },
        ]);
  };

  const launchProjectile = (params) => {
    if (boxRef.current) {
      setTrajectoryColor(getRandomColor());

      // 1. Full physics reset
      boxRef.current.resetForces(true);
      boxRef.current.resetTorques(true);
      boxRef.current.setTranslation({ x: 0, y: 6, z: 0 }, true); // Initial height = 5 units
      boxRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      boxRef.current.setAngvel({ x: 0, y: 0, z: params.spin }, true);
      boxRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);

      // 2. Apply initial velocity
      const angleRad = params.angle * (Math.PI / 180);
      const vx = params.launchVelocity * Math.cos(angleRad);
      const vy = params.launchVelocity * Math.sin(angleRad);
      boxRef.current.setLinvel({ x: vx, y: vy, z: 0 }, true);

      // 3. Reset tracking
      maxHeight.current = 0;
      startTime.current = Date.now();
      setInFlight(true);
      setActiveParams(params);
      setTrajectory([]); // Reset trajectory
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative"}}>
      {/* PhysicsScene contains Canvas and Physics */}
      <PhysicsScene
        boxRef={boxRef}
        setVelocity={setVelocity}
        setPosition={setPosition}
        params={activeParams}
        setShowDataPage={showDataPage}
        trajectory={trajectory}
        setTrajectory={setTrajectory}
        trajectoryColor={trajectoryColor}
        oldTrajectories={oldTrajectories}
        showTrajectories={showTrajectories}
      />

      {/* UI Controls */}
      <nav style={{ position: "absolute", top: 20, left: 20, zIndex: 1000 }} >
        <Button
          colorScheme="blue"
          onClick={() => setShowDataPage(true)}
          borderRadius="md"
        >
          Analyze Data
        </Button>
        
      </nav>

      {/* Simulation UI */}
      {!showDataPage && (
        <>
          <ProjectileInfoPanel
            velocity={velocity}
            position={position}
            mass={activeParams.mass}
          />
          
          <UIControls
            activeParams={activeParams}
            setActiveParams={setActiveParams}
            onLaunch={launchProjectile}
            reset={reset}
            setShowTrajectories={setShowTrajectories}
            showTrajectories={showTrajectories}
          />
          <div
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              background: "rgba(255,255,255,0.85)",
              borderRadius: "8px",
              padding: "10px 16px",
              fontSize: "14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              zIndex: 2000,
              pointerEvents: "none",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", marginBottom: 4 }}
            >
              
              Force Arrow Legend
            </div>
            <div
              style={{ display: "flex", alignItems: "center", marginBottom: 4 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 6,
                  background: "#ff0000",
                  borderRadius: 2,
                  marginRight: 8,
                }}
              />
              Drag Force
            </div>
            <div
              style={{ display: "flex", alignItems: "center", marginBottom: 4 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 6,
                  background: "#0000ff",
                  borderRadius: 2,
                  marginRight: 8,
                }}
              />
              Magnus Force
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 6,
                  background: "#00ff00",
                  borderRadius: 2,
                  marginRight: 8,
                }}
              />
              Gravity
            </div>
          </div>
        </>
      )}

      {/* DataPage Overlay */}
      {showDataPage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255,255,255)",
            zIndex: 1000,
            overflow: "auto",
          }}
        >
          <DataPage
            trials={trials}
            setTrials={setTrials}
            runBatchSimulations={runBatchSimulations}
            isRunningBatch={isRunningBatch}
            batchSize={batchSize}
            batchProgress={batchProgress}
            setShowDataPage={setShowDataPage}
          />
        </div>
      )}
    </div>
  );
}
