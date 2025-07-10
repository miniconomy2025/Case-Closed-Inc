import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type GenericCardProps = {
  cardTitle: string;
  cardColour: string;
  currency?: string;
  cardData: any;
};

export default function GenericCard(props: GenericCardProps) {
  const { cardTitle, cardColour, cardData, currency } = props;
  const numberFormatter = new Intl.NumberFormat("en-ZA", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <Card
      sx={{
        bgcolor: cardColour,
        borderRadius: 3,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        minHeight: 150,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        px: 2,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Typography sx={{ color: "#898c95", fontWeight: 700, mb: 2.5 }}>
          {cardTitle}
        </Typography>
        <Box
          sx={{
            textAlign: "center",
            fontSize: "1.75rem",
            fontWeight: 600,
            color: "text.primary",
          }}
        >
          {typeof cardData === "number"
            ? currency ? `Ð ${numberFormatter.format(cardData)}` : numberFormatter.format(cardData)
            : (cardData ?? "—")}
        </Box>
      </CardContent>
    </Card>
  );
}
