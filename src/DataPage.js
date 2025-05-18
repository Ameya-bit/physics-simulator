import {
  Container,
  VStack,
  Heading,
  Button,
  Box,
  Table,
  Text,
  Portal,
  createListCollection,
  Drawer,
  CloseButton,
  HStack,
  Pagination,
  ButtonGroup,
  IconButton,
  Select, 
  
} from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import {DistanceMarkers, CameraController} from "./physicsscene";
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CustomTooltip } from "./CustomToolTip";
import { useState, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import Papa from "papaparse";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function getNestedValue(obj, path) {
  return path.split(".").reduce((o, p) => (o ? o[p] : undefined), obj);
}

function calculateTheoreticalDistance(params) {
  const { launchVelocity, angle, gravity } = params;
  const angleRad = angle * (Math.PI / 180);
  return (launchVelocity ** 2 * Math.sin(2 * angleRad)) / gravity;
}

function downloadCSV(trials) {
  const header = "Velocity,Angle,Spin,Distance,Max Height,Air Time,Theoretical Distance,Trajectory\n";
  const rows = trials.map((trial) => [
    trial.params.launchVelocity || 0,
    trial.params.angle || 0,
    trial.params.spin || 0,
    trial.results?.distance ?? 0,
    trial.results?.maxHeight ?? 0,
    trial.results?.airTime ?? 0,
    calculateTheoreticalDistance(trial.params) ?? 0,
    // Serialize trajectory as a JSON string, and wrap in quotes for CSV safety
    `"${JSON.stringify(trial.results?.trajectory ?? [])}"`
  ]);

  const csv = header + rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "projectile_trials.csv";
  link.click();
}

function handleCSVUpload(event, setTrials) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    try {
      const importedTrials = results.data.map((row, i) => {
        const trajectory = JSON.parse(row.Trajectory || "[]");
        
        return {
          id: `imported-${Date.now()}-${i}`,
          params: {
            launchVelocity: parseFloat(row.Velocity) || 0,
            angle: parseFloat(row.Angle) || 0,
            spin: parseFloat(row.Spin) || 0,
          },
          results: {
            distance: parseFloat(row.Distance) || 0,
            maxHeight: parseFloat(row["Max Height"]) || 0,
            airTime: parseFloat(row["Air Time"]) || 0,
            theoreticalDistance: parseFloat(row["Theoretical Distance"]) || 0,
            trajectory,
          }
        };
      }).filter(trial => !isNaN(trial.params.launchVelocity));

      setTrials(prev => [...prev, ...importedTrials]);
    } catch (error) {
      console.error("Error parsing CSV file:", error);
      alert(error.message); // Or your preferred error UI
    }
  }
});

// Reset file input so same file can be uploaded again if needed
event.target.value = "";
}

const paramCollection = createListCollection({
  items: [
    { label: "Launch Velocity (m/s)", value: "params.launchVelocity" },
    { label: "Launch Angle (°)", value: "params.angle" },
    { label: "Spin (rad/s)", value: "params.spin" },
    { label: "Distance (m)", value: "results.distance" },
    { label: "Max Height (m)", value: "results.maxHeight" },
    { label: "Air Time (s)", value: "results.airTime" },
  ],
});

function binTrials(trials, xParam, yParam, zParam, xBins = 10, yBins = 10) {
  // Get min/max for axis scaling
  const xVals = trials.map(t => getNestedValue(t, xParam));
  const yVals = trials.map(t => getNestedValue(t, yParam));
  const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals);

  // Bin data
  const bins = Array.from({ length: xBins }, () =>
    Array.from({ length: yBins }, () => [])
  );

  trials.forEach(trial => {
    const x = getNestedValue(trial, xParam);
    const y = getNestedValue(trial, yParam);
    const z = getNestedValue(trial, zParam);

    const xi = Math.min(
      xBins - 1,
      Math.floor(((x - xMin) / (xMax - xMin || 1)) * xBins)
    );
    const yi = Math.min(
      yBins - 1,
      Math.floor(((y - yMin) / (yMax - yMin || 1)) * yBins)
    );

    bins[xi][yi].push(z);
  });

  // Average z for each bin
  const heatmapData = [];
  for (let xi = 0; xi < xBins; xi++) {
    for (let yi = 0; yi < yBins; yi++) {
      const zVals = bins[xi][yi];
      const avgZ = zVals.length
        ? zVals.reduce((a, b) => a + b, 0) / zVals.length
        : null;
      heatmapData.push({
        x: xMin + ((xMax - xMin) * xi) / (xBins - 1),
        y: yMin + ((yMax - yMin) * yi) / (yBins - 1),
        z: avgZ,
      });
    }
  }
  return heatmapData;
}


