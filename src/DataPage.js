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

import { Pagination, ButtonGroup, IconButton } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

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
  const rows = trials.map((trial) => [
    trial.params.launchVelocity || 0,
    trial.params.angle || 0,
    trial.params.spin || 0,
    (trial.results?.distance ?? 0).toFixed(2),
    (trial.results?.maxHeight ?? 0).toFixed(2),
    (trial.results?.airTime ?? 0).toFixed(2),
  ]);
  
  const csv = header + rows.map(row => row.join(",")).join("\n");
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

export default function DataPage({
  trials,
  runBatchSimulations,
  isRunningBatch,
  batchProgress,
  batchSize,
}) {
  const [selectedX, setSelectedX] = useState("params.angle");
  const [selectedY, setSelectedY] = useState("results.distance");
  const ROWS_PER_PAGE = 10;
  const [page, setPage] = useState(1); // Chakra Pagination is 1-based
  const totalPages = Math.ceil(trials.length / ROWS_PER_PAGE);
  console.log(trials);

  const paginatedTrials = trials.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

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
        <HStack spacing={4} mb={4}>
          <Button
            colorScheme="blue"
            alignSelf="flex-end"
            onClick={() => downloadCSV(trials)}
          >
            Download CSV
          </Button>
          <Button
            colorScheme="purple"
            alignSelf="flex-end"
            onClick={runBatchSimulations}
            isLoading={isRunningBatch}
            loadingText={`Running ${batchSize} trials... (${batchProgress.toFixed(
              1
            )}%)`}
          >
            Run 10 Simulations
          </Button>
        </HStack>

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
              {paginatedTrials.map((trial, i) => (
                <Table.Row key={i + (page - 1) * ROWS_PER_PAGE}>
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
            <ButtonGroup variant="ghost" size="sm" wrap="wrap">
              <Pagination.PrevTrigger asChild>
                <IconButton aria-label="Previous page">
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
                <IconButton aria-label="Next page">
                  <LuChevronRight />
                </IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
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
