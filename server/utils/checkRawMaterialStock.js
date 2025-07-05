// Cron job to check if aluminum and plastic stock is low and trigger a purchase action (log for now)

import { getStockByName } from "../daos/stockDao.js";
import { orderAluminiumIfAvailable } from "./orderAluminium.js";
import logger from "./logger.js";
// Hardcoded thresholds (can be moved to DB/config later)
const ALUMINIUM_THRESHOLD = 100;
const ALUMINIUM_ORDER_QUANTITY = 200; // How much to order when low
const PLASTIC_THRESHOLD = 100;
const PLASTIC_ORDER_QUANTITY = 200;

async function aluminiumStockIsLow() {
  try {
    const aluminium = await getStockByName("aluminium");
    if (!aluminium) {
      logger.error("Aluminium stock not found!");
      return false;
    }
    if (aluminium.total_units < ALUMINIUM_THRESHOLD) {
      logger.info(
        `Aluminium stock is low: ${aluminium.total_units} units. Triggering purchase order!`
      );
      // await orderAluminiumIfAvailable(ALUMINIUM_ORDER_QUANTITY);
      return true;
    } else {
      logger.info(
        `Aluminium stock is sufficient: ${aluminium.total_units} units.`
      );
      return false;
    }
  } catch (err) {
    logger.error("Error checking aluminium stock:", err);
    return false;
  }
}

async function plasticStockIsLow() {
  try {
    const plastic = await getStockByName("plastic");
    if (!plastic) {
      logger.error("Plastic stock not found!");
      return false;
    }
    if (plastic.total_units < PLASTIC_THRESHOLD) {
      logger.info(
        `Plastic stock is low: ${plastic.total_units} units. Triggering purchase order!`
      );
      // TODO: Add plastic order logic here
      // await orderPlasticIfAvailable(PLASTIC_ORDER_QUANTITY);
      return true;
    } else {
      logger.info(`Plastic stock is sufficient: ${plastic.total_units} units.`);
      return false;
    }
  } catch (err) {
    logger.error("Error checking plastic stock:", err);
    return false;
  }
}

export { aluminiumStockIsLow, plasticStockIsLow };
