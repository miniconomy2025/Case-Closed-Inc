import Typography from "@mui/material/Typography";
import GenericCard from "../layouts/card";
import Grid from "@mui/material/Grid";
import { Box } from "@mui/material";
import { dashboardCardSchema } from "./constants";
import api from "../utils/httpClient";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [dashboardState, setDashboardState] = useState({});
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [bankBalance, bankTransactions, shipments, stock, cases, sales] = await Promise.all([
          api.get("/bank/balance"),
          api.get("/bank/transactions"),
          api.get("/logistics/shipments"),
          api.get("/stock"),
          api.get("/cases"),
          api.get("/sales"),
        ]);
        setDashboardState({ bankBalance, bankTransactions, shipments, stock, cases, sales });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  useEffect(() => {
    console.log(dashboardState)
    console.log(error)
    console.log(loading)
  }, [dashboardState, error, loading])

  return (
    <>
      <Typography>Current Time: </Typography>
      <Grid
        container
        spacing={{ xs: 2, md: 3 }}
        columns={{ xs: 1, sm: 2, md: 12 }}
      >
        {dashboardCardSchema.map((card: any, index: number) => (
          <>
          <Grid key={index} size={{ xs: card.xs, sm: card.sm, md: card.md }} sx={{mt:2}}>
              <Box  sx={{
                  boxSizing: 'border-box',
                  border: '3px solid #F8F9FA',
                  boxShadow: '0px 4px 20px rgba(238, 238, 238, 0.501967)',
                  borderRadius: '20px',
              }}>
                <Typography variant="h5">{card.title}</Typography>
                <Grid container spacing={{ xs: 2, md: 1 }} columns={{ xs: 1, sm: 2, md: 12 }}>
                    {card.children?.map((child: any) => (
                      <Grid key={index} size={{ xs: child.xs, sm: child.sm, md: child.md }}>
                        <Box sx={{pl: 1, pr:1, mb:1, mt: 1}}>
                          <GenericCard cardTitle={child.title} cardColour={child.colour} /> 
                        </Box>
                      </Grid>
                    ))}
                </Grid>
              </Box>
          </Grid>
          </>
        ))}
        
      </Grid>
    </>
  );
}
