import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { OrbitControls, Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { useGLTF } from "@react-three/drei";

function DuckProjectile(props) {
  const { scene } = useGLTF("/models/duck.glb");
  return <primitive object={scene} scale={0.7} {...props} />;
}

function CubeProjectile() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#2f74c0" />
    </mesh>
  );
}

function CameraController({ boxRef }) {
  const controls = useRef();
  const { camera } = useThree();

  useFrame(() => {
    if (boxRef.current && controls.current) {
      const pos = boxRef.current.translation();
      controls.current.target.lerp(pos, 0.2);
      controls.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxPolarAngle={Math.PI / 2 - 0.1}
    />
  );
}

function DistanceMarkers({ setShowDataPage }) {
  if (setShowDataPage) return null;

  const markers = [];
  for (let x = -1000; x <= 1000; x += 10) {
    markers.push(
      <group key={x}>
        <Line
          points={[
            [x, 0.01, -1.5],
            [x, 0.01, 1.5],
          ]}
          color="rgba(255,255,255,0.7)"
          lineWidth={1}
        />
        {x !== 0 && (
          <Html
            position={[x, 0.1, 3.5]}
            center
            style={{
              pointerEvents: "none",
              // Force the label behind other UI
              zIndex: -1,
              // Add position relative to allow zIndex
              position: "relative",
            }}
            zIndexRange={[0, 1]}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.6)",
                padding: "2px 4px",
                borderRadius: 3,
                fontSize: 10,
                color: "#fff",
                transform: "translateX(-50%)",
                isolation: "isolate",
              }}
            >
              {Math.abs(x)}m
            </div>
          </Html>
        )}
      </group>
    );
  }
  return <>{markers}</>;
}

function ForceVectors({ boxRef, params }) {
  const dragArrow = useRef();
  const magnusArrow = useRef();

  useFrame(() => {
    if (boxRef.current) {
      const vel = boxRef.current.linvel();
      const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2);

      // Handle zero velocity case
      const hasVelocity = speed > 0.01;

      // Drag force calculations
      const dragDirection = new THREE.Vector3();
      if (hasVelocity) {
        dragDirection.copy(vel).multiplyScalar(-1).normalize();
      }

      // Magnus force calculations
      const magnusDirection = new THREE.Vector3();
      if (hasVelocity) {
        magnusDirection.set(-vel.y, vel.x, 0).normalize();
        if (params.spin < 0) magnusDirection.multiplyScalar(-1);
      }

      // Force magnitudes
      const dragForce = hasVelocity 
        ? 0.5 * params.airDensity * params.drag * speed ** 2 
        : 0;
      const magnusForce = hasVelocity 
        ? 0.0005 * params.airDensity * Math.abs(params.spin) * speed 
        : 0;

      // Arrow lengths with dynamic scaling
      const dragLength = Math.max(dragForce * 0.05, 0.5);
      const magnusLength = Math.max(magnusForce * 0.5, 0.5);

      // Update arrows
      [dragArrow, magnusArrow].forEach((arrowRef, i) => {
        if (!arrowRef.current) return;
        const dir = i === 0 ? dragDirection : magnusDirection;
        const length = i === 0 ? dragLength : magnusLength;
        const color = i === 0 ? '#ff1744' : '#2979ff';
        
        arrowRef.current.position.copy(dir.clone().multiplyScalar(0.6));
        arrowRef.current.setDirection(dir);
        arrowRef.current.setLength(length, 0.5, 0.25);
        arrowRef.current.setColor(new THREE.Color(color));
      });

      // Gravity arrow (always down)
      
    }
  });

  return (
    <group>
      <arrowHelper ref={dragArrow} />
      <arrowHelper ref={magnusArrow} />
    </group>
  );
}

