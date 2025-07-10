import Typography from "@mui/material/Typography";
import GenericCard from "../layouts/card";
import Grid from "@mui/material/Grid";
import { Box } from "@mui/material";
import { dashboardCardSchema } from "./constants";
import api from "../utils/httpClient";
import { useEffect, useState } from "react";
import ReservedAvailablePieChart from "../layouts/piechart";
import StockLevelsBarChart from "../layouts/barchart";
import CircularProgress from "@mui/material/CircularProgress";
import { useQuery } from "@tanstack/react-query";


  async function fetchDashboard() {
      const [bankBalance, shipments, stock, cases, sales, simulationTime] = await Promise.all(
        [
          api.get("/bank/balance"),
          api.get("/logistics/shipments"),
          api.get("/stock"),
          api.get("/cases"),
          api.get("/sales"),
          api.get('/simulation')
        ]
      );
      return { bankBalance, shipments, stock, cases, sales, simulationTime };
  }

  const useDashboardQuery = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 5000
  });

export default function DashboardPage() {

  const { data: dashboardState, isLoading: loading, error } = useDashboardQuery();

  function getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  }

  return (
    <>
      <Typography sx={{ color: "#304074", mt: 1, fontWeight: 800 }}>
        Current Time: {dashboardState?.simulationTime.date}
      </Typography>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
          }}
        >
          <CircularProgress size={60} thickness={5} />
        </Box>
      ) : (
        <Grid
          container
          spacing={{ xs: 2, md: 3 }}
          columns={{ xs: 1, sm: 2, md: 12 }}
        >
          {dashboardCardSchema.map((card: any, index: number) => (
            <>
              <Grid
                key={index}
                size={{ xs: card.xs, sm: card.sm, md: card.md }}
                sx={{ mt: 2 }}
              >
                <Box
                  sx={{
                    bgcolor: "#f0f0fa",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Typography
                      sx={{ color: "#304074", mt: 1, fontWeight: 700 }}
                      variant="h5"
                    >
                      {card.title}
                    </Typography>
                  </div>
                  <Grid
                    container
                    spacing={{ xs: 2, md: 1 }}
                    columns={{ xs: 1, sm: 2, md: 12 }}
                  >
                    {card.children?.map((child: any) => (
                      <Grid
                        key={index}
                        size={{ xs: child.xs, sm: child.sm, md: child.md }}
                      >
                        <Box sx={{ pl: 1, pr: 1, mb: 1, mt: 1 }}>
                          <GenericCard
                            cardTitle={child.title}
                            cardColour={child.colour}
                            currency={child.currency}
                            cardData={getNestedValue(dashboardState, child.key)}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Grid>
            </>
          ))}
          <Grid key={20} size={{ xs: 12, sm: 6, md: 6 }} sx={{ mt: 2 }}>
            {dashboardState?.cases && (
              <Box
                sx={{
                  bgcolor: "#ffff",
                  borderRadius: "10px",
                }}
              >
                <ReservedAvailablePieChart
                  reserved={Number(dashboardState?.cases?.reserved_units ?? 0)}
                  available={Number(
                    dashboardState?.cases?.available_units ?? 0
                  )}
                />
              </Box>
            )}
          </Grid>

          <Grid key={20} size={{ xs: 12, sm: 6, md: 6 }} sx={{ mt: 2 }}>
            <Box
              sx={{
                bgcolor: "#ffff",
                borderRadius: "10px",
              }}
            >
              {dashboardState?.stock && (
                <StockLevelsBarChart stock={dashboardState.stock} />
              )}
            </Box>
          </Grid>
        </Grid>
      )}
    </>
  );
}
