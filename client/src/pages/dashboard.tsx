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

export default function DashboardPage() {
  const [dashboardState, setDashboardState] = useState({});
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  function getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  }
  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [bankBalance, shipments, stock, cases, sales] = await Promise.all(
          [
            api.get("/bank/balance"),
            api.get("/logistics/shipments"),
            api.get("/stock"),
            api.get("/cases"),
            api.get("/sales"),
          ]
        );
        setDashboardState({ bankBalance, shipments, stock, cases, sales });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  useEffect(() => {
    console.log(dashboardState);
    console.log(error);
    console.log(loading);
  }, [dashboardState, error, loading]);

  return (
    <>
      <Typography sx={{ color: "#304074", mt: 1, fontWeight: 800 }}>
        Current Time:{" "}
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
