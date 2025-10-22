import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const recyclerApi = axios.create({
  baseURL: process.env.RECYCLER_API_URL,
  timeout: 5000,
  headers: {
    'Client-Id': 'case-supplier',
  },
  httpsAgent
});

const RecyclerClient = {
  async getRawMaterials() {
    const res = await recyclerApi.get('/materials');
    // map to consistent format with ThohClient
    return res.data.map(m => ({
      name: m.name.toLowerCase(),
      quantityAvailable: m.availableQuantityInKg,
      pricePerKg: m.pricePerKg
    }));
  },

  async createRawMaterialsOrder(companyName, orderItems) {
    const requestData = {
      companyName,
      orderItems
    };

    const res = await recyclerApi.post('/orders', requestData);
    return res.data.data;
  },

  async getOrder(orderNumber) {
    const res = await recyclerApi.get(`/orders/${orderNumber}`);
    return res.data.data;
  }
};

export default RecyclerClient;
