// CustomTooltip.js
export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  
  const trialData = payload[0].payload;
  const isLineChart = payload.some(item => item.dataKey === 'theoretical');

  return (
    <div style={{
      background: "white",
      border: "1px solid #ccc",
      borderRadius: 8,
      padding: 10,
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      minWidth: 160
    }}>
      <strong>{label}</strong>
      {isLineChart && (
        <>
          <div style={{ color: '#3182CE' }}>
            Actual: <b>{trialData.distance} m</b>
          </div>
          <div style={{ color: '#38A169' }}>
            Theoretical: <b>{trialData.theoretical} m</b>
          </div>
        </>
      )}
      {!isLineChart && (
        <>
          <div>Distance: <b>{trialData.distance} m</b></div>
          <div>Max Height: <b>{trialData.height} m</b></div>
        </>
      )}
      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        {`Velocity: ${trialData.velocity} m/s, Angle: ${trialData.angle}°`}
      </div>
    </div>
  );
}
