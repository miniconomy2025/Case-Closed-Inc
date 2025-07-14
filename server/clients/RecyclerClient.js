import axios from "axios";

const recyclerApi = axios.create({
  baseURL: process.env.RECYCLER_API_URL || "http://localhost:3000",
  timeout: 5000,
});

const RecyclerClient = {
  async getAvailableMaterials() {
    // const res = await recyclerApi.get('/materials');

    return [
      { id: 1, name: "aluminium", available_quantity_in_kg: 2, price: 5.0 },
      { id: 2, name: "plastic", available_quantity_in_kg: 3, price: 2.5 },
    ];
  },

  async placeOrder(item) {
    // const res = await recyclerApi.post('/orders', {
    //   supplierId: 1, // or from config
    //   items: [{ materialId: item.materialId, quantity: item.quantity }],
    // });

    return {
      orderNumber: "mock-recycler-order-uuid-1234",
      status: "created",
      materialId: item.materialId,
      quantity: item.quantity,
    };
  },
};

export default RecyclerClient;
