import Typography from "@mui/material/Typography";
import GenericCard from "../layouts/card";
import Grid from "@mui/material/Grid";
import { Box } from "@mui/material";
import { dashboardCardSchema } from "./constants";

export default function DashboardPage() {

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
