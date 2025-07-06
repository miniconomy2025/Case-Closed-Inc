import BankClientReal from './BankClient.js';
import MockBankClient from './MockBankClient.js';

import BulkLogisticsClient from './BulkLogisticsClient.js';
import MockBulkLogisticsClient from './MockBulkLogisticsClient.js';

const mockBank = true;
const BankClient = mockBank ? MockBankClient : BankClientReal;

const mockLogistics = true;
const BulkLogistics = mockLogistics ? MockBulkLogisticsClient : BulkLogisticsClient;

export { BankClient, BulkLogistics };
