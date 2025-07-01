import Typography from "@mui/material/Typography";
import GenericCard from "../layouts/card";
import Grid from "@mui/material/Grid";

export default function DashboardPage() {
  const cardTitles = ["Bank Balance", "Inventory", "Orders"];

  return (
    <>
      <Typography>Welcome to Case-Closed-Inc!</Typography>
      <Grid
        container
        spacing={{ xs: 2, md: 2 }}
        columns={{ xs: 1, sm: 2, md: 12 }}
      >
        {cardTitles.map((title: string, index: number) => (
          <Grid key={index} size={{ xs: 12, sm: 4, md: 4 }}>
            <GenericCard cardTitle={title} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
