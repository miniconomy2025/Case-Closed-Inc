import axios from 'axios';
import mtlsAgent from './mtlsAgent.js';

const rawMaterialsApi = axios.create({
  baseURL: process.env.RAW_MATERIALS_API_URL || "http://localhost:3002/",
  timeout: 5000,
  httpsAgent: mtlsAgent || undefined,
});

const ThohClient = {
  async getRawMaterials() {
    const res = await rawMaterialsApi.get('/raw-materials');
    return res.data;
  },

  async getMachines() {
    const res = await rawMaterialsApi.get('/machines');
    return res.data;
  },

  async createRawMaterialsOrder(materialName, weightQuantity) {
    const requestData = {
      materialName: materialName,
      weightQuantity: weightQuantity,
    };

    const res = await rawMaterialsApi.post('/raw-materials', requestData);
    return res.data;
  },

  async createMachineOrder(quantity) {
    const requestData = {
      machineName: "case_machine",
      quantity: quantity,
    };

    const res = await rawMaterialsApi.post('/machines', requestData);
    return res.data;
  },

  async payForOrder(orderId) {
    const requestData = {
      orderId,
    };

    const res = await rawMaterialsApi.post('/orders/payments', requestData);
    return res.data;
  },

  async getOrder(orderId) {
    const res = await rawMaterialsApi.get(`/orders/${orderId}`);
    return res.data;
  },

  async getOrdersForCompany() {
    const res = await rawMaterialsApi.get('/orders/company/case-supplier');
    return res.data;
  },
};

export default ThohClient;
