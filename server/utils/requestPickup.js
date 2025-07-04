import axios from "axios";

// Replace with the actual logistics API base URL
const LOGISTICS_API_BASE = "http://<logistics-api-url>";

/**
 * Request a pickup from the logistics company.
 * @param {string} originCompanyId - Your company ID
 * @param {string} destinationCompanyId - Supplier or destination company ID
 * @param {string} originalExternalOrderId - The order ID from your supplier order
 * @param {Array} items - Array of items to be picked up [{ name, quantity, measurementType }]
 */
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
    return res.data;
  } catch (err) {
    console.error("Error creating pickup request:", err.message);
    return null;
  }
}
