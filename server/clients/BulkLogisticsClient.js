import axios from 'axios';

const logisticsApi = axios.create({
  baseURL: process.env.BULK_LOGISTICS_API_URL,
  timeout: 5000,
});

const BulkLogisticsClient = {
  async createPickupRequest(originalExternalOrderId, originCompanyId, items) {
    const requestData = {
      originalExternalOrderId,
      originCompanyId,
      destinationCompanyId: 'case-supplier',
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