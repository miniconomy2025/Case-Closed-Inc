import axios from 'axios';
import mtlsAgent from './mtlsAgent.js';

const logisticsApi = axios.create({
  baseURL: process.env.BULK_LOGISTICS_API_URL || "http://localhost:3001/",
  timeout: 5000,
  httpsAgent: mtlsAgent || undefined,
});

const BulkLogisticsClient = {
  async createPickupRequest(originalExternalOrderId, originCompany, items) {
    const requestData = {
      originalExternalOrderId,
      originCompany,
      destinationCompany: 'case-supplier',
      items,
    };

    const res = await logisticsApi.post('/api/pickup-request', requestData);
    return res.data;
  },

  async getPickupRequest(pickupRequestId) {
    const res = await logisticsApi.get(`/api/pickup-request/${pickupRequestId}`);
    return res.data;
  },

  async getPickupRequestsForCompany() {
    const res = await logisticsApi.get(`/api/pickup-request/company/case-supplier`);
    return res.data;
  },
};

export default BulkLogisticsClient;