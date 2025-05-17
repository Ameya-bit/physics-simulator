import { useState, useRef, useEffect } from "react"
import PhysicsScene from "./physicsscene"
import UIControls from "./UIControls"
import ProjectileInfoPanel from "./ProjectileInfoPanel"
import EnergyBar from "./EnergyBar"

export default function App() {
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 })
  const [activeParams, setActiveParams] = useState({
    mass: 1,
    angle: 45,
    launchVelocity: 15,
    drag: 0.47,
    airDensity: 1.225,
    gravity: 9.81,
    restitution: 0.5,
    spin: 0
  })
  const [trials, setTrials] = useState([])
  const [inFlight, setInFlight] = useState(false)
  const maxHeight = useRef(0)
  const startTime = useRef(0)
  const boxRef = useRef(null)

  useEffect(() => {
    if (inFlight) {
      // Update max height
      if (position.y > maxHeight.current) {
        maxHeight.current = position.y
      }
      
      // Check for landing
      if (position.y < 0.5) {
        setInFlight(false)
        const airTime = (Date.now() - startTime.current) / 1000
        const newTrial = {
          params: activeParams,
          results: {
            distance: position.x.toFixed(2),
            maxHeight: maxHeight.current.toFixed(2),
            airTime: airTime.toFixed(2)
          }
        }
        setTrials(prev => [...prev.slice(-9), newTrial])
      }
    }
  }, [position, inFlight, activeParams])

  const launchProjectile = (params) => {
    if (boxRef.current) {
      // Reset tracking variables
      maxHeight.current = 0
      startTime.current = Date.now()
      setInFlight(true)

      // Physics reset
      boxRef.current.resetForces(true)
      boxRef.current.resetTorques(true)
      boxRef.current.setTranslation({ x: 0, y: 5, z: 0 }, true)
      boxRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      boxRef.current.setAngvel({ x: 0, y: 0, z: params.spin }, true)
      
      // Apply initial velocity
      const angleRad = params.angle * (Math.PI / 180)
      const vx = params.launchVelocity * Math.cos(angleRad)
      const vy = params.launchVelocity * Math.sin(angleRad)
      boxRef.current.setLinvel({ x: vx, y: vy, z: 0 }, true)

      // Update active params
      setActiveParams(params)
    }
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <PhysicsScene 
        boxRef={boxRef}
        setVelocity={setVelocity}
        setPosition={setPosition}
        params={activeParams}
      />
      
      <ProjectileInfoPanel 
        velocity={velocity} 
        position={position} 
        mass={activeParams.mass}
      />
      <EnergyBar velocity={velocity} position={position} mass={activeParams.mass} />
      
      <UIControls
        activeParams={activeParams}
        setActiveParams={setActiveParams}
        onLaunch={launchProjectile}
        trials={trials}
      />
    </div>
  )
}
