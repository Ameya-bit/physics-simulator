export default function ProjectileInfoPanel({
  velocity = { x: 0, y: 0, z: 0 },
  position = { x: 0, y: 0, z: 0 },
  mass = 1,
}) {
  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
  const kinetic = 0.5 * mass * speed ** 2;
  const potential = mass * 9.81 * position.y;
  const total = kinetic + potential;

  const kePercent = total > 0 ? (kinetic / total) * 100 : 0;
  const pePercent = total > 0 ? (potential / total) * 100 : 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        background: "rgba(255,255,255, 0.95)",
        padding: "20px",
        borderRadius: 25,
        minWidth: 270,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 1000,
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", color: "#222" }}>Projectile Data</h3>

      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Horizontal Velocity:</span>
          <span>{velocity.x.toFixed(2)} m/s</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Vertical Velocity:</span>
          <span>{velocity.y.toFixed(2)} m/s</span>
        </div>
      </div>

      <div style={{ margin: "12px 0", borderTop: "1px solid #eee" }} />

      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Height:</span>
          <span>{position.y.toFixed(2)} m</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Distance:</span>
          <span>{position.x.toFixed(2)} m</span>
        </div>
      </div>

      <div style={{ margin: "12px 0", borderTop: "1px solid #eee" }} />

      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Kinetic Energy:</span>
          <span>{kinetic.toFixed(2)} J</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Potential Energy:</span>
          <span>{potential.toFixed(2)} J</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <span>
            <strong>Total Energy:</strong>
          </span>
          <span>
            <strong>{total.toFixed(2)} J</strong>
          </span>
        </div>
      </div>
      <div
        style={{
          width: 220,
          bottom: 20,
          right: 20,
          margin: "16px 0 0 0",
          background: "#eee",
          borderRadius: 6,
          overflow: "hidden",
          height: 28,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            width: `${kePercent}%`,
            background: "#3b82f6",
            transition: "width 0.2s",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}
        >
          {kinetic > 1 ? `KE: ${kinetic.toFixed(1)} J` : ""}
        </div>
        <div
          style={{
            width: `${pePercent}%`,
            background: "#f59e42",
            transition: "width 0.2s",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}
        >
          {potential > 1 ? `PE: ${potential.toFixed(1)} J` : ""}
        </div>
      </div>
    </div>
  );
}

<div
  style={{
    // ... other styles
    zIndex: 1000, // Higher than default
  }}
></div>;
