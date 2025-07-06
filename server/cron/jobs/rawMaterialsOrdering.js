import logger from "../../utils/logger.js";
import {
  aluminiumStockIsLow,
  plasticStockIsLow,
} from "../../utils/checkRawMaterialStock.js";
import { placeOrderWithSupplier } from "../../adapers/orderRawMaterialsAdapter.js";

const ALUMINIUM_ORDER_QUANTITY = 50;
const PLASTIC_ORDER_QUANTITY = 50;

async function runRawMaterialsOrdering() {
  try {
    const aluminiumLow = await aluminiumStockIsLow();
    const plasticLow = await plasticStockIsLow();

    if (!aluminiumLow && !plasticLow) {
      logger.info("All raw material stocks are sufficient. No orders needed.");
      return;
    }

    // Build the items array for the order
    const items = [];
    if (aluminiumLow) {
      items.push({
        name: "aluminium",
        quantity: ALUMINIUM_ORDER_QUANTITY,
        measurementType: "kg",
      });
    }
    if (plasticLow) {
      items.push({
        name: "plastic",
        quantity: PLASTIC_ORDER_QUANTITY,
        measurementType: "kg",
      });
    }

    logger.info(
      `Ordering raw materials: ${items
        .map((i) => `${i.quantity} ${i.name}`)
        .join(", ")}`
    );
    await placeOrderWithSupplier(items);
  } catch (err) {
    logger.error("Error in raw materials ordering cron job:", err);
  }
}

export default runRawMaterialsOrdering;
