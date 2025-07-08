import axios from "axios";
import logger from "../utils/logger.js";
import ThohClient from "./ThohClient.js";
import RecyclerClient from "./RecyclerClient.js";

const bankApi = axios.create({
  baseURL: process.env.BANK_API_URL || "http://localhost:8080",
  timeout: 5000,
});
const logisticsApi = axios.create({
  baseURL: process.env.LOGISTICS_API_URL || "http://localhost:4000",
  timeout: 5000,
});

const SUPPLIER_ID = 1;
const OUR_COMPANY_ID = 2;
const SUPPLIER_ACCOUNT_NUMBER = "9876543210";
const TO_BANK_NAME = "commercial-bank";
const LOGISTICS_ACCOUNT_NUMBER = "1122334455";
const LOGISTICS_PAYMENT_AMOUNT = 100;

const OrderRawMaterialsClient = {
  async getAvailableMaterials() {
    // const res = await recyclerApi.get('/materials');
    // return res.data.materials;

    return [
      { id: 1, name: "aluminium", available_quantity_in_kg: 2, price: 5.0 },
      { id: 2, name: "plastic", available_quantity_in_kg: 3, price: 2.5 },
    ];
  },

  async placeOrder(items) {
    // const res = await recyclerApi.post('/orders', {
    //   supplierId: SUPPLIER_ID,
    //   items: items.map(({ materialId, quantity }) => ({ materialId, quantity })),
    // });
    // return res.data;

    return {
      orderNumber: "mock-order-uuid-1234",
      status: "created",
    };
  },

  async paySupplier(totalAmount, orderNumber) {
    // const res = await bankApi.post('/transaction', {
    //   to_account_number: SUPPLIER_ACCOUNT_NUMBER,
    //   to_bank_name: TO_BANK_NAME,
    //   amount: totalAmount,
    //   description: `Payment for raw materials order #${orderNumber}`,
    // });
    // return res.data;

    return {
      success: true,
      transaction_number: "mock-tx-uuid-5678",
      status: "completed",
      amount: totalAmount,
    };
  },

  async requestPickup(orderNumber, orderItems) {
    const pickupPayload = {
      originCompanyId: SUPPLIER_ID,
      destinationCompanyID: OUR_COMPANY_ID,
      originalExternalOrderId: orderNumber,
      items: orderItems.map(({ name, quantity, measurementType }) => ({
        name,
        quantity,
        measurementType,
      })),
    };
    // const res = await logisticsApi.post('/pickup-request', pickupPayload);
    // return res.data;

    return {
      pickupRequestId: "mock-pickup-uuid-9999",
      status: "pickup_requested",
      ...pickupPayload,
    };
  },

  async payLogistics(pickupRequestId) {
    // const res = await bankApi.post('/transaction', {
    //   to_account_number: LOGISTICS_ACCOUNT_NUMBER,
    //   to_bank_name: TO_BANK_NAME,
    //   amount: LOGISTICS_PAYMENT_AMOUNT,
    //   description: `Logistics payment for pickup ref #${pickupRequestId}`,
    // });
    // return res.data;

    return {
      success: true,
      transaction_number: "mock-logistics-tx-uuid-8888",
      status: "completed",
      amount: LOGISTICS_PAYMENT_AMOUNT,
      description: `Logistics payment for pickup ref #${pickupRequestId}`,
    };
  },

  async processOrderFlow(items) {
    // 1. Get available materials from all suppliers
    const recyclerMaterials = await RecyclerClient.getAvailableMaterials();
    const thohMaterials = await ThohClient.getAvailableMaterials();
    const suppliers = [
      {
        name: "recycler",
        getMaterial: (name) =>
          recyclerMaterials.find(
            (m) => m.name.toLowerCase() === name.toLowerCase()
          ),
        placeOrder: async (item, found) =>
          RecyclerClient.placeOrder({
            materialId: found.id,
            quantity: item.quantity,
          }),
        priceProp: "price",
        quantityProp: "available_quantity_in_kg",
      },
      {
        name: "thoh",
        getMaterial: (name) =>
          thohMaterials.find(
            (m) => m.rawMaterialName.toLowerCase() === name.toLowerCase()
          ),
        placeOrder: async (item, found) =>
          ThohClient.placeOrder({
            name: found.rawMaterialName,
            quantity: item.quantity,
          }),
        priceProp: "pricePerKg",
        quantityProp: "quantityAvailable",
      },
    ];

    for (const item of items) {
      let bestSupplier = null;
      let bestPrice = Infinity;
      let bestSupplierMaterial = null;

      // Find the supplier with the lowest price and enough quantity
      for (const supplier of suppliers) {
        const found = supplier.getMaterial(item.name);
        if (
          found &&
          found[supplier.quantityProp] >= item.quantity &&
          found[supplier.priceProp] < bestPrice
        ) {
          bestSupplier = supplier;
          bestPrice = found[supplier.priceProp];
          bestSupplierMaterial = found;
        }
      }

      if (!bestSupplier) {
        logger.error(`No supplier found with enough ${item.name}`);
        continue;
      }

      logger.info(
        `Ordering ${item.quantity} ${item.measurementType} of ${item.name} from ${bestSupplier.name} at price ${bestPrice}`
      );
      const orderRes = await bestSupplier.placeOrder(
        item,
        bestSupplierMaterial
      );
      logger.info(`Order placed (mock) with ${bestSupplier.name}:`, orderRes);
    }
  },
};

export default OrderRawMaterialsClient;
