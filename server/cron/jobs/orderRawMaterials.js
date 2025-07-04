// Cron job to check if aluminum stock is low and trigger a purchase action (log for now)
import { getStockByName } from "../../daos/stockDao";
import { orderAluminiumIfAvailable } from "../../utils/orderAluminium";
// Hardcoded threshold for aluminum (can be moved to DB/config later)
const ALUMINIUM_THRESHOLD = 100;
const ALUMINIUM_ORDER_QUANTITY = 200; // How much to order when low

async function checkAluminiumStock() {
  try {
    const aluminium = await getStockByName("aluminium");
    if (!aluminium) {
      console.error("Aluminium stock not found!");
      return;
    }
    if (aluminium.total_units < ALUMINIUM_THRESHOLD) {
      console.log(
        `Aluminium stock is low: ${aluminium.total_units} units. Triggering purchase order!`
      );
      await orderAluminiumIfAvailable(ALUMINIUM_ORDER_QUANTITY);
    } else {
      console.log(
        `Aluminium stock is sufficient: ${aluminium.total_units} units.`
      );
    }
  } catch (err) {
    console.error("Error checking aluminium stock:", err);
  }
}

export default checkAluminiumStock;
