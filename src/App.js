import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import PhysicsScene from "./physicsscene";
import UIControls from "./UIControls";
import ProjectileInfoPanel from "./ProjectileInfoPanel";
import EnergyBar from "./EnergyBar";
import DataPage from "./DataPage";
import { Html } from "@react-three/drei"

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
    spin: 0
  });
  const [trials, setTrials] = useState([]);
  const [inFlight, setInFlight] = useState(false);
  const maxHeight = useRef(0);
  const startTime = useRef(0);
  const boxRef = useRef(null);

  useEffect(() => {
    if (inFlight) {
      console.log(maxHeight.current)
      if (position.y > maxHeight.current) {
        maxHeight.current = position.y;
        
      }
      if (position.y < 0.5 && maxHeight.current > 1) {
        setInFlight(false);
        const airTime = (Date.now() - startTime.current) / 1000;
        const newTrial = {
          params: activeParams,
          results: {
            distance: position.x,
            maxHeight: maxHeight.current,
            airTime: airTime
          }
        };
        console.log("New Trial:", newTrial);
        setTrials(prev => [...prev.slice(-9), newTrial]);
      }
    }
  }, [position, inFlight, activeParams, trials]);

  const reset = (params) => {
    boxRef.current.resetForces(true);
    boxRef.current.resetTorques(true);
    boxRef.current.setTranslation({ x: 0, y: 6, z: 0 }, true); // Initial height = 5 units
    boxRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    boxRef.current.setAngvel({ x: 0, y: 0, z: params.spin }, true);
  }

  const launchProjectile = (params) => {
  if (boxRef.current) {
    // 1. Full physics reset
    boxRef.current.resetForces(true);
    boxRef.current.resetTorques(true);
    boxRef.current.setTranslation({ x: 0, y: 6, z: 0 }, true); // Initial height = 5 units
    boxRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    boxRef.current.setAngvel({ x: 0, y: 0, z: params.spin }, true);

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
  }
};

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* PhysicsScene contains Canvas and Physics */}
      <PhysicsScene
        boxRef={boxRef}
        setVelocity={setVelocity}
        setPosition={setPosition}
        params={activeParams}
        setShowDataPage={showDataPage}
      />

      {/* UI Controls */}
      <nav style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}>
        
        <button onClick={() => setShowDataPage(true)}>
          Data Analysis
        </button>
      </nav>

      {/* Simulation UI */}
      {!showDataPage && (
        <>
          <ProjectileInfoPanel
            velocity={velocity}
            position={position}
            mass={activeParams.mass}
          />
          <EnergyBar
            velocity={velocity}
            position={position}
            mass={activeParams.mass}
          />
          <UIControls
            activeParams={activeParams}
            setActiveParams={setActiveParams}
            onLaunch={launchProjectile}
            reset={reset}
          />
        </>
      )}

      {/* DataPage Overlay */}
      {showDataPage && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(255,255,255)",
          zIndex: 1000,
          overflow: "auto"
        }}>
          <nav style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}>
            <button 
              onClick={() => setShowDataPage(false)} 
              style={{ marginRight: 10 }}
            >
              Simulation
            </button>
          </nav>
          
          <DataPage trials={trials} />
        </div>
      )}
    </div>
  );
}
