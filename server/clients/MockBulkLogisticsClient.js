let nextPickupRequestId = 1;
const mockPickupRequests = [];

const MockBulkLogisticsClient = {
  async createPickupRequest(originalExternalOrderId, originCompanyId, items) {
    const newRequest = {
      pickupRequestId: nextPickupRequestId++,
      cost: Math.round((Math.random() * 1000 + 100) * 100) / 100,
      paymentReferenceId: `payref-${Math.floor(Math.random() * 1000000)}`,
      bulkLogisticsBankAccountNumber: '1234567890',
      status: 'awaiting_payment',
      statusCheckUrl: `http://mock.bulklogistics/status/${nextPickupRequestId}`,
      originalExternalOrderId,
      originCompanyId,
      destinationCompanyId: 'case-supplier',
      items,
      requestDate: new Date().toISOString(),
    };

    mockPickupRequests.push(newRequest);

    return {
      pickupRequestId: newRequest.pickupRequestId,
      cost: newRequest.cost,
      paymentReferenceId: newRequest.paymentReferenceId,
      bulkLogisticsBankAccountNumber: newRequest.bulkLogisticsBankAccountNumber,
      status: newRequest.status,
      statusCheckUrl: newRequest.statusCheckUrl,
    };
  },

  async getPickupRequest(pickupRequestId) {
    const request = mockPickupRequests.find(r => r.pickupRequestId === Number(pickupRequestId));
    if (!request) {
      return null;
    }

    return {
      pickupRequestId: request.pickupRequestId,
      cost: request.cost,
      status: request.status,
      originCompanyName: request.originCompanyId,
      originalExternalOrderId: request.originalExternalOrderId,
      requestDate: request.requestDate,
      items: request.items,
    };
  },

  async getPickupRequestsForCompany() {
    return mockPickupRequests.map(request => ({
      pickupRequestId: request.pickupRequestId,
      cost: request.cost,
      status: request.status,
      originCompanyName: request.originCompanyId,
      originalExternalOrderId: request.originalExternalOrderId,
      requestDate: request.requestDate,
      items: request.items,
    }));
  },
};

export default MockBulkLogisticsClient;