import axios from "axios";
import logger from "./logger.js";

// Replace with your actual API base URL
const RECYCLER_API_BASE = "http://localhost:3000"; // Example
const BANK_API_BASE = "http://localhost:8080"; // Example
const LOGISTICS_API_BASE = "http://localhost:4000"; // Example
const SUPPLIER_ID = 1; // Example supplier ID
const OUR_COMPANY_ID = 2; // Example: our company ID
const SUPPLIER_ACCOUNT_NUMBER = "9876543210"; // Example account number
const TO_BANK_NAME = "commercial-bank"; // Example bank name
const LOGISTICS_ACCOUNT_NUMBER = "1122334455"; // Example logistics bank account
const LOGISTICS_PAYMENT_AMOUNT = 100; // Change this as needed

/**
 * Orders raw materials from the recycler, pays for them, requests pickup, and pays logistics.
 * @param {Array} items - Array of { name, quantity, measurementType }
 */
export async function orderRawMaterials(items) {
  try {
    // 1. Get available materials from the recycler API
    // const res = await axios.get(`${RECYCLER_API_BASE}/materials`);
    // const availableMaterials = res.data.materials;

    // MOCKED RESPONSE (replace with real API call above)
    const availableMaterials = [
      { id: 1, name: "aluminium", available_quantity_in_kg: 2, price: 5.0 },
      { id: 2, name: "plastic", available_quantity_in_kg: 3, price: 2.5 },
    ];

    // 2. Prepare the order items, only order up to what is available
    const orderItems = [];
    let totalAmount = 0;
    items.forEach((item) => {
      const found = availableMaterials.find(
        (mat) => mat.name.toLowerCase() === item.name.toLowerCase()
      );
      if (found) {
        const orderQty = Math.min(
          item.quantity,
          found.available_quantity_in_kg
        );
        if (orderQty > 0) {
          orderItems.push({
            materialId: found.id,
            quantity: orderQty,
            name: found.name,
            measurementType: item.measurementType,
          });
          totalAmount += orderQty * found.price;
          logger.info(
            `Ordering ${orderQty} ${item.measurementType} of ${item.name} (requested: ${item.quantity}, available: ${found.available_quantity_in_kg}, price: ${found.price}/kg)`
          );
        } else {
          logger.info(
            `No available stock to order for ${item.name} (requested: ${item.quantity}, available: ${found.available_quantity_in_kg})`
          );
        }
      } else {
        logger.error(`Material ${item.name} not available from supplier.`);
      }
    });

    if (orderItems.length === 0) {
      logger.info("No raw materials to order based on supplier availability.");
      return;
    }

    // 3. Here you would send the actual order request to the supplier API
    // const orderRes = await axios.post(`${RECYCLER_API_BASE}/orders`, {
    //   supplierId: SUPPLIER_ID,
    //   items: orderItems.map(({ materialId, quantity }) => ({ materialId, quantity })),
    // });

    // MOCKED ORDER RESPONSE
    const mockOrderResponse = {
      orderNumber: "mock-order-uuid-1234",
      status: "created",
      // items: orderItems,
    };
    logger.info("Order placed (mock):", mockOrderResponse);

    // 4. Pay for the order via the bank API
    const transactionPayload = {
      to_account_number: SUPPLIER_ACCOUNT_NUMBER,
      to_bank_name: TO_BANK_NAME,
      amount: totalAmount,
      description: `Payment for raw materials order #${mockOrderResponse.orderNumber}`,
    };

    // const txRes = await axios.post(`${BANK_API_BASE}/transaction`, transactionPayload);

    // MOCKED TRANSACTION RESPONSE
    const mockTransactionResponse = {
      success: true,
      transaction_number: "mock-tx-uuid-5678",
      status: "completed",
      amount: totalAmount,
      // description: transactionPayload.description,
    };
    logger.info("Transaction completed (mock):", mockTransactionResponse);

    // 5. If transaction is successful, request pickup from logistics
    if (mockTransactionResponse.success) {
      const pickupPayload = {
        originCompanyId: SUPPLIER_ID,
        destinationCompanyID: OUR_COMPANY_ID,
        originalExternalOrderId: mockOrderResponse.orderNumber,
        items: orderItems.map(({ name, quantity, measurementType }) => ({
          name,
          quantity,
          measurementType,
        })),
      };

      // const pickupRes = await axios.post(`${LOGISTICS_API_BASE}/pickup-request`, pickupPayload);

      // MOCKED PICKUP RESPONSE
      const mockPickupResponse = {
        pickupRequestId: "mock-pickup-uuid-9999",
        status: "pickup_requested",
        ...pickupPayload,
      };
      logger.info("Pickup request placed (mock):", mockPickupResponse);

      // 6. If pickup request is successful, pay logistics company
      if (mockPickupResponse.status === "pickup_requested") {
        const logisticsTransactionPayload = {
          to_account_number: LOGISTICS_ACCOUNT_NUMBER,
          to_bank_name: TO_BANK_NAME,
          amount: LOGISTICS_PAYMENT_AMOUNT,
          description: `Logistics payment for pickup ref #${mockPickupResponse.pickupRequestId}`,
        };

        // const logisticsTxRes = await axios.post(`${BANK_API_BASE}/transaction`, logisticsTransactionPayload);

        // MOCKED LOGISTICS TRANSACTION RESPONSE
        const mockLogisticsTransactionResponse = {
          success: true,
          transaction_number: "mock-logistics-tx-uuid-8888",
          status: "completed",
          amount: LOGISTICS_PAYMENT_AMOUNT,
          description: logisticsTransactionPayload.description,
        };
        logger.info(
          "Logistics transaction completed (mock):",
          mockLogisticsTransactionResponse
        );
      }
    }
  } catch (err) {
    logger.error("Error ordering raw materials:", err.message);
  }
}
