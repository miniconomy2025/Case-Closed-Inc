import axios from "axios";
import { payForOrder } from "./payForOrder.js";

// You may want to store these in config/env
const RECYCLER_API_BASE = "http://<recycler-api-url>"; // Replace with actual URL
const SUPPLIER_ID = 1; // Replace with your actual supplier/company ID
const LOGISTICS_API_BASE = "http://<logistics-api-url>"; // Replace with actual URL

export async function orderAluminiumIfAvailable(requiredQuantityKg) {
  try {
    // 1. Get available materials
    const materialsRes = await axios.get(`${RECYCLER_API_BASE}/materials`);
    const materials = materialsRes.data.materials;

    // 2. Find aluminium
    const aluminium = materials.find(
      (mat) => mat.name.toLowerCase() === "aluminium"
    );
    if (!aluminium) {
      console.log("Aluminium not available from supplier.");
      return null;
    }

    // 3. Check if enough is available
    if (aluminium.available_quantity_in_kg < requiredQuantityKg) {
      console.log(
        `Not enough aluminium available. Needed: ${requiredQuantityKg}, Available: ${aluminium.available_quantity_in_kg}`
      );
      return null;
    }

    // 4. Create order
    const orderRes = await axios.post(`${RECYCLER_API_BASE}/orders`, {
      supplierId: SUPPLIER_ID,
      items: [
        {
          materialId: aluminium.id,
          quantity: requiredQuantityKg,
        },
      ],
    });

    console.log("Order placed:", orderRes.data);

    if (
      orderRes.data &&
      orderRes.data.account_number &&
      orderRes.data.total_price
    ) {
      await payForOrder(
        orderRes.data.account_number,
        orderRes.data.total_price,
        `Payment for aluminium order #${orderRes.data.orderNumber}`,
        orderRes.data.orderNumber
      );

      const pickupRes = await requestPickup(
        SUPPLIER_ID,
        SUPPLIER_ID,
        orderRes.data.orderNumber,
        [
          {
            name: "aluminium",
            quantity: requiredQuantityKg,
            measurementType: "kg",
          },
        ]
      );

      if (
        pickupRes &&
        pickupRes.paymentRefNumber &&
        pickupRes.amount &&
        pickupRes.logisticsAccountNumber
      ) {
        await payForOrder(
          pickupRes.logisticsAccountNumber,
          pickupRes.amount,
          `Logistics payment for pickup ref #${pickupRes.paymentRefNumber}`
        );
      }
    }

    return orderRes.data;
  } catch (err) {
    console.error("Error ordering aluminium:", err.message);
    return null;
  }
}

export async function requestPickup(
  originCompanyId,
  destinationCompanyId,
  originalExternalOrderId,
  items
) {
  try {
    const res = await axios.post(`${LOGISTICS_API_BASE}/pickup-request`, {
      originCompanyId,
      destinationCompanyID: destinationCompanyId,
      originalExternalOrderId,
      items,
    });
    console.log("Pickup request created:", res.data);
    return res.data; // Should include paymentRefNumber, amount, logisticsAccountNumber
  } catch (err) {
    console.error("Error creating pickup request:", err.message);
    return null;
  }
}
