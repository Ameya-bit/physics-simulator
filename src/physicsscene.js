import { Canvas } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { OrbitControls, Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'

function CameraController({ boxRef }) {
  const controls = useRef()
  const { camera } = useThree()

  useFrame(() => {
    if (boxRef.current && controls.current) {
      const pos = boxRef.current.translation()
      controls.current.target.lerp(pos, 0.2)
      controls.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controls}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxPolarAngle={Math.PI/2 - 0.1}
    />
  )
}

function DistanceMarkers() {
  const markers = []
  for (let x = -500; x <= 500; x += 10) {
    markers.push(
      <group key={x}>
        <Line
          points={[
            [x, 0.01, -1.5],
            [x, 0.01, 1.5]
          ]}
          color="rgba(255,255,255,0.7)"
          lineWidth={1}
        />
        {x !== 0 && (
          <Html 
            position={[x, 0.1, 3.5]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              background: 'rgba(0,0,0,0.6)',
              padding: '2px 4px',
              borderRadius: 3,
              fontSize: 10,
              color: '#fff',
              transform: 'translateX(-50%)'
            }}>
              {Math.abs(x)}m
            </div>
          </Html>
        )}
      </group>
    )
  }
  return <>{markers}</>
}

function BlockWithOverlay({ boxRef, params, setVelocity, setPosition }) {
  const force = useRef(new THREE.Vector3());
  
  useFrame(() => {
    if (boxRef.current) {
      const rigidBody = boxRef.current;
      const vel = rigidBody.linvel();
      const angVel = rigidBody.angvel(); // Get ACTUAL angular velocity
      const pos = rigidBody.translation();
      
      // Update state
      setVelocity(vel);
      setPosition(pos);

      // Calculate speed and direction
      const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2);
      const direction = new THREE.Vector3(vel.x, vel.y, 0).normalize();

    //   // Air resistance (F_d = ½ρv²C_dA)
      if (speed > 1) {
        const dragForce = 0.5 * params.airDensity * params.drag * speed ** 2;
        force.current.copy(direction).multiplyScalar(-dragForce);
        rigidBody.resetForces(true);
        rigidBody.addForce(force.current, true);
      }

      // Magnus effect (F = ρ * (ω × v) * C * A)
      if (Math.abs(params.spin) > 0.1 && speed > 0.1) {
        const magnusForce = 0.0005 * params.airDensity * params.spin * speed
        rigidBody.addForce({
          x: -vel.y * magnusForce, // Curves right for positive spin
          y: vel.x * magnusForce,  // Curves up/down depending on velocity
          z: 0
        }, true)
      }

      
    }
  }, 0); // Run BEFORE physics updates

  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#2f74c0" />
    </mesh>
  );
}

export default function PhysicsScene({ boxRef, setVelocity, setPosition, params }) {
  return (
    <Canvas camera={{ position: [30, 30, 30], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      
      <Physics key={params.gravity} gravity={[0, -params.gravity, 0]}>
        <RigidBody
          ref={boxRef}
          colliders="cuboid"
          restitution={params.restitution}
          position={[0, 0, 0]}
          mass={params.mass}
          angularDamping={0.8}
          canSleep={false}
        >
          <BlockWithOverlay 
            boxRef={boxRef}
            params={params}
            setVelocity={setVelocity}
            setPosition={setPosition}
          />
        
        </RigidBody>

        <RigidBody type="fixed" position={[0, -1, 0]}>
          <CuboidCollider args={[100, 0, 100]} restitution={params.restitution} />
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[1000, 1000]} />
            <meshStandardMaterial color="#ddd" />
          </mesh>
          <DistanceMarkers />
        </RigidBody>
        
      </Physics>
      <CameraController boxRef={boxRef} />
    </Canvas>
  )
}
