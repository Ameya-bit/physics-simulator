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
} from "@chakra-ui/react";

import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CustomTooltip } from "./CustomToolTip";
import { useState } from "react";
import { Select } from "@chakra-ui/react";
import { HStack } from "@chakra-ui/react";

function getNestedValue(obj, path) {
  return path.split(".").reduce((o, p) => (o ? o[p] : undefined), obj);
}

function calculateTheoreticalDistance(params) {
  const { launchVelocity, angle, gravity } = params;
  const angleRad = angle * (Math.PI / 180);
  return (launchVelocity ** 2 * Math.sin(2 * angleRad)) / gravity;
}

function downloadCSV(trials) {
  const header = "Velocity,Angle,Spin,Distance,Max Height,Air Time\n";
  const rows = trials.map((trial) =>
    [
      trial.params.launchVelocity,
      trial.params.angle,
      trial.params.spin,
      trial.results.distance,
      trial.results.maxHeight,
      trial.results.airTime,
    ].join(",")
  );
  const csv = header + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "projectile_trials.csv";
  link.click();
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

export default function DataPage({ trials }) {
  const [selectedX, setSelectedX] = useState("params.angle");
  const [selectedY, setSelectedY] = useState("results.distance");

  const chartData = trials.map((trial, i) => ({
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
  }));
  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Projectile Trials Data</Heading>
        <Button
          colorScheme="blue"
          alignSelf="flex-end"
          onClick={() => downloadCSV(trials)}
        >
          Download CSV
        </Button>
        <Box overflowX="auto" w="100%">
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
              {trials.map((trial, i) => (
                <Table.Row key={i}>
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
        </Box>

        

        {/* Scatter Chart */}
        <Box
          width="100%"
          height="400px"
          bg="white"
          p={4}
          borderRadius="md"
          boxShadow="md"
        >
          <Heading size="md" mb={4}>
            Custom Comparison Chart
          </Heading>
          <HStack spacing={6}>
            {/* X-Axis Parameter */}
            <Box flex={1}>
              <Select.Root
                collection={paramCollection}
                value={[selectedX]}
                onValueChange={({ value }) => setSelectedX(value[0])}
                size="sm"
                width="100%"
              >
                <Select.HiddenSelect />
                <Select.Label>X-Axis Parameter</Select.Label>
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Select X-Axis" />
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
            </Box>
            {/* Y-Axis Parameter */}
            <Box flex={1}>
              <Select.Root
                collection={paramCollection}
                value={[selectedY]}
                onValueChange={({ value }) => setSelectedY(value[0])}
                size="sm"
                width="100%"
              >
                <Select.HiddenSelect />
                <Select.Label>Y-Axis Parameter</Select.Label>
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Select Y-Axis" />
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
            </Box>
          </HStack>
          <ResponsiveContainer width="100%" height="80%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                name={paramCollection.find((o) => o.value === selectedX)?.label}
                type="number"
              />
              <YAxis
                dataKey="y"
                name={paramCollection.find((o) => o.value === selectedY)?.label}
                type="number"
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="Trials"
                data={chartData}
                fill="#3182CE"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>

        {/* Comparative Line Chart */}
        <Box
          width="100%"
          height="400px"
          bg="white"
          p={4}
          borderRadius="md"
          boxShadow="md"
        >
          <Heading size="md" mb={4}>
            Actual vs. Theoretical Distance
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Comparison of actual projectile distance with ideal (no air
            resistance) calculation
          </Text>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                label={{
                  value: "Distance (m)",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 14,
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
                name="Actual Distance"
                stroke="#3182CE"
                strokeWidth={2}
                dot={{ fill: "#3182CE", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="theoretical"
                name="Theoretical Distance"
                stroke="#38A169"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#38A169", strokeWidth: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </VStack>
    </Container>
  );
}
