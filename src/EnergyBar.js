export default function EnergyBar({ velocity = {x:0,y:0,z:0}, position = {x:0,y:0,z:0}, mass = 1 }) {
const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2)
  const kinetic = 0.5 * mass * speed ** 2
  const potential = mass * 9.81 * position.y
  const total = kinetic + potential

  // Avoid division by zero
  const kePercent = total > 0 ? (kinetic / total) * 100 : 0
  const pePercent = total > 0 ? (potential / total) * 100 : 0

  return (
    <div style={{
      width: 220,
      bottom: 20,
      right: 20,
      margin: '16px 0 0 0',
      background: '#eee',
      borderRadius: 6,
      overflow: 'hidden',
      height: 28,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      display: 'flex',
      flexDirection: 'row'
    }}>
      <div style={{
        width: `${kePercent}%`,
        background: '#3b82f6',
        transition: 'width 0.2s',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold'
      }}>
        {kinetic > 1 ? `KE: ${kinetic.toFixed(1)} J` : ''}
      </div>
      <div style={{
        width: `${pePercent}%`,
        background: '#f59e42',
        transition: 'width 0.2s',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold'
      }}>
        {potential > 1 ? `PE: ${potential.toFixed(1)} J` : ''}
      </div>
    </div>
  )
}
