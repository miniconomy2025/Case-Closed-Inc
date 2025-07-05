import "dotenv/config";
import {
  aluminiumStockIsLow,
  plasticStockIsLow,
} from "../../utils/checkRawMaterialStock.js";

(async () => {
  console.log(await aluminiumStockIsLow());
  console.log(await plasticStockIsLow());
})();