const renderSelect = (label, value, onChange) => (
    <Select.Root
      collection={paramCollection}
      value={[value]}
      onValueChange={({ value }) => onChange(value[0])}
      size="sm"
      width="100%"
    >
      <Select.HiddenSelect />
      <Select.Label>{label}</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder={`Select ${label}`} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {paramCollection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                {item.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );

export default function DataPage({
  trials,
  setTrials,
  runBatchSimulations,
  isRunningBatch,
  batchProgress,
  batchSize,
  setShowDataPage,
}) { 
  const fileInputRef = useRef();
  const [selectedX, setSelectedX] = useState("params.angle");
  const [selectedY, setSelectedY] = useState("results.distance");
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [chartKey, setChartKey] = useState(0);
  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  const totalPages = useMemo(
    () => Math.ceil(trials.length / ROWS_PER_PAGE),
    [trials.length]
  );

  const heatmapData = binTrials(trials, selectedX, selectedY, "results.distance", 12, 12);


  const paginatedTrials = useMemo(
    () => trials.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [trials, page]
  );

  const chartData = useMemo(
    () =>
      trials.map((trial, i) => ({
        x: getNestedValue(trial, selectedX),
        y: getNestedValue(trial, selectedY),
        name: `Trial ${i + 1}`,
        distance: parseFloat(trial.results.distance),
        theoretical: calculateTheoreticalDistance(trial.params),
        height: parseFloat(trial.results.maxHeight),
        airTime: parseFloat(trial.results.airTime),
        velocity: trial.params.launchVelocity,
        angle: trial.params.angle,
        spin: trial.params.spin,
        drag: trial.params.drag,
        airDensity: trial.params.airDensity,
      })),
    [trials, selectedX, selectedY]
  );

  useEffect(() => {
    if (!selectedTrial || !playing) return;
    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        return next >= selectedTrial.results.trajectory.length ? 0 : next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [playing, 1, selectedTrial]);

  

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={18} align="stretch">
        <Heading size="lg">Projectile Motion Data Randomizer</Heading>
        
        <HStack spacing={4} justify="flex-end">
          <Button colorScheme="blue" onClick={() => setShowDataPage(false)}>
            Resume Simulation
          </Button>
          
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={event => handleCSVUpload(event, setTrials)}
          />

          <Button
            colorScheme="purple"
            onClick={runBatchSimulations}
            isLoading={isRunningBatch}
            loadingText={`Running ${batchSize} trials... (${batchProgress.toFixed(1)}%)`}
          >
            Randomize {batchSize} Simulations
          </Button>
        </HStack>

        <Box bg="white" p={4} borderRadius="md" boxShadow="md">
          
          <Heading size="md" mb={4}>Full Data Table</Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Projectile motion data for each trial. Click a row to replay the trial.
          </Text>
          <Box spacing={10} align="stretch">
            <HStack spacing={4} mb={4} justify="self-end">
              <Button colorScheme="blue" onClick={() => downloadCSV(trials)}>
                Download CSV
              </Button>
              <Button
                colorScheme="teal"
                onClick={() => fileInputRef.current.click()}
              >
                Upload CSV
              </Button>
            </HStack>
          </Box>
          <Table.Root size="sm" variant="outline" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Velocity</Table.ColumnHeader>
                <Table.ColumnHeader>Angle</Table.ColumnHeader>
                <Table.ColumnHeader>Spin</Table.ColumnHeader>
                <Table.ColumnHeader>Distance</Table.ColumnHeader>
                <Table.ColumnHeader>Max Height</Table.ColumnHeader>
                <Table.ColumnHeader>Air Time</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {paginatedTrials.map((trial, i) => (
                
                <Table.Row
                  key={`${trial.id}-${i}`}
                  onClick={() => {
                    setSelectedTrial(trial);
                    setCurrentFrame(0);
                    setPlaying(true);
                    setDrawerOpen(true);
                  }}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                >
                  <Table.Cell>{trial.params.launchVelocity}</Table.Cell>
                  <Table.Cell>{trial.params.angle}</Table.Cell>
                  <Table.Cell>{trial.params.spin}</Table.Cell>
                  <Table.Cell>{trial.results.distance}</Table.Cell>
                  <Table.Cell>{trial.results.maxHeight}</Table.Cell>
                  <Table.Cell>{trial.results.airTime}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          <Pagination.Root
            count={trials.length}
            pageSize={ROWS_PER_PAGE}
            page={page}
            onChange={setPage}
            mt={4}
          >
            <ButtonGroup variant="ghost" size="sm">
              <Pagination.PrevTrigger asChild>
                <IconButton
                  aria-label="Previous page"
                  isDisabled={page === 1}
                >
                  <LuChevronLeft />
                </IconButton>
              </Pagination.PrevTrigger>
              <Pagination.Items
                render={(pageNum) => (
                  <IconButton
                    key={pageNum.value}
                    variant={{ base: "ghost", _selected: "outline" }}
                    isActive={pageNum.value === page}
                    onClick={() => setPage(pageNum.value)}
                  >
                    {pageNum.value}
                  </IconButton>
                )}
              />
              <Pagination.NextTrigger asChild>
                <IconButton
                  aria-label="Next page"
                  isDisabled={page >= totalPages}
                >
                  <LuChevronRight />
                </IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
        </Box>

        <Box bg="white" p={4} borderRadius="md" boxShadow="md">
          <Heading size="lg" mb={4}>Custom Comparison</Heading>
          <HStack spacing={4} mb={4}>
            {renderSelect("X-Axis", selectedX, setSelectedX)}
            {renderSelect("Y-Axis", selectedY, setSelectedY)}
          </HStack>
          <Heading size="md" mb={4}>Parameter Correlation</Heading>
          <ResponsiveContainer width="100%" height={400}>
            
            <ScatterChart
              key={`scatter-${chartKey}`}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                name={paramCollection.items.find(o => o.value === selectedX)?.label}
                type="number"
              />
              <YAxis
                dataKey="y"
                name={paramCollection.items.find(o => o.value === selectedY)?.label}
                type="number"
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                data={chartData}
                fill="#3182CE"
                name="Trials"
              />
            </ScatterChart>
            
            

          </ResponsiveContainer>
          <Heading size="md" mb={4}>Parameter Sensitivity Heatmap</Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Size indicates average distance for each bin or size of z
          </Text>
          <ResponsiveContainer width="100%" height={400}>
            
            <ScatterChart>
              <XAxis dataKey="x" name={paramCollection.items.find(o => o.value === selectedX)?.label} type="number" />
              <YAxis dataKey="y" name={paramCollection.items.find(o => o.value === selectedY)?.label} type="number" />
              <ZAxis dataKey="z" range={[0, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                data={heatmapData}
                fill="#3182CE"
                shape="circle"
                name="Avg Distance"
                // Use color scale for z value
                // You can use a custom function for color if you want
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>

        <Box bg="white" p={4} borderRadius="md" boxShadow="md">
          <Heading size="md" mb={4}>Actual vs Theoretical Distance</Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Comparison of actual projectile distance with ideal (no air
            resistance) calculation
          </Text>
          <ResponsiveContainer width="100%" height={400}>
            
            <LineChart
              key={`line-${chartKey}`}
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                tick={{ fontSize: 12 }}
                textAnchor="end"
              />
              <YAxis
                label={{
                  value: "Distance (m)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: 20 }}
              />
              <Line
                type="monotone"
                dataKey="distance"
                stroke="#3182CE"
                name="Actual Distance"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="theoretical"
                stroke="#38A169"
                name="Theoretical Distance"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

       

        <Drawer.Root
          open={drawerOpen}
          onOpenChange={(e) => setDrawerOpen(e.open)}
          size="full"
        >
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content>
                <Drawer.Header>
                  <Drawer.Title>Trial Replay</Drawer.Title>
                  <Drawer.CloseTrigger asChild>
                    <CloseButton
                      size="lg"
                      position="absolute"
                      top={4}
                      right={4}
                    />
                  </Drawer.CloseTrigger>
                </Drawer.Header>
                <Drawer.Body p={0}>
                  {selectedTrial && (
                    <Box w="100%" h="100vh" position="relative">
                      <Canvas camera={{ position: [30, 30, 30], fov: 45 }}>
                        {/* Lighting */}
                        <ambientLight intensity={0.5} />
                        <directionalLight
                          position={[10, 10, 10]}
                          intensity={1}
                        />

                        {/* Static Scene Elements */}
                        <mesh
                          rotation={[-Math.PI / 2, 0, 0]}
                          position={[0, -1, 0]}
                        >
                          <planeGeometry args={[1000, 1000]} />
                          <meshStandardMaterial color="#ddd" />
                        </mesh>
                        <DistanceMarkers />

                        {/* Replayed Projectile */}
                        <mesh
                          position={[
                            selectedTrial.results.trajectory[currentFrame]?.x ||
                              0,
                            selectedTrial.results.trajectory[currentFrame]?.y ||
                              0,
                            0,
                          ]}
                        >
                          <boxGeometry args={[1, 1, 1]} />
                          <meshStandardMaterial color="#2f74c0" />
                        </mesh>

                        {/* Camera Controls */}
                        <CameraController
                          boxRef={{
                            current: {
                              translation: () => ({
                                x:
                                  selectedTrial.results.trajectory[currentFrame]
                                    ?.x || 0,
                                y:
                                  selectedTrial.results.trajectory[currentFrame]
                                    ?.y || 0,
                                z: 0,
                              }),
                            },
                          }}
                        />
                      </Canvas>

                      {/* Replay Controls */}
                      <Box position="absolute" top={4} left={4} zIndex={1000}>
                        <HStack spacing={4}>
                          <Button onClick={() => setPlaying((p) => !p)}>
                            {playing ? "Pause" : "Play"}
                          </Button>
                          <Button onClick={() => setCurrentFrame(0)}>
                            Reset
                          </Button>
                        </HStack>
                        
                      </Box>
                    </Box>
                  )}
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      </VStack>
    </Container>
  );
}
