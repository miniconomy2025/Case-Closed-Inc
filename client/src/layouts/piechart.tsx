import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Box, Typography } from "@mui/material";

const COLORS = ["#2A9D8F", "#264653"]; // Orange for Reserved, Teal for Available

type CasesPieChartProps = {
  reserved: number;
  available: number;
};

export default function ReservedAvailablePieChart({
  reserved,
  available,
}: CasesPieChartProps) {
  const data = [
    { name: "Reserved", value: reserved },
    { name: "Available", value: available },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 400,
        mx: "auto",
        my: 4,
        textAlign: "center",
      }}
    >
      <Typography
        sx={{ color: "#304074", mt: 1, fontWeight: 700 }}
        variant="h5"
      >
        Cases: Reserved vs Available
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            isAnimationActive={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}