function GravityVector({ boxRef, params }) {
  const arrowRef = useRef();

  useFrame(() => {
    if (boxRef.current && arrowRef.current) {
      const pos = boxRef.current.translation();
      const gravityForce = params.mass * params.gravity;
      const gravityLength = Math.max(gravityForce * 0.01, 0.5);

      // Position arrow at projectile base (world space)
      arrowRef.current.position.set(pos.x, pos.y - 0.6, pos.z);
      arrowRef.current.setLength(gravityLength, 0.3, 0.15);
      arrowRef.current.setDirection(new THREE.Vector3(0, -1, 0));
      arrowRef.current.setColor(new THREE.Color("#00e676"));
    }
  });

  return (
    <arrowHelper
      ref={arrowRef}
      dir={new THREE.Vector3(0, -1, 0)}
      color="#00e676"
    />
  );
}

function BlockWithOverlay({
  boxRef,
  params,
  setVelocity,
  setPosition,
  setTrajectory
}) {
  
  const force = useRef(new THREE.Vector3());

  useFrame(() => {
    if (boxRef.current) {
      
    
      const rigidBody = boxRef.current;
      const vel = rigidBody.linvel();
      const pos = rigidBody.translation();

      setTrajectory(prev => [...prev, [pos.x, pos.y, pos.z]]);

      // Update state
      setVelocity(vel);
      setPosition(pos);

      // Calculate speed and direction
      const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2);
      const direction = new THREE.Vector3(vel.x, vel.y, 0).normalize();

      // AIR RESISTANCE (F = ma → a = F/m)
      if (speed > 1) {
        const dragForce = 0.5 * params.airDensity * params.drag * speed ** 2;
        const dragAcceleration = dragForce / params.mass; // ← Critical fix
        force.current.copy(direction).multiplyScalar(-dragAcceleration);
        rigidBody.resetForces(true);
        rigidBody.addForce(force.current, true);
      }

      // MAGNUS EFFECT (F = ma → a = F/m)
      if (Math.abs(params.spin) > 0.1 && speed > 0.1) {
        const magnusForce = 0.0001 * params.airDensity * params.spin * speed;
        const magnusAcceleration = magnusForce / params.mass; // ← Critical fix
        rigidBody.addForce(
          {
            x: -vel.y * magnusAcceleration,
            y: vel.x * magnusAcceleration,
            z: 0,
          },
          true
        );
      }
    }
  }, 0); // Run BEFORE physics updates

  
    return (
      <group>
        <CubeProjectile />
        <ForceVectors boxRef={boxRef} params={params} />
      </group>
    );
  
}

export default function PhysicsScene({
  boxRef,
  setVelocity,
  setPosition,
  params,
  setShowDataPage,
  trajectory,
  setTrajectory,
  trajectoryColor,
  oldTrajectories, 
  showTrajectories
}) {

  


  

  return (
    
      <Canvas camera={{ position: [30, 30, 30], fov: 45 }} zIndex={-1}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />

        <Physics key={params.gravity} gravity={[0, -params.gravity, 0]}>
          <RigidBody
            ref={boxRef}
            colliders="hull"
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
              setTrajectory={setTrajectory}
            />
            
          </RigidBody>
          
          {showTrajectories &&  (
            <>
              {oldTrajectories.map((oldTrajectory, index) => (
            <Line
              key={index}
              points={oldTrajectory.points}
              color={oldTrajectory.color}
              lineWidth={2}
              raycast={null}
              dashed={false}
            />
          ))}

          {trajectory.length > 1 && (
              <Line
                points={trajectory}
                color={trajectoryColor}
                lineWidth={2}
                raycast={null}
                dashed={false}
              />
            )}
            </>
          )}
          <GravityVector boxRef={boxRef} params={params} />

          <RigidBody type="fixed" position={[0, -1, 0]}>
            <CuboidCollider
              args={[10000, 1, 10000]}
              restitution={params.restitution}
            />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[10000, 10000]} />
              <meshStandardMaterial color="#c7d2fe" />
            </mesh>
            <DistanceMarkers setShowDataPage={setShowDataPage} zIndex={-1} />
          </RigidBody>
        </Physics>
        <CameraController boxRef={boxRef} />
      </Canvas>
   
  );
}

export { DistanceMarkers, CameraController };
