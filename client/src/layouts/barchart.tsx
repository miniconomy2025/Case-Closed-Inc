import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Box, Typography } from "@mui/material";

type StockLevelsBarChartProps = {
  stock: {
    plastic: number;
    aluminium: number;
    machine: number;
  };
};

export default function StockLevelsBarChart({
  stock,
}: StockLevelsBarChartProps) {
  const data = [
    { name: "Aluminium", quantity: stock.aluminium },
    { name: "Plastic", quantity: stock.plastic },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 600,
        mx: "auto",
        my: 4,
        textAlign: "center",
      }}
    >
      <Typography
        sx={{ color: "#304074", mt: 1, fontWeight: 700 }}
        variant="h5"
      >
        Raw Materials Stock
      </Typography>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="quantity"
            name="Quantity"
            fill="#2A9D8F"
            barSize={50}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
