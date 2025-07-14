const RecyclerClient = {
  async getAvailableMaterials() {
    return [
      { id: 1, name: "aluminium", available_quantity_in_kg: 2, price: 5.0 },
      { id: 2, name: "plastic", available_quantity_in_kg: 3, price: 2.5 },
    ];
  },

  async placeOrder(item) {
    return {
      orderNumber: "mock-recycler-order-uuid-1234",
      status: "created",
      materialId: item.materialId,
      quantity: item.quantity,
    };
  },
};

export default RecyclerClient;
