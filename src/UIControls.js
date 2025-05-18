import { useState } from 'react'
import {
  Button,
  HStack,
  VStack,
  Text,
  Slider,
  NumberInput
} from "@chakra-ui/react"

export default function UIControls({ activeParams, setActiveParams, onLaunch, reset }) {
  return (
    <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000 }}>
      <VStack align="start" spacing={4} bg="whiteAlpha.800" p={4} borderRadius="md">
        
        {/* Velocity Control */}
        <div>
          <Text mb={2}>Velocity: {activeParams.launchVelocity} m/s</Text>
          <Slider.Root
            min={1}
            max={50}
            value={[activeParams.launchVelocity]}
            onValueChange={(val) => setActiveParams(p => ({...p, launchVelocity: val.value.length > 0 ? val.value[0] : 0}))}
            width="200px"
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </div>

        {/* Angle Control */}
        <div>
          <Text mb={2}>Angle: {activeParams.angle}°</Text>
          <Slider.Root
            min={0}
            max={90}
            value={[activeParams.angle]}
            onValueChange={(val) => setActiveParams(p => ({...p, angle: val.value.length > 0 ? val.value[0] : 0}))}
            width="200px"
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </div>

        {/* Mass Control */}
        <div>
          <Text mb={2}>Mass: {activeParams.mass} kg</Text>
          <NumberInput.Root
            value={activeParams.mass}
            onValueChange={details => setActiveParams(p => ({...p, mass: details.valueAsNumber}))}
            min={0.1}
            max={100}
            step={0.1}
          >
            <HStack>
              <NumberInput.Control>
                <NumberInput.Input width="80px" />
              </NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </HStack>
          </NumberInput.Root>
        </div>

        {/* Drag Coefficient Control */}
        <div>
          <Text mb={2}>Drag Coefficient: {activeParams.drag}</Text>
          <Slider.Root
            min={0}
            max={2}
            value={[activeParams.drag]}
            onValueChange={(val) => setActiveParams(p => ({...p, drag: val.value.length > 0 ? val.value[0] : 0}))}
            width="200px"
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </div>

        {/* Air Density Control */}
        <div>
          <Text mb={2}>Air Density: {activeParams.airDensity} kg/m³</Text>
          <Slider.Root
            min={0}
            max={2}
            value={[activeParams.airDensity]}
            onValueChange={(val) => setActiveParams(p => ({...p, airDensity: val.value.length > 0 ? val.value[0] : 0}))}
            width="200px"
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </div>

        {/* Gravity Control */}
        <div>
          <Text mb={2}>Gravity: {activeParams.gravity} m/s²</Text>
          <Slider.Root
            min={0}
            max={25}
            value={[activeParams.gravity]}
            onValueChange={(val) => setActiveParams(p => ({...p, gravity: val.value.length > 0 ? val.value[0] : 0}))}
            width="200px"
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </div>

        {/* Restitution Control */}
        <div>
          <Text mb={2}>Bounciness: {activeParams.restitution }</Text>
          <Slider.Root
            min={0}
            max={1}
            step={0.01}
            value={[activeParams.restitution]}
            onValueChange={(val) => setActiveParams(p => ({...p, restitution: val.value.length > 0 ? val.value[0] : 0}))}
            width="200px"
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </div>

        {/* Spin Control */}
        <div>
          <Text mb={2}>Spin: {activeParams.spin } Rad/s</Text>
          <Slider.Root
            min={-20}
            max={20}
            step={0.01}
            value={[activeParams.spin]}
            onValueChange={(val) => setActiveParams(p => ({...p, spin: val.value.length > 0 ? val.value[0] : 0}))}
            width="200px"
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Control>
          </Slider.Root>
        </div>

        

        <Button 
          onClick={() => onLaunch(activeParams)} 
          colorScheme="blue" 
          width="100%"
        >
          Apply & Launch
        </Button>
        <Button 
          onClick={() => reset(activeParams)} 
          colorScheme="blue" 
          width="100%"
        >
          Reset
        </Button>
      </VStack>
    </div>
  )
}
